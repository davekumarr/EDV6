import React, { useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ isAuthenticated, setIsAuthenticated, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Handle dropdown toggle manually since we might not have Bootstrap JS
  const toggleDropdown = (e) => {
    e.preventDefault();
    const dropdown = dropdownRef.current;
    if (dropdown) {
      const menu = dropdown.querySelector('.dropdown-menu');
      const isOpen = menu.classList.contains('show');
      
      if (isOpen) {
        menu.classList.remove('show');
        dropdown.classList.remove('show');
      } else {
        menu.classList.add('show');
        dropdown.classList.add('show');
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        const menu = dropdownRef.current.querySelector('.dropdown-menu');
        if (menu) {
          menu.classList.remove('show');
          dropdownRef.current.classList.remove('show');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hide navbar on login/register pages when not authenticated
  if (!isAuthenticated && (location.pathname === '/login' || location.pathname === '/register')) {
    return null;
  }

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link className="navbar-brand" to={isAuthenticated ? "/dashboard" : "/"}>
          🏫 School Payment Portal
        </Link>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector('#navbarNav');
            if (target) {
              target.classList.toggle('show');
            }
          }}
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

          <ul className="navbar-nav align-items-center">
            {/* Dark Mode Toggle */}
            <li className="nav-item me-3">
              <button
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </li>

            {isAuthenticated ? (
              <li className="nav-item dropdown" ref={dropdownRef}>
                <button
                  className="nav-link dropdown-toggle btn btn-link d-flex align-items-center"
                  onClick={toggleDropdown}
                  style={{ 
                    color: 'white', 
                    textDecoration: 'none',
                    border: 'none',
                    background: 'transparent',
                    padding: '8px 16px'
                  }}
                  aria-expanded="false"
                >
                  👤 Account
                </button>
                <ul 
                  className="dropdown-menu dropdown-menu-end"
                  style={{
                    backgroundColor: darkMode ? '#374151' : '#ffffff',
                    border: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    minWidth: '200px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    marginTop: '0.5rem'
                  }}
                >
                  <li>
                    <div 
                      className="dropdown-item-text px-3 py-2"
                      style={{
                        color: darkMode ? '#f9fafb' : '#1f2937',
                        fontSize: '0.875rem',
                        borderBottom: `1px solid ${darkMode ? '#4b5563' : '#e5e7eb'}`
                      }}
                    >
                      💼 Welcome back!
                    </div>
                  </li>
                  <li>
                    <Link 
                      className="dropdown-item px-3 py-2 d-flex align-items-center"
                      to="/dashboard"
                      style={{ 
                        color: darkMode ? '#f9fafb' : '#1f2937',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = darkMode ? '#4b5563' : '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      📊 Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className="dropdown-item px-3 py-2 d-flex align-items-center"
                      to="/create-payment"
                      style={{ 
                        color: darkMode ? '#f9fafb' : '#1f2937',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = darkMode ? '#4b5563' : '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      💳 Create Payment
                    </Link>
                  </li>
                  <li>
                    <Link 
                      className="dropdown-item px-3 py-2 d-flex align-items-center"
                      to="/transaction-status"
                      style={{ 
                        color: darkMode ? '#f9fafb' : '#1f2937',
                        textDecoration: 'none',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = darkMode ? '#4b5563' : '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      🔍 Check Status
                    </Link>
                  </li>
                  <li>
                    <hr 
                      className="dropdown-divider my-1" 
                      style={{ borderColor: darkMode ? '#4b5563' : '#e5e7eb' }}
                    />
                  </li>
                  <li>
                    <button 
                      className="dropdown-item px-3 py-2 d-flex align-items-center w-100 border-0 bg-transparent"
                      onClick={handleLogout}
                      style={{ 
                        color: '#dc2626',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#fee2e2';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      🚪 Logout
                    </button>
                  </li>
                </ul>
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