import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { UserPlus, Shield, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useData();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: ''
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const hasUpperCase = /[A-Z]/.test(formData.password);
            const hasLowerCase = /[a-z]/.test(formData.password);
            const hasNumber = /[0-9]/.test(formData.password);
            const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);

            if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSymbol) {
                newErrors.password = 'Password must contain uppercase, lowercase, number, and symbol';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            }
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone.trim())) {
            newErrors.phone = 'Phone number must be exactly 10 digits';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await register({
            name: formData.name.trim(),
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            phone: formData.phone.trim(),
            address: formData.address.trim()
        });

        if (result.success) {
            alert('Registration successful! Please login with your credentials.');
            navigate('/login');
        } else {
            setErrors({ email: result.message });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // For phone, only allow digits and limit to 10
        if (name === 'phone') {
            const digitsOnly = value.replace(/\D/g, '');
            if (digitsOnly.length <= 10) {
                setFormData(prev => ({ ...prev, [name]: digitsOnly }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Real-time password match validation
        if (name === 'confirmPassword' && value !== formData.password) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else if (name === 'password' && formData.confirmPassword && value !== formData.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        } else if (name === 'confirmPassword' && value === formData.password) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        } else if (name === 'password' && formData.confirmPassword && value === formData.confirmPassword) {
            setErrors(prev => ({ ...prev, confirmPassword: '' }));
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
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
                <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Register as PG Owner</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                    Create your account to manage your PGs
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Owner Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            type="text"
                            name="name"
                            className="input-field"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                        />
                        {errors.name && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.name}</p>}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            type="email"
                            name="email"
                            className="input-field"
                            placeholder="owner@example.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.email}</p>}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
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

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Confirm Password <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="input-field"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                        {errors.confirmPassword && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.confirmPassword}</p>}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Phone Number <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                            type="tel"
                            name="phone"
                            className="input-field"
                            placeholder="9876543210"
                            value={formData.phone}
                            onChange={handleChange}
                            maxLength="10"
                        />
                        {errors.phone && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{errors.phone}</p>}
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Address (Optional)</label>
                        <textarea
                            name="address"
                            className="input-field"
                            placeholder="Your address"
                            value={formData.address}
                            onChange={handleChange}
                            style={{ minHeight: '80px', resize: 'vertical' }}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        <UserPlus size={20} />
                        Create Account
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Already have an account? <span onClick={() => navigate('/login')} style={{ color: 'var(--secondary)', cursor: 'pointer', textDecoration: 'underline' }}>Sign In</span>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
