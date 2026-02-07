import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PGDetails from './pages/PGDetails';
import TenantsPage from './pages/TenantsPage';
import { Home, IndianRupee, Settings, LogOut, Package } from 'lucide-react';

const AppContent = () => {
  const { user, logout } = useData();

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <aside className="glass-card" style={{
          width: '260px',
          margin: '1rem',
          borderRadius: '24px',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          position: 'sticky',
          top: '1rem',
          height: 'calc(100vh - 2rem)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '3rem', padding: '0.5rem' }}>
            <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package color="white" size={24} />
            </div>
            <h2 style={{ fontSize: '1.25rem', margin: 0 }}>PG Manager</h2>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            <Link to="/" className="btn btn-primary" style={{ background: 'transparent', color: 'var(--text-main)', justifyContent: 'flex-start' }}>
              <Home size={20} /> Dashboard
            </Link>

          </nav>

          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }} />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owner Account</p>
              </div>
            </div>
            <button onClick={logout} className="btn" style={{ width: '100%', color: 'var(--danger)', justifyContent: 'flex-start', padding: '0.5rem' }}>
              <LogOut size={20} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pg/:id" element={<PGDetails />} />
            <Route path="/tenants" element={<TenantsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}

export default App;
