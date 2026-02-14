import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import LoginPage from './pages/LoginPage';
import TenantLoginPage from './pages/TenantLoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import PGDetails from './pages/PGDetails';
import TenantsPage from './pages/TenantsPage';
import TenantDashboard from './pages/TenantDashboard';
import PGLandingPage from './pages/PGLandingPage';
import { Home, LogOut, Package, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const AppContent = () => {
  const { user, tenantUser, authRole, logout, loading } = useData();
  const ownerName = user?.full_name || user?.name || user?.email || 'Owner';
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  if (loading) {
    return null;
  }

  if (authRole === 'tenant') {
    return (
      <Router>
        <Routes>
          <Route path="/tenant" element={<TenantDashboard />} />
          <Route path="/pg/:id/landingpage" element={<PGLandingPage />} />
          <Route path="*" element={<Navigate to="/tenant" />} />
        </Routes>
      </Router>
    );
  }

  if (!user && !tenantUser) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tenant/login" element={<TenantLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pg/:id/landingpage" element={<PGLandingPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/pg/:id/landingpage" element={<PGLandingPage />} />
        <Route
          path="*"
          element={(
            <div style={{ display: 'flex', height: '100vh', padding: '1rem', gap: '1rem', alignItems: 'stretch' }}>
              {/* Sidebar */}
              <aside className="glass-card" style={{
                width: isSidebarCollapsed ? '88px' : '260px',
                margin: 0,
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem',
                position: 'sticky',
                top: 0,
                height: '100%',
                transition: 'width 0.25s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package color="white" size={24} />
                  </div>
                    {!isSidebarCollapsed && <h2 style={{ fontSize: '1.25rem', margin: 0 }}>PG Manager</h2>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(prev => !prev)}
                    className="btn btn-outline tooltip-target"
                    data-tooltip={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    style={{ padding: '0.35rem', borderColor: 'var(--border-glass)', color: 'var(--text-muted)' }}
                  >
                    {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                  </button>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                  <Link
                    to="/"
                    className="btn btn-primary tooltip-target"
                    data-tooltip="Go to dashboard"
                    style={{ background: 'transparent', color: 'var(--text-main)', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}
                  >
                    <Home size={20} /> {!isSidebarCollapsed && 'Dashboard'}
                  </Link>

                </nav>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--primary), var(--secondary))' }} />
                    {!isSidebarCollapsed && <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owner</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ownerName}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Owner Account</p>
                    </div>}
                  </div>
                  <button
                    onClick={logout}
                    className="btn tooltip-target"
                    style={{ width: '100%', color: 'var(--danger)', justifyContent: isSidebarCollapsed ? 'center' : 'flex-start', padding: '0.5rem' }}
                    data-tooltip="Logout from owner account"
                  >
                    <LogOut size={20} /> {!isSidebarCollapsed && 'Logout'}
                  </button>
                </div>
              </aside>

              {/* Main Content */}
              <main style={{
                flex: 1,
                margin: 0,
                padding: '1.5rem',
                height: '100%',
                overflowY: 'auto'
              }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/pg/:id" element={<PGDetails />} />
                  <Route path="/tenants" element={<TenantsPage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
            </div>
          )}
        />
      </Routes>
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
