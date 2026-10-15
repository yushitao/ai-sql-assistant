from pydantic import BaseModel

from app.models.feedback import FeedbackType


class FeedbackCreateRequest(BaseModel):
    message_id: int
    feedback_type: FeedbackType
