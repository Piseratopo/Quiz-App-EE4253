import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import LatexMarkdown from './common/LatexMarkdown';
import '../styles/LessonEditor.scss';

export default function LessonEditor() {
   const { lessonId } = useParams();
   const navigate = useNavigate();

   const [lesson, setLesson] = useState(null);
   const [sections, setSections] = useState([]);
   const [activeSectionIdx, setActiveSectionIdx] = useState(0);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [toast, setToast] = useState(null);

   const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3200);
   };

   // ── Load Lesson ──────────────────────────────────────────────────────────
   useEffect(() => {
      let isMounted = true;
      const loadData = async () => {
         setLoading(true);
         try {
            if (lessonId) {
               let lessonData = null;
               try {
                  const res = await apiClient.get(`/admin/lessons/${lessonId}`);
                  lessonData = res.data;
               } catch {
                  const res = await apiClient.get(`/lessons/${lessonId}`);
                  lessonData = res.data;
               }

               if (isMounted && lessonData) {
                  setLesson(lessonData);
                  const secs = Array.isArray(lessonData.sections) && lessonData.sections.length > 0
                     ? lessonData.sections
                     : [
                        {
                           order: 1,
                           type: 'doc',
                           docContent: {
                              format: 'markdown',
                           },
                        },
                     ];
                  setSections(secs);
               }
            }
         } catch (err) {
            console.error('Lỗi khi tải dữ liệu bài học:', err);
            showToast('Không thể tải bài học từ máy chủ', 'error');
         } finally {
            if (isMounted) setLoading(false);
         }
      };

      loadData();
      return () => { isMounted = false; };
   }, [lessonId]);

   // Current Active Section
   const currentSection = useMemo(() => {
      if (!sections || sections.length === 0) return null;
      return sections[activeSectionIdx] || sections[0];
   }, [sections, activeSectionIdx]);

   // ── Section Updates ───────────────────────────────────────────────────────
   const updateCurrentSection = (updatedFields) => {
      setSections((prev) => {
         const copy = [...prev];
         const cur = copy[activeSectionIdx] || {};
         copy[activeSectionIdx] = { ...cur, ...updatedFields };
         return copy;
      });
   };

   const handleSwitchSectionType = (type) => {
      if (!currentSection) return;
      if (type === 'doc') {
         updateCurrentSection({
            type: 'doc',
            docContent: currentSection.docContent || {
               format: 'markdown',
               body: '',
            },
         });
      } else {
         updateCurrentSection({
            type: 'exercise',
            exercise: currentSection.exercise || {
               type: 'mcq_single',
               points: 100,
               question: '',
               payload: {
                  options: [
                     { id: 'opt_1', label: '', isCorrect: false },
                     { id: 'opt_2', label: '', isCorrect: false },
                  ],
               },
               solution: { correctAnswer: '' },
               explanation: '',
            },
         });
      }
   };

   // ── Exercise Handlers ─────────────────────────────────────────────────────
   const handleExerciseTypeChange = (eType) => {
      const ex = currentSection?.exercise || {};
      const newEx = { ...ex, type: eType };

      if (eType === 'mcq_single' || eType === 'mcq_multiple') {
         const options = newEx.payload?.options?.length
            ? newEx.payload.options
            : [
               { id: 'opt_1', label: '', isCorrect: false },
               { id: 'opt_2', label: '', isCorrect: false },
            ];
         newEx.payload = { ...newEx.payload, options };
         newEx.solution = eType === 'mcq_multiple'
            ? { correctAnswers: options.filter((option) => option.isCorrect).map((option) => option.id) }
            : { correctAnswer: options.find((option) => option.isCorrect)?.id || '' };
      } else if (eType === 'fill_blank') {
         newEx.payload = { placeholder: '' };
         newEx.solution = { exactValue: '', tolerance: '' };
      }

      updateCurrentSection({ exercise: newEx });
   };

   const handleAddOption = () => {
      const ex = currentSection?.exercise || {};
      const opts = [...(ex.payload?.options || [])];
      const newId = `opt_${Date.now()}`;
      opts.push({ id: newId, label: '', isCorrect: false });
      updateCurrentSection({
         exercise: {
            ...ex,
            payload: { ...ex.payload, options: opts },
         },
      });
   };

   const handleRemoveOption = (optId) => {
      const ex = currentSection?.exercise || {};
      const opts = (ex.payload?.options || []).filter((o) => o.id !== optId);
      updateCurrentSection({
         exercise: {
            ...ex,
            payload: { ...ex.payload, options: opts },
         },
      });
   };

   const handleOptionLabelChange = (optId, text) => {
      const ex = currentSection?.exercise || {};
      const opts = (ex.payload?.options || []).map((o) => o.id === optId ? { ...o, label: text } : o);
      updateCurrentSection({
         exercise: {
            ...ex,
            payload: { ...ex.payload, options: opts },
         },
      });
   };

   const handleSelectCorrectOption = (optId) => {
      const ex = currentSection?.exercise || {};
      const isMultiple = ex.type === 'mcq_multiple';
      const opts = (ex.payload?.options || []).map((o) => {
         if (isMultiple) {
            return o.id === optId ? { ...o, isCorrect: !o.isCorrect } : o;
         }
         return { ...o, isCorrect: o.id === optId };
      });

      const updatedEx = {
         ...ex,
         payload: { ...ex.payload, options: opts },
         solution: isMultiple
            ? { correctAnswers: opts.filter((o) => o.isCorrect).map((o) => o.id) }
            : { correctAnswer: optId },
      };

      updateCurrentSection({ exercise: updatedEx });
   };

   // ── Add / Remove Section ──────────────────────────────────────────────────
   const handleAddNewSection = (type = 'doc') => {
      const newSec = {
         title: '',
         order: sections.length + 1,
         type,
         ...(type === 'doc'
            ? {
               docContent: {
                  format: 'markdown',
                  body: '',
               },
            }
            : {
               exercise: {
                  type: 'mcq_single',
                  points: 100,
                  question: '',
                  payload: {
                     options: [
                        { id: 'opt_1', label: '', isCorrect: false },
                        { id: 'opt_2', label: '', isCorrect: false },
                     ],
                  },
                  solution: { correctAnswer: '' },
                  explanation: '',
               },
            }),
      };

      const updated = [...sections, newSec];
      setSections(updated);
      setActiveSectionIdx(updated.length - 1);
      showToast(`Đã thêm phần ${updated.length}`);
   };

   const handleDeleteSection = (index) => {
      if (sections.length <= 1) {
         showToast('Bài học cần ít nhất một phần nội dung', 'error');
         return;
      }
      const updated = sections.filter((_, idx) => idx !== index);
      setSections(updated);
      setActiveSectionIdx(Math.max(0, index - 1));
      showToast('Đã xóa phần');
   };

   // ── Quick Formatting Inserts ──────────────────────────────────────────────
   const insertDocSnippet = (snippet) => {
      const currentBody = currentSection?.docContent?.body || '';
      updateCurrentSection({
         docContent: {
            format: 'markdown',
            body: currentBody + '\n' + snippet,
         },
      });
   };

   // ── Save Lesson ───────────────────────────────────────────────────────────
   const handleSaveLesson = async () => {
      if (!lesson?.title?.trim()) {
         showToast('Vui lòng nhập tiêu đề bài học', 'error');
         return;
      }
      setSaving(true);
      try {
         const payload = {
            title: lesson.title,
            slug: lesson.slug,
            description: lesson.description || '',
            chapterId: lesson.chapterId,
            isActive: lesson.isActive !== false,
            order: Number(lesson.order) || 1,
            sections,
         };

         if (lessonId) {
            await apiClient.put(`/lessons/${lessonId}`, payload);
         } else {
            const res = await apiClient.post('/lessons', payload);
            if (res.data?._id) {
               navigate(`/lesson-editor/${res.data._id}`, { replace: true });
            }
         }

         showToast('Đã lưu bài học thành công!');
      } catch (err) {
         console.error('Lỗi khi lưu bài học:', err);
         showToast(err.response?.data?.error || 'Có lỗi xảy ra khi lưu bài học', 'error');
      } finally {
         setSaving(false);
      }
   };

   if (loading) {
      return (
         <div className="app-loading-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined spin-icon" style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>
               progress_activity
            </span>
            <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>Đang tải không gian soạn thảo SciSolve Studio...</p>
         </div>
      );
   }

   return (
      <div className="lesson-editor-page">
         {/* Toast Notification */}
         {toast && (
            <div className={`app-toast ${toast.type}`}>
               <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                  {toast.type === 'error' ? 'error' : 'check_circle'}
               </span>
               <span>{toast.message}</span>
            </div>
         )}

         {/* ================= MAIN WORKSPACE ================= */}
         <main className="le-main-container">

            {/* METADATA CỦA BÀI HỌC (LESSON LEVEL) */}
            <div className="le-meta-card">
               <div className="le-meta-grid">
                  <div className="le-field-group">
                     <label>
                        Tiêu đề bài học <span className="req">*</span>
                     </label>
                     <input
                        type="text"
                        value={lesson?.title || ''}
                        onChange={(e) => setLesson((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Ví dụ: Cân bằng lực ma sát và Phản lực pháp tuyến..."
                     />
                  </div>

               </div>
            </div>

            {/* WORKSPACE 2 CỘT */}
            <div className="le-workspace-grid">
               {/* ================= CỘT TRÁI: FORM SOẠN THẢO SECTION ================= */}
               <section className="le-editor-pane">

                  {/* CARD: CẤU HÌNH SECTION HIỆN TẠI */}
                  <div className="le-section-card">
                     <div className="le-section-card-header">
                        <div className="header-info">
                           <span className="section-badge">
                              Phần {activeSectionIdx + 1} / {sections.length}
                           </span>
                           <h2 className="section-card-title">Nội dung</h2>
                        </div>

                        {/* Switch Type Buttons */}
                        <div className="section-type-toggle">
                           <button
                              type="button"
                              onClick={() => handleSwitchSectionType('exercise')}
                              className={`btn-type ${currentSection?.type === 'exercise' ? 'active' : ''}`}
                           >
                              Bài tập
                           </button>
                           <button
                              type="button"
                              onClick={() => handleSwitchSectionType('doc')}
                              className={`btn-type ${currentSection?.type === 'doc' ? 'active' : ''}`}
                           >
                              Lí thuyết
                           </button>
                        </div>
                     </div>

                     {/* Hàng: Tiêu đề phần & Dạng bài tập */}
                     <div className={`le-section-title-row ${currentSection?.type === 'exercise' ? 'is-exercise' : ''}`}>
                        <div className="le-field-col">
                           <div className="field-top">
                              <label>Tiêu đề phần</label>
                              {sections.length > 1 && currentSection?.type !== 'exercise' && (
                                 <button
                                    type="button"
                                    onClick={() => handleDeleteSection(activeSectionIdx)}
                                    className="btn-del-section"
                                 >
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                                    Xóa phần này
                                 </button>
                              )}
                           </div>
                           <input
                              type="text"
                              value={currentSection?.title || ''}
                              onChange={(e) => updateCurrentSection({ title: e.target.value })}
                              placeholder="Tiêu đề phần..."
                           />
                        </div>

                        {currentSection?.type === 'exercise' && (
                           <div className="le-field-col">
                              <div className="field-top">
                                 <label>Dạng bài tập</label>
                                 {sections.length > 1 && (
                                    <button
                                       type="button"
                                       onClick={() => handleDeleteSection(activeSectionIdx)}
                                       className="btn-del-section"
                                    >
                                       <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>delete</span>
                                       Xóa phần này
                                    </button>
                                 )}
                              </div>
                              <select
                                 value={currentSection?.exercise?.type || 'mcq_single'}
                                 onChange={(e) => handleExerciseTypeChange(e.target.value)}
                              >
                                 <option value="mcq_single">Trắc nghiệm 1 đáp án (mcq_single)</option>
                                 <option value="mcq_multiple">Trắc nghiệm nhiều đáp án (mcq_multiple)</option>
                                 <option value="fill_blank">Điền số / kết quả (fill_blank)</option>
                              </select>
                           </div>
                        )}
                     </div>

                     {/* ── FORM BÀI TẬP (EXERCISE BUILDER) ── */}
                     {currentSection?.type === 'exercise' && (
                        <div className="le-exercise-form">

                           {/* Đề bài */}
                           <div className="form-group">
                              <label>Nội dung câu hỏi</label>
                              <textarea
                                 rows={3}
                                 placeholder="Nhập nội dung đề bài"
                                 value={currentSection?.exercise?.question || ''}
                                 onChange={(e) => updateCurrentSection({
                                    exercise: { ...currentSection.exercise, question: e.target.value },
                                 })}
                              />
                           </div>

                           {/* MCQ Options */}
                           {(currentSection?.exercise?.type === 'mcq_single' || currentSection?.exercise?.type === 'mcq_multiple') && (
                              <div className="options-block">
                                 <div className="options-header">
                                    <span className="opts-title">Các phương án & Đáp án đúng</span>
                                    <span className="opts-sub">Tích chọn để làm đáp án đúng</span>
                                 </div>

                                 <div className="options-list">
                                    {(currentSection?.exercise?.payload?.options || []).map((opt) => (
                                       <div
                                          key={opt.id}
                                          className={`opt-row ${opt.isCorrect ? 'correct' : ''}`}
                                       >
                                          <input
                                             type={currentSection?.exercise?.type === 'mcq_multiple' ? 'checkbox' : 'radio'}
                                             name="correct_answer_choice"
                                             checked={Boolean(opt.isCorrect)}
                                             onChange={() => handleSelectCorrectOption(opt.id)}
                                             className="opt-control"
                                             title="Chọn làm đáp án đúng"
                                          />
                                          <input
                                             type="text"
                                             className="opt-input"
                                             value={opt.label || ''}
                                             onChange={(e) => handleOptionLabelChange(opt.id, e.target.value)}
                                             placeholder="Nội dung phương án..."
                                          />
                                          <button
                                             type="button"
                                             onClick={() => handleRemoveOption(opt.id)}
                                             className="btn-remove-opt"
                                             title="Xóa lựa chọn này"
                                          >
                                             ✕
                                          </button>
                                       </div>
                                    ))}
                                 </div>

                                 <button
                                    type="button"
                                    onClick={handleAddOption}
                                    className="btn-add-opt"
                                 >
                                    <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add_circle</span>
                                    <span>Thêm lựa chọn đáp án</span>
                                 </button>
                              </div>
                           )}

                           {/* Fill blank config */}
                           {currentSection?.exercise?.type === 'fill_blank' && (
                              <div className="fill-blank-block">
                                 <div className="fb-field">
                                    <label>
                                       Đáp số chuẩn
                                    </label>
                                    <input
                                       type="number"
                                       step="0.01"
                                       placeholder="Ví dụ: 42.4"
                                       value={currentSection?.exercise?.solution?.exactValue ?? ''}
                                       onChange={(e) => updateCurrentSection({
                                          exercise: {
                                             ...currentSection.exercise,
                                             solution: {
                                                ...currentSection.exercise.solution,
                                                exactValue: e.target.value === '' ? '' : Number(e.target.value),
                                             },
                                          },
                                       })}
                                    />
                                 </div>

                                 <div className="fb-field">
                                    <label>
                                       Sai số cho phép
                                    </label>
                                    <input
                                       type="number"
                                       step="0.01"
                                       placeholder="Ví dụ: 0.1"
                                       value={currentSection?.exercise?.solution?.tolerance ?? 0.1}
                                       onChange={(e) => updateCurrentSection({
                                          exercise: {
                                             ...currentSection.exercise,
                                             solution: {
                                                ...currentSection.exercise.solution,
                                                tolerance: e.target.value === '' ? '' : Number(e.target.value),
                                             },
                                          },
                                       })}
                                    />
                                 </div>
                              </div>
                           )}

                           {/* Lời giải chi tiết */}
                           <div className="form-group" style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                              <label>
                                 Lời giải chi tiết sau khi nộp
                              </label>
                              <textarea
                                 rows={2}
                                 placeholder="Nhập lời giải thích cặn kẽ để học sinh nắm rõ sau khi làm bài..."
                                 value={currentSection?.exercise?.explanation || ''}
                                 onChange={(e) => updateCurrentSection({
                                    exercise: { ...currentSection.exercise, explanation: e.target.value },
                                 })}
                              />
                           </div>
                        </div>
                     )}

                     {currentSection?.type === 'doc' && (
                        <div className="le-doc-form">
                           <div className="doc-toolbar">
                              <label>Nội dung bài viết (Markdown & LaTeX)</label>
                              <div className="tools-group">
                                 <button
                                    type="button"
                                    onClick={() => insertDocSnippet('**Văn bản in đậm**')}
                                    title="Chèn in đậm"
                                 >
                                    B
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => insertDocSnippet('*Văn bản in nghiêng*')}
                                    title="Chèn in nghiêng"
                                 >
                                    I
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => insertDocSnippet('$$ $$')}
                                    className="tool-latex"
                                    title="Chèn công thức LaTeX khối"
                                 >
                                    LaTeX
                                 </button>
                              </div>
                           </div>
                           <textarea
                              rows={12}
                              value={currentSection?.docContent?.body || ''}
                              onChange={(e) => updateCurrentSection({
                                 docContent: { format: 'markdown', body: e.target.value },
                              })}
                           />
                        </div>
                     )}
                  </div>
               </section>

               {/* ================= CỘT PHẢI: LIVE PREVIEW ================= */}
               <aside className="le-preview-pane">
                  <div className="le-preview-card">
                     <div className="preview-header-bar">
                        <div className="ph-left">
                           <span className="live-dot"></span>
                           <span className="ph-title">Xem trước</span>
                        </div>
                     </div>

                     <div className="preview-body">
                        <h3 className="preview-sec-title">
                           {currentSection?.title || 'Tiêu đề phần'}
                        </h3>

                        {currentSection?.type === 'doc' ? (
                           <div className="preview-doc-content">
                              <LatexMarkdown content={currentSection?.docContent?.body || '_Chưa có nội dung lí thuyết..._'} />
                           </div>
                        ) : (
                           <div className="preview-exercise-content">
                              <div className="preview-question">
                                 <LatexMarkdown content={currentSection?.exercise?.question || '_Chưa có câu hỏi..._'} />
                              </div>

                              {/* Preview MCQ */}
                              {(currentSection?.exercise?.type === 'mcq_single' || currentSection?.exercise?.type === 'mcq_multiple') && (
                                 <div className="preview-options-list">
                                    {(currentSection?.exercise?.payload?.options || []).map((opt) => (
                                       <div
                                          key={opt.id}
                                          className={`prev-opt ${opt.isCorrect ? 'is-correct' : ''}`}
                                       >
                                          <input
                                             type={currentSection?.exercise?.type === 'mcq_multiple' ? 'checkbox' : 'radio'}
                                             readOnly
                                             checked={Boolean(opt.isCorrect)}
                                          />
                                          <div className="prev-opt-text">
                                             <LatexMarkdown content={opt.label || '...'} />
                                          </div>
                                          {opt.isCorrect && (
                                             <span className="badge-answer">Đáp án</span>
                                          )}
                                       </div>
                                    ))}
                                 </div>
                              )}

                              {/* Preview Fill Blank */}
                              {currentSection?.exercise?.type === 'fill_blank' && (
                                 <div className="preview-fb-box">
                                    <input
                                       type="text"
                                       disabled
                                       placeholder="Ô nhập đáp án"
                                    />
                                    <span className="fb-hint">
                                       (Đáp số chuẩn: {currentSection?.exercise?.solution?.exactValue ?? '--'}, sai số ±{currentSection?.exercise?.solution?.tolerance ?? 0.1})
                                    </span>
                                 </div>
                              )}

                              {/* Preview Explanation */}
                              {currentSection?.exercise?.explanation && (
                                 <div className="preview-explanation-box">
                                    <div className="exp-header">💡 Lời giải giải thích:</div>
                                    <div className="exp-body">
                                       <LatexMarkdown content={currentSection.exercise.explanation} />
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               </aside>
            </div>
         </main>

         {/* ================= BOTTOM CAROUSEL ================= */}
         <footer className="le-bottom-bar">
            <div className="bottom-container">
               <span className="bar-label">Các phần của bài:</span>

               <div className="sections-carousel">
                  {sections.map((sec, idx) => {
                     const isActive = idx === activeSectionIdx;
                     const isDoc = sec.type === 'doc';

                     return (
                        <button
                           key={idx}
                           type="button"
                           onClick={() => setActiveSectionIdx(idx)}
                           className={`btn-sec-pill ${isActive ? 'active' : ''}`}
                        >
                           <span className={`pill-dot ${isDoc ? 'doc' : 'exercise'}`} />
                           <span className="pill-title">{sec.title || `Phần ${idx + 1}`}</span>
                           <span className="pill-type">[{sec.type}]</span>
                        </button>
                     );
                  })}

                  <div className="add-sec-group">
                     <button
                        type="button"
                        onClick={() => handleAddNewSection('doc')}
                        className="btn-add-sec add-doc"
                        title="Thêm phần lí thuyết mới"
                     >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                        <span>Lí thuyết</span>
                     </button>
                     <button
                        type="button"
                        onClick={() => handleAddNewSection('exercise')}
                        className="btn-add-sec add-ex"
                        title="Thêm phần bài tập mới"
                     >
                        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                        <span>Bài tập</span>
                     </button>
                  </div>
               </div>

               <button
                  type="button"
                  onClick={handleSaveLesson}
                  disabled={saving}
                  className="bottom-save-btn"
               >
                  {saving ? 'Đang lưu...' : 'Lưu tất cả'}
               </button>
            </div>
         </footer>
      </div>
   );
}
