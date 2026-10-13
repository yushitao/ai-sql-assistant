import logging
from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.core.dependencies import (
    AdminUser,
    CurrentUser,
    DatabaseSession,
)
from app.models.sql_audit import SQLAudit
from app.models.user import User
from app.schemas.sql_audit import SQLAuditPageResponse, SQLAuditResponse
from app.schemas.sql_query import (
    SQLExecuteRequest,
    SQLExecuteResponse,
    SQLValidateRequest,
    SQLValidationResponse,
)
from app.services.sql_executor import execute_readonly_sql
from app.services.sql_validator import validate_readonly_sql

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/sql",
    tags=["SQL Queries"],
)


def save_audit(
    db: DatabaseSession,
    audit: SQLAudit,
) -> None:
    db.add(audit)
    db.commit()


@router.post(
    "/validate",
    response_model=SQLValidationResponse,
)
def validate_sql(
    request_data: SQLValidateRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> SQLValidationResponse:
    validation = validate_readonly_sql(request_data.sql)

    audit = SQLAudit(
        user_id=current_user.id,
        question=None,
        sql_text=request_data.sql,
        validation_passed=validation.valid,
        execution_success=False,
        row_count=0,
        error_message=(None if validation.valid else validation.message),
    )

    save_audit(db, audit)

    return SQLValidationResponse(
        valid=validation.valid,
        message=validation.message,
        statement_type=validation.statement_type,
        referenced_tables=validation.referenced_tables,
    )


@router.post(
    "/execute",
    response_model=SQLExecuteResponse,
)
def execute_sql(
    request_data: SQLExecuteRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> SQLExecuteResponse:
    validation = validate_readonly_sql(request_data.sql)

    if not validation.valid:
        audit = SQLAudit(
            user_id=current_user.id,
            question=None,
            sql_text=request_data.sql,
            validation_passed=False,
            execution_success=False,
            row_count=0,
            error_message=validation.message,
        )
        save_audit(db, audit)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=validation.message,
        )

    try:
        execution = execute_readonly_sql(
            db=db,
            sql=request_data.sql,
        )

        audit = SQLAudit(
            user_id=current_user.id,
            question=None,
            sql_text=request_data.sql,
            validation_passed=True,
            execution_success=True,
            row_count=execution.row_count,
            execution_time_ms=execution.execution_time_ms,
            error_message=None,
        )

        save_audit(db, audit)

        return SQLExecuteResponse(
            success=True,
            columns=execution.columns,
            rows=execution.rows,
            row_count=execution.row_count,
            execution_time_ms=execution.execution_time_ms,
            truncated=execution.truncated,
        )

    except SQLAlchemyError as exc:
        db.rollback()

        logger.exception(
            "SQL execution failed: user_id=%s, sql=%r",
            current_user.id,
            request_data.sql,
        )

        error_message = "SQL执行失败，请检查字段名和查询语法"

        audit = SQLAudit(
            user_id=current_user.id,
            question=None,
            sql_text=request_data.sql,
            validation_passed=True,
            execution_success=False,
            row_count=0,
            error_message=error_message,
        )

        save_audit(db, audit)

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message,
        ) from exc


@router.get(
    "/history",
    response_model=list[SQLAuditResponse],
)
def get_my_sql_history(
    db: DatabaseSession,
    current_user: CurrentUser,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list:
    statement = (
        select(SQLAudit)
        .where(SQLAudit.user_id == current_user.id)
        .order_by(SQLAudit.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.scalars(statement).all())


@router.get(
    "/admin/history",
    response_model=SQLAuditPageResponse,
)
def get_all_sql_history(
    db: DatabaseSession,
    admin_user: AdminUser,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    keyword: str | None = None,
    execution_success: bool | None = None,
) -> list:
    statement = select(SQLAudit, User).join(
        User,
        User.id == SQLAudit.user_id,
    )

    count_statement = select(SQLAudit)

    if keyword:
        statement = statement.where(SQLAudit.sql_text.ilike(f"%{keyword}%"))

        count_statement = (
            count_statement.where(
                SQLAudit.sql_text.ilike(
                    f"%{keyword}%"
                )
            )
        )

    if execution_success is not None:
        statement = statement.where(SQLAudit.execution_success == execution_success)

        count_statement = (
            count_statement.where(
                SQLAudit.execution_success
                == execution_success
            )
        )

    total = len(
        db.scalars(
            count_statement
        ).all()
    )

    statement = (
        statement.order_by(SQLAudit.created_at.desc()).limit(limit).offset(offset)
    )

    rows = db.execute(statement).all()

    items = [
        SQLAuditResponse(
            id=audit.id,
            user_id=audit.user_id,
            username=user.username,
            question=audit.question,
            sql_text=audit.sql_text,
            validation_passed=audit.validation_passed,
            execution_success=audit.execution_success,
            row_count=audit.row_count,
            execution_time_ms=audit.execution_time_ms,
            error_message=audit.error_message,
            created_at=audit.created_at,
        )
        for audit, user in rows
    ]

    return SQLAuditPageResponse(
        items = items,
        total = total,
        limit = limit,
        offset = offset,
    )


@router.get(
    "/admin/export",
)
def export_sql_history(
    db: DatabaseSession,
    admin_user: AdminUser,
    keyword: str | None = None,
    execution_success: bool | None = None,
):

    statement = select(SQLAudit, User).join(
        User,
        User.id == SQLAudit.user_id,
    )

    if keyword:
        statement = statement.where(SQLAudit.sql_text.ilike(f"%{keyword}%"))

    if execution_success is not None:
        statement = statement.where(SQLAudit.execution_success == execution_success)

    statement = (
        statement.order_by(SQLAudit.created_at.desc())
    )

    rows = db.execute(statement).all()

    workbook =Workbook()
    sheet = workbook.active
    sheet.title  = "SQL Audit"
    sheet.append(
        [
            "ID",
            "用户名",
            "问题",
            "SQL",
            "校验通过",
            "执行成功",
            "返回行数",
            "耗时(ms)",
            "错误信息",
            "时间",
        ]
    )
    for audit, user in rows:
        sheet.append(
            [
                audit.id,
                user.username,
                audit.question,
                audit.sql_text,
                audit.validation_passed,
                audit.execution_success,
                audit.row_count,
                audit.execution_time_ms,
                audit.error_message,
                str(audit.created_at),
            ]
        )

    stream = BytesIO()
    workbook.save(stream)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type=
        (
            "application/"
            "vnd.openxmlformats-"
            "officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition":
            (
                "attachment;"
                " filename="
                "sql_audit_export.xlsx"
            )
        },
    )

