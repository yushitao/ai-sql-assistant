from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import UserRole


class UserCreate(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_]+$",
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class AdminUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str | None
    role: UserRole
    is_active: bool
    created_at: datetime

class AdminUserListResponse(BaseModel):
    items: list[AdminUserResponse]
    total: int
    page:int
    page_size: int

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

class UserRoleUpdateRequest(BaseModel):
    role: UserRole

class AdminUserCreateRequest(BaseModel):
    username: str = Field(
        min_length=3,
        max_length=50,
    )
    email: str = Field(
        min_length=5,
        max_length=255,
    )
    password: str = Field(
        min_length=8,
        max_length=128,
    )
    role: UserRole = (
        UserRole.USER
    )
    
