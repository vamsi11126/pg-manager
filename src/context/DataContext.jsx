import React, { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('pg_user')) || null);
    const [owners, setOwners] = useState(JSON.parse(localStorage.getItem('pg_owners')) || []);
    const [pgs, setPgs] = useState(JSON.parse(localStorage.getItem('pg_data')) || []);
    const [tenants, setTenants] = useState(JSON.parse(localStorage.getItem('pg_tenants')) || []);
    const [paymentRequests, setPaymentRequests] = useState(() => {
        const stored = localStorage.getItem('pg_payment_requests');
        if (stored) return JSON.parse(stored);

        // Initial mock data if none exists
        return [
            { id: '1', tenantId: 't1', tenantName: 'Rahul Kumar', pgId: '1', amount: 8500, date: '2026-02-01', description: 'February Rent', status: 'Pending' },
            { id: '2', tenantId: 't2', tenantName: 'Sneha Singh', pgId: '1', amount: 7500, date: '2026-02-02', description: 'February Rent', status: 'Pending' },
            { id: '3', tenantId: 't1', tenantName: 'Rahul Kumar', pgId: '1', amount: 2000, date: '2026-01-15', description: 'Maintenance', status: 'Accepted' },
        ];
    });

    useEffect(() => {
        localStorage.setItem('pg_user', JSON.stringify(user));
    }, [user]);

    useEffect(() => {
        localStorage.setItem('pg_owners', JSON.stringify(owners));
    }, [owners]);

    useEffect(() => {
        localStorage.setItem('pg_data', JSON.stringify(pgs));
    }, [pgs]);

    useEffect(() => {
        localStorage.setItem('pg_tenants', JSON.stringify(tenants));
    }, [tenants]);

    useEffect(() => {
        localStorage.setItem('pg_payment_requests', JSON.stringify(paymentRequests));
    }, [paymentRequests]);

    const register = (ownerData) => {
        // Check if email already exists
        const emailExists = owners.some(owner => owner.email === ownerData.email);
        if (emailExists) {
            return { success: false, message: 'Email already registered' };
        }

        // Create new owner
        const newOwner = {
            id: Date.now().toString(),
            ...ownerData,
            createdAt: new Date().toISOString()
        };

        setOwners([...owners, newOwner]);
        return { success: true, message: 'Registration successful' };
    };

    const login = (email, password) => {
        // Validate against registered owners
        const owner = owners.find(o => o.email === email.toLowerCase() && o.password === password);

        if (owner) {
            const { password: _, ...userWithoutPassword } = owner;
            setUser(userWithoutPassword);
            return true;
        }

        alert('Invalid email or password');
        return false;
    };

    const logout = () => {
        setUser(null);
    };

    // Filtered data for the current user
    const myPgs = pgs.filter(pg => pg.ownerId === user?.id);
    const myTenants = tenants.filter(tenant => {
        const pg = pgs.find(p => p.id === tenant.pgId);
        return pg?.ownerId === user?.id;
    });
    const myPaymentRequests = paymentRequests.filter(req => {
        const pg = pgs.find(p => p.id === req.pgId);
        return pg?.ownerId === user?.id;
    });

    const addPg = (pg) => {
        const newPg = { ...pg, id: Date.now().toString(), ownerId: user.id };
        setPgs([...pgs, newPg]);
    };

    const updatePg = (updatedPg) => {
        setPgs(pgs.map(pg => pg.id === updatedPg.id ? updatedPg : pg));
    };

    const deletePg = (pgId) => {
        setPgs(pgs.filter(pg => pg.id !== pgId));
        // Optionally delete associated tenants
        setTenants(tenants.filter(t => t.pgId !== pgId));
    };

    const addTenant = (tenant) => {
        const newTenant = { ...tenant, id: Date.now().toString() };
        setTenants([...tenants, newTenant]);
    };

    const updateTenant = (updatedTenant) => {
        setTenants(tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t));
    };

    const deleteTenant = (tenantId) => {
        setTenants(tenants.filter(t => t.id !== tenantId));
    };

    const updatePaymentRequestStatus = (requestId, status) => {
        setPaymentRequests(paymentRequests.map(req =>
            req.id === requestId ? { ...req, status } : req
        ));
    };

    return (
        <DataContext.Provider value={{
            user, login, logout, register,
            pgs: myPgs, addPg, updatePg, deletePg,
            tenants: myTenants, addTenant, updateTenant, deleteTenant,
            paymentRequests: myPaymentRequests, updatePaymentRequestStatus
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
