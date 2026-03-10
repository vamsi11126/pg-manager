import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { adminPasswordSchema } from '../schemas/authSchemas';
import { validateWithSchema } from '../utils/validation';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const { updateAdminPassword } = useData();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const validation = validateWithSchema(adminPasswordSchema, { newPassword, confirmPassword });
        if (!validation.success) {
            setFieldErrors(validation.errors);
            setError(Object.values(validation.errors)[0] || 'Please correct the password fields.');
            return;
        }

        setFieldErrors({});
        const res = await updateAdminPassword(validation.data.newPassword);
        if (!res.success) {
            setError(res.message || 'Could not reset password');
            return;
        }

        setMessage('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1200);
    };

    return (
        <div className="auth-page-shell">
            <div className="glass-card auth-card" style={{ maxWidth: '460px' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Admin Password</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Enter your new password below.
                </p>
                <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                            }}
                            required
                        />
                        {fieldErrors.newPassword && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.newPassword}</p>}
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                            }}
                            required
                        />
                        {fieldErrors.confirmPassword && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.confirmPassword}</p>}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <KeyRound size={16} /> Reset Password
                    </button>
                </form>

                {error && <p style={{ marginTop: '1rem', color: 'var(--danger)', textAlign: 'center' }}>{error}</p>}
                {message && <p style={{ marginTop: '1rem', color: 'var(--success)', textAlign: 'center' }}>{message}</p>}

                <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/login" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
                        <ArrowLeft size={16} /> Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
