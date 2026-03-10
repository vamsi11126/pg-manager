import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { KeyRound, ArrowLeft, Send } from 'lucide-react';
import { adminPasswordSchema, inviteAdminSchema } from '../schemas/authSchemas';
import { validateWithSchema } from '../utils/validation';

const AdminSettings = () => {
    const { user, updateAdminPassword, createAdminInvite } = useData();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteMessage, setInviteMessage] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [inviteFieldErrors, setInviteFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const validation = validateWithSchema(adminPasswordSchema, { newPassword, confirmPassword });
        if (!validation.success) {
            setPasswordErrors(validation.errors);
            setError(Object.values(validation.errors)[0] || 'Please correct the password fields.');
            return;
        }

        setPasswordErrors({});
        const res = await updateAdminPassword(validation.data.newPassword);
        if (!res.success) {
            setError(res.message || 'Failed to update password');
            return;
        }

        setNewPassword('');
        setConfirmPassword('');
        setMessage('Password updated successfully.');
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setInviteMessage('');
        setInviteError('');

        const validation = validateWithSchema(inviteAdminSchema, { email: inviteEmail });
        if (!validation.success) {
            setInviteFieldErrors(validation.errors);
            setInviteError(validation.errors.email || 'Invite email is invalid');
            return;
        }

        setInviteFieldErrors({});
        setInviteLoading(true);
        try {
            await createAdminInvite(validation.data.email);
            setInviteMessage('Admin invite sent successfully. Invite link expires in 24 hours.');
            setInviteEmail('');
        } catch (err) {
            setInviteError(err?.message || 'Failed to send admin invite');
        } finally {
            setInviteLoading(false);
        }
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
                <form onSubmit={handleSubmit} noValidate>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={newPassword}
                            onChange={(e) => {
                                setNewPassword(e.target.value);
                                setPasswordErrors((prev) => ({ ...prev, newPassword: '' }));
                            }}
                            required
                        />
                        {passwordErrors.newPassword && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{passwordErrors.newPassword}</p>}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                            }}
                            required
                        />
                        {passwordErrors.confirmPassword && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{passwordErrors.confirmPassword}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary">
                        <KeyRound size={16} /> Update Password
                    </button>
                </form>

                {error && <p style={{ marginTop: '1rem', color: 'var(--danger)' }}>{error}</p>}
                {message && <p style={{ marginTop: '1rem', color: 'var(--success)' }}>{message}</p>}

                <hr style={{ margin: '2rem 0', borderColor: 'var(--border-glass)', opacity: 0.5 }} />

                <h3 style={{ marginBottom: '0.75rem' }}>Invite New Admin</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Only the configured super admin can send invites.
                </p>

                <form onSubmit={handleInviteSubmit} noValidate>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Invitee Email</label>
                        <input
                            type="email"
                            className="input-field"
                            value={inviteEmail}
                            onChange={(e) => {
                                setInviteEmail(e.target.value);
                                setInviteFieldErrors((prev) => ({ ...prev, email: '' }));
                            }}
                            placeholder="new-admin@example.com"
                            required
                        />
                        {inviteFieldErrors.email && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{inviteFieldErrors.email}</p>}
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={inviteLoading}>
                        <Send size={16} /> {inviteLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                </form>

                {inviteError && <p style={{ marginTop: '1rem', color: 'var(--danger)' }}>{inviteError}</p>}
                {inviteMessage && <p style={{ marginTop: '1rem', color: 'var(--success)' }}>{inviteMessage}</p>}
            </div>
        </div>
    );
};

export default AdminSettings;
