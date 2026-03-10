import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Shield, ArrowLeft, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { registerAdminSchema } from '../schemas/authSchemas';
import { validateWithSchema } from '../utils/validation';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { verifyAdminInvite, acceptAdminInvite } = useData();

    const inviteToken = useMemo(() => (searchParams.get('invite') || '').trim(), [searchParams]);
    const [inviteStatus, setInviteStatus] = useState('checking');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const run = async () => {
            if (!inviteToken) {
                setInviteStatus('invalid');
                setInviteError('Invite token is missing. Please use the invite link from your email.');
                return;
            }

            setInviteStatus('checking');
            const result = await verifyAdminInvite(inviteToken);
            if (!result.success) {
                setInviteStatus('invalid');
                setInviteError(result.message || 'Invalid invite link');
                return;
            }

            setInviteEmail(result.invite?.email || '');
            setInviteStatus('valid');
        };
        run();
    }, [inviteToken, verifyAdminInvite]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setInviteError('');

        const validation = validateWithSchema(registerAdminSchema, formData);
        if (!validation.success) {
            setErrors(validation.errors);
            return;
        }

        setErrors({});
        if (!inviteToken) {
            setInviteError('Invite token is missing.');
            return;
        }

        setSubmitting(true);
        const result = await acceptAdminInvite({
            token: inviteToken,
            name: validation.data.name,
            password: validation.data.password
        });
        setSubmitting(false);

        if (!result.success) {
            setInviteError(result.message || 'Could not complete registration');
            return;
        }

        navigate('/login');
    };

    return (
        <div className="auth-page-shell">
            <div className="glass-card auth-card" style={{ maxWidth: '500px' }}>
                <button
                    onClick={() => navigate('/login')}
                    className="btn btn-outline"
                    style={{ marginBottom: '1.5rem', padding: '0.5rem 1rem' }}
                >
                    <ArrowLeft size={18} /> Back to Login
                </button>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--secondary)', padding: '1rem', borderRadius: '50%' }}>
                        <Shield size={32} color="white" />
                    </div>
                </div>
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Accept Admin Invite</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Complete your invite-based admin registration
                </p>

                {inviteStatus === 'checking' && (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Validating invite...</p>
                )}

                {inviteStatus === 'invalid' && (
                    <p style={{ color: 'var(--danger)', textAlign: 'center' }}>{inviteError || 'Invalid invite link'}</p>
                )}

                {inviteStatus === 'valid' && (
                    <form onSubmit={handleSubmit} noValidate>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Invited Email
                            </label>
                            <input type="email" className="input-field" value={inviteEmail} disabled />
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Full Name <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="input-field"
                                placeholder="Your name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name}</p>}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Password <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="input-field"
                                    placeholder="Enter a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    style={{ paddingRight: '2.5rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '0.25rem',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.password}</p>}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                                Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className="input-field"
                                placeholder="Re-enter password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            {errors.confirmPassword && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.confirmPassword}</p>}
                        </div>

                        {inviteError && (
                            <p style={{ marginBottom: '1rem', color: 'var(--danger)', fontSize: '0.875rem' }}>{inviteError}</p>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={submitting}
                        >
                            <UserPlus size={20} />
                            {submitting ? 'Creating Account...' : 'Create Admin Account'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RegisterPage;
