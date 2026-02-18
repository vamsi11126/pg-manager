import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

const GuardianSection = ({ pgId, isAdmin }) => {
    const { getGuardianForPg, assignGuardianForPg, removeGuardianForPg } = useData();
    const { success, error: showError, info } = useToast();
    const [loading, setLoading] = useState(true);
    const [guardian, setGuardian] = useState(null);
    const [guardianName, setGuardianName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const loadGuardian = async () => {
        if (!isAdmin) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const data = await getGuardianForPg(pgId);
            setGuardian(data);
            setGuardianName(data?.guardian_name || '');
            setPhone(data?.phone || '');
        } catch (err) {
            showError(err.message || 'Could not load guardian details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGuardian();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pgId, isAdmin]);

    const validatePassword = (val) => {
        if (!val || val.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(val)) return 'Password must include at least one uppercase letter';
        if (!/[a-z]/.test(val)) return 'Password must include at least one lowercase letter';
        if (!/[0-9]/.test(val)) return 'Password must include at least one number';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(val)) return 'Password must include at least one symbol';
        return '';
    };

    const handleAssignGuardian = async (e) => {
        e.preventDefault();
        const normalizedPhone = phone.replace(/\D/g, '');
        if (!/^\d{10}$/.test(normalizedPhone)) {
            showError('Phone number must be exactly 10 digits');
            return;
        }
        if (!guardianName.trim()) {
            showError('Guardian name is required');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            showError(passwordError);
            return;
        }
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        try {
            const data = await assignGuardianForPg({
                pgId,
                guardianName: guardianName.trim(),
                phone: normalizedPhone,
                password
            });
            setGuardian(data);
            setGuardianName(data?.guardian_name || guardianName.trim());
            setPhone(data?.phone || normalizedPhone);
            setPassword('');
            setConfirmPassword('');
            success('Guardian assigned successfully.');
        } catch (err) {
            showError(err.message || 'Could not assign guardian');
        }
    };

    const handleRemoveGuardian = async () => {
        if (!guardian) return;
        try {
            await removeGuardianForPg(pgId);
            setGuardian(null);
            setGuardianName('');
            setPhone('');
            setPassword('');
            setConfirmPassword('');
            info('Guardian removed successfully.');
        } catch (err) {
            showError(err.message || 'Could not remove guardian');
        }
    };

    if (!isAdmin) {
        return (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Guardian Access</h3>
                <p style={{ color: 'var(--text-muted)' }}>
                    Only admin can assign or remove guardian credentials for this PG.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Loading guardian details...</p>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginTop: 0 }}>Guardian Access</h3>
            <p style={{ color: 'var(--text-muted)' }}>
                Assign optional guardian credentials for this PG. Guardian can access only this property.
            </p>

            {guardian ? (
                <div style={{ marginBottom: '1.25rem', padding: '1rem', border: '1px solid var(--border-glass)', borderRadius: '12px' }}>
                    <p style={{ margin: 0 }}><strong>Active Guardian Phone:</strong> {guardian.phone}</p>
                    <p style={{ margin: '0.4rem 0 0 0' }}><strong>Active Guardian Name:</strong> {guardian.guardian_name}</p>
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Reassigning will replace existing credentials.
                    </p>
                </div>
            ) : (
                <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)' }}>
                    No guardian assigned for this PG.
                </p>
            )}

            <form onSubmit={handleAssignGuardian}>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Guardian Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Guardian full name"
                            value={guardianName}
                            onChange={(e) => setGuardianName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Guardian Phone</label>
                        <input
                            type="text"
                            className="input-field"
                            maxLength="10"
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Confirm Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                    <button type="submit" className="btn btn-primary">
                        {guardian ? 'Reassign Guardian' : 'Assign Guardian'}
                    </button>
                    {guardian && (
                        <button type="button" className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleRemoveGuardian}>
                            Remove Guardian
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default GuardianSection;
