// Run with: mongosh "$MONGODB_URI" mongodb-init.js
// Collections are created on their first write, so no schema/bootstrap SQL is needed.
db.users.createIndex({ username_normalized: 1 }, { unique: true });
db.questions.createIndex({ created_by: 1, created_at: -1 });
db.wrong_responses.createIndex({ user_id: 1, question_id: 1 }, { unique: true });
