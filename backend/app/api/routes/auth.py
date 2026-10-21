from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select

from app.core.dependencies import DatabaseSession
from app.core.security import create_access_token, hash_password
from app.models.login_attempt import LoginAttempt
from app.models.user import User, UserRole
from app.schemas.token import TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.services.auth_service import authenticate_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: UserCreate,
    db: DatabaseSession,
) -> User:
    statement = select(User).where(
        or_(
            User.username == user_data.username,
            User.email == user_data.email,
        )
    )

    existing_user = db.scalar(statement)

    if existing_user is not None:
        if existing_user.username == user_data.username:
            detail = "用户名已经存在"
        else:
            detail = "邮箱已经注册"

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )

    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        role=UserRole.USER,
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends(),
    ],
    db: DatabaseSession,
) -> TokenResponse:
    attempt = db.scalar(
        select(LoginAttempt)
        .where(
            LoginAttempt.username
            == form_data.username,
        )
    )

    now = datetime.now(timezone.utc)

    locked_until = (
        attempt.locked_until
        if attempt is not None
        else None
    )

    if ( locked_until is not None
        and locked_until.tzinfo is None
       ):
        locked_until = (
            locked_until.replace(
                tzinfo=timezone.utc,
            )
        )

    if (
        attempt
        and locked_until
        and locked_until > now
    ):
        raise HTTPException(
            status_code=429,
            detail=
            "登陆失败次数过多，请稍后重试",
        )
    user = authenticate_user(
        db=db,
        username=form_data.username,
        password=form_data.password,
    )

    if user is None:

        #raise HTTPException(
            #status_code=status.HTTP_401_UNAUTHORIZED,
            #detail="用户名、邮箱或密码错误",
            #headers={"WWW-Authenticate": "Bearer"},
        #)

        if attempt is None:
            attempt = LoginAttempt(
                username=form_data.username,
                failed_count=1,
            )

            db.add(attempt)

        else:
            attempt.failed_count += 1

            if (attempt.failed_count >= 5):
                attempt.locked_until = (
                    now + timedelta(minutes = 10)
                )

        db.commit()

        raise HTTPException(
            status_code=401,
            detail="用户名或密码错误",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="当前用户已经被禁用",
        )

    if attempt:
        attempt.failed_count = 0
        attempt.locked_until = None
        db.commit()

    access_token = create_access_token(subject=str(user.id))

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
    )
