import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [authRole, setAuthRole] = useState(null);
    const [tenantUser, setTenantUser] = useState(null);
    const [tenantPg, setTenantPg] = useState(null);
    const [tenantRoommates, setTenantRoommates] = useState([]);
    const [tenantBills, setTenantBills] = useState([]);
    const [tenantPaymentRequests, setTenantPaymentRequests] = useState([]);
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
        food_amount: pg.foodAmount ?? pg.food_amount ?? 0
    });

    const fetchTenantByAuthId = async (authUserId, email) => {
        const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('auth_user_id', authUserId)
            .single();

        let resolvedTenant = tenantData;

        if (tenantError || !tenantData) {
            if (email) {
                const { data: tenantByEmail } = await supabase
                    .from('tenants')
                    .select('*')
                    .eq('email', email)
                    .single();
                resolvedTenant = tenantByEmail || null;

                if (resolvedTenant && !resolvedTenant.auth_user_id) {
                    await supabase
                        .from('tenants')
                        .update({ auth_user_id: authUserId })
                        .eq('id', resolvedTenant.id);
                }
            }
        }

        if (!resolvedTenant) {
            setTenantUser(null);
            return;
        }

        const tenant = transformTenantFromDB(resolvedTenant);
        setTenantUser(tenant);

        const { data: pgData } = await supabase
            .from('pgs')
            .select('*')
            .eq('id', tenant.pgId)
            .single();

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

        const { data: bills } = await supabase
            .from('tenant_bills')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('due_date', { ascending: false });
        setTenantBills(bills || []);
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
                    setTenantUser(null);
                    await fetchPGs(session.user.id);
                    await fetchTenants(session.user.id);
                    await fetchPaymentRequests(session.user.id);
                } else {
                    setAuthRole('tenant');
                    setUser(null);
                    await fetchTenantByAuthId(session.user.id, session.user.email);
                }
            } else {
                setUser(null);
                setTenantUser(null);
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

    const register = async (ownerData) => {
        const { email, password, name, phone, address } = ownerData;

        // 1. Sign Up
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) return { success: false, message: authError.message };

        if (authData.user) {
            // 2. Create Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: authData.user.id,
                        email,
                        full_name: name,
                        role: 'admin' // Defaulting to admin for PG owners
                    }
                ]);

            if (profileError) {
                return { success: false, message: profileError.message };
            }

            return { success: true, message: 'Registration successful! Please login.' };
        }
        return { success: false, message: 'Registration failed.' };
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
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
            return { success: false, message: 'This login is for owners only. Please use tenant login.' };
        }
        return { success: true };
    };

    const loginAsTenant = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
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

        if (profile?.role === 'admin') {
            await supabase.auth.signOut();
            return { success: false, message: 'This login is for tenants only. Please use owner login.' };
        }
        return { success: true };
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setTenantUser(null);
        setAuthRole(null);
    };

    const addPg = async (pgData) => {
        if (!user) {
            alert('User not authenticated');
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
            alert(`Failed to add PG: ${error.message}\nDetails: ${error.details || 'No additional details'}\nHint: ${error.hint || 'Check RLS policies and schema'}`);
        } else {
            console.log('PG added successfully:', data);
            setPgs([...pgs, transformPgFromDB(data)]);
            alert('PG added successfully!');
        }
    };

    const updatePg = async (updatedPg) => {
        const { data, error } = await supabase
            .from('pgs')
            .update(transformPgToDB(updatedPg))
            .eq('id', updatedPg.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating PG:', error);
            alert('Failed to update PG: ' + error.message);
        } else {
            const next = transformPgFromDB(data);
            setPgs(pgs.map(pg => pg.id === updatedPg.id ? next : pg));
        }
    };

    const deletePg = async (pgId) => {
        const { error } = await supabase
            .from('pgs')
            .delete()
            .eq('id', pgId);

        if (error) {
            console.error('Error deleting PG:', error);
            alert('Failed to delete PG');
        } else {
            setPgs(pgs.filter(pg => pg.id !== pgId));
        }
    };

    // Tenant and Payment Request State
    const [tenants, setTenants] = useState([]);
    const [paymentRequests, setPaymentRequests] = useState([]);

    // Helper: Convert DB tenant to frontend format
    const transformTenantFromDB = (dbTenant) => ({
        id: dbTenant.id,
        adminId: dbTenant.admin_id,
        authUserId: dbTenant.auth_user_id,
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
        email: tenant.email,
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

        const dbTenant = {
            ...transformTenantToDB(tenantData),
            admin_id: user.id,
            pg_id: tenantData.pgId
        };

        const { data, error } = await supabase
            .from('tenants')
            .insert([dbTenant])
            .select()
            .single();

        if (error) {
            console.error('Error adding tenant:', error);
            alert('Failed to add tenant: ' + error.message);
        } else {
            setTenants([transformTenantFromDB(data), ...tenants]);
            alert('Tenant registered successfully!');
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
            alert('Failed to update tenant: ' + error.message);
        } else {
            setTenants(tenants.map(t => t.id === tenantId ? transformTenantFromDB(data) : t));
            alert('Tenant updated successfully!');
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

    const createTenantLogin = async (tenantId, password) => {
        const res = await fetch(import.meta.env.VITE_EMAIL_API_URL?.replace('/send-tenant-email', '/create-tenant-login') || 'http://localhost:4000/create-tenant-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tenantId, password })
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data?.error || 'Failed to create tenant login');
        }
        return true;
    };

    // Delete Tenant
    const deleteTenant = async (tenantId) => {
        const { error } = await supabase
            .from('tenants')
            .delete()
            .eq('id', tenantId);

        if (error) {
            console.error('Error deleting tenant:', error);
            alert('Failed to delete tenant: ' + error.message);
        } else {
            setTenants(tenants.filter(t => t.id !== tenantId));
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

        const dbRequest = {
            admin_id: user.id,
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
            alert('Failed to create payment request: ' + error.message);
        } else {
            setPaymentRequests([transformPaymentFromDB(data), ...paymentRequests]);
            alert('Payment request created successfully!');
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
            alert('Failed to update payment request: ' + error.message);
        } else {
            setPaymentRequests(paymentRequests.map(pr => pr.id === requestId ? transformPaymentFromDB(data) : pr));
            alert(`Payment request ${newStatus.toLowerCase()} successfully!`);
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

    // Real-time Subscriptions
    useEffect(() => {
        if (!user) return;

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
    }, [user]);

    return (
        <DataContext.Provider value={{
            user, tenantUser, tenantPg, tenantRoommates, tenantBills, tenantPaymentRequests,
            authRole, login, loginAsOwner, loginAsTenant, logout, register, loading,
            pgs, addPg, updatePg, deletePg,
            tenants, addTenant, updateTenant, deleteTenant,
            paymentRequests, addPaymentRequest, updatePaymentRequestStatus,
            addTenantPaymentRequest, updateTenantPassword,
            createTenantLogin
        }}>
            {!loading && children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
