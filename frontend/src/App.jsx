import Header from './components/Header';
import Quiz from './components/Quiz';
import { useLocation } from 'react-router-dom';
import "./styles/common.scss";

const App = () => {
   const { pathname } = useLocation();
   const isLessonView = /^\/(?:topics\/[^/]+\/lesson\/[^/]+|lessons\/[^/]+)\/?$/.test(pathname);

   return (
      <div>
         {!isLessonView && <Header />}
         <Quiz />
      </div>
   );
};

export default App;
