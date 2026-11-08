import { Link } from 'react-router-dom';

export default function Home() {
   return (
      <div className="home-container py-8 max-w-6xl mx-auto px-4">
         <h1 className="text-3xl font-bold mb-4">Trang chủ</h1>
         <p className="mb-6">
            Chào mừng bạn đến với Scienca Solvo!
         </p>
         <Link to="/topics" className="common-btn-nav">
            Khám phá các chủ đề &rarr;
         </Link>
      </div>
   );
}
