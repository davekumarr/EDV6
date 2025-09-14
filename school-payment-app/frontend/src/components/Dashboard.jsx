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
    failed: 0
  });

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
      
      // Calculate stats
      const stats = response.data.data.reduce((acc, transaction) => {
        acc.total++;
        if (transaction.status === 'success') acc.success++;
        else if (transaction.status === 'pending') acc.pending++;
        else if (transaction.status === 'failed') acc.failed++;
        return acc;
      }, { total: 0, success: 0, pending: 0, failed: 0 });
      
setStats(stats);
    setError('');
  } catch (err) {
    setError('Failed to fetch transactions');
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [filters]);

useEffect(() => {
  fetchTransactions();
}, [fetchTransactions]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
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
      <h1 className="page-title">Transaction Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="stat-card">
            <h6>Total Transactions</h6>
            <h3>{stats.total}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ borderLeftColor: 'var(--primary-green)' }}>
            <h6>Successful</h6>
            <h3 style={{ color: 'var(--primary-green)' }}>{stats.success}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ borderLeftColor: '#f59e0b' }}>
            <h6>Pending</h6>
            <h3 style={{ color: '#f59e0b' }}>{stats.pending}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="stat-card" style={{ borderLeftColor: '#dc2626' }}>
            <h6>Failed</h6>
            <h3 style={{ color: '#dc2626' }}>{stats.failed}</h3>
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
          <table className="table">
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
                  <tr key={transaction.collect_id || transaction._id}>
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