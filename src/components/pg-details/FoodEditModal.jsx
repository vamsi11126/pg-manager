import React from 'react';
import { X } from 'lucide-react';

const FoodEditModal = ({
    showEditFood,
    setShowEditFood,
    foodAmountDraft,
    setFoodAmountDraft,
    foodMenu,
    handleUpdateFood,
    saveFoodMenu,
    handleNumberInput
}) => {
    if (!showEditFood) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '800px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>Edit Food Settings</h2>
                    <button onClick={() => setShowEditFood(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Food Amount per Person (₹)</label>
                    <input
                        type="number"
                        className="input-field"
                        style={{ maxWidth: '200px' }}
                        value={foodAmountDraft}
                        onChange={(e) => setFoodAmountDraft(e.target.value)}
                        placeholder="e.g. 3000"
                        onKeyDown={handleNumberInput}
                    />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Weekly Menu</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                                <th style={{ padding: '0.5rem' }}>Day</th>
                                <th style={{ padding: '0.5rem' }}>Breakfast</th>
                                <th style={{ padding: '0.5rem' }}>Lunch</th>
                                <th style={{ padding: '0.5rem' }}>Dinner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foodMenu.map((day, idx) => (
                                <tr key={day.day}>
                                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{day.day}</td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <input className="input-field" style={{ marginBottom: 0 }} value={day.breakfast} onChange={(e) => handleUpdateFood(idx, 'breakfast', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <input className="input-field" style={{ marginBottom: 0 }} value={day.lunch} onChange={(e) => handleUpdateFood(idx, 'lunch', e.target.value)} />
                                    </td>
                                    <td style={{ padding: '0.5rem' }}>
                                        <input className="input-field" style={{ marginBottom: 0 }} value={day.dinner} onChange={(e) => handleUpdateFood(idx, 'dinner', e.target.value)} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={() => setShowEditFood(false)} className="btn btn-outline">Cancel</button>
                    <button type="button" onClick={saveFoodMenu} className="btn btn-primary">Save Menu</button>
                </div>
            </div>
        </div>
    );
};

export default FoodEditModal;
