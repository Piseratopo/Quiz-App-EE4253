import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
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
   const navigate = useNavigate();

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
         <section className="catalog-hero-section">
            <div className="catalog-hero-container">
               <h1 className="catalog-hero-title">
                  Danh mục chủ đề
               </h1>
            </div>
         </section>

         {/* Main Content Area */}
         <div className="catalog-main-container">
            {error && (
               <div className="catalog-alert-error">
                  <span className="material-symbols-outlined">warning</span>
                  <span>{error}</span>
               </div>
            )}

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
                           {discipline.topics.map((topic) => {
                              const isUpcoming = Boolean(
                                 topic.isUpcoming ||
                                 topic.status === 'upcoming' ||
                                 topic.status === 'coming_soon' ||
                                 topic.released === false ||
                                 topic.isReleased === false
                              );

                              return (
                                 <article
                                    key={topic._id || topic.slug}
                                    className={`topic-card-item ${isUpcoming ? 'topic-card-item--upcoming' : ''}`}
                                    onClick={() => navigate(`/topics/${topic.slug}`)}
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
                                       {isUpcoming && (
                                          <span className="topic-upcoming-badge">
                                             Sắp ra mắt
                                          </span>
                                       )}
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
                                          {isUpcoming ? 'Đang biên soạn' : 'Khám phá bài học'}
                                       </span>
                                       <span className="topic-card-action">
                                          <span>{isUpcoming ? 'Xem trước' : 'Khám phá'}</span>
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
                  ))
               )}
            </div>
         </div>
      </div>
   );
}
