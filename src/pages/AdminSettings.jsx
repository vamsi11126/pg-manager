import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { KeyRound, ArrowLeft } from 'lucide-react';

const AdminSettings = () => {
    const { user, updateAdminPassword } = useData();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

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
        setMessage('');
        setError('');

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
            setError(res.message || 'Failed to update password');
            return;
        }

        setNewPassword('');
        setConfirmPassword('');
        setMessage('Password updated successfully.');
    };

    return (
        <div className="container" style={{ padding: 0 }}>
            <Link to="/" className="btn btn-outline" style={{ width: 'fit-content', marginBottom: '1.5rem' }}>
                <ArrowLeft size={16} /> Back to Dashboard
            </Link>

            <div className="glass-card" style={{ maxWidth: '700px', padding: '2rem' }}>
                <h2 style={{ marginTop: 0 }}>Admin Settings</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                    Logged in as {user?.email || 'Admin'}
                </p>

                <h3 style={{ marginBottom: '0.75rem' }}>Change Password</h3>
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

                    <button type="submit" className="btn btn-primary">
                        <KeyRound size={16} /> Update Password
                    </button>
                </form>

                {error && <p style={{ marginTop: '1rem', color: 'var(--danger)' }}>{error}</p>}
                {message && <p style={{ marginTop: '1rem', color: 'var(--success)' }}>{message}</p>}
            </div>
        </div>
    );
};

export default AdminSettings;
