import { Link } from 'react-router-dom';

export default function Home() {
   return (
      <div className="home-container">
         <h1 className="home-title">Trang chủ</h1>
         <p className="home-intro">
            Chào mừng bạn đến với Scienca Solvo!
         </p>
         <Link to="/topics" className="common-btn-nav">
            Khám phá các chủ đề &rarr;
         </Link>
      </div>
   );
}
