import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import '../styles/Topics.scss';

export default function TopicView() {
   const { slug } = useParams();
   const navigate = useNavigate();

   const [topic, setTopic] = useState(null);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [expandedChapters, setExpandedChapters] = useState({});

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

   return (
      <div className="scisolve-catalog-page">
         <section className="catalog-hero-section">
            <div className="catalog-hero-container">
               <div>
                  <h1 className="catalog-hero-title">
                     {loading ? 'Đang tải...' : (topic?.title || 'Chi tiết chủ đề')}
                  </h1>
                  {topic?.description && (
                     <p className="catalog-hero-desc" style={{ marginTop: '0.35rem' }}>
                        {topic.description}
                     </p>
                  )}
               </div>
               <button className="back-btn" onClick={() => navigate('/topics')}>
                  <span className="material-symbols-outlined">arrow_back</span>
                  <span>Danh mục chủ đề</span>
               </button>
            </div>
         </section>

         {/* Main Content Area */}
         <div className="catalog-main-container">
            <div className="topic-detail-view">

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
                                    {chapter.description && (
                                       <p className="chapter-desc">{chapter.description}</p>
                                    )}
                                 </div>
                                 <span className={`material-symbols-outlined toggle-icon ${isOpen ? 'open' : ''}`}>
                                    expand_more
                                 </span>
                              </div>

                              {isOpen && (
                                 <div className="lessons-list">
                                    {chapter.lessons?.length === 0 ? (
                                       <p style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.4)', margin: '0.5rem 0' }} >
                                          Chưa có bài học nào trong chương này.
                                       </p>
                                    ) : (
                                       chapter.lessons.map((lesson) => (
                                          <div
                                             key={lesson._id}
                                             className="lesson-item"
                                             onClick={() => navigate(`/topics/${slug}/lesson/${lesson._id}`)}
                                          >
                                             <div className="lesson-info">
                                                <h4 className="lesson-title">{lesson.title}</h4>
                                                {lesson.description && (
                                                   <p className="lesson-desc">{lesson.description}</p>
                                                )}
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
         </div>
      </div>
   );
}
