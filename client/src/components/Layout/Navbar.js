import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
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

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuOpen && !e.target.closest('.navbar-container')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const handleMenuClick = () => {
    setMenuOpen(false);
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
        
        {/* Hamburger Menu Button */}
        <button 
          className={`hamburger ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          <a href="#packages-section" className="navbar-service-link" onClick={handleMenuClick}>
            솔트의 맞춤형 솔루션
          </a>
          <a href="#resolution-section" className="navbar-service-link" onClick={handleMenuClick}>
            실시간 영상확인
          </a>
          <a href="#self-quote" className="navbar-service-link" onClick={handleMenuClick}>
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
            <Link to="/login" className="navbar-link navbar-login" onClick={handleMenuClick}>
              로그인
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
