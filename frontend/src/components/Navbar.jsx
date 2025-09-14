import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          🏫 School Payment Portal
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          style={{ border: '1px solid rgba(255,255,255,0.3)' }}
        >
          <span style={{ color: 'white' }}>☰</span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                    to="/dashboard"
                  >
                    📊 Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/create-payment') ? 'active' : ''}`}
                    to="/create-payment"
                  >
                    💳 Create Payment
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/transaction-status') ? 'active' : ''}`}
                    to="/transaction-status"
                  >
                    🔍 Check Status
                  </Link>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav">
            {isAuthenticated ? (
              <li className="nav-item">
                <button 
                  className="nav-link btn btn-link"
                  onClick={handleLogout}
                  style={{ color: 'white', textDecoration: 'none' }}
                >
                  🚪 Logout
                </button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/login') ? 'active' : ''}`}
                    to="/login"
                  >
                    🔐 Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link 
                    className={`nav-link ${isActive('/register') ? 'active' : ''}`}
                    to="/register"
                  >
                    📝 Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;