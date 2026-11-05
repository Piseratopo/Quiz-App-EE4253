import os
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from dotenv import load_dotenv
from flask import jsonify, make_response, request
from pymongo.errors import DuplicateKeyError, PyMongoError

from database import get_database

load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET", "your_fallback_secret_key")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DELTA = timedelta(days=1)


def validate_password(password):
    return len(password) >= 8


def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password)


def generate_jwt_token(user_id, username):
    return jwt.encode({"user_id": str(user_id), "username": username,
                       "exp": datetime.now(timezone.utc) + JWT_EXPIRATION_DELTA}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def validate_jwt_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def require_token(func):
    @wraps(func)
    def decorated_function(*args, **kwargs):
        parts = request.headers.get("Authorization", "").split(" ", 1)
        if len(parts) != 2 or parts[0].lower() != "bearer":
            return make_response(jsonify({"error": "Invalid token format"}), 401)
        decoded = validate_jwt_token(parts[1])
        if not decoded:
            return make_response(jsonify({"error": "Invalid token"}), 401)
        request.token_payload = decoded
        return func(*args, **kwargs)
    return decorated_function


def register_user(username, password):
    if not validate_password(password):
        return False, "Password must be at least 8 characters"
    try:
        user = {"username": username, "username_normalized": username.casefold(),
                "password_hash": hash_password(password), "role": "user", "created_at": datetime.now(timezone.utc)}
        result = get_database().users.insert_one(user)
        return True, (generate_jwt_token(result.inserted_id, username), str(result.inserted_id), username)
    except DuplicateKeyError:
        return False, "Username already exists"
    except PyMongoError:
        return False, "Registration failed"


def login_user(username, password):
    try:
        user = get_database().users.find_one({"username_normalized": username.casefold()})
        if user and verify_password(password, user["password_hash"]):
            return True, (generate_jwt_token(user["_id"], user["username"]), str(user["_id"]), user["username"])
        return False, "Invalid credentials"
    except PyMongoError:
        return False, "Login failed"


def update_username(user_id, new_username):
    try:
        result = get_database().users.update_one({"_id": _object_id(user_id)}, {"$set": {"username": new_username, "username_normalized": new_username.casefold()}})
        return (True, "Username updated successfully") if result.matched_count else (False, "User not found")
    except DuplicateKeyError:
        return False, "Username already exists"
    except (PyMongoError, ValueError):
        return False, "Username update failed"


def update_password(user_id, old_password, new_password):
    if not validate_password(new_password):
        return False, "Password must be at least 8 characters"
    try:
        users = get_database().users
        user = users.find_one({"_id": _object_id(user_id)})
        if not user or not verify_password(old_password or "", user["password_hash"]):
            return False, "The old password is incorrect"
        users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(new_password)}})
        return True, "Password updated successfully"
    except (PyMongoError, ValueError):
        return False, "Password update failed"


def _object_id(value):
    from bson import ObjectId
    return ObjectId(value)
