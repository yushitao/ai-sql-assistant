from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func, or_, select

from app.core.dependencies import (
    AdminUser,
    CurrentUser,
    DatabaseSession,
)
from app.core.security import (
    hash_password,
    verify_password,
)
from app.models.user import (
    User,
    UserRole,
)
from app.schemas.user import (
    AdminUserCreateRequest,
    AdminUserListResponse,
    AdminUserResponse,
    PasswordChangeRequest,
    UserResponse,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)

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

@router.get(
    "/admin",
    response_model=(
        AdminUserListResponse
    ),
)
def get_admin_users(
    db: DatabaseSession,
    _admin_user: AdminUser,
    page: Annotated[
        int,
        Query(
            ge=1,
        ),
    ] = 1,
    page_size: Annotated[
        int,
        Query(
            ge=1,
            le=100,
        ),
    ] = 20,
    keyword: Annotated[
        str | None,
        Query(
            max_length=100,
        ),
    ] = None,
    role: Annotated[
        UserRole | None,
        Query(),
    ] = None,
    is_active: Annotated[
        bool | None,
        Query(),
    ] = None,
) -> AdminUserListResponse:
    filters = []

    normalized_keyword = (
        keyword.strip()
        if keyword
        else ""
    )

    if normalized_keyword:
        keyword_pattern = (
            f"%{normalized_keyword}%"
        )

        filters.append(
            or_(
                User.username.ilike(
                    keyword_pattern
                ),
                User.email.ilike(
                    keyword_pattern
                ),
            )
        )

    if role is not None:
         filters.append(
             User.role == role
         )

    if is_active is not None:
        filters.append(
            User.is_active
            == is_active
        )

    count_statement = select(
        func.count(
            User.id
        )
    )

    statement = select(
        User
    )

    if filters:
        count_statement = (
            count_statement.where(
                *filters
            )
        )

        statement = (
            statement.where(
                *filters
            )
        )

    total = int(
        db.scalar(
            count_statement
        )
        or 0
    )

    statement = (
        statement
        .order_by(
            User.created_at.desc(),
            User.id.desc(),
        )
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    users = list(
        db.scalars(statement).all()
    )

    return AdminUserListResponse(
        items=[
            AdminUserResponse
            .model_validate(user)
            for user in users
        ],
        total=total,
        page=page,
        page_size=page_size,
    )

@router.post(
    "/admin",
    response_model=(
        AdminUserResponse
    ),
    status_code=(
        status.HTTP_201_CREATED
    ),
)
def create_admin_user(
    request_data: AdminUserCreateRequest,
    db: DatabaseSession,
    _admin_user: AdminUser,
) -> AdminUserResponse:
    normalized_username = (
        request_data.username.strip()
    )

    normalized_email = (
        request_data.email.strip().lower()
    )

    if (
        not normalized_email
    ):
        raise HTTPException(
            status_code=400,
            detail="邮箱不能为空",
        )

    duplicate_statement = (
        select(User.id)
        .where(
            or_(
                User.username
                == normalized_username,
                User.email
                ==normalized_email,
            )
        )
    )

    if (
        db.scalar(duplicate_statement)
        is not None
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_409_CONFLICT
            ),
            detail=(
                "用户名或邮箱已存在"
            ),
        )

    user = User(
        username=(
            normalized_username
        ),
        email=normalized_email,
        hashed_password=(
            hash_password(
                request_data.password
            )
        ),
        role=request_data.role,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return (
        AdminUserResponse
        .model_validate(
            user
        )
    )

@router.patch(
    "/admin/{user_id}/status",
    response_model=(
        AdminUserResponse
    ),
)
def update_user_status(
    user_id: int,
    request_data: UserStatusUpdateRequest,
    db: DatabaseSession,
    admin_user: AdminUser,
) -> AdminUserResponse:

    print(
        "update_user_status called:",
        {
            "user_id": user_id,
            "is_active": request_data.is_active,
            "admin_id": admin_user.id,
        },
    )
    
    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在",
        )

    if (
        user.id
        == admin_user.id
        and not request_data.is_active
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "不能禁用当前登陆账户"
            ),
        )

    user.is_active = (
        request_data.is_active
    )

    db.commit()
    db.refresh(user)

    return (
        AdminUserResponse
        .model_validate(
            user
        )
    )

@router.patch(
    "/admin/{user_id}/role",
    response_model=(AdminUserResponse),
)
def update_user_role(
    user_id: int,
    request_data: UserRoleUpdateRequest,
    db: DatabaseSession,
    admin_user: AdminUser,
) -> AdminUserResponse:
    print(
        "update_user_role called:",
        {
            "user_id": user_id,
            "role": request_data.role,
            "admin_id": admin_user.id,
        },
    )

    user = db.get(
        User,
        user_id,
    )

    if user is None:
        raise HTTPException(
            status_code=(
                status.HTTP_404_NOT_FOUND
            ),
            detail="用户不存在",
        )

    if (
        user.id
        == admin_user.id
        and request_data.role
        != UserRole.ADMIN
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_400_BAD_REQUEST
            ),
            detail=(
                "不能降低当前登陆账户的权限"
            ),
        )

    user.role = request_data.role

    db.commit()
    db.refresh(user)

    return (
        AdminUserResponse
        .model_validate(
            user
        )
    )



