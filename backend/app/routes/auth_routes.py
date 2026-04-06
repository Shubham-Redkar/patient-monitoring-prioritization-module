from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Literal
from schemas.user_schema import Token, UserCreate, UserResponse
from utils.auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
    require_role,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Only these roles may be self-registered via the public API.
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

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires,
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": user["username"], "role": user["role"]},
    }


@router.post("/register")
async def register(request: Request, user_in: UserCreate):
    if user_in.role not in _REGISTERABLE_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{user_in.role}' cannot be registered via this endpoint. "
            f"Allowed roles: {sorted(_REGISTERABLE_ROLES)}",
        )

    repo = request.app.state.user_repo
    existing_user = await repo.get_user_by_username(user_in.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    hashed_password = get_password_hash(user_in.password)
    new_user = {
        "username": user_in.username,
        "hashed_password": hashed_password,
        "role": user_in.role,
    }
    await repo.create_user(new_user)
    return {"message": "User created successfully"}


@router.get("/me", response_model=Token)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Validate a stored token and return the current user."""
    return {
        "access_token": "",
        "token_type": "bearer",
        "user": {"username": current_user.username, "role": current_user.role},
    }


# ── Admin-only user management ────────────────────────────────────────────────


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
    user_in: dict,
    current_user: UserResponse = Depends(require_role(["admin"])),
):
    """Admin creates a user of any role including admin."""
    username = user_in.get("username", "").strip()
    password = user_in.get("password", "")
    role = user_in.get("role", "")

    if not username or len(username) < 3:
        raise HTTPException(
            status_code=422, detail="Username must be at least 3 characters."
        )
    if not password or len(password) < 8:
        raise HTTPException(
            status_code=422, detail="Password must be at least 8 characters."
        )
    if role not in {"doctor", "nurse", "admin"}:
        raise HTTPException(
            status_code=422, detail="Role must be doctor, nurse, or admin."
        )

    repo = request.app.state.user_repo
    existing = await repo.get_user_by_username(username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists.")

    await repo.create_user(
        {
            "username": username,
            "hashed_password": get_password_hash(password),
            "role": role,
        }
    )
    return {
        "message": f"User '{username}' created successfully.",
        "username": username,
        "role": role,
    }


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
