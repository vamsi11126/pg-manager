import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { IndianRupee, Phone, CheckCircle2, Clock, LogOut, KeyRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { paymentTicketSchema } from '../schemas/paymentSchema';
import { adminPasswordSchema } from '../schemas/authSchemas';
import { validateWithSchema } from '../utils/validation';

const TenantDashboard = () => {
    const { tenantUser, tenantPg, tenantRoommates, tenantPaymentRequests, addTenantPaymentRequest, updateTenantPassword, getTenantSupportContact, logout } = useData();
    const [ticketType, setTicketType] = useState('Rent');
    const [ticketAmount, setTicketAmount] = useState('');
    const [ticketNote, setTicketNote] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [message, setMessage] = useState('');
    const [guardianContact, setGuardianContact] = useState(null);
    const [ticketErrors, setTicketErrors] = useState({});
    const [passwordErrors, setPasswordErrors] = useState({});

    const monthLabel = useMemo(() => {
        const now = new Date();
        return now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    }, []);

    useEffect(() => {
        const loadGuardianContact = async () => {
            const email = (tenantUser?.email || '').trim();
            if (!email) {
                setGuardianContact(null);
                return;
            }

            try {
                const contact = await getTenantSupportContact(email);
                setGuardianContact(contact);
            } catch {
                setGuardianContact(null);
            }
        };

        loadGuardianContact();
    }, [tenantUser?.email, getTenantSupportContact]);

    if (!tenantUser) {
        return (
            <div className="container" style={{ padding: '2rem' }}>
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <h2 style={{ marginTop: 0 }}>Tenant account not found</h2>
                    <p style={{ color: 'var(--text-muted)' }}>
                        This account is not linked to any tenant record. Please contact the PG owner.
                    </p>
                    <p style={{ marginTop: '1rem' }}>
                        <Link to="/tenant/login" style={{ color: 'var(--secondary)', textDecoration: 'underline' }}>
                            Back to Tenant Login
                        </Link>
                    </p>
                </div>
            </div>
        );
    }

    const rentBill = tenantUser.rent || 0;
    const foodBill = tenantUser.withFood ? (tenantPg?.foodAmount || 0) : 0;

    const raiseQuickTicket = async (type, amount) => {
        setMessage('');
        const description = `${type} Payment - ${monthLabel}`;
        const res = await addTenantPaymentRequest({ description, amount });
        if (!res.success) {
            setMessage(res.message || 'Failed to raise request');
            return;
        }
        setMessage('Payment ticket raised successfully.');
    };

    const hasTicketForMonth = (type) => {
        const prefix = `${type} Payment - ${monthLabel}`;
        return tenantPaymentRequests.some(req => (req.description || '').startsWith(prefix));
    };

    const handleRaiseTicket = async (e) => {
        e.preventDefault();
        setMessage('');

        const validation = validateWithSchema(paymentTicketSchema, { ticketType, ticketAmount, ticketNote });
        if (!validation.success) {
            setTicketErrors(validation.errors);
            setMessage(Object.values(validation.errors)[0] || 'Please correct the form errors.');
            return;
        }

        setTicketErrors({});
        const description = `${validation.data.ticketType} Payment - ${monthLabel}${validation.data.ticketNote ? ` (${validation.data.ticketNote})` : ''}`;
        const res = await addTenantPaymentRequest({ description, amount: validation.data.ticketAmount });
        if (!res.success) {
            setMessage(res.message || 'Failed to raise request');
            return;
        }
        setTicketAmount('');
        setTicketNote('');
        setMessage('Payment ticket raised successfully.');
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMessage('');

        const validation = validateWithSchema(adminPasswordSchema, {
            newPassword: password,
            confirmPassword: passwordConfirm
        });
        if (!validation.success) {
            setPasswordErrors(validation.errors);
            setMessage(Object.values(validation.errors)[0] || 'Please correct the password fields.');
            return;
        }

        setPasswordErrors({});
        const res = await updateTenantPassword(validation.data.newPassword);
        if (!res.success) {
            setMessage(res.message || 'Failed to update password');
            return;
        }
        setPassword('');
        setPasswordConfirm('');
        setMessage('Password updated successfully.');
    };

    return (
        <div className="container" style={{ padding: '2rem' }}>
            <div className="dashboard-header" style={{ marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ margin: 0 }}>{tenantUser.name}</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        {tenantPg?.name} • Room {tenantUser.roomNumber}
                    </p>
                </div>
                <button onClick={logout} className="btn btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <LogOut size={18} /> Logout
                </button>
            </div>

            {message && (
                <div className="glass-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
                    {message}
                </div>
            )}

            {guardianContact && (
                <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        Assigned Guardian: <strong style={{ color: 'var(--text-main)' }}>{guardianContact.name}</strong> ({guardianContact.phone})
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0 }}>Your Bills ({monthLabel})</h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Rent Bill</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monthly rent</div>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{rentBill}</div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '0.75rem' }}
                                onClick={() => raiseQuickTicket('Rent', rentBill)}
                                disabled={hasTicketForMonth('Rent')}
                            >
                                <IndianRupee size={16} /> Raise Ticket
                            </button>
                            {hasTicketForMonth('Rent') && (
                                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Ticket already raised for this month.
                                </p>
                            )}
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Food Bill</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Monthly food</div>
                                </div>
                                <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>₹{foodBill}</div>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ marginTop: '0.75rem' }}
                                onClick={() => raiseQuickTicket('Food', foodBill)}
                                disabled={!tenantUser.withFood || hasTicketForMonth('Food')}
                            >
                                <IndianRupee size={16} /> Raise Ticket
                            </button>
                            {hasTicketForMonth('Food') && (
                                <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Ticket already raised for this month.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0 }}>Roommates (Phone Only)</h3>
                    {tenantRoommates.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No roommates found.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {tenantRoommates.map(mate => (
                                <div key={mate.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                                    <div style={{ fontWeight: 600 }}>{mate.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                                        <Phone size={14} /> {mate.phone}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0 }}>Raise Payment Ticket</h3>
                    <form onSubmit={handleRaiseTicket} noValidate>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Bill Type</label>
                            <select className="input-field" value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                                <option>Rent</option>
                                <option>Food</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (₹)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={ticketAmount}
                                onChange={(e) => {
                                    setTicketAmount(e.target.value);
                                    setTicketErrors((prev) => ({ ...prev, ticketAmount: '' }));
                                }}
                                required
                                min="1"
                            />
                            {ticketErrors.ticketAmount && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{ticketErrors.ticketAmount}</p>}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Note (optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                value={ticketNote}
                                onChange={(e) => {
                                    setTicketNote(e.target.value);
                                    setTicketErrors((prev) => ({ ...prev, ticketNote: '' }));
                                }}
                                placeholder="e.g. Paid via UPI"
                            />
                            {ticketErrors.ticketNote && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{ticketErrors.ticketNote}</p>}
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={hasTicketForMonth(ticketType)}>
                            <IndianRupee size={16} /> Raise Ticket
                        </button>
                        {hasTicketForMonth(ticketType) && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                You already raised a {ticketType.toLowerCase()} ticket for this month.
                            </p>
                        )}
                    </form>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginTop: 0 }}>Change Password</h3>
                    <form onSubmit={handleChangePassword} noValidate>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password</label>
                            <input
                                type="password"
                                className="input-field"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
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
                                value={passwordConfirm}
                                onChange={(e) => {
                                    setPasswordConfirm(e.target.value);
                                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: '' }));
                                }}
                                required
                            />
                            {passwordErrors.confirmPassword && <p style={{ marginTop: '0.25rem', color: 'var(--danger)', fontSize: '0.75rem' }}>{passwordErrors.confirmPassword}</p>}
                        </div>
                        <button type="submit" className="btn btn-outline">
                            <KeyRound size={16} /> Update Password
                        </button>
                    </form>
                </div>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Your Payment Tickets</h3>
                {tenantPaymentRequests.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No payment tickets yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                        {tenantPaymentRequests.map(req => (
                            <div key={req.id} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{req.description}</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>₹{req.amount}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                                    {req.status === 'Accepted' ? <CheckCircle2 size={14} color="var(--success)" /> : <Clock size={14} color="#f59e0b" />}
                                    <span>{req.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TenantDashboard;
