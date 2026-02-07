import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Plus, Building2, Users, IndianRupee, MapPin, Map, Camera, Utensils, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const { pgs, tenants, addPg } = useData();
    const [showAddPg, setShowAddPg] = useState(false);
    const [newPg, setNewPg] = useState({ name: '', address: '', rooms: [], foodMenu: [] });

    const handleAddPg = (e) => {
        e.preventDefault();
        addPg(newPg);
        setShowAddPg(false);
        setNewPg({ name: '', address: '', rooms: [], foodMenu: [] });
    };

    return (
        <div className="container" style={{ padding: 0 }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.25rem' }}>Property Overview</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Manage your buildings and check status</p>
                </div>
                <button onClick={() => setShowAddPg(true)} className="btn btn-primary">
                    <Plus size={20} /> Add New PG
                </button>
            </header>

            {/* Stats row */}
            <div className="grid grid-cols-2" style={{ marginBottom: '2rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                            <Building2 size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total PGs</p>
                            <h2 style={{ margin: 0 }}>{pgs.length}</h2>
                        </div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '12px', color: 'var(--secondary)' }}>
                            <Users size={24} />
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Tenants</p>
                            <h2 style={{ margin: 0 }}>{tenants.length}</h2>
                        </div>
                    </div>
                </div>

            </div>

            <h2 style={{ marginBottom: '1.5rem' }}>Your Properties</h2>

            {pgs.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                        <Building2 size={48} style={{ opacity: 0.5 }} />
                    </div>
                    <h3>No PGs found</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Get started by adding your first property</p>
                    <button onClick={() => setShowAddPg(true)} className="btn btn-outline" style={{ margin: '0 auto' }}>
                        Add Property
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2">
                    {pgs.map(pg => (
                        <div key={pg.id} className="glass-card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>{pg.name}</h3>
                                <span className="btn-outline" style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem' }}>
                                    Active
                                </span>
                            </div>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                <Map size={16} /> {pg.address}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rooms</p>
                                    <p style={{ fontWeight: 600 }}>{pg.rooms?.length || 0} Categories</p>
                                </div>
                                <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tenants</p>
                                    <p style={{ fontWeight: 600 }}>{tenants.filter(t => t.pgId === pg.id).length} Active</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Link to={`/pg/${pg.id}`} className="btn btn-primary" style={{ flex: 1, fontSize: '0.875rem', textDecoration: 'none', justifyContent: 'center' }}>
                                    Manage Details
                                </Link>
                                <Link to={`/tenants?pgId=${pg.id}`} className="btn btn-outline" style={{ flex: 1, fontSize: '0.875rem', textDecoration: 'none', justifyContent: 'center' }}>
                                    Pay Requests
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add PG Modal */}
            {showAddPg && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <h2>Add New Property</h2>
                        <form onSubmit={handleAddPg}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>PG Name</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Skyline Luxury PG"
                                    value={newPg.name}
                                    onChange={(e) => setNewPg({ ...newPg, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Address</label>
                                <textarea
                                    className="input-field"
                                    style={{ minHeight: '100px', resize: 'none' }}
                                    placeholder="Full address of the property"
                                    value={newPg.address}
                                    onChange={(e) => setNewPg({ ...newPg, address: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddPg(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Create PG</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
