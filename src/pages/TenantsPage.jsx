import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Plus, User, Phone, Mail, Briefcase, FileText, Calendar, IndianRupee, Search, ArrowLeft, X, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const TenantsPage = () => {
    const { pgs, tenants, addTenant, deleteTenant, paymentRequests, updatePaymentRequestStatus } = useData();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const pgFilter = queryParams.get('pgId');

    const [showAddTenant, setShowAddTenant] = useState(false);
    const [viewingTenant, setViewingTenant] = useState(null);
    const [aadharError, setAadharError] = useState('');
    const [phoneError, setPhoneError] = useState('');

    const [newTenant, setNewTenant] = useState({
        name: '',
        phone: '',
        email: '',
        profession: '',
        aadhar: '',
        pgId: pgFilter || pgs[0]?.id || '',
        roomNumber: '',
        rent: '',
        advance: '',
        withFood: true,
        joiningDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (queryParams.get('action') === 'register') {
            setShowAddTenant(true);
        }
    }, [location.search]);


    const handleNumberInput = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === '+') {
            e.preventDefault();
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleAddTenant = (e) => {
        e.preventDefault();

        let hasError = false;

        // Phone validation
        if (newTenant.phone.length !== 10) {
            setPhoneError('Phone number must be exactly 10 digits');
            hasError = true;
        } else {
            setPhoneError('');
        }

        // Aadhar validation
        if (newTenant.aadhar.length !== 12) {
            setAadharError('Aadhar number must be exactly 12 digits');
            hasError = true;
        } else {
            setAadharError('');
        }

        if (hasError) return;

        const tenantData = {
            ...newTenant,
            rent: Number(newTenant.rent),
            advance: Number(newTenant.advance)
        };

        addTenant(tenantData);
        setShowAddTenant(false);
        setNewTenant({
            name: '', phone: '', email: '', profession: '', aadhar: '',
            pgId: pgFilter || pgs[0]?.id || '', roomNumber: '', rent: '', advance: '',
            withFood: true,
            joiningDate: new Date().toISOString().split('T')[0]
        });
    };


    const getVacantRoomsForPg = (pgId) => {
        const pg = pgs.find(p => p.id === pgId);
        if (!pg) return [];
        const vacantRooms = [];
        pg.rooms?.forEach(cat => {
            const capacity = parseInt(cat.type) || 1;
            cat.roomNumbers?.forEach(num => {
                const roomTenants = tenants.filter(t => t.pgId === pgId && t.roomNumber === num);
                const slotsLeft = capacity - roomTenants.length;

                if (slotsLeft > 0) {
                    vacantRooms.push({
                        number: num,
                        type: cat.type,
                        slotsLeft: slotsLeft
                    });
                }
            });
        });
        return vacantRooms;
    };

    const pgForRegistration = pgs.find(p => p.id === (pgFilter || newTenant.pgId));
    const hasRoomCategories = pgForRegistration?.rooms?.length > 0;

    const filteredRequests = paymentRequests.filter(req => !pgFilter || req.pgId === pgFilter);

    return (
        <div className="container" style={{ padding: 0 }}>
            <Link to="/" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: 'var(--text-main)',
                textDecoration: 'none',
                marginBottom: '2rem',
                padding: '0.5rem 1rem',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-glass)',
                borderRadius: '12px',
                transition: 'all 0.2s ease'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '0.4rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <ArrowLeft size={18} />
                </div>
                <span style={{ fontWeight: 500 }}>Back to Dashboard</span>
            </Link>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Pay Requests</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage and process tenant payment requests</p>
                </div>
                {!hasRoomCategories && (
                    <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '12px', fontSize: '0.875rem' }}>
                        Please add room categories in PG Details before registering tenants.
                    </div>
                )}
            </header>

            <div className="glass-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                            <th style={{ padding: '1.25rem' }}>Tenant Details</th>
                            <th style={{ padding: '1.25rem' }}>Request Info</th>
                            <th style={{ padding: '1.25rem' }}>Amount</th>
                            <th style={{ padding: '1.25rem' }}>Date</th>
                            <th style={{ padding: '1.25rem' }}>Status</th>
                            <th style={{ padding: '1.25rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                    <p>No payment requests found.</p>
                                </td>
                            </tr>
                        ) : (
                            filteredRequests.sort((a, b) => new Date(b.date) - new Date(a.date)).map(request => (
                                <tr key={request.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ fontWeight: 600 }}>{request.tenantName}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {request.tenantId}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{request.description}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PG: {pgs.find(p => p.id === request.pgId)?.name}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--secondary)', fontSize: '1.1rem' }}>₹{request.amount}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem', fontSize: '0.875rem' }}>
                                        {formatDate(request.date)}
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontWeight: 600,
                                            background: request.status === 'Accepted' ? 'rgba(34, 197, 94, 0.1)' :
                                                request.status === 'Declined' ? 'rgba(239, 68, 68, 0.1)' :
                                                    'rgba(245, 158, 11, 0.1)',
                                            color: request.status === 'Accepted' ? 'var(--success)' :
                                                request.status === 'Declined' ? 'var(--danger)' :
                                                    '#f59e0b'
                                        }}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem' }}>
                                        {request.status === 'Pending' ? (
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => updatePaymentRequestStatus(request.id, 'Accepted')}
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', background: 'var(--success)', border: 'none' }}
                                                >
                                                    <CheckCircle2 size={16} /> Accept
                                                </button>
                                                <button
                                                    onClick={() => updatePaymentRequestStatus(request.id, 'Declined')}
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                >
                                                    <XCircle size={16} /> Decline
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                Processed
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Register Tenant Modal */}
            {showAddTenant && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>Register New Tenant</h2>
                            <button onClick={() => setShowAddTenant(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddTenant}>
                            <div className="grid grid-cols-2">
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
                                    <input
                                        type="text" className="input-field" placeholder="John Doe"
                                        value={newTenant.name} onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number</label>
                                    <input
                                        type="text" className="input-field" placeholder="9876543210" maxLength="10"
                                        value={newTenant.phone} onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setNewTenant({ ...newTenant, phone: val });
                                        }}
                                        required
                                    />
                                    {phoneError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>{phoneError}</p>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email Address</label>
                                    <input
                                        type="email" className="input-field" placeholder="john@example.com"
                                        value={newTenant.email} onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Profession</label>
                                    <input
                                        type="text" className="input-field" placeholder="Software Engineer"
                                        value={newTenant.profession} onChange={(e) => setNewTenant({ ...newTenant, profession: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Aadhar Number</label>
                                    <input
                                        type="text" className="input-field" placeholder="123456789012" maxLength="12"
                                        value={newTenant.aadhar} onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setNewTenant({ ...newTenant, aadhar: val });
                                        }}
                                        required
                                    />
                                    {aadharError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>{aadharError}</p>}
                                </div>
                                {!pgFilter && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select PG</label>
                                        <select
                                            className="input-field"
                                            value={newTenant.pgId} onChange={(e) => setNewTenant({ ...newTenant, pgId: e.target.value, roomNumber: '' })}
                                            required
                                        >
                                            <option value="" disabled>Select a PG</option>
                                            {pgs.map(pg => <option key={pg.id} value={pg.id}>{pg.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Room (Vacant Only)</label>
                                    <select
                                        className="input-field"
                                        value={newTenant.roomNumber}
                                        onChange={(e) => setNewTenant({ ...newTenant, roomNumber: e.target.value })}
                                        required
                                    >
                                        <option value="" disabled>Select a room</option>
                                        {getVacantRoomsForPg(pgFilter || newTenant.pgId).map(room => (
                                            <option key={room.number} value={room.number}>
                                                Room {room.number} ({room.slotsLeft} {room.slotsLeft === 1 ? 'slot' : 'slots'} left)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Rent (₹)</label>
                                    <input
                                        type="text" className="input-field" placeholder="8000"
                                        value={newTenant.rent} onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setNewTenant({ ...newTenant, rent: val });
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Security Advance (₹)</label>
                                    <input
                                        type="text" className="input-field" placeholder="16000"
                                        value={newTenant.advance} onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setNewTenant({ ...newTenant, advance: val });
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date of Joining</label>
                                    <input
                                        type="date" className="input-field"
                                        value={newTenant.joiningDate} onChange={(e) => setNewTenant({ ...newTenant, joiningDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={newTenant.withFood}
                                            onChange={(e) => setNewTenant({ ...newTenant, withFood: e.target.checked })}
                                        /> Includes Food
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowAddTenant(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Register Tenant</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tenant Profile Modal */}
            {viewingTenant && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>Tenant Profile</h2>
                            <button onClick={() => setViewingTenant(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
                                    {viewingTenant.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0 }}>{viewingTenant.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{viewingTenant.profession}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>PG & Room</p>
                                    <p style={{ fontWeight: 600 }}>{pgs.find(p => p.id === viewingTenant.pgId)?.name}</p>
                                    <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Room {viewingTenant.roomNumber}</p>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Rent & Food</p>
                                    <p style={{ fontWeight: 600 }}>₹{viewingTenant.rent}/mo</p>
                                    <p style={{ color: viewingTenant.withFood ? 'var(--success)' : 'var(--danger)', fontSize: '0.875rem' }}>
                                        {viewingTenant.withFood ? 'With Food' : 'Without Food'}
                                    </p>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <Phone size={16} color="var(--primary)" /> <span>{viewingTenant.phone}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <Mail size={16} color="var(--primary)" /> <span>{viewingTenant.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <FileText size={16} color="var(--primary)" /> <span>Aadhar: {viewingTenant.aadhar}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Calendar size={16} color="var(--primary)" /> <span>Joined: {formatDate(viewingTenant.joiningDate)}</span>
                                </div>
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setViewingTenant(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TenantsPage;
