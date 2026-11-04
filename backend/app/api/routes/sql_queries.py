import logging
from datetime import datetime, timedelta, timezone
from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy import case, func, select, text
from sqlalchemy.exc import SQLAlchemyError

from app.core.dependencies import (
    AdminUser,
    CurrentUser,
    DatabaseSession,
)
from app.models.chat_message import ChatMessage
from app.models.feedback import FeedbackType, QueryFeedback
from app.models.sql_audit import SQLAudit
from app.models.user import User
from app.schemas.sql_audit import (
    AIQualityAnalysisResponse,
    AIQualityDailyTrendItem,
    AIQualityMetricsResponse,
    AISchemaQualityAnalysis,
    AITokenQualityAnalysis,
    AuditQualityTrendItem,
    RepairCountDistribution,
    SatisfactionTrendItem,
    SQLAuditHistoryResponse,
    SQLAuditPageResponse,
    SQLAuditResponse,
    SQLAuditStatsResponse,
    SQLAuditTrendItem,
    TopQuestionItem,
)
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

def calculate_rate(
    numerator: int,
    denominator: int,
) -> float:
    if denominator == 0:
        return 0.0

    return round(
        numerator / denominator * 100,
        2,
    )


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
    response_model=list[SQLAuditHistoryResponse],
)
def get_my_sql_history(
    db: DatabaseSession,
    current_user: CurrentUser,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list:
    statement = (
        select(SQLAudit)
        .where(SQLAudit.user_id == current_user.id)
        .order_by(SQLAudit.created_at.desc())
        .limit(limit)
        .offset(offset)
    )

    audits = list(db.scalars(statement).all())
    return [
        SQLAuditHistoryResponse
        .model_validate(
            audit
        )
        for audit in audits
    ]


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

        count_statement = count_statement.where(SQLAudit.sql_text.ilike(f"%{keyword}%"))

    if execution_success is not None:
        statement = statement.where(SQLAudit.execution_success == execution_success)

        count_statement = count_statement.where(
            SQLAudit.execution_success == execution_success
        )

    total = len(db.scalars(count_statement).all())

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
            prompt_tokens=audit.prompt_tokens,
            completion_tokens=audit.completion_tokens,
            total_tokens=audit.total_tokens,
            repair_count=audit.repair_count,
            selected_tables=audit.selected_tables,
            selected_table_count=audit.selected_table_count,
            schema_fallback_used=audit.schema_fallback_used,
            created_at=audit.created_at,
        )
        for audit, user in rows
    ]

    return SQLAuditPageResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/admin/stats",
    response_model=SQLAuditStatsResponse,
)
def get_sql_audit_stats(
    db: DatabaseSession,
    current_user: AdminUser,
    keyword: Annotated[
        str | None,
        Query(
            min_length=1,
            max_length=200,
        ),
    ] = None,
    execution_success: Annotated[
        bool | None,
        Query(),
    ] = None,
) -> SQLAuditStatsResponse:
    statement = select(
        func.count(SQLAudit.id),
        func.coalesce(
            func.sum(
                case(
                    (
                        SQLAudit.execution_success.is_(True),
                        1,
                    ),
                    else_=0,
                )
            ),
            0,
        ),
        func.coalesce(
            func.sum(
                case(
                    (
                        SQLAudit.execution_success.is_(False),
                        1,
                    ),
                    else_=0,
                )
            ),
            0,
        ),
        func.coalesce(
            func.avg(SQLAudit.execution_time_ms),
            0.0,
        ),
    )

    normalized_keyword = keyword.strip() if keyword is not None else ""

    if normalized_keyword:
        statement = statement.where(SQLAudit.sql_text.ilike(f"%{normalized_keyword}%"))

    if execution_success is not None:
        statement = statement.where(SQLAudit.execution_success == execution_success)

    row = db.execute(statement).one()

    total = int(row[0] or 0)
    success_count = int(row[1] or 0)
    failure_count = int(row[2] or 0)

    avg_execution_time_ms = float(row[3] or 0.0)

    success_rate = success_count / total * 100 if total > 0 else 0.0

    failure_rate = failure_count / total * 100 if total > 0 else 0.0

    feedback_statement = (select(
        func.coalesce(
            func.sum(
                case(
                    (
                        QueryFeedback.feedback_type
                        == FeedbackType.LIKE,
                        1,
                    ),
                    else_=0,
                )
            ),
            0,
        ),
        func.coalesce(
            func.sum(
                case(
                    (
                        QueryFeedback.feedback_type
                        == FeedbackType.DISLIKE,
                        1,
                    ),
                    else_=0,
                )
            ),
            0,
        ),
    )
        .select_from(
            QueryFeedback
        )
        .join(
            ChatMessage,
            ChatMessage.id
            == QueryFeedback.message_id,
        )
    )

    feedback_row = db.execute(
        feedback_statement
    ).one()

    like_count = int(
        feedback_row[0] or 0
    )

    dislike_count = int(
        feedback_row[1] or 0
    )

    feedback_total = (
        like_count + dislike_count
    )

    satisfaction_rate = (
        like_count / feedback_total * 100
        if feedback_total > 0
        else 0.0
    )

    return SQLAuditStatsResponse(
        total=total,
        success_count=success_count,
        failure_count=failure_count,
        success_rate=round(success_rate, 2),
        failure_rate=round(failure_rate, 2),
        avg_execution_time_ms=round(avg_execution_time_ms, 3),
        like_count=like_count,
        dislike_count=dislike_count,
        satisfaction_rate=round(satisfaction_rate,2),
    )

@router.get(
    "/admin/trend",
    response_model=list[SQLAuditTrendItem],
)
def get_sql_audit_trend(
    db: DatabaseSession,
    admin_user: AdminUser,
):
    statement = text(
        """
        SELECT
            substr(
                created_at,
                1,
                10
            ) AS date,

            COUNT(*) AS count

        FROM sql_audits

        GROUP BY date

        ORDER BY date DESC

        LIMIT 7
        """
    )

    rows = (
        db.execute(statement)
        .mappings()
        .all()
    )

    return [
        SQLAuditTrendItem(
            date=row["date"],
            count=row["count"],
        )
        for row in rows
    ]

@router.get(
    "/admin/satisfaction-trend",
    response_model=list[SatisfactionTrendItem],
)
def get_satisfaction_trend(
    db: DatabaseSession,
    admin_user: AdminUser,
):
    statement = text(
        """
        SELECT
            substr(
                created_at,
                1,
                10
            ) AS date,

            SUM(
                CASE
                    WHEN feedback_type="LIKE"
                    THEN 1
                    ELSE 0
                END
            ) AS like_count,

            SUM(
                CASE
                    WHEN feedback_type="DISLIKE"
                    THEN 1
                    ELSE 0
                END
            ) AS dislike_count

        FROM query_feedback qf

        JOIN chat_messages cm

        ON cm.id = qf.message_id

        GROUP BY
        substr(
            cm.created_at,
            1,
            10
        )

        ORDER BY date DESC

        LIMIT 7
        """
    )

    rows = (
        db.execute(statement)
        .mappings()
        .all()
    )

    result = []

    for row in rows:
        like_count = row["like_count"] or 0
        dislike_count = row["dislike_count"] or 0
        total = like_count + dislike_count

        rate = (like_count / total * 100
                if total > 0
                else 0
               )

        result.append(
            SatisfactionTrendItem(
                date=row["date"],
                satisfaction_rate=round(rate,2),
            )
        )

    return result

@router.get(
    "/admin/quality-trend",
    response_model=list[
        AuditQualityTrendItem
    ],
)
def get_audit_quality_trend(
    db: DatabaseSession,
    admin_user: AdminUser,
    days: Annotated[
        int,
        Query(
            ge=1,
            le=365,
        ),
    ] = 30,
) -> list[AuditQualityTrendItem]:
    end_date = datetime.now(timezone.utc).date()

    start_date = (
        end_date - timedelta(days=days-1)
    )

    start_date_text = (start_date.isoformat())
    query_date = func.date(
        SQLAudit.created_at
    )
    query_statement =(
        select(
            query_date.label("date"),
            func.count(SQLAudit.id)
            .label("query_count"),
        )
        .where(
            query_date >= start_date_text
        )
        .group_by(
            query_date
        )
    )

    query_rows = (
        db.execute(query_statement)
        .mappings()
        .all()
    )

    query_count_map = {
        str(row["date"]):
        int(row["query_count"] or 0 )
        for row in query_rows
    }

    message_date = func.date(
        ChatMessage.created_at
    )

    feedback_statement = (
        select(
            message_date.label("date"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            QueryFeedback
                            .feedback_type
                            == FeedbackType
                            .LIKE,
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("like_count"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            QueryFeedback
                            .feedback_type
                            == FeedbackType
                            .DISLIKE,
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("dislike_count"),
        )
        .join(
            ChatMessage,
            ChatMessage.id
            == QueryFeedback.message_id,
        )
        .where(
            message_date >= start_date_text
        )
        .group_by(message_date)
    )

    feedback_rows = (
        db.execute(feedback_statement)
        .mappings()
        .all()
    )

    feedback_map = {
        str(row["date"]): {
            "like_count": int(row["like_count"] or 0),
            "dislike_count": int(row["dislike_count"] or 0),
        }
        for row in feedback_rows
    }

    result: list[AuditQualityTrendItem] = []

    for day_offset in range(days):
        current_date = (start_date + timedelta(days=day_offset))
        date_text = (current_date.isoformat())
        feedback_counts = (feedback_map.get(
            date_text,
            {
                "like_count": 0,
                "dislike_count": 0,
            },
        ))

        like_count = (feedback_counts["like_count"])
        dislike_count = (feedback_counts["dislike_count"])
        feedback_total = (like_count + dislike_count)
        satisfaction_rate = (
            round(like_count / feedback_total * 100, 2)
            if feedback_total > 0
            else None
        )

        result.append(
            AuditQualityTrendItem(
                date=date_text,
                query_count=(
                    query_count_map.get(
                        date_text,
                        0,
                    )
                ),
                like_count=(like_count),
                dislike_count=(dislike_count),
                satisfaction_rate=satisfaction_rate,
            )
        )

    return result

@router.get(
    "/admin/top-questions",
    response_model=list[TopQuestionItem],
)
def get_top_questions(
    db: DatabaseSession,
    _admin_user: AdminUser,
    days: Annotated[
        int,
        Query(
            ge=1,
            le=365,
        ),
    ] = 30,
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=50,
        ),
    ] = 10,
) -> list[TopQuestionItem]:
    end_date = datetime.now(timezone.utc).date()

    start_date = end_date - timedelta(days= days-1)

    question_date = func.date(SQLAudit.created_at)

    question_count = func.count(SQLAudit.id)

    statement = (
        select(
            SQLAudit.question,
            question_count.label("count"),
        )
        .where(
            SQLAudit.question.is_not(None),
            func.trim(SQLAudit.question) != "",
            question_date >= start_date.isoformat(),
        )
        .group_by(SQLAudit.question)
        .order_by(
            question_count.desc(),
            SQLAudit.question.asc(),
        )
        .limit(limit)
    )

    rows = (
        db.execute(statement)
        .mappings()
        .all()
    )

    return [
        TopQuestionItem(
            question=str(row["question"]),
            count=int(row["count"] or 0),
        )
        for row in rows
    ]

@router.get(
    "/admin/ai-quality",
    response_model=(
        AIQualityMetricsResponse
    ),
)
def get_ai_quality_metrics(
    db: DatabaseSession,
    _admin_user: AdminUser,
) -> AIQualityMetricsResponse:
    ai_query_filter = (
        SQLAudit.question.is_not(None)
    )

    aggregate_statement = (
        select(
            func.count(
                SQLAudit.id
            ).label("total_queries"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            (
                                SQLAudit
                                .execution_success
                                .is_(True)
                            )
                            & (
                                SQLAudit
                                .repair_count
                                == 0
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("first_try_success_count"),

            func.coalesce(
                func.sum(
                    case(
                        (
                            SQLAudit
                            .repair_count
                            > 0,
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("repair_triggered_count"),

            func.coalesce(
                func.sum(
                    case(
                        (
                            (
                                SQLAudit
                                .repair_count
                                > 0
                            )
                            & (
                                SQLAudit
                                .execution_success
                                .is_(True)
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("repair_success_count"),

            func.coalesce(
                func.sum(
                    case(
                        (
                            SQLAudit
                            .execution_success
                            .is_(True),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label("final_success_count"),

            func.coalesce(
                func.avg(
                    SQLAudit
                    .repair_count
                ),
                0.0,
            ).label("average_repair_count"),
        )
        .where(ai_query_filter)
    )

    aggregate_result = (
        db.execute(aggregate_statement).one()
    )

    total_queries = int(
        aggregate_result
        .total_queries
        or 0
    )

    first_try_success_count = int(
        aggregate_result
        .first_try_success_count
        or 0
    )

    repair_triggered_count = int(
        aggregate_result
        .repair_triggered_count
        or 0
    )

    repair_success_count = int(
        aggregate_result
        .repair_success_count
        or 0
    )

    final_success_count = int(
        aggregate_result
        .final_success_count
        or 0
    )

    average_repair_count = round(
        float(
            aggregate_result
            .average_repair_count
            or 0.0
        ),
        2,
    )

    distribution_statement = (
        select(
            SQLAudit.repair_count,
            func.count(
                SQLAudit.id
            ).label("query_count"),
        )
        .where(ai_query_filter)
        .group_by(SQLAudit.repair_count)
    )

    distribution_rows = (
        db.execute(
            distribution_statement
        )
        .all()
    )

    distribution_map = {
        int(repair_count or 0): int(query_count or 0)
        for (
            repair_count,
            query_count,
        ) in distribution_rows
    }

    return (
        AIQualityMetricsResponse(
            total_queries=total_queries,
            first_try_success_count=first_try_success_count,
            first_try_success_rate=(
                calculate_rate(
                    first_try_success_count,
                    total_queries,
                )
            ),
            repair_triggered_count=repair_triggered_count,
            repair_trigger_rate=(
                calculate_rate(
                    repair_triggered_count,
                    total_queries,
                )
            ),
            repair_success_count=repair_success_count,
            repair_success_rate=(
                calculate_rate(
                    repair_success_count,
                    repair_triggered_count,
                )
            ),
            final_success_count=final_success_count,
            final_success_rate=(
                calculate_rate(
                    final_success_count,
                    total_queries,
                )
            ),
            average_repair_count=average_repair_count,
            repair_count_distribution=(
                RepairCountDistribution(
                    no_repair=(
                        distribution_map.get(
                                  0,
                                  0,
                        )
                    ),
                    repaired_once=(
                        distribution_map.get(
                            1,
                            0,
                        )
                    ),
                    repaired_twice=(
                        distribution_map.get(
                            2,
                            0,
                        )
                    ),
                )
            ),
        )
)


@router.get(
    "/admin/ai-quality-analysis",
    response_model=(
        AIQualityAnalysisResponse
    ),
)
def get_ai_quality_analysis(
    db: DatabaseSession,
    _admin_user: AdminUser,
    days: int = 30,
) -> AIQualityAnalysisResponse:
    if days not in {
        7,
        30,
        90,
    }:
        raise HTTPException(
            status_code=400,
            detail=(
                "days仅支持7、30或90"
            ),
        )

    start_date = (
        datetime.now(timezone.utc).date()
        - timedelta(
            days=days - 1
        )
    )

    base_filter = (
        SQLAudit.question.is_not(None)
        & (
            func.date(SQLAudit.created_at)
            >= start_date.isoformat()
        )
    )

    daily_statement = (
        select(
            func.date(
                SQLAudit.created_at
            ).label(
                "query_date"
            ),
            func.count(
                SQLAudit.id
            ).label(
                "total_queries"
            ),
            func.coalesce(
                func.sum(
                    case(
                        (
                            (
                                SQLAudit
                                .execution_success
                                .is_(True)
                            )
                            & (
                                SQLAudit
                                .repair_count
                                == 0
                            ),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(
                "first_try_success_count"
            ),
            func.coalesce(
                func.sum(
                    case(
                        (
                            SQLAudit
                            .repair_count
                            > 0,
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(
                "repair_triggered_count"
            ),
            func.coalesce(
                func.sum(
                    case(
                        (
                            SQLAudit
                            .execution_success
                            .is_(True),
                            1,
                        ),
                        else_=0,
                    )
                ),
                0,
            ).label(
                "final_success_count"
            ),
            func.coalesce(
                func.avg(
                    SQLAudit.total_tokens
                ),
                0.0,
            ).label(
                "average_total_tokens"
            ),
            func.count(
                SQLAudit.total_tokens
            ).label(
                "token_sample_count"
            ),
        )
        .where(base_filter)
        .group_by(
            func.date(SQLAudit.created_at)
        )
        .order_by(
            func.date(SQLAudit.created_at)
        )
    )
    daily_rows = (
        db.execute(
            daily_statement
        )
        .all()
    )

    daily_map = {}
    for row in daily_rows:
        row_total = int(
            row.total_queries
            or 0
        )

        daily_map[
            str(row.query_date)
        ] = (
            AIQualityDailyTrendItem(
                date=str(row.query_date),
                total_queries=(row_total),
                first_try_success_rate=(
                    calculate_rate(
                        int(
                            row
                            .first_try_success_count
                            or 0
                        ),
                        row_total,
                    )
                ),
                repair_trigger_rate=(
                    calculate_rate(
                        int(
                            row
                            .repair_triggered_count
                            or 0
                        ),
                        row_total,
                    )
                ),
                final_success_rate=(
                    calculate_rate(
                        int(
                            row
                            .final_success_count
                            or 0
                        ),
                        row_total,
                    )
                ),
                average_total_tokens=(
                    round(
                        float(
                            row
                            .average_total_tokens
                            or 0.0
                        ),
                        2,
                    )
                ),
                token_sample_count=(
                    int(
                        row.token_sample_count
                        or 0
                    )
                ),
            )
        )

        daily_trend = []

        for offset in range(days):
            current_date = (
                start_date
                + timedelta(days=offset)
            )

            date_text = (
                current_date
                .isoformat()
            )

            daily_trend.append(
                daily_map.get(
                    date_text,
                    AIQualityDailyTrendItem(
                        date=date_text,
                        total_queries=0,
                        first_try_success_rate=0.0,
                        repair_trigger_rate=0.0,
                        final_success_rate=0.0,
                        average_total_tokens=0.0,
                        token_sample_count=0,
                    ),
                )
            )

        schema_statement = (
            select(
                func.count(
                    SQLAudit.id
                ).label(
                    "total_queries"
                ),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                SQLAudit
                                .schema_fallback_used
                                .is_(True),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label(
                    "fallback_count"
                ),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                SQLAudit
                                .schema_fallback_used
                                .is_(False),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label(
                    "smart_selection_count"
                ),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                (
                                    SQLAudit
                                    .schema_fallback_used
                                    .is_(False)
                                )
                                & (
                                    SQLAudit
                                    .execution_success
                                    .is_(True)
                                ),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label(
                    "smart_selection_success_count"
                ),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                (
                                    SQLAudit
                                    .schema_fallback_used
                                    .is_(True)
                                )
                                & (
                                    SQLAudit
                                    .execution_success
                                    .is_(True)
                                ),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label(
                    "fallback_success_count"
                ),
                func.coalesce(
                    func.avg(
                        SQLAudit
                        .selected_table_count
                    ),
                    0.0,
                ).label(
                    "average_selected_table_count"
                ),
            )
            .where(base_filter)
            .where(
                SQLAudit
                .schema_fallback_used
                .is_not(None)
            )
        )

        schema_row = (
            db.execute(schema_statement)
            .one()
        )

        schema_total = int(
            schema_row.total_queries
            or 0
        )

        fallback_count = int(
            schema_row.fallback_count
            or 0
        )

        smart_selection_count = int(
            schema_row.smart_selection_count
            or 0
        )

        smart_success_count = int(
            schema_row.smart_selection_success_count
            or 0
        )

        fallback_success_count = int(
            schema_row.fallback_success_count
            or 0
        )

        token_statement = (
            select(
                SQLAudit.repair_count,
                func.coalesce(
                    func.avg(
                        SQLAudit.total_tokens
                    ),
                    0.0,
                ).label(
                    "average_tokens"
                ),
            )
            .where(
                SQLAudit.total_tokens
                .is_not(None)
            )
            .group_by(SQLAudit.repair_count)
        )
        
        token_rows = (
            db.execute(token_statement)
            .all()
        )

        token_map = {
            int(
                row.repair_count
                or 0
            ): round(
                float(
                    row.average_tokens
                    or 0.0
                ),
                2,
            )
            for row in token_rows
        }

        return AIQualityAnalysisResponse(
            days=days,
            daily_trend=daily_trend,
            schema_analysis=(
                AISchemaQualityAnalysis(
                    fallback_count=fallback_count,
                    fallback_rate=(
                        calculate_rate(
                            fallback_count,
                            schema_total,
                        )
                    ),
                    smart_selection_count=smart_selection_count,
                    smart_selection_success_rate=(
                        calculate_rate(
                            smart_success_count,
                            smart_selection_count,
                        )
                    ),
                    fallback_success_rate=(
                        calculate_rate(
                            fallback_success_count,
                            fallback_count,
                        )
                    ),
                    average_selected_table_count=(
                        round(
                            float(
                                schema_row
                                .average_selected_table_count
                                or 0.0
                            ),
                            2,
                        )
                    ),
                )
            ),
            token_analysis=(
                AITokenQualityAnalysis(
                    first_try_average_tokens=(
                        token_map.get(
                            0,
                            0.0,
                        )
                    ),
                    repaired_once_average_tokens=(
                        token_map.get(
                            1,
                            0.0,
                        )
                    ),
                    repaired_twice_average_tokens=(
                        token_map.get(
                            2,
                            0.0,
                        )
                    ),
                )
            ),
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

    statement = statement.order_by(SQLAudit.created_at.desc())

    rows = db.execute(statement).all()

    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "SQL Audit"
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
        media_type=(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ),
        headers={"Content-Disposition": ("attachment; filename=sql_audit_export.xlsx")},
    )
