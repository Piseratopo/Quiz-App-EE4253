import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../configs/apiClient';
import { useAuth } from '../context/AuthContext';
import '../styles/Auth.scss';

function EyeIcon({ open }) {
   if (open) {
      return (
         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
               d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
               strokeLinecap="round"
               strokeLinejoin="round"
               strokeWidth="2"
            />
         </svg>
      );
   }
   return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
         <path
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
         />
         <path
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.257-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
         />
      </svg>
   );
}

export default function Auth() {
   const { login } = useAuth();
   const navigate = useNavigate();

   // Login state
   const [loginUsername, setLoginUsername] = useState('');
   const [loginPassword, setLoginPassword] = useState('');
   const [showLoginPassword, setShowLoginPassword] = useState(false);
   const [loginError, setLoginError] = useState('');
   const [loginLoading, setLoginLoading] = useState(false);
   const [rememberMe, setRememberMe] = useState(false);

   // Register state
   const [regUsername, setRegUsername] = useState('');
   const [regEmail, setRegEmail] = useState('');
   const [regPassword, setRegPassword] = useState('');
   const [regRepeatPassword, setRegRepeatPassword] = useState('');
   const [showRegPassword, setShowRegPassword] = useState(false);
   const [showRegRepeatPassword, setShowRegRepeatPassword] = useState(false);
   const [termsAgree, setTermsAgree] = useState(true);
   const [regError, setRegError] = useState('');
   const [regLoading, setRegLoading] = useState(false);

   const handleLoginSubmit = (e) => {
      e.preventDefault();
      setLoginError('');
      if (!loginUsername.trim() || !loginPassword) {
         setLoginError('Vui lòng nhập đầy đủ Username và Mật khẩu.');
         return;
      }
      setLoginLoading(true);
      apiClient
         .post('/login', { username: loginUsername.trim(), password: loginPassword })
         .then((response) => {
            localStorage.setItem('token', response.data.token);
            login(response.data.id, response.data.user);
            navigate('/home');
         })
         .catch((error) => {
            setLoginError(error.response?.data?.error || 'Đăng nhập không thành công. Vui lòng thử lại.');
         })
         .finally(() => setLoginLoading(false));
   };

   const handleRegisterSubmit = (e) => {
      e.preventDefault();
      setRegError('');
      if (!regUsername.trim()) {
         setRegError('Vui lòng nhập Username.');
         return;
      }
      if (regPassword.length < 8) {
         setRegError('Mật khẩu phải chứa ít nhất 8 ký tự.');
         return;
      }
      if (regPassword !== regRepeatPassword) {
         setRegError('Mật khẩu xác nhận không khớp.');
         return;
      }
      if (!termsAgree) {
         setRegError('Bạn cần đồng ý với Điều khoản nền tảng để tiếp tục.');
         return;
      }

      setRegLoading(true);
      apiClient
         .post('/register', { username: regUsername.trim(), password: regPassword })
         .then((response) => {
            localStorage.setItem('token', response.data.token);
            login(response.data.id, response.data.user);
            navigate('/home');
         })
         .catch((error) => {
            setRegError(error.response?.data?.error || 'Đăng ký không thành công. Vui lòng kiểm tra lại.');
         })
         .finally(() => setRegLoading(false));
   };

   return (
      <div className="page">
         <div className="auth-grid">
            <section className="auth-panel auth-panel--login" data-purpose="login-form-panel">
               <div className="auth-header">
                  <h2 className="auth-title">Đăng nhập</h2>
               </div>

               <form className="auth-form auth-form--login" onSubmit={handleLoginSubmit}>
                  {loginError && <div className="auth-error">{loginError}</div>}

                  <fieldset className="auth-fieldset">
                     <legend className="auth-legend">
                        Tên đăng nhập <span className="required-star">*</span>
                     </legend>
                     <div className="auth-input-container">
                        <input
                           className="auth-input"
                           id="login_username"
                           name="login_username"
                           placeholder="Nhập tên đăng nhập"
                           required
                           type="text"
                           value={loginUsername}
                           onChange={(e) => setLoginUsername(e.target.value)}
                        />
                     </div>
                  </fieldset>

                  <fieldset className="auth-fieldset">
                     <legend className="auth-legend">
                        Mật khẩu <span className="required-star">*</span>
                     </legend>
                     <div className="auth-input-container">
                        <input
                           className="auth-input"
                           id="login_password"
                           name="login_password"
                           placeholder="Nhập mật khẩu"
                           required
                           type={showLoginPassword ? 'text' : 'password'}
                           value={loginPassword}
                           onChange={(e) => setLoginPassword(e.target.value)}
                        />
                        <button
                           aria-label="Ẩn/hiện mật khẩu"
                           className="auth-toggle-pwd"
                           onClick={() => setShowLoginPassword(!showLoginPassword)}
                           type="button"
                        >
                           <EyeIcon open={showLoginPassword} />
                        </button>
                     </div>
                  </fieldset>

                  {/* <div className="auth-options"> */}
                     {/* <label className="auth-remember">
                        <input
                           type="checkbox"
                           checked={rememberMe}
                           onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span>Ghi nhớ phiên làm việc</span>
                     </label> */}
                     {/* <a className="auth-forgot-link" href="#forgot">
                        Quên mật khẩu?
                     </a> */}
                  {/* </div> */}

                  <div>
                     <button className="auth-submit-btn" type="submit" disabled={loginLoading}>
                        <span>{loginLoading ? 'Đang xử lý...' : 'Đăng nhập'}</span>
                     </button>
                  </div>
               </form>
            </section>

            <section className="auth-panel auth-panel--register" data-purpose="registration-form-panel">
               <div className="auth-header">
                  <h2 className="auth-title">Đăng ký tài khoản</h2>
               </div>

               <form className="auth-form" onSubmit={handleRegisterSubmit}>
                  {regError && <div className="auth-error">{regError}</div>}

                  <fieldset className="auth-fieldset">
                     <legend className="auth-legend">
                        Tên đăng nhập <span className="required-star">*</span>
                     </legend>
                     <div className="auth-input-container">
                        <input
                           className="auth-input"
                           id="reg_username"
                           name="reg_username"
                           placeholder="Nhập tên đăng nhập mà bạn muốn sử dụng"
                           required
                           type="text"
                           value={regUsername}
                           onChange={(e) => setRegUsername(e.target.value)}
                        />
                     </div>
                  </fieldset>

                  <fieldset className="auth-fieldset">
                     <legend className="auth-legend">
                        Địa chỉ thư điện tử <span className="required-star">*</span>
                     </legend>
                     <div className="auth-input-container">
                        <input
                           className="auth-input"
                           id="reg_email"
                           name="reg_email"
                           placeholder="dia-chi-email@domain.com"
                           type="email"
                           value={regEmail}
                           onChange={(e) => setRegEmail(e.target.value)}
                        />
                     </div>
                  </fieldset>

                  <fieldset className="auth-fieldset">
                     <legend className="auth-legend">
                        Mật khẩu <span className="required-star">*</span>
                     </legend>
                     <div className="auth-input-container">
                        <input
                           className="auth-input"
                           id="reg_password"
                           name="reg_password"
                           placeholder="Tối thiểu 8 ký tự gồm chữ &amp; số"
                           required
                           type={showRegPassword ? 'text' : 'password'}
                           value={regPassword}
                           onChange={(e) => setRegPassword(e.target.value)}
                        />
                        <button
                           aria-label="Ẩn/hiện mật khẩu"
                           className="auth-toggle-pwd"
                           onClick={() => setShowRegPassword(!showRegPassword)}
                           type="button"
                        >
                           <EyeIcon open={showRegPassword} />
                        </button>
                     </div>
                  </fieldset>

                  {/* Trường Nhập lại mật khẩu */}
                  <fieldset className="auth-fieldset">
                     <legend className="auth-legend">
                        Xác nhận lại mật khẩu <span className="required-star">*</span>
                     </legend>
                     <div className="auth-input-container">
                        <input
                           className="auth-input"
                           id="reg_repeat_password"
                           name="reg_repeat_password"
                           placeholder="Nhập lại chính xác mật khẩu trên"
                           required
                           type={showRegRepeatPassword ? 'text' : 'password'}
                           value={regRepeatPassword}
                           onChange={(e) => setRegRepeatPassword(e.target.value)}
                        />
                        <button
                           aria-label="Ẩn/hiện mật khẩu xác nhận"
                           className="auth-toggle-pwd"
                           onClick={() => setShowRegRepeatPassword(!showRegRepeatPassword)}
                           type="button"
                        >
                           <EyeIcon open={showRegRepeatPassword} />
                        </button>
                     </div>
                  </fieldset>

                  {/* <div className="auth-terms">
                     <div className="terms-checkbox-wrap">
                        <input
                           id="terms_agree"
                           name="terms_agree"
                           required
                           type="checkbox"
                           checked={termsAgree}
                           onChange={(e) => setTermsAgree(e.target.checked)}
                        />
                     </div>
                     <label className="terms-label" htmlFor="terms_agree">
                        Tôi đồng ý với{' '}
                        <a href="#terms">
                           Điều khoản nền tảng
                        </a>{' '}
                        và cam kết sử dụng dữ liệu mô phỏng cho mục đích nghiên cứu học tập.
                     </label>
                  </div> */}

                  <div>
                     <button
                        className="auth-submit-btn"
                        type="submit"
                        disabled={regLoading}
                     >
                        <span>{regLoading ? 'Đang xử lý...' : 'Đăng ký'}</span>
                     </button>
                  </div>

               </form>
            </section>
         </div>
      </div>
   );
}
