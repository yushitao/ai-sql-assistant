from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.core.dependencies import (
    AdminUser,
    CurrentUser,
    DatabaseSession,
)
from app.models.test_result import TestResult, TestStatus
from app.schemas.test_result import (
    TestResultCreate,
    TestResultResponse,
)

router = APIRouter(
    prefix="/test-results",
    tags=["Test Results"],
)


@router.post(
    "",
    response_model=TestResultResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_test_result(
    result_data: TestResultCreate,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> TestResult:
    test_result = TestResult(
        **result_data.model_dump(),
        created_by=current_user.id,
    )

    db.add(test_result)
    db.commit()
    db.refresh(test_result)

    return test_result


@router.get(
    "",
    response_model=list[TestResultResponse],
)
def list_test_results(
    db: DatabaseSession,
    current_user: CurrentUser,
    product: str | None = None,
    station: str | None = None,
    test_status: Annotated[
        TestStatus | None,
        Query(alias="status"),
    ] = None,
    offset: Annotated[
        int,
        Query(ge=0),
    ] = 0,
    limit: Annotated[
        int,
        Query(ge=1, le=100),
    ] = 20,
) -> list[TestResultResponse]:
    statement = select(TestResult)
    if product:
        statement = statement.where(TestResult.product == product)

    if station:
        statement = statement.where(TestResult.station == station)

    if test_status:
        statement = statement.where(TestResult.status == test_status)

    statement = (
        statement.order_by(TestResult.test_time.desc()).offset(offset).limit(limit)
    )

    return list(db.scalars(statement).all())


@router.get(
    "/{result_id}",
    response_model=TestResultResponse,
)
def get_test_result(
    result_id: int,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> TestResult:
    test_result = db.get(TestResult, result_id)

    if test_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="测试结果不存在",
        )

    return test_result


@router.delete(
    "/{result_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_test_result(
    result_id: int,
    db: DatabaseSession,
    admin_user: AdminUser,
) -> None:
    test_result = db.get(TestResult, result_id)

    if test_result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="测试结果不存在",
        )

    db.delete(test_result)
    db.commit()
