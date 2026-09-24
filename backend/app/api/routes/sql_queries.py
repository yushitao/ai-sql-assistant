import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError

from app.core.dependencies import (
    AdminUser,
    CurrentUser,
    DatabaseSession,
)
from app.models.sql_audit import SQLAudit
from app.schemas.sql_audit import SQLAuditResponse
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
    response_model=list[SQLAuditResponse],
)
def get_all_sql_history(
    db: DatabaseSession,
    admin_user: AdminUser,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> list:
    statement = (
        select(SQLAudit)
        .order_by(SQLAudit.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    return list(db.scalars(statement).all())
