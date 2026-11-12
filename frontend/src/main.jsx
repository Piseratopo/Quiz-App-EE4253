import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { QuestionProvider } from './context/QuestionContext.jsx';
import './index.css';

import App from './App.jsx';

createRoot(document.getElementById('root')).render(
   <StrictMode>
      <BrowserRouter>
         <AuthProvider>
            <QuestionProvider>
               <App />
            </QuestionProvider>
         </AuthProvider>
      </BrowserRouter>
   </StrictMode>
);
