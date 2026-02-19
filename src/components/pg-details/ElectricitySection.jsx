import React from 'react';
import { AlertCircle, Clock, Zap } from 'lucide-react';

const ElectricitySection = ({
    pg,
    tenants,
    eBillRate,
    setEBillRate,
    handleUpdateEBillRate,
    readings,
    setReadings,
    handleInitializeMeter,
    handleGenerateBill,
    getSequentialFloors
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card electricity-settings-row" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Zap size={20} color="#f59e0b" /> Electricity Settings
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                        Configure billing rate and manage meter readings
                    </p>
                </div>
                <div className="electricity-rate-controls" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Rate per Unit (₹):</label>
                    <input
                        type="number"
                        className="input-field tooltip-target"
                        style={{ width: '80px', margin: 0 }}
                        value={eBillRate}
                        onChange={(e) => setEBillRate(e.target.value)}
                        onBlur={handleUpdateEBillRate}
                        data-tooltip="Set electricity cost per unit. Updates when you leave this field."
                    />
                </div>
            </div>

            {(!pg.rooms || pg.rooms.length === 0) ? (
                <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                    <Zap size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3>No Rooms Added</h3>
                    <p style={{ color: 'var(--text-muted)' }}>There are no rooms to manage electricity bills for. Please add rooms in the "Rooms" tab first.</p>
                </div>
            ) : (
                <div className="electricity-cards-grid" style={{ display: 'grid', gap: '1.5rem' }}>
                    {getSequentialFloors().map(floor => {
                        const floorRooms = [];
                        pg.rooms?.forEach(cat => {
                            if (cat.floorName === floor && cat.roomNumbers) {
                                cat.roomNumbers.forEach(num => {
                                    floorRooms.push({ number: num, category: cat.type });
                                });
                            }
                        });

                        if (floorRooms.length === 0) return null;

                        return floorRooms.map(room => {
                            const roomNum = room.number;
                            const roomData = pg.electricityData?.[roomNum];
                            const isInitialized = roomData?.previousReading !== undefined;
                            const currentInput = readings[roomNum]?.current || '';
                            const error = readings[roomNum]?.error;
                            const initialInput = readings[roomNum]?.initial || '';

                            return (
                                <div key={roomNum} className="glass-card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Room {roomNum}</h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{floor} • {room.category}</span>
                                        </div>
                                        {isInitialized && (
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prev Reading</div>
                                                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>{roomData.previousReading} kWh</div>
                                            </div>
                                        )}
                                    </div>

                                    {!isInitialized ? (
                                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px dashed rgba(245, 158, 11, 0.3)' }}>
                                            <p style={{ fontSize: '0.875rem', color: '#f59e0b', marginTop: 0, marginBottom: '0.75rem' }}>
                                                <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />
                                                Initial Setup Required
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    placeholder="Initial Reading"
                                                    value={initialInput}
                                                    onChange={(e) => setReadings(prev => ({ ...prev, [roomNum]: { ...prev[roomNum], initial: e.target.value } }))}
                                                    style={{ marginBottom: 0 }}
                                                />
                                                <button
                                                    className="btn btn-primary tooltip-target"
                                                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                    onClick={() => handleInitializeMeter(roomNum, initialInput)}
                                                    data-tooltip="Save initial meter reading for this room"
                                                >
                                                    Initialize
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Current Month Reading</label>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <input
                                                        type="number"
                                                        className="input-field"
                                                        placeholder="Enter Reading"
                                                        value={currentInput}
                                                        onChange={(e) => setReadings(prev => ({ ...prev, [roomNum]: { ...prev[roomNum], current: e.target.value, error: '' } }))}
                                                        style={{ marginBottom: 0 }}
                                                    />
                                                    <button
                                                        className="btn btn-primary tooltip-target"
                                                        disabled={!currentInput}
                                                        onClick={() => handleGenerateBill(roomNum)}
                                                        data-tooltip="Generate this month's electricity bill using current reading"
                                                    >
                                                        Generate Bill
                                                    </button>
                                                </div>
                                                {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</p>}
                                            </div>

                                            {currentInput && parseFloat(currentInput) >= roomData.previousReading && (
                                                <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Units Consumed:</span>
                                                        <span>{(parseFloat(currentInput) - roomData.previousReading).toFixed(2)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Total Bill Amount:</span>
                                                        <span style={{ color: 'var(--secondary)' }}>₹{((parseFloat(currentInput) - roomData.previousReading) * eBillRate).toFixed(2)}</span>
                                                    </div>

                                                    {(() => {
                                                        const roomTenantsCount = tenants.filter(t => t.pgId === pg.id && t.roomNumber === roomNum).length;
                                                        if (roomTenantsCount > 0) {
                                                            const totalBill = (parseFloat(currentInput) - roomData.previousReading) * eBillRate;
                                                            const splitAmount = totalBill / roomTenantsCount;
                                                            return (
                                                                <div style={{
                                                                    borderTop: '1px dashed var(--border-glass)',
                                                                    paddingTop: '0.5rem',
                                                                    marginTop: '0.5rem',
                                                                    fontSize: '0.8rem'
                                                                }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                                                        <span>Active Tenants:</span>
                                                                        <span>{roomTenantsCount}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500, color: 'var(--primary)', marginTop: '0.25rem' }}>
                                                                        <span>Per Tenant:</span>
                                                                        <span>₹{splitAmount.toFixed(0)}</span>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return (
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem', textAlign: 'right' }}>
                                                                No tenants in this room
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {roomData.history && roomData.history.length > 0 && (
                                                <div style={{ marginTop: '1rem' }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Clock size={12} /> Recent History
                                                    </div>
                                                    {roomData.history.slice(0, 3).map((bill, idx) => (
                                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.25rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                                                            <div>
                                                                <div style={{ color: 'var(--text-muted)' }}>{new Date(bill.date).toLocaleDateString()}</div>
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', opacity: 0.8 }}>@{bill.rate || eBillRate}/unit</div>
                                                            </div>
                                                            <span>{bill.units.toFixed(1)} u</span>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{ color: 'var(--secondary)', fontWeight: 500 }}>₹{bill.amount.toFixed(0)}</div>
                                                                {bill.splitAmount > 0 && (
                                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                                        (₹{bill.splitAmount.toFixed(0)} / person)
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        });
                    })}
                </div>
            )}
        </div>
    );
};

export default ElectricitySection;
