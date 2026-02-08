import React from 'react';
import { X } from 'lucide-react';

export const EditTenantModal = ({
    showEditTenant,
    editTenant,
    setShowEditTenant,
    setEditTenant,
    editPhoneError,
    editAadharError,
    setEditPhoneError,
    setEditAadharError,
    handleEditTenantSubmit,
    getRoomsForEditTenant,
    handleNumberInput
}) => {
    if (!showEditTenant || !editTenant) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2>Edit Tenant</h2>
                    <button onClick={() => { setShowEditTenant(null); setEditTenant(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleEditTenantSubmit}>
                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={editTenant.name}
                                onChange={(e) => setEditTenant({ ...editTenant, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number *</label>
                            <input
                                type="tel"
                                className="input-field"
                                value={editTenant.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setEditTenant({ ...editTenant, phone: val });
                                    if (val.length === 10) setEditPhoneError('');
                                }}
                                required
                            />
                            {editPhoneError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{editPhoneError}</p>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email *</label>
                            <input
                                type="email"
                                className="input-field"
                                value={editTenant.email}
                                onChange={(e) => setEditTenant({ ...editTenant, email: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Profession *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={editTenant.profession || ''}
                                onChange={(e) => setEditTenant({ ...editTenant, profession: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Aadhar Number *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={editTenant.aadhar}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                    setEditTenant({ ...editTenant, aadhar: val });
                                    if (val.length === 12) setEditAadharError('');
                                }}
                                required
                            />
                            {editAadharError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{editAadharError}</p>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Number *</label>
                            <select
                                className="input-field"
                                value={editTenant.roomNumber}
                                onChange={(e) => setEditTenant({ ...editTenant, roomNumber: e.target.value })}
                                required
                            >
                                <option value="">Select Room</option>
                                {getRoomsForEditTenant(editTenant.roomNumber).map(room => (
                                    <option key={room.number} value={room.number}>
                                        Room {room.number}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Rent (₹)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={editTenant.rent}
                                onChange={(e) => setEditTenant({ ...editTenant, rent: e.target.value })}
                                onKeyDown={handleNumberInput}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Advance Amount (₹)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={editTenant.advance}
                                onChange={(e) => setEditTenant({ ...editTenant, advance: e.target.value })}
                                onKeyDown={handleNumberInput}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Joining Date *</label>
                            <input
                                type="date"
                                className="input-field"
                                value={editTenant.joiningDate}
                                onChange={(e) => setEditTenant({ ...editTenant, joiningDate: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={editTenant.withFood}
                                    onChange={(e) => setEditTenant({ ...editTenant, withFood: e.target.checked })}
                                /> Include Food
                            </label>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>New Password (optional)</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Leave blank to keep current password"
                                value={editTenant.newPassword || ''}
                                onChange={(e) => setEditTenant({ ...editTenant, newPassword: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                        <button type="button" onClick={() => { setShowEditTenant(null); setEditTenant(null); }} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AddTenantModal = ({
    showAddTenant,
    setShowAddTenant,
    newTenant,
    setNewTenant,
    phoneError,
    aadharError,
    setPhoneError,
    setAadharError,
    handleAddTenant,
    getVacantRoomsForTenant,
    handleNumberInput
}) => {
    if (!showAddTenant) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem'
        }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: '600px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h2>Register New Tenant</h2>
                    <button onClick={() => setShowAddTenant(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleAddTenant}>
                    <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newTenant.name}
                                onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                                required
                                placeholder="Tenant Name"
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Phone Number *</label>
                            <input
                                type="tel"
                                className="input-field"
                                value={newTenant.phone}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setNewTenant({ ...newTenant, phone: val });
                                    if (val.length === 10) setPhoneError('');
                                }}
                                required
                                placeholder="9876543210"
                            />
                            {phoneError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{phoneError}</p>}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Email *</label>
                            <input
                                type="email"
                                className="input-field"
                                value={newTenant.email}
                                onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                                placeholder="tenant@example.com"
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Profession *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newTenant.profession}
                                onChange={(e) => setNewTenant({ ...newTenant, profession: e.target.value })}
                                required
                                placeholder="Student/Employee"
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Aadhar Number *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={newTenant.aadhar}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                                    setNewTenant({ ...newTenant, aadhar: val });
                                    if (val.length === 12) setAadharError('');
                                }}
                                required
                                placeholder="12 digit number"
                            />
                            {aadharError && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{aadharError}</p>}
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Number *</label>
                            <select
                                className="input-field"
                                value={newTenant.roomNumber}
                                onChange={(e) => {
                                    const room = getVacantRoomsForTenant().find(r => r.number === e.target.value);
                                    if (room) {
                                        setNewTenant({
                                            ...newTenant,
                                            roomNumber: e.target.value,
                                            rent: room.category.price,
                                            advance: room.category.price * 2
                                        });
                                    }
                                }}
                                required
                            >
                                <option value="">Select Room</option>
                                {getVacantRoomsForTenant().map(room => (
                                    <option key={room.number} value={room.number}>
                                        Room {room.number} ({room.category.floorName} - {room.type})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Rent (₹)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={newTenant.rent}
                                onChange={(e) => setNewTenant({ ...newTenant, rent: e.target.value })}
                                onKeyDown={handleNumberInput}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Advance Amount (₹)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={newTenant.advance}
                                onChange={(e) => setNewTenant({ ...newTenant, advance: e.target.value })}
                                onKeyDown={handleNumberInput}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Joining Date *</label>
                            <input
                                type="date"
                                className="input-field"
                                value={newTenant.joiningDate}
                                onChange={(e) => setNewTenant({ ...newTenant, joiningDate: e.target.value })}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                            <input
                                type="checkbox"
                                id="withFood"
                                checked={newTenant.withFood}
                                onChange={(e) => setNewTenant({ ...newTenant, withFood: e.target.checked })}
                                style={{ accentColor: 'var(--primary)', width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }}
                            />
                            <label htmlFor="withFood">Opt for Food Facility?</label>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button type="button" onClick={() => setShowAddTenant(false)} className="btn btn-outline">Cancel</button>
                        <button type="submit" className="btn btn-primary">Register Tenant</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

