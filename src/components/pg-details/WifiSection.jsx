import React from 'react';
import { Plus, Wifi, Edit2, Trash2, Clock } from 'lucide-react';

const WifiSection = ({ pg, setShowAddWifi, setShowEditWifi, handleDeleteWifi }) => {
    return (
        <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>WiFi Management</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage internet access details per floor</p>
                </div>
                <button onClick={() => setShowAddWifi(true)} className="btn btn-primary">
                    <Plus size={18} /> Add WiFi Details
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {(!pg.wifiDetails || pg.wifiDetails.length === 0) ? (
                    <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                        <Wifi size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                        <p>No WiFi details added yet.</p>
                    </div>
                ) : (
                    pg.wifiDetails.map((wifi) => {
                        const isDue = (() => {
                            const dueDate = new Date(wifi.dueDate);
                            const today = new Date();
                            const diff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                            return diff <= 5 ? diff : null;
                        })();

                        return (
                            <div key={wifi.id} className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{wifi.floorName}</h4>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>WiFi Details</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => setShowEditWifi(wifi)} className="btn btn-outline" style={{ padding: '0.4rem' }}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteWifi(wifi.id)} className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    <div><strong>Username:</strong> {wifi.username}</div>
                                    <div><strong>Password:</strong> {wifi.password}</div>
                                    <div><strong>Amount:</strong> ₹{wifi.amount}</div>
                                    <div><strong>Due Date:</strong> {new Date(wifi.dueDate).toLocaleDateString()}</div>
                                </div>
                                {isDue !== null && (
                                    <div style={{
                                        marginTop: '1rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        borderRadius: '8px',
                                        padding: '0.5rem 0.75rem',
                                        fontSize: '0.75rem',
                                        color: 'var(--danger)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <Clock size={14} /> Due in {isDue} day{isDue !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default WifiSection;
