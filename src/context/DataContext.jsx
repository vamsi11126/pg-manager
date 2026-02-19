import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useToast } from './ToastContext';
import { guardianEmailFromPhone, normalizePhone } from '../utils/guardian';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { success, error: showError, info } = useToast();
    const [user, setUser] = useState(null);
    const [authRole, setAuthRole] = useState(null);
    const [tenantUser, setTenantUser] = useState(null);
    const [tenantPg, setTenantPg] = useState(null);
    const [tenantRoommates, setTenantRoommates] = useState([]);
    const [tenantBills, setTenantBills] = useState([]);
    const [tenantPaymentRequests, setTenantPaymentRequests] = useState([]);
    const [guardianProfile, setGuardianProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pgs, setPgs] = useState([]);

    // Helper: Convert DB pg to frontend format
    const transformPgFromDB = (dbPg) => ({
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
        galleryPhotos: dbPg.gallery_photos ?? [],
        createdAt: dbPg.created_at,
        updatedAt: dbPg.updated_at
    });

    // Helper: Convert frontend pg to DB format
    const transformPgToDB = (pg) => ({
        name: pg.name,
        address: pg.address,
        rooms: pg.rooms ?? [],
        food_menu: pg.foodMenu ?? pg.food_menu ?? [],
        wifi_details: pg.wifiDetails ?? pg.wifi_details ?? [],
        electricity_data: pg.electricityData ?? pg.electricity_data ?? {},
        e_bill_rate: pg.eBillRate ?? pg.e_bill_rate ?? 10,
        food_amount: pg.foodAmount ?? pg.food_amount ?? 0,
        map_link: pg.mapLink ?? pg.map_link ?? '',
        landing_qr: pg.landingQr ?? pg.landing_qr ?? '',
        brochure_url: pg.brochureUrl ?? pg.brochure_url ?? '',
        brochure_name: pg.brochureName ?? pg.brochure_name ?? '',
        facilities: pg.facilities ?? [],
        neighborhood_details: pg.neighborhoodDetails ?? pg.neighborhood_details ?? '',
        gallery_photos: pg.galleryPhotos ?? pg.gallery_photos ?? []
    });

    const fetchTenantByAuthId = async (_authUserId, email) => {
        let resolvedTenant = null;

        if (email) {
            const normalizedEmail = email.trim().toLowerCase();
            const { data: tenantByEmail, error: tenantByEmailError } = await supabase
                .from('tenants')
                .select('*')
                .ilike('email', normalizedEmail)
                .maybeSingle();
            if (tenantByEmailError) {
                console.error('Error fetching tenant by email:', tenantByEmailError);
            }
            resolvedTenant = tenantByEmail || null;

            if (!resolvedTenant) {
                const { data: tenantCandidates, error: tenantCandidatesError } = await supabase
                    .from('tenants')
                    .select('*')
                    .ilike('email', `%${normalizedEmail}%`)
                    .limit(5);
                if (tenantCandidatesError) {
                    console.error('Error fetching tenant email candidates:', tenantCandidatesError);
                } else if (Array.isArray(tenantCandidates)) {
                    resolvedTenant = tenantCandidates.find(t => (t.email || '').trim().toLowerCase() === normalizedEmail) || null;
                }
            }
        }

        if (!resolvedTenant) {
            setTenantUser(null);
            console.warn('Tenant record not found for email:', email);
            return null;
        }

        const tenant = transformTenantFromDB(resolvedTenant);
        setTenantUser(tenant);

        const { data: pgData, error: pgError } = await supabase
            .from('pgs')
            .select('*')
            .eq('id', tenant.pgId)
            .maybeSingle();

        if (pgError) {
            console.error('Error fetching tenant PG:', pgError);
        }

        if (pgData) {
            setTenantPg(transformPgFromDB(pgData));
        }

        const { data: roommates } = await supabase
            .from('tenants')
            .select('id,name,phone')
            .eq('pg_id', tenant.pgId)
            .eq('room_number', tenant.roomNumber)
            .neq('id', tenant.id);
        setTenantRoommates(roommates || []);

        const { data: tenantRequests } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('created_at', { ascending: false });
        setTenantPaymentRequests((tenantRequests || []).map(transformPaymentFromDB));

        const { data: bills, error: billsError } = await supabase
            .from('tenant_bills')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('due_date', { ascending: false });
        if (billsError) {
            console.error('Error fetching tenant bills:', billsError);
        }
        setTenantBills(bills || []);
        return resolvedTenant;
    };

    const fetchGuardianByAuthId = async (authUserId) => {
        const { data: guardianRow, error: guardianError } = await supabase
            .from('guardians')
            .select('*')
            .eq('auth_user_id', authUserId)
            .eq('is_active', true)
            .maybeSingle();

        if (guardianError) {
            console.error('Error fetching guardian assignment:', guardianError);
        }

        if (!guardianRow) {
            setGuardianProfile(null);
            return null;
        }

        setGuardianProfile({
            id: guardianRow.id,
            adminId: guardianRow.admin_id,
            pgId: guardianRow.pg_id,
            name: guardianRow.guardian_name,
            phone: guardianRow.phone,
            email: guardianRow.guardian_email
        });

        const { data: pgData, error: pgError } = await supabase
            .from('pgs')
            .select('*')
            .eq('id', guardianRow.pg_id)
            .maybeSingle();
        if (pgError) {
            console.error('Error fetching guardian PG:', pgError);
        }

        setPgs(pgData ? [transformPgFromDB(pgData)] : []);

        const { data: guardianTenants, error: tenantsError } = await supabase
            .from('tenants')
            .select('*')
            .eq('pg_id', guardianRow.pg_id)
            .order('created_at', { ascending: false });
        if (tenantsError) {
            console.error('Error fetching guardian tenants:', tenantsError);
        }
        setTenants((guardianTenants || []).map(transformTenantFromDB));

        const { data: guardianRequests, error: requestsError } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('pg_id', guardianRow.pg_id)
            .order('created_at', { ascending: false });
        if (requestsError) {
            console.error('Error fetching guardian payment requests:', requestsError);
        }
        setPaymentRequests((guardianRequests || []).map(transformPaymentFromDB));

        return guardianRow;
    };

    // Auth State Listener
    useEffect(() => {
        const fetchProfile = async (session) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role === 'admin') {
                    setAuthRole('admin');
                    setUser({ ...session.user, ...profile });
                    setGuardianProfile(null);
                    setTenantUser(null);
                    await fetchPGs(session.user.id);
                    await fetchTenants(session.user.id);
                    await fetchPaymentRequests(session.user.id);
                } else if (profile?.role === 'guardian') {
                    setAuthRole('guardian');
                    setUser({ ...session.user, ...profile });
                    setTenantUser(null);
                    setTenantPg(null);
                    setTenantRoommates([]);
                    setTenantBills([]);
                    setTenantPaymentRequests([]);
                    const guardian = await fetchGuardianByAuthId(session.user.id);
                    if (!guardian) {
                        await supabase.auth.signOut();
                        setAuthRole(null);
                        setUser(null);
                        setGuardianProfile(null);
                        setPgs([]);
                        setTenants([]);
                        setPaymentRequests([]);
                    }
                } else {
                    setAuthRole('tenant');
                    setUser(null);
                    setGuardianProfile(null);
                    const tenant = await fetchTenantByAuthId(session.user.id, session.user.email);
                    if (!tenant) {
                        await supabase.auth.signOut();
                        setAuthRole(null);
                        setTenantUser(null);
                        setTenantPg(null);
                        setTenantRoommates([]);
                        setTenantBills([]);
                        setTenantPaymentRequests([]);
                    }
                }
            } else {
                setUser(null);
                setTenantUser(null);
                setGuardianProfile(null);
                setAuthRole(null);
                setTenantPg(null);
                setTenantRoommates([]);
                setTenantBills([]);
                setTenantPaymentRequests([]);
                setPgs([]);
                setTenants([]);
                setPaymentRequests([]);
            }
            setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            fetchProfile(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchPGs = async (userId) => {
        const { data, error } = await supabase
            .from('pgs')
            .select('*')
            .eq('admin_id', userId);

        if (!error && data) {
            setPgs(data.map(transformPgFromDB));
        }
    };

    const register = async () => {
        return {
            success: false,
            message: 'Open registration is disabled. Ask the system owner for an invite link.'
        };
    };

    const login = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, message: error.message };
        }
        return { success: true };
    };

    const loginAsOwner = async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
        });

        if (error) {
            return { success: false, message: error.message };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile?.role !== 'admin') {
            await supabase.auth.signOut();
            if (profile?.role === 'guardian') {
                return { success: false, message: 'This login is for owners only. Please use guardian login.' };
            }
            return { success: false, message: 'This login is for owners only. Please use tenant login.' };
        }
        return { success: true };
    };

    const loginAsTenant = async (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
        });

        if (error) {
            return { success: false, message: error.message };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile?.role === 'admin' || profile?.role === 'guardian') {
            await supabase.auth.signOut();
            if (profile?.role === 'guardian') {
                return { success: false, message: 'This login is for tenants only. Please use guardian login.' };
            }
            return { success: false, message: 'This login is for tenants only. Please use owner login.' };
        }

        const tenant = await fetchTenantByAuthId(data.user.id, data.user.email);
        if (!tenant) {
            await supabase.auth.signOut();
            return { success: false, message: 'No tenant record found for this account. Please contact the PG owner.' };
        }
        return { success: true };
    };

    const loginAsGuardian = async (phone, password) => {
        const normalizedPhone = normalizePhone(phone);
        if (!/^\d{10}$/.test(normalizedPhone)) {
            return { success: false, message: 'Phone number must be exactly 10 digits' };
        }

        const email = guardianEmailFromPhone(normalizedPhone);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return { success: false, message: error.message };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profile?.role !== 'guardian') {
            await supabase.auth.signOut();
            return { success: false, message: 'This login is for guardians only.' };
        }

        const guardian = await fetchGuardianByAuthId(data.user.id);
        if (!guardian) {
            await supabase.auth.signOut();
            return { success: false, message: 'No active guardian assignment found. Contact your PG owner.' };
        }

        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setTenantUser(null);
        setGuardianProfile(null);
        setAuthRole(null);
    };

    const getCurrentAdminId = () => {
        if (authRole === 'admin') return user?.id || null;
        if (authRole === 'guardian') return guardianProfile?.adminId || null;
        return null;
    };

    const canAccessPg = (pgId) => {
        if (authRole === 'admin') return true;
        if (authRole === 'guardian') return guardianProfile?.pgId === pgId;
        return false;
    };

    const addPg = async (pgData) => {
        if (!user || authRole !== 'admin') {
            showError('Please login to continue.');
            return;
        }

        const insertData = {
            ...transformPgToDB(pgData),
            admin_id: user.id
        };

        console.log('Attempting to insert PG:', insertData);

        const { data, error } = await supabase
            .from('pgs')
            .insert([insertData])
            .select()
            .single();

        if (error) {
            console.error('Error adding PG:', error);
            showError(`Could not create property. ${error.message}`);
        } else {
            console.log('PG added successfully:', data);
            setPgs([...pgs, transformPgFromDB(data)]);
            success('New property created successfully.');
        }
    };

    const updatePg = async (updatedPg, toastOptions = {}) => {
        const successMessage = toastOptions?.successMessage || 'Changes saved successfully.';
        const errorMessage = toastOptions?.errorMessage || null;
        const silentSuccess = toastOptions?.silentSuccess === true;

        const { data, error } = await supabase
            .from('pgs')
            .update(transformPgToDB(updatedPg))
            .eq('id', updatedPg.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating PG:', error);
            showError(errorMessage || ('Could not save changes. ' + error.message));
            return { success: false, message: error.message };
        } else {
            const next = transformPgFromDB(data);
            setPgs(pgs.map(pg => pg.id === updatedPg.id ? next : pg));
            if (!silentSuccess) {
                success(successMessage);
            }
            return { success: true, data: next };
        }
    };

    const deletePg = async (pgId) => {
        if (authRole !== 'admin') {
            showError('Only admin can delete properties.');
            return;
        }

        const { error } = await supabase
            .from('pgs')
            .delete()
            .eq('id', pgId);

        if (error) {
            console.error('Error deleting PG:', error);
            showError('Could not delete this property.');
        } else {
            setPgs(pgs.filter(pg => pg.id !== pgId));
            info('Property deleted successfully.');
        }
    };

    // Tenant and Payment Request State
    const [tenants, setTenants] = useState([]);
    const [paymentRequests, setPaymentRequests] = useState([]);

    // Helper: Convert DB tenant to frontend format
    const transformTenantFromDB = (dbTenant) => ({
        id: dbTenant.id,
        adminId: dbTenant.admin_id,
        pgId: dbTenant.pg_id,
        name: dbTenant.name,
        email: dbTenant.email,
        phone: dbTenant.phone,
        profession: dbTenant.profession,
        aadhar: dbTenant.aadhar,
        roomNumber: dbTenant.room_number,
        rent: Number(dbTenant.rent),
        advance: Number(dbTenant.advance),
        withFood: dbTenant.with_food,
        joiningDate: dbTenant.joining_date
    });

    // Helper: Convert frontend tenant to DB format
    const transformTenantToDB = (tenant) => ({
        name: tenant.name,
        email: tenant.email ? tenant.email.trim().toLowerCase() : tenant.email,
        phone: tenant.phone,
        profession: tenant.profession,
        aadhar: tenant.aadhar,
        room_number: tenant.roomNumber,
        rent: Number(tenant.rent),
        advance: Number(tenant.advance),
        with_food: tenant.withFood,
        joining_date: tenant.joiningDate
    });

    // Helper: Convert DB payment to frontend format
    const transformPaymentFromDB = (dbPayment) => ({
        id: dbPayment.id,
        adminId: dbPayment.admin_id,
        pgId: dbPayment.pg_id,
        tenantId: dbPayment.tenant_id,
        tenantName: dbPayment.tenant_name,
        amount: Number(dbPayment.amount),
        description: dbPayment.description,
        status: dbPayment.status,
        date: dbPayment.date
    });

    // Fetch Tenants
    const fetchTenants = async (userId) => {
        const { data, error } = await supabase
            .from('tenants')
            .select('*')
            .eq('admin_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setTenants(data.map(transformTenantFromDB));
        } else if (error) {
            console.error('Error fetching tenants:', error);
        }
    };

    // Add Tenant
    const addTenant = async (tenantData) => {
        if (!user) return;
        if (!canAccessPg(tenantData.pgId)) {
            showError('You can only add tenant in your assigned PG.');
            return;
        }

        const currentAdminId = getCurrentAdminId();
        if (!currentAdminId) {
            showError('Could not resolve admin scope.');
            return;
        }

        const dbTenant = {
            ...transformTenantToDB(tenantData),
            admin_id: currentAdminId,
            pg_id: tenantData.pgId
        };

        const { data, error } = await supabase
            .from('tenants')
            .insert([dbTenant])
            .select()
            .single();

        if (error) {
            console.error('Error adding tenant:', error);
            showError('Could not register tenant. ' + error.message);
        } else {
            setTenants([transformTenantFromDB(data), ...tenants]);
            success('Tenant registered successfully.');
            const { data: pgData } = await supabase
                .from('pgs')
                .select('id,name,address,food_amount')
                .eq('id', tenantData.pgId)
                .single();
            await fetch(import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:4000/send-tenant-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'welcome',
                    tenant: {
                        ...tenantData,
                        id: data.id
                    },
                    pg: pgData ? { name: pgData.name, address: pgData.address, foodAmount: pgData.food_amount } : null,
                    defaultPassword: 'Tenant@1234'
                })
            });
        }
    };

    // Update Tenant
    const updateTenant = async (tenantId, updates) => {
        const { newPassword, changeSummary } = updates || {};
        const dbUpdates = transformTenantToDB(updates);

        const { data, error } = await supabase
            .from('tenants')
            .update(dbUpdates)
            .eq('id', tenantId)
            .select()
            .single();

        if (error) {
            console.error('Error updating tenant:', error);
            showError('Could not update tenant details. ' + error.message);
        } else {
            setTenants(tenants.map(t => t.id === tenantId ? transformTenantFromDB(data) : t));
            success('Tenant details updated successfully.');
            const { data: pgData } = await supabase
                .from('pgs')
                .select('id,name,address,food_amount')
                .eq('id', data.pgId)
                .single();
            await fetch(import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:4000/send-tenant-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update',
                    tenant: transformTenantFromDB(data),
                    pg: pgData ? { name: pgData.name, address: pgData.address, foodAmount: pgData.food_amount } : null,
                    newPassword,
                    changes: Array.isArray(changeSummary) ? changeSummary : []
                })
            });
        }
    };

    const getApiBaseUrl = () => {
        const explicitBase = import.meta.env.VITE_API_BASE_URL;
        if (explicitBase) return explicitBase.replace(/\/$/, '');

        const emailApi = import.meta.env.VITE_EMAIL_API_URL || 'http://localhost:4000/send-tenant-email';
        const fromEmailApi = emailApi.replace('/send-tenant-email', '').replace(/\/$/, '');
        if (/^https?:\/\//i.test(fromEmailApi)) return fromEmailApi;

        return 'http://localhost:4000';
    };

    const getAccessToken = async () => {
        const { data: sessionData } = await supabase.auth.getSession();
        return sessionData?.session?.access_token || '';
    };

    const createAdminInvite = async (email) => {
        const token = await getAccessToken();
        const res = await fetch(`${getApiBaseUrl()}/admin-invites`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ email: (email || '').trim().toLowerCase() })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data?.error || 'Failed to create admin invite');
        }
        return data;
    };

    const verifyAdminInvite = async (token) => {
        const res = await fetch(`${getApiBaseUrl()}/admin-invites/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { success: false, message: data?.error || 'Invalid invite' };
        }
        return { success: true, invite: data?.invite || null };
    };

    const acceptAdminInvite = async ({ token, name, password }) => {
        const res = await fetch(`${getApiBaseUrl()}/admin-invites/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, name, password })
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { success: false, message: data?.error || 'Failed to accept invite' };
        }
        return { success: true };
    };

    const createTenantLogin = async (tenantId, password) => {
        const token = await getAccessToken();
        const res = await fetch(`${getApiBaseUrl()}/create-tenant-login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ tenantId, password })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || 'Failed to create tenant login');
        }
        return true;
    };

    const getGuardianForPg = async (pgId) => {
        const token = await getAccessToken();
        const res = await fetch(`${getApiBaseUrl()}/guardian/${pgId}`, {
            method: 'GET',
            headers: {
                Authorization: token ? `Bearer ${token}` : ''
            }
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || 'Failed to fetch guardian');
        }
        const data = await res.json();
        return data?.guardian || null;
    };

    const assignGuardianForPg = async ({ pgId, guardianName, phone, password }) => {
        const token = await getAccessToken();
        const res = await fetch(`${getApiBaseUrl()}/guardian/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token ? `Bearer ${token}` : ''
            },
            body: JSON.stringify({ pgId, guardianName, phone, password })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || 'Failed to assign guardian');
        }
        const data = await res.json();
        return data?.guardian || null;
    };

    const removeGuardianForPg = async (pgId) => {
        const token = await getAccessToken();
        const res = await fetch(`${getApiBaseUrl()}/guardian/${pgId}`, {
            method: 'DELETE',
            headers: {
                Authorization: token ? `Bearer ${token}` : ''
            }
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || 'Failed to remove guardian');
        }
        return true;
    };

    const getTenantSupportContact = async (email) => {
        const trimmed = (email || '').trim();
        if (!trimmed) return null;

        const endpointPaths = [
            `${getApiBaseUrl()}/tenant-support-contact`,
            'http://localhost:4000/tenant-support-contact'
        ];

        let lastError = null;
        for (const endpoint of endpointPaths) {
            try {
                const url = new URL(endpoint);
                url.searchParams.set('email', trimmed);
                const res = await fetch(url.toString(), { method: 'GET' });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    lastError = new Error(data?.error || `Failed to fetch support contact (${res.status})`);
                    continue;
                }
                const data = await res.json();
                return data?.guardian || null;
            } catch (err) {
                lastError = err;
            }
        }

        if (lastError) {
            throw lastError;
        }
        return null;
    };

    // Delete Tenant
    const deleteTenant = async (tenantId) => {
        const { error } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenantId);

        if (error) {
            console.error('Error deleting tenant:', error);
            showError('Could not delete tenant. ' + error.message);
        } else {
            setTenants(tenants.filter(t => t.id !== tenantId));
            info('Tenant deleted successfully.');
        }
    };

    // Fetch Payment Requests
    const fetchPaymentRequests = async (userId) => {
        const { data, error } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('admin_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setPaymentRequests(data.map(transformPaymentFromDB));
        } else if (error) {
            console.error('Error fetching payment requests:', error);
        }
    };

    // Add Payment Request (for future tenant app or admin manual entry)
    const addPaymentRequest = async (requestData) => {
        if (!user) return;
        if (!canAccessPg(requestData.pgId)) {
            showError('You can only create requests for your assigned PG.');
            return;
        }

        const currentAdminId = getCurrentAdminId();
        if (!currentAdminId) {
            showError('Could not resolve admin scope.');
            return;
        }

        const dbRequest = {
            admin_id: currentAdminId,
            pg_id: requestData.pgId,
            tenant_id: requestData.tenantId,
            tenant_name: requestData.tenantName,
            amount: Number(requestData.amount),
            description: requestData.description,
            status: 'Pending'
        };

        const { data, error } = await supabase
            .from('payment_requests')
            .insert([dbRequest])
            .select()
            .single();

        if (error) {
            console.error('Error creating payment request:', error);
            showError('Could not create payment request. ' + error.message);
        } else {
            setPaymentRequests([transformPaymentFromDB(data), ...paymentRequests]);
            success('Payment request created successfully.');
        }
    };


    // Update Payment Request Status
    const updatePaymentRequestStatus = async (requestId, newStatus) => {
        const { data, error } = await supabase
            .from('payment_requests')
            .update({ status: newStatus })
            .eq('id', requestId)
            .select()
            .single();

        if (error) {
            console.error('Error updating payment request:', error);
            showError('Could not update payment request. ' + error.message);
        } else {
            setPaymentRequests(paymentRequests.map(pr => pr.id === requestId ? transformPaymentFromDB(data) : pr));
            success(`Payment request marked as ${newStatus.toLowerCase()}.`);
        }
    };

    const addTenantPaymentRequest = async ({ description, amount }) => {
        if (!tenantUser) return { success: false, message: 'Tenant not authenticated' };

        const dbRequest = {
            admin_id: tenantUser.adminId,
            pg_id: tenantUser.pgId,
            tenant_id: tenantUser.id,
            tenant_name: tenantUser.name,
            amount: Number(amount),
            description,
            status: 'Pending'
        };

        const { data, error } = await supabase
            .from('payment_requests')
            .insert([dbRequest])
            .select()
            .single();

        if (error) {
            return { success: false, message: error.message };
        }

        setTenantPaymentRequests(prev => [transformPaymentFromDB(data), ...prev]);
        return { success: true };
    };

    const updateTenantPassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            return { success: false, message: error.message };
        }
        return { success: true };
    };

    const updateAdminPassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            return { success: false, message: error.message };
        }
        return { success: true };
    };

    const sendPasswordResetEmail = async (email, redirectTo) => {
        const normalizedEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo
        });
        if (error) {
            return { success: false, message: error.message };
        }
        return { success: true };
    };

    // Real-time Subscriptions
    useEffect(() => {
        if (!user || authRole !== 'admin') return;

        // Subscribe to PGs changes
        const pgsSubscription = supabase
            .channel('pgs_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'pgs', filter: `admin_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setPgs(prev => [transformPgFromDB(payload.new), ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setPgs(prev => prev.map(p => p.id === payload.new.id ? transformPgFromDB(payload.new) : p));
                    } else if (payload.eventType === 'DELETE') {
                        setPgs(prev => prev.filter(p => p.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        // Subscribe to tenants changes
        const tenantsSubscription = supabase
            .channel('tenants_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'tenants', filter: `admin_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTenants(prev => [transformTenantFromDB(payload.new), ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setTenants(prev => prev.map(t => t.id === payload.new.id ? transformTenantFromDB(payload.new) : t));
                    } else if (payload.eventType === 'DELETE') {
                        setTenants(prev => prev.filter(t => t.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        // Subscribe to payment requests changes
        const paymentsSubscription = supabase
            .channel('payments_changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'payment_requests', filter: `admin_id=eq.${user.id}` },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setPaymentRequests(prev => [transformPaymentFromDB(payload.new), ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setPaymentRequests(prev => prev.map(pr => pr.id === payload.new.id ? transformPaymentFromDB(payload.new) : pr));
                    } else if (payload.eventType === 'DELETE') {
                        setPaymentRequests(prev => prev.filter(pr => pr.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(pgsSubscription);
            supabase.removeChannel(tenantsSubscription);
            supabase.removeChannel(paymentsSubscription);
        };
    }, [user, authRole]);

    return (
        <DataContext.Provider value={{
            user, tenantUser, tenantPg, tenantRoommates, tenantBills, tenantPaymentRequests, guardianProfile,
            authRole, login, loginAsOwner, loginAsTenant, loginAsGuardian, logout, register, loading,
            pgs, addPg, updatePg, deletePg,
            tenants, addTenant, updateTenant, deleteTenant,
            paymentRequests, addPaymentRequest, updatePaymentRequestStatus,
            addTenantPaymentRequest, updateTenantPassword, updateAdminPassword, sendPasswordResetEmail,
            createTenantLogin, getGuardianForPg, assignGuardianForPg, removeGuardianForPg, getTenantSupportContact,
            createAdminInvite, verifyAdminInvite, acceptAdminInvite
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
