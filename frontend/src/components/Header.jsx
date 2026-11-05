import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import "../styles/Header.scss"

function Header() {
   const { isAuthenticated, user, logout } = useAuth();
   const navigate = useNavigate();
   const location = useLocation();
   const [menuOpen, setMenuOpen] = useState(false);
   const [selectedField, setSelectedField] = useState('natural'); // 'natural' | 'social'

   const handleLogout = () => {
      setMenuOpen(false);
      logout();
      localStorage.removeItem('token');
      navigate('/auth');
   };

   const navLinks = [
      { to: '/explore', label: 'Bảng điều khiển' },
      { to: '/practice', label: 'Luyện tập tương tác' },
      { to: '/create', label: 'Tạo câu hỏi' },
   ];

   const getLinkClass = (path) => {
      const isActive = location.pathname === path;
      return isActive
         ? 'px-3 py-1 rounded transition-colors bg-white/20 text-white font-bold shadow-[inset_0_2px_0_0_#ffb4a9] text-sm'
         : 'px-3 py-1 rounded text-white/90 hover:bg-black/15 hover:text-white text-sm font-medium transition-colors';
   };

   return (
      <>
         <header>
            {/* Top Navigation Bar */}
            <div className="w-full max-w-[1120px] mx-auto px-4 flex items-center justify-between gap-4">
               <Link to="/" className="flex items-center gap-2 shrink-0">
                  <img
                     alt="Scienca Solvo Logo"
                     className="header-logo"
                     src="/icon.png"
                  />
                  <span className="logo-text">
                     Scienca <span className='text-action'>Solvo</span>
                  </span>
               </Link>

               {/* <nav className="hidden lg:flex items-center gap-1">
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
                        <Link to="/auth" className={getLinkClass('/auth')}>
                           Đăng nhập / Đăng ký
                        </Link>
                     </>
                  )}
               </nav> */}

               {/* User & XP Stats */}
               <div className="flex items-center gap-2 shrink-0">
                  {isAuthenticated ? (
                     <>
                        {/* XP Badge */}
                        <div className="hidden sm:flex items-center bg-white border border-[#936e69]/30 px-2.5 py-0.5 rounded shadow-[0_2px_0_0_#936e69]">
                           <span className="material-symbols-outlined text-[#F59E0B] text-sm mr-1">
                              star
                           </span>
                           <span className="text-xs text-gray-800 font-bold">
                              3,450 XP
                           </span>
                        </div>

                        {/* Notifications */}
                        <button
                           aria-label="Thông báo"
                           className="relative p-1.5 text-white hover:bg-black/15 rounded transition-colors"
                           type="button"
                        >
                           <span className="material-symbols-outlined text-xl">
                              notifications
                           </span>
                           <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white ring-2 ring-[#930002]"></span>
                        </button>

                        {/* User Profile & Dropdown */}
                        <div className="relative flex items-center gap-2 border-l border-white/20 pl-3">
                           <button
                              onClick={() => setMenuOpen(!menuOpen)}
                              className="flex items-center gap-2 text-white hover:text-white/80 transition-colors text-left focus:outline-none"
                              type="button"
                           >
                              <img
                                 alt="Hồ sơ"
                                 className="w-8 h-8 rounded-full object-cover border border-white/40 bg-white"
                                 src="/icon.png"
                              />
                              <span className="hidden xl:inline-block text-xs max-w-[170px] truncate font-medium">
                                 {user || 'Elena R.'}
                              </span>
                              <span className="material-symbols-outlined text-sm">
                                 arrow_drop_down
                              </span>
                           </button>

                           {/* Dropdown Menu */}
                           {menuOpen && (
                              <div className="absolute right-0 top-11 mt-1 w-48 bg-white rounded shadow-lg border border-[#d8c2bd] py-1 z-50">
                                 <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-xs text-gray-500">Đăng nhập với tư cách</p>
                                    <p className="text-sm font-bold text-gray-800 truncate">{user || 'Elena R.'}</p>
                                 </div>
                                 <Link
                                    to="/profile"
                                    onClick={() => setMenuOpen(false)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                 >
                                    Hồ sơ cá nhân
                                 </Link>
                                 <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-[#930002] font-semibold hover:bg-red-50"
                                 >
                                    Đăng xuất
                                 </button>
                              </div>
                           )}
                        </div>
                     </>
                  ) : (
                     <div className="flex items-center gap-2">
                        <Link
                           to="/auth"
                           className="btn-common"
                        >
                           Đăng nhập / Đăng kí
                        </Link>
                     </div>
                  )}
               </div>
            </div>

            {/* <div className="w-full bg-[#fdf8f7] border-t border-b border-[#e5d0cb]">
               <div className="max-w-[1120px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                     <span className="text-xs text-[#7d5652] uppercase tracking-wider font-semibold">
                        Lĩnh vực:
                     </span>
                     <div className="inline-flex rounded border border-[#d8c2bd] bg-white p-0.5 shadow-[0_1px_0_0_#936e69]">
                        <button
                           className={`px-3 py-0.5 rounded text-xs font-bold transition-colors ${
                              selectedField === 'natural'
                                 ? 'bg-[#930002] text-white'
                                 : 'text-[#49454f] hover:bg-[#f5ded9]'
                           }`}
                           type="button"
                           onClick={() => setSelectedField('natural')}
                        >
                           Khoa học Tự nhiên
                        </button>
                        <button
                           className={`px-3 py-0.5 rounded text-xs font-bold transition-colors ${
                              selectedField === 'social'
                                 ? 'bg-[#930002] text-white'
                                 : 'text-[#49454f] hover:bg-[#f5ded9]'
                           }`}
                           type="button"
                           onClick={() => setSelectedField('social')}
                        >
                           Khoa học Xã hội
                        </button>
                     </div>
                  </div>
                  <div className="relative flex-1 max-w-xs">
                     <span className="material-symbols-outlined absolute left-2 top-1.5 text-[#7d5652] text-base pointer-events-none">
                        search
                     </span>
                     <input
                        className="w-full pl-8 pr-3 py-1 bg-white border border-[#d8c2bd] rounded text-[#1c1b1f] placeholder:text-[#7d5652] text-xs focus:outline-none focus:border-[#930002]"
                        placeholder="Tìm định lý, công thức, khái niệm..."
                        type="text"
                     />
                  </div>
               </div>
            </div> */}
         </header>

         {/* Spacer to offset content for the fixed header */}
         <div className="h-[112px]" aria-hidden="true" />
      </>
   );
}

export default Header;