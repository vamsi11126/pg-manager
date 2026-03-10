import React, { useEffect, useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { guardianSchema } from '../../schemas/guardianSchema';
import { validateWithSchema } from '../../utils/validation';

const GuardianSection = ({ pgId, isAdmin }) => {
    const { getGuardianForPg, assignGuardianForPg, removeGuardianForPg } = useData();
    const { success, error: showError, info } = useToast();
    const [loading, setLoading] = useState(true);
    const [guardian, setGuardian] = useState(null);
    const [guardianName, setGuardianName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

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
        const validation = validateWithSchema(guardianSchema, {
            guardianName,
            phone,
            password,
            confirmPassword
        });
        if (!validation.success) {
            setFieldErrors(validation.errors);
            showError(Object.values(validation.errors)[0] || 'Please correct the form errors.');
            return;
        }
        setFieldErrors({});

        try {
            const data = await assignGuardianForPg({
                pgId,
                guardianName: validation.data.guardianName,
                phone: validation.data.phone,
                password: validation.data.password
            });
            setGuardian(data);
            setGuardianName(data?.guardian_name || validation.data.guardianName);
            setPhone(data?.phone || validation.data.phone);
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

            <form onSubmit={handleAssignGuardian} noValidate>
                <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Guardian Name</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Guardian full name"
                            value={guardianName}
                            onChange={(e) => {
                                setGuardianName(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, guardianName: '' }));
                            }}
                            required
                        />
                        {fieldErrors.guardianName && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.guardianName}</p>}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Guardian Phone</label>
                        <input
                            type="text"
                            className="input-field"
                            maxLength="10"
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => {
                                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                                setFieldErrors((prev) => ({ ...prev, phone: '' }));
                            }}
                            required
                        />
                        {fieldErrors.phone && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.phone}</p>}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setFieldErrors((prev) => ({ ...prev, password: '' }));
                            }}
                            required
                        />
                        {fieldErrors.password && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{fieldErrors.password}</p>}
                    </div>
                    <div>
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
