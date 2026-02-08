import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LogIn, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const TenantLoginPage = () => {
    const { loginAsTenant } = useData();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await loginAsTenant(email, password);
        if (!res?.success) {
            setError(res?.message || 'Login failed');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--secondary)', padding: '1rem', borderRadius: '50%' }}>
                        <User size={32} color="white" />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Tenant Login</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    View bills and raise payment tickets
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="tenant@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <LogIn size={20} />
                        Sign In
                    </button>
                </form>
                {error && (
                    <p style={{ marginTop: '1rem', color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center' }}>
                        {error}
                    </p>
                )}

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Are you an owner? <Link to="/login" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>Owner Login</Link>
                </p>
            </div>
        </div>
    );
};

export default TenantLoginPage;
