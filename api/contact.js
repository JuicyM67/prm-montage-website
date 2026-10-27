const { Resend } = require('resend');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY saknas i miljövariablerna.');
    res.status(500).json({ error: 'E-postutskick är inte konfigurerat än. Kontakta oss direkt på telefon.' });
    return;
  }

  const { name, email, phone, service, message, address, postalCode, city, area, type, attachments, page } = req.body || {};

  const fieldErrors = validateFields({ name, phone, email, address, postalCode, city });
  if (Object.keys(fieldErrors).length) {
    res.status(400).json({ error: 'Kontrollera de markerade fälten och försök igen.', fields: fieldErrors });
    return;
  }

  const MAX_FILES = 3;
  // Filerna laddas upp direkt från webbläsaren till Vercel Blob (se api/blob-upload.js) och
  // förbi serverless-funktionens 4,5 MB request-body-gräns — den här funktionen får bara
  // tillbaka blob-URL:er (korta strängar), inte filinnehållet. Den riktiga storleksgränsen
  // (10 MB per fil) sätts vid tokengenereringen i api/blob-upload.js; här kontrolleras bara
  // den sammanlagda storleken en gång till som ett extra skyddslager.
  const MAX_TOTAL_BYTES = 10 * 1024 * 1024;
  // Endast blobs från vår egen publika store accepteras, så formuläret inte kan missbrukas
  // som en öppen relä för att få Resend att hämta godtyckliga externa URL:er.
  const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';

  let safeAttachments = [];
  if (Array.isArray(attachments) && attachments.length) {
    if (attachments.length > MAX_FILES) {
      res.status(400).json({ error: `Max ${MAX_FILES} bilagor per förfrågan.` });
      return;
    }
    for (const file of attachments) {
      if (!file || typeof file.url !== 'string' || !file.filename) continue;
      let parsed;
      try {
        parsed = new URL(file.url);
      } catch {
        res.status(400).json({ error: 'Ogiltig bilaga.' });
        return;
      }
      if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith(BLOB_HOST_SUFFIX)) {
        res.status(400).json({ error: 'Ogiltig bilaga.' });
        return;
      }
      safeAttachments.push({ filename: file.filename, url: file.url });
    }

    if (safeAttachments.length) {
      let totalBytes = 0;
      for (const file of safeAttachments) {
        try {
          const head = await fetch(file.url, { method: 'HEAD' });
          totalBytes += Number(head.headers.get('content-length') || 0);
        } catch {
          res.status(400).json({ error: 'Kunde inte verifiera en bilaga. Försök igen.' });
          return;
        }
      }
      if (totalBytes > MAX_TOTAL_BYTES) {
        res.status(400).json({ error: 'Bilagorna är för stora (max 10 MB totalt).' });
        return;
      }
    }
  }

  // Spara förfrågan i Neon så den syns i admin. Misslyckas det ska mejlet ändå skickas —
  // mejlet är fortfarande det som garanterar att ingen förfrågan tappas bort.
  try {
    const { query, logActivity } = await import('../lib/db.mjs');
    const leadType = ['offert', 'jour', 'contact', 'hire', 'area'].includes(type) ? type : 'contact';
    const clip = (value, max) => (value ? String(value).slice(0, max) : null);
    await query(
      `insert into leads (type, name, email, phone, service, message, address, postal_code, city, area, attachments, page)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        leadType, clip(name, 200), clip(email, 200), clip(phone, 50), clip(service, 200), clip(message, 5000),
        clip(address, 200), clip(postalCode, 20), clip(city, 100), clip(area, 200), JSON.stringify(safeAttachments),
        typeof page === 'string' && /^\/[A-Za-z0-9\-._~%/]{0,199}$/.test(page) ? page : null,
      ],
    );
    await logActivity({ action: 'lead.created', subject: clip(name, 200), meta: { type: leadType } });
  } catch (err) {
    console.error('Kunde inte spara förfrågan i databasen:', err);
  }

  const headings = {
    offert: 'Ny offertförfrågan',
    jour: 'AKUT — Jourförfrågan',
    contact: 'Nytt meddelande från kontaktformuläret',
    hire: 'Ny offertförfrågan (popup)',
    area: 'Ny förfrågan från ortssida',
  };
  const heading = headings[type] || headings.contact;
  const subject = (type === 'jour' ? 'JOUR: ' : '') + 'Ny förfrågan via prmmontage.se';

  const html = `
    <h2>${heading}</h2>
    <p><strong>Namn:</strong> ${escapeHtml(name)}</p>
    <p><strong>Telefon:</strong> ${escapeHtml(phone)}</p>
    <p><strong>E-post:</strong> ${email ? escapeHtml(email) : 'ej angiven'}</p>
    ${service ? `<p><strong>Tjänst:</strong> ${escapeHtml(service)}</p>` : ''}
    ${address ? `<p><strong>Adress:</strong> ${escapeHtml(address)}${postalCode ? ', ' + escapeHtml(postalCode) : ''}${city ? ' ' + escapeHtml(city) : ''}</p>` : ''}
    ${area ? `<p><strong>Område:</strong> ${escapeHtml(area)}</p>` : ''}
    ${message ? `<p><strong>Meddelande:</strong><br>${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
    ${safeAttachments.length ? `<p><strong>Bilagor:</strong> ${safeAttachments.map((f) => escapeHtml(f.filename)).join(', ')}</p>` : ''}
  `;

  try {
    const toEmails = process.env.CONTACT_TO_EMAIL
      ? process.env.CONTACT_TO_EMAIL.split(',').map((addr) => addr.trim())
      : ['info@pro-montage.se', 'matias@effektivmedia.nu'];

    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'PRM Montage <no-reply@effektivmedia.nu>',
      to: toEmails,
      reply_to: email || undefined,
      subject,
      html,
      attachments: safeAttachments.length
        ? safeAttachments.map((f) => ({ filename: f.filename, path: f.url }))
        : undefined,
    });

    if (error) {
      console.error('Resend error:', error);
      res.status(500).json({ error: 'Kunde inte skicka meddelandet. Försök igen senare.' });
      return;
    }

    // Bekräftelse till den som skickade in. Misslyckas den är förfrågan ändå mottagen, så
    // det ska inte ge kunden ett felmeddelande.
    try {
      const { error: confirmError } = await resend.emails.send({
        from: process.env.RESEND_FROM || 'PRM Montage <no-reply@effektivmedia.nu>',
        to: String(email).trim(),
        reply_to: toEmails[0],
        subject: 'Vi har tagit emot din förfrågan – PRM Montage',
        html: confirmationHtml({ name, service, type }),
      });
      if (confirmError) console.error('Resend bekräftelse error:', confirmError);
    } catch (err) {
      console.error('Resend bekräftelse error:', err);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    res.status(500).json({ error: 'Kunde inte skicka meddelandet. Försök igen senare.' });
  }
};

// Samma regler som i public/assets/js/form-utils.js — håll dem i synk.
function validateFields({ name, phone, email, address, postalCode, city }) {
  const errors = {};
  const text = (v) => (typeof v === 'string' ? v.trim() : '');
  if (text(name).length < 2) errors.name = 'Fyll i ditt namn.';
  const phoneDigits = text(phone).replace(/[\s\-().]/g, '');
  if (!/^\+?\d{7,15}$/.test(phoneDigits)) errors.phone = 'Ange ett giltigt telefonnummer, t.ex. 070-123 45 67.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(text(email)) || text(email).length > 200) {
    errors.email = 'Ange en giltig e-postadress, t.ex. namn@exempel.se.';
  }
  if (text(address).length < 3) errors.address = 'Fyll i din adress.';
  if (!/^\d{5}$/.test(text(postalCode).replace(/\s/g, ''))) errors.postalCode = 'Postnumret ska vara fem siffror, t.ex. 123 45.';
  if (text(city).length < 2) errors.city = 'Fyll i din stad.';
  return errors;
}

function confirmationHtml({ name, service, type }) {
  const first = String(name).trim().split(/\s+/)[0];
  const urgent = type === 'jour';
  const lead = urgent
    ? 'Vi har tagit emot din jourförfrågan och ringer upp dig så snart vi kan.'
    : 'Tack för din förfrågan! Vi har tagit emot den och går igenom den så snart vi kan. Därefter hör vi av oss till dig med återkoppling.';
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#12332C;line-height:1.55;">
      <h2 style="margin:0 0 16px;">Hej ${escapeHtml(first)}!</h2>
      <p>${lead}</p>
      ${service ? `<p><strong>Gäller:</strong> ${escapeHtml(service)}</p>` : ''}
      <p>${urgent ? 'Kan det inte vänta?' : 'Brådskar det?'} Ring oss på <a href="tel:+46852027977">08-520 279 77</a>.
      Har du fler bilder eller uppgifter att lägga till kan du svara direkt på det här mejlet.</p>
      <p style="margin-top:28px;">Vänliga hälsningar<br><strong>PRM Montage AB</strong><br>
      <a href="https://prmmontage.se">prmmontage.se</a></p>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
