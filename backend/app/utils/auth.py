from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
import bcrypt
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import OAuth2PasswordBearer
from schemas.user_schema import UserResponse
from core.config import get_settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except ValueError:
        return False


def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    s = get_settings()
    encoded_jwt = jwt.encode(to_encode, s.jwt_secret_key, algorithm=s.jwt_algorithm)
    return encoded_jwt


async def get_current_user(request: Request, token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        s = get_settings()
        payload = jwt.decode(token, s.jwt_secret_key, algorithms=[s.jwt_algorithm])
        username: str | None = payload.get("sub")
        role: str | None = payload.get("role")
        full_name: str = payload.get("full_name") or ""
        token_version: int = payload.get("token_version", 0)
        if username is None or role is None:
            raise credentials_exception
        token_data = {"username": username, "role": role, "full_name": full_name}
    except jwt.InvalidTokenError:
        raise credentials_exception

    repo = request.app.state.user_repo
    user = await repo.get_user_by_username(token_data["username"])
    if user is None:
        raise credentials_exception
    if user.get("token_version", 0) != token_version:
        raise credentials_exception
    return UserResponse(
        username=user["username"],
        role=user["role"],
        full_name=user.get("full_name", token_data.get("full_name", "")),
        email=user.get("email", ""),
    )


def require_role(allowed_roles: list[str]):
    def role_checker(current_user: UserResponse = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Operation not permitted"
            )
        return current_user

    return role_checker
