import React from 'react';
import { X } from 'lucide-react';

const WifiModals = ({
    showAddWifi,
    setShowAddWifi,
    newWifi,
    setNewWifi,
    handleAddWifi,
    showEditWifi,
    setShowEditWifi,
    handleEditWifi,
    handleNumberInput
}) => {
    return (
        <>
            {showAddWifi && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Add WiFi Details</h2>
                            <button onClick={() => setShowAddWifi(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddWifi}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newWifi.floorName}
                                    onChange={(e) => setNewWifi({ ...newWifi, floorName: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newWifi.username}
                                    onChange={(e) => setNewWifi({ ...newWifi, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={newWifi.password}
                                    onChange={(e) => setNewWifi({ ...newWifi, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Amount (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="e.g. 500"
                                    min="0"
                                    onKeyDown={handleNumberInput}
                                    value={newWifi.amount}
                                    onChange={(e) => setNewWifi({ ...newWifi, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Due Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={newWifi.dueDate}
                                    onChange={(e) => setNewWifi({ ...newWifi, dueDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddWifi(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Details</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditWifi && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2>Edit WiFi Details</h2>
                            <button onClick={() => setShowEditWifi(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleEditWifi(showEditWifi);
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Name <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={showEditWifi.floorName}
                                    onChange={(e) => setShowEditWifi({ ...showEditWifi, floorName: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={showEditWifi.username}
                                    onChange={(e) => setShowEditWifi({ ...showEditWifi, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={showEditWifi.password}
                                    onChange={(e) => setShowEditWifi({ ...showEditWifi, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Amount (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="e.g. 500"
                                    min="0"
                                    onKeyDown={handleNumberInput}
                                    value={showEditWifi.amount}
                                    onChange={(e) => setShowEditWifi({ ...showEditWifi, amount: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Due Date <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={showEditWifi.dueDate}
                                    onChange={(e) => setShowEditWifi({ ...showEditWifi, dueDate: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEditWifi(null)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default WifiModals;
