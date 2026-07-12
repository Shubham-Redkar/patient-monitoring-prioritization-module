from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from schemas.user_schema import (
    AdminUserCreate, ChangePasswordRequest, ForgotPasswordRequest,
    ResetPasswordRequest, Token, UserCreate, UserResponse,
)
from services.email_service import EmailService
from utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
)
from core.config import get_settings

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
email_service = EmailService()

_REGISTERABLE_ROLES: set[str] = {"doctor", "nurse"}


@router.post("/login", response_model=Token)
async def login_for_access_token(
    request: Request, form_data: OAuth2PasswordRequestForm = Depends()
):
    repo = request.app.state.user_repo
    user = await repo.get_user_by_username(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=get_settings().access_token_expire_minutes)
    access_token = create_access_token(
        data={
            "sub": user["username"],
            "role": user["role"],
            "full_name": user.get("full_name", ""),
            "token_version": user.get("token_version", 0),
        },
        expires_delta=access_token_expires,
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "username": user["username"],
            "role": user["role"],
            "full_name": user.get("full_name", ""),
            "email": user.get("email", ""),
        },
    }


@router.post("/register")
async def register(
    request: Request,
    user_in: UserCreate,
    current_user: UserResponse = Depends(require_role(["admin"])),
):
    if user_in.role not in _REGISTERABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_in.role}' cannot be registered via this endpoint. "
            f"Allowed roles: {sorted(_REGISTERABLE_ROLES)}",
        )

    repo = request.app.state.user_repo
    existing_user = await repo.get_user_by_username(user_in.username)
    existing_email = await repo.get_user_by_email(user_in.email)
    if existing_user or existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )

    hashed_password = get_password_hash(user_in.password)
    new_user = {
        "username": user_in.username,
        "hashed_password": hashed_password,
        "role": user_in.role,
        "email": user_in.email,
        "token_version": 0,
    }
    await repo.create_user(new_user)
    return {"message": "User created successfully"}


@router.get("/me", response_model=Token)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Validate a stored token and return the current user."""
    return {
        "access_token": "",
        "token_type": "bearer",
        "user": current_user.model_dump(),
    }


@router.get("/users")
async def list_users(
    request: Request,
    current_user: UserResponse = Depends(require_role(["admin"])),
):
    """List all users (admin only). Passwords are never returned."""
    repo = request.app.state.user_repo
    users = await repo.list_users()
    return {"users": users}


@router.post("/users")
async def admin_create_user(
    request: Request,
    user_in: AdminUserCreate,
    current_user: UserResponse = Depends(require_role(["admin"])),
):
    """Admin creates a user of any role including admin."""
    username = user_in.username.strip()
    full_name = user_in.full_name.strip()

    repo = request.app.state.user_repo
    existing = await repo.get_user_by_username(username)
    existing_email = await repo.get_user_by_email(user_in.email)
    if existing or existing_email:
        raise HTTPException(status_code=400, detail="Username or email already exists.")

    await repo.create_user(
        {
            "username": username,
            "hashed_password": get_password_hash(user_in.password),
            "role": user_in.role,
            "full_name": full_name,
            "email": user_in.email,
            "token_version": 0,
        }
    )
    return {
        "message": f"User '{username}' created successfully.",
        "username": username,
        "role": user_in.role,
        "full_name": full_name,
        "email": user_in.email,
    }


@router.post("/change-password")
async def change_password(
    request: Request,
    password_in: ChangePasswordRequest,
    current_user: UserResponse = Depends(get_current_user),
):
    repo = request.app.state.user_repo
    user = await repo.get_user_by_username(current_user.username)
    if not user or not verify_password(password_in.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if verify_password(password_in.new_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="New password must be different.")
    await repo.update_password(current_user.username, get_password_hash(password_in.new_password))
    return {"message": "Password changed. Sign in again on all devices."}


@router.post("/forgot-password")
async def forgot_password(request: Request, reset_in: ForgotPasswordRequest):
    repo = request.app.state.user_repo
    user = await repo.get_user_by_email(reset_in.email)
    if user:
        token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        settings = get_settings()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.password_reset_expire_minutes)
        await repo.create_password_reset_token(user["username"], token_hash, expires_at)
        reset_url = f"{settings.frontend_url.rstrip('/')}/reset-password?token={token}"
        await email_service.send_password_reset(user["email"], reset_url)
    return {"message": "If that email belongs to an account, a reset link has been sent."}


@router.post("/reset-password")
async def reset_password(request: Request, reset_in: ResetPasswordRequest):
    token_hash = hashlib.sha256(reset_in.token.encode()).hexdigest()
    repo = request.app.state.user_repo
    reset_record = await repo.consume_password_reset_token(token_hash)
    if not reset_record:
        raise HTTPException(status_code=400, detail="Reset link is invalid or has expired.")
    await repo.update_password(reset_record["username"], get_password_hash(reset_in.new_password))
    return {"message": "Password reset successfully. You can now sign in."}


@router.delete("/users/{username}")
async def admin_delete_user(
    username: str,
    request: Request,
    current_user: UserResponse = Depends(require_role(["admin"])),
):
    """Admin deletes a user. Cannot delete your own account."""
    if username == current_user.username:
        raise HTTPException(
            status_code=400, detail="You cannot delete your own account."
        )

    repo = request.app.state.user_repo
    deleted = await repo.delete_user(username)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="User not found.")

    return {"message": f"User '{username}' deleted successfully."}
