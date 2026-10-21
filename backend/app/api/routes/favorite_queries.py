from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import (
    CurrentUser,
    DatabaseSession,
)
from app.models.favorite_query import (
    FavoriteQuery,
)
from app.schemas.favorite_query import (
    FavoriteQueryCreateRequest,
    FavoriteQueryResponse,
)

router = APIRouter()


@router.post(
    "",
    response_model=FavoriteQueryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_favorite_query(
    request_data: FavoriteQueryCreateRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> FavoriteQuery:
    normalized_title = request_data.title.strip()
    normalized_question = request_data.question.strip()

    if not normalized_title:
        raise HTTPException(
            status_code=(status.HTTP_422_UNPROCESSABLE_ENTITY),
            detail="收藏标题不能为空",
        )

    if not normalized_question:
        raise HTTPException(
            status_code=(status.HTTP_422_UNPROCESSABLE_ENTITY),
            detail="收藏问题不能为空",
        )

    existing = db.scalar(
        select(
            FavoriteQuery,
        ).where(
            FavoriteQuery.user_id
            == current_user.id,

            FavoriteQuery.question
            == request_data.question,
        )
    )

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="该问题已收藏",
        )

    favorite = FavoriteQuery(
        user_id=current_user.id,
        title=normalized_title,
        question=normalized_question,
    )

    db.add(favorite)
    db.commit()
    db.refresh(favorite)

    return favorite


@router.get(
    "",
    response_model=list[FavoriteQueryResponse],
)
def get_favorite_queries(
    db: DatabaseSession,
    current_user: CurrentUser,
) -> list[FavoriteQuery]:
    statement = (
        select(FavoriteQuery)
        .where(FavoriteQuery.user_id == current_user.id)
        .order_by(FavoriteQuery.created_at.desc())
    )

    return list(db.scalars(statement).all())


@router.delete(
    "/{favorite_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_favorite_query(
    favorite_id: int,
    db: DatabaseSession,
    current_user: CurrentUser,
) -> None:

    statement = select(FavoriteQuery).where(
        FavoriteQuery.id == favorite_id,
        FavoriteQuery.user_id == current_user.id,
    )

    favorite = db.scalar(statement)

    if favorite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="收藏不存在",
        )

    db.delete(favorite)
    db.commit()
