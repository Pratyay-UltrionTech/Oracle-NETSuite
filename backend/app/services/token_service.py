from jose import jwt
from datetime import datetime, timedelta

from ..config import settings

SECRET_KEY = settings.JWT_SECRET
ALGORITHM = "HS256"

def generate_action_token(submission_id, user_id, action):
    expire = datetime.utcnow() + timedelta(minutes=30)
    payload = {
        "submissionId": str(submission_id),
        "userId": str(user_id),
        "action": action,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
