import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { LogIn, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const GuardianLoginPage = () => {
    const { loginAsGuardian } = useData();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const res = await loginAsGuardian(phone, password);
        if (!res?.success) {
            setError(res?.message || 'Login failed');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '50%' }}>
                        <Shield size={32} color="white" />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Guardian Login</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Manage your assigned PG property
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone Number</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="9876543210"
                            maxLength="10"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="********"
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

                <p style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Are you an owner? <Link to="/login" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>Owner Login</Link>
                </p>
                <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Are you a tenant? <Link to="/tenant/login" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>Tenant Login</Link>
                </p>
            </div>
        </div>
    );
};

export default GuardianLoginPage;
