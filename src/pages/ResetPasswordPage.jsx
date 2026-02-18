import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { KeyRound, ArrowLeft } from 'lucide-react';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const { updateAdminPassword } = useData();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const validatePassword = (password) => {
        if (!password || password.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter';
        if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter';
        if (!/[0-9]/.test(password)) return 'Password must include at least one number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include at least one symbol';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const passwordError = validatePassword(newPassword);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const res = await updateAdminPassword(newPassword);
        if (!res.success) {
            setError(res.message || 'Could not reset password');
            return;
        }

        setMessage('Password reset successful. Redirecting to login...');
        setTimeout(() => navigate('/login'), 1200);
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '460px', padding: '2.5rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Reset Admin Password</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Enter your new password below.
                </p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
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
