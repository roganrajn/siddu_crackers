import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pool from '../config/db.js';
import { buildWhatsAppLink } from './whatsapp.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER?.trim();
  // Gmail app passwords are sometimes pasted with spaces — strip them
  const pass = process.env.SMTP_PASS?.replace(/\s/g, '') || '';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = port === 465;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    ...(port === 587 && { requireTLS: true }),
  });
}

let transporter = createTransporter();

export async function verifySmtpConnection() {
  if (!transporter) {
    console.warn('[email] SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS in backend/.env');
    return false;
  }
  try {
    await transporter.verify();
    console.log('[email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[email] SMTP verification failed:', error.message);
    if (error.code === 'EAUTH') {
      console.error(
        '[email] Gmail? Use an App Password (not your login password): https://myaccount.google.com/apppasswords'
      );
    }
    return false;
  }
}

/** Re-read .env and rebuild transporter (e.g. after config change without restart in dev). */
export function refreshTransporter() {
  dotenv.config({ path: path.join(__dirname, '../../.env') });
  transporter = createTransporter();
  return transporter;
}

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (date) =>
  new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });

function loadTemplate(filename) {
  return fs.readFileSync(path.join(__dirname, '../templates', filename), 'utf-8');
}

function renderTemplate(template, vars) {
  return Object.entries(vars).reduce(
    (html, [key, value]) => html.replaceAll(`{{${key}}}`, value ?? ''),
    template
  );
}

function buildItemsRowsAdmin(items) {
  return items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #EDE4DC;color:#2A1520;">${item.product_name}</td>
      <td style="padding:12px;border-bottom:1px solid #EDE4DC;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #EDE4DC;text-align:right;">${formatCurrency(item.price)}</td>
      <td style="padding:12px;border-bottom:1px solid #EDE4DC;text-align:right;font-weight:700;">${formatCurrency(item.subtotal)}</td>
    </tr>`).join('');
}

function buildItemsRowsCustomer(items) {
  return items.map((item) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #EDE4DC;color:#2A1520;">${item.product_name}</td>
      <td style="padding:12px;border-bottom:1px solid #EDE4DC;text-align:center;">${item.quantity}</td>
      <td style="padding:12px;border-bottom:1px solid #EDE4DC;text-align:right;font-weight:600;">${formatCurrency(item.subtotal)}</td>
    </tr>`).join('');
}

function getBrandName(settings) {
  return (settings?.company_name || 'Siddu Crackers').toUpperCase();
}

function buildLogoHtml(settings) {
  const brand = getBrandName(settings);
  if (settings.logo) {
    return `<img src="${settings.logo}" alt="${brand}" style="max-height:56px;width:auto;margin:0 auto;display:block;" />`;
  }
  return `<p style="margin:0;color:#fff;font-size:24px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">🎆 ${brand}</p>`;
}

async function getSettings() {
  const result = await pool.query('SELECT * FROM website_settings LIMIT 1');
  return result.rows[0] || {};
}

function getAdminRecipient(settings) {
  return process.env.ADMIN_EMAIL || settings.email || null;
}

function getCustomerPhoneRaw(phone) {
  return phone?.replace(/\s/g, '') || '';
}

function getCustomerWaLink(order) {
  const customerPhone = (order.whatsapp || order.phone || '').replace(/\D/g, '').slice(-10);
  if (!customerPhone) return '#';
  const msg = `Hi ${order.customer_name}, regarding your order ${order.order_number} from Siddu Crackers.`;
  return `https://wa.me/91${customerPhone}?text=${encodeURIComponent(msg)}`;
}

async function sendMail(options) {
  if (!transporter) {
    transporter = createTransporter();
  }
  if (!transporter) {
    console.error('[email] Cannot send — SMTP not configured');
    return false;
  }
  await transporter.sendMail(options);
  return true;
}

/**
 * Send admin notification email. Failures are logged; never throws.
 */
export async function sendAdminOrderEmail(order, items) {
  const settings = await getSettings();
  const recipient = getAdminRecipient(settings);
  if (!recipient) {
    console.error('[email] Admin recipient not configured (ADMIN_EMAIL or settings.email)');
    return false;
  }

  try {
    const template = loadTemplate('admin-order-email.html');
    const html = renderTemplate(template, {
      LOGO_HTML: buildLogoHtml(settings),
      ORDER_NUMBER: order.order_number,
      ORDER_DATE: formatDate(order.created_at || new Date()),
      CUSTOMER_NAME: order.customer_name,
      PHONE: order.phone,
      PHONE_RAW: getCustomerPhoneRaw(order.phone),
      WHATSAPP: order.whatsapp || order.phone || '—',
      EMAIL_ROW: order.email
        ? `<tr><td style="padding:8px 0;color:#6B5A62;">Email</td><td style="padding:8px 0;">${order.email}</td></tr>`
        : '',
      ADDRESS: order.address,
      CITY: order.city,
      STATE: order.state,
      PINCODE: order.pincode,
      REMARKS_ROW: order.remarks
        ? `<tr><td style="padding:8px 0;color:#6B5A62;">Remarks</td><td style="padding:8px 0;">${order.remarks}</td></tr>`
        : '',
      ITEMS_ROWS: buildItemsRowsAdmin(items),
      GRAND_TOTAL: formatCurrency(order.total_amount),
      CALL_CUSTOMER_LINK: `tel:${getCustomerPhoneRaw(order.phone)}`,
      WHATSAPP_CUSTOMER_LINK: getCustomerWaLink(order),
      COMPANY_NAME: getBrandName(settings),
    });

    await sendMail({
      from: `"${getBrandName(settings)}" <${process.env.SMTP_USER}>`,
      to: recipient,
      subject: `New Order Received - ${order.order_number}`,
      html,
    });
    console.log(`[email] Admin order email sent for ${order.order_number}`);
    return true;
  } catch (error) {
    console.error('[email] Admin order email failed:', error.message);
    if (error.code === 'EAUTH') {
      console.error('[email] Fix: use a Gmail App Password in SMTP_PASS — not your regular password');
    }
    return false;
  }
}

/**
 * Send customer confirmation email. Failures are logged; never throws.
 */
export async function sendCustomerOrderEmail(order, items) {
  if (!order.email) {
    return false;
  }

  const settings = await getSettings();

  try {
    const template = loadTemplate('customer-order-email.html');
    const businessPhone = settings.phone || '';
    const businessWhatsapp = settings.whatsapp || settings.phone || '';
    const whatsappLink = buildWhatsAppLink(businessWhatsapp, '') || '#';

    const html = renderTemplate(template, {
      LOGO_HTML: buildLogoHtml(settings),
      CUSTOMER_NAME: order.customer_name,
      COMPANY_NAME: getBrandName(settings),
      ORDER_NUMBER: order.order_number,
      ORDER_DATE: formatDate(order.created_at || new Date()),
      ITEMS_ROWS: buildItemsRowsCustomer(items),
      GRAND_TOTAL: formatCurrency(order.total_amount),
      BUSINESS_PHONE: businessPhone,
      BUSINESS_WHATSAPP: businessWhatsapp,
      PHONE_RAW: businessPhone.replace(/\s/g, ''),
      WHATSAPP_LINK: whatsappLink,
      WEBSITE_URL: process.env.FRONTEND_URL || 'https://sidducrackers.in',
    });

    await sendMail({
      from: `"${getBrandName(settings)}" <${process.env.SMTP_USER}>`,
      to: order.email,
      subject: `Your ${getBrandName(settings)} Order Has Been Received`,
      html,
    });
    console.log(`[email] Customer confirmation sent for ${order.order_number}`);
    return true;
  } catch (error) {
    console.error('[email] Customer order email failed:', error.message);
    if (error.code === 'EAUTH') {
      console.error('[email] Fix: use a Gmail App Password in SMTP_PASS — not your regular password');
    }
    return false;
  }
}

/**
 * Send both emails after order placement. Independent — one failure does not block the other.
 */
export async function sendOrderEmails(order, items) {
  await sendAdminOrderEmail(order, items);
  await sendCustomerOrderEmail(order, items);
}

export default { createTransporter, verifySmtpConnection, sendOrderEmails };
