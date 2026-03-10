import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { AddTenantModal, EditTenantModal } from '../components/pg-details/TenantFormModals';
import RoomsSection from '../components/pg-details/RoomsSection';
import RoomModals from '../components/pg-details/RoomModals';
import FoodSection from '../components/pg-details/FoodSection';
import FoodEditModal from '../components/pg-details/FoodEditModal';
import WifiSection from '../components/pg-details/WifiSection';
import WifiModals from '../components/pg-details/WifiModals';
import ElectricitySection from '../components/pg-details/ElectricitySection';
import TenantsSection from '../components/pg-details/TenantsSection';
import VacancySection from '../components/pg-details/VacancySection';
import PgHeaderTabs from '../components/pg-details/PgHeaderTabs';
import PgEditModal from '../components/pg-details/PgEditModal';
import HighlightsSection from '../components/pg-details/HighlightsSection';
import GuardianSection from '../components/pg-details/GuardianSection';
import { useToast } from '../context/ToastContext';
import { tenantSchema } from '../schemas/tenantSchema';
import { roomCategorySchema } from '../schemas/roomCategorySchema';
import { pgSchema } from '../schemas/pgSchema';
import { wifiSchema } from '../schemas/wifiSchema';
import { foodMenuSchema } from '../schemas/foodMenuSchema';
import { electricityCurrentReadingSchema, electricityInitialReadingSchema, electricityRateSchema } from '../schemas/electricitySchema';
import { validateWithSchema } from '../utils/validation';

const PGDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { pgs, authRole, updatePg, deletePg, deleteTenant, tenants, addTenant, updateTenant, createTenantLogin } = useData();
    const { error: showError } = useToast();
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
    const [tenantErrors, setTenantErrors] = useState({});
    const [showEditTenant, setShowEditTenant] = useState(null);
    const [editTenant, setEditTenant] = useState(null);
    const [editAadharError, setEditAadharError] = useState('');
    const [editPhoneError, setEditPhoneError] = useState('');
    const [editTenantErrors, setEditTenantErrors] = useState({});
    const [roomErrors, setRoomErrors] = useState({});
    const [editRoomErrors, setEditRoomErrors] = useState({});
    const [pgErrors, setPgErrors] = useState({});
    const [wifiErrors, setWifiErrors] = useState({});
    const [editWifiErrors, setEditWifiErrors] = useState({});
    const [foodErrors, setFoodErrors] = useState({});
    const roomPhotosInputRef = useRef(null);
    const brochureInputRef = useRef(null);

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
        address: pg?.address || '',
        mapLink: pg?.mapLink || ''
    });

    useEffect(() => {
        if (pg) {
            setEditPgData({
                name: pg.name || '',
                address: pg.address || '',
                mapLink: pg.mapLink || ''
            });
        }
    }, [pg?.id, pg?.name, pg?.address, pg?.mapLink]);

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
        const validation = validateWithSchema(electricityRateSchema, { eBillRate });
        if (!validation.success) {
            showError(validation.errors.eBillRate || 'Enter a valid electricity rate.');
            return;
        }
        updatePg(
            { ...pg, eBillRate: validation.data.eBillRate },
            { successMessage: 'Electricity rate updated successfully.' }
        );
    };

    const handleInitializeMeter = (roomNum, initialReading) => {
        const validation = validateWithSchema(electricityInitialReadingSchema, { initialReading });
        if (!validation.success) {
            setReadings(prev => ({ ...prev, [roomNum]: { ...prev[roomNum], error: validation.errors.initialReading } }));
            return;
        }

        const updatedElectricityData = {
            ...(pg.electricityData || {}),
            [roomNum]: {
                previousReading: validation.data.initialReading,
                history: []
            }
        };
        updatePg(
            { ...pg, electricityData: updatedElectricityData },
            { successMessage: `Meter reading initialized for Room ${roomNum}.` }
        );
        setReadings(prev => ({ ...prev, [roomNum]: { ...prev[roomNum], initial: '' } }));
    };

    const handleGenerateBill = (roomNum) => {
        const currentReadingStr = readings[roomNum]?.current;
        if (!currentReadingStr) return;

        const validation = validateWithSchema(electricityCurrentReadingSchema, { currentReading: currentReadingStr });
        if (!validation.success) {
            setReadings(prev => ({
                ...prev,
                [roomNum]: { ...prev[roomNum], error: validation.errors.currentReading }
            }));
            return;
        }

        const currentReading = validation.data.currentReading;
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

        updatePg(
            { ...pg, electricityData: updatedElectricityData },
            { successMessage: `Electricity bill generated for Room ${roomNum}.` }
        );
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
        const validation = validateWithSchema(roomCategorySchema, newRoom);
        if (!validation.success) {
            setRoomErrors(validation.errors);
            showError(Object.values(validation.errors)[0] || 'Please correct the room category form.');
            return;
        }

        const rooms = validation.data.roomNumbers.split(',').map(n => n.trim()).filter(n => n);
        const updatedPg = {
            ...pg,
            rooms: [...(pg.rooms || []), { ...newRoom, ...validation.data, roomNumbers: rooms, id: Date.now().toString() }]
        };
        updatePg(updatedPg, { successMessage: 'New room category added successfully.' });
        setShowAddRoom(false);
        setRoomErrors({});
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
        const validation = validateWithSchema(foodMenuSchema, { foodMenu, foodAmount: foodAmountDraft });
        if (!validation.success) {
            setFoodErrors(validation.errors);
            showError(Object.values(validation.errors)[0] || 'Please correct the food settings.');
            return;
        }

        updatePg(
            { ...pg, foodMenu: validation.data.foodMenu, foodAmount: validation.data.foodAmount },
            { successMessage: 'Food menu and amount updated.' }
        );
        setFoodErrors({});
        setShowEditFood(false);
    };

    const handleAddWifi = (e) => {
        e.preventDefault();
        const validation = validateWithSchema(wifiSchema, newWifi);
        if (!validation.success) {
            setWifiErrors(validation.errors);
            showError(Object.values(validation.errors)[0] || 'Please correct the WiFi form.');
            return;
        }
        const updatedPg = {
            ...pg,
            wifiDetails: [...(pg.wifiDetails || []), { ...validation.data, id: Date.now().toString() }]
        };
        updatePg(updatedPg, { successMessage: 'WiFi details added successfully.' });
        setShowAddWifi(false);
        setWifiErrors({});
        setNewWifi({
            floorName: 'Ground Floor',
            username: '',
            password: '',
            amount: '',
            dueDate: new Date().toISOString().split('T')[0]
        });
    };

    const handleDeleteWifi = (wifiId) => {
        const updatedPg = {
            ...pg,
            wifiDetails: pg.wifiDetails.filter(w => w.id !== wifiId)
        };
        updatePg(updatedPg, { successMessage: 'WiFi details deleted successfully.' });
    };

    const handleUploadBrochureClick = () => {
        brochureInputRef.current?.click();
    };

    const handleBrochureSelected = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF brochure.');
            e.target.value = '';
            return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        await updatePg(
            { ...pg, brochureUrl: dataUrl, brochureName: file.name },
            { successMessage: 'Brochure uploaded successfully.' }
        );
        e.target.value = '';
    };

    const handleDownloadBrochure = () => {
        if (!pg?.brochureUrl) return;
        const link = document.createElement('a');
        link.href = pg.brochureUrl;
        link.download = pg.brochureName || `${pg.name || 'pg'}-brochure.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEditWifi = (wifiToUpdate) => {
        const validation = validateWithSchema(wifiSchema, wifiToUpdate);
        if (!validation.success) {
            setEditWifiErrors(validation.errors);
            showError(Object.values(validation.errors)[0] || 'Please correct the WiFi form.');
            return;
        }
        const updatedPg = {
            ...pg,
            wifiDetails: pg.wifiDetails.map(w => w.id === wifiToUpdate.id ? { ...wifiToUpdate, ...validation.data } : w)
        };
        updatePg(updatedPg, { successMessage: 'WiFi details updated successfully.' });
        setEditWifiErrors({});
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
        deletePg(pg.id);
        navigate('/');
    };

    const handleEditPg = (e) => {
        e.preventDefault();
        const validation = validateWithSchema(pgSchema, editPgData);
        if (!validation.success) {
            setPgErrors(validation.errors);
            showError(Object.values(validation.errors)[0] || 'Please correct the property details.');
            return;
        }
        updatePg({ ...pg, ...validation.data }, { successMessage: 'Property details updated successfully.' });
        setPgErrors({});
        setShowEditPg(false);
    };

    const handleDeleteRoomCategory = (categoryId) => {
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
        updatePg(updatedPg, { successMessage: 'Room category deleted successfully.' });
    };

    const handleAddTenant = (e) => {
        e.preventDefault();

        const validation = validateWithSchema(tenantSchema, newTenant);
        setPhoneError(validation.errors.phone || '');
        setAadharError(validation.errors.aadhar || '');
        setTenantErrors(validation.errors);
        if (!validation.success) {
            showError(Object.values(validation.errors)[0] || 'Please correct the tenant form.');
            return;
        }

        const tenantData = {
            ...newTenant,
            pgId: id, // Ensure correct PG ID
            ...validation.data,
            rent: validation.data.rent,
            advance: validation.data.advance
        };

        addTenant(tenantData);
        setShowAddTenant(false);
        setActiveTab('tenants'); // Switch to tenants tab
        setTenantErrors({});

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

        const validation = validateWithSchema(tenantSchema, editTenant);
        setEditPhoneError(validation.errors.phone || '');
        setEditAadharError(validation.errors.aadhar || '');
        setEditTenantErrors(validation.errors);
        if (!validation.success) {
            showError(Object.values(validation.errors)[0] || 'Please correct the tenant form.');
            return;
        }

        const updates = {
            ...editTenant,
            ...validation.data,
            rent: validation.data.rent,
            advance: validation.data.advance
        };

        const passwordChanged = Boolean(editTenant.newPassword && editTenant.newPassword.trim());
        const changeSummary = buildTenantChanges(showEditTenant, updates, passwordChanged);

        updateTenant(editTenant.id, {
            ...updates,
            newPassword: passwordChanged ? editTenant.newPassword.trim() : undefined,
            changeSummary
        });
        setEditTenantErrors({});
        setShowEditTenant(null);
        setEditTenant(null);
    };

    const handleEditRoomSubmit = (e) => {
        e.preventDefault();
        if (!showEditRoom) return;

        const roomPayload = {
            ...showEditRoom,
            roomNumbers: showEditRoom.roomNumbersString !== undefined ? showEditRoom.roomNumbersString : showEditRoom.roomNumbers?.join(', ')
        };
        const validation = validateWithSchema(roomCategorySchema, roomPayload);
        if (!validation.success) {
            setEditRoomErrors(validation.errors);
            showError(Object.values(validation.errors)[0] || 'Please correct the room category form.');
            return;
        }

        const newRooms = validation.data.roomNumbers.split(',').map(n => n.trim()).filter(n => n);
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
            rooms: pg.rooms.map(r => r.id === showEditRoom.id ? { ...showEditRoom, ...validation.data, roomNumbers: newRooms } : r)
        };
        updatePg(updatedPg, {
            successMessage: removedRooms.length > 0
                ? `Room category updated. Rooms removed: ${removedRooms.join(', ')}.`
                : 'Room category updated successfully.'
        });
        setEditRoomErrors({});
        setShowEditRoom(null);
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
            <PgHeaderTabs
                pg={pg}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setShowEditPg={setShowEditPg}
                handleDeletePg={handleDeletePg}
                setShowAddRoom={setShowAddRoom}
                setShowAddTenant={setShowAddTenant}
                canDeletePg={authRole === 'admin'}
                handleUploadBrochure={handleUploadBrochureClick}
                handleDownloadBrochure={handleDownloadBrochure}
                brochureName={pg.brochureName}
            />
            <input
                ref={brochureInputRef}
                type="file"
                accept="application/pdf"
                style={{ display: 'none' }}
                onChange={handleBrochureSelected}
            />

            {activeTab === 'rooms' && (
                <RoomsSection
                    pg={pg}
                    tenants={tenants}
                    setShowAddRoom={setShowAddRoom}
                    setShowEditRoom={setShowEditRoom}
                    handleDeleteRoomCategory={handleDeleteRoomCategory}
                />
            )}
            {activeTab === 'tenants' && (
                <TenantsSection
                    pg={pg}
                    tenants={tenants}
                    deleteTenant={deleteTenant}
                    createTenantLogin={createTenantLogin}
                    setShowEditTenant={setShowEditTenant}
                    setEditTenant={setEditTenant}
                    setEditAadharError={setEditAadharError}
                    setEditPhoneError={setEditPhoneError}
                />
            )}

            {activeTab === 'vacancy' && (
                <VacancySection
                    getVacantRooms={getVacantRooms}
                />
            )}
            {activeTab === 'highlights' && (
                <HighlightsSection
                    pg={pg}
                    updatePg={updatePg}
                    onSaveSuccess={() => setActiveTab('rooms')}
                />
            )}

            {activeTab === 'food' && (
                <FoodSection
                    pg={pg}
                    setShowEditFood={setShowEditFood}
                />
            )}
            {activeTab === 'wifi' && (
                <WifiSection
                    pg={pg}
                    setShowAddWifi={setShowAddWifi}
                    setShowEditWifi={setShowEditWifi}
                    handleDeleteWifi={handleDeleteWifi}
                />
            )}
            {activeTab === 'electricity' && (
                <ElectricitySection
                    pg={pg}
                    tenants={tenants}
                    eBillRate={eBillRate}
                    setEBillRate={setEBillRate}
                    handleUpdateEBillRate={handleUpdateEBillRate}
                    readings={readings}
                    setReadings={setReadings}
                    handleInitializeMeter={handleInitializeMeter}
                    handleGenerateBill={handleGenerateBill}
                    getSequentialFloors={getSequentialFloors}
                />
            )}
            {activeTab === 'guardian' && (
                <GuardianSection pgId={pg.id} isAdmin={authRole === 'admin'} />
            )}

            <PgEditModal
                showEditPg={showEditPg}
                setShowEditPg={setShowEditPg}
                editPgData={editPgData}
                setEditPgData={setEditPgData}
                handleEditPg={handleEditPg}
                errors={pgErrors}
            />

            <WifiModals
                showAddWifi={showAddWifi}
                setShowAddWifi={setShowAddWifi}
                newWifi={newWifi}
                setNewWifi={setNewWifi}
                handleAddWifi={handleAddWifi}
                showEditWifi={showEditWifi}
                setShowEditWifi={setShowEditWifi}
                handleEditWifi={handleEditWifi}
                handleNumberInput={handleNumberInput}
                addErrors={wifiErrors}
                editErrors={editWifiErrors}
            />

            <RoomModals
                showAddRoom={showAddRoom}
                setShowAddRoom={setShowAddRoom}
                newRoom={newRoom}
                setNewRoom={setNewRoom}
                handleAddRoom={handleAddRoom}
                getSequentialFloors={getSequentialFloors}
                generateNextFloorName={generateNextFloorName}
                handleNumberInput={handleNumberInput}
                roomPhotosInputRef={roomPhotosInputRef}
                handleRoomPhotosSelected={handleRoomPhotosSelected}
                removeRoomPhoto={removeRoomPhoto}
                showEditRoom={showEditRoom}
                setShowEditRoom={setShowEditRoom}
                pg={pg}
                tenants={tenants}
                deleteTenant={deleteTenant}
                updatePg={updatePg}
                handleEditRoomPhotosSelected={handleEditRoomPhotosSelected}
                removeEditRoomPhoto={removeEditRoomPhoto}
                addErrors={roomErrors}
                editErrors={editRoomErrors}
                handleEditRoomSubmit={handleEditRoomSubmit}
            />

            <FoodEditModal
                showEditFood={showEditFood}
                setShowEditFood={setShowEditFood}
                foodAmountDraft={foodAmountDraft}
                setFoodAmountDraft={setFoodAmountDraft}
                foodMenu={foodMenu}
                handleUpdateFood={handleUpdateFood}
                saveFoodMenu={saveFoodMenu}
                handleNumberInput={handleNumberInput}
                errors={foodErrors}
            />

            <EditTenantModal
                showEditTenant={showEditTenant}
                editTenant={editTenant}
                setShowEditTenant={setShowEditTenant}
                setEditTenant={setEditTenant}
                editPhoneError={editPhoneError}
                editAadharError={editAadharError}
                setEditPhoneError={setEditPhoneError}
                setEditAadharError={setEditAadharError}
                handleEditTenantSubmit={handleEditTenantSubmit}
                getRoomsForEditTenant={getRoomsForEditTenant}
                handleNumberInput={handleNumberInput}
                fieldErrors={editTenantErrors}
            />

            <AddTenantModal
                showAddTenant={showAddTenant}
                setShowAddTenant={setShowAddTenant}
                newTenant={newTenant}
                setNewTenant={setNewTenant}
                phoneError={phoneError}
                aadharError={aadharError}
                setPhoneError={setPhoneError}
                setAadharError={setAadharError}
                handleAddTenant={handleAddTenant}
                getVacantRoomsForTenant={getVacantRoomsForTenant}
                handleNumberInput={handleNumberInput}
                fieldErrors={tenantErrors}
            />
        </div >
    );
};

export default PGDetails;
