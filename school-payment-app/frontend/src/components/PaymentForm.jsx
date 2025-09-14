import React, { useState } from 'react';
import axios from '../api/axios';

const PaymentForm = () => {
  const [formData, setFormData] = useState({
    amount: '',
    student_name: '',
    student_id: '',
    student_email: '',
    school_name: '',
    preferred_payment_mode: 'any',
    callback_url: 'http://localhost:5173/payment-success'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.amount || formData.amount <= 0) {
      setError('Please enter a valid amount');
      return false;
    }
    if (!formData.student_name.trim()) {
      setError('Please enter student name');
      return false;
    }
    if (!formData.student_id.trim()) {
      setError('Please enter student ID');
      return false;
    }
    if (!formData.student_email.trim()) {
      setError('Please enter student email');
      return false;
    }
    if (!formData.school_name.trim()) {
      setError('Please enter school name');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.student_email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setDebugInfo(null);

    if (!validateForm()) return;

    setLoading(true);
    
    try {
      console.log('Sending payment request with data:', formData);
      
      const response = await axios.post('/api/payment/create-payment', formData);
      
      console.log('Payment API Response:', response.data);
      setDebugInfo(response.data); // Store for debugging
      
      if (response.data.success && response.data.payment_url) {
        setSuccess({
          order_id: response.data.custom_order_id,
          payment_url: response.data.payment_url,
          amount: response.data.amount,
          school_name: response.data.school_name,
          preferred_payment_mode: response.data.preferred_payment_mode
        });
        
        // Reset form
        setFormData({
          amount: '',
          student_name: '',
          student_id: '',
          student_email: '',
          school_name: '',
          preferred_payment_mode: 'any',
          callback_url: 'http://localhost:5173/payment-success'
        });
      } else {
        throw new Error('Payment URL not generated. Check API response.');
      }
    } catch (err) {
      console.error('Payment creation error:', err);
      console.error('Error response:', err.response?.data);
      
      setError(err.response?.data?.error || err.message || 'Failed to create payment. Please try again.');
      setDebugInfo(err.response?.data); // Store error details for debugging
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (success?.payment_url) {
      console.log('Redirecting to payment URL:', success.payment_url);
      // Try both window.open and window.location methods
      const opened = window.open(success.payment_url, '_blank');
      if (!opened) {
        // If popup was blocked, try direct navigation
        window.location.href = success.payment_url;
      }
    } else {
      console.error('No payment URL available:', success);
      setError('Payment URL not available. Please try creating payment again.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Payment URL copied to clipboard!');
    });
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <h1 className="page-title">Create Payment</h1>
          
          <div className="card">
            <div className="card-body p-4">
              <h4 className="text-center mb-4" style={{ color: 'var(--primary-blue)' }}>
                Payment Details
              </h4>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <strong>Error:</strong> {error}
                </div>
              )}

              {success && (
                <div className="card mb-4" style={{ background: 'var(--light-green)', border: '1px solid var(--primary-green)' }}>
                  <div className="card-body">
                    <h5 style={{ color: 'var(--dark-green)' }}>
                      ✅ Payment Link Created Successfully!
                    </h5>
                    <div className="mt-3">
                      <p className="mb-2">
                        <strong>Order ID:</strong> {success.order_id}
                      </p>
                      <p className="mb-2">
                        <strong>School:</strong> {success.school_name}
                      </p>
                      <p className="mb-2">
                        <strong>Amount:</strong> ₹{success.amount}
                      </p>
                      <p className="mb-2">
                        <strong>Payment Mode:</strong> {success.preferred_payment_mode}
                      </p>

                      <div className="d-grid gap-2">
                        <button 
                          className="btn btn-success btn-lg"
                          onClick={handlePayment}
                        >
                          🚀 Proceed to Payment
                        </button>
                        <button 
                          className="btn btn-outline-success"
                          onClick={() => copyToClipboard(success.payment_url)}
                        >
                          📋 Copy Payment URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Information - Remove in production */}
              {debugInfo && import.meta.env.NODE_ENV === 'development' && (
                <div className="card mb-4" style={{ background: '#f8f9fa', border: '1px solid #dee2e6' }}>
                  <div className="card-body">
                    <h6>🐛 Debug Information (Development Only)</h6>
                    <pre className="mb-0" style={{ fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
                      {JSON.stringify(debugInfo, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label htmlFor="school_name" className="form-label">
                      <strong>School Name *</strong>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="school_name"
                      name="school_name"
                      value={formData.school_name}
                      onChange={handleChange}
                      placeholder="Enter school name"
                      required
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="amount" className="form-label">
                      <strong>Amount (INR) *</strong>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">₹</span>
                      <input
                        type="number"
                        className="form-control"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
                        placeholder="Enter amount"
                        min="1"
                        step="0.01"
                        required
                      />
                    </div>
                    <small className="form-text text-muted">
                      Enter the payment amount in Indian Rupees
                    </small>
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="student_name" className="form-label">
                      <strong>Student Name *</strong>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="student_name"
                      name="student_name"
                      value={formData.student_name}
                      onChange={handleChange}
                      placeholder="Enter student's full name"
                      required
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="student_id" className="form-label">
                      <strong>Student ID *</strong>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="student_id"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleChange}
                      placeholder="Enter student ID or roll number"
                      required
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="student_email" className="form-label">
                      <strong>Student Email *</strong>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="student_email"
                      name="student_email"
                      value={formData.student_email}
                      onChange={handleChange}
                      placeholder="Enter student's email address"
                      required
                    />
                  </div>

                  <div className="col-md-12 mb-3">
                    <label htmlFor="preferred_payment_mode" className="form-label">
                      <strong>Preferred Payment Mode</strong>
                    </label>
                    <select
                      className="form-select"
                      id="preferred_payment_mode"
                      name="preferred_payment_mode"
                      value={formData.preferred_payment_mode}
                      onChange={handleChange}
                    >
                      <option value="any">Any Payment Method</option>
                      <option value="upi">UPI</option>
                      <option value="netbanking">Net Banking</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="wallet">Digital Wallet</option>
                    </select>
                    <small className="form-text text-muted">
                      Select your preferred payment method (optional)
                    </small>
                  </div>

                  <div className="col-md-12 mb-4">
                    <label htmlFor="callback_url" className="form-label">
                      <strong>Callback URL</strong>
                    </label>
                    <input
                      type="url"
                      className="form-control"
                      id="callback_url"
                      name="callback_url"
                      value={formData.callback_url}
                      onChange={handleChange}
                      placeholder="URL to redirect after payment"
                    />
                    <small className="form-text text-muted">
                      URL where user will be redirected after payment completion
                    </small>
                  </div>
                </div>

                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating Payment Link...
                      </>
                    ) : (
                      <>
                        💳 Generate Payment Link
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-4 p-3" style={{ background: 'var(--light-blue)', borderRadius: '8px' }}>
                <h6 style={{ color: 'var(--dark-blue)' }}>
                  ℹ️ Payment Information
                </h6>
                <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
                  <li>This is a test environment - do not use real payment methods</li>
                  <li>Use test cards or netbanking for simulation</li>
                  <li>Payment link will be valid for 24 hours</li>
                  <li>You will receive confirmation once payment is processed</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;