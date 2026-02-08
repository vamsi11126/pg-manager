import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
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
  DEFAULT_TENANT_PASSWORD = 'Tenant@1234'
} = process.env;

if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
  console.error('Missing SMTP_USER, SMTP_PASS, or SMTP_FROM in .env');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

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
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'Missing SUPABASE_URL or SERVICE_ROLE_KEY' });
    }

    const { tenantId, password } = req.body || {};
    if (!tenantId) {
      return res.status(400).json({ error: 'tenantId is required' });
    }

    const { data: tenantRow, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .select('id,admin_id,pg_id,name,email,phone,profession,aadhar,room_number,rent,advance,with_food,joining_date,auth_user_id')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenantRow) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { data: pgRow } = await supabaseAdmin
      .from('pgs')
      .select('id,name,address,food_amount')
      .eq('id', tenantRow.pg_id)
      .single();

    const finalPassword = password || DEFAULT_TENANT_PASSWORD;

    let authUserId = tenantRow.auth_user_id;
    if (!authUserId) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: tenantRow.email,
        password: finalPassword,
        email_confirm: true,
        user_metadata: { role: 'tenant' }
      });

      if (createError) {
        return res.status(400).json({ error: createError.message });
      }
      authUserId = created.user?.id;
      await supabaseAdmin.from('tenants').update({ auth_user_id: authUserId }).eq('id', tenantRow.id);
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
    const pg = pgRow ? { name: pgRow.name, address: pgRow.address, foodAmount: pgRow.food_amount } : null;

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

app.listen(PORT, () => {
  console.log(`Email server listening on http://localhost:${PORT}`);
});
