from fastapi import APIRouter
from sqlalchemy import select

from app.core.dependencies import (
    CurrentUser,
    DatabaseSession,
)
from app.models.feedback import (
    FeedbackType,
    QueryFeedback,
)
from app.schemas.feedback import (
    FeedbackCreateRequest,
)

router = APIRouter()


@router.post("")
def create_feedback(
    request_data: FeedbackCreateRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    existing = db.scalar(
        select(QueryFeedback).where(
            QueryFeedback.user_id == current_user.id,
            QueryFeedback.message_id == request_data.message_id,
        )
    )

    if existing is not None:
        existing.feedback_type = request_data.feedback_type

        db.commit()

        return {
            "success": True,
        }

    feedback = QueryFeedback(
        user_id=current_user.id,
        message_id=request_data.message_id,
        feedback_type=FeedbackType(request_data.feedback_type),
    )

    db.add(feedback)
    db.commit()

    return {
        "success": True,
    }


@router.get("")
def get_feedbacks(
    db: DatabaseSession,
    current_user: CurrentUser,
):
    feedbacks = list(
        db.scalars(
            select(QueryFeedback).where(QueryFeedback.user_id == current_user.id)
        ).all()
    )

    return [
        {
            "message_id": feedback.message_id,
            "feedback_type": feedback.feedback_type,
        }
        for feedback in feedbacks
    ]
