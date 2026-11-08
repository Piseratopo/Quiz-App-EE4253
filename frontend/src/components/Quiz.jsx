import { Routes, Route, Navigate } from 'react-router-dom';
import Auth from './Auth';
import Home from './Home';
import Landing from './Landing';
import Profile from './Profile';
import Topics from './Topics';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
   const { isAuthenticated } = useAuth();
   return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

function Quiz() {
   const privateRoutes = [
      { path: '/home', element: <Home /> },
      { path: '/topics', element: <Topics /> },
      { path: '/profile', element: <Profile /> },
   ];

   return (
      <main>
         <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
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
