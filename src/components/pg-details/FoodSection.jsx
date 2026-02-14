import React from 'react';
import { Edit2, Utensils } from 'lucide-react';

const FoodSection = ({ pg, setShowEditFood }) => {
    return (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        padding: '0.5rem',
                        background: 'rgba(236, 72, 153, 0.1)',
                        color: '#ec4899',
                        borderRadius: '12px',
                        display: 'flex'
                    }}>
                        <Utensils size={20} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Weekly Food Menu</h3>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '12px',
                        border: '1px solid var(--border-glass)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }} className="tooltip-target" data-tooltip="Current monthly food charge per tenant">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monthly Cost:</span>
                        <span style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '1.1rem' }}>₹{pg.foodAmount || 0}</span>
                    </div>
                    <button onClick={() => setShowEditFood(true)} className="btn btn-primary tooltip-target" style={{ fontSize: '0.875rem' }} data-tooltip="Edit weekly menu and monthly food amount">
                        <Edit2 size={16} /> Edit Menu
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                            <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day</th>
                            <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breakfast</th>
                            <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lunch</th>
                            <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dinner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(pg.foodMenu || []).map((day, idx) => (
                            <tr key={`${day.day}-${idx}`} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                <td style={{ padding: '1.25rem', fontWeight: 600 }}>{day.day}</td>
                                <td style={{ padding: '1.25rem' }}>{day.breakfast}</td>
                                <td style={{ padding: '1.25rem' }}>{day.lunch}</td>
                                <td style={{ padding: '1.25rem' }}>{day.dinner}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FoodSection;
