import React from 'react';
import { X } from 'lucide-react';

const PgEditModal = ({ showEditPg, setShowEditPg, editPgData, setEditPgData, handleEditPg }) => {
    if (!showEditPg) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2>Edit PG Details</h2>
                    <button onClick={() => setShowEditPg(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleEditPg}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>PG Name</label>
                        <input
                            type="text"
                            className="input-field"
                            value={editPgData.name}
                            onChange={(e) => setEditPgData({ ...editPgData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Address</label>
                        <textarea
                            className="input-field"
                            style={{ height: '100px', resize: 'none' }}
                            value={editPgData.address}
                            onChange={(e) => setEditPgData({ ...editPgData, address: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowEditPg(false)} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PgEditModal;
