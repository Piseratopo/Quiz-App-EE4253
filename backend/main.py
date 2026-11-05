import json
from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from flask import Flask, jsonify, make_response, request
from flask_cors import CORS
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import PyMongoError

from auth import login_user, register_user, require_token, update_password, update_username
from database import get_database

app = Flask(__name__)
CORS(app)
PORT = 8000


def object_id(value):
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


def serialize_question(question, include_id=True):
    result = {"question": question["question"], "question_type": question["question_type"],
              "correct_answers": json.dumps(question.get("correct_answers", [])),
              "possible_answers": json.dumps(question.get("possible_answers", [])),
              "attempt_count": question.get("attempt_count", 0), "correct_count": question.get("correct_count", 0),
              "shuffle": question.get("shuffle", True), "created_by": str(question["created_by"])}
    if include_id:
        result["id"] = str(question["_id"])
    return result


def question_filter():
    filters = {}
    if search := request.args.get("search"):
        filters["question"] = {"$regex": search, "$options": "i"}
    if user_id := request.args.get("user"):
        creator = object_id(user_id)
        if creator is None:
            return None
        filters["created_by"] = creator
    return filters


def ensure_indexes():
    db = get_database()
    db.users.create_index([("username_normalized", ASCENDING)], unique=True)
    db.questions.create_index([("created_by", ASCENDING), ("created_at", DESCENDING)])
    db.wrong_responses.create_index([("user_id", ASCENDING), ("question_id", ASCENDING)], unique=True)


@app.route("/api/questions", methods=["GET"])
def get_questions():
    try:
        filters = question_filter()
        if filters is None:
            return jsonify({})
        cursor = get_database().questions.find(filters).sort("_id", DESCENDING)
        if page := request.args.get("page", type=int):
            cursor = cursor.skip(max(page - 1, 0) * 5).limit(5)
        return jsonify({str(q["_id"]): serialize_question(q, include_id=False) for q in cursor})
    except PyMongoError as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/questions/count", methods=["GET"])
def get_questions_count():
    try:
        filters = question_filter()
        return jsonify({"count": 0 if filters is None else get_database().questions.count_documents(filters)})
    except PyMongoError as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/questions-set", methods=["GET"])
@require_token
def get_questions_set():
    count = request.args.get("count", type=int)
    if not count or count < 1:
        return jsonify({"error": "count must be a positive integer"}), 400
    try:
        questions = list(get_database().questions.aggregate([{"$sample": {"size": count}}]))
        return jsonify([serialize_question(question) for question in questions])
    except PyMongoError as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/questions", methods=["POST"])
@require_token
def add_question():
    data = request.get_json(silent=True)
    if not data or not all(data.get(key) for key in ("question", "question_type")):
        return jsonify({"error": "question and question_type are required"}), 400
    correct_answers = list(dict.fromkeys(data.get("correct_answers", [])))
    possible_answers = list(dict.fromkeys(data.get("possible_answers", []) + correct_answers))
    if not correct_answers or not possible_answers:
        return jsonify({"error": "At least one correct and possible answer is required"}), 400
    try:
        question = {"question": data["question"], "question_type": data["question_type"],
                    "correct_answers": correct_answers, "possible_answers": possible_answers,
                    "attempt_count": 0, "correct_count": 0, "shuffle": data.get("shuffle", True),
                    "created_by": ObjectId(request.token_payload["user_id"]), "created_at": datetime.now(timezone.utc)}
        result = get_database().questions.insert_one(question)
        return jsonify({"message": "Question added successfully", "question_id": str(result.inserted_id)}), 201
    except (PyMongoError, InvalidId) as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/questions/<question_id>", methods=["DELETE"])
@require_token
def delete_question(question_id):
    question = object_id(question_id)
    if question is None:
        return jsonify({"error": "Invalid question id"}), 400
    try:
        db = get_database()
        result = db.questions.delete_one({"_id": question, "created_by": ObjectId(request.token_payload["user_id"])})
        if not result.deleted_count:
            return jsonify({"error": "Question not found or not owned by user"}), 404
        db.wrong_responses.delete_many({"question_id": question})
        return jsonify({"message": "Question deleted successfully"})
    except (PyMongoError, InvalidId) as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/wrong-responses", methods=["GET"])
@require_token
def get_wrong_responses():
    count = request.args.get("count", type=int)
    if not count or count < 1:
        return jsonify({"error": "count must be a positive integer"}), 400
    try:
        user = ObjectId(request.token_payload["user_id"])
        db = get_database()
        ids = [row["question_id"] for row in db.wrong_responses.find({"user_id": user})]
        questions = list(db.questions.aggregate([{"$match": {"_id": {"$in": ids}}}, {"$sample": {"size": count}}])) if ids else []
        return jsonify([serialize_question(question) for question in questions])
    except (PyMongoError, InvalidId) as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/wrong-responses/count", methods=["GET"])
@require_token
def count_wrong_responses():
    try:
        count = get_database().wrong_responses.count_documents({"user_id": ObjectId(request.token_payload["user_id"])})
        return jsonify({"count": count})
    except (PyMongoError, InvalidId) as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/wrong-responses", methods=["POST", "DELETE"])
@require_token
def update_wrong_responses():
    ids = request.get_json(silent=True)
    if not isinstance(ids, list):
        return jsonify({"error": "Expected a list of question IDs"}), 400
    question_ids = [object_id(value) for value in ids]
    if any(value is None for value in question_ids):
        return jsonify({"error": "Invalid question id"}), 400
    try:
        records = get_database().wrong_responses
        user = ObjectId(request.token_payload["user_id"])
        if request.method == "POST":
            for question in question_ids:
                records.update_one({"user_id": user, "question_id": question}, {"$setOnInsert": {"user_id": user, "question_id": question}}, upsert=True)
            return jsonify({"message": "Wrong responses added successfully"}), 201
        records.delete_many({"user_id": user, "question_id": {"$in": question_ids}})
        return jsonify({"message": "Wrong responses removed successfully"})
    except (PyMongoError, InvalidId) as error:
        return jsonify({"error": str(error)}), 500


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    if not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing required fields"}), 400
    success, result = register_user(data["username"], data["password"])
    return (jsonify({"token": result[0], "id": result[1], "user": data["username"]}), 201) if success else (jsonify({"error": result}), 400)


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    if not data.get("username") or not data.get("password"):
        return jsonify({"error": "Missing username or password"}), 400
    success, result = login_user(data["username"], data["password"])
    return (jsonify({"token": result[0], "id": result[1], "user": result[2]}), 200) if success else (jsonify({"error": result}), 401)


@app.route("/api/update-username", methods=["PATCH"])
@require_token
def update_username_route():
    username = (request.get_json(silent=True) or {}).get("username")
    if not username:
        return jsonify({"error": "New username is required"}), 400
    success, message = update_username(request.token_payload["user_id"], username)
    return (jsonify({"message": message, "new_username": username}), 200) if success else (jsonify({"error": message}), 400)


@app.route("/api/update-password", methods=["PATCH"])
@require_token
def update_password_route():
    data = request.get_json(silent=True) or {}
    if not data.get("newPassword"):
        return jsonify({"error": "New password is required"}), 400
    success, message = update_password(request.token_payload["user_id"], data.get("oldPassword"), data["newPassword"])
    return (jsonify({"message": message}), 200) if success else (jsonify({"error": message}), 400)


if __name__ == "__main__":
    ensure_indexes()
    app.run(port=PORT, debug=True)
