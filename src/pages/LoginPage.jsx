import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { LogIn, Shield } from 'lucide-react';
import { ownerLoginSchema } from '../schemas/authSchemas';
import { validateWithSchema } from '../utils/validation';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const { loginAsOwner, sendPasswordResetEmail } = useData();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResetMessage('');

        const validation = validateWithSchema(ownerLoginSchema, { email, password });
        if (!validation.success) {
            setFieldErrors(validation.errors);
            return;
        }

        setFieldErrors({});
        const res = await loginAsOwner(validation.data.email, validation.data.password);
        if (!res?.success) {
            setError(res?.message || 'Login failed');
        }
    };

    const handleForgotPassword = async () => {
        setError('');
        setResetMessage('');

        const validation = validateWithSchema(ownerLoginSchema.pick({ email: true }), { email });
        if (!validation.success) {
            setFieldErrors(validation.errors);
            setError(validation.errors.email || 'Enter your email first to receive reset link');
            return;
        }

        setFieldErrors((prev) => ({ ...prev, email: '' }));
        const redirectTo = `${window.location.origin}/reset-password`;
        const res = await sendPasswordResetEmail(validation.data.email, redirectTo);
        if (!res.success) {
            setError(res.message || 'Could not send reset email');
            return;
        }
        setResetMessage('Password reset link sent to your email.');
    };

    return (
        <div className="auth-page-shell">
            <div className="glass-card auth-card" style={{ maxWidth: '400px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '1rem', borderRadius: '50%' }}>
                        <Shield size={32} color="white" />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Owner Login</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Manage your PGs and Tenants in one place
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
                        <input
                            type="email"
                            className="input-field"
                            placeholder="owner@example.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, email: '' }));
                            }}
                            required
                        />
                        {fieldErrors.email && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{fieldErrors.email}</p>}
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            placeholder="********"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, password: '' }));
                            }}
                            required
                        />
                        {fieldErrors.password && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{fieldErrors.password}</p>}
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            style={{
                                marginTop: '0.75rem',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--secondary)',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                                padding: 0
                            }}
                        >
                            Forgot password?
                        </button>
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
                {resetMessage && (
                    <p style={{ marginTop: '0.75rem', color: 'var(--success)', fontSize: '0.875rem', textAlign: 'center' }}>
                        {resetMessage}
                    </p>
                )}

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Admin access is invite-only. Please contact the system owner for an invite link.
                </p>
                <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Are you a tenant? <Link to="/tenant/login" style={{ color: 'var(--secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Tenant Login</Link>
                </p>
                <p style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Are you a guardian? <Link to="/guardian/login" style={{ color: 'var(--secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Guardian Login</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
