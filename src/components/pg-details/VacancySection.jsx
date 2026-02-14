import React from 'react';
import { AlertCircle } from 'lucide-react';

const VacancySection = ({ getVacantRooms }) => {
    const rooms = getVacantRooms();
    return (
        <div className="grid grid-cols-3">
            {rooms.length === 0 ? (
                <div className="glass-card" style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center' }}>
                    <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--text-muted)' }}>No rooms defined yet.</p>
                </div>
            ) : (
                rooms.map(room => (
                    <div
                        key={room.number}
                        className="glass-card tooltip-target"
                        style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            border: '1px solid var(--success)',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                        }}
                        data-tooltip={`Room ${room.number} has ${room.slotsLeft} of ${room.capacity} slots available`}
                    >
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Room no: {room.number}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{room.type}</div>
                        <div style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: 'var(--success)',
                            fontWeight: 600
                        }}>
                            {room.slotsLeft} {room.slotsLeft === 1 ? 'Slot' : 'Slots'} Available
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            Total Capacity: {room.capacity}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default VacancySection;
