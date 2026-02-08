import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bed, Edit2, LayoutGrid, Plus, Trash2, UserPlus, Utensils, Wifi, Zap } from 'lucide-react';

const PgHeaderTabs = ({
    pg,
    activeTab,
    setActiveTab,
    setShowEditPg,
    handleDeletePg,
    setShowAddRoom,
    setShowAddTenant
}) => {
    return (
        <>
            <header style={{ marginBottom: '2rem' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1 style={{ margin: 0 }}>{pg.name}</h1>

                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>{pg.address}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setShowEditPg(true)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                            <Edit2 size={18} /> Edit PG
                        </button>
                        <button onClick={handleDeletePg} className="btn btn-outline" style={{ fontSize: '0.875rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            <Trash2 size={18} /> Delete PG
                        </button>
                        <button onClick={() => setShowAddRoom(true)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                            <Plus size={18} /> Add Room Category
                        </button>

                        <button
                            onClick={() => {
                                if (pg.rooms?.length > 0) {
                                    setActiveTab('tenants');
                                    setShowAddTenant(true);
                                }
                            }}
                            className={`btn ${pg.rooms?.length > 0 ? 'btn-primary' : 'btn-disabled'}`}
                            style={{
                                fontSize: '0.875rem',
                                opacity: pg.rooms?.length > 0 ? 1 : 0.5,
                                pointerEvents: pg.rooms?.length > 0 ? 'auto' : 'none'
                            }}
                        >
                            <UserPlus size={18} /> Register Tenant
                        </button>
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '2rem', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'rooms' ? 'var(--primary)' : 'transparent' }}
                >
                    <Bed size={18} /> Rooms
                </button>
                <button
                    onClick={() => setActiveTab('tenants')}
                    className={`btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'tenants' ? 'var(--primary)' : 'transparent' }}
                >
                    <UserPlus size={18} /> Tenants
                </button>
                <button
                    onClick={() => setActiveTab('vacancy')}
                    className={`btn ${activeTab === 'vacancy' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'vacancy' ? 'var(--primary)' : 'transparent' }}
                >
                    <LayoutGrid size={18} /> Vacancy
                </button>
                <button
                    onClick={() => setActiveTab('food')}
                    className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'food' ? 'var(--primary)' : 'transparent' }}
                >
                    <Utensils size={18} /> Food Menu
                </button>
                <button
                    onClick={() => setActiveTab('wifi')}
                    className={`btn ${activeTab === 'wifi' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'wifi' ? 'var(--primary)' : 'transparent' }}
                >
                    <Wifi size={18} /> WiFi
                </button>
                <button
                    onClick={() => setActiveTab('electricity')}
                    className={`btn ${activeTab === 'electricity' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'electricity' ? 'var(--primary)' : 'transparent' }}
                >
                    <Zap size={18} /> Electricity
                </button>
            </div>
        </>
    );
};

export default PgHeaderTabs;
