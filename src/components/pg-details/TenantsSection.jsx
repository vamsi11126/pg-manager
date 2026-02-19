import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const TenantsSection = ({
    pg,
    tenants,
    deleteTenant,
    createTenantLogin,
    setShowEditTenant,
    setEditTenant,
    setEditAadharError,
    setEditPhoneError
}) => {
    const { success, error: showError } = useToast();

    return (
        <div className="glass-card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-glass)' }}>
                <h3 style={{ margin: 0 }}>Active Tenants</h3>
            </div>
            <div className="table-scroll-container">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ textAlign: 'left', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-glass)' }}>
                        <th style={{ padding: '1.25rem' }}>Tenant Name</th>
                        <th style={{ padding: '1.25rem' }}>Room</th>
                        <th style={{ padding: '1.25rem' }}>Contact</th>
                        <th style={{ padding: '1.25rem' }}>Rent Details</th>
                        <th style={{ padding: '1.25rem' }}>Joining Date</th>
                        <th style={{ padding: '1.25rem' }}>Food</th>
                        <th style={{ padding: '1.25rem' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tenants.filter(t => t.pgId === pg.id).length === 0 ? (
                        <tr>
                            <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No tenants registered in this PG.
                            </td>
                        </tr>
                    ) : (
                        tenants.filter(t => t.pgId === pg.id)
                            .sort((a, b) => (parseInt(a.roomNumber) || 0) - (parseInt(b.roomNumber) || 0))
                            .map((tenant, idx, array) => {
                                const nextTenant = array[idx + 1];
                                const isDifferentRoom = nextTenant && nextTenant.roomNumber !== tenant.roomNumber;

                                return (
                                    <tr key={tenant.id} style={{ borderBottom: isDifferentRoom ? '2px solid var(--primary)' : '1px solid var(--border-glass)' }}>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ fontWeight: 600 }}>{tenant.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.profession}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 600 }}>Room: {tenant.roomNumber || 'N/A'}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ fontSize: '0.875rem' }}>{tenant.phone}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tenant.email}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--secondary)' }}>₹{tenant.rent}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adv: ₹{tenant.advance}</div>
                                        </td>
                                        <td style={{ padding: '1.25rem', fontSize: '0.875rem' }}>
                                            {(() => {
                                                const date = new Date(tenant.joiningDate);
                                                const day = String(date.getDate()).padStart(2, '0');
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const year = date.getFullYear();
                                                return `${day}/${month}/${year}`;
                                            })()}
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '0.25rem 0.5rem',
                                                background: tenant.withFood ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: tenant.withFood ? 'var(--success)' : 'var(--danger)',
                                                borderRadius: '4px'
                                            }}>
                                                {tenant.withFood ? 'With Food' : 'No Food'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.25rem' }}>
                                            <div className="tenant-actions-group">
                                            <button
                                                onClick={() => {
                                                    setShowEditTenant(tenant);
                                                    setEditTenant({ ...tenant, newPassword: '' });
                                                    setEditAadharError('');
                                                    setEditPhoneError('');
                                                }}
                                                className="btn btn-outline tooltip-target"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                                data-tooltip="Edit tenant details"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    deleteTenant(tenant.id);
                                                }}
                                                className="btn btn-outline tooltip-target"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                data-tooltip="Delete tenant"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await createTenantLogin(tenant.id);
                                                        success(`Login created and welcome email sent to ${tenant.name}.`);
                                                    } catch (err) {
                                                        showError(err.message || 'Could not create tenant login.');
                                                    }
                                                }}
                                                className="btn btn-outline tooltip-target"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                                                data-tooltip="Create login and send welcome email"
                                            >
                                                Create Login
                                            </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                    )}
                </tbody>
            </table>
            </div>
        </div>
    );
};

export default TenantsSection;
