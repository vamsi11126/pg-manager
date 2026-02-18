import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Save, X } from 'lucide-react';
import { useData } from '../../context/DataContext';

const HighlightsSection = ({ pg, updatePg }) => {
    const { authRole } = useData();
    const [facilityInput, setFacilityInput] = useState('');
    const [facilities, setFacilities] = useState(pg?.facilities || []);
    const [neighborhoodSnapshot, setNeighborhoodSnapshot] = useState(pg?.neighborhoodDetails || '');
    const [galleryPhotos, setGalleryPhotos] = useState(pg?.galleryPhotos || []);
    const [landingQr, setLandingQr] = useState(pg?.landingQr || '');
    const fileInputRef = useRef(null);

    useEffect(() => {
        setFacilities(pg?.facilities || []);
        setNeighborhoodSnapshot(pg?.neighborhoodDetails || '');
        setGalleryPhotos(pg?.galleryPhotos || []);
        setLandingQr(pg?.landingQr || '');
    }, [pg?.id]);

    const handleAddFacility = () => {
        const trimmed = facilityInput.trim();
        if (!trimmed) return;
        if (facilities.some(f => f.toLowerCase() === trimmed.toLowerCase())) {
            setFacilityInput('');
            return;
        }
        setFacilities(prev => [...prev, trimmed]);
        setFacilityInput('');
    };

    const handleRemoveFacility = (facility) => {
        setFacilities(prev => prev.filter(f => f !== facility));
    };

    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const handleGallerySelected = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const photoEntries = await Promise.all(
            files.map(async (file) => ({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                name: file.name,
                url: await readFileAsDataUrl(file)
            }))
        );

        setGalleryPhotos(prev => [...(prev || []), ...photoEntries]);
        e.target.value = '';
    };

    const removeGalleryPhoto = (photoId) => {
        setGalleryPhotos(prev => (prev || []).filter(p => p.id !== photoId));
    };

    const handleSave = () => {
        updatePg(
            {
                ...pg,
                facilities,
                neighborhoodDetails: neighborhoodSnapshot,
                galleryPhotos,
                landingQr
            },
            { successMessage: 'Highlights section updated successfully.' }
        );
    };

    const handleGenerateLandingQr = () => {
        if (landingQr) return;
        const landingUrl = `${window.location.origin}/pg/${pg.id}/landingpage`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(landingUrl)}`;
        setLandingQr(qrUrl);
        updatePg(
            {
                ...pg,
                landingQr: qrUrl
            },
            { successMessage: 'Landing page QR generated and saved.' }
        );
    };

    return (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Facilities</h3>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Laundry, Gym, Security"
                        value={facilityInput}
                        onChange={(e) => setFacilityInput(e.target.value)}
                        style={{ marginBottom: 0, flex: 1, minWidth: '220px' }}
                    />
                    <button onClick={handleAddFacility} className="btn btn-outline" type="button">
                        <Plus size={16} /> Add Facility
                    </button>
                </div>
                {facilities.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)' }}>No facilities added yet.</p>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        {facilities.map(facility => (
                            <span
                                key={facility}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '999px',
                                    background: 'rgba(99, 102, 241, 0.15)',
                                    color: 'var(--text-main)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {facility}
                                <button
                                    onClick={() => handleRemoveFacility(facility)}
                                    style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', display: 'flex' }}
                                    type="button"
                                >
                                    <X size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Neighborhood Snapshot</h3>
                <textarea
                    className="input-field"
                    style={{ minHeight: '120px', resize: 'vertical' }}
                    placeholder="Describe connectivity, nearby essentials, commute access, safety, and locality highlights."
                    value={neighborhoodSnapshot}
                    onChange={(e) => setNeighborhoodSnapshot(e.target.value)}
                />
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Gallery Photos</h3>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        border: '1px dashed var(--border-glass)',
                        borderRadius: '16px',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        alignItems: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <ImagePlus size={24} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click to upload photos</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleGallerySelected}
                    />
                </div>
                {galleryPhotos.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                        {galleryPhotos.map(photo => (
                            <div key={photo.id} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                                <img src={photo.url} alt={photo.name || 'Gallery'} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                                <button
                                    onClick={() => removeGalleryPhoto(photo.id)}
                                    type="button"
                                    style={{
                                        position: 'absolute',
                                        top: '8px',
                                        right: '8px',
                                        background: 'rgba(0,0,0,0.5)',
                                        border: 'none',
                                        color: 'white',
                                        borderRadius: '999px',
                                        padding: '0.25rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginTop: 0 }}>Landing Page QR</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Generate QR once for this PG landing page and share it with prospects.
                </p>
                {landingQr ? (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <img src={landingQr} alt="Landing page QR" style={{ width: '220px', maxWidth: '100%', borderRadius: '12px', border: '1px solid var(--border-glass)' }} />
                        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                            QR generated and stored. Regeneration is disabled.
                        </p>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleGenerateLandingQr}
                        disabled={authRole !== 'admin'}
                    >
                        Generate Landing QR
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary" onClick={handleSave} type="button">
                    <Save size={16} /> Save Highlights
                </button>
            </div>
        </div>
    );
};

export default HighlightsSection;
