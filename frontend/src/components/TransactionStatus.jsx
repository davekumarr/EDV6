import React, { useState } from 'react';
import axios from '../api/axios';

const TransactionStatus = () => {
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) {
      setError('Please enter a valid order ID');
      return;
    }

    setLoading(true);
    setError('');
    setTransaction(null);

    try {
      const response = await axios.get(`/api/transaction-status/${orderId.trim()}`);
      setTransaction(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Transaction not found. Please check the order ID and try again.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch transaction status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOrderId('');
    setTransaction(null);
    setError('');
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'var(--primary-green)';
      case 'pending': return '#f59e0b';
      case 'failed': return '#dc2626';
      default: return 'var(--gray-600)';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN');
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="page-title">Transaction Status Check</h1>
          
          <div className="card mb-4">
            <div className="card-body p-4">
              <h4 className="text-center mb-4" style={{ color: 'var(--primary-blue)' }}>
                🔍 Check Payment Status
              </h4>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="orderId" className="form-label">
                    <strong>Order ID / Transaction ID</strong>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="orderId"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Enter your order ID (e.g., ORD1234567890)"
                    required
                  />
                  <small className="form-text text-muted">
                    Enter the order ID you received when creating the payment
                  </small>
                </div>

                <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Checking Status...
                      </>
                    ) : (
                      <>
                        🔍 Check Status
                      </>
                    )}
                  </button>
                  
                  {(transaction || error) && (
                    <button
                      type="button"
                      className="btn btn-outline-primary"
                      onClick={handleReset}
                    >
                      🔄 Check Another
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              <h6>❌ Error</h6>
              {error}
            </div>
          )}

          {transaction && (
            <div className="card">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div style={{ fontSize: '3rem' }}>
                    {getStatusIcon(transaction.status)}
                  </div>
                  <h3 style={{ color: getStatusColor(transaction.status) }}>
                    {transaction.status?.toUpperCase() || 'UNKNOWN'}
                  </h3>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-4">
                      <h6 className="text-muted">TRANSACTION DETAILS</h6>
                      <div className="border rounded p-3" style={{ background: 'var(--gray-100)' }}>
                        <p className="mb-2">
                          <strong>Order ID:</strong><br />
                          <code>{transaction.custom_order_id}</code>
                        </p>
                        <p className="mb-2">
                          <strong>Amount:</strong><br />
                          <span style={{ fontSize: '1.2rem', color: 'var(--primary-blue)' }}>
                            {formatCurrency(transaction.amount)}
                          </span>
                        </p>
                        <p className="mb-0">
                          <strong>School ID:</strong><br />
                          {transaction.school_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="mb-4">
                      <h6 className="text-muted">STUDENT INFORMATION</h6>
                      <div className="border rounded p-3" style={{ background: 'var(--gray-100)' }}>
                        <p className="mb-2">
                          <strong>Name:</strong><br />
                          {transaction.student_info?.name || 'N/A'}
                        </p>
                        <p className="mb-2">
                          <strong>Student ID:</strong><br />
                          {transaction.student_info?.id || 'N/A'}
                        </p>
                        <p className="mb-0">
                          <strong>Email:</strong><br />
                          {transaction.student_info?.email || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {transaction.payment_details && (
                  <div className="mb-4">
                    <h6 className="text-muted">PAYMENT DETAILS</h6>
                    <div className="border rounded p-3" style={{ background: 'var(--light-blue)' }}>
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-2">
                            <strong>Transaction Amount:</strong><br />
                            {transaction.payment_details.transaction_amount 
                              ? formatCurrency(transaction.payment_details.transaction_amount)
                              : 'N/A'
                            }
                          </p>
                          <p className="mb-2">
                            <strong>Payment Mode:</strong><br />
                            {transaction.payment_details.payment_mode || 'N/A'}
                          </p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-2">
                            <strong>Bank Reference:</strong><br />
                            {transaction.payment_details.bank_reference || 'N/A'}
                          </p>
                          <p className="mb-2">
                            <strong>Payment Time:</strong><br />
                            {formatDate(transaction.payment_details.payment_time)}
                          </p>
                        </div>
                      </div>
                      {transaction.payment_details.payment_message && (
                        <div className="mt-2">
                          <strong>Message:</strong><br />
                          <em>{transaction.payment_details.payment_message}</em>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center">
                  {transaction.status?.toLowerCase() === 'success' && (
                    <div className="alert alert-success">
                      <strong>🎉 Payment Successful!</strong><br />
                      Your payment has been processed successfully.
                    </div>
                  )}
                  
                  {transaction.status?.toLowerCase() === 'pending' && (
                    <div className="alert alert-warning">
                      <strong>⏳ Payment Pending</strong><br />
                      Your payment is being processed. Please wait or check back later.
                    </div>
                  )}
                  
                  {transaction.status?.toLowerCase() === 'failed' && (
                    <div className="alert alert-danger">
                      <strong>❌ Payment Failed</strong><br />
                      There was an issue with your payment. Please try again or contact support.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4">
            <div className="card" style={{ background: 'var(--light-green)', border: '1px solid var(--primary-green)' }}>
              <div className="card-body">
                <h6 style={{ color: 'var(--dark-green)' }}>
                  💡 Need Help?
                </h6>
                <p className="mb-0" style={{ fontSize: '0.9rem' }}>
                  If you're having trouble finding your transaction or need assistance, 
                  please contact our support team with your order ID.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionStatus;