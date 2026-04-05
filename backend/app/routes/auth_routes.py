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

# Only these roles may be self-registered via the API.
# FIX: previously any caller could POST {"role": "admin"} and register an
# admin account without any authentication. Admin accounts must now be
# seeded directly in main.py or via a protected admin-only endpoint.
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
    # FIX: block privileged role registration — admin must be seeded at startup
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
    """Validate a stored token and return the current user. Used by the
    frontend on page load to verify the session is still active."""
    return {
        "access_token": "",  # token already validated; no need to re-issue
        "token_type": "bearer",
        "user": {"username": current_user.username, "role": current_user.role},
    }
