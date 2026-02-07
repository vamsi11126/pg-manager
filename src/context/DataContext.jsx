import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pgs, setPgs] = useState([]);

    // Auth State Listener
    useEffect(() => {
        const fetchProfile = async (session) => {
            if (session?.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setUser({ ...session.user, ...profile });
                await fetchPGs(session.user.id);
                await fetchTenants(session.user.id);
                await fetchPaymentRequests(session.user.id);
            } else {
                setUser(null);
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
            setPgs(data);
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
            alert(error.message);
            return false;
        }
        return true;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const addPg = async (pgData) => {
        if (!user) {
            alert('User not authenticated');
            return;
        }

        const insertData = {
            name: pgData.name,
            address: pgData.address,
            admin_id: user.id,
            rooms: [],
            food_menu: [],
            wifi_details: [],
            electricity_data: {},
            e_bill_rate: 10,
            food_amount: 0
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
            setPgs([...pgs, data]);
            alert('PG added successfully!');
        }
    };

    const updatePg = async (updatedPg) => {
        const { error } = await supabase
            .from('pgs')
            .update(updatedPg)
            .eq('id', updatedPg.id);

        if (error) {
            console.error('Error updating PG:', error);
            alert('Failed to update PG');
        } else {
            setPgs(pgs.map(pg => pg.id === updatedPg.id ? updatedPg : pg));
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
        }
    };

    // Update Tenant
    const updateTenant = async (tenantId, updates) => {
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
        }
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
                        setPgs(prev => [payload.new, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setPgs(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
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
            user, login, logout, register, loading,
            pgs, addPg, updatePg, deletePg,
            tenants, addTenant, updateTenant, deleteTenant,
            paymentRequests, addPaymentRequest, updatePaymentRequestStatus
        }}>
            {!loading && children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
