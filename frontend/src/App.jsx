import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Kardex from './pages/Kardex';
import Transfers from './pages/Transfers';
import { SnackbarProvider } from './contexts/SnackbarContext';

export default function App() {
  const location = useLocation();
  const token = localStorage.getItem('erp_token');

  // Si no hay token y no está en /login, redirigir
  if (!token && location.pathname !== '/login') {
    return <Navigate to="/login" replace />;
  }

  return (
    <SnackbarProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/kardex" element={<Kardex />} />
        </Routes>
      </Layout>
    </SnackbarProvider>
  );
}
