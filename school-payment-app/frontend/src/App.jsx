import React from 'react';
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
  const isAuthenticated = localStorage.getItem('token');

  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container-fluid">
          <Routes>
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
              } 
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-payment"
              element={
                <ProtectedRoute>
                  <PaymentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transaction-status"
              element={
                <ProtectedRoute>
                  <TransactionStatus />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              } 
            />
            <Route 
              path="*" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;