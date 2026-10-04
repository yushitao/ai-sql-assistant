from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FavoriteQueryCreateRequest(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=200,
    )

    question: str = Field(
        min_length=1,
        max_length=1000,
    )


class FavoriteQueryResponse(
    BaseModel,
):
    id: int
    title: str
    question: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )
