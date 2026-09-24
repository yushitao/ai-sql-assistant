from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.test_result import TestStatus


class TestResultCreate(BaseModel):
    test_time: datetime
    product: str = Field(min_length=1, max_length=100)
    station: str = Field(min_length=1, max_length=100)
    test_item: str = Field(min_length=1, max_length=100)
    status: TestStatus
    duration_seconds: float = Field(ge=0)
    error_code: str | None = Field(default=None, max_length=100)
    error_message: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_failure_information(self):
        if self.status == TestStatus.PASS:
            self.error_code = None
            self.error_message = None

        return self


class TestResultResponse(BaseModel):
    id: int
    test_time: datetime
    product: str
    station: str
    test_item: str
    status: TestStatus
    duration_seconds: float
    error_code: str | None
    error_message: str | None
    created_by: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
