export const normalizePhone = (phone = '') => phone.replace(/\D/g, '');

export const guardianEmailFromPhone = (phone) => {
    const normalized = normalizePhone(phone);
    return `guardian.${normalized}@guardian.pg-manager.local`;
};

export const isValidGuardianPhone = (phone = '') => /^\d{10}$/.test(normalizePhone(phone));
