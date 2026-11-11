import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import LatexMarkdown from './common/LatexMarkdown';
import '../styles/LessonEditor.scss';

export default function LessonEditor() {
   const { lessonId } = useParams();
   const navigate = useNavigate();

   const [lesson, setLesson] = useState(null);
   const [chapters, setChapters] = useState([]);
   const [sections, setSections] = useState([]);
   const [activeSectionIdx, setActiveSectionIdx] = useState(0);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false);
   const [lastSavedTime, setLastSavedTime] = useState(null);
   const [toast, setToast] = useState(null);

   const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3200);
   };

   // ── Load Lesson & Chapters ────────────────────────────────────────────────
   useEffect(() => {
      let isMounted = true;
      const loadData = async () => {
         setLoading(true);
         try {
            // Fetch chapters
            const chapRes = await apiClient.get('/chapters');
            if (isMounted) setChapters(chapRes.data || []);

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
                           title: 'I. Lí thuyết trọng tâm',
                           order: 1,
                           type: 'doc',
                           docContent: {
                              format: 'markdown',
                              body: '### Lí thuyết bài học\nNhập nội dung lí thuyết và công thức toán học/vật lí tại đây: $E = mc^2$',
                           },
                        },
                     ];
                  setSections(secs);
                  setLastSavedTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
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
               body: '### Nội dung lí thuyết\nNhập nội dung hỗ trợ công thức LaTeX: $\\Delta U = A + Q$',
            },
         });
      } else {
         updateCurrentSection({
            type: 'exercise',
            exercise: currentSection.exercise || {
               type: 'mcq_single',
               points: 100,
               question: 'Câu hỏi kiểm tra kiến thức: ',
               payload: {
                  options: [
                     { id: 'opt_1', label: 'Lựa chọn A', isCorrect: true },
                     { id: 'opt_2', label: 'Lựa chọn B', isCorrect: false },
                     { id: 'opt_3', label: 'Lựa chọn C', isCorrect: false },
                     { id: 'opt_4', label: 'Lựa chọn D', isCorrect: false },
                  ],
               },
               solution: { correctAnswer: 'opt_1' },
               explanation: 'Giải thích chi tiết cho phương án đúng.',
            },
         });
      }
   };

   // ── Exercise Handlers ─────────────────────────────────────────────────────
   const handleExerciseTypeChange = (eType) => {
      const ex = currentSection?.exercise || {};
      const newEx = { ...ex, type: eType };

      if (eType === 'mcq_single' || eType === 'mcq_multiple') {
         if (!newEx.payload?.options || newEx.payload.options.length === 0) {
            newEx.payload = {
               options: [
                  { id: 'opt_1', label: 'Lựa chọn 1', isCorrect: true },
                  { id: 'opt_2', label: 'Lựa chọn 2', isCorrect: false },
               ],
            };
            newEx.solution = { correctAnswer: 'opt_1' };
         }
      } else if (eType === 'fill_blank') {
         newEx.solution = newEx.solution || { exactValue: '', tolerance: 0.1 };
      }

      updateCurrentSection({ exercise: newEx });
   };

   const handleAddOption = () => {
      const ex = currentSection?.exercise || {};
      const opts = [...(ex.payload?.options || [])];
      const newId = `opt_${Date.now()}`;
      opts.push({ id: newId, label: `Lựa chọn ${opts.length + 1}`, isCorrect: false });
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
         title: type === 'doc' ? `Phần ${sections.length + 1}: Lí thuyết mới` : `Phần ${sections.length + 1}: Bài tập mới`,
         order: sections.length + 1,
         type,
         ...(type === 'doc'
            ? {
               docContent: {
                  format: 'markdown',
                  body: '### Tiêu đề lí thuyết\nNội dung văn bản và công thức LaTeX...',
               },
            }
            : {
               exercise: {
                  type: 'mcq_single',
                  points: 100,
                  question: 'Nội dung câu hỏi trắc nghiệm...',
                  payload: {
                     options: [
                        { id: 'opt_1', label: 'Đáp án A', isCorrect: true },
                        { id: 'opt_2', label: 'Đáp án B', isCorrect: false },
                     ],
                  },
                  solution: { correctAnswer: 'opt_1' },
                  explanation: 'Lời giải chi tiết...',
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

         setLastSavedTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
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
            <div className={`app-toast toast-${toast.type}`} style={{ position: 'fixed', top: '1rem', right: '1.5rem', zIndex: 9999 }}>
               <span className="material-symbols-outlined">
                  {toast.type === 'error' ? 'error' : 'check_circle'}
               </span>
               <span>{toast.message}</span>
            </div>
         )}

         {/* ================= TOP NAVBAR ================= */}
         <header className="le-top-header">
            <div className="le-brand-group">
               <Link to="/topic-manager" className="le-brand-link">
                  <div className="le-brand-badge">Sc</div>
                  <span className="le-brand-name">
                     SciSolve <span className="le-brand-sub">Studio</span>
                  </span>
               </Link>
               <span className="le-brand-divider">|</span>

               {/* Breadcrumb Hierarchy */}
               <nav className="le-breadcrumb-nav">
                  <Link to={lesson?.topicSlug ? `/topic-manager/${lesson.topicSlug}` : '/topic-manager'}>
                     {lesson?.topicTitle || 'Chuyên đề'}
                  </Link>
                  <span className="le-crumb-sep">&gt;</span>
                  <span>{lesson?.chapterTitle || 'Chương học'}</span>
                  <span className="le-crumb-sep">&gt;</span>
                  <span className="le-crumb-current">{lesson?.title || 'Bài học'}</span>
               </nav>
            </div>

            {/* Actions: Save & Publish */}
            <div className="le-header-actions">
               {lastSavedTime && (
                  <span className="le-auto-saved">
                     Đã lưu: {lastSavedTime}
                  </span>
               )}
               <button type="button" onClick={() => navigate(-1)} className="le-btn-back">
                  Quay lại
               </button>
               <button
                  type="button"
                  onClick={handleSaveLesson}
                  disabled={saving}
                  className="le-btn-publish"
               >
                  <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>
                     {saving ? 'hourglass_empty' : 'publish'}
                  </span>
                  <span>{saving ? 'Đang lưu...' : 'Xuất bản bài học'}</span>
               </button>
            </div>
         </header>

         {/* ================= MAIN WORKSPACE ================= */}
         <main className="le-main-container">

            {/* METADATA CỦA BÀI HỌC (LESSON LEVEL) */}
            <div className="le-meta-card">
               <div className="le-meta-grid">
                  <div className="le-field-group">
                     <label>
                        Tiêu đề Bài học (<code>Lesson.title</code>) <span className="req">*</span>
                     </label>
                     <input
                        type="text"
                        value={lesson?.title || ''}
                        onChange={(e) => setLesson((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Ví dụ: Cân bằng lực ma sát và Phản lực pháp tuyến..."
                     />
                  </div>

                  <div className="le-field-group">
                     <label>
                        Thuộc Chương (<code>Chapter</code>)
                     </label>
                     <select
                        value={lesson?.chapterId || ''}
                        onChange={(e) => setLesson((prev) => ({ ...prev, chapterId: e.target.value }))}
                     >
                        <option value="">-- Chọn chương --</option>
                        {chapters.map((chap) => (
                           <option key={chap._id} value={chap._id}>
                              {chap.name}
                           </option>
                        ))}
                     </select>
                  </div>

                  <div className="le-status-toggle-wrap">
                     <label className="toggle-switch">
                        <input
                           type="checkbox"
                           checked={lesson?.isActive !== false}
                           onChange={(e) => setLesson((prev) => ({ ...prev, isActive: e.target.checked }))}
                        />
                        <span className="slider"></span>
                        <span className="toggle-label">Công khai (Live)</span>
                     </label>
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
                           <h2 className="section-card-title">Cấu hình nội dung phần này</h2>
                        </div>

                        {/* Switch Type Buttons */}
                        <div className="section-type-toggle">
                           <button
                              type="button"
                              onClick={() => handleSwitchSectionType('exercise')}
                              className={`btn-type ${currentSection?.type === 'exercise' ? 'active' : ''}`}
                           >
                              ❓ Bài tập (exercise)
                           </button>
                           <button
                              type="button"
                              onClick={() => handleSwitchSectionType('doc')}
                              className={`btn-type ${currentSection?.type === 'doc' ? 'active' : ''}`}
                           >
                              📄 Lí thuyết (doc)
                           </button>
                        </div>
                     </div>

                     {/* Tiêu đề Section */}
                     <div className="le-section-title-field">
                        <div className="field-top">
                           <label>Tiêu đề phần</label>
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
                        <input
                           type="text"
                           value={currentSection?.title || ''}
                           onChange={(e) => updateCurrentSection({ title: e.target.value })}
                           placeholder="Ví dụ: I. Lí thuyết Nguyên lí I hoặc Câu hỏi trắc nghiệm..."
                        />
                     </div>

                     {/* ── FORM BÀI TẬP (EXERCISE BUILDER) ── */}
                     {currentSection?.type === 'exercise' && (
                        <div className="le-exercise-form">
                           <div className="grid-dual">
                              <div className="form-group">
                                 <label>Dạng bài tập</label>
                                 <select
                                    value={currentSection?.exercise?.type || 'mcq_single'}
                                    onChange={(e) => handleExerciseTypeChange(e.target.value)}
                                 >
                                    <option value="mcq_single">Trắc nghiệm 1 đáp án (mcq_single)</option>
                                    <option value="mcq_multiple">Trắc nghiệm nhiều đáp án (mcq_multiple)</option>
                                    <option value="fill_blank">Điền số / kết quả (fill_blank)</option>
                                 </select>
                              </div>

                              <div className="form-group">
                                 <label>
                                    Điểm thưởng XP (<code>exercise.points</code>)
                                 </label>
                                 <input
                                    type="number"
                                    value={currentSection?.exercise?.points || 100}
                                    onChange={(e) => updateCurrentSection({
                                       exercise: { ...currentSection.exercise, points: Number(e.target.value) || 0 },
                                    })}
                                 />
                              </div>
                           </div>

                           {/* Đề bài */}
                           <div className="form-group">
                              <label>Nội dung câu hỏi (Hỗ trợ công thức LaTeX: $v = v_0 + at$)</label>
                              <textarea
                                 rows={3}
                                 placeholder="Nhập nội dung đề bài. Hỗ trợ LaTeX: $\theta = 45^\circ$, $\mu_s = 0.40$..."
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
                                       Đáp số chuẩn (<code>solution.exactValue</code>)
                                    </label>
                                    <input
                                       type="number"
                                       step="0.01"
                                       placeholder="Ví dụ: 42.4"
                                       value={currentSection?.exercise?.solution?.exactValue ?? ''}
                                       onChange={(e) => updateCurrentSection({
                                          exercise: {
                                             ...currentSection.exercise,
                                             solution: { ...currentSection.exercise.solution, exactValue: Number(e.target.value) },
                                          },
                                       })}
                                    />
                                 </div>

                                 <div className="fb-field">
                                    <label>
                                       Sai số cho phép ± (<code>tolerance</code>)
                                    </label>
                                    <input
                                       type="number"
                                       step="0.01"
                                       placeholder="Ví dụ: 0.1"
                                       value={currentSection?.exercise?.solution?.tolerance ?? 0.1}
                                       onChange={(e) => updateCurrentSection({
                                          exercise: {
                                             ...currentSection.exercise,
                                             solution: { ...currentSection.exercise.solution, tolerance: Number(e.target.value) },
                                          },
                                       })}
                                    />
                                 </div>
                              </div>
                           )}

                           {/* Lời giải chi tiết */}
                           <div className="form-group" style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                              <label>
                                 Lời giải chi tiết sau khi nộp (<code>exercise.explanation</code>)
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

                     {/* ── FORM LÍ THUYẾT (DOC BUILDER) ── */}
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
                                    onClick={() => insertDocSnippet('$$\\Delta U = A + Q$$')}
                                    className="tool-latex"
                                    title="Chèn công thức LaTeX khối"
                                 >
                                    LaTeX
                                 </button>
                              </div>
                           </div>
                           <textarea
                              rows={12}
                              placeholder="# Nhập nội dung lí thuyết...&#10;Hỗ trợ LaTeX inline: $v = v_0 + at$ hoặc display math:&#10;$$\Delta U = A + Q$$"
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
                           <span className="ph-title">Xem trước thực tế (Học viên)</span>
                        </div>
                        <span className="ph-type">
                           {currentSection?.type === 'doc' ? '📄 Lí thuyết' : '❓ Bài tập'}
                        </span>
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
                                       placeholder="Ô nhập đáp án của học sinh..."
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
