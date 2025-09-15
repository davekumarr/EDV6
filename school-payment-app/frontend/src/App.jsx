import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import PaymentForm from './components/PaymentForm';
import TransactionStatus from './components/TransactionStatus';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading, false = not authenticated, true = authenticated
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

useEffect(() => {
  const token = localStorage.getItem('token');
  setIsAuthenticated(!!token);
  setLoading(false);
  // Add a small delay to prevent flash
  const checkAuth = setTimeout(() => {
    setIsAuthenticated(!!token);
    setLoading(false);
  }, 100);

  // Check dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode') === 'true';
  setDarkMode(savedDarkMode);

  return () => clearTimeout(checkAuth);
}, []);

  useEffect(() => {
    // Apply dark mode to document
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
  };

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
        <Navbar 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        <div className="container-fluid">
          <Routes>
            {/* Login Route */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login setIsAuthenticated={setIsAuthenticated} />
                )
              } 
            />
            
            {/* Register Route */}
            <Route 
              path="/register" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Register />
                )
              } 
            />
            
            {/* Protected Dashboard Route */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Create Payment Route */}
            <Route
              path="/create-payment"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <PaymentForm />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Transaction Status Route */}
            <Route
              path="/transaction-status"
              element={
                <ProtectedRoute isAuthenticated={isAuthenticated}>
                  <TransactionStatus />
                </ProtectedRoute>
              }
            />
            
            {/* Default Route - Always redirect to login if not authenticated */}
            <Route 
              path="/" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            
            {/* Catch-all Route - Redirect to appropriate page */}
            <Route 
              path="*" 
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;