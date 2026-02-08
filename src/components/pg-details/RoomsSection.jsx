import React from 'react';
import { Bed, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';

const RoomsSection = ({ pg, tenants, setShowAddRoom, setShowEditRoom, handleDeleteRoomCategory }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {pg.rooms?.length === 0 ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Bed size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3>No room categories yet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Start by adding a room category for this PG.</p>
                    <div style={{
                        marginTop: '1.5rem',
                        marginBottom: '1.5rem',
                        padding: '0.75rem 1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: 'var(--danger)',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <AlertCircle size={16} />
                        <span>Please add room categories before registering tenants</span>
                    </div>
                    <br />
                    <button onClick={() => setShowAddRoom(true)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                        <Plus size={20} /> Add Your First Category
                    </button>
                </div>
            ) : (
                Object.entries((pg.rooms || []).reduce((acc, room) => {
                    const floor = room.floorName || 'General';
                    if (!acc[floor]) acc[floor] = [];
                    acc[floor].push(room);
                    return acc;
                }, {})).sort(([a], [b]) => {
                    if (a === 'Ground Floor') return -1;
                    if (b === 'Ground Floor') return 1;
                    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                }).map(([floorName, floorRooms]) => (
                    <div key={floorName}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem',
                            padding: '0 0.5rem'
                        }}>
                            <h3 style={{ margin: 0, color: 'var(--primary)' }}>{floorName}</h3>
                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            {floorRooms.flatMap(category =>
                                category.roomNumbers?.map(num => {
                                    const roomTenants = tenants.filter(t => t.pgId === pg.id && t.roomNumber === num);
                                    const capacity = parseInt(category.type) || 1;
                                    const slotsLeft = capacity - roomTenants.length;

                                    return (
                                        <div key={num} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Room no: {num}</h3>
                                                    <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 600 }}>
                                                        {slotsLeft > 0 ? `(${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left)` : '(Full)'}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>₹{category.price}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{category.type}</div>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '0.25rem 0.5rem',
                                                    background: category.attachedBath ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: category.attachedBath ? 'var(--success)' : 'var(--text-muted)',
                                                    borderRadius: '4px'
                                                }}>
                                                    {category.attachedBath ? 'Attached Bath' : 'Non-attached Bath'}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem', padding: '0.25rem 0.5rem',
                                                    background: category.isAC ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: category.isAC ? 'var(--success)' : 'var(--text-muted)',
                                                    borderRadius: '4px'
                                                }}>
                                                    {category.isAC ? 'AC' : 'Non-AC'}
                                                </span>
                                                {category.withFood && <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', borderRadius: '4px' }}>With Food</span>}
                                            </div>

                                            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', gap: '-0.5rem' }}>
                                                    {roomTenants.map((t, i) => (
                                                        <div key={i} style={{
                                                            width: '24px', height: '24px', borderRadius: '50%',
                                                            border: '1px dashed var(--border-glass)',
                                                            background: 'red'
                                                        }} />
                                                    ))}
                                                    {Array.from({ length: slotsLeft }).map((_, i) => (
                                                        <div key={i} style={{
                                                            width: '24px', height: '24px', borderRadius: '50%',
                                                            border: '1px dashed var(--border-glass)',
                                                            background: 'green'
                                                        }} />
                                                    ))}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button onClick={() => setShowEditRoom(category)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDeleteRoomCategory(category.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--danger)' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default RoomsSection;
