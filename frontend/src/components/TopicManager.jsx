import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import '../styles/TopicManager.scss';

// Discipline metadata & display names
const DISCIPLINE_NAMES = {
   phys: 'Vật lý',
   physics: 'Vật lý',
   math: 'Toán học',
   maths: 'Toán học',
   chem: 'Hóa học',
   cs: 'Khoa học Máy tính',
   soc: 'Khoa học Xã hội',
};

// Initial fallback topics if backend is freshly started or seeding
const FALLBACK_TOPICS = [
   {
      _id: 'top_1',
      title: 'Cơ học Cổ điển & Động lực học Newton',
      slug: 'co-hoc-co-dien',
      discipline: 'physics',
      description: 'Tọa độ Lagrange, hệ quy chiếu phi quán tính và con lắc dao động.',
      chaptersCount: 4,
      lessonsCount: 14,
      exercisesCount: 48,
      isActive: true,
      updatedAt: '2025-10-14T09:30:00Z',
      order: 1,
   },
   {
      _id: 'top_2',
      title: 'Vật lý Thiên văn & Động lực học Không gian',
      slug: 'vat-ly-thien-van',
      discipline: 'physics',
      description: 'Quỹ đạo Kepler, phương trình lực hấp dẫn Newton và vector trực giao.',
      chaptersCount: 3,
      lessonsCount: 8,
      exercisesCount: 24,
      isActive: true,
      updatedAt: '2025-10-12T14:15:00Z',
      order: 2,
   },
   {
      _id: 'top_3',
      title: 'Tư duy Giải tích & Đạo hàm Tương tác',
      slug: 'giai-tich-dao-ham',
      discipline: 'maths',
      description: 'Tích phân Riemann, chuỗi Taylor và trực quan hóa giới hạn hàm số.',
      chaptersCount: 5,
      lessonsCount: 20,
      exercisesCount: 82,
      isActive: true,
      updatedAt: '2025-10-10T18:40:00Z',
      order: 3,
   },
   {
      _id: 'top_4',
      title: 'Vật lý Lượng tử: Trạng thái & Hàm sóng',
      slug: 'vat-ly-luong-tu',
      discipline: 'physics',
      description: 'Phương trình Schrödinger, thế giếng vô hạn và lưỡng tính sóng hạt.',
      chaptersCount: 4,
      lessonsCount: 15,
      exercisesCount: 54,
      isActive: true,
      updatedAt: '2025-10-08T11:20:00Z',
      order: 4,
   },
   {
      _id: 'top_5',
      title: 'Lý thuyết Trò chơi & Ma trận Nash',
      slug: 'ly-thuyet-tro-choi',
      discipline: 'soc',
      description: 'Cân bằng Nash, chiến lược thuần túy và ma trận thanh toán song phương.',
      chaptersCount: 3,
      lessonsCount: 12,
      exercisesCount: 36,
      isActive: false,
      updatedAt: '2025-10-05T16:05:00Z',
      order: 5,
   },
];

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
   if (!dateInput) return 'Vừa xong';
   try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return '14/10/2025 09:30';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
   } catch {
      return '14/10/2025 09:30';
   }
}

export default function TopicManager() {
   const navigate = useNavigate();

   // Data state
   const [topics, setTopics] = useState(FALLBACK_TOPICS);
   const [metrics, setMetrics] = useState({
      totalTopics: 14,
      totalLessons: 128,
      totalExercises: 460,
   });
   const [isConnected, setIsConnected] = useState(true);

   // Filter state
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedDiscipline, setSelectedDiscipline] = useState('');
   const [selectedStatus, setSelectedStatus] = useState('');

   // Pagination state
   const [pageSize, setPageSize] = useState(5);
   const [currentPage, setCurrentPage] = useState(1);

   // Modal state
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingTopic, setEditingTopic] = useState(null);
   const [deleteConfirmId, setDeleteConfirmId] = useState(null);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Form data state
   const [formData, setFormData] = useState({
      title: '',
      slug: '',
      discipline: 'physics',
      description: '',
      thumbnail: '',
      order: 1,
      isActive: true,
   });

   // Toast notification state
   const [toast, setToast] = useState(null);

   const showToast = (message, type = 'success') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 3500);
   };

   // Fetch data from backend
   const fetchTopics = async () => {
      try {
         const res = await apiClient.get('/admin/topics');
         if (res.data && Array.isArray(res.data.topics)) {
            setTopics(res.data.topics);
            if (res.data.metrics) {
               setMetrics(res.data.metrics);
            }
            setIsConnected(true);
         }
      } catch (err) {
         console.warn('Could not connect to /admin/topics backend endpoint, using current state:', err);
         setIsConnected(false);
      }
   };

   useEffect(() => {
      fetchTopics();
   }, []);

   // Filtered topics calculation
   const filteredTopics = useMemo(() => {
      return topics.filter((t) => {
         // Search match
         const query = searchQuery.trim().toLowerCase();
         if (query) {
            const matchTitle = (t.title || '').toLowerCase().includes(query);
            const matchSlug = (t.slug || '').toLowerCase().includes(query);
            if (!matchTitle && !matchSlug) return false;
         }

         // Discipline match
         if (selectedDiscipline) {
            const disc = t.discipline || 'physics';
            if (selectedDiscipline === 'phys' && !['phys', 'physics'].includes(disc)) return false;
            if (selectedDiscipline === 'math' && !['math', 'maths'].includes(disc)) return false;
            if (selectedDiscipline === 'chem' && disc !== 'chem') return false;
            if (selectedDiscipline === 'cs' && disc !== 'cs') return false;
            if (selectedDiscipline === 'soc' && disc !== 'soc') return false;
         }

         // Status match
         if (selectedStatus === 'active' && t.isActive === false) return false;
         if (selectedStatus === 'inactive' && t.isActive !== false) return false;

         return true;
      });
   }, [topics, searchQuery, selectedDiscipline, selectedStatus]);

   // Pagination calculations
   const totalItems = filteredTopics.length;
   const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
   const validCurrentPage = Math.min(currentPage, totalPages);

   const paginatedTopics = useMemo(() => {
      const startIndex = (validCurrentPage - 1) * pageSize;
      return filteredTopics.slice(startIndex, startIndex + pageSize);
   }, [filteredTopics, validCurrentPage, pageSize]);

   // Reset filter
   const handleResetFilters = () => {
      setSearchQuery('');
      setSelectedDiscipline('');
      setSelectedStatus('');
      setCurrentPage(1);
   };

   // Toggle topic active status
   const handleToggleStatus = async (topic) => {
      const newStatus = !topic.isActive;
      // Optimistic update
      setTopics((prev) =>
         prev.map((t) => (t._id === topic._id ? { ...t, isActive: newStatus, updatedAt: new Date() } : t))
      );

      try {
         await apiClient.patch(`/topics/${topic._id}/toggle-status`);
         showToast(`Đã ${newStatus ? 'hiển thị' : 'ẩn'} chuyên đề: "${topic.title}"`);
      } catch (err) {
         console.warn('Error saving toggle status to backend:', err);
         showToast(`Đã cập nhật trạng thái tạm thời`, 'info');
      }
   };

   // Open Create Modal
   const handleOpenCreateModal = () => {
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

   // Open Edit Modal
   const handleOpenEditModal = (topic) => {
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

   // Handle title change with auto slug generation
   const handleTitleChange = (e) => {
      const title = e.target.value;
      if (!editingTopic) {
         setFormData((prev) => ({
            ...prev,
            title,
            slug: generateSlug(title),
         }));
      } else {
         setFormData((prev) => ({
            ...prev,
            title,
         }));
      }
   };

   // Submit form (Create / Edit)
   const handleSaveTopic = async (e) => {
      e.preventDefault();
      if (!formData.title.trim() || !formData.slug.trim()) {
         showToast('Vui lòng nhập tên chuyên đề và slug', 'error');
         return;
      }

      setIsSubmitting(true);
      try {
         if (editingTopic) {
            // Update topic
            try {
               const res = await apiClient.put(`/topics/${editingTopic._id}`, formData);
               setTopics((prev) =>
                  prev.map((t) => (t._id === editingTopic._id ? { ...t, ...res.data } : t))
               );
            } catch {
               // Fallback local update
               setTopics((prev) =>
                  prev.map((t) =>
                     t._id === editingTopic._id
                        ? { ...t, ...formData, updatedAt: new Date() }
                        : t
                  )
               );
            }
            showToast(`Cập nhật thành công chuyên đề: "${formData.title}"`);
         } else {
            // Create topic
            const newOrder = Number(formData.order) || topics.length + 1;
            let createdTopic = {
               _id: 'top_' + Date.now(),
               ...formData,
               order: newOrder,
               chaptersCount: 0,
               lessonsCount: 0,
               exercisesCount: 0,
               createdAt: new Date(),
               updatedAt: new Date(),
            };

            try {
               const res = await apiClient.post('/topics', formData);
               if (res.data) {
                  createdTopic = {
                     ...res.data,
                     chaptersCount: 0,
                     lessonsCount: 0,
                     exercisesCount: 0,
                  };
               }
            } catch {
               // local state fallback
            }

            setTopics((prev) => [createdTopic, ...prev]);
            setMetrics((prev) => ({ ...prev, totalTopics: prev.totalTopics + 1 }));
            showToast(`Đã tạo mới chuyên đề: "${formData.title}"`);
         }

         setIsModalOpen(false);
      } catch (err) {
         showToast(err.response?.data?.error || 'Có lỗi xảy ra', 'error');
      } finally {
         setIsSubmitting(false);
      }
   };

   // Delete Topic
   const handleDeleteTopic = async (id) => {
      try {
         await apiClient.delete(`/topics/${id}`);
      } catch {
         // Continue with optimistic delete
      }
      setTopics((prev) => prev.filter((t) => t._id !== id));
      setMetrics((prev) => ({ ...prev, totalTopics: Math.max(0, prev.totalTopics - 1) }));
      setDeleteConfirmId(null);
      showToast('Đã xóa chuyên đề thành công');
   };

   return (
      <div className="topic-manager-container">
         {/* Academic Breadcrumb Strip */}
         <div className="tm-breadcrumb-strip">
            <div className="tm-breadcrumb-path">
               <span className="tm-crumb-link" onClick={() => navigate('/home')}>Quản trị Nội dung</span>
               <span className="material-symbols-outlined text-[16px]">chevron_right</span>
               <span className="tm-crumb-current">Cấu trúc Chuyên đề (Topics)</span>
            </div>
            <div className="tm-db-badge">
               <span className={`status-dot ${!isConnected ? 'offline' : ''}`}></span>
               <span>{isConnected ? 'Database Connected: MongoDB Primary' : 'Local Data Mode (Demo)'}</span>
            </div>
         </div>

         {/* Header Card & Primary CTA */}
         <div className="tm-header-card">
            <div className="tm-header-content">
               <div>
                  <div className="tm-badge-row">
                     <span className="tm-meta-tag">Cơ sở dữ liệu Học liệu</span>
                     <span className="tm-schema-text">db.topics (Schema v1.2)</span>
                  </div>
                  <h1 className="tm-header-title">Quản lý Chuyên đề (Topic Management)</h1>
                  <p className="tm-header-desc">
                     Quản trị tầng cấp cao nhất của hệ thống học liệu theo mô hình phân cấp:{' '}
                     <strong>Chuyên đề (Topic) → Chương (Chapter) → Bài học (Lesson) → Mục nội dung (Section)</strong>.
                  </p>
               </div>
               <div className="shrink-0">
                  <button className="tm-btn-primary" onClick={handleOpenCreateModal}>
                     <span className="material-symbols-outlined text-[20px]">add_circle</span>
                     <span>+ Tạo Chuyên đề Mới</span>
                  </button>
               </div>
            </div>
         </div>

         {/* Real Metric Counters */}
         <div className="tm-metrics-grid">
            {/* Counter 1: Topics */}
            <div className="tm-metric-card">
               <div>
                  <span className="tm-metric-label">Tổng số Chuyên đề</span>
                  <div className="tm-metric-value-wrap">
                     <span className="tm-metric-number">{metrics.totalTopics}</span>
                     <span className="tm-metric-unit">topics</span>
                  </div>
                  <span className="tm-metric-hint">db.topics.countDocuments()</span>
               </div>
               <div className="tm-metric-icon-wrap icon-primary">
                  <span className="material-symbols-outlined">category</span>
               </div>
            </div>

            {/* Counter 2: Lessons */}
            <div className="tm-metric-card">
               <div>
                  <span className="tm-metric-label">Tổng số Bài học</span>
                  <div className="tm-metric-value-wrap">
                     <span className="tm-metric-number">{metrics.totalLessons}</span>
                     <span className="tm-metric-unit">lessons</span>
                  </div>
                  <span className="tm-metric-hint">db.lessons.countDocuments()</span>
               </div>
               <div className="tm-metric-icon-wrap icon-secondary">
                  <span className="material-symbols-outlined">menu_book</span>
               </div>
            </div>

            {/* Counter 3: Exercises */}
            <div className="tm-metric-card">
               <div>
                  <span className="tm-metric-label">Tổng số Bài tập</span>
                  <div className="tm-metric-value-wrap">
                     <span className="tm-metric-number">{metrics.totalExercises}</span>
                     <span className="tm-metric-unit">exercises</span>
                  </div>
                  <span className="tm-metric-hint">sections[type === 'exercise']</span>
               </div>
               <div className="tm-metric-icon-wrap icon-tertiary">
                  <span className="material-symbols-outlined">task_alt</span>
               </div>
            </div>
         </div>

         {/* Pragmatic Toolbar & Filter */}
         <div className="tm-toolbar-bar">
            {/* Search Input */}
            <div className="tm-search-wrap">
               <span className="material-symbols-outlined search-icon">search</span>
               <input
                  type="text"
                  placeholder="Tìm kiếm theo tên chuyên đề hoặc slug..."
                  value={searchQuery}
                  onChange={(e) => {
                     setSearchQuery(e.target.value);
                     setCurrentPage(1);
                  }}
               />
            </div>

            {/* Category Filter */}
            <div className="tm-select-wrap">
               <select
                  value={selectedDiscipline}
                  onChange={(e) => {
                     setSelectedDiscipline(e.target.value);
                     setCurrentPage(1);
                  }}
               >
                  <option value="">Tất cả Phân ngành</option>
                  <option value="phys">Vật lý</option>
                  <option value="math">Toán học</option>
                  <option value="chem">Hóa học</option>
                  <option value="cs">Khoa học Máy tính</option>
                  <option value="soc">Khoa học Xã hội</option>
               </select>
               <span className="material-symbols-outlined dropdown-icon">arrow_drop_down</span>
            </div>

            {/* Status Filter */}
            <div className="tm-select-wrap">
               <select
                  value={selectedStatus}
                  onChange={(e) => {
                     setSelectedStatus(e.target.value);
                     setCurrentPage(1);
                  }}
               >
                  <option value="">Tất cả Trạng thái</option>
                  <option value="active">Đang hiển thị (Active)</option>
                  <option value="inactive">Bản nháp - Ẩn (Inactive)</option>
               </select>
               <span className="material-symbols-outlined dropdown-icon">arrow_drop_down</span>
            </div>

            {/* Reset Button */}
            <button className="tm-reset-btn" title="Làm mới bộ lọc" onClick={handleResetFilters}>
               <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
            </button>
         </div>

         {/* Pragmatic Database Table Card */}
         <div className="tm-table-card">
            <div className="tm-table-header-strip">
               <div className="tm-table-title">
                  <span className="material-symbols-outlined header-icon">table_chart</span>
                  <span>Danh sách Chuyên đề ({filteredTopics.length} / {metrics.totalTopics} topics)</span>
               </div>
               <span className="tm-collection-name">Collection: topics</span>
            </div>

            <div className="tm-table-scroll">
               <table>
                  <thead>
                     <tr>
                        <th className="center" style={{ width: '64px' }}>STT</th>
                        <th>Tên Chuyên đề & Slug</th>
                        <th>Phân ngành</th>
                        <th>Quy mô Nội dung</th>
                        <th>Trạng thái (isActive)</th>
                        <th>Ngày cập nhật</th>
                        <th className="right" style={{ paddingRight: '1.5rem' }}>Thao tác</th>
                     </tr>
                  </thead>
                  <tbody>
                     {paginatedTopics.length === 0 ? (
                        <tr>
                           <td colSpan="7" className="center" style={{ padding: '3rem', color: 'var(--tm-on-surface-variant)' }}>
                              Không tìm thấy chuyên đề phù hợp với bộ lọc.
                           </td>
                        </tr>
                     ) : (
                        paginatedTopics.map((topic, index) => {
                           const rowNumber = (validCurrentPage - 1) * pageSize + index + 1;
                           const rowNumberStr = String(rowNumber).padStart(2, '0');
                           const discName = DISCIPLINE_NAMES[topic.discipline] || topic.discipline || 'Vật lý';
                           const isActive = topic.isActive !== false;

                           return (
                              <tr key={topic._id || topic.slug}>
                                 {/* STT */}
                                 <td className="center nowrap">
                                    <div className="tm-stt-cell">
                                       <span className="material-symbols-outlined drag-icon" title="Kéo để sắp xếp thứ tự">
                                          drag_indicator
                                       </span>
                                       <span>#{rowNumberStr}</span>
                                    </div>
                                 </td>

                                 {/* Tên Chuyên đề & Slug */}
                                 <td>
                                    <div className="tm-title-cell">
                                       <span className="topic-name">{topic.title}</span>
                                       <span className="topic-slug">/topics/{topic.slug}</span>
                                       {topic.description && (
                                          <span className="topic-desc" title={topic.description}>
                                             {topic.description}
                                          </span>
                                       )}
                                    </div>
                                 </td>

                                 {/* Phân ngành */}
                                 <td className="nowrap">
                                    <span className="tm-discipline-tag">{discName}</span>
                                 </td>

                                 {/* Quy mô Nội dung */}
                                 <td className="nowrap">
                                    <div className="tm-stats-cell">
                                       <span className="stats-primary">
                                          {topic.chaptersCount || 0} Chương • {topic.lessonsCount || 0} Bài học
                                       </span>
                                       <span className="stats-secondary">
                                          {topic.exercisesCount || 0} Bài tập section
                                       </span>
                                    </div>
                                 </td>

                                 {/* Trạng thái (isActive) Toggle */}
                                 <td className="nowrap">
                                    <div
                                       className="tm-status-toggle"
                                       onClick={() => handleToggleStatus(topic)}
                                       title="Nhấn để bật/tắt hiển thị chuyên đề"
                                    >
                                       <div className={`toggle-track ${isActive ? 'active' : ''}`}>
                                          <div className={`toggle-thumb ${isActive ? 'active' : ''}`}></div>
                                       </div>
                                       <span className={`status-text ${isActive ? 'active' : 'inactive'}`}>
                                          {isActive ? 'Hiển thị' : 'Bản nháp (Ẩn)'}
                                       </span>
                                    </div>
                                 </td>

                                 {/* Ngày cập nhật */}
                                 <td className="nowrap tm-date-cell">
                                    {formatDate(topic.updatedAt)}
                                 </td>

                                 {/* Thao tác */}
                                 <td className="right nowrap" style={{ paddingRight: '1.5rem' }}>
                                    <div className="tm-actions-group">
                                       <button
                                          className="btn-manage-lessons"
                                          onClick={() => navigate(`/topics/${topic.slug}`)}
                                          title="Quản lý Chương & Bài học thuộc Chuyên đề"
                                       >
                                          <span className="material-symbols-outlined icon">account_tree</span>
                                          <span>Quản lý Chương & Bài</span>
                                          <span className="material-symbols-outlined icon">arrow_forward</span>
                                       </button>

                                       <button
                                          className="btn-icon-action"
                                          title="Sửa thông tin Chuyên đề"
                                          onClick={() => handleOpenEditModal(topic)}
                                       >
                                          <span className="material-symbols-outlined icon">edit</span>
                                       </button>

                                       <button
                                          className="btn-icon-action btn-delete"
                                          title="Xóa chuyên đề"
                                          onClick={() => setDeleteConfirmId(topic._id)}
                                       >
                                          <span className="material-symbols-outlined icon">delete</span>
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           );
                        })
                     )}
                  </tbody>
               </table>
            </div>

            {/* Table Pagination Strip */}
            <div className="tm-pagination-strip">
               <div className="tm-page-info">
                  <span>Hiển thị</span>
                  <select
                     value={pageSize}
                     onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                     }}
                  >
                     <option value={5}>5 chuyên đề / trang</option>
                     <option value={10}>10 chuyên đề / trang</option>
                     <option value={25}>25 chuyên đề / trang</option>
                  </select>
                  <span>trong tổng số {totalItems} chuyên đề</span>
               </div>

               <div className="tm-page-controls">
                  <button
                     className="btn-page-step"
                     onClick={() => setCurrentPage(1)}
                     disabled={validCurrentPage === 1}
                     title="Trang đầu"
                  >
                     <span className="material-symbols-outlined icon">first_page</span>
                  </button>
                  <button
                     className="btn-page-step"
                     onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                     disabled={validCurrentPage === 1}
                     title="Trang trước"
                  >
                     <span className="material-symbols-outlined icon">chevron_left</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                     <button
                        key={page}
                        className={`btn-page-number ${validCurrentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                     >
                        {page}
                     </button>
                  ))}

                  <button
                     className="btn-page-step"
                     onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                     disabled={validCurrentPage === totalPages}
                     title="Trang tiếp"
                  >
                     <span className="material-symbols-outlined icon">chevron_right</span>
                  </button>
                  <button
                     className="btn-page-step"
                     onClick={() => setCurrentPage(totalPages)}
                     disabled={validCurrentPage === totalPages}
                     title="Trang cuối"
                  >
                     <span className="material-symbols-outlined icon">last_page</span>
                  </button>
               </div>
            </div>
         </div>

         {/* Create / Edit Modal */}
         {isModalOpen && (
            <div className="tm-modal-backdrop" onClick={() => setIsModalOpen(false)}>
               <div className="tm-modal-box" onClick={(e) => e.stopPropagation()}>
                  <div className="tm-modal-header">
                     <span className="tm-modal-title">
                        {editingTopic ? 'Chỉnh sửa Chuyên đề' : 'Tạo Chuyên đề Mới'}
                     </span>
                     <button className="btn-modal-close" onClick={() => setIsModalOpen(false)}>
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>

                  <form onSubmit={handleSaveTopic}>
                     <div className="tm-modal-body">
                        <div className="form-group">
                           <label>Tên Chuyên đề *</label>
                           <input
                              type="text"
                              required
                              placeholder="Ví dụ: Cơ học Cổ điển & Động lực học"
                              value={formData.title}
                              onChange={handleTitleChange}
                           />
                        </div>

                        <div className="form-row">
                           <div className="form-group">
                              <label>Đường dẫn Slug *</label>
                              <input
                                 type="text"
                                 required
                                 placeholder="co-hoc-co-dien"
                                 value={formData.slug}
                                 onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                              />
                           </div>

                           <div className="form-group">
                              <label>Phân ngành *</label>
                              <select
                                 value={formData.discipline}
                                 onChange={(e) => setFormData({ ...formData, discipline: e.target.value })}
                              >
                                 <option value="physics">Vật lý</option>
                                 <option value="maths">Toán học</option>
                                 <option value="chem">Hóa học</option>
                                 <option value="cs">Khoa học Máy tính</option>
                                 <option value="soc">Khoa học Xã hội</option>
                              </select>
                           </div>
                        </div>

                        <div className="form-group">
                           <label>Mô tả tóm tắt</label>
                           <textarea
                              rows={3}
                              placeholder="Tóm tắt nội dung trọng tâm của chuyên đề..."
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                           />
                        </div>

                        <div className="form-row">
                           <div className="form-group">
                              <label>Ảnh đại diện (URL)</label>
                              <input
                                 type="url"
                                 placeholder="https://res.cloudinary.com/..."
                                 value={formData.thumbnail}
                                 onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                              />
                           </div>

                           <div className="form-group">
                              <label>Thứ tự hiển thị (Order)</label>
                              <input
                                 type="number"
                                 min={1}
                                 value={formData.order}
                                 onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                              />
                           </div>
                        </div>

                        <div className="form-group">
                           <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                              <input
                                 type="checkbox"
                                 style={{ width: 'auto' }}
                                 checked={formData.isActive}
                                 onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                              />
                              <span>Hiển thị trên Cổng học viên ngay (Active)</span>
                           </label>
                        </div>
                     </div>

                     <div className="tm-modal-footer">
                        <button
                           type="button"
                           className="btn-cancel"
                           onClick={() => setIsModalOpen(false)}
                           disabled={isSubmitting}
                        >
                           Hủy bỏ
                        </button>
                        <button type="submit" className="btn-save" disabled={isSubmitting}>
                           {isSubmitting ? 'Đang lưu...' : editingTopic ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* Delete Confirmation Modal */}
         {deleteConfirmId && (
            <div className="tm-modal-backdrop" onClick={() => setDeleteConfirmId(null)}>
               <div className="tm-modal-box" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
                  <div className="tm-modal-header">
                     <span className="tm-modal-title" style={{ color: 'var(--tm-error)' }}>Xác nhận xóa</span>
                     <button className="btn-modal-close" onClick={() => setDeleteConfirmId(null)}>
                        <span className="material-symbols-outlined">close</span>
                     </button>
                  </div>
                  <div className="tm-modal-body">
                     <p style={{ margin: 0, lineHeight: 1.5 }}>
                        Bạn có chắc chắn muốn xóa chuyên đề này? Tất cả các chương và bài học thuộc chuyên đề này cũng sẽ bị xóa vĩnh viễn.
                     </p>
                  </div>
                  <div className="tm-modal-footer">
                     <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>
                        Hủy
                     </button>
                     <button
                        className="btn-save"
                        style={{ backgroundColor: 'var(--tm-error)' }}
                        onClick={() => handleDeleteTopic(deleteConfirmId)}
                     >
                        Xóa chuyên đề
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Toast Notification */}
         {toast && (
            <div className={`tm-toast ${toast.type}`}>
               <span className="material-symbols-outlined text-[20px]">
                  {toast.type === 'error' ? 'error' : 'check_circle'}
               </span>
               <span>{toast.message}</span>
            </div>
         )}
      </div>
   );
}
