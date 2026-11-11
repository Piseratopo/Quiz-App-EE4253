require('dotenv').config();

const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');
const { seedData } = require('./scripts/initDb');

const app = express();
const port = Number(process.env.PORT || 8000);
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz_app', {
   serverSelectionTimeoutMS: 5000,
});
const db = client.db(process.env.MONGODB_DB_NAME || 'quiz_app');
const jwtSecret = process.env.JWT_SECRET || 'your_fallback_secret_key';

app.use(cors());
app.use(express.json());

function asObjectId(value) {
   return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function serializeQuestion(question, includeId = true) {
   const result = {
      question: question.question,
      question_type: question.question_type,
      correct_answers: JSON.stringify(question.correct_answers || []),
      possible_answers: JSON.stringify(question.possible_answers || []),
      attempt_count: question.attempt_count || 0,
      correct_count: question.correct_count || 0,
      shuffle: question.shuffle ?? true,
      created_by: question.created_by.toString(),
   };
   if (includeId) result.id = question._id.toString();
   return result;
}

function questionFilter(query) {
   const filter = {};
   if (query.search) {
      const escaped = query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.question = { $regex: escaped, $options: 'i' };
   }
   if (query.user) {
      const user = asObjectId(query.user);
      if (!user) return null;
      filter.created_by = user;
   }
   return filter;
}

function requireToken(req, res, next) {
   const [scheme, token] = (req.get('Authorization') || '').split(' ');
   if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return res.status(401).json({ error: 'Invalid token format' });
   }
   try {
      req.tokenPayload = jwt.verify(token, jwtSecret);
      return next();
   } catch {
      return res.status(401).json({ error: 'Invalid token' });
   }
}

function issueToken(user) {
   return jwt.sign({ user_id: user._id.toString(), username: user.username }, jwtSecret, { expiresIn: '1d' });
}

app.get('/api/questions', async (req, res, next) => {
   try {
      const filter = questionFilter(req.query);
      if (!filter) return res.json({});
      let cursor = db.collection('questions').find(filter).sort({ _id: -1 });
      const page = Number(req.query.page);
      if (Number.isInteger(page) && page > 0) cursor = cursor.skip((page - 1) * 5).limit(5);
      const questions = await cursor.toArray();
      return res.json(Object.fromEntries(questions.map((question) => [question._id.toString(), serializeQuestion(question, false)])));
   } catch (error) { next(error); }
});

app.get('/api/questions/count', async (req, res, next) => {
   try {
      const filter = questionFilter(req.query);
      return res.json({ count: filter ? await db.collection('questions').countDocuments(filter) : 0 });
   } catch (error) { next(error); }
});

app.get('/api/questions-set', requireToken, async (req, res, next) => {
   const count = Number(req.query.count);
   if (!Number.isInteger(count) || count < 1) return res.status(400).json({ error: 'count must be a positive integer' });
   try {
      const questions = await db.collection('questions').aggregate([{ $sample: { size: count } }]).toArray();
      return res.json(questions.map((question) => serializeQuestion(question)));
   } catch (error) { next(error); }
});

app.post('/api/questions', requireToken, async (req, res, next) => {
   const { question, question_type, shuffle = true } = req.body || {};
   if (!question || !question_type) return res.status(400).json({ error: 'question and question_type are required' });
   const correct_answers = [...new Set(req.body.correct_answers || [])];
   const possible_answers = [...new Set([...(req.body.possible_answers || []), ...correct_answers])];
   if (!correct_answers.length || !possible_answers.length) return res.status(400).json({ error: 'At least one correct and possible answer is required' });
   const created_by = asObjectId(req.tokenPayload.user_id);
   if (!created_by) return res.status(401).json({ error: 'Invalid token' });
   try {
      const result = await db.collection('questions').insertOne({ question, question_type, correct_answers, possible_answers,
         attempt_count: 0, correct_count: 0, shuffle: Boolean(shuffle), created_by, created_at: new Date() });
      return res.status(201).json({ message: 'Question added successfully', question_id: result.insertedId.toString() });
   } catch (error) { next(error); }
});

app.delete('/api/questions/:questionId', requireToken, async (req, res, next) => {
   const questionId = asObjectId(req.params.questionId);
   const userId = asObjectId(req.tokenPayload.user_id);
   if (!questionId) return res.status(400).json({ error: 'Invalid question id' });
   try {
      const result = await db.collection('questions').deleteOne({ _id: questionId, created_by: userId });
      if (!result.deletedCount) return res.status(404).json({ error: 'Question not found or not owned by user' });
      await db.collection('wrong_responses').deleteMany({ question_id: questionId });
      return res.json({ message: 'Question deleted successfully' });
   } catch (error) { next(error); }
});

app.get('/api/wrong-responses', requireToken, async (req, res, next) => {
   const count = Number(req.query.count);
   if (!Number.isInteger(count) || count < 1) return res.status(400).json({ error: 'count must be a positive integer' });
   const userId = asObjectId(req.tokenPayload.user_id);
   try {
      const records = await db.collection('wrong_responses').find({ user_id: userId }, { projection: { question_id: 1 } }).toArray();
      if (!records.length) return res.json([]);
      const questions = await db.collection('questions').aggregate([
         { $match: { _id: { $in: records.map((record) => record.question_id) } } }, { $sample: { size: count } },
      ]).toArray();
      return res.json(questions.map((question) => serializeQuestion(question)));
   } catch (error) { next(error); }
});

app.get('/api/wrong-responses/count', requireToken, async (req, res, next) => {
   try {
      return res.json({ count: await db.collection('wrong_responses').countDocuments({ user_id: asObjectId(req.tokenPayload.user_id) }) });
   } catch (error) { next(error); }
});

app.post('/api/wrong-responses', requireToken, updateWrongResponses);
app.delete('/api/wrong-responses', requireToken, updateWrongResponses);
async function updateWrongResponses(req, res, next) {
   if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected a list of question IDs' });
   const questionIds = req.body.map(asObjectId);
   if (questionIds.some((id) => !id)) return res.status(400).json({ error: 'Invalid question id' });
   const userId = asObjectId(req.tokenPayload.user_id);
   try {
      const records = db.collection('wrong_responses');
      if (req.method === 'POST') {
         await Promise.all(questionIds.map((question_id) => records.updateOne({ user_id: userId, question_id }, { $setOnInsert: { user_id: userId, question_id } }, { upsert: true })));
         return res.status(201).json({ message: 'Wrong responses added successfully' });
      }
      await records.deleteMany({ user_id: userId, question_id: { $in: questionIds } });
      return res.json({ message: 'Wrong responses removed successfully' });
   } catch (error) { next(error); }
}

app.post('/api/register', async (req, res, next) => {
   const { username, password } = req.body || {};
   if (!username || !password) return res.status(400).json({ error: 'Missing required fields' });
   if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
   try {
      const user = { username, username_normalized: username.toLocaleLowerCase(), password_hash: await bcrypt.hash(password, 12), role: 'user', created_at: new Date() };
      const result = await db.collection('users').insertOne(user);
      user._id = result.insertedId;
      return res.status(201).json({ token: issueToken(user), id: user._id.toString(), user: username });
   } catch (error) {
      if (error.code === 11000) return res.status(400).json({ error: 'Username already exists' });
      return next(error);
   }
});

app.post('/api/login', async (req, res, next) => {
   const { username, password } = req.body || {};
   if (!username || !password) return res.status(400).json({ error: 'Missing username or password' });
   try {
      const user = await db.collection('users').findOne({ username_normalized: username.toLocaleLowerCase() });
      if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: 'Invalid credentials' });
      return res.json({ token: issueToken(user), id: user._id.toString(), user: user.username });
   } catch (error) { next(error); }
});

app.patch('/api/update-username', requireToken, async (req, res, next) => {
   const username = req.body?.username;
   if (!username) return res.status(400).json({ error: 'New username is required' });
   try {
      const result = await db.collection('users').updateOne({ _id: asObjectId(req.tokenPayload.user_id) }, { $set: { username, username_normalized: username.toLocaleLowerCase() } });
      if (!result.matchedCount) return res.status(400).json({ error: 'User not found' });
      return res.json({ message: 'Username updated successfully', new_username: username });
   } catch (error) {
      if (error.code === 11000) return res.status(400).json({ error: 'Username already exists' });
      return next(error);
   }
});

app.patch('/api/update-password', requireToken, async (req, res, next) => {
   const { oldPassword, newPassword } = req.body || {};
   if (!newPassword) return res.status(400).json({ error: 'New password is required' });
   if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
   try {
      const user = await db.collection('users').findOne({ _id: asObjectId(req.tokenPayload.user_id) });
      if (!user || !(await bcrypt.compare(oldPassword || '', user.password_hash))) return res.status(400).json({ error: 'The old password is incorrect' });
      await db.collection('users').updateOne({ _id: user._id }, { $set: { password_hash: await bcrypt.hash(newPassword, 12) } });
      return res.json({ message: 'Password updated successfully' });
   } catch (error) { next(error); }
});

// ==========================================
// LEARNING SYSTEM APIs (Topics, Chapters, Lessons)
// ==========================================

// Helper: Normalize discipline query
function normalizeDiscipline(disc) {
   if (!disc) return null;
   if (disc === 'phys' || disc === 'physics') return ['phys', 'physics'];
   if (disc === 'math' || disc === 'maths') return ['math', 'maths'];
   return [disc];
}

// Admin Topics API - returns topics with chapter, lesson, and exercise counts
app.get('/api/admin/topics', async (req, res, next) => {
   try {
      const filter = {};
      if (req.query.discipline) {
         filter.discipline = { $in: normalizeDiscipline(req.query.discipline) };
      }
      if (req.query.status) {
         if (req.query.status === 'active') {
            filter.isActive = { $ne: false };
         } else if (req.query.status === 'inactive') {
            filter.isActive = false;
         }
      }
      if (req.query.search) {
         const escaped = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
         filter.$or = [
            { title: { $regex: escaped, $options: 'i' } },
            { slug: { $regex: escaped, $options: 'i' } },
         ];
      }

      const topics = await db.collection('topics')
         .find(filter)
         .sort({ order: 1, _id: 1 })
         .toArray();

      const topicIds = topics.map((t) => t._id);
      const chapters = await db.collection('chapters').find({ topicId: { $in: topicIds } }).toArray();
      const chapterIds = chapters.map((c) => c._id);
      const lessons = await db.collection('lessons').find({ chapterId: { $in: chapterIds } }).toArray();

      const enrichedTopics = topics.map((topic) => {
         const topicChapters = chapters.filter((c) => c.topicId && c.topicId.equals(topic._id));
         const topicChapterIds = topicChapters.map((c) => c._id.toString());
         const topicLessons = lessons.filter((l) => l.chapterId && topicChapterIds.includes(l.chapterId.toString()));
         const exercisesCount = topicLessons.reduce((acc, l) => {
            const exs = (l.sections || []).filter((s) => s.type === 'exercise');
            return acc + exs.length;
         }, 0);

         return {
            ...topic,
            chaptersCount: topicChapters.length,
            lessonsCount: topicLessons.length,
            exercisesCount,
         };
      });

      // Overall metrics
      const totalTopics = await db.collection('topics').countDocuments();
      const totalLessons = await db.collection('lessons').countDocuments();
      const allLessons = await db.collection('lessons').find({}, { projection: { sections: 1 } }).toArray();
      const totalExercises = allLessons.reduce((acc, l) => {
         const exs = (l.sections || []).filter((s) => s.type === 'exercise');
         return acc + exs.length;
      }, 0);

      return res.json({
         topics: enrichedTopics,
         metrics: {
            totalTopics,
            totalLessons,
            totalExercises,
         },
      });
   } catch (error) { next(error); }
});

// Create a new topic
app.post('/api/topics', async (req, res, next) => {
   try {
      const { title, slug, description, discipline, thumbnail, order, isActive } = req.body || {};
      if (!title || !slug) {
         return res.status(400).json({ error: 'Tiêu đề và Slug là bắt buộc' });
      }
      const existing = await db.collection('topics').findOne({ slug });
      if (existing) {
         return res.status(400).json({ error: 'Slug đã tồn tại. Vui lòng chọn slug khác.' });
      }
      const count = await db.collection('topics').countDocuments();
      const newTopic = {
         title,
         slug,
         description: description || '',
         discipline: discipline || 'physics',
         thumbnail: thumbnail || '',
         order: Number(order) || count + 1,
         isActive: isActive !== false,
         createdAt: new Date(),
         updatedAt: new Date(),
      };
      const result = await db.collection('topics').insertOne(newTopic);
      return res.status(201).json({ ...newTopic, _id: result.insertedId });
   } catch (error) { next(error); }
});

// Update topic details
app.put('/api/topics/:id', async (req, res, next) => {
   try {
      const id = asObjectId(req.params.id);
      if (!id) return res.status(400).json({ error: 'ID không hợp lệ' });
      const { title, slug, description, discipline, thumbnail, order, isActive } = req.body || {};
      if (slug) {
         const conflict = await db.collection('topics').findOne({ slug, _id: { $ne: id } });
         if (conflict) {
            return res.status(400).json({ error: 'Slug đã tồn tại ở chủ đề khác.' });
         }
      }
      const updateData = { updatedAt: new Date() };
      if (title !== undefined) updateData.title = title;
      if (slug !== undefined) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (discipline !== undefined) updateData.discipline = discipline;
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
      if (order !== undefined) updateData.order = Number(order);
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      await db.collection('topics').updateOne({ _id: id }, { $set: updateData });
      const updated = await db.collection('topics').findOne({ _id: id });
      return res.json(updated);
   } catch (error) { next(error); }
});

// Toggle topic isActive
app.patch('/api/topics/:id/toggle-status', async (req, res, next) => {
   try {
      const id = asObjectId(req.params.id);
      if (!id) return res.status(400).json({ error: 'ID không hợp lệ' });
      const topic = await db.collection('topics').findOne({ _id: id });
      if (!topic) return res.status(404).json({ error: 'Không tìm thấy chủ đề' });
      const newStatus = !topic.isActive;
      await db.collection('topics').updateOne(
         { _id: id },
         { $set: { isActive: newStatus, updatedAt: new Date() } }
      );
      return res.json({ _id: id, isActive: newStatus });
   } catch (error) { next(error); }
});

// Delete topic and its chapters + lessons
app.delete('/api/topics/:id', async (req, res, next) => {
   try {
      const id = asObjectId(req.params.id);
      if (!id) return res.status(400).json({ error: 'ID không hợp lệ' });
      const chapters = await db.collection('chapters').find({ topicId: id }).toArray();
      const chapterIds = chapters.map((c) => c._id);
      await db.collection('lessons').deleteMany({ chapterId: { $in: chapterIds } });
      await db.collection('chapters').deleteMany({ topicId: id });
      await db.collection('topics').deleteOne({ _id: id });
      return res.json({ message: 'Chuyên đề và các chương bài liên quan đã được xóa thành công.' });
   } catch (error) { next(error); }
});

// 1. Get all active topics (public catalog)
app.get('/api/topics', async (req, res, next) => {
   try {
      const filter = req.query.all === 'true' ? {} : { isActive: { $ne: false } };
      if (req.query.discipline) {
         filter.discipline = { $in: normalizeDiscipline(req.query.discipline) };
      }
      const topics = await db.collection('topics')
         .find(filter)
         .sort({ order: 1 })
         .toArray();
      return res.json(topics);
   } catch (error) { next(error); }
});

// 2. Get topic by slug with its chapters and lessons summary
app.get('/api/topics/:slug', async (req, res, next) => {
   try {
      const topic = await db.collection('topics').findOne({ slug: req.params.slug });
      if (!topic) return res.status(404).json({ error: 'Topic not found' });

      const chapters = await db.collection('chapters')
         .find({ topicId: topic._id })
         .sort({ order: 1 })
         .toArray();

      const chapterIds = chapters.map((c) => c._id);
      const lessons = await db.collection('lessons')
         .find({ chapterId: { $in: chapterIds } }, { projection: { sections: 0 } })
         .sort({ order: 1 })
         .toArray();

      const chaptersWithLessons = chapters.map((chap) => ({
         ...chap,
         lessons: lessons.filter((l) => l.chapterId.equals(chap._id)),
      }));

      return res.json({ ...topic, chapters: chaptersWithLessons });
   } catch (error) { next(error); }
});

// 3. Get lesson details (sanitized: solution is hidden from client)
app.get('/api/lessons/:lessonId', async (req, res, next) => {
   const lessonId = asObjectId(req.params.lessonId);
   if (!lessonId) return res.status(400).json({ error: 'Invalid lesson id' });

   try {
      const lesson = await db.collection('lessons').findOne({ _id: lessonId });
      if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

      // Strip solutions from exercises before returning to client
      const sanitizedSections = (lesson.sections || []).map((sec) => {
         if (sec.type === 'exercise' && sec.exercise) {
            const { solution, ...safeExercise } = sec.exercise;
            return { ...sec, exercise: safeExercise };
         }
         return sec;
      });

      return res.json({ ...lesson, sections: sanitizedSections });
   } catch (error) { next(error); }
});

// 4. Submit an exercise answer and receive grading & explanation
app.post('/api/lessons/:lessonId/exercises/:sectionIndex/submit', requireToken, async (req, res, next) => {
   const lessonId = asObjectId(req.params.lessonId);
   const sectionIndex = Number(req.params.sectionIndex);
   const { answer } = req.body || {};

   if (!lessonId || !Number.isInteger(sectionIndex)) {
      return res.status(400).json({ error: 'Invalid parameters' });
   }

   try {
      const lesson = await db.collection('lessons').findOne({ _id: lessonId });
      if (!lesson || !lesson.sections || !lesson.sections[sectionIndex]) {
         return res.status(404).json({ error: 'Exercise section not found' });
      }

      const sec = lesson.sections[sectionIndex];
      if (sec.type !== 'exercise' || !sec.exercise) {
         return res.status(400).json({ error: 'Section is not an exercise' });
      }

      const { type, solution, explanation } = sec.exercise;
      let isCorrect = false;

      // Polymorphic grading based on exercise type
      if (type === 'mcq_single') {
         isCorrect = Boolean(solution && answer === solution.correctAnswer);
      } else if (type === 'mcq_multiple') {
         const expected = Array.isArray(solution?.correctAnswers) ? solution.correctAnswers.sort() : [];
         const given = Array.isArray(answer) ? [...answer].sort() : [];
         isCorrect = JSON.stringify(expected) === JSON.stringify(given);
      } else if (type === 'fill_blank') {
         if (typeof solution?.correctValue === 'number') {
            const numAns = Number(answer);
            const tolerance = solution.tolerance || 0.01;
            isCorrect = !isNaN(numAns) && Math.abs(numAns - solution.correctValue) <= tolerance;
         } else {
            isCorrect = String(answer || '').trim().toLowerCase() === String(solution?.correctValue || '').trim().toLowerCase();
         }
      } else {
         isCorrect = JSON.stringify(answer) === JSON.stringify(solution);
      }

      return res.json({
         isCorrect,
         explanation: explanation || '',
         solution: solution || null,
      });
   } catch (error) { next(error); }
});

app.use((error, req, res, next) => {
   console.error(error);
   res.status(500).json({ error: 'Internal server error' });
});

async function start() {
   await client.connect();
   await Promise.all([
      db.collection('users').createIndex({ username_normalized: 1 }, { unique: true }),
      db.collection('questions').createIndex({ created_by: 1, created_at: -1 }),
      db.collection('wrong_responses').createIndex({ user_id: 1, question_id: 1 }, { unique: true }),
      // Learning System Collections & Indexes
      db.collection('topics').createIndex({ slug: 1 }, { unique: true }),
      db.collection('topics').createIndex({ isActive: 1, order: 1 }),
      db.collection('topics').createIndex({ discipline: 1, order: 1 }),
      db.collection('chapters').createIndex({ topicId: 1, order: 1 }),
      db.collection('lessons').createIndex({ chapterId: 1, order: 1 }),
   ]);

   // Ensure existing topics have discipline and thumbnail populated
   await db.collection('topics').updateOne(
      { slug: 'co-hoc-co-dien' },
      {
         $set: {
            thumbnail: 'https://res.cloudinary.com/dbs8tddkg/image/upload/v1794192698/classical_mechanics_iddoha.png',
            discipline: 'physics',
            isActive: true,
         },
      }
   );

   // Ensure Nhiệt động lực học exists with thumbnail
   const thermoExists = await db.collection('topics').findOne({ slug: 'nhiet-dong-luc-hoc' });
   if (!thermoExists) {
      const thermoId = new ObjectId();
      await db.collection('topics').insertOne({
         _id: thermoId,
         title: 'Nhiệt động lực học',
         slug: 'nhiet-dong-luc-hoc',
         description: 'Các nguyên lý bảo toàn nhiệt lượng, entropy, chu trình Carnot và động học phân tử chất khí.',
         discipline: 'physics',
         thumbnail: 'https://res.cloudinary.com/dbs8tddkg/image/upload/f_auto/q_auto/thermodynamics_veaum5.png',
         order: 2,
         isActive: true,
         createdAt: new Date(),
         updatedAt: new Date(),
      });

      const chapThermoId = new ObjectId();
      await db.collection('chapters').insertOne({
         _id: chapThermoId,
         topicId: thermoId,
         name: 'Nguyên lý I Nhiệt động lực học',
         description: 'Độ biến thiên nội năng, công và nhiệt lượng trong các đẳng quá trình.',
         order: 1,
         createdAt: new Date(),
         updatedAt: new Date(),
      });

      await db.collection('lessons').insertOne({
         _id: new ObjectId(),
         chapterId: chapThermoId,
         title: 'Nội năng, Nhiệt lượng và Công',
         description: 'Hệ thức của Nguyên lý I: dU = dA + dQ và ứng dụng tính công chất khí.',
         order: 1,
         sections: [
            {
               title: 'I. Lý thuyết Nguyên lý I',
               order: 1,
               type: 'doc',
               docContent: {
                  format: 'markdown',
                  body: `### 1. Phát biểu Nguyên lý I
Độ biến thiên nội năng $\\Delta U$ của hệ bằng tổng công $A$ và nhiệt lượng $Q$ mà hệ nhận được:
$$\\Delta U = A + Q$$

### 2. Quy ước dấu
- $Q > 0$: Hệ **nhận** nhiệt lượng; $Q < 0$: Hệ **truyền** nhiệt lượng.
- $A > 0$: Hệ **nhận** công; $A < 0$: Hệ **sinh** công ($A' = -A > 0$).

### 3. Áp dụng cho các đẳng quá trình
- **Đẳng tích ($V = \\text{const}$):** Khí không sinh công ($A = 0$), do đó $\\Delta U = Q$.
- **Đẳng nhiệt ($T = \\text{const}$):** Đối với khí lý tưởng, nội năng không đổi ($\\Delta U = 0$), do đó $Q = -A = A'$ (nhiệt lượng nhận vào chuyển hết thành công sinh ra).
`,
                  attachments: [],
               },
            },
            {
               title: 'II. Bài tập trắc nghiệm',
               order: 2,
               type: 'exercise',
               exercise: {
                  type: 'mcq_single',
                  question: 'Một khối khí lý tưởng nhận nhiệt lượng $Q = 100\\text{ J}$ từ nguồn nóng và đồng thời thực hiện một công $A\' = 40\\text{ J}$ lên môi trường. Độ biến thiên nội năng $\\Delta U$ của khối khí là:',
                  mediaList: [],
                  payload: {
                     options: [
                        { id: 'ans_1', label: '$\\Delta U = 60\\text{ J}$' },
                        { id: 'ans_2', label: '$\\Delta U = 140\\text{ J}$' },
                        { id: 'ans_3', label: '$\\Delta U = -60\\text{ J}$' },
                        { id: 'ans_4', label: '$\\Delta U = 40\\text{ J}$' },
                     ],
                  },
                  solution: {
                     correctAnswer: 'ans_1',
                  },
                  explanation: 'Hệ nhận nhiệt lượng nên $Q = +100\\text{ J}$.\nHệ sinh công $A\' = 40\\text{ J}$, nghĩa là công hệ nhận vào là $A = -A\' = -40\\text{ J}$.\nÁp dụng Nguyên lý I:\n$$\\Delta U = A + Q = -40 + 100 = 60\\text{ J}$$',
               },
            },
         ],
         createdAt: new Date(),
         updatedAt: new Date(),
      });
   } else {
      await db.collection('topics').updateOne(
         { slug: 'nhiet-dong-luc-hoc' },
         {
            $set: {
               thumbnail: 'https://res.cloudinary.com/dbs8tddkg/image/upload/f_auto/q_auto/thermodynamics_veaum5.png',
               discipline: 'physics',
               isActive: true,
            },
         }
      );
   }

   // Gán mặc định isActive cho các môn chưa có thuộc tính này
   await db.collection('topics').updateMany(
      { slug: { $nin: ['co-hoc-co-dien', 'nhiet-dong-luc-hoc'] }, isActive: { $exists: false } },
      { $set: { isActive: false } }
   );

   // Auto-seed if database is clean
   const topicCount = await db.collection('topics').countDocuments();
   if (topicCount === 0) {
      await seedData(db);
   }

   app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
}

start().catch((error) => {
   console.error('Unable to start MongoDB connection:', error.message);
   process.exit(1);
});
