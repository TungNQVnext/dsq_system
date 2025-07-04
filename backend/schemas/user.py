from pydantic import BaseModel

class LoginInput(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    username: str
    role: str