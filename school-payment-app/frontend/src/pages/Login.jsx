import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        formData
      );
      
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center mt-5">
        <div className="col-md-6 col-lg-5">
          <div className="card">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 style={{ color: 'var(--primary-blue)' }}>
                  🏫 School Payment Portal
                </h2>
                <p className="text-muted">Sign in to your account</p>
              </div>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  ❌ {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    <strong>📧 Email Address</strong>
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="password" className="form-label">
                    <strong>🔒 Password</strong>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Signing in...
                    </>
                  ) : (
                    '🚀 Sign In'
                  )}
                </button>

                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: 'var(--primary-green)' }}>
                      Create one here
                    </Link>
                  </p>
                </div>
              </form>

              {/* Demo Credentials */}
              <div className="mt-4 p-3" style={{ 
                background: 'var(--light-blue)', 
                borderRadius: '8px',
                border: '1px solid var(--primary-blue)'
              }}>
                <h6 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>
                  🔧 Demo Credentials
                </h6>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.25rem', color: 'var(--dark-blue)' }}>
                  <strong>Email:</strong> admin@school.edu
                </p>
                <p style={{ fontSize: '0.875rem', marginBottom: '0', color: 'var(--dark-blue)' }}>
                  <strong>Password:</strong> password123
                </p>
                <small style={{ color: 'var(--text-muted)' }}>
                  Use these credentials for testing purposes
                </small>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-body p-4">
                  <h6 className="text-center mb-3" style={{ color: 'var(--primary-blue)' }}>
                    ✨ Application Features
                  </h6>
                  <div className="row text-center">
                    <div className="col-4">
                      <div style={{ color: 'var(--primary-green)' }}>
                        <div style={{ fontSize: '1.5rem' }}>📊</div>
                        <small>Real-time Dashboard</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div style={{ color: 'var(--primary-blue)' }}>
                        <div style={{ fontSize: '1.5rem' }}>💳</div>
                        <small>Payment Processing</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div style={{ color: 'var(--secondary-blue)' }}>
                        <div style={{ fontSize: '1.5rem' }}>🌙</div>
                        <small>Dark Mode</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;