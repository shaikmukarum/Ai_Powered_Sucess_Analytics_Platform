from pydantic import BaseModel, Field


class SessionTokenIn(BaseModel):
    access_token: str = Field(min_length=20)


class AuthUser(BaseModel):
    email: str
    name: str
    role: str
    department: str
    mode: str = "live"