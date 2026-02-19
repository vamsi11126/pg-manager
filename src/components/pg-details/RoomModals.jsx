import React from 'react';
import { Camera, X } from 'lucide-react';

const RoomModals = ({
    showAddRoom,
    setShowAddRoom,
    newRoom,
    setNewRoom,
    handleAddRoom,
    getSequentialFloors,
    generateNextFloorName,
    handleNumberInput,
    roomPhotosInputRef,
    handleRoomPhotosSelected,
    removeRoomPhoto,
    showEditRoom,
    setShowEditRoom,
    pg,
    tenants,
    deleteTenant,
    updatePg,
    handleEditRoomPhotosSelected,
    removeEditRoomPhoto
}) => {
    return (
        <>
            {showAddRoom && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card responsive-modal-card" style={{ maxWidth: '500px', padding: '2rem 1.5rem 2rem 2rem', maxHeight: '85vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0 }}>New Room Category</h2>
                            <button onClick={() => setShowAddRoom(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddRoom}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Sharing Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <select
                                    className="input-field"
                                    value={newRoom.type}
                                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                                >
                                    <option>1 sharing</option>
                                    <option>2 sharing</option>
                                    <option>3 sharing</option>
                                    <option>4 sharing</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Price (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="number"
                                    className="input-field"
                                    placeholder="e.g. 8000"
                                    min="1"
                                    onKeyDown={handleNumberInput}
                                    value={newRoom.price}
                                    onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Level <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <select
                                    className="input-field"
                                    value={newRoom.floorName}
                                    onChange={(e) => {
                                        if (e.target.value === 'ADD_NEW') {
                                            setNewRoom({ ...newRoom, floorName: generateNextFloorName(newRoom.floorName) });
                                        } else {
                                            setNewRoom({ ...newRoom, floorName: e.target.value });
                                        }
                                    }}
                                    required
                                >
                                    {getSequentialFloors(newRoom.floorName).map(floor => (
                                        <option key={floor} value={floor}>{floor}</option>
                                    ))}
                                    {(() => {
                                        const floors = getSequentialFloors(newRoom.floorName);
                                        const maxNum = parseInt(floors[floors.length - 1]?.match(/\d+/)?.[0] || 0);
                                        return maxNum < 5 && (
                                            <option value="ADD_NEW" style={{ fontWeight: '600', color: 'var(--primary)' }}>+ Add New Floor</option>
                                        );
                                    })()}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Numbers (comma separated) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. 101, 102, 103"
                                    value={newRoom.roomNumbers}
                                    onChange={(e) => setNewRoom({ ...newRoom, roomNumbers: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={newRoom.attachedBath}
                                        onChange={(e) => setNewRoom({ ...newRoom, attachedBath: e.target.checked })}
                                    /> Attached Bath
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={newRoom.isAC}
                                        onChange={(e) => setNewRoom({ ...newRoom, isAC: e.target.checked })}
                                    /> AC Room
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={newRoom.withFood}
                                        onChange={(e) => setNewRoom({ ...newRoom, withFood: e.target.checked })}
                                    /> Include Food
                                </label>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Photos</label>
                                <div style={{
                                    border: '2px dashed var(--border-glass)',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => roomPhotosInputRef.current?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            roomPhotosInputRef.current?.click();
                                        }
                                    }}
                                >
                                    <Camera size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to upload photos</p>
                                    <input
                                        ref={roomPhotosInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={handleRoomPhotosSelected}
                                    />
                                </div>
                                {(newRoom.photos?.length > 0) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                                        {newRoom.photos.map(photo => (
                                            <div key={photo.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                                <img
                                                    src={photo.url}
                                                    alt={photo.name || 'Room photo'}
                                                    style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeRoomPhoto(photo.id)}
                                                    className="btn btn-outline"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '6px',
                                                        right: '6px',
                                                        padding: '0.2rem 0.35rem',
                                                        fontSize: '0.7rem',
                                                        lineHeight: 1,
                                                        background: 'rgba(0,0,0,0.6)',
                                                        color: '#fff',
                                                        borderColor: 'transparent'
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddRoom(false)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Category</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditRoom && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card responsive-modal-card" style={{ maxWidth: '500px', padding: '2rem 1.5rem 2rem 2rem', maxHeight: '85vh' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2>Edit Room Category</h2>
                            <button onClick={() => setShowEditRoom(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const newRooms = showEditRoom.roomNumbersString?.split(',').map(n => n.trim()).filter(n => n) || showEditRoom.roomNumbers;

                            const oldRooms = pg.rooms.find(r => r.id === showEditRoom.id)?.roomNumbers || [];
                            const removedRooms = oldRooms.filter(r => !newRooms.includes(r));

                            if (removedRooms.length > 0) {
                                removedRooms.forEach(roomNum => {
                                    const tenantsInRoom = tenants.filter(t => t.pgId === pg.id && t.roomNumber === roomNum);
                                    tenantsInRoom.forEach(t => deleteTenant(t.id));
                                });
                            }

                            const updatedPg = {
                                ...pg,
                                rooms: pg.rooms.map(r => r.id === showEditRoom.id ? { ...showEditRoom, roomNumbers: newRooms } : r)
                            };
                            updatePg(updatedPg, {
                                successMessage: removedRooms.length > 0
                                    ? `Room category updated. Rooms removed: ${removedRooms.join(', ')}.`
                                    : 'Room category updated successfully.'
                            });
                            setShowEditRoom(null);
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Sharing Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <select
                                    className="input-field"
                                    value={showEditRoom.type}
                                    onChange={(e) => setShowEditRoom({ ...showEditRoom, type: e.target.value })}
                                >
                                    <option>1 sharing</option>
                                    <option>2 sharing</option>
                                    <option>3 sharing</option>
                                    <option>4 sharing</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Price (₹) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="number"
                                    className="input-field"
                                    min="1"
                                    onKeyDown={handleNumberInput}
                                    value={showEditRoom.price}
                                    onChange={(e) => setShowEditRoom({ ...showEditRoom, price: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Level <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <select
                                    className="input-field"
                                    value={showEditRoom.floorName || ''}
                                    onChange={(e) => {
                                        if (e.target.value === 'ADD_NEW') {
                                            setShowEditRoom({ ...showEditRoom, floorName: generateNextFloorName(showEditRoom.floorName) });
                                        } else {
                                            setShowEditRoom({ ...showEditRoom, floorName: e.target.value });
                                        }
                                    }}
                                    required
                                >
                                    {getSequentialFloors(showEditRoom.floorName).map(floor => (
                                        <option key={floor} value={floor}>{floor}</option>
                                    ))}
                                    {(() => {
                                        const floors = getSequentialFloors(showEditRoom.floorName);
                                        const maxNum = parseInt(floors[floors.length - 1]?.match(/\d+/)?.[0] || 0);
                                        return maxNum < 5 && (
                                            <option value="ADD_NEW" style={{ fontWeight: '600', color: 'var(--primary)' }}>+ Add New Floor</option>
                                        );
                                    })()}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Numbers (comma separated) <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={showEditRoom.roomNumbersString !== undefined ? showEditRoom.roomNumbersString : showEditRoom.roomNumbers?.join(', ')}
                                    onChange={(e) => setShowEditRoom({ ...showEditRoom, roomNumbersString: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showEditRoom.attachedBath}
                                        onChange={(e) => setShowEditRoom({ ...showEditRoom, attachedBath: e.target.checked })}
                                    /> Attached Bath
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showEditRoom.isAC}
                                        onChange={(e) => setShowEditRoom({ ...showEditRoom, isAC: e.target.checked })}
                                    /> AC Room
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={showEditRoom.withFood}
                                        onChange={(e) => setShowEditRoom({ ...showEditRoom, withFood: e.target.checked })}
                                    /> Include Food
                                </label>
                            </div>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Photos</label>
                                <div style={{
                                    border: '2px dashed var(--border-glass)',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                }}
                                    onClick={() => document.getElementById('edit-room-photos-input')?.click()}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            document.getElementById('edit-room-photos-input')?.click();
                                        }
                                    }}
                                >
                                    <Camera size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Click to upload photos</p>
                                    <input
                                        id="edit-room-photos-input"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        style={{ display: 'none' }}
                                        onChange={handleEditRoomPhotosSelected}
                                    />
                                </div>
                                {(showEditRoom.photos?.length > 0) && (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                                        {showEditRoom.photos.map(photo => (
                                            <div key={photo.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                                <img
                                                    src={photo.url}
                                                    alt={photo.name || 'Room photo'}
                                                    style={{ width: '100%', height: '80px', objectFit: 'cover', display: 'block' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeEditRoomPhoto(photo.id)}
                                                    className="btn btn-outline"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '6px',
                                                        right: '6px',
                                                        padding: '0.2rem 0.35rem',
                                                        fontSize: '0.7rem',
                                                        lineHeight: 1,
                                                        background: 'rgba(0,0,0,0.6)',
                                                        color: '#fff',
                                                        borderColor: 'transparent'
                                                    }}
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowEditRoom(null)} className="btn btn-outline">Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default RoomModals;
