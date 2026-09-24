from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User


def get_user_by_username(
    db: Session,
    username: str,
) -> User | None:
    statement = select(User).where(User.username == username)
    return db.scalar(statement)


def get_user_by_email(
    db: Session,
    email: str,
) -> User | None:
    statement = select(User).where(User.email == email)
    return db.scalar(statement)


def get_user_by_username_or_email(
    db: Session,
    value: str,
) -> User | None:
    statement = select(User).where(
        or_(
            User.username == value,
            User.email == value,
        )
    )
    return db.scalar(statement)


def authenticate_user(
    db: Session,
    username: str,
    password: str,
) -> User | None:
    user = get_user_by_username_or_email(
        db=db,
        value=username,
    )

    if user is None:
        return None

    if not verify_password(
        plain_password=password,
        hashed_password=user.hashed_password,
    ):
        return None

    return user
