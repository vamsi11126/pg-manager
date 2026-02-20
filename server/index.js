import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const {
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  APP_NAME = 'PG Manager',
  TENANT_LOGIN_URL = 'http://localhost:5173/tenant/login',
  PORT = 4000,
  SUPABASE_URL,
  SERVICE_ROLE_KEY,
  DEFAULT_TENANT_PASSWORD = '',
  GUARDIAN_LOGIN_DOMAIN = 'guardian.pg-manager.local',
  SUPER_ADMIN_EMAIL = '',
  ADMIN_INVITE_URL = 'http://localhost:5173',
  ADMIN_INVITE_EXPIRY_HOURS = '24',
  ALLOWED_ORIGINS = 'http://localhost:5173'
} = process.env;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const allowedOrigins = ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);

if ((!SMTP_USER || !SMTP_PASS || !SMTP_FROM) && IS_PRODUCTION) {
  throw new Error('Missing SMTP_USER, SMTP_PASS, or SMTP_FROM in environment');
}

if ((!SUPABASE_URL || !SERVICE_ROLE_KEY) && IS_PRODUCTION) {
  throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY in environment');
}

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked'));
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (IS_PRODUCTION) {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'");
  }
  next();
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

const supabaseAdmin = SUPABASE_URL && SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const normalizePhone = (phone = '') => phone.replace(/\D/g, '');
const guardianEmailFromPhone = (phone) => `guardian.${normalizePhone(phone)}@${GUARDIAN_LOGIN_DOMAIN}`;

const parseBearerToken = (req) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice('Bearer '.length).trim();
};

const validateStrongPassword = (password = '') => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include at least one symbol';
  return '';
};

const normalizeEmail = (email = '') => {
  const trimmed = email.trim();
  const unquoted = trimmed.replace(/^["']+|["']+$/g, '');
  return unquoted.trim().toLowerCase();
};
const inviteTokenHash = (token = '') => crypto.createHash('sha256').update(token).digest('hex');
const createInviteToken = () => crypto.randomBytes(32).toString('hex');
const inviteExpiryHours = (() => {
  const parsed = Number.parseInt(ADMIN_INVITE_EXPIRY_HOURS, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 24;
  return parsed;
})();

const isSuperAdmin = (email = '') => {
  const expected = normalizeEmail(SUPER_ADMIN_EMAIL || '');
  if (!expected) return false;
  return normalizeEmail(email) === expected;
};

const getRequester = async (req) => {
  if (!supabaseAdmin) throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY');

  const token = parseBearerToken(req);
  if (!token) {
    return { error: 'Missing authorization token', status: 401 };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData?.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const requester = authData.user;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id,role,email')
    .eq('id', requester.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: 'User profile not found', status: 403 };
  }

  return { requester, profile };
};

const ensurePgOwnedByAdmin = async ({ adminId, pgId }) => {
  const { data: pgRow, error: pgError } = await supabaseAdmin
    .from('pgs')
    .select('id,admin_id,name,address,food_amount')
    .eq('id', pgId)
    .maybeSingle();

  if (pgError || !pgRow) {
    return { error: 'PG not found', status: 404 };
  }
  if (pgRow.admin_id !== adminId) {
    return { error: 'Forbidden: PG does not belong to this admin', status: 403 };
  }

  return { pgRow };
};

const canManagePg = async ({ requesterId, role, pgId }) => {
  if (role === 'admin') {
    const owned = await ensurePgOwnedByAdmin({ adminId: requesterId, pgId });
    if (owned.error) return owned;
    return { allowed: true, adminId: requesterId, pgRow: owned.pgRow };
  }

  if (role === 'guardian') {
    const { data: guardianRow, error: guardianError } = await supabaseAdmin
      .from('guardians')
      .select('id,admin_id,pg_id,is_active')
      .eq('auth_user_id', requesterId)
      .eq('is_active', true)
      .maybeSingle();

    if (guardianError || !guardianRow) {
      return { error: 'Guardian assignment not found', status: 403 };
    }
    if (guardianRow.pg_id !== pgId) {
      return { error: 'Forbidden: guardian can manage only assigned PG', status: 403 };
    }

    const owned = await ensurePgOwnedByAdmin({ adminId: guardianRow.admin_id, pgId });
    if (owned.error) return owned;

    return { allowed: true, adminId: guardianRow.admin_id, pgRow: owned.pgRow };
  }

  return { error: 'Forbidden', status: 403 };
};

const sendTenantEmail = async ({ tenant, pg, action, newPassword, defaultPassword, changes }) => {
  const subject = action === 'update'
    ? `${APP_NAME} Tenant Details Updated`
    : `Welcome to ${APP_NAME}`;

  const intro = action === 'update'
    ? 'Your tenant details have been updated by the PG admin. Please review the updated information below.'
    : `Welcome to ${APP_NAME}! Your tenant account has been created.`;

  const passwordToUse = newPassword || defaultPassword || '';
  const passwordLine = passwordToUse
    ? `<p><strong>Login Password:</strong> ${passwordToUse}</p>`
    : '';

  const changesHtml = Array.isArray(changes) && changes.length > 0
    ? `
      <h3 style="margin:16px 0 6px 0;">What Changed</h3>
      <ul style="padding-left:16px;margin:8px 0;">
        ${changes.map(c => `<li><strong>${c.field}:</strong> ${c.from} → ${c.to}</li>`).join('')}
      </ul>
    `
    : '';

  const detailsHtml = `
    <ul style="padding-left:16px;margin:8px 0;">
      <li><strong>PG:</strong> ${pg?.name ?? '-'}</li>
      <li><strong>Address:</strong> ${pg?.address ?? '-'}</li>
      <li><strong>Room:</strong> ${tenant.roomNumber}</li>
      <li><strong>Rent:</strong> ₹${tenant.rent}</li>
      <li><strong>Advance:</strong> ₹${tenant.advance}</li>
      <li><strong>Food:</strong> ${tenant.withFood ? 'Included' : 'Not included'}</li>
      <li><strong>Food Amount:</strong> ₹${pg?.foodAmount ?? 0}</li>
      <li><strong>Joining Date:</strong> ${tenant.joiningDate}</li>
      <li><strong>Phone:</strong> ${tenant.phone}</li>
      <li><strong>Email:</strong> ${tenant.email}</li>
      <li><strong>Profession:</strong> ${tenant.profession ?? '-'}</li>
      <li><strong>Aadhar:</strong> ${tenant.aadhar}</li>
    </ul>
  `;

  const textChanges = Array.isArray(changes) && changes.length > 0
    ? `\nWhat Changed:\n${changes.map(c => `- ${c.field}: ${c.from} -> ${c.to}`).join('\n')}\n`
    : '';

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 8px 0;">${subject}</h2>
      <p>Hi ${tenant.name},</p>
      <p>${intro}</p>
      <p><strong>Login Email:</strong> ${tenant.email}</p>
      ${passwordLine}
      <p><strong>Tenant Login:</strong> <a href="${TENANT_LOGIN_URL}">${TENANT_LOGIN_URL}</a></p>
      <p>Please log in and change your password after first login.</p>
      ${changesHtml}
      <h3 style="margin:16px 0 6px 0;">Your Details</h3>
      ${detailsHtml}
      <p style="margin-top:16px;">If anything looks incorrect, please contact your PG admin.</p>
    </div>
  `;

  const text = `Hi ${tenant.name},

${intro}

Login Email: ${tenant.email}
${action === 'welcome' || newPassword ? `Login Password: ${passwordToUse}\n` : ''}
Tenant Login: ${TENANT_LOGIN_URL}
${textChanges}
Your Details:
- PG: ${pg?.name ?? '-'}
- Address: ${pg?.address ?? '-'}
- Room: ${tenant.roomNumber}
- Rent: ₹${tenant.rent}
- Advance: ₹${tenant.advance}
- Food: ${tenant.withFood ? 'Included' : 'Not included'}
- Food Amount: ₹${pg?.foodAmount ?? 0}
- Joining Date: ${tenant.joiningDate}
- Phone: ${tenant.phone}
- Email: ${tenant.email}
- Profession: ${tenant.profession ?? '-'}
- Aadhar: ${tenant.aadhar}

Please log in and change your password after first login.
If anything looks incorrect, please contact your PG admin.
`;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: tenant.email,
    subject,
    html,
    text
  });
};

const sendAdminInviteEmail = async ({ inviteEmail, inviterEmail, inviteToken, expiresAt }) => {
  const registerBase = ADMIN_INVITE_URL.replace(/\/$/, '');
  const inviteLink = `${registerBase}/register?invite=${encodeURIComponent(inviteToken)}`;
  const expiresText = new Date(expiresAt).toLocaleString();
  const subject = `${APP_NAME} Admin Invite`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 8px 0;">${subject}</h2>
      <p>You have been invited to join ${APP_NAME} as an admin.</p>
      <p><strong>Invited by:</strong> ${inviterEmail}</p>
      <p><strong>Invite expires:</strong> ${expiresText}</p>
      <p><a href="${inviteLink}">Accept Admin Invite</a></p>
      <p>If you were not expecting this invite, you can ignore this email.</p>
    </div>
  `;

  const text = `You have been invited to join ${APP_NAME} as an admin.

Invited by: ${inviterEmail}
Invite expires: ${expiresText}
Accept invite: ${inviteLink}

If you were not expecting this invite, ignore this email.`;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: inviteEmail,
    subject,
    html,
    text
  });
};

const sendVisitRequestEmail = async ({ adminEmail, adminName, pgName, pgAddress, visitorName, visitorEmail, visitorPhone }) => {
  if (!adminEmail) return;

  const subject = `${APP_NAME} New Visit Request - ${pgName}`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.6;color:#111">
      <h2 style="margin:0 0 8px 0;">${subject}</h2>
      <p>Hi ${adminName || 'Admin'},</p>
      <p>You received a new visit request from your landing page.</p>
      <ul style="padding-left:16px;margin:8px 0;">
        <li><strong>PG:</strong> ${pgName}</li>
        <li><strong>Address:</strong> ${pgAddress || '-'}</li>
        <li><strong>Name:</strong> ${visitorName}</li>
        <li><strong>Email:</strong> ${visitorEmail}</li>
        <li><strong>Phone:</strong> ${visitorPhone}</li>
      </ul>
      <p>Please contact the visitor to schedule a visit.</p>
    </div>
  `;

  const text = `New visit request received.

PG: ${pgName}
Address: ${pgAddress || '-'}
Visitor Name: ${visitorName}
Visitor Email: ${visitorEmail}
Visitor Phone: ${visitorPhone}

Please contact the visitor to schedule a visit.`;

  await transporter.sendMail({
    from: SMTP_FROM,
    to: adminEmail,
    subject,
    html,
    text
  });
};

app.post('/send-tenant-email', async (req, res) => {
  try {
    const { tenant, pg, action, newPassword, defaultPassword, changes } = req.body || {};

    if (!tenant || !tenant.email) {
      return res.status(400).json({ error: 'Missing tenant data' });
    }

    await sendTenantEmail({ tenant, pg, action, newPassword, defaultPassword, changes });
    return res.json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/create-tenant-login', async (req, res) => {
  try {
    const auth = await getRequester(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ error: auth.error });
    }

    const { tenantId, password } = req.body || {};
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id,admin_id,pg_id,name,email,phone,profession,aadhar,room_number,rent,advance,with_food,joining_date')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const manageCheck = await canManagePg({
      requesterId: auth.requester.id,
      role: auth.profile.role,
      pgId: tenantRow.pg_id
    });
    if (manageCheck.error) {
      return res.status(manageCheck.status || 403).json({ error: manageCheck.error });
    }

    const finalPassword = password || DEFAULT_TENANT_PASSWORD;

    let authUserId = null;
    if (!authUserId) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: tenantRow.email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { role: 'tenant' }
      });

      if (createError) {
        const msg = (createError.message || '').toLowerCase();
        if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
          const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
            page: 1,
            perPage: 1000
          });
          if (listError) {
            return res.status(400).json({ error: `User exists but could not fetch auth user: ${listError.message}` });
          }
          const existing = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === tenantRow.email.toLowerCase());
          if (!existing) {
            return res.status(400).json({ error: 'User already registered, but not found in listUsers' });
          }
          authUserId = existing.id;
          await supabaseAdmin.auth.admin.updateUserById(authUserId, { password: finalPassword });
        } else {
          return res.status(400).json({ error: createError.message });
        }
      } else {
        authUserId = created.user?.id;
      }
    } else if (password) {
      await supabaseAdmin.auth.admin.updateUserById(authUserId, { password: finalPassword });
    }

    if (authUserId) {
      await supabaseAdmin.from('profiles').upsert({
        id: authUserId,
        email: tenantRow.email,
        full_name: tenantRow.name,
        role: 'tenant'
      });
    }

    const tenant = {
      id: tenantRow.id,
      name: tenantRow.name,
      email: tenantRow.email,
      phone: tenantRow.phone,
      profession: tenantRow.profession,
      aadhar: tenantRow.aadhar,
      roomNumber: tenantRow.room_number,
      rent: Number(tenantRow.rent),
      advance: Number(tenantRow.advance),
      withFood: tenantRow.with_food,
      joiningDate: tenantRow.joining_date
    };
    const pg = manageCheck.pgRow ? { name: manageCheck.pgRow.name, address: manageCheck.pgRow.address, foodAmount: manageCheck.pgRow.food_amount } : null;

    await sendTenantEmail({
      tenant,
      pg,
      action: 'welcome',
      defaultPassword: finalPassword
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Create login error:', err);
    return res.status(500).json({ error: 'Failed to create tenant login' });
  }
});

app.get('/guardian/:pgId', async (req, res) => {
  try {
    const auth = await getRequester(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ error: auth.error });
    }
    if (auth.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can view guardian assignment' });
    }

    const pgId = req.params.pgId;
    const owned = await ensurePgOwnedByAdmin({ adminId: auth.requester.id, pgId });
    if (owned.error) {
      return res.status(owned.status || 403).json({ error: owned.error });
    }

    const { data: guardianRow, error } = await supabaseAdmin
      .from('guardians')
      .select('id,guardian_name,phone,guardian_email,is_active,created_at,updated_at')
      .eq('pg_id', pgId)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      success: true,
      guardian: guardianRow || null
    });
  } catch (err) {
    console.error('Guardian fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch guardian' });
  }
});

app.post('/guardian/assign', async (req, res) => {
  try {
    const auth = await getRequester(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ error: auth.error });
    }
    if (auth.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can assign guardians' });
    }

    const { pgId, guardianName, phone, password } = req.body || {};
    if (!pgId) return res.status(400).json({ error: 'pgId is required' });
    if (!guardianName || !guardianName.trim()) {
      return res.status(400).json({ error: 'Guardian name is required' });
    }

    const normalizedPhone = normalizePhone(phone);
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    const passwordError = validateStrongPassword(password || '');
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const owned = await ensurePgOwnedByAdmin({ adminId: auth.requester.id, pgId });
    if (owned.error) {
      return res.status(owned.status || 403).json({ error: owned.error });
    }

    const guardianEmail = guardianEmailFromPhone(normalizedPhone);
    let authUserId = null;

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: guardianEmail,
      password,
      email_confirm: true,
      user_metadata: { role: 'guardian', phone: normalizedPhone, name: guardianName.trim() }
    });

    if (createError) {
      const msg = (createError.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000
        });
        if (listError) {
          return res.status(400).json({ error: `User exists but could not fetch auth user: ${listError.message}` });
        }
        const existing = (usersData?.users || []).find(u => (u.email || '').toLowerCase() === guardianEmail.toLowerCase());
        if (!existing) {
          return res.status(400).json({ error: 'Guardian user already exists, but could not be found.' });
        }
        authUserId = existing.id;
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password,
          user_metadata: { role: 'guardian', phone: normalizedPhone, name: guardianName.trim() }
        });
      } else {
        return res.status(400).json({ error: createError.message });
      }
    } else {
      authUserId = created.user?.id;
    }

    if (!authUserId) {
      return res.status(500).json({ error: 'Could not resolve guardian auth user' });
    }

    await supabaseAdmin.from('profiles').upsert({
      id: authUserId,
      email: guardianEmail,
      full_name: guardianName.trim(),
      role: 'guardian'
    });

    await supabaseAdmin
      .from('guardians')
      .update({ is_active: false })
      .eq('pg_id', pgId);

    await supabaseAdmin
      .from('guardians')
      .update({ is_active: false })
      .eq('auth_user_id', authUserId);

    const { data: guardianRow, error: guardianInsertError } = await supabaseAdmin
      .from('guardians')
      .insert({
        admin_id: auth.requester.id,
        pg_id: pgId,
        auth_user_id: authUserId,
        guardian_name: guardianName.trim(),
        phone: normalizedPhone,
        guardian_email: guardianEmail,
        is_active: true
      })
      .select('id,guardian_name,phone,guardian_email,is_active,updated_at')
      .single();

    if (guardianInsertError) {
      return res.status(500).json({ error: guardianInsertError.message });
    }

    return res.json({ success: true, guardian: guardianRow });
  } catch (err) {
    console.error('Guardian assign error:', err);
    return res.status(500).json({ error: 'Failed to assign guardian' });
  }
});

app.get('/tenant-support-contact', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });
    }

    const normalizedEmail = (req.query.email || '').toString().trim().toLowerCase();
    if (!normalizedEmail) return res.status(400).json({ error: 'email is required' });

    let tenantRow = null;
    const { data: tenantExact, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id,pg_id,email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (tenantError) {
      return res.json({ success: true, guardian: null });
    }
    tenantRow = tenantExact || null;

    if (!tenantRow) {
      const { data: tenantCandidates, error: tenantCandidatesError } = await supabaseAdmin
        .from('tenants')
        .select('id,pg_id,email')
        .ilike('email', `%${normalizedEmail}%`)
        .limit(20);

      if (!tenantCandidatesError && Array.isArray(tenantCandidates)) {
        tenantRow = tenantCandidates.find(
          (t) => (t.email || '').toString().trim().toLowerCase() === normalizedEmail
        ) || null;
      }
    }

    if (!tenantRow) {
      return res.json({ success: true, guardian: null });
    }

    const { data: guardianRow, error: guardianError } = await supabaseAdmin
      .from('guardians')
      .select('guardian_name,phone,is_active')
      .eq('pg_id', tenantRow.pg_id)
      .or('is_active.eq.true,is_active.is.null')
      .maybeSingle();

    if (guardianError || !guardianRow) {
      return res.json({ success: true, guardian: null });
    }

    return res.json({
      success: true,
      guardian: {
        name: guardianRow.guardian_name,
        phone: guardianRow.phone
      }
    });
  } catch (err) {
    console.error('Tenant support contact lookup error:', err);
    return res.status(500).json({ error: 'Failed to fetch support contact' });
  }
});

app.post('/visit-requests', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });
    }

    const pgId = (req.body?.pgId || '').toString().trim();
    const visitorName = (req.body?.name || '').toString().trim();
    const visitorEmail = normalizeEmail((req.body?.email || '').toString());
    const visitorPhone = (req.body?.phone || '').toString().trim();

    if (!pgId) return res.status(400).json({ error: 'pgId is required' });
    if (!visitorName) return res.status(400).json({ error: 'Name is required' });
    if (!visitorEmail || !/\S+@\S+\.\S+/.test(visitorEmail)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!/^\d{10}$/.test(visitorPhone.replace(/\D/g, ''))) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    const { data: pgRow, error: pgError } = await supabaseAdmin
      .from('pgs')
      .select('id,admin_id,name,address')
      .eq('id', pgId)
      .maybeSingle();

    if (pgError || !pgRow) {
      return res.status(404).json({ error: 'PG not found' });
    }

    const { error: insertError } = await supabaseAdmin
      .from('visit_requests')
      .insert({
        pg_id: pgRow.id,
        admin_id: pgRow.admin_id,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        visitor_phone: visitorPhone.replace(/\D/g, '')
      });

    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }

    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('email,full_name')
      .eq('id', pgRow.admin_id)
      .maybeSingle();

    try {
      await sendVisitRequestEmail({
        adminEmail: adminProfile?.email || '',
        adminName: adminProfile?.full_name || 'Admin',
        pgName: pgRow.name,
        pgAddress: pgRow.address,
        visitorName,
        visitorEmail,
        visitorPhone: visitorPhone.replace(/\D/g, '')
      });
    } catch (mailErr) {
      console.error('Visit request email send error:', mailErr);
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Visit request create error:', err);
    return res.status(500).json({ error: 'Failed to submit visit request' });
  }
});

app.get('/public/pg/:pgId', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Server not configured' });
    }

    const pgId = (req.params.pgId || '').trim();
    if (!pgId) {
      return res.status(400).json({ error: 'pgId is required' });
    }

    const { data: pgRow, error: pgError } = await supabaseAdmin
      .from('pgs')
      .select('*')
      .eq('id', pgId)
      .maybeSingle();

    if (pgError || !pgRow) {
      return res.status(404).json({ error: 'PG not found' });
    }

    let admin = null;
    if (pgRow.admin_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name,email,phone')
        .eq('id', pgRow.admin_id)
        .maybeSingle();

      if (profile) {
        admin = {
          name: profile.full_name || 'PG Admin',
          email: profile.email || '',
          phone: profile.phone || ''
        };
      }
    }

    return res.json({ success: true, pg: pgRow, admin });
  } catch (err) {
    console.error('Public PG fetch error:', err);
    return res.status(500).json({ error: 'Failed to fetch PG details' });
  }
});

app.delete('/guardian/:pgId', async (req, res) => {
  try {
    const auth = await getRequester(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ error: auth.error });
    }
    if (auth.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admin can remove guardians' });
    }

    const pgId = req.params.pgId;
    const owned = await ensurePgOwnedByAdmin({ adminId: auth.requester.id, pgId });
    if (owned.error) {
      return res.status(owned.status || 403).json({ error: owned.error });
    }

    const { data: existingGuardian } = await supabaseAdmin
      .from('guardians')
      .select('id')
      .eq('pg_id', pgId)
      .eq('is_active', true)
      .maybeSingle();

    if (!existingGuardian) {
      return res.json({ success: true, removed: false });
    }

    const { error } = await supabaseAdmin
      .from('guardians')
      .delete()
      .eq('id', existingGuardian.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, removed: true });
  } catch (err) {
    console.error('Guardian remove error:', err);
    return res.status(500).json({ error: 'Failed to remove guardian' });
  }
});

app.post('/admin-invites', async (req, res) => {
  try {
    const auth = await getRequester(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ error: auth.error });
    }
    if (auth.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create invites' });
    }
    const requesterEmail = auth.requester?.email || auth.profile?.email || '';
    if (!isSuperAdmin(requesterEmail)) {
      return res.status(403).json({ error: 'Only SUPER_ADMIN_EMAIL can create admin invites' });
    }

    const inviteEmail = normalizeEmail(req.body?.email || '');
    if (!inviteEmail) {
      return res.status(400).json({ error: 'Invite email is required' });
    }
    if (!/\S+@\S+\.\S+/.test(inviteEmail)) {
      return res.status(400).json({ error: 'Invite email is invalid' });
    }

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', inviteEmail)
      .eq('role', 'admin')
      .maybeSingle();
    if (existingProfile) {
      return res.status(400).json({ error: 'An admin account already exists for this email' });
    }

    await supabaseAdmin
      .from('admin_invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('email', inviteEmail)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .lt('expires_at', new Date().toISOString());

    const { data: existingInvite } = await supabaseAdmin
      .from('admin_invites')
      .select('id')
      .eq('email', inviteEmail)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInvite) {
      return res.status(400).json({ error: 'An active invite already exists for this email' });
    }

    const rawToken = createInviteToken();
    const tokenHash = inviteTokenHash(rawToken);
    const expiresAt = new Date(Date.now() + inviteExpiryHours * 60 * 60 * 1000).toISOString();

    const { error: inviteInsertError } = await supabaseAdmin
      .from('admin_invites')
      .insert({
        email: inviteEmail,
        invited_by: auth.requester.id,
        token_hash: tokenHash,
        expires_at: expiresAt
      });

    if (inviteInsertError) {
      return res.status(500).json({ error: inviteInsertError.message });
    }

    await sendAdminInviteEmail({
      inviteEmail,
      inviterEmail: requesterEmail || 'admin',
      inviteToken: rawToken,
      expiresAt
    });

    return res.json({ success: true, expiresAt });
  } catch (err) {
    console.error('Create admin invite error:', err);
    return res.status(500).json({ error: 'Failed to create admin invite' });
  }
});

app.post('/admin-invites/verify', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });
    }

    const token = (req.body?.token || '').toString().trim();
    if (!token) {
      return res.status(400).json({ error: 'Invite token is required' });
    }

    const tokenHash = inviteTokenHash(token);
    const { data: inviteRow, error } = await supabaseAdmin
      .from('admin_invites')
      .select('id,email,expires_at,accepted_at,revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error || !inviteRow) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }
    if (inviteRow.revoked_at) {
      return res.status(400).json({ error: 'Invite was revoked' });
    }
    if (inviteRow.accepted_at) {
      return res.status(400).json({ error: 'Invite already used' });
    }
    if (new Date(inviteRow.expires_at).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Invite expired' });
    }

    return res.json({
      success: true,
      invite: {
        email: inviteRow.email,
        expiresAt: inviteRow.expires_at
      }
    });
  } catch (err) {
    console.error('Verify admin invite error:', err);
    return res.status(500).json({ error: 'Failed to verify invite' });
  }
});

app.post('/admin-invites/accept', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });
    }

    const token = (req.body?.token || '').toString().trim();
    const fullName = (req.body?.name || '').toString().trim();
    const password = (req.body?.password || '').toString();

    if (!token) return res.status(400).json({ error: 'Invite token is required' });
    if (!fullName) return res.status(400).json({ error: 'Name is required' });

    const passwordError = validateStrongPassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const tokenHash = inviteTokenHash(token);
    const { data: inviteRow, error: inviteError } = await supabaseAdmin
      .from('admin_invites')
      .select('id,email,expires_at,accepted_at,revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (inviteError || !inviteRow) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }
    if (inviteRow.revoked_at) {
      return res.status(400).json({ error: 'Invite was revoked' });
    }
    if (inviteRow.accepted_at) {
      return res.status(400).json({ error: 'Invite already used' });
    }
    if (new Date(inviteRow.expires_at).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Invite expired' });
    }

    const inviteEmail = normalizeEmail(inviteRow.email);
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: inviteEmail,
      password,
      email_confirm: true,
      user_metadata: { role: 'admin', full_name: fullName }
    });

    if (createError || !created?.user?.id) {
      return res.status(400).json({ error: createError?.message || 'Could not create admin user' });
    }

    const authUserId = created.user.id;
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUserId,
        email: inviteEmail,
        full_name: fullName,
        role: 'admin'
      });

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    const { error: inviteUpdateError } = await supabaseAdmin
      .from('admin_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', inviteRow.id)
      .is('accepted_at', null)
      .is('revoked_at', null);

    if (inviteUpdateError) {
      return res.status(500).json({ error: inviteUpdateError.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Accept admin invite error:', err);
    return res.status(500).json({ error: 'Failed to accept invite' });
  }
});

app.delete('/admin-invites/:inviteId', async (req, res) => {
  try {
    const auth = await getRequester(req);
    if (auth.error) {
      return res.status(auth.status || 401).json({ error: auth.error });
    }
    if (auth.profile.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can revoke invites' });
    }
    const requesterEmail = auth.requester?.email || auth.profile?.email || '';
    if (!isSuperAdmin(requesterEmail)) {
      return res.status(403).json({ error: 'Only SUPER_ADMIN_EMAIL can revoke invites' });
    }

    const inviteId = req.params.inviteId;
    const { error } = await supabaseAdmin
      .from('admin_invites')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', inviteId)
      .is('accepted_at', null)
      .is('revoked_at', null);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Revoke admin invite error:', err);
    return res.status(500).json({ error: 'Failed to revoke invite' });
  }
});

if (!IS_PRODUCTION) {
  app.listen(PORT, () => {
    console.log(`Email server listening on http://localhost:${PORT}`);
  });
}

export default app;
