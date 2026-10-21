from fastapi import APIRouter, HTTPException

from app.core.dependencies import CurrentUser, DatabaseSession
from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import PasswordChangeRequest, UserResponse

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_my_profile(
    current_user: CurrentUser,
) -> User:
    return current_user

@router.put(
    "/me/password",
)
def change_password(
    request_data: PasswordChangeRequest,
    db: DatabaseSession,
    current_user: CurrentUser,
):
    if not verify_password(
        request_data.current_password,
        current_user.hashed_password,
    ):
        raise HTTPException(
            status_code= 400,
            detail="当前密码错误",
        )

    if (
        len(request_data.new_password) < 8
    ):
        raise HTTPException(
            status_code=400,
            detail="密码长度不能少于8位",
        )

    current_user.hashed_password = (
        hash_password(request_data.new_password)
    )

    db.commit()

    return {
        "success": True,
    }


