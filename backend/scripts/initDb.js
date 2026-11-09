require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quiz_app';
const dbName = process.env.MONGODB_DB_NAME || 'quiz_app';

async function seedData(db) {
   console.log('\n🌱 Đang nạp dữ liệu mẫu phong phú (Topics, Chapters, Lessons)...');

   // -------------------------------------------------------------
   // TOPIC 1: Cơ học cổ điển
   // -------------------------------------------------------------
   const topic1Id = new ObjectId();
   await db.collection('topics').insertOne({
      _id: topic1Id,
      title: 'Cơ học cổ điển',
      slug: 'co-hoc-co-dien',
      description: 'Nghiên cứu về chuyển động của các vật thể và các định luật Newton nền tảng trong vật lý học.',
      discipline: 'physics',
      thumbnail: 'https://res.cloudinary.com/dbs8tddkg/image/upload/v1794192698/classical_mechanics_iddoha.png',
      order: 1,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   // Chapter 1.1: Động học chất điểm
   const chap1_1Id = new ObjectId();
   await db.collection('chapters').insertOne({
      _id: chap1_1Id,
      topicId: topic1Id,
      name: 'Động học chất điểm',
      description: 'Các đại lượng và phương trình mô tả chuyển động mà chưa xét đến nguyên nhân gây ra chuyển động.',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   // Lesson 1.1.1: Chuyển động thẳng biến đổi đều
   await db.collection('lessons').insertOne({
      _id: new ObjectId(),
      chapterId: chap1_1Id,
      title: 'Chuyển động thẳng biến đổi đều',
      description: 'Vận tốc, gia tốc và phương trình chuyển động thẳng biến đổi đều.',
      order: 1,
      sections: [
         {
            title: 'I. Lý thuyết cốt lõi',
            order: 1,
            type: 'doc',
            docContent: {
               format: 'markdown',
               body: `### 1. Định nghĩa gia tốc
Gia tốc là đại lượng đặc trưng cho sự biến thiên nhanh hay chậm của vận tốc theo thời gian:
$$a = \\frac{\\Delta v}{\\Delta t} = \\text{const}$$

### 2. Các phương trình chuyển động thẳng biến đổi đều
- **Phương trình vận tốc:**
  $$v(t) = v_0 + a \\cdot t$$

- **Phương trình toạ độ (vị trí theo thời gian):**
  $$x(t) = x_0 + v_0 t + \\frac{1}{2} a t^2$$

- **Hệ thức độc lập thời gian (liên hệ giữa vận tốc, gia tốc và quãng đường):**
  $$v^2 - v_0^2 = 2a \\cdot s$$

> **Quy ước dấu:**
> - Nếu chuyển động nhanh dần đều: $a$ và $v$ cùng dấu ($a \\cdot v > 0$).
> - Nếu chuyển động chậm dần đều: $a$ và $v$ trái dấu ($a \\cdot v < 0$).
`,
               attachments: [],
            },
         },
         {
            title: 'II. Bài tập trắc nghiệm 1',
            order: 2,
            type: 'exercise',
            exercise: {
               type: 'mcq_single',
               question: 'Một ô tô đang chuyển động với vận tốc $v_0 = 20\\text{ m/s}$ thì hãm phanh chuyển động chậm dần đều với gia tốc $a = -2\\text{ m/s}^2$. Thời gian xe dừng hẳn ($v = 0$) là:',
               mediaList: [],
               payload: {
                  options: [
                     { id: 'a', label: '$5\\text{ giây}$' },
                     { id: 'b', label: '$10\\text{ giây}$' },
                     { id: 'c', label: '$15\\text{ giây}$' },
                     { id: 'd', label: '$20\\text{ giây}$' },
                  ],
               },
               solution: {
                  correctAnswer: 'b',
               },
               explanation: 'Khi xe dừng hẳn thì $v = 0$.\nÁp dụng phương trình vận tốc:\n$$v = v_0 + a \\cdot t \\implies 0 = 20 + (-2) \\cdot t \\implies t = \\frac{20}{2} = 10\\text{ s}$$',
            },
         },
         {
            title: 'III. Bài tập điền đáp số 2',
            order: 3,
            type: 'exercise',
            exercise: {
               type: 'fill_blank',
               question: 'Một đoàn tàu bắt đầu rời ga chuyển động nhanh dần đều với gia tốc $a = 0.5\\text{ m/s}^2$. Quãng đường tàu đi được sau $20\\text{ s}$ là bao nhiêu mét?',
               mediaList: [],
               payload: {
                  placeholder: 'Nhập số (vd: 100)',
                  unit: 'mét (m)',
               },
               solution: {
                  correctValue: 100,
                  tolerance: 0.1,
               },
               explanation: 'Vì tàu bắt đầu rời ga nên $v_0 = 0$.\nÁp dụng phương trình quãng đường:\n$$s = \\frac{1}{2} a t^2 = \\frac{1}{2} \\cdot 0.5 \\cdot 20^2 = 0.25 \\cdot 400 = 100\\text{ m}$$',
            },
         },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   // Lesson 1.1.2: Chuyển động tròn đều
   await db.collection('lessons').insertOne({
      _id: new ObjectId(),
      chapterId: chap1_1Id,
      title: 'Chuyển động tròn đều và gia tốc hướng tâm',
      description: 'Tốc độ góc, chu kỳ, tần số và gia tốc hướng tâm trong chuyển động tròn.',
      order: 2,
      sections: [
         {
            title: 'I. Lý thuyết chuyển động tròn đều',
            order: 1,
            type: 'doc',
            docContent: {
               format: 'markdown',
               body: `### 1. Tốc độ dài và tốc độ góc
- Mối liên hệ giữa tốc độ dài $v$ và tốc độ góc $\\omega$:
  $$v = \\omega \\cdot R$$
- Chu kỳ $T$ và tần số $f$:
  $$T = \\frac{2\\pi}{\\omega}, \\quad f = \\frac{1}{T} = \\frac{\\omega}{2\\pi}$$

### 2. Gia tốc hướng tâm
Trong chuyển động tròn đều, vectơ vận tốc luôn đổi hướng, gây ra gia tốc hướng về tâm quỹ đạo:
$$a_{ht} = \\frac{v^2}{R} = \\omega^2 \\cdot R$$
`,
               attachments: [],
            },
         },
         {
            title: 'II. Câu hỏi kiểm tra',
            order: 2,
            type: 'exercise',
            exercise: {
               type: 'mcq_single',
               question: 'Nếu bán kính quỹ đạo $R$ tăng gấp đôi và tốc độ góc $\\omega$ không đổi thì gia tốc hướng tâm $a_{ht}$ thay đổi như thế nào?',
               mediaList: [],
               payload: {
                  options: [
                     { id: 'opt_1', label: 'Tăng gấp 2 lần' },
                     { id: 'opt_2', label: 'Tăng gấp 4 lần' },
                     { id: 'opt_3', label: 'Giảm đi 2 lần' },
                     { id: 'opt_4', label: 'Không thay đổi' },
                  ],
               },
               solution: {
                  correctAnswer: 'opt_1',
               },
               explanation: 'Theo công thức $a_{ht} = \\omega^2 \\cdot R$, khi $\\omega$ không đổi thì $a_{ht}$ tỉ lệ thuận bậc nhất với bán kính $R$. Do đó khi $R$ tăng 2 lần thì $a_{ht}$ cũng tăng gấp 2 lần.',
            },
         },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   // Chapter 1.2: Động lực học Newton
   const chap1_2Id = new ObjectId();
   await db.collection('chapters').insertOne({
      _id: chap1_2Id,
      topicId: topic1Id,
      name: 'Các định luật chuyển động Newton',
      description: 'Lực, khối lượng và nguyên nhân làm thay đổi trạng thái chuyển động của vật thể.',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   await db.collection('lessons').insertOne({
      _id: new ObjectId(),
      chapterId: chap1_2Id,
      title: 'Định luật II Newton và lực tương tác',
      description: 'Mối quan hệ giữa hợp lực tác dụng, khối lượng và gia tốc của chất điểm.',
      order: 1,
      sections: [
         {
            title: 'I. Định luật II Newton',
            order: 1,
            type: 'doc',
            docContent: {
               format: 'markdown',
               body: `### Phát biểu Định luật II Newton
Vectơ gia tốc của một vật cùng hướng với vectơ hợp lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật:
$$\\vec{a} = \\frac{\\sum \\vec{F}}{m} \\iff \\sum \\vec{F} = m \\cdot \\vec{a}$$

Khi có nhiều lực tác dụng đồng thời:
$$\\vec{F}_1 + \\vec{F}_2 + \\dots + \\vec{F}_n = m \\vec{a}$$
`,
               attachments: [],
            },
         },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   // -------------------------------------------------------------
   // TOPIC 2: Nhiệt động lực học
   // -------------------------------------------------------------
   const topic2Id = new ObjectId();
   await db.collection('topics').insertOne({
      _id: topic2Id,
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

   const chap2_1Id = new ObjectId();
   await db.collection('chapters').insertOne({
      _id: chap2_1Id,
      topicId: topic2Id,
      name: 'Nguyên lý I Nhiệt động lực học',
      description: 'Độ biến thiên nội năng, công và nhiệt lượng trong các đẳng quá trình.',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   await db.collection('lessons').insertOne({
      _id: new ObjectId(),
      chapterId: chap2_1Id,
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

   // -------------------------------------------------------------
   // TOPIC 3: Điện từ học (Tạm thời ẩn nếu chưa có thumbnail/nội dung đầy đủ)
   // -------------------------------------------------------------
   const topic3Id = new ObjectId();
   await db.collection('topics').insertOne({
      _id: topic3Id,
      title: 'Điện từ học',
      slug: 'dien-tu-hoc',
      description: 'Khảo sát điện trường, từ trường và sự tương tác cơ bản giữa các điện tích.',
      discipline: 'physics',
      order: 3,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   // -------------------------------------------------------------
   // TOPIC 4: Đại số tuyến tính (Tạm thời ẩn nếu chưa có thumbnail)
   // -------------------------------------------------------------
   const topic4Id = new ObjectId();
   await db.collection('topics').insertOne({
      _id: topic4Id,
      title: 'Đại số tuyến tính',
      slug: 'dai-so-tuyen-tinh',
      description: 'Không gian vectơ, phép toán ma trận, định thức và các phép biến đổi tuyến tính trong toán học.',
      discipline: 'maths',
      order: 4,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   const chap3_1Id = new ObjectId();
   await db.collection('chapters').insertOne({
      _id: chap3_1Id,
      topicId: topic3Id,
      name: 'Ma trận và Định thức',
      description: 'Các phép toán đại số ma trận cơ bản và phương pháp tính định thức Gauss.',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   await db.collection('lessons').insertOne({
      _id: new ObjectId(),
      chapterId: chap3_1Id,
      title: 'Định thức ma trận vuông cấp 2 và cấp 3',
      description: 'Định nghĩa định thức, tính chất và công thức khai triển Laplace.',
      order: 1,
      sections: [
         {
            title: 'I. Định thức ma trận cấp 2',
            order: 1,
            type: 'doc',
            docContent: {
               format: 'markdown',
               body: `### 1. Ma trận vuông cấp 2
Cho ma trận $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$. Định thức của ma trận $A$, ký hiệu là $\\det(A)$ hoặc $|A|$, được tính theo công thức:
$$\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = a \\cdot d - b \\cdot c$$

### 2. Tính chất quan trọng
- $\\det(I) = 1$ (với $I$ là ma trận đơn vị).
- $\\det(A^T) = \\det(A)$ (định thức của ma trận chuyển vị bằng định thức ma trận ban đầu).
- $\\det(A \\cdot B) = \\det(A) \\cdot \\det(B)$.
- Ma trận $A$ khả nghịch (tồn tại $A^{-1}$) khi và chỉ khi $\\det(A) \\neq 0$.
`,
               attachments: [],
            },
         },
         {
            title: 'II. Bài tập điền kết quả định thức',
            order: 2,
            type: 'exercise',
            exercise: {
               type: 'fill_blank',
               question: 'Cho ma trận $A = \\begin{pmatrix} 4 & 2 \\\\ 3 & 5 \\end{pmatrix}$. Hãy tính định thức $\\det(A)$.',
               mediaList: [],
               payload: {
                  placeholder: 'Nhập giá trị định thức (vd: 14)',
                  unit: '',
               },
               solution: {
                  correctValue: 14,
                  tolerance: 0,
               },
               explanation: 'Áp dụng công thức định thức cấp 2:\n$$\\det(A) = 4 \\cdot 5 - 2 \\cdot 3 = 20 - 6 = 14$$',
            },
         },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
   });

   console.log('✅ Đã nạp thành công 3 Topics, 4 Chapters và 5 Lessons mẫu có đầy đủ Markdown, LaTeX và Bài tập đa hình!');
}

async function initDatabase() {
   const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
   
   try {
      console.log('🔄 Đang kết nối tới MongoDB...');
      await client.connect();
      console.log('✅ Kết nối MongoDB thành công!');
      const db = client.db(dbName);

      // 1. Tạo các collection nếu chưa tồn tại
      console.log('\n📦 Đang kiểm tra và khởi tạo các Collections...');
      const existingCollections = (await db.listCollections().toArray()).map((c) => c.name);
      
      const requiredCollections = ['topics', 'chapters', 'lessons'];
      for (const colName of requiredCollections) {
         if (!existingCollections.includes(colName)) {
            await db.createCollection(colName);
            console.log(`   + Đã tạo collection: ${colName}`);
         } else {
            console.log(`   * Collection đã tồn tại: ${colName}`);
         }
      }

      // 2. Khởi tạo Index theo tài liệu thiết kế
      console.log('\n⚡ Đang cấu hình Index...');
      await db.collection('topics').createIndex({ slug: 1 }, { unique: true, name: 'idx_topics_slug_unique' });
      await db.collection('topics').createIndex({ isActive: 1, order: 1 }, { name: 'idx_topics_active_order' });
      await db.collection('chapters').createIndex({ topicId: 1, order: 1 }, { name: 'idx_chapters_topic_order' });
      await db.collection('lessons').createIndex({ chapterId: 1, order: 1 }, { name: 'idx_lessons_chapter_order' });
      console.log('   + Đã tạo toàn bộ indexes thành công!');

      // 3. Chèn dữ liệu mẫu nếu chưa có topic nào
      const topicCount = await db.collection('topics').countDocuments();
      if (topicCount === 0) {
         await seedData(db);
      } else {
         console.log(`\nℹ️ Đã có ${topicCount} chủ đề trong database. Nếu muốn nạp lại, hãy xoá collection topics trước.`);
      }

      console.log('\n🎉 Hoàn tất cấu hình Collections và Index!');
   } catch (error) {
      console.error('❌ Lỗi khi khởi tạo database:', error);
      process.exit(1);
   } finally {
      await client.close();
   }
}

module.exports = { seedData };

if (require.main === module) {
   initDatabase();
}
