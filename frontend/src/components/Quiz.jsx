import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import Home from './Home';
import Landing from './Landing';
import Profile from './Profile';
import Topics from './Topics';
import TopicView from './TopicView';
import TopicManager from './TopicManager';
import ChapterManager from './ChapterManager';
import LessonEditor from './LessonEditor';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
   const { isAuthenticated } = useAuth();
   return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

function Quiz() {
   const privateRoutes = [
      { path: '/home', element: <Home /> },
      { path: '/topics', element: <Topics /> },
      { path: '/topics/:slug', element: <TopicView /> },
      { path: '/topic-manager', element: <TopicManager /> },
      { path: '/topic-manager/:slug', element: <ChapterManager /> },
      { path: '/topic-manager/:slug/lesson/:lessonId', element: <LessonEditor /> },
      { path: '/lesson-editor/:lessonId', element: <LessonEditor /> },
      { path: '/profile', element: <Profile /> },
   ];

   return (
      <main>
         <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/topic-manager" element={<TopicManager />} />
            <Route path="/topic-manager/:slug" element={<ChapterManager />} />
            <Route path="/topic-manager/:slug/lesson/:lessonId" element={<LessonEditor />} />
            <Route path="/lesson-editor/:lessonId" element={<LessonEditor />} />
            {privateRoutes.map((route) => (
               <Route
                  key={route.path}
                  path={route.path}
                  element={<PrivateRoute>{route.element}</PrivateRoute>}
               />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
         </Routes>
      </main>
   );
}

export default Quiz;
