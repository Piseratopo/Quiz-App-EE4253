import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import '../styles/ChapterManager.scss';

function generateSlug(text) {
   return (text || '')
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
}

export default function ChapterManager() {
   const { slug } = useParams();
   const navigate = useNavigate();

   const [topic, setTopic] = useState(null);
   const [chapters, setChapters] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   // Filter state
   const [searchQuery, setSearchQuery] = useState('');
   const [statusFilter, setStatusFilter] = useState('all');

   // Accordion expansion state
   const [expandedChapters, setExpandedChapters] = useState({});

   // Modals state
   const [chapterModal, setChapterModal] = useState({ isOpen: false, editing: null });
   const [lessonModal, setLessonModal] = useState({ isOpen: false, editing: null, chapterId: '' });
   const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: '', id: '', name: '' });
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Form states
   const [chapterForm, setChapterForm] = useState({ name: '', description: '', order: 1 });
   const [lessonForm, setLessonForm] = useState({
      chapterId: '',
      title: '',
      slug: '',
      description: '',
      order: 1,
      isActive: true,
   });

   // Toast state
   const [toast, setToast] = useState(null);
   const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
   };

   // Load topic & chapters
   const loadTopicData = async () => {
      setLoading(true);
      setError('');
      try {
         let res;
         try {
            res = await apiClient.get(`/admin/topics/${slug}`);
         } catch {
            res = await apiClient.get(`/topics/${slug}`);
         }

         if (res.data) {
            setTopic(res.data);
            const chaps = res.data.chapters || [];
            setChapters(chaps);

            // Mở tất cả các chương theo mặc định
            const initialExpanded = {};
            chaps.forEach((c) => {
               initialExpanded[c._id] = true;
            });
            setExpandedChapters(initialExpanded);
         }
      } catch (err) {
         setError(err.response?.data?.error || 'Không thể tải thông tin chuyên đề.');
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => {
      if (slug) loadTopicData();
   }, [slug]);

   // Toggle chapter accordion
   const toggleChapter = (chapterId) => {
      setExpandedChapters((prev) => ({
         ...prev,
         [chapterId]: !prev[chapterId],
      }));
   };

   // Calculate metrics
   const totalLessons = useMemo(() => {
      return chapters.reduce((acc, c) => acc + (c.lessons?.length || 0), 0);
   }, [chapters]);

   // Filter lessons within chapters
   const filteredChapters = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      return chapters.map((chap) => {
         const lessons = (chap.lessons || []).filter((l) => {
            if (q) {
               const match =
                  (l.title || '').toLowerCase().includes(q) ||
                  (l.slug || '').toLowerCase().includes(q);
               if (!match) return false;
            }
            if (statusFilter === 'active' && l.isActive === false) return false;
            if (statusFilter === 'inactive' && l.isActive !== false) return false;
            return true;
         });
         return {
            ...chap,
            filteredLessons: lessons,
         };
      });
   }, [chapters, searchQuery, statusFilter]);

   // ── Chapter Modal handlers ─────────────────────────────────
   const openAddChapter = () => {
      setChapterForm({
         name: '',
         description: '',
         order: chapters.length + 1,
      });
      setChapterModal({ isOpen: true, editing: null });
   };

   const openEditChapter = (chap) => {
      setChapterForm({
         name: chap.name || '',
         description: chap.description || '',
         order: chap.order || 1,
      });
      setChapterModal({ isOpen: true, editing: chap });
   };

   const handleSaveChapter = async (e) => {
      e.preventDefault();
      if (!chapterForm.name.trim()) {
         showToast('Vui lòng nhập tên chương', 'error');
         return;
      }
      setIsSubmitting(true);
      try {
         if (chapterModal.editing) {
            const res = await apiClient.put(`/chapters/${chapterModal.editing._id}`, chapterForm);
            setChapters((prev) =>
               prev.map((c) =>
                  c._id === chapterModal.editing._id
                     ? { ...c, ...res.data, lessons: c.lessons || [] }
                     : c
               )
            );
            showToast(`Cập nhật chương: "${chapterForm.name}"`);
         } else {
            const res = await apiClient.post('/chapters', {
               ...chapterForm,
               topicId: topic._id,
            });
            const newChap = { ...res.data, lessons: [], filteredLessons: [] };
            setChapters((prev) => [...prev, newChap]);
            setExpandedChapters((prev) => ({ ...prev, [newChap._id]: true }));
            showToast(`Đã thêm chương mới: "${chapterForm.name}"`);
         }
         setChapterModal({ isOpen: false, editing: null });
      } catch (err) {
         showToast(err.response?.data?.error || 'Không thể lưu chương', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // ── Lesson Modal handlers ──────────────────────────────────
   const openAddLesson = (preselectChapterId = '') => {
      const defaultChapId = preselectChapterId || (chapters[0]?._id ? chapters[0]._id : '');
      const chap = chapters.find((c) => c._id === defaultChapId);
      const nextOrder = (chap?.lessons?.length || 0) + 1;

      setLessonForm({
         chapterId: defaultChapId,
         title: '',
         slug: '',
         description: '',
         order: nextOrder,
         isActive: true,
      });
      setLessonModal({ isOpen: true, editing: null, chapterId: defaultChapId });
   };

   const openEditLesson = (lesson, chapterId) => {
      navigate(`/lesson-editor/${lesson._id}`);
      return;
   };

   const _unusedOldOpenEditLesson = (lesson, chapterId) => {
      setLessonForm({
         chapterId: lesson.chapterId || chapterId,
         title: lesson.title || '',
         slug: lesson.slug || '',
         description: lesson.description || '',
         order: lesson.order || 1,
         isActive: lesson.isActive !== false,
      });
      setLessonModal({ isOpen: true, editing: lesson, chapterId });
   };

   const handleLessonTitleChange = (e) => {
      const title = e.target.value;
      setLessonForm((prev) => ({
         ...prev,
         title,
         ...(lessonModal.editing ? {} : { slug: generateSlug(title) }),
      }));
   };

   const handleSaveLesson = async (e) => {
      e.preventDefault();
      if (!lessonForm.title.trim()) {
         showToast('Vui lòng nhập tên bài học', 'error');
         return;
      }
      if (!lessonForm.chapterId) {
         showToast('Vui lòng chọn chương cho bài học', 'error');
         return;
      }

      setIsSubmitting(true);
      try {
         if (lessonModal.editing) {
            const res = await apiClient.put(`/lessons/${lessonModal.editing._id}`, lessonForm);
            const updated = res.data;
            setChapters((prev) =>
               prev.map((c) => {
                  const updatedLessons = (c.lessons || []).map((l) =>
                     l._id === lessonModal.editing._id ? { ...l, ...updated } : l
                  );
                  return { ...c, lessons: updatedLessons };
               })
            );
            showToast(`Cập nhật bài học: "${lessonForm.title}"`);
         } else {
            const res = await apiClient.post('/lessons', lessonForm);
            const created = res.data;
            setChapters((prev) =>
               prev.map((c) => {
                  if (c._id === lessonForm.chapterId) {
                     return { ...c, lessons: [...(c.lessons || []), created] };
                  }
                  return c;
               })
            );
            showToast(`Đã thêm bài học: "${lessonForm.title}"`);
         }
         setLessonModal({ isOpen: false, editing: null, chapterId: '' });
      } catch (err) {
         showToast(err.response?.data?.error || 'Không thể lưu bài học', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Toggle lesson status
   const handleToggleLessonStatus = async (lesson) => {
      const prevStatus = lesson.isActive !== false;
      const newStatus = !prevStatus;

      // Optimistic update
      setChapters((prev) =>
         prev.map((c) => ({
            ...c,
            lessons: (c.lessons || []).map((l) =>
               l._id === lesson._id ? { ...l, isActive: newStatus } : l
            ),
         }))
      );

      try {
         await apiClient.patch(`/lessons/${lesson._id}/toggle-status`);
         showToast(`Đã ${newStatus ? 'hiển thị' : 'ẩn'}: "${lesson.title}"`);
      } catch (err) {
         // Revert
         setChapters((prev) =>
            prev.map((c) => ({
               ...c,
               lessons: (c.lessons || []).map((l) =>
                  l._id === lesson._id ? { ...l, isActive: prevStatus } : l
               ),
            }))
         );
         showToast(err.response?.data?.error || 'Không thể cập nhật trạng thái', 'error');
      }
   };

   // ── Delete Confirmation ────────────────────────────────────
   const handleDeleteConfirm = async () => {
      const { type, id } = deleteModal;
      setIsSubmitting(true);
      try {
         if (type === 'chapter') {
            await apiClient.delete(`/chapters/${id}`);
            setChapters((prev) => prev.filter((c) => c._id !== id));
            showToast('Đã xóa chương thành công');
         } else if (type === 'lesson') {
            await apiClient.delete(`/lessons/${id}`);
            setChapters((prev) =>
               prev.map((c) => ({
                  ...c,
                  lessons: (c.lessons || []).filter((l) => l._id !== id),
               }))
            );
            showToast('Đã xóa bài học thành công');
         }
         setDeleteModal({ isOpen: false, type: '', id: '', name: '' });
      } catch (err) {
         showToast(err.response?.data?.error || 'Không thể xóa mục này', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <div className="chapter-manager-page">
         <div className="cm-main-container">
            {/* Top Breadcrumb & Metadata Trail */}
            <div className="cm-breadcrumb-strip">
               <div className="cm-breadcrumb-path">
                  <span className="cm-crumb-link" onClick={() => navigate('/topic-manager')}>
                     <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>arrow_back</span>
                     <span>Quản trị nội dung</span>
                  </span>
                  <span className="material-symbols-outlined cm-crumb-sep">chevron_right</span>
                  <span className="cm-crumb-current">{topic?.title || 'Đang tải...'}</span>
               </div>
            </div>

            {/* Error banner */}
            {error && (
               <div className="app-alert-error">
                  <span className="material-symbols-outlined">warning</span>
                  <span>{error}</span>
               </div>
            )}

            {/* Refined Topic Context Header */}
            {topic && (
               <div className="cm-context-card">
                  <div className="cm-context-top">
                     <div className="cm-context-info">
                        <h1 className="cm-context-title">{topic.title}</h1>
                        {topic.description && (
                           <p className="cm-context-desc">{topic.description}</p>
                        )}
                     </div>

                     <div className="cm-actions-row">
                        <button className="btn-action-secondary" onClick={openAddChapter}>
                           <span className="material-symbols-outlined" style={{ fontSize: '1.15rem' }}>
                              create_new_folder
                           </span>
                           <span>Thêm chương mới</span>
                        </button>
                        <button className="btn-action-primary" onClick={() => openAddLesson('')}>
                           <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add</span>
                           <span>Thêm bài học mới</span>
                        </button>
                     </div>
                  </div>

                  {/* Compact Filter Strip */}
                  <div className="cm-filter-strip">
                     <div className="cm-search-filter-group">
                        <div className="cm-search-input-wrap">
                           <span className="material-symbols-outlined search-icon">search</span>
                           <input
                              type="text"
                              placeholder="Tìm kiếm nhanh tên bài học..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                           />
                        </div>
                        <div className="cm-status-select-wrap">
                           <select
                              value={statusFilter}
                              onChange={(e) => setStatusFilter(e.target.value)}
                           >
                              <option value="all">Tất cả trạng thái</option>
                              <option value="active">Chỉ bài hiển thị</option>
                              <option value="inactive">Chỉ bản nháp</option>
                           </select>
                           <span className="material-symbols-outlined select-arrow">expand_more</span>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Loading state */}
            {loading && (
               <div className="app-loading-state">
                  <span className="material-symbols-outlined spin-icon">progress_activity</span>
                  <p>Đang tải cấu trúc chương và bài học...</p>
               </div>
            )}

            {/* Hierarchical Chapter Accordion List */}
            {!loading && (
               <div className="cm-chapters-list">
                  {chapters.length === 0 ? (
                     <div className="app-empty-state">
                        <span className="material-symbols-outlined empty-icon">folder_open</span>
                        <h3>Chưa có chương nào</h3>
                        <p>Bắt đầu xây dựng giáo trình bằng cách nhấn "Thêm chương mới".</p>
                        <button
                           className="btn-action-primary"
                           style={{ marginTop: '1rem' }}
                           onClick={openAddChapter}
                        >
                           Thêm chương đầu tiên
                        </button>
                     </div>
                  ) : (
                     filteredChapters.map((chapter, chapIdx) => {
                        const isExpanded = Boolean(expandedChapters[chapter._id]);
                        const lessons = chapter.filteredLessons || [];

                        return (
                           <div className="cm-chapter-card" key={chapter._id}>
                              {/* Chapter Header */}
                              <div className="cm-chapter-header">
                                 <div className="cm-chapter-title-group">
                                    <button
                                       className="btn-toggle-accordion"
                                       onClick={() => toggleChapter(chapter._id)}
                                       title={isExpanded ? 'Thu gọn chương' : 'Mở rộng chương'}
                                    >
                                       <span
                                          className={`material-symbols-outlined icon ${isExpanded ? 'open' : ''}`}
                                       >
                                          expand_more
                                       </span>
                                    </button>

                                    <div className="cm-chapter-text">
                                       <div className="cm-chapter-heading-row">
                                          <span className="cm-chap-num">Chương {chapter.order || chapIdx + 1}</span>
                                          <span className="cm-chap-sep">•</span>
                                          <h2 className="cm-chap-name">{chapter.name}</h2>
                                          <span className="cm-lessons-count-badge">
                                             {chapter.lessons?.length || 0} bài học
                                          </span>
                                       </div>
                                       {chapter.description && (
                                          <p className="cm-chap-desc">{chapter.description}</p>
                                       )}
                                    </div>
                                 </div>

                                 <div className="cm-chapter-actions">
                                    <button
                                       className="btn-add-lesson"
                                       onClick={() => openAddLesson(chapter._id)}
                                       title="Thêm bài học vào chương này"
                                    >
                                       <span className="material-symbols-outlined icon">add</span>
                                       <span>Thêm bài</span>
                                    </button>
                                    <button
                                       className="btn-icon-chapter"
                                       title="Sửa thông tin chương"
                                       onClick={() => openEditChapter(chapter)}
                                    >
                                       <span className="material-symbols-outlined icon">edit</span>
                                    </button>
                                    <button
                                       className="btn-icon-chapter btn-delete"
                                       title="Xóa chương"
                                       onClick={() =>
                                          setDeleteModal({
                                             isOpen: true,
                                             type: 'chapter',
                                             id: chapter._id,
                                             name: chapter.name,
                                          })
                                       }
                                    >
                                       <span className="material-symbols-outlined icon">delete</span>
                                    </button>
                                 </div>
                              </div>

                              {/* Lessons Table when expanded */}
                              {isExpanded && (
                                 <div className="cm-lessons-wrap">
                                    {lessons.length === 0 ? (
                                       <div className="cm-empty-lessons">
                                          Chưa có bài học nào trong chương này.{' '}
                                          <button
                                             className="btn-manage-lessons"
                                             style={{ display: 'inline-flex', marginLeft: '0.5rem' }}
                                             onClick={() => openAddLesson(chapter._id)}
                                          >
                                             Thêm bài học
                                          </button>
                                       </div>
                                    ) : (
                                       <table className="cm-lessons-table">
                                          <thead>
                                             <tr>
                                                <th className="center" style={{ width: '56px' }}>STT</th>
                                                <th>Tên bài học & Đường dẫn</th>
                                                <th className="center">Cấu trúc nội dung</th>
                                                <th className="center">Trạng thái</th>
                                                <th className="right" style={{ paddingRight: '1.25rem' }}>Thao tác</th>
                                             </tr>
                                          </thead>
                                          <tbody>
                                             {lessons.map((lesson, lessonIdx) => {
                                                const rowNum = String(lesson.order || lessonIdx + 1).padStart(2, '0');
                                                const isActive = lesson.isActive !== false;
                                                const docsCount = lesson.docsCount || (lesson.sections || []).filter((s) => s.type === 'doc').length;
                                                const exercisesCount = lesson.exercisesCount || (lesson.sections || []).filter((s) => s.type === 'exercise').length;

                                                return (
                                                   <tr key={lesson._id}>
                                                      {/* STT */}
                                                      <td className="center nowrap">
                                                         <div className="cm-stt-col">
                                                            <span
                                                               className="material-symbols-outlined drag-icon"
                                                               title="Kéo để đổi thứ tự"
                                                            >
                                                               drag_indicator
                                                            </span>
                                                            <span>#{rowNum}</span>
                                                         </div>
                                                      </td>

                                                      {/* Tên bài học & Slug */}
                                                      <td>
                                                         <div className="cm-lesson-info-col">
                                                            <div className="lesson-icon-box">
                                                               <span className="material-symbols-outlined icon">menu_book</span>
                                                            </div>
                                                            <div className="lesson-text">
                                                               <span
                                                                  className="lesson-title-link"
                                                                  onClick={() => openEditLesson(lesson, chapter._id)}
                                                                  style={{ cursor: 'pointer' }}
                                                               >
                                                                  {lesson.title}
                                                               </span>
                                                               <span className="lesson-slug">
                                                                  /lessons/{lesson.slug}
                                                               </span>
                                                            </div>
                                                         </div>
                                                      </td>

                                                      {/* Cấu trúc nội dung */}
                                                      <td className="center nowrap">
                                                         <div className="cm-sections-summary">
                                                            <span className="sec-item">
                                                               <span className="material-symbols-outlined icon">article</span>
                                                               <span>{docsCount} Lí thuyết</span>
                                                            </span>
                                                            <span>•</span>
                                                            <span className="sec-item">
                                                               <span className="material-symbols-outlined icon">quiz</span>
                                                               <span>{exercisesCount} Bài tập</span>
                                                            </span>
                                                         </div>
                                                      </td>

                                                      {/* Trạng thái */}
                                                      <td className="center nowrap">
                                                         <span
                                                            className={`cm-status-badge ${isActive ? 'active' : 'inactive'}`}
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => handleToggleLessonStatus(lesson)}
                                                            title="Nhấn để đổi trạng thái"
                                                         >
                                                            <span className="dot"></span>
                                                            <span>{isActive ? 'Hiển thị' : 'Bản nháp'}</span>
                                                         </span>
                                                      </td>

                                                      {/* Thao tác */}
                                                      <td className="right nowrap" style={{ paddingRight: '1.25rem' }}>
                                                         <div className="cm-lesson-actions">
                                                            <button
                                                               className="btn-edit-details"
                                                               onClick={() => openEditLesson(lesson, chapter._id)}
                                                            >
                                                               <span>Soạn chi tiết</span>
                                                               <span className="material-symbols-outlined icon">
                                                                  arrow_forward
                                                               </span>
                                                            </button>
                                                            <button
                                                               className="btn-icon-lesson"
                                                               title="Sửa tên bài"
                                                               onClick={() => openEditLesson(lesson, chapter._id)}
                                                            >
                                                               <span className="material-symbols-outlined icon">edit</span>
                                                            </button>
                                                            <button
                                                               className="btn-icon-lesson btn-delete"
                                                               title="Xóa bài học"
                                                               onClick={() =>
                                                                  setDeleteModal({
                                                                     isOpen: true,
                                                                     type: 'lesson',
                                                                     id: lesson._id,
                                                                     name: lesson.title,
                                                                  })
                                                               }
                                                            >
                                                               <span className="material-symbols-outlined icon">delete</span>
                                                            </button>
                                                         </div>
                                                      </td>
                                                   </tr>
                                                );
                                             })}
                                          </tbody>
                                       </table>
                                    )}
                                 </div>
                              )}
                           </div>
                        );
                     })
                  )}
               </div>
            )}
         </div>

         {/* ── Modal Thêm / Sửa Chương ──────────────────────────── */}
         {chapterModal.isOpen && (
            <div className="app-modal-backdrop" onClick={() => setChapterModal({ isOpen: false, editing: null })}>
               <div className="app-modal-box" onClick={(e) => e.stopPropagation()}>
                  <div className="app-modal-header">
                     <h2 className="app-modal-title">
                        {chapterModal.editing ? 'Chỉnh sửa chương' : 'Thêm chương mới'}
                     </h2>
                     <button
                        className="app-modal-close"
                        onClick={() => setChapterModal({ isOpen: false, editing: null })}
                     >
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>
                  <form onSubmit={handleSaveChapter}>
                     <div className="app-modal-body">
                        <div className="form-group">
                           <label>Tên chương *</label>
                           <input
                              type="text"
                              required
                              placeholder="Vd: Động học chất điểm (Kinematics)"
                              value={chapterForm.name}
                              onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })}
                           />
                        </div>
                        <div className="form-group">
                           <label>Thứ tự hiển thị (Order)</label>
                           <input
                              type="number"
                              min={1}
                              value={chapterForm.order}
                              onChange={(e) => setChapterForm({ ...chapterForm, order: e.target.value })}
                           />
                        </div>
                        <div className="form-group">
                           <label>Mô tả ngắn</label>
                           <textarea
                              rows={3}
                              placeholder="Mô tả trọng tâm kiến thức của chương..."
                              value={chapterForm.description}
                              onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })}
                           />
                        </div>
                     </div>
                     <div className="app-modal-footer">
                        <button
                           type="button"
                           className="btn-cancel"
                           onClick={() => setChapterModal({ isOpen: false, editing: null })}
                           disabled={isSubmitting}
                        >
                           Hủy
                        </button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                           {isSubmitting ? 'Đang lưu...' : chapterModal.editing ? 'Cập nhật' : 'Thêm chương'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ── Modal Thêm / Sửa Bài Học ─────────────────────────── */}
         {lessonModal.isOpen && (
            <div
               className="app-modal-backdrop"
               onClick={() => setLessonModal({ isOpen: false, editing: null, chapterId: '' })}
            >
               <div className="app-modal-box" onClick={(e) => e.stopPropagation()}>
                  <div className="app-modal-header">
                     <h2 className="app-modal-title">
                        {lessonModal.editing ? 'Chỉnh sửa bài học' : 'Thêm bài học mới'}
                     </h2>
                     <button
                        className="app-modal-close"
                        onClick={() => setLessonModal({ isOpen: false, editing: null, chapterId: '' })}
                     >
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>
                  <form onSubmit={handleSaveLesson}>
                     <div className="app-modal-body">
                        <div className="form-group">
                           <label>Thuộc chương *</label>
                           <select
                              required
                              value={lessonForm.chapterId}
                              onChange={(e) => setLessonForm({ ...lessonForm, chapterId: e.target.value })}
                           >
                              <option value="">-- Chọn chương --</option>
                              {chapters.map((c) => (
                                 <option key={c._id} value={c._id}>
                                    Chương {c.order}: {c.name}
                                 </option>
                              ))}
                           </select>
                        </div>
                        <div className="form-group">
                           <label>Tên bài học *</label>
                           <input
                              type="text"
                              required
                              placeholder="Vd: Chuyển động thẳng biến đổi đều"
                              value={lessonForm.title}
                              onChange={handleLessonTitleChange}
                           />
                        </div>
                        <div className="form-row">
                           <div className="form-group">
                              <label>Đường dẫn Slug *</label>
                              <input
                                 type="text"
                                 required
                                 placeholder="chuyen-dong-thang-bien-doi-deu"
                                 value={lessonForm.slug}
                                 onChange={(e) => setLessonForm({ ...lessonForm, slug: e.target.value })}
                              />
                           </div>
                           <div className="form-group">
                              <label>Thứ tự bài</label>
                              <input
                                 type="number"
                                 min={1}
                                 value={lessonForm.order}
                                 onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="form-group">
                           <label>Mô tả bài học</label>
                           <textarea
                              rows={2}
                              placeholder="Tóm tắt nội dung bài học..."
                              value={lessonForm.description}
                              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                           />
                        </div>
                        <div className="form-group">
                           <label
                              style={{
                                 display: 'flex',
                                 alignItems: 'center',
                                 gap: '0.5rem',
                                 cursor: 'pointer',
                                 textTransform: 'none',
                                 fontWeight: 600,
                                 fontSize: '0.875rem',
                              }}
                           >
                              <input
                                 type="checkbox"
                                 style={{ width: 'auto' }}
                                 checked={lessonForm.isActive}
                                 onChange={(e) => setLessonForm({ ...lessonForm, isActive: e.target.checked })}
                              />
                              Hiển thị bài học ngay (Active)
                           </label>
                        </div>
                     </div>
                     <div className="app-modal-footer">
                        <button
                           type="button"
                           className="btn-cancel"
                           onClick={() => setLessonModal({ isOpen: false, editing: null, chapterId: '' })}
                           disabled={isSubmitting}
                        >
                           Hủy
                        </button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                           {isSubmitting ? 'Đang lưu...' : lessonModal.editing ? 'Cập nhật' : 'Thêm bài học'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ── Modal Xác Nhận Xóa ──────────────────────────────── */}
         {deleteModal.isOpen && (
            <div
               className="app-modal-backdrop"
               onClick={() => setDeleteModal({ isOpen: false, type: '', id: '', name: '' })}
            >
               <div className="app-modal-box" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="app-modal-header">
                     <h2 className="app-modal-title" style={{ color: 'var(--primary-color)' }}>Xác nhận xóa</h2>
                     <button
                        className="app-modal-close"
                        onClick={() => setDeleteModal({ isOpen: false, type: '', id: '', name: '' })}
                     >
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>
                  <div className="app-modal-body">
                     <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(0,0,0,0.65)', fontSize: '0.9rem' }}>
                        Bạn có chắc chắn muốn xóa {deleteModal.type === 'chapter' ? 'chương' : 'bài học'}{' '}
                        <strong>"{deleteModal.name}"</strong>?
                        {deleteModal.type === 'chapter' &&
                           ' Tất cả các bài học bên trong chương này cũng sẽ bị xóa vĩnh viễn.'}
                     </p>
                  </div>
                  <div className="app-modal-footer">
                     <button
                        className="btn-cancel"
                        onClick={() => setDeleteModal({ isOpen: false, type: '', id: '', name: '' })}
                        disabled={isSubmitting}
                     >
                        Hủy
                     </button>
                     <button
                        className="btn-save btn-save--danger"
                        onClick={handleDeleteConfirm}
                        disabled={isSubmitting}
                     >
                        {isSubmitting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* ── Toast Notification ──────────────────────────────── */}
         {toast && (
            <div className={`app-toast ${toast.type}`}>
               <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>
                  {toast.type === 'error' ? 'error' : 'check_circle'}
               </span>
               <span>{toast.message}</span>
            </div>
         )}
      </div>
   );
}
