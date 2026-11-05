"""MongoDB connection helpers shared by the Flask app and auth module."""

import os

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

# MongoClient is thread-safe and owns its connection pool, so it must be
# created once rather than once per request.
client = MongoClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017/quiz_app"), serverSelectionTimeoutMS=5000)
database_name = os.getenv("MONGODB_DB_NAME")


def get_database():
    """Return the configured MongoDB database."""
    return client[database_name] if database_name else client.get_default_database("quiz_app")
