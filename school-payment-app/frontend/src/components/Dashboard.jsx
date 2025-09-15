import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    school_id: '',
    page: 1,
    limit: 10,
    sort: 'createdAt',
    order: 'desc'
  });
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    pending: 0,
    failed: 0,
    totalAmount: 0,
    successAmount: 0
  });
  const [chartData, setChartData] = useState([]);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await axios.get(`/api/transactions?${params}`);
      setTransactions(response.data.data);
      setPagination(response.data.pagination);
      
      // Calculate comprehensive stats
      const stats = response.data.data.reduce((acc, transaction) => {
        acc.total++;
        const amount = transaction.order_amount || 0;
        acc.totalAmount += amount;
        
        if (transaction.status === 'success') {
          acc.success++;
          acc.successAmount += amount;
        } else if (transaction.status === 'pending') {
          acc.pending++;
        } else if (transaction.status === 'failed') {
          acc.failed++;
        }
        return acc;
      }, { total: 0, success: 0, pending: 0, failed: 0, totalAmount: 0, successAmount: 0 });
      
      setStats(stats);
      
      // Prepare chart data for last 7 days
      const chartData = prepareChartData(response.data.data);
      setChartData(chartData);
      
      setError('');
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const prepareChartData = (transactions) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        success: 0,
        pending: 0,
        failed: 0,
        total: 0,
        amount: 0
      });
    }
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.createdAt).toISOString().split('T')[0];
      const dayData = last7Days.find(day => day.date === transactionDate);
      
      if (dayData) {
        dayData.total++;
        dayData.amount += transaction.order_amount || 0;
        
        if (transaction.status === 'success') dayData.success++;
        else if (transaction.status === 'pending') dayData.pending++;
        else if (transaction.status === 'failed') dayData.failed++;
      }
    });
    
    return last7Days;
  };

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Real-time data polling
  useEffect(() => {
    let interval;
    if (realTimeEnabled) {
      interval = setInterval(() => {
        fetchTransactions();
      }, 10000); // Poll every 10 seconds
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [realTimeEnabled, fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
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

  const getStatusBadge = (status) => {
    const statusMap = {
      success: 'badge-success',
      pending: 'badge-warning',
      failed: 'badge-danger'
    };
    return statusMap[status?.toLowerCase()] || 'badge-secondary';
  };

  const renderChart = () => {
    
    const maxTransactions = Math.max(...chartData.map(d => d.total));
    
    return (
      <div className="chart-container">
        <h6>Last 7 Days Overview</h6>
        <div className="bar-chart">
          {chartData.map((day, index) => (
            <div key={index} className="bar-item">
              <div className="bar-stack">
                <div 
                  className="bar-segment success"
                  style={{ 
                    height: `${(day.success / maxTransactions) * 100}%`,
                    backgroundColor: 'var(--primary-green)'
                  }}
                  title={`${day.success} successful`}
                />
                <div 
                  className="bar-segment pending"
                  style={{ 
                    height: `${(day.pending / maxTransactions) * 100}%`,
                    backgroundColor: '#f59e0b'
                  }}
                  title={`${day.pending} pending`}
                />
                <div 
                  className="bar-segment failed"
                  style={{ 
                    height: `${(day.failed / maxTransactions) * 100}%`,
                    backgroundColor: '#dc2626'
                  }}
                  title={`${day.failed} failed`}
                />
              </div>
              <div className="bar-label">
                <small>{day.day}</small>
                <br />
                <small>{day.total}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    const current = pagination.page;
    const total = pagination.totalPages;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(total, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <nav aria-label="Transactions pagination">
        <ul className="pagination justify-content-center">
          <li className={`page-item ${current === 1 ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(current - 1)}
              disabled={current === 1}
            >
              Previous
            </button>
          </li>
          
          {start > 1 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
              </li>
              {start > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
            </>
          )}
          
          {pages.map(page => (
            <li key={page} className={`page-item ${current === page ? 'active' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            </li>
          ))}
          
          {end < total && (
            <>
              {end < total - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(total)}>{total}</button>
              </li>
            </>
          )}
          
          <li className={`page-item ${current === total ? 'disabled' : ''}`}>
            <button 
              className="page-link" 
              onClick={() => handlePageChange(current + 1)}
              disabled={current === total}
            >
              Next
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="page-title">Transaction Dashboard</h1>
        <div className="d-flex align-items-center gap-3">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              id="realTimeToggle"
              checked={realTimeEnabled}
              onChange={(e) => setRealTimeEnabled(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="realTimeToggle">
              🔄 Real-time Updates
            </label>
          </div>
          {realTimeEnabled && (
            <span className="badge bg-success pulse-animation">
              Live
            </span>
          )}
        </div>
      </div>
      
      {/* Enhanced Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div>
              <h6>Total Transactions</h6>
              <h3>{stats.total}</h3>
              <small className="text-muted">{formatCurrency(stats.totalAmount)} total</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ borderLeftColor: 'var(--primary-green)' }}>
            <div className="stat-icon" style={{ color: 'var(--primary-green)' }}>✅</div>
            <div>
              <h6>Successful</h6>
              <h3 style={{ color: 'var(--primary-green)' }}>{stats.success}</h3>
              <small className="text-muted">{formatCurrency(stats.successAmount)} collected</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
            <div className="stat-icon" style={{ color: '#f59e0b' }}>⏳</div>
            <div>
              <h6>Pending</h6>
              <h3 style={{ color: '#f59e0b' }}>{stats.pending}</h3>
              <small className="text-muted">Awaiting confirmation</small>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ borderLeftColor: '#dc2626' }}>
            <div className="stat-icon" style={{ color: '#dc2626' }}>❌</div>
            <div>
              <h6>Failed</h6>
              <h3 style={{ color: '#dc2626' }}>{stats.failed}</h3>
              <small className="text-muted">Need attention</small>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Visualization */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              {renderChart()}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-section">
        <h5>Filters</h5>
        <div className="row">
          <div className="col-md-3">
            <label className="form-label">Status</label>
            <select 
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">School ID</label>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by school ID"
              value={filters.school_id}
              onChange={(e) => handleFilterChange('school_id', e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Sort By</label>
            <select 
              className="form-select"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              <option value="createdAt">Created Date</option>
              <option value="payment_time">Payment Time</option>
              <option value="order_amount">Order Amount</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Order</label>
            <select 
              className="form-select"
              value={filters.order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>School Details</th>
                <th>Student Details</th>
                <th>Amount</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th>Date Created</th>
                <th>Payment Time</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr key={transaction.collect_id || transaction._id} className="transaction-row">
                    <td>
                      <div>
                        <strong>{transaction.custom_order_id || 'N/A'}</strong>
                        <br />
                        <small className="text-muted">
                          Gateway: {transaction.gateway || 'Edviron'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{transaction.school_name || 'N/A'}</strong>
                        <br />
                        <small className="text-muted">
                          ID: {transaction.school_id || 'N/A'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{transaction.student_info?.name || 'N/A'}</strong>
                        <br />
                        <small className="text-muted">
                          ID: {transaction.student_info?.id || 'N/A'}
                        </small>
                        <br />
                        <small className="text-muted">
                          {transaction.student_info?.email || 'N/A'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{formatCurrency(transaction.order_amount || 0)}</strong>
                        <br />
                        {transaction.transaction_amount && transaction.transaction_amount !== transaction.order_amount && (
                          <small className="text-muted">
                            Paid: {formatCurrency(transaction.transaction_amount)}
                          </small>
                        )}
                      </div>
                    </td>
                    <td>
                      {transaction.payment_mode ? (
                        <div>
                          <span className="badge bg-info text-dark">
                            {transaction.payment_mode.toUpperCase()}
                          </span>
                          <br />
                          {transaction.bank_reference && (
                            <small className="text-muted">
                              Ref: {transaction.bank_reference}
                            </small>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(transaction.status)}`}>
                        {(transaction.status || 'pending').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <small>{formatDate(transaction.createdAt)}</small>
                    </td>
                    <td>
                      <small>{formatDate(transaction.payment_time)}</small>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {renderPagination()}
        
        <div className="text-center mt-3">
          <small className="text-muted">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} transactions
          </small>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;