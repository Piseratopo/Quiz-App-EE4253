import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import LatexMarkdown from './common/LatexMarkdown';
import '../styles/Topics.scss';

export default function TopicView() {
   const { slug } = useParams();
   const navigate = useNavigate();

   const [topic, setTopic] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [expandedChapters, setExpandedChapters] = useState({});

   // Lesson Viewer Modal State
   const [activeLesson, setActiveLesson] = useState(null);
   const [loadingLesson, setLoadingLesson] = useState(false);
   const [userAnswers, setUserAnswers] = useState({});
   const [exerciseResults, setExerciseResults] = useState({});
   const [submittingSection, setSubmittingSection] = useState(null);

   useEffect(() => {
      if (slug) {
         loadTopic(slug);
      }
   }, [slug]);

   const loadTopic = async (topicSlug) => {
      setLoading(true);
      setError('');
      try {
         const response = await apiClient.get(`/topics/${topicSlug}`);
         setTopic(response.data);
         // Tự động mở chương đầu tiên nếu có
         if (response.data.chapters?.length > 0) {
            setExpandedChapters({ [response.data.chapters[0]._id]: true });
         }
      } catch (err) {
         setError(err.response?.data?.error || 'Không thể tải chi tiết chủ đề.');
      } finally {
         setLoading(false);
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

   return (
      <div className="scisolve-catalog-page">
         <div className="catalog-main-container">
            <div className="topic-detail-view">
               <div className="topic-detail-bar">
                  <button className="back-btn" onClick={() => navigate('/topics')}>
                     <span className="material-symbols-outlined">arrow_back</span>
                     Danh mục chủ đề
                  </button>
                  {topic && <h2 className="topic-detail-title">{topic.title}</h2>}
               </div>

               {loading ? (
                  <div className="catalog-loading-state">
                     <span className="material-symbols-outlined spin-icon">progress_activity</span>
                     <p>Đang tải cấu trúc chương trình học...</p>
                  </div>
               ) : error || !topic ? (
                  <div className="catalog-empty-state">
                     <span className="material-symbols-outlined empty-icon">error_outline</span>
                     <h3>{error || 'Không tìm thấy chủ đề'}</h3>
                     <p>Chủ đề bạn yêu cầu không tồn tại hoặc đã bị gỡ bỏ.</p>
                     <button className="btn-common" onClick={() => navigate('/topics')}>
                        Quay lại danh mục
                     </button>
                  </div>
               ) : topic.isPlaceholder || !topic.chapters || topic.chapters.length === 0 ? (
                  <div className="catalog-empty-state">
                     <span className="material-symbols-outlined empty-icon">construction</span>
                     <h3>Chủ đề đang hoàn thiện nội dung</h3>
                     <p>
                        Các chương học và mô phỏng tương tác cho chủ đề <strong>{topic.title}</strong> đang được biên soạn.
                     </p>
                     <button className="btn-common" onClick={() => navigate('/topics')}>
                        Quay lại danh mục
                     </button>
                  </div>
               ) : (
                  <div className="chapters-container">
                     {topic.chapters.map((chapter) => {
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
