from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_v1_prefix}/auth/login")

DatabaseSession = Annotated[
    Session,
    Depends(get_db),
]


def get_current_user(
    db: DatabaseSession,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    authentication_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登录状态无效或Token已经过期",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)

        subject = payload.get("sub")

        if subject is None:
            raise authentication_error

        user_id = int(subject)

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
    ):
        raise authentication_error

    user = db.get(User, user_id)

    if user is None:
        raise authentication_error

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="当前用户已经被禁用",
        )

    return user


CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]


def require_admin(
    current_user: CurrentUser,
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="该操作需要管理员权限",
        )

    return current_user


AdminUser = Annotated[
    User,
    Depends(require_admin),
]
