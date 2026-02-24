import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  
  const isLandingPage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 100) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    if (isLandingPage) {
      window.addEventListener('scroll', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLandingPage]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navbarClass = isLandingPage 
    ? `navbar ${scrolled ? 'navbar-scrolled' : 'navbar-transparent'}` 
    : 'navbar';

  const logoSrc = isLandingPage && !scrolled 
    ? `${process.env.PUBLIC_URL}/img/logo/nav-logo-white.png`
    : `${process.env.PUBLIC_URL}/img/logo/nav-logo-blue.png`;

  return (
    <nav className={navbarClass}>
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <img src={logoSrc} alt="Logo" className="navbar-logo" />
        </Link>
        <div className="navbar-menu">
          <a href="#packages-section" className="navbar-service-link">
            솔트의 맞춤형 솔루션
          </a>
          <a href="#resolution-section" className="navbar-service-link">
            실시간 영상확인
          </a>
          <a href="#self-quote" className="navbar-service-link">
            셀프 견적확인
          </a>
          {isAuthenticated ? (
            <>
              <span className="navbar-user">{user?.name}님</span>
              <button onClick={handleLogout} className="navbar-link logout-btn">
                로그아웃
              </button>
            </>
          ) : (
            <Link to="/login" className="navbar-link">
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
