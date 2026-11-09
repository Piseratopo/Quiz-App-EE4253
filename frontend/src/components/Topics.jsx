import { useState, useEffect } from 'react';
import apiClient from '../configs/apiClient';
import LatexMarkdown from './common/LatexMarkdown';
import '../styles/Topics.scss';

const DISCIPLINE_META = {
   physics: {
      name: 'Vật lí',
      description: 'Nghiên cứu các quy luật vận động của vật chất, không thời gian và năng lượng vũ trụ.',
   },
   maths: {
      name: 'Toán học',
      description: 'Ngôn ngữ tư duy định lượng mô tả chính xác bản chất tự nhiên và tính toán mô hình.',
   },
};

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

   // Tải danh sách topic thực tế từ Database
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

   // Chọn chủ đề và tải các chương / bài học
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

   // Mở bài học
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

   // Nộp bài tập
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

   // Gom nhóm chủ đề theo bộ môn thực tế từ backend
   const disciplines = Object.entries(
      dbTopics.reduce((acc, topic) => {
         const disc = topic.discipline || 'physics';
         if (!acc[disc]) acc[disc] = [];
         acc[disc].push(topic);
         return acc;
      }, {})
   ).map(([id, topics]) => ({
      id,
      name: DISCIPLINE_META[id]?.name || (id === 'physics' ? 'Vật lí' : id),
      description: DISCIPLINE_META[id]?.description || '',
      topics,
   }));

   return (
      <div className="scisolve-catalog-page">
         {/* Top Hero Section */}
         {!selectedTopic && (
            <section className="catalog-hero-section">
               <div className="catalog-hero-container">
                  <h1 className="catalog-hero-title">
                     Danh mục chủ đề
                  </h1>
                  <p className="catalog-hero-desc">
                     Tiếp cận khoa học từ nguyên lý gốc thông qua các mô phỏng tương tác sinh động, trực quan hóa công thức và thử nghiệm không giới hạn.
                  </p>
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
                  {loading ? (
                     <div className="catalog-loading-state">
                        <span className="material-symbols-outlined spin-icon">progress_activity</span>
                        <p>Đang tải danh mục chủ đề...</p>
                     </div>
                  ) : disciplines.length === 0 ? (
                     <div className="catalog-empty-state">
                        <span className="material-symbols-outlined empty-icon">folder_off</span>
                        <h3>Chưa có chủ đề nào được kích hoạt</h3>
                        <p>Các môn học đang được chuẩn bị nội dung và sẽ sớm ra mắt.</p>
                     </div>
                  ) : (
                     disciplines.map((discipline) => (
                        <section key={discipline.id} className="discipline-group-section" id={`topics-${discipline.id}`}>
                           <div className="discipline-group-header">
                              <h2 className="discipline-group-title heading-accent-line">
                                 {discipline.name}
                              </h2>
                              {discipline.description && (
                                 <p className="discipline-group-desc">{discipline.description}</p>
                              )}
                           </div>

                           <div className="topics-cards-grid">
                              {discipline.topics.map((topic) => (
                                 <article
                                    key={topic._id || topic.slug}
                                    className="topic-card-item"
                                    onClick={() => handleSelectTopic(topic.slug, topic.title)}
                                 >
                                    {/* Thumbnail 4:3 Ratio */}
                                    <div className="topic-card-thumbnail-wrap">
                                       {topic.thumbnail ? (
                                          <img
                                             src={topic.thumbnail}
                                             alt={topic.title}
                                             className="topic-card-thumbnail"
                                             loading="lazy"
                                          />
                                       ) : (
                                          <div className="topic-card-thumbnail-fallback">
                                             <span className="material-symbols-outlined">menu_book</span>
                                          </div>
                                       )}
                                       <span className="topic-status-badge">
                                          <span className="live-dot"></span>
                                          Trực tuyến
                                       </span>
                                    </div>

                                    <div className="topic-card-body">
                                       <h3 className="topic-card-title">{topic.title}</h3>
                                       <p className="topic-card-desc">{topic.description}</p>
                                    </div>

                                    <div className="topic-card-footer">
                                       <span className="topic-card-meta">
                                          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                                             collections_bookmark
                                          </span>
                                          Khám phá bài học
                                       </span>
                                       <span className="topic-card-action">
                                          <span>Khám phá</span>
                                          <span className="material-symbols-outlined action-arrow">
                                             arrow_forward
                                          </span>
                                       </span>
                                    </div>
                                 </article>
                              ))}
                           </div>
                        </section>
                     ))
                  )}
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
