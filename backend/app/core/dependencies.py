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
    print(
        "CURRENT USER DEPENDENCY START"
    )

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

        print(
            "CURRENT USER TOKEN:",
            {
                "subject": subject,
                "user_id": user_id,
            },
        )

    except (
        jwt.InvalidTokenError,
        ValueError,
        TypeError,
    ) as error:
        print(
            "CURRENT USER TOKEN ERROR:",
            repr(error),
        )

        raise authentication_error from error

    user = db.get(User, user_id)

    print(
        "CURRENT USER DATABASE:",
        {
            "found": user is not None,
            "id":
            user.id
            if user
            else None,
            "username":
            user.username
            if user
            else None,
            "role":
            user.role
            if user
            else None,
            "is_active":
            user.is_active
            if user
            else None,
        },
    )

    if user is None:
        print(
            "CURRENT USER DENIED:"
            "user not found"
        )

        raise authentication_error

    if not user.is_active:
        print(
            "CURRENT USER DENIED:"
            " user disabled"
        )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="当前用户已经被禁用",
        )

    print(
        "CURRENT USER PASSED:",
        user.id,
        user.username,
    )

    return user


CurrentUser = Annotated[
    User,
    Depends(get_current_user),
]


def require_admin(
    current_user: CurrentUser,
) -> User:
    print(
        "require_admin:",
        {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
            "is_active": current_user.is_active,
        },
    )

    if current_user.role != UserRole.ADMIN:
        print(
            "ADMIN CHECK FAILED:",
            current_user.role,
        )

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="该操作需要管理员权限",
        )

    print(
        "ADMIN CHECK PASSED",
    )

    return current_user


AdminUser = Annotated[
    User,
    Depends(require_admin),
]
