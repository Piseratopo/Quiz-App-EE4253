import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import '../styles/TopicManager.scss';

// ── Discipline display names ──────────────────────────────────────────────────
const DISCIPLINE_NAMES = {
   phys: 'Vật lí', physics: 'Vật lí',
   math: 'Toán học', maths: 'Toán học',
   chem: 'Hóa học',
   cs: 'Khoa học Máy tính',
   soc: 'Khoa học Xã hội',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(text) {
   return text
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

function formatDate(dateInput) {
   if (!dateInput) return '--';
   try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '--';
      return [
         String(d.getDate()).padStart(2, '0'),
         String(d.getMonth() + 1).padStart(2, '0'),
         d.getFullYear(),
      ].join('/') + ' ' +
         String(d.getHours()).padStart(2, '0') + ':' +
         String(d.getMinutes()).padStart(2, '0');
   } catch {
      return '--';
   }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TopicManager() {
   const navigate = useNavigate();

   const [topics, setTopics] = useState([]);
   const [metrics, setMetrics] = useState({ totalTopics: 0, totalLessons: 0, totalExercises: 0 });
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');

   const [searchQuery, setSearchQuery] = useState('');
   const [selectedDiscipline, setSelectedDiscipline] = useState('');
   const [selectedStatus, setSelectedStatus] = useState('');

   const [pageSize, setPageSize] = useState(5);
   const [currentPage, setCurrentPage] = useState(1);

   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingTopic, setEditingTopic] = useState(null);
   const [deleteConfirmId, setDeleteConfirmId] = useState(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   const [formData, setFormData] = useState({
      title: '', slug: '', discipline: 'physics', description: '',
      thumbnail: '', order: 1, isActive: true,
   });

   const [toast, setToast] = useState(null);

   const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
   };

   // Fetch from server ───────────────────────────────────────────
   const fetchTopics = async () => {
      setLoading(true);
      setError('');
      try {
         const res = await apiClient.get('/admin/topics');
         const fetchedTopics = res.data?.topics || [];
         setTopics(fetchedTopics);
         if (res.data?.metrics) {
            setMetrics(res.data.metrics);
         } else {
            setMetrics({
               totalTopics: fetchedTopics.length,
               totalLessons: fetchedTopics.reduce((acc, t) => acc + (t.lessonsCount || 0), 0),
               totalExercises: fetchedTopics.reduce((acc, t) => acc + (t.exercisesCount || 0), 0),
            });
         }
      } catch (err) {
         const msg = err.response?.data?.error || 'Không thể tải danh sách chuyên đề từ máy chủ.';
         setError(msg);
         setTopics([]);
      } finally {
         setLoading(false);
      }
   };

   useEffect(() => { fetchTopics(); }, []);

   // Filter ──────────────────────────────────────────────────────
   const filteredTopics = useMemo(() => topics.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
         const ok = (t.title || '').toLowerCase().includes(q) ||
            (t.slug || '').toLowerCase().includes(q);
         if (!ok) return false;
      }
      if (selectedDiscipline) {
         const d = t.discipline || 'physics';
         if (selectedDiscipline === 'phys' && !['phys', 'physics'].includes(d)) return false;
         if (selectedDiscipline === 'math' && !['math', 'maths'].includes(d)) return false;
         if (!['phys', 'math'].includes(selectedDiscipline) && d !== selectedDiscipline) return false;
      }
      if (selectedStatus === 'active'   && t.isActive === false) return false;
      if (selectedStatus === 'inactive' && t.isActive !== false) return false;
      return true;
   }), [topics, searchQuery, selectedDiscipline, selectedStatus]);

   const totalItems   = filteredTopics.length;
   const totalPages   = Math.max(1, Math.ceil(totalItems / pageSize));
   const safePage     = Math.min(currentPage, totalPages);

   const paginatedTopics = useMemo(() => {
      const start = (safePage - 1) * pageSize;
      return filteredTopics.slice(start, start + pageSize);
   }, [filteredTopics, safePage, pageSize]);

   const handleResetFilters = () => {
      setSearchQuery(''); setSelectedDiscipline(''); setSelectedStatus(''); setCurrentPage(1);
   };

   // Toggle status ───────────────────────────────────────────────
   const handleToggleStatus = async (topic) => {
      const prevStatus = topic.isActive !== false;
      const newStatus = !prevStatus;

      // Optimistic update
      setTopics((prev) => prev.map((t) =>
         t._id === topic._id ? { ...t, isActive: newStatus, updatedAt: new Date() } : t
      ));

      try {
         await apiClient.patch(`/topics/${topic._id}/toggle-status`);
         showToast(`Đã ${newStatus ? 'hiển thị' : 'ẩn'}: "${topic.title}"`);
      } catch (err) {
         // Revert on failure
         setTopics((prev) => prev.map((t) =>
            t._id === topic._id ? { ...t, isActive: prevStatus } : t
         ));
         showToast(err.response?.data?.error || 'Không thể cập nhật trạng thái', 'error');
      }
   };

   // Modal helpers ───────────────────────────────────────────────
   const openCreateModal = () => {
      setEditingTopic(null);
      setFormData({
         title: '',
         slug: '',
         discipline: 'physics',
         description: '',
         thumbnail: '',
         order: topics.length + 1,
         isActive: true,
      });
      setIsModalOpen(true);
   };

   const openEditModal = (topic) => {
      setEditingTopic(topic);
      setFormData({
         title: topic.title || '',
         slug: topic.slug || '',
         discipline: topic.discipline || 'physics',
         description: topic.description || '',
         thumbnail: topic.thumbnail || '',
         order: topic.order || 1,
         isActive: topic.isActive !== false,
      });
      setIsModalOpen(true);
   };

   const handleTitleChange = (e) => {
      const title = e.target.value;
      setFormData((prev) => ({
         ...prev,
         title,
         ...(editingTopic ? {} : { slug: generateSlug(title) }),
      }));
   };

   // Save (Create / Edit) ─────────────────────────────────────────
   const handleSaveTopic = async (e) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.slug.trim()) {
         showToast('Vui lòng nhập tên chuyên đề và slug', 'error');
         return;
      }
      setIsSubmitting(true);
      try {
         if (editingTopic) {
            const res = await apiClient.put(`/topics/${editingTopic._id}`, formData);
            const updated = res.data;
            setTopics((prev) => prev.map((t) => t._id === editingTopic._id ? { ...t, ...updated } : t));
            showToast(`Cập nhật thành công: "${formData.title}"`);
         } else {
            const res = await apiClient.post('/topics', formData);
            const created = {
               ...res.data,
               chaptersCount: 0,
               lessonsCount: 0,
               exercisesCount: 0,
            };
            setTopics((prev) => [created, ...prev]);
            setMetrics((prev) => ({ ...prev, totalTopics: prev.totalTopics + 1 }));
            showToast(`Đã tạo thành công: "${formData.title}"`);
         }
         setIsModalOpen(false);
      } catch (err) {
         showToast(err.response?.data?.error || 'Có lỗi xảy ra khi lưu chuyên đề', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Delete ──────────────────────────────────────────────────────
   const handleDeleteTopic = async (id) => {
      try {
         await apiClient.delete(`/topics/${id}`);
         setTopics((prev) => prev.filter((t) => t._id !== id));
         setMetrics((prev) => ({ ...prev, totalTopics: Math.max(0, prev.totalTopics - 1) }));
         setDeleteConfirmId(null);
         showToast('Đã xóa chuyên đề thành công');
      } catch (err) {
         showToast(err.response?.data?.error || 'Không thể xóa chuyên đề', 'error');
      }
   };

   // ── Render ────────────────────────────────────────────────────
   return (
      <div className="topic-manager-page">

         {/* ── Hero ───────────────────────────────────────────────── */}
         <section className="tm-hero-section">
            <div className="tm-hero-container">
               <h1 className="tm-hero-title">Quản lí chuyên đề</h1>

               <button className="tm-btn-primary" onClick={openCreateModal}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>add_circle</span>
                  <span>Tạo chuyên đề mới</span>
               </button>
            </div>
         </section>

         {/* ── Main ───────────────────────────────────────────────── */}
         <div className="tm-main-container">

            {/* Breadcrumb */}
            <div className="tm-breadcrumb-strip">
               <div className="tm-breadcrumb-path">
                  <span className="tm-crumb-link" onClick={() => navigate('/home')}>Quản trị nội dung</span>
                  <span className="material-symbols-outlined tm-crumb-sep" style={{ fontSize: '1rem' }}>chevron_right</span>
                  <span className="tm-crumb-current">Cấu trúc chuyên đề</span>
               </div>
            </div>

            {/* Error alert if any */}
            {error && (
               <div className="app-alert-error">
                  <span className="material-symbols-outlined">warning</span>
                  <span>{error}</span>
               </div>
            )}

            {/* Metric cards */}
            <div className="tm-metrics-grid">
               {[
                  { label: 'Tổng số Chuyên đề', value: metrics.totalTopics, unit: 'chuyên đề', icon: 'category' },
                  { label: 'Tổng số Bài học',   value: metrics.totalLessons,   unit: 'bài học',   icon: 'menu_book' },
                  { label: 'Tổng số Bài tập',   value: metrics.totalExercises, unit: 'bài tập',   icon: 'task_alt' },
               ].map((m) => (
                  <div className="tm-metric-card" key={m.label}>
                     <div>
                        <span className="tm-metric-label">{m.label}</span>
                        <div className="tm-metric-value-wrap">
                           <span className="tm-metric-number">{m.value}</span>
                           <span className="tm-metric-unit">{m.unit}</span>
                        </div>
                     </div>
                     <div className="tm-metric-icon-wrap">
                        <span className="material-symbols-outlined">{m.icon}</span>
                     </div>
                  </div>
               ))}
            </div>

            {/* Toolbar */}
            <div className="tm-toolbar-bar">
               <div className="tm-search-wrap">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input
                     type="text"
                     placeholder="Tìm kiếm theo tên hoặc slug..."
                     value={searchQuery}
                     onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  />
               </div>
               <div className="tm-select-wrap">
                  <select value={selectedDiscipline} onChange={(e) => { setSelectedDiscipline(e.target.value); setCurrentPage(1); }}>
                     <option value="">Tất cả Phân ngành</option>
                     <option value="phys">Vật lí</option>
                     <option value="math">Toán học</option>
                     <option value="chem">Hóa học</option>
                     <option value="cs">Khoa học Máy tính</option>
                     <option value="soc">Khoa học Xã hội</option>
                  </select>
                  <span className="material-symbols-outlined dropdown-icon">arrow_drop_down</span>
               </div>
               <div className="tm-select-wrap">
                  <select value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}>
                     <option value="">Tất cả Trạng thái</option>
                     <option value="active">Đang hiển thị</option>
                     <option value="inactive">Bản nháp (Ẩn)</option>
                  </select>
                  <span className="material-symbols-outlined dropdown-icon">arrow_drop_down</span>
               </div>
               <button className="tm-reset-btn" title="Xóa bộ lọc" onClick={handleResetFilters}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>filter_alt_off</span>
               </button>
            </div>

            {/* Loading state */}
            {loading ? (
               <div className="app-loading-state">
                  <span className="material-symbols-outlined spin-icon">progress_activity</span>
                  <p>Đang tải danh sách chuyên đề...</p>
               </div>
            ) : (
               /* Table Card */
               <div className="tm-table-card">
                  <div className="tm-table-header-strip">
                     <div className="tm-table-title">
                        <span className="material-symbols-outlined header-icon">table_chart</span>
                        <span>Danh sách chuyên đề ({filteredTopics.length} / {metrics.totalTopics})</span>
                     </div>
                  </div>

                  <div className="tm-table-scroll">
                     <table>
                        <thead>
                           <tr>
                              <th className="center" style={{ width: '56px' }}>STT</th>
                              <th>Tên chuyên đề & Slug</th>
                              <th>Phân ngành</th>
                              <th>Quy mô</th>
                              <th>Trạng thái</th>
                              <th>Cập nhật</th>
                              <th className="right" style={{ paddingRight: '1.25rem' }}>Thao tác</th>
                           </tr>
                        </thead>
                        <tbody>
                           {paginatedTopics.length === 0 ? (
                              <tr>
                                 <td colSpan="7" className="center" style={{ padding: '3rem', color: 'rgba(0,0,0,0.4)' }}>
                                    {topics.length === 0 ? 'Chưa có chuyên đề nào trong cơ sở dữ liệu.' : 'Không tìm thấy chuyên đề phù hợp với bộ lọc.'}
                                 </td>
                              </tr>
                           ) : paginatedTopics.map((topic, idx) => {
                              const rowNum    = String((safePage - 1) * pageSize + idx + 1).padStart(2, '0');
                              const discName  = DISCIPLINE_NAMES[topic.discipline] || topic.discipline || 'Vật lí';
                              const isActive  = topic.isActive !== false;
                              return (
                                 <tr key={topic._id || topic.slug}>
                                    <td className="center nowrap">
                                       <div className="tm-stt-cell">
                                          <span className="material-symbols-outlined drag-icon" title="Kéo để sắp xếp">drag_indicator</span>
                                          <span>#{rowNum}</span>
                                       </div>
                                    </td>

                                    <td>
                                       <div className="tm-title-cell">
                                          <span className="topic-name">{topic.title}</span>
                                          <span className="topic-slug">/topics/{topic.slug}</span>
                                          {topic.description && <span className="topic-desc">{topic.description}</span>}
                                       </div>
                                    </td>

                                    <td className="nowrap">
                                       <span className="tm-discipline-tag">{discName}</span>
                                    </td>

                                    <td className="nowrap">
                                       <div className="tm-stats-cell">
                                          <span className="stats-primary">{topic.chaptersCount || 0} Chương · {topic.lessonsCount || 0} Bài</span>
                                          <span className="stats-secondary">{topic.exercisesCount || 0} Bài tập</span>
                                       </div>
                                    </td>

                                    <td className="nowrap">
                                       <div className="tm-status-toggle" onClick={() => handleToggleStatus(topic)}>
                                          <div className={`toggle-track${isActive ? ' active' : ''}`}>
                                             <div className={`toggle-thumb${isActive ? ' active' : ''}`} />
                                          </div>
                                          <span className={`status-text${isActive ? ' active' : ' inactive'}`}>
                                             {isActive ? 'Hiển thị' : 'Ẩn'}
                                          </span>
                                       </div>
                                    </td>

                                    <td className="nowrap tm-date-cell">{formatDate(topic.updatedAt || topic.createdAt)}</td>

                                    <td className="right nowrap" style={{ paddingRight: '1.25rem' }}>
                                       <div className="tm-actions-group">
                                          <button
                                             className="btn-manage-lessons"
                                             title="Quản lí chương & bài học"
                                             onClick={() => navigate(`/topic-manager/${topic.slug}`)}
                                          >
                                             <span className="material-symbols-outlined icon">account_tree</span>
                                             <span>Chương & Bài</span>
                                             <span className="material-symbols-outlined icon">arrow_forward</span>
                                          </button>
                                          <button
                                             className="btn-icon-action"
                                             title="Sửa chương & bài học"
                                             onClick={() => navigate(`/topic-manager/${topic.slug}`)}
                                          >
                                             <span className="material-symbols-outlined icon">edit</span>
                                          </button>
                                          <button
                                             className="btn-icon-action"
                                             title="Chỉnh sửa thông tin chuyên đề"
                                             onClick={() => openEditModal(topic)}
                                          >
                                             <span className="material-symbols-outlined icon">settings</span>
                                          </button>
                                          <button className="btn-icon-action btn-delete" title="Xóa" onClick={() => setDeleteConfirmId(topic._id)}>
                                             <span className="material-symbols-outlined icon">delete</span>
                                          </button>
                                       </div>
                                    </td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>

                  {/* Pagination */}
                  <div className="tm-pagination-strip">
                     <div className="tm-page-info">
                        <span>Hiển thị</span>
                        <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                           <option value={5}>5 / trang</option>
                           <option value={10}>10 / trang</option>
                           <option value={25}>25 / trang</option>
                        </select>
                        <span>trong {totalItems} chuyên đề</span>
                     </div>
                     <div className="tm-page-controls">
                        <button className="btn-page-step" onClick={() => setCurrentPage(1)} disabled={safePage === 1}>
                           <span className="material-symbols-outlined icon">first_page</span>
                        </button>
                        <button className="btn-page-step" onClick={() => setCurrentPage((p) => p - 1)} disabled={safePage === 1}>
                           <span className="material-symbols-outlined icon">chevron_left</span>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                           <button key={p} className={`btn-page-number${safePage === p ? ' active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
                        ))}
                        <button className="btn-page-step" onClick={() => setCurrentPage((p) => p + 1)} disabled={safePage === totalPages}>
                           <span className="material-symbols-outlined icon">chevron_right</span>
                        </button>
                        <button className="btn-page-step" onClick={() => setCurrentPage(totalPages)} disabled={safePage === totalPages}>
                           <span className="material-symbols-outlined icon">last_page</span>
                        </button>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* ── Create / Edit Modal ─────────────────────────────────── */}
         {isModalOpen && (
            <div className="app-modal-backdrop" onClick={() => setIsModalOpen(false)}>
               <div className="app-modal-box" onClick={(e) => e.stopPropagation()}>
                  <div className="app-modal-header">
                     <h2 className="app-modal-title">
                        {editingTopic ? 'Chỉnh sửa chuyên đề' : 'Tạo chuyên đề mới'}
                     </h2>
                     <button className="app-modal-close" onClick={() => setIsModalOpen(false)}>
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>
                  <form onSubmit={handleSaveTopic}>
                     <div className="app-modal-body">
                        <div className="form-group">
                           <label>Tên chuyên đề *</label>
                           <input type="text" required placeholder="Vd: Cơ học cổ điển & Động lực học" value={formData.title} onChange={handleTitleChange} />
                        </div>
                        <div className="form-row">
                           <div className="form-group">
                              <label>Slug *</label>
                              <input type="text" required placeholder="co-hoc-co-dien" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} />
                           </div>
                           <div className="form-group">
                              <label>Phân ngành</label>
                              <select value={formData.discipline} onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}>
                                 <option value="physics">Vật lí</option>
                                 <option value="maths">Toán học</option>
                                 <option value="chem">Hóa học</option>
                                 <option value="cs">Khoa học Máy tính</option>
                                 <option value="soc">Khoa học Xã hội</option>
                              </select>
                           </div>
                        </div>
                        <div className="form-group">
                           <label>Mô tả tóm tắt</label>
                           <textarea rows={3} placeholder="Nội dung trọng tâm của chuyên đề..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="form-row">
                           <div className="form-group">
                              <label>Ảnh đại diện (URL)</label>
                              <input type="url" placeholder="https://..." value={formData.thumbnail} onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })} />
                           </div>
                           <div className="form-group">
                              <label>Thứ tự (Order)</label>
                              <input type="number" min={1} value={formData.order} onChange={(e) => setFormData({ ...formData, order: e.target.value })} />
                           </div>
                        </div>
                        <div className="form-group">
                           <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' }}>
                              <input type="checkbox" style={{ width: 'auto' }} checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} />
                              Hiển thị trên Cổng học viên ngay
                           </label>
                        </div>
                     </div>
                     <div className="app-modal-footer">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Hủy</button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                           {isSubmitting ? 'Đang lưu...' : editingTopic ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* ── Delete Confirm ──────────────────────────────────────── */}
         {deleteConfirmId && (
            <div className="app-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
               <div className="app-modal-box" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="app-modal-header">
                     <h2 className="app-modal-title" style={{ color: 'var(--primary-color)' }}>Xác nhận xóa</h2>
                     <button className="app-modal-close" onClick={() => setDeleteConfirmId(null)}>
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>
                  <div className="app-modal-body">
                     <p style={{ margin: 0, lineHeight: 1.6, color: 'rgba(0,0,0,0.65)', fontSize: '0.9rem' }}>
                        Bạn có chắc muốn xóa chuyên đề này? Toàn bộ chương và bài học bên trong cũng sẽ bị xóa vĩnh viễn.
                     </p>
                  </div>
                  <div className="app-modal-footer">
                     <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Hủy</button>
                     <button className="btn-save btn-save--danger" onClick={() => handleDeleteTopic(deleteConfirmId)}>Xóa chuyên đề</button>
                  </div>
               </div>
            </div>
         )}

         {/* ── Toast ──────────────────────────────────────────────── */}
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
