import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, Plus, Camera, Utensils, IndianRupee, Bed, UserPlus, CheckCircle2, X, Edit2, AlertCircle, Trash2, Wifi, LayoutGrid, Settings, Zap, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PGDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pgs, updatePg, deletePg, deleteTenant, tenants, addTenant, updateTenant, createTenantLogin } = useData();
    const pg = pgs.find(p => p.id === id);

    const [activeTab, setActiveTab] = useState('rooms');
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [showEditRoom, setShowEditRoom] = useState(null);
    const [showEditFood, setShowEditFood] = useState(false);
    const [showEditPg, setShowEditPg] = useState(false);
    const [showAddWifi, setShowAddWifi] = useState(false);
    const [showEditWifi, setShowEditWifi] = useState(null);
    const [showAddTenant, setShowAddTenant] = useState(false);
    const [aadharError, setAadharError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [showEditTenant, setShowEditTenant] = useState(null);
    const [editTenant, setEditTenant] = useState(null);
    const [editAadharError, setEditAadharError] = useState('');
    const [editPhoneError, setEditPhoneError] = useState('');
    const roomPhotosInputRef = useRef(null);

    const [newTenant, setNewTenant] = useState({
        name: '',
        phone: '',
        email: '',
        profession: '',
        aadhar: '',
        pgId: id,
        roomNumber: '',
        rent: '',
        advance: '',
        withFood: true,
        joiningDate: new Date().toISOString().split('T')[0]
    });

    const [editPgData, setEditPgData] = useState({
        name: pg?.name || '',
        address: pg?.address || ''
    });

    useEffect(() => {
        if (pg) {
            setEditPgData({
                name: pg.name || '',
                address: pg.address || ''
            });
        }
    }, [pg?.id, pg?.name, pg?.address]);

    const [newRoom, setNewRoom] = useState({
        type: '1 sharing',
        price: '',
        attachedBath: true,
        isAC: false,
        withFood: true,
        floorName: 'Ground Floor',
        roomNumbers: '', // Comma separated list
        photos: []
    });

    const [newWifi, setNewWifi] = useState({
        floorName: 'Ground Floor',
        username: '',
        password: '',
        amount: '',
        dueDate: new Date().toISOString().split('T')[0]
    });

    // Electricity Bill State
    const [eBillRate, setEBillRate] = useState(pg?.eBillRate || 10);
    const [readings, setReadings] = useState({}); // { roomNumber: { current: '', error: '' } }

    const handleUpdateEBillRate = () => {
        updatePg({ ...pg, eBillRate: parseFloat(eBillRate) });
    };

    const handleInitializeMeter = (roomNum, initialReading) => {
        if (!initialReading || initialReading < 0) return;

        const updatedElectricityData = {
            ...(pg.electricityData || {}),
            [roomNum]: {
                previousReading: parseFloat(initialReading),
                history: []
            }
        };
        updatePg({ ...pg, electricityData: updatedElectricityData });
        setReadings(prev => ({ ...prev, [roomNum]: { ...prev[roomNum], initial: '' } }));
    };

    const handleGenerateBill = (roomNum) => {
        const currentReadingStr = readings[roomNum]?.current;
        if (!currentReadingStr) return;

        const currentReading = parseFloat(currentReadingStr);
        const roomData = pg.electricityData?.[roomNum];
        const previousReading = roomData?.previousReading || 0;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const existingBill = roomData?.history?.find(bill => {
            const billDate = new Date(bill.date);
            return billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear;
        });

        if (existingBill) {
            setReadings(prev => ({
                ...prev,
                [roomNum]: { ...prev[roomNum], error: 'Bill for this month already generated' }
            }));
            return;
        }

        if (currentReading < previousReading) {
            setReadings(prev => ({
                ...prev,
                [roomNum]: { ...prev[roomNum], error: 'Current reading cannot be less than previous reading' }
            }));
            return;
        }

        if (currentReading === previousReading) {
            setReadings(prev => ({
                ...prev,
                [roomNum]: { ...prev[roomNum], error: 'Current reading cannot be the same as previous reading' }
            }));
            return;
        }

        if (!window.confirm("⚠️ WARNING: Please verify the meter readings carefully.\n\nOnce generated, this bill CANNOT be edited or deleted.\n\nAre you sure you want to generate the bill now?")) {
            return;
        }

        const unitsConsumed = currentReading - previousReading;
        const billAmount = unitsConsumed * eBillRate;
        const roomTenantsCount = tenants.filter(t => t.pgId === pg.id && t.roomNumber === roomNum).length;
        const newBill = {
            date: new Date().toISOString(),
            units: unitsConsumed,
            amount: billAmount,
            reading: currentReading,
            rate: eBillRate,
            tenantCount: roomTenantsCount,
            splitAmount: roomTenantsCount > 0 ? (billAmount / roomTenantsCount) : 0
        };

        const updatedElectricityData = {
            ...pg.electricityData,
            [roomNum]: {
                previousReading: currentReading,
                history: [newBill, ...(roomData?.history || [])].slice(0, 3)
            }
        };

        updatePg({ ...pg, electricityData: updatedElectricityData });
        setReadings(prev => ({
            ...prev,
            [roomNum]: { current: '', error: '' }
        }));
    };

    const defaultFoodMenu = [
        { day: 'Sunday', breakfast: 'Special Breakfast', lunch: 'Veg/Non-Veg Meal', dinner: 'Light Dinner' },
        { day: 'Monday', breakfast: 'Idli, Sambhar', lunch: 'Rice, Dal, Veg Fry', dinner: 'Roti, Mixed Veg' },
        { day: 'Tuesday', breakfast: 'Puri, Curry', lunch: 'Rice, Sambar, Curd', dinner: 'Veg Biryani' },
        { day: 'Wednesday', breakfast: 'Dosa, Chutney', lunch: 'Rice, Dal, Egg Curry', dinner: 'Roti, Paneer' },
        { day: 'Thursday', breakfast: 'Pongal, Chutney', lunch: 'Rice, Veg Mandi', dinner: 'Roti, Dal Tadka' },
        { day: 'Friday', breakfast: 'Upma, Chutney', lunch: 'Rice, Sambar, Fry', dinner: 'Roti, Veg Kadai' },
        { day: 'Saturday', breakfast: 'Pancakes/Aloo Paratha', lunch: 'Veg Pulav', dinner: 'Special Dinner/Roti' },
    ];

    const [foodMenu, setFoodMenu] = useState((pg?.foodMenu && pg.foodMenu.length > 0) ? pg.foodMenu : defaultFoodMenu);
    const [foodAmountDraft, setFoodAmountDraft] = useState(pg?.foodAmount ?? '');

    useEffect(() => {
        if (pg) {
            setFoodMenu((pg.foodMenu && pg.foodMenu.length > 0) ? pg.foodMenu : defaultFoodMenu);
            setFoodAmountDraft(pg.foodAmount ?? '');
        }
    }, [pg?.id, pg?.foodMenu]);

    const getSequentialFloors = (currentFloor) => {
        const floors = pg.rooms ? pg.rooms.map(r => r.floorName) : [];
        if (currentFloor) floors.push(currentFloor);

        let maxFloor = 0; // Start from 0 to include Ground Floor
        floors.forEach(f => {
            const match = f ? f.match(/(\d+)/) : null;
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxFloor) maxFloor = num;
            }
        });

        // Cap at 5 floors as requested (Ground + 1st through 5th)
        const finalMax = Math.min(maxFloor, 5);

        const list = ['Ground Floor'];
        for (let i = 1; i <= finalMax; i++) {
            list.push(`${getOrdinal(i)} Floor`);
        }
        return list;
    };

    const getOrdinal = (n) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    const generateNextFloorName = (currentFloor) => {
        const floors = pg.rooms ? pg.rooms.map(r => r.floorName) : [];
        if (currentFloor) floors.push(currentFloor);

        let maxFloor = 0;
        floors.forEach(f => {
            const match = f ? f.match(/(\d+)/) : null;
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxFloor) maxFloor = num;
            }
        });

        const next = maxFloor + 1;
        if (next > 5) return `${getOrdinal(5)} Floor`; // Cap at 5th floor
        return `${getOrdinal(next)} Floor`;
    };

    const handleNumberInput = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === '+') {
            e.preventDefault();
        }
    };

    const formatYesNo = (val) => (val ? 'Yes' : 'No');

    const buildTenantChanges = (before, after, passwordChanged) => {
        const fields = [
            { key: 'name', label: 'Name' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
            { key: 'profession', label: 'Profession' },
            { key: 'aadhar', label: 'Aadhar' },
            { key: 'roomNumber', label: 'Room' },
            { key: 'rent', label: 'Rent', format: (v) => `₹${v}` },
            { key: 'advance', label: 'Advance', format: (v) => `₹${v}` },
            { key: 'withFood', label: 'Food Included', format: formatYesNo },
            { key: 'joiningDate', label: 'Joining Date' }
        ];

        const changes = [];
        fields.forEach(({ key, label, format }) => {
            const beforeVal = before?.[key];
            const afterVal = after?.[key];
            const a = format ? format(afterVal) : (afterVal ?? '');
            const b = format ? format(beforeVal) : (beforeVal ?? '');
            if (a !== b) {
                changes.push({ field: label, from: b || '-', to: a || '-' });
            }
        });
        if (passwordChanged) {
            changes.push({ field: 'Password', from: '********', to: 'Updated' });
        }
        return changes;
    };

    const getRoomsForEditTenant = (currentRoom) => {
        const options = getVacantRoomsForTenant();
        if (currentRoom && !options.find(r => r.number === currentRoom)) {
            options.unshift({ number: currentRoom, type: 'Current', category: {} });
        }
        return options;
    };

    const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const handleRoomPhotosSelected = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const photoEntries = await Promise.all(
            files.map(async (file) => ({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                name: file.name,
                url: await readFileAsDataUrl(file)
            }))
        );

        setNewRoom(prev => ({
            ...prev,
            photos: [...(prev.photos || []), ...photoEntries]
        }));

        e.target.value = '';
    };

    const removeRoomPhoto = (photoId) => {
        setNewRoom(prev => ({
            ...prev,
            photos: (prev.photos || []).filter(p => p.id !== photoId)
        }));
    };

    const handleEditRoomPhotosSelected = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const photoEntries = await Promise.all(
            files.map(async (file) => ({
                id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
                name: file.name,
                url: await readFileAsDataUrl(file)
            }))
        );

        setShowEditRoom(prev => prev ? ({
            ...prev,
            photos: [...(prev.photos || []), ...photoEntries]
        }) : prev);

        e.target.value = '';
    };

    const removeEditRoomPhoto = (photoId) => {
        setShowEditRoom(prev => prev ? ({
            ...prev,
            photos: (prev.photos || []).filter(p => p.id !== photoId)
        }) : prev);
    };

    if (!pg) return <div className="container">PG not found</div>;

    const handleAddRoom = (e) => {
        e.preventDefault();
        const rooms = newRoom.roomNumbers.split(',').map(n => n.trim()).filter(n => n);
        const updatedPg = {
            ...pg,
            rooms: [...(pg.rooms || []), { ...newRoom, roomNumbers: rooms, id: Date.now().toString() }]
        };
        updatePg(updatedPg);
        setShowAddRoom(false);
        setNewRoom({
            type: '1 sharing',
            price: '',
            attachedBath: true,
            isAC: false,
            withFood: true,
            floorName: 'Ground Floor',
            roomNumbers: '',
            photos: []
        });
    };

    const handleUpdateFood = (dayIndex, field, value) => {
        const newMenu = [...foodMenu];
        newMenu[dayIndex] = { ...newMenu[dayIndex], [field]: value };
        setFoodMenu(newMenu);
    };

    const saveFoodMenu = () => {
        updatePg({ ...pg, foodMenu, foodAmount: foodAmountDraft });
        setShowEditFood(false);
    };

    const handleAddWifi = (e) => {
        e.preventDefault();
        const updatedPg = {
            ...pg,
            wifiDetails: [...(pg.wifiDetails || []), { ...newWifi, id: Date.now().toString() }]
        };
        updatePg(updatedPg);
        setShowAddWifi(false);
        setNewWifi({
            floorName: 'Ground Floor',
            username: '',
            password: '',
            amount: '',
            dueDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteWifi = (wifiId) => {
        if (window.confirm('Are you sure you want to delete these WiFi details?')) {
            const updatedPg = {
                ...pg,
                wifiDetails: pg.wifiDetails.filter(w => w.id !== wifiId)
            };
            updatePg(updatedPg);
        }
    };

    const handleEditWifi = (wifiToUpdate) => {
        const updatedPg = {
            ...pg,
            wifiDetails: pg.wifiDetails.map(w => w.id === wifiToUpdate.id ? wifiToUpdate : w)
        };
        updatePg(updatedPg);
        setShowEditWifi(null);
    };

    const getVacantRooms = () => {
        const allRooms = [];
        pg.rooms?.forEach(cat => {
            const capacity = parseInt(cat.type) || 1;
            cat.roomNumbers?.forEach(num => {
                const roomTenants = tenants.filter(t => t.pgId === pg.id && t.roomNumber === num);
                const slotsLeft = capacity - roomTenants.length;

                if (slotsLeft > 0) {
                    allRooms.push({
                        number: num,
                        type: cat.type,
                        slotsLeft: slotsLeft,
                        capacity: capacity
                    });
                }
            });
        });
        return allRooms;
    };

    const handleDeletePg = () => {
        if (window.confirm('Are you sure you want to delete this PG? All associated tenants and data will be permanently removed.')) {
            deletePg(pg.id);
            navigate('/');
        }
    };

    const handleEditPg = (e) => {
        e.preventDefault();
        updatePg({ ...pg, ...editPgData });
        setShowEditPg(false);
    };

    const handleDeleteRoomCategory = (categoryId) => {
        if (window.confirm('Are you sure you want to delete this room category? This will also remove all tenants assigned to these rooms.')) {
            // Find tenants in this category
            const category = pg.rooms.find(c => c.id === categoryId);
            if (category && category.roomNumbers) {
                category.roomNumbers.forEach(roomNum => {
                    const tenantsInRoom = tenants.filter(t => t.pgId === pg.id && t.roomNumber === roomNum);
                    tenantsInRoom.forEach(t => deleteTenant(t.id));
                });
            }

            const updatedPg = {
                ...pg,
                rooms: pg.rooms.filter(cat => cat.id !== categoryId)
            };
            updatePg(updatedPg);
        }
    };

    const handleAddTenant = (e) => {
        e.preventDefault();

        let hasError = false;

        // Phone validation
        if (newTenant.phone.length !== 10) {
            setPhoneError('Phone number must be exactly 10 digits');
            hasError = true;
        } else {
            setPhoneError('');
        }

        // Aadhar validation
        if (newTenant.aadhar.length !== 12) {
            setAadharError('Aadhar number must be exactly 12 digits');
            hasError = true;
        } else {
            setAadharError('');
        }

        if (hasError) return;

        const tenantData = {
            ...newTenant,
            pgId: id, // Ensure correct PG ID
            rent: Number(newTenant.rent),
            advance: Number(newTenant.advance)
        };

        addTenant(tenantData);
        setShowAddTenant(false);
        setActiveTab('tenants'); // Switch to tenants tab

        // Reset form
        setNewTenant({
            name: '', phone: '', email: '', profession: '', aadhar: '',
            pgId: id, roomNumber: '', rent: '', advance: '',
            withFood: true,
            joiningDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleEditTenantSubmit = (e) => {
        e.preventDefault();
        if (!editTenant) return;

        let hasError = false;
        if (editTenant.phone.length !== 10) {
            setEditPhoneError('Phone number must be exactly 10 digits');
            hasError = true;
        } else {
            setEditPhoneError('');
        }

        if (editTenant.aadhar.length !== 12) {
            setEditAadharError('Aadhar number must be exactly 12 digits');
            hasError = true;
        } else {
            setEditAadharError('');
        }

        if (hasError) return;

        const updates = {
            ...editTenant,
            rent: Number(editTenant.rent),
            advance: Number(editTenant.advance)
        };

        const passwordChanged = Boolean(editTenant.newPassword && editTenant.newPassword.trim());
        const changeSummary = buildTenantChanges(showEditTenant, updates, passwordChanged);

        updateTenant(editTenant.id, {
            ...updates,
            newPassword: passwordChanged ? editTenant.newPassword.trim() : undefined,
            changeSummary
        });
        setShowEditTenant(null);
        setEditTenant(null);
    };

    const getVacantRoomsForTenant = () => {
        const vacantRooms = [];
        pg.rooms?.forEach(cat => {
            const capacity = parseInt(cat.type) || 1;
            cat.roomNumbers?.forEach(num => {
                const roomTenants = tenants.filter(t => t.pgId === pg.id && t.roomNumber === num);
                if (roomTenants.length < capacity) {
                    vacantRooms.push({
                        number: num,
                        type: cat.type,
                        category: cat
                    });
                }
            });
        });
        return vacantRooms;
    };

    return (
        <div className="container" style={{ padding: 0 }}>
            <header style={{ marginBottom: '2rem' }}>
                <Link to="/" style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    color: 'var(--text-main)',
                    textDecoration: 'none',
                    marginBottom: '2rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease'
                }}>
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.4rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <ArrowLeft size={18} />
                    </div>
                    <span style={{ fontWeight: 500 }}>Back to Dashboard</span>
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h1 style={{ margin: 0 }}>{pg.name}</h1>

                        </div>
                        <p style={{ color: 'var(--text-muted)' }}>{pg.address}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button onClick={() => setShowEditPg(true)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                            <Edit2 size={18} /> Edit PG
                        </button>
                        <button onClick={handleDeletePg} className="btn btn-outline" style={{ fontSize: '0.875rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            <Trash2 size={18} /> Delete PG
                        </button>
                        <button onClick={() => setShowAddRoom(true)} className="btn btn-outline" style={{ fontSize: '0.875rem' }}>
                            <Plus size={18} /> Add Room Category
                        </button>

                        <button
                            onClick={() => {
                                if (pg.rooms?.length > 0) {
                                    setActiveTab('tenants');
                                    setShowAddTenant(true);
                                }
                            }}
                            className={`btn ${pg.rooms?.length > 0 ? 'btn-primary' : 'btn-disabled'}`}
                            style={{
                                fontSize: '0.875rem',
                                opacity: pg.rooms?.length > 0 ? 1 : 0.5,
                                pointerEvents: pg.rooms?.length > 0 ? 'auto' : 'none'
                            }}
                        >
                            <UserPlus size={18} /> Register Tenant
                        </button>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid var(--border-glass)', marginBottom: '2rem', overflowX: 'auto' }}>
                <button
                    onClick={() => setActiveTab('rooms')}
                    className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'rooms' ? 'var(--primary)' : 'transparent' }}
                >
                    <Bed size={18} /> Rooms
                </button>
                <button
                    onClick={() => setActiveTab('tenants')}
                    className={`btn ${activeTab === 'tenants' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'tenants' ? 'var(--primary)' : 'transparent' }}
                >
                    <UserPlus size={18} /> Tenants
                </button>
                <button
                    onClick={() => setActiveTab('vacancy')}
                    className={`btn ${activeTab === 'vacancy' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'vacancy' ? 'var(--primary)' : 'transparent' }}
                >
                    <LayoutGrid size={18} /> Vacancy
                </button>
                <button
                    onClick={() => setActiveTab('food')}
                    className={`btn ${activeTab === 'food' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'food' ? 'var(--primary)' : 'transparent' }}
                >
                    <Utensils size={18} /> Food Menu
                </button>
                <button
                    onClick={() => setActiveTab('wifi')}
                    className={`btn ${activeTab === 'wifi' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'wifi' ? 'var(--primary)' : 'transparent' }}
                >
                    <Wifi size={18} /> WiFi
                </button>
                <button
                    onClick={() => setActiveTab('electricity')}
                    className={`btn ${activeTab === 'electricity' ? 'btn-primary' : 'btn-outline'}`}
                    style={{ background: activeTab === 'electricity' ? 'var(--primary)' : 'transparent' }}
                >
                    <Zap size={18} /> Electricity
                </button>

            </div>

            {activeTab === 'rooms' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {pg.rooms?.length === 0 ? (
                        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                            <Bed size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <h3>No room categories yet</h3>
                            <p style={{ color: 'var(--text-muted)' }}>Start by adding a room category for this PG.</p>
                            <div style={{
                                marginTop: '1.5rem',
                                marginBottom: '1.5rem',
                                padding: '0.75rem 1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: 'var(--danger)',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <AlertCircle size={16} />
                                <span>Please add room categories before registering tenants</span>
                            </div>
                            <br />
                            <button onClick={() => setShowAddRoom(true)} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                                <Plus size={20} /> Add Your First Category
                            </button>
                        </div>
                    ) : (
                        Object.entries((pg.rooms || []).reduce((acc, room) => {
                            const floor = room.floorName || 'General';
                            if (!acc[floor]) acc[floor] = [];
                            acc[floor].push(room);
                            return acc;
                        }, {})).sort(([a], [b]) => {
                            if (a === 'Ground Floor') return -1;
                            if (b === 'Ground Floor') return 1;
                            return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
                        }).map(([floorName, floorRooms]) => (
                            <div key={floorName}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '1rem',
                                    padding: '0 0.5rem'
                                }}>
                                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{floorName}</h3>
                                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2">
                                    {floorRooms.flatMap(category =>
                                        category.roomNumbers?.map(num => {
                                            const roomTenants = tenants.filter(t => t.pgId === pg.id && t.roomNumber === num);
                                            const capacity = parseInt(category.type) || 1;
                                            const slotsLeft = capacity - roomTenants.length;

                                            return (
                                                <div key={num} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem' }}>
                                                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Room no: {num}</h3>
                                                            <div style={{ fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 600 }}>
                                                                {slotsLeft > 0 ? `(${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} left)` : '(Full)'}
                                                            </div>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.1rem' }}>₹{category.price}</div>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{category.type}</div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                        <span style={{
                                                            fontSize: '0.75rem', padding: '0.25rem 0.5rem',
                                                            background: category.attachedBath ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                            color: category.attachedBath ? 'var(--success)' : 'var(--text-muted)',
                                                            borderRadius: '4px'
                                                        }}>
                                                            {category.attachedBath ? 'Attached Bath' : 'Non-attached Bath'}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.75rem', padding: '0.25rem 0.5rem',
                                                            background: category.isAC ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                            color: category.isAC ? 'var(--success)' : 'var(--text-muted)',
                                                            borderRadius: '4px'
                                                        }}>
                                                            {category.isAC ? 'AC' : 'Non-AC'}
                                                        </span>
                                                        {category.withFood && <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', borderRadius: '4px' }}>With Food</span>}
                                                    </div>

                                                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '-0.5rem' }}>
                                                            {roomTenants.map((t, i) => (
                                                                <div key={i} style={{
                                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                                    border: '1px dashed var(--border-glass)',
                                                                    background: 'red'
                                                                }} />
                                                            ))}
                                                            {Array.from({ length: slotsLeft }).map((_, i) => (
                                                                <div key={i} style={{
                                                                    width: '24px', height: '24px', borderRadius: '50%',
                                                                    border: '1px dashed var(--border-glass)',
                                                                    background: 'green'
                                                                }} />
                                                            ))}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button onClick={() => setShowEditRoom(category)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none' }}>
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteRoomCategory(category.id)} className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--danger)' }}>
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            {activeTab === 'tenants' && (
                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-glass)' }}>
                        <h3 style={{ margin: 0 }}>Active Tenants</h3>
                    </div>
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
                                                    <button
                                                        onClick={() => {
                                                            setShowEditTenant(tenant);
                                                            setEditTenant({ ...tenant, newPassword: '' });
                                                            setEditAadharError('');
                                                            setEditPhoneError('');
                                                        }}
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', marginRight: '0.5rem' }}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this tenant?')) {
                                                                deleteTenant(tenant.id);
                                                            }
                                                        }}
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                if (window.confirm('Create tenant login and send welcome email?')) {
                                                                    await createTenantLogin(tenant.id);
                                                                    alert('Tenant login created and email sent.');
                                                                }
                                                            } catch (err) {
                                                                alert(err.message || 'Failed to create tenant login');
                                                            }
                                                        }}
                                                        className="btn btn-outline"
                                                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
                                                    >
                                                        Create Login
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {
                activeTab === 'vacancy' && (
                    <div className="grid grid-cols-3">
                        {getVacantRooms().length === 0 ? (
                            <div className="glass-card" style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center' }}>
                                <AlertCircle size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                                <p style={{ color: 'var(--text-muted)' }}>No rooms defined yet.</p>
                            </div>
                        ) : (
                            getVacantRooms().map(room => (
                                <div
                                    key={room.number}
                                    className="glass-card"
                                    style={{
                                        padding: '1.5rem',
                                        textAlign: 'center',
                                        border: '1px solid var(--success)',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
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
                )
            }

            {activeTab === 'food' && (
                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{
                        padding: '1.5rem',
                        background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)',
                        borderBottom: '1px solid var(--border-glass)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                padding: '0.5rem',
                                background: 'rgba(236, 72, 153, 0.1)',
                                color: '#ec4899',
                                borderRadius: '12px',
                                display: 'flex'
                            }}>
                                <Utensils size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Weekly Food Menu</h3>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{
                                padding: '0.5rem 1rem',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-glass)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Monthly Cost:</span>
                                <span style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '1.1rem' }}>₹{pg.foodAmount || 0}</span>
                            </div>
                            <button onClick={() => setShowEditFood(true)} className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                                <Edit2 size={16} /> Edit Menu
                            </button>
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breakfast</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lunch</th>
                                    <th style={{ padding: '1.25rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dinner</th>
                                </tr>
                            </thead>
                            <tbody>
                                {foodMenu.map((day, idx) => (
                                    <tr key={day.day} style={{
                                        borderBottom: idx === foodMenu.length - 1 ? 'none' : '1px solid var(--border-glass)',
                                        transition: 'background 0.2s',
                                    }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '1.25rem', fontWeight: 600, color: 'var(--primary)', width: '15%' }}>{day.day}</td>
                                        <td style={{ padding: '1.25rem', color: 'var(--text-main)', width: '28%' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {day.breakfast}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem', color: 'var(--text-main)', width: '28%' }}>{day.lunch}</td>
                                        <td style={{ padding: '1.25rem', color: 'var(--text-main)', width: '29%' }}>{day.dinner}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'wifi' && (
                <div className="glass-card" style={{ padding: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>WiFi Management</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage internet access details per floor</p>
                        </div>
                        <button onClick={() => setShowAddWifi(true)} className="btn btn-primary">
                            <Plus size={18} /> Add WiFi Details
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {(!pg.wifiDetails || pg.wifiDetails.length === 0) ? (
                            <div style={{ gridColumn: 'span 3', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                                <Wifi size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <p>No WiFi details added yet.</p>
                            </div>
                        ) : (
                            pg.wifiDetails.map((wifi) => {
                                const isDue = (() => {
                                    if (!wifi.dueDate) return false;
                                    const due = new Date(wifi.dueDate);
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const diff = due - today;
                                    return diff <= (3 * 24 * 60 * 60 * 1000); // 3 days
                                })();

                                return (
                                    <div key={wifi.id} className="glass-card" style={{
                                        padding: '1.5rem',
                                        background: isDue ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                                        border: isDue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border-glass)',
                                        maxWidth: '450px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ margin: 0, color: 'var(--primary)' }}>{wifi.floorName}</h3>
                                            {isDue && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: 'var(--danger)',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}>
                                                    <AlertCircle size={12} /> Recharge Due
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Username:</span>
                                                <span style={{ fontWeight: 500 }}>{wifi.username}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password:</span>
                                                <span style={{ fontWeight: 500 }}>{wifi.password}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Monthly:</span>
                                                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>₹{wifi.amount}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Due Date:</span>
                                                <span style={{ fontWeight: 600, color: isDue ? 'var(--danger)' : 'var(--text-main)' }}>
                                                    {wifi.dueDate ? new Date(wifi.dueDate).toLocaleDateString('en-IN') : 'N/A'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                                            <button onClick={() => setShowEditWifi(wifi)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.875rem' }}>
                                                <Edit2 size={16} /> Edit
                                            </button>
                                            <button onClick={() => handleDeleteWifi(wifi.id)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.875rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                                                <Trash2 size={16} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}


            {activeTab === 'electricity' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Rate Settings Card */}
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Zap size={20} color="#f59e0b" /> Electricity Settings
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                                Configure billing rate and manage meter readings
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Rate per Unit (₹):</label>
                            <input
                                type="number"
                                className="input-field"
                                style={{ width: '80px', margin: 0 }}
                                value={eBillRate}
                                onChange={(e) => setEBillRate(e.target.value)}
                                onBlur={handleUpdateEBillRate}
                            />
                        </div>
                    </div>

                    {/* Room List for E-Bill */}
                    {(!pg.rooms || pg.rooms.length === 0) ? (
                        <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
                            <Zap size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                            <h3>No Rooms Added</h3>
                            <p style={{ color: 'var(--text-muted)' }}>There are no rooms to manage electricity bills for. Please add rooms in the "Rooms" tab first.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {getSequentialFloors().map(floor => {
                                // Find all rooms on this floor
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
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                            onClick={() => handleInitializeMeter(roomNum, initialInput)}
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
                                                                className="btn btn-primary"
                                                                disabled={!currentInput}
                                                                onClick={() => handleGenerateBill(roomNum)}
                                                            >
                                                                Generate Bill
                                                            </button>
                                                        </div>
                                                        {error && <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>{error}</p>}
                                                    </div>

                                                    {/* Calculation Preview */}
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

                                                            {/* Tenant Split Info */}
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

                                                    {/* History */}
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
            )}

            {/* Add WiFi Modal */}
            {
                showAddWifi && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '1rem'
                    }}>
                        <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem 1.5rem 2rem 2rem', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Add New WiFi Details</h2>
                                <button onClick={() => setShowAddWifi(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleAddWifi}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Level</label>
                                    <select
                                        className="input-field"
                                        value={newWifi.floorName}
                                        onChange={(e) => setNewWifi({ ...newWifi, floorName: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Floor</option>
                                        {getSequentialFloors(newWifi.floorName).map(floor => (
                                            <option key={floor} value={floor}>{floor}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. wifi_user_123"
                                        value={newWifi.username}
                                        onChange={(e) => setNewWifi({ ...newWifi, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. securepassword"
                                        value={newWifi.password}
                                        onChange={(e) => setNewWifi({ ...newWifi, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Amount (₹)</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
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
                                    <button type="submit" className="btn btn-primary">Add WiFi</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit WiFi Modal */}
            {
                showEditWifi && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '1rem'
                    }}>
                        <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem 1.5rem 2rem 2rem', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>Edit WiFi Details</h2>
                                <button onClick={() => setShowEditWifi(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleEditWifi(showEditWifi);
                            }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Level</label>
                                    <select
                                        className="input-field"
                                        value={showEditWifi.floorName}
                                        onChange={(e) => setShowEditWifi({ ...showEditWifi, floorName: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Floor</option>
                                        {getSequentialFloors(showEditWifi.floorName).map(floor => (
                                            <option key={floor} value={floor}>{floor}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Username</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. wifi_user_123"
                                        value={showEditWifi.username}
                                        onChange={(e) => setShowEditWifi({ ...showEditWifi, username: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Password</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. securepassword"
                                        value={showEditWifi.password}
                                        onChange={(e) => setShowEditWifi({ ...showEditWifi, password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Amount (₹)</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Due Date</label>
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
                )
            }

            {/* Add Room Modal */}
            {
                showAddRoom && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '1rem'
                    }}>
                        <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem 1.5rem 2rem 2rem', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ margin: 0 }}>New Room Category</h2>
                                <button onClick={() => setShowAddRoom(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleAddRoom}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Sharing Type</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Price (₹)</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Level</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Numbers (comma separated)</label>
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
                )
            }

            {/* Edit Room Modal */}
            {
                showEditRoom && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1000, padding: '1rem'
                    }}>
                        <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2rem 1.5rem 2rem 2rem', maxHeight: '85vh', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <h2>Edit Room Category</h2>
                                <button onClick={() => setShowEditRoom(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                const newRooms = showEditRoom.roomNumbersString?.split(',').map(n => n.trim()).filter(n => n) || showEditRoom.roomNumbers;

                                // Find removed rooms
                                const oldRooms = pg.rooms.find(r => r.id === showEditRoom.id)?.roomNumbers || [];
                                const removedRooms = oldRooms.filter(r => !newRooms.includes(r));

                                if (removedRooms.length > 0) {
                                    if (window.confirm(`Removing rooms ${removedRooms.join(', ')} will also remove assigned tenants. Continue?`)) {
                                        removedRooms.forEach(roomNum => {
                                            const tenantsInRoom = tenants.filter(t => t.pgId === pg.id && t.roomNumber === roomNum);
                                            tenantsInRoom.forEach(t => deleteTenant(t.id));
                                        });
                                    } else {
                                        return; // Cancel update if user declines
                                    }
                                }

                                const updatedPg = {
                                    ...pg,
                                    rooms: pg.rooms.map(r => r.id === showEditRoom.id ? { ...showEditRoom, roomNumbers: newRooms } : r)
                                };
                                updatePg(updatedPg);
                                setShowEditRoom(null);
                            }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Sharing Type</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Monthly Price (₹)</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Floor Level</label>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>Room Numbers (comma separated)</label>
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
                )
            }

            {/* Edit Food Menu Modal */}
            {
                showEditFood && (
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
                                <button onClick={() => setShowEditFood(false)} className="btn btn-outline">Cancel</button>
                                <button onClick={saveFoodMenu} className="btn btn-primary">Save Changes</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit PG Modal */}
            {
                showEditPg && (
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
                )
            }

            {/* Add Tenant Modal */}
            {showEditTenant && editTenant && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '700px', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
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
            )}

            {showAddTenant && (
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
            )}
        </div >
    );
};

export default PGDetails;
