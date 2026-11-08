import { useState, useEffect } from 'react';
import apiClient from '../configs/apiClient';
import LatexMarkdown from './common/LatexMarkdown';
import '../styles/Topics.scss';

const CATALOG_DISCIPLINES = [
   {
      id: 'physics',
      name: 'Vật lí',
      description: 'Nghiên cứu các quy luật vận động của vật chất, không thời gian và năng lượng vũ trụ.',
      topics: [
         {
            slug: 'co-hoc-co-dien',
            title: 'Cơ học cổ điển',
            description: 'Nghiên cứu về chuyển động của các vật thể và các định luật Newton nền tảng trong vật lý học.',
            icon: 'science',
            stats: '14 bài học • 42 mô phỏng',
         },
         {
            slug: 'dien-tu-hoc',
            title: 'Điện từ học',
            description: 'Khảo sát điện trường, từ trường và sự tương tác cơ bản giữa các điện tích.',
            icon: 'bolt',
            stats: '18 bài học • 36 mô phỏng',
         },
         {
            slug: 'quang-hoc-song',
            title: 'Quang học & Sóng',
            description: 'Bản chất sóng-hạt của ánh sáng, hiện tượng giao thoa, nhiễu xạ và nguyên lý truyền thông lượng tử.',
            icon: 'water',
            stats: '12 bài học • 28 mô phỏng',
         },
         {
            slug: 'nhiet-dong-luc-hoc',
            title: 'Nhiệt động lực học',
            description: 'Các nguyên lý bảo toàn nhiệt lượng, entropy, chu trình Carnot và động học phân tử chất khí.',
            icon: 'local_fire_department',
            stats: '10 bài học • 24 mô phỏng',
         },
         {
            slug: 'vat-ly-thien-van',
            title: 'Vật lý Thiên văn & Vũ trụ học',
            description: 'Trọng trường Einstein, lỗ đen, sự giãn nở không-thời gian và mô hình tiến hóa sao lớn.',
            icon: 'satellite_alt',
            stats: '16 bài học • 30 mô phỏng',
         },
         {
            slug: 'vat-ly-luong-tu',
            title: 'Vật lý Lượng tử cơ bản',
            description: 'Phương trình Schrödinger, hàm sóng, nghịch lý EPR và nguyên lý bất định Heisenberg.',
            icon: 'grain',
            stats: '15 bài học • 35 mô phỏng',
         },
      ],
   },
   {
      id: 'math',
      name: 'Toán học',
      description: 'Ngôn ngữ tư duy định lượng mô tả chính xác bản chất tự nhiên và tính toán mô hình.',
      topics: [
         {
            slug: 'dai-so-tuyen-tinh',
            title: 'Đại số tuyến tính',
            description: 'Không gian vectơ, phép toán ma trận, định thức và các phép biến đổi tuyến tính trong toán học.',
            textIcon: 'Σ',
            stats: '16 bài học • 48 mô phỏng',
         },
         {
            slug: 'giai-tich-vi-phan',
            title: 'Giải tích & Vi phân',
            description: 'Giới hạn hàm số, đạo hàm đa biến, tích phân đường mặt và phương trình vi phân ứng dụng.',
            textIcon: '∫dx',
            stats: '20 bài học • 55 mô phỏng',
         },
         {
            slug: 'xac-suat-thong-ke',
            title: 'Xác suất & Thống kê',
            description: 'Biến ngẫu nhiên, các phân phối chuẩn/Poisson, kiểm định giả thuyết và thống kê suy luận Bayes.',
            icon: 'query_stats',
            stats: '14 bài học • 32 mô phỏng',
         },
         {
            slug: 'toan-roi-rac-do-thi',
            title: 'Toán rời rạc & Đồ thị',
            description: 'Tổ hợp, quan hệ đồng dư, cấu trúc cây, đường đi ngắn nhất và bài toán đồ thị phẳng.',
            icon: 'hub',
            stats: '11 bài học • 29 mô phỏng',
         },
      ],
   },
   {
      id: 'cs',
      name: 'Khoa học Máy tính & Dữ liệu',
      description: 'Nền tảng thuật toán, logic máy tính và mô hình trí tuệ nhân tạo hiện đại.',
      topics: [
         {
            slug: 'thuat-toan-ctdl',
            title: 'Thuật toán & Cấu trúc dữ liệu',
            description: 'Trực quan hóa độ phức tạp thời gian Big-O, sắp xếp, tìm kiếm nhị phân, quy hoạch động và heap.',
            icon: 'alt_route',
            stats: '19 bài học • 50 mô phỏng',
         },
         {
            slug: 'hoc-may-mang-no-ron',
            title: 'Học máy & Mạng nơ-ron',
            description: 'Lan truyền ngược (Backpropagation), hàm mất mát gradient descent và kiến trúc Transformer cơ bản.',
            icon: 'psychology',
            stats: '15 bài học • 38 mô phỏng',
         },
      ],
   },
   {
      id: 'chem',
      name: 'Hóa học & Cấu trúc Phân tử',
      description: 'Mô hình liên kết electron, phản ứng động học và vật liệu nano lượng tử.',
      topics: [
         {
            slug: 'lien-ket-hoa-hoc',
            title: 'Liên kết Hóa học & Cấu trúc',
            description: 'Mô hình lai hóa orbital VSEPR, liên kết cộng hóa trị, liên kết ion và lực tương tác Van der Waals 3D.',
            icon: 'bubble_chart',
            stats: '13 bài học • 31 mô phỏng',
         },
         {
            slug: 'dong-hoc-phan-ung',
            title: 'Động học Phản ứng & Nhiệt hóa',
            description: 'Tốc độ phản ứng, năng lượng hoạt hóa Arrhenius, trạng thái cân bằng Le Chatelier và xúc tác.',
            icon: 'biotech',
            stats: '9 bài học • 21 mô phỏng',
         },
      ],
   },
];

export default function Topics() {
   const [dbTopics, setDbTopics] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   // Selected Topic & Chapters (Topic Detail View)
   const [selectedTopic, setSelectedTopic] = useState(null);
   const [loadingTopic, setLoadingTopic] = useState(false);
   const [expandedChapters, setExpandedChapters] = useState({});

   // Lesson Viewer Modal
   const [activeLesson, setActiveLesson] = useState(null);
   const [loadingLesson, setLoadingLesson] = useState(false);
   const [userAnswers, setUserAnswers] = useState({});
   const [exerciseResults, setExerciseResults] = useState({});
   const [submittingSection, setSubmittingSection] = useState(null);

   // 1. Tải danh sách topic thực tế từ Database
   useEffect(() => {
      loadDbTopics();
   }, []);

   const loadDbTopics = async () => {
      setLoading(true);
      setError('');
      try {
         const response = await apiClient.get('/topics');
         setDbTopics(response.data || []);
      } catch (err) {
         setError(err.response?.data?.error || 'Không thể kết nối đến máy chủ.');
      } finally {
         setLoading(false);
      }
   };

   // 3. Chọn chủ đề và tải các chương / bài học
   const handleSelectTopic = async (slug, fallbackTitle) => {
      setLoadingTopic(true);
      setError('');
      try {
         const response = await apiClient.get(`/topics/${slug}`);
         setSelectedTopic(response.data);
         if (response.data.chapters?.length > 0) {
            setExpandedChapters({ [response.data.chapters[0]._id]: true });
         }
      } catch (err) {
         // Nếu chủ đề đang chuẩn bị nội dung
         setSelectedTopic({
            title: fallbackTitle || 'Chủ đề tương tác',
            slug,
            isPlaceholder: true,
            chapters: [],
         });
      } finally {
         setLoadingTopic(false);
      }
   };

   const toggleChapter = (chapterId) => {
      setExpandedChapters((prev) => ({
         ...prev,
         [chapterId]: !prev[chapterId],
      }));
   };

   // 4. Mở bài học
   const handleOpenLesson = async (lessonId) => {
      setLoadingLesson(true);
      setUserAnswers({});
      setExerciseResults({});
      try {
         const response = await apiClient.get(`/lessons/${lessonId}`);
         setActiveLesson(response.data);
      } catch (err) {
         alert(err.response?.data?.error || 'Không thể tải nội dung bài học.');
      } finally {
         setLoadingLesson(false);
      }
   };

   // 5. Nộp bài tập
   const handleSubmitExercise = async (sectionIndex) => {
      if (!activeLesson) return;
      const answer = userAnswers[sectionIndex];
      if (answer === undefined || answer === '') {
         alert('Vui lòng chọn hoặc nhập câu trả lời trước khi nộp bài.');
         return;
      }

      setSubmittingSection(sectionIndex);
      try {
         const response = await apiClient.post(
            `/lessons/${activeLesson._id}/exercises/${sectionIndex}/submit`,
            { answer }
         );
         setExerciseResults((prev) => ({
            ...prev,
            [sectionIndex]: response.data,
         }));
      } catch (err) {
         alert(err.response?.data?.error || 'Không thể gửi câu trả lời. Bạn đã đăng nhập chưa?');
      } finally {
         setSubmittingSection(null);
      }
   };

   // Map db topics to catalog topics
   const isTopicInDb = (slug) => dbTopics.some((t) => t.slug === slug);

   return (
      <div className="scisolve-catalog-page">
         {/* Top Hero Section */}
         {!selectedTopic && (
            <section className="catalog-hero-section">
               <div className="catalog-hero-container">
                  <h1 className="catalog-hero-title">
                     Danh mục chủ đề
                  </h1>

               </div>
            </section>
         )}

         {/* Main Content Area */}
         <div className="catalog-main-container">
            {error && (
               <div className="catalog-alert-error">
                  <span className="material-symbols-outlined">warning</span>
                  <span>{error}</span>
               </div>
            )}

            {!selectedTopic ? (
               <div className="catalog-sections-wrap">
                  {CATALOG_DISCIPLINES.map((discipline) => (
                     <section key={discipline.id} className="discipline-group-section" id={`topics-${discipline.id}`}>
                        <div className="discipline-group-header">
                           <h2 className="discipline-group-title heading-accent-line">
                              {discipline.name}
                           </h2>
                           <p className="discipline-group-desc">{discipline.description}</p>
                        </div>

                        <div className="topics-cards-grid">
                           {discipline.topics.map((topic) => {
                              const inDb = isTopicInDb(topic.slug);
                              return (
                                 <article
                                    key={topic.slug}
                                    className="topic-card-item"
                                    onClick={() => handleSelectTopic(topic.slug, topic.title)}
                                 >
                                    <div className="topic-card-body">
                                       <div className="topic-card-badge-wrap">
                                          <div className="topic-icon-box">
                                             {topic.textIcon ? (
                                                <span className="text-icon">{topic.textIcon}</span>
                                             ) : (
                                                <span className="material-symbols-outlined">
                                                   {topic.icon || 'science'}
                                                </span>
                                             )}
                                          </div>
                                          {inDb && (
                                             <span className="live-status-pill">
                                                <span className="live-dot"></span>
                                                Trực tuyến
                                             </span>
                                          )}
                                       </div>

                                       <h3 className="topic-card-title">{topic.title}</h3>
                                       <p className="topic-card-desc">{topic.description}</p>
                                    </div>

                                    <div className="topic-card-footer">
                                       <span className="topic-card-meta">
                                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                                             collections_bookmark
                                          </span>
                                          {topic.stats}
                                       </span>
                                       <span className="topic-card-action">
                                          <span>Khám phá</span>
                                          <span className="material-symbols-outlined action-arrow">
                                             arrow_forward
                                          </span>
                                       </span>
                                    </div>
                                 </article>
                              );
                           })}
                        </div>
                     </section>
                  ))}
               </div>
            ) : (
               /* Topic Detail View: Chapters & Lessons */
               <div className="topic-detail-view">
                  <div className="topic-detail-bar">
                     <button className="back-btn" onClick={() => setSelectedTopic(null)}>
                        <span className="material-symbols-outlined">arrow_back</span>
                        Danh mục chủ đề
                     </button>
                     <h2 className="topic-detail-title">{selectedTopic.title}</h2>
                  </div>

                  {loadingTopic ? (
                     <div className="catalog-loading-state">
                        <span className="material-symbols-outlined spin-icon">progress_activity</span>
                        <p>Đang tải cấu trúc chương trình học...</p>
                     </div>
                  ) : selectedTopic.isPlaceholder || !selectedTopic.chapters || selectedTopic.chapters.length === 0 ? (
                     <div className="catalog-empty-state">
                        <span className="material-symbols-outlined empty-icon">construction</span>
                        <h3>Chủ đề đang hoàn thiện nội dung</h3>
                        <p>Các chương học và mô phỏng tương tác cho chủ đề <strong>{selectedTopic.title}</strong> đang được biên soạn.</p>
                        <button className="btn-common" onClick={() => setSelectedTopic(null)}>
                           Quay lại danh mục
                        </button>
                     </div>
                  ) : (
                     <div className="chapters-container">
                        {selectedTopic.chapters.map((chapter) => {
                           const isOpen = expandedChapters[chapter._id];
                           return (
                              <div key={chapter._id} className="chapter-block">
                                 <div className="chapter-header" onClick={() => toggleChapter(chapter._id)}>
                                    <div className="chapter-title-group">
                                       <h3 className="chapter-name">
                                          <span className="chapter-tag">Chương {chapter.order || 1}</span>
                                          {chapter.name}
                                       </h3>
                                       <p className="chapter-desc">{chapter.description}</p>
                                    </div>
                                    <span className={`material-symbols-outlined toggle-icon ${isOpen ? 'open' : ''}`}>
                                       expand_more
                                    </span>
                                 </div>

                                 {isOpen && (
                                    <div className="lessons-list">
                                       {chapter.lessons?.length === 0 ? (
                                          <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)', margin: '0.5rem 0' }}>
                                             Chưa có bài học nào trong chương này.
                                          </p>
                                       ) : (
                                          chapter.lessons.map((lesson) => (
                                             <div
                                                key={lesson._id}
                                                className="lesson-item"
                                                onClick={() => handleOpenLesson(lesson._id)}
                                             >
                                                <div className="lesson-info">
                                                   <h4 className="lesson-title">{lesson.title}</h4>
                                                   <p className="lesson-desc">{lesson.description}</p>
                                                </div>
                                                <div className="lesson-action">
                                                   <span>Học bài</span>
                                                   <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                                                      play_circle
                                                   </span>
                                                </div>
                                             </div>
                                          ))
                                       )}
                                    </div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  )}
               </div>
            )}

            {/* Lesson Viewer Modal */}
            {activeLesson && (
               <div className="lesson-viewer-modal" onClick={() => setActiveLesson(null)}>
                  <div className="lesson-viewer-card" onClick={(e) => e.stopPropagation()}>
                     <div className="lesson-viewer-header">
                        <h3 className="viewer-title">{activeLesson.title}</h3>
                        <button className="close-btn" onClick={() => setActiveLesson(null)}>
                           &times;
                        </button>
                     </div>

                     <div className="lesson-viewer-body">
                        {activeLesson.sections?.map((section, idx) => (
                           <div
                              key={idx}
                              className={`section-card ${
                                 section.type === 'doc' ? 'section-card--doc' : 'section-card--exercise'
                              }`}
                           >
                              <span className={`section-badge ${section.type === 'doc' ? 'doc-badge' : 'ex-badge'}`}>
                                 {section.type === 'doc' ? 'Lý thuyết' : `Bài tập (${section.exercise?.type})`}
                              </span>
                              <h4 className="section-title">{section.title}</h4>

                              {/* Render Section Lý Thuyết */}
                              {section.type === 'doc' && section.docContent && (
                                 <LatexMarkdown content={section.docContent.body} />
                              )}

                              {/* Render Section Bài Tập Đa Hình */}
                              {section.type === 'exercise' && section.exercise && (
                                 <div className="exercise-interactive">
                                    <LatexMarkdown content={section.exercise.question} />

                                    {/* Dạng 1: Trắc nghiệm 1 đáp án (mcq_single) */}
                                    {section.exercise.type === 'mcq_single' && (
                                       <div className="mcq-options-group" style={{ marginTop: '1rem' }}>
                                          {section.exercise.payload?.options?.map((opt) => (
                                             <label key={opt.id} className="mcq-option-label">
                                                <input
                                                   type="radio"
                                                   name={`exercise_${idx}`}
                                                   value={opt.id}
                                                   checked={userAnswers[idx] === opt.id}
                                                   onChange={(e) =>
                                                      setUserAnswers({ ...userAnswers, [idx]: e.target.value })
                                                   }
                                                />
                                                <LatexMarkdown content={opt.label} />
                                             </label>
                                          ))}
                                       </div>
                                    )}

                                    {/* Dạng 2: Điền số/chữ (fill_blank) */}
                                    {section.exercise.type === 'fill_blank' && (
                                       <div className="fill-blank-group" style={{ marginTop: '1rem' }}>
                                          <input
                                             type="text"
                                             placeholder={section.exercise.payload?.placeholder || 'Nhập câu trả lời...'}
                                             value={userAnswers[idx] || ''}
                                             onChange={(e) =>
                                                setUserAnswers({ ...userAnswers, [idx]: e.target.value })
                                             }
                                          />
                                          {section.exercise.payload?.unit && (
                                             <span className="unit-text">{section.exercise.payload.unit}</span>
                                          )}
                                       </div>
                                    )}

                                    {/* Nút nộp bài tập */}
                                    <button
                                       onClick={() => handleSubmitExercise(idx)}
                                       className="btn-common"
                                       disabled={submittingSection === idx}
                                       style={{ marginTop: '0.5rem' }}
                                    >
                                       {submittingSection === idx ? 'Đang chấm điểm...' : 'Nộp câu trả lời'}
                                    </button>

                                    {/* Kết quả sau khi nộp */}
                                    {exerciseResults[idx] && (
                                       <div
                                          className={`result-alert ${
                                             exerciseResults[idx].isCorrect ? 'correct' : 'incorrect'
                                          }`}
                                       >
                                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                             <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                                                {exerciseResults[idx].isCorrect ? 'check_circle' : 'cancel'}
                                             </span>
                                             {exerciseResults[idx].isCorrect
                                                ? 'Chính xác! Bạn đã làm rất tốt.'
                                                : 'Chưa chính xác. Hãy xem lại lời giải chi tiết bên dưới.'}
                                          </div>

                                          {exerciseResults[idx].explanation && (
                                             <div className="explanation-box">
                                                <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                                                   Lời giải chi tiết:
                                                </strong>
                                                <LatexMarkdown content={exerciseResults[idx].explanation} />
                                             </div>
                                          )}
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
