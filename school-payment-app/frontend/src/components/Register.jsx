import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        {
          name: formData.name,
          email: formData.email,
          password: formData.password
        }
      );
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container">
        <div className="row justify-content-center mt-5">
          <div className="col-md-6 col-lg-5">
            <div className="card">
              <div className="card-body p-5 text-center">
                <div style={{ fontSize: '4rem' }}>🎉</div>
                <h3 style={{ color: 'var(--primary-green)' }}>Registration Successful!</h3>
                <p className="text-muted mb-4">
                  Your account has been created successfully. 
                  Redirecting to login page...
                </p>
                <div className="spinner-border" style={{ color: 'var(--primary-green)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                <p className="text-muted">Create your account</p>
              </div>
              
              {error && (
                <div className="alert alert-danger" role="alert">
                  ❌ {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    <strong>👤 Full Name</strong>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

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
                  />
                </div>

                <div className="mb-3">
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
                    minLength="6"
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">
                    <strong>🔒 Confirm Password</strong>
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 mb-3"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Creating Account...
                    </>
                  ) : (
                    '✨ Create Account'
                  )}
                </button>

                <div className="text-center">
                  <p className="mb-0">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-blue)' }}>
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;