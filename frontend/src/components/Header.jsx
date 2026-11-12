import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.scss';

function Header() {
   const { isAuthenticated, user, logout } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const [menuOpen, setMenuOpen] = useState(false);
   const dropdownRef = useRef(null);

   const handleLogout = () => {
      setMenuOpen(false);
      logout();
      localStorage.removeItem('token');
      navigate('/auth');
   };

   // Close dropdown when clicking outside
   useEffect(() => {
      const handleClickOutside = (event) => {
         if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setMenuOpen(false);
         }
      };

      if (menuOpen) {
         document.addEventListener('mousedown', handleClickOutside);
      }
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, [menuOpen]);

   const navLinks = [
      { to: '/home', label: 'Trang chủ' },
      { to: '/topics', label: 'Chủ đề' },
      { to: '/topic-manager', label: 'Quản lí chuyên đề' },
   ];

   const getLinkClass = (path) => {
      const isActive =
         location.pathname === path ||
         (path === '/topics' && location.pathname.startsWith('/topics') && location.pathname !== '/topic-manager');
      return `common-btn-nav ${isActive ? 'active' : ''}`.trim();
   };

   return (
      <header>
         {/* Top Navigation Bar */}
         <div className="header-container">
            <div className="header-main-nav">
               <Link to="/" className="header-brand-link">
                  <img
                     alt="Scienca Solvo Logo"
                     className="header-logo"
                     src="/icon.png"
                  />
                  <span className="logo-text">
                     Scienca <span className="text-action">Solvo</span>
                  </span>
               </Link>

               <nav className="header-nav">
                  {isAuthenticated ? (
                     <>
                        {navLinks.map((link) => (
                           <Link
                              key={link.to}
                              to={link.to}
                              className={getLinkClass(link.to)}
                           >
                              {link.label}
                           </Link>
                        ))}
                     </>
                  ) : (
                     <>
                        <Link to="/" className={getLinkClass('/')}>
                           Trang chủ
                        </Link>
                        <Link to="/topic-manager" className={getLinkClass('/topic-manager')}>
                           Quản lí chuyên đề
                        </Link>
                        <Link to="/auth" className={getLinkClass('/auth')}>
                           Đăng nhập / Đăng ký
                        </Link>
                     </>
                  )}
               </nav>
            </div>

            <div className="header-action-group">
               {isAuthenticated && (
                  <div className="profile-container" ref={dropdownRef}>
                     <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="profile-trigger"
                        type="button"
                        aria-expanded={menuOpen}
                     >
                        <img
                           alt="Hồ sơ"
                           className="profile-avatar"
                           src="/icon.png"
                        />
                        <span className="profile-name">
                           {user}
                        </span>
                        <span className={`material-symbols-outlined profile-arrow ${menuOpen ? 'open' : ''}`}>
                           arrow_drop_down
                        </span>
                     </button>

                     {menuOpen && (
                        <div className="profile-dropdown">

                           <Link
                              to="/profile"
                              onClick={() => setMenuOpen(false)}
                              className="dropdown-item"
                           >
                              Hồ sơ cá nhân
                           </Link>

                           <button
                              onClick={handleLogout}
                              className="dropdown-item dropdown-item--logout"
                              type="button"
                           >
                              Đăng xuất
                           </button>
                        </div>
                     )}
                  </div>
               )}
            </div>
         </div>
      </header>
   );
}

export default Header;
