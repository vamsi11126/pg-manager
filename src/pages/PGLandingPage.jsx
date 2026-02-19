import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Phone, Mail, BedDouble, Sparkles, Utensils, Wifi, Snowflake, Bath } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useData } from '../context/DataContext';
import './PGLandingPage.css';

const defaultFoodMenu = [
    { day: 'Sunday', breakfast: 'Special Breakfast', lunch: 'Veg/Non-Veg Meal', dinner: 'Light Dinner' },
    { day: 'Monday', breakfast: 'Idli, Sambhar', lunch: 'Rice, Dal, Veg Fry', dinner: 'Roti, Mixed Veg' },
    { day: 'Tuesday', breakfast: 'Puri, Curry', lunch: 'Rice, Sambar, Curd', dinner: 'Veg Biryani' },
    { day: 'Wednesday', breakfast: 'Dosa, Chutney', lunch: 'Rice, Dal, Egg Curry', dinner: 'Roti, Paneer' },
    { day: 'Thursday', breakfast: 'Pongal, Chutney', lunch: 'Rice, Veg Mandi', dinner: 'Roti, Dal Tadka' },
    { day: 'Friday', breakfast: 'Upma, Chutney', lunch: 'Rice, Sambar, Fry', dinner: 'Roti, Veg Kadai' },
    { day: 'Saturday', breakfast: 'Pancakes/Aloo Paratha', lunch: 'Veg Pulav', dinner: 'Special Dinner/Roti' }
];

const normalizePg = (dbPg) => ({
    id: dbPg.id,
    adminId: dbPg.admin_id,
    name: dbPg.name,
    address: dbPg.address,
    rooms: dbPg.rooms ?? [],
    foodMenu: dbPg.food_menu ?? [],
    wifiDetails: dbPg.wifi_details ?? [],
    electricityData: dbPg.electricity_data ?? {},
    eBillRate: dbPg.e_bill_rate ?? 10,
    foodAmount: dbPg.food_amount ?? 0,
    mapLink: dbPg.map_link ?? '',
    landingQr: dbPg.landing_qr ?? '',
    brochureUrl: dbPg.brochure_url ?? '',
    brochureName: dbPg.brochure_name ?? '',
    facilities: dbPg.facilities ?? [],
    neighborhoodDetails: dbPg.neighborhood_details ?? '',
    galleryPhotos: dbPg.gallery_photos ?? []
});

const getApiBaseUrl = () => {
    const explicitBase = import.meta.env.VITE_API_BASE_URL;
    if (explicitBase) return explicitBase.replace(/\/$/, '');

    const explicitEmailApi = import.meta.env.VITE_EMAIL_API_URL;
    if (explicitEmailApi) {
        return explicitEmailApi.replace('/send-tenant-email', '').replace(/\/$/, '');
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }

    return '';
};

const PGLandingPage = () => {
    const { id } = useParams();
    const { pgs, tenants, user } = useData();
    const [pg, setPg] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showVisitForm, setShowVisitForm] = useState(false);
    const [visitForm, setVisitForm] = useState({ name: '', email: '', phone: '' });
    const [visitStatus, setVisitStatus] = useState({ loading: false, message: '', isError: false });

    useEffect(() => {
        let mounted = true;

        const load = async () => {
            setLoading(true);
            setError('');

            let currentPg = pgs.find((p) => p.id === id) || null;

            if (!currentPg) {
                const { data, error: pgError } = await supabase
                    .from('pgs')
                    .select('*')
                    .eq('id', id)
                    .maybeSingle();
                if (pgError) {
                    setError('Unable to load PG details.');
                } else if (data) {
                    currentPg = normalizePg(data);
                }
            }

            if (!mounted) return;
            setPg(currentPg);

            if (currentPg?.adminId) {
                if (user?.id === currentPg.adminId) {
                    setAdmin({
                        name: user.full_name || user.name || 'PG Admin',
                        email: user.email || '',
                        phone: user.phone || ''
                    });
                } else {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('full_name,email,phone')
                        .eq('id', currentPg.adminId)
                        .maybeSingle();
                    if (profile) {
                        setAdmin({
                            name: profile.full_name || 'PG Admin',
                            email: profile.email || '',
                            phone: profile.phone || ''
                        });
                    } else {
                        setAdmin({ name: 'PG Admin', email: '', phone: '' });
                    }
                }
            }

            setLoading(false);
        };

        load();
        return () => {
            mounted = false;
        };
    }, [id, pgs, user?.id]);

    const { vacancyRows, totalSlots, vacantSlots } = useMemo(() => {
        if (!pg) return { vacancyRows: [], totalSlots: 0, vacantSlots: 0 };
        const rows = [];
        let slots = 0;
        let vacant = 0;
        pg.rooms?.forEach((cat) => {
            const capacity = parseInt(cat.type, 10) || 1;
            (cat.roomNumbers || []).forEach((num) => {
                const occupied = tenants.filter((t) => t.pgId === pg.id && t.roomNumber === num).length;
                const available = Math.max(capacity - occupied, 0);
                slots += capacity;
                vacant += available;
                rows.push({
                    number: num,
                    type: cat.type,
                    available,
                    capacity
                });
            });
        });
        rows.sort((a, b) => b.available - a.available);
        return { vacancyRows: rows, totalSlots: slots, vacantSlots: vacant };
    }, [pg, tenants]);

    const facilities = useMemo(() => {
        if (!pg) return [];
        if (Array.isArray(pg.facilities) && pg.facilities.length > 0) {
            return pg.facilities.map((item) => ({
                label: item,
                icon: Sparkles,
                active: true,
                desc: 'Premium amenity available on-site.'
            }));
        }

        const hasWifi = (pg.wifiDetails || []).length > 0;
        const hasFood = (pg.foodMenu || []).length > 0 || (pg.foodAmount || 0) > 0;
        const hasAttachedBath = (pg.rooms || []).some((r) => r.attachedBath);
        const hasAC = (pg.rooms || []).some((r) => r.isAC);

        return [
            { label: 'Hygienic Food', icon: Utensils, active: hasFood, desc: 'Daily cooked meals with flexible plan.' },
            { label: 'High-Speed Wi-Fi', icon: Wifi, active: hasWifi, desc: 'Dedicated Wi-Fi for every floor.' },
            { label: 'AC Rooms', icon: Snowflake, active: hasAC, desc: 'Cool comfort for premium rooms.' },
            { label: 'Attached Bath', icon: Bath, active: hasAttachedBath, desc: 'Private bathrooms in select rooms.' }
        ];
    }, [pg]);

    const menu = pg?.foodMenu?.length > 0 ? pg.foodMenu : defaultFoodMenu;
    const gallery = Array.isArray(pg?.galleryPhotos) ? pg.galleryPhotos.slice(0, 5) : [];

    const handleVisitSubmit = async (e) => {
        e.preventDefault();
        if (!pg?.id) return;

        const payload = {
            pgId: pg.id,
            name: visitForm.name.trim(),
            email: visitForm.email.trim().toLowerCase(),
            phone: visitForm.phone.trim()
        };

        if (!payload.name || !payload.email || !payload.phone) {
            setVisitStatus({ loading: false, message: 'All fields are required.', isError: true });
            return;
        }
        if (!/\S+@\S+\.\S+/.test(payload.email)) {
            setVisitStatus({ loading: false, message: 'Enter a valid email address.', isError: true });
            return;
        }
        if (!/^\d{10}$/.test(payload.phone.replace(/\D/g, ''))) {
            setVisitStatus({ loading: false, message: 'Phone number must be exactly 10 digits.', isError: true });
            return;
        }

        setVisitStatus({ loading: true, message: '', isError: false });
        try {
            const res = await fetch(`${getApiBaseUrl()}/visit-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setVisitStatus({ loading: false, message: data?.error || 'Failed to submit request.', isError: true });
                return;
            }
            setVisitStatus({ loading: false, message: 'Visit request sent successfully. Admin will contact you soon.', isError: false });
            setVisitForm({ name: '', email: '', phone: '' });
        } catch {
            setVisitStatus({ loading: false, message: 'Could not submit request. Please try again.', isError: true });
        }
    };

    if (loading) {
        return (
            <div className="pg-landing">
                <div className="lp-shell">
                    <div className="lp-card page-loader page-loader-card">
                        <div className="app-loader" aria-hidden="true" />
                        <p>Loading landing page...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!pg) {
        return (
            <div className="pg-landing">
                <div className="lp-shell">
                    <div className="lp-card">
                        <h2>PG not found</h2>
                        <p>{error || 'Please check the link or contact the owner.'}</p>
                        {user && (
                            <div style={{ marginTop: '1rem' }}>
                                <Link to="/" className="lp-btn lp-btn-ghost">Back to Dashboard</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pg-landing">
            <div className="lp-shell">
                <section className="lp-hero">
                    <div className="lp-hero-card">
                        <span className="lp-hero-tag"><Sparkles size={16} /> Curated PG Experience</span>
                        <h1 className="lp-hero-title">{pg.name}</h1>
                        <p className="lp-hero-subtitle">
                            A thoughtfully designed stay with comfortable rooms, homely food, and the essentials that matter.
                            Everything you need, right where you want to be.
                        </p>
                        <div className="lp-hero-actions">
                            <button className="lp-btn lp-btn-primary" onClick={() => setShowVisitForm(true)}>Book a Visit</button>
                            {pg.brochureUrl ? (
                                <a className="lp-btn lp-btn-ghost" href={pg.brochureUrl} download={pg.brochureName || `${pg.name}-brochure.pdf`}>
                                    Download Brochure
                                </a>
                            ) : (
                                <button className="lp-btn lp-btn-ghost" disabled style={{ opacity: 0.65, cursor: 'not-allowed' }}>
                                    Brochure Coming Soon
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="lp-hero-visual">
                        <h3 style={{ marginBottom: '1.25rem' }}>Availability Snapshot</h3>
                        <div className="lp-hero-metrics">
                            <div className="lp-metric">
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Total Slots</span>
                                <strong style={{ fontSize: '1.6rem' }}>{totalSlots || '-'}</strong>
                            </div>
                            <div className="lp-metric">
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Vacant Slots</span>
                                <strong style={{ fontSize: '1.6rem' }}>{vacantSlots}</strong>
                            </div>
                            <div className="lp-metric">
                                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>Food Plan</span>
                                <strong style={{ fontSize: '1.2rem' }}>{pg.foodAmount ? `Rs.${pg.foodAmount}/month` : 'On request'}</strong>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="lp-section">
                    <h2 className="lp-section-title">Vacant Rooms</h2>
                    <div className="lp-scroll">
                        {vacancyRows.length === 0 ? (
                            <div className="lp-card lp-scroll-card">
                                <h3>Availability to be confirmed</h3>
                                <p>Contact us for the latest vacancy details.</p>
                            </div>
                        ) : (
                            vacancyRows.slice(0, 10).map((room) => (
                                <div className="lp-card lp-scroll-card" key={room.number}>
                                    <span className="lp-badge">{room.available > 0 ? `${room.available} Slots Left` : 'Waitlist'}</span>
                                    <h3 style={{ marginTop: '0.75rem' }}>Room {room.number}</h3>
                                    <p style={{ color: 'var(--lp-ink-muted)' }}>{room.type} - Capacity {room.capacity}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                                        <BedDouble size={16} /> <span>{room.available > 0 ? 'Ready to move' : 'Fully occupied'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="lp-section">
                    <h2 className="lp-section-title">Gallery</h2>
                    <div className="lp-scroll">
                        {gallery.length === 0 ? (
                            <div className="lp-card lp-scroll-card">
                                <h3>Gallery coming soon</h3>
                                <p>Photos will be updated by the PG owner.</p>
                            </div>
                        ) : (
                            gallery.map((photo) => (
                                <div className="lp-card lp-scroll-card lp-image-card" key={photo.id || photo.url}>
                                    <img src={photo.url} alt={photo.name || 'PG gallery'} />
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="lp-section">
                    <h2 className="lp-section-title">Facilities</h2>
                    <div className="lp-grid">
                        {facilities.map((item) => (
                            <div className="lp-card" key={item.label}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                    <item.icon size={20} color={item.active ? '#0f766e' : '#94a3b8'} />
                                    <h3 style={{ margin: 0 }}>{item.label}</h3>
                                </div>
                                <p style={{ color: 'var(--lp-ink-muted)' }}>{item.desc}</p>
                                <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>
                                    {item.active ? 'Available' : 'Ask for details'}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="lp-section">
                    <h2 className="lp-section-title">Food Menu</h2>
                    <div className="lp-card">
                        <div className="lp-food-table">
                            <div className="lp-food-row lp-food-header">
                                <div>Day</div>
                                <div>Breakfast</div>
                                <div>Lunch</div>
                                <div>Dinner</div>
                            </div>
                            {menu.map((day) => (
                                <div className="lp-food-row" key={day.day}>
                                    <div style={{ fontWeight: 600 }}>{day.day}</div>
                                    <div>{day.breakfast}</div>
                                    <div>{day.lunch}</div>
                                    <div>{day.dinner}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="lp-section">
                    <h2 className="lp-section-title">Location</h2>
                    <div className="lp-location">
                        <div className="lp-card">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                <MapPin size={18} />
                                <h3 style={{ margin: 0 }}>Address</h3>
                            </div>
                            <p style={{ color: 'var(--lp-ink-muted)', lineHeight: 1.6 }}>{pg.address}</p>
                            <p style={{ marginTop: '1rem', fontWeight: 600 }}>Easy access to daily essentials.</p>
                            {pg.mapLink && (
                                <a
                                    href={pg.mapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="lp-btn lp-btn-ghost"
                                    style={{ marginTop: '0.75rem', display: 'inline-flex' }}
                                >
                                    Open Map Location
                                </a>
                            )}
                        </div>
                        <div className="lp-map">
                            <h3>Neighborhood Snapshot</h3>
                            <p style={{ color: 'var(--lp-ink-muted)', marginTop: '0.5rem' }}>
                                {pg.neighborhoodDetails || 'Neighborhood highlights will be shared shortly.'}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="lp-section">
                    <h2 className="lp-section-title">Contact Us</h2>
                    <div className="lp-contact">
                        <h3>Talk to the PG Admin</h3>
                        <div className="lp-contact-item">
                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Name</span>
                            <strong>{admin?.name || 'PG Admin'}</strong>
                        </div>
                        <div className="lp-contact-item">
                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Email</span>
                            <span>{admin?.email || 'Available on request'}</span>
                        </div>
                        <div className="lp-contact-item">
                            <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>Phone</span>
                            <span>{admin?.phone || 'Available on request'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button className="lp-btn lp-btn-primary" onClick={() => setShowVisitForm(true)}>
                                <Phone size={16} /> Request Call Back
                            </button>
                            <button className="lp-btn lp-btn-ghost"><Mail size={16} /> Email Us</button>
                        </div>
                    </div>
                </section>

                <div className="lp-footer">
                    Crafted for {pg.name} - Your next home away from home
                </div>
            </div>

            {showVisitForm && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    zIndex: 1000
                }}>
                    <div className="lp-card" style={{ width: '100%', maxWidth: '480px' }}>
                        <h3 style={{ marginTop: 0 }}>Book a Visit</h3>
                        <p style={{ color: 'var(--lp-ink-muted)' }}>Share your details. Admin will contact you shortly.</p>
                        <form onSubmit={handleVisitSubmit}>
                            <div style={{ marginBottom: '0.9rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.35rem' }}>Name</label>
                                <input
                                    className="input-field"
                                    value={visitForm.name}
                                    onChange={(e) => setVisitForm((prev) => ({ ...prev, name: e.target.value }))}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '0.9rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.35rem' }}>Email</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    value={visitForm.email}
                                    onChange={(e) => setVisitForm((prev) => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.35rem' }}>Phone Number</label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    value={visitForm.phone}
                                    onChange={(e) => {
                                        const next = e.target.value.replace(/\D/g, '').slice(0, 10);
                                        setVisitForm((prev) => ({ ...prev, phone: next }));
                                    }}
                                    required
                                />
                            </div>
                            {visitStatus.message && (
                                <p style={{ color: visitStatus.isError ? '#b91c1c' : '#0f766e', marginBottom: '0.85rem' }}>
                                    {visitStatus.message}
                                </p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                                <button type="button" className="lp-btn lp-btn-ghost" onClick={() => setShowVisitForm(false)}>
                                    Close
                                </button>
                                <button type="submit" className="lp-btn lp-btn-primary" disabled={visitStatus.loading}>
                                    {visitStatus.loading ? 'Sending...' : 'Submit Request'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PGLandingPage;
