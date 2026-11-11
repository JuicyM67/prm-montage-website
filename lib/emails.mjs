import { Resend } from 'resend';

const FROM = () => process.env.RESEND_FROM || 'PRM Montage <no-reply@prmmontage.se>';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function layout({ heading, body, buttonLabel, url, footnote }) {
  return `<!doctype html>
<html lang="sv"><body style="margin:0;padding:32px 16px;background:#F3F8F4;font-family:'DM Sans',Arial,sans-serif;color:#14502A;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
    <tr><td>
      <p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#009828;">PRM Montage</p>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#14502A;">${heading}</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#5F6F64;">${body}</p>
      <a href="${url}" style="display:inline-block;background:#009828;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">${buttonLabel}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5F6F64;">${footnote || 'Länken gäller i 15 minuter och kan bara användas en gång. Fungerar inte knappen? Klistra in adressen i webbläsaren:'}<br><span style="word-break:break-all;">${escapeHtml(url)}</span></p>
    </td></tr>
  </table>
</body></html>`;
}

async function send({ to, subject, html, url }) {
  // Lokalt utan RESEND_API_KEY: skriv länken i konsolen i stället för att skicka mejl.
  if (!process.env.RESEND_API_KEY) {
    if (process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY saknas.');
    }
    console.log(`[dev-mejl] till ${to}: ${subject}\n${url}`);
    return;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: FROM(), to, subject, html });
  if (error) throw new Error(`Resend: ${error.message || JSON.stringify(error)}`);
}

export async function sendLoginLink({ email, url }) {
  await send({
    to: email,
    subject: 'Din inloggningslänk till PRM Montage admin',
    url,
    html: layout({
      heading: 'Logga in',
      body: 'Klicka på knappen för att logga in i administrationen. Du begärde den här länken själv — gjorde du inte det kan du bortse från mejlet.',
      buttonLabel: 'Logga in',
      url,
    }),
  });
}

export async function sendInvite({ email, name, invitedBy, url }) {
  await send({
    to: email,
    subject: 'Du har bjudits in till PRM Montage admin',
    url,
    html: layout({
      heading: `Välkommen${name ? ', ' + escapeHtml(name) : ''}!`,
      body: `${escapeHtml(invitedBy || 'En administratör')} har bjudit in dig till administrationen för prmmontage.se. Klicka på knappen för att logga in — inget lösenord behövs.`,
      buttonLabel: 'Öppna administrationen',
      url,
    }),
  });
}

export async function sendReviewInvite({ email, name, url }) {
  const first = String(name || '').trim().split(/\s+/)[0];
  await send({
    to: email,
    subject: 'Hur gick det? Berätta gärna om din upplevelse av PRM Montage',
    url,
    html: layout({
      heading: `Tack${first ? ', ' + escapeHtml(first) : ''}!`,
      body: 'Det var ett nöje att hjälpa dig. Har du en minut över? Berätta hur det gick. Det hjälper oss att bli bättre och hjälper andra som funderar på att anlita en hantverkare. Du skriver ditt omdöme på vår sajt, och kan sedan välja att lägga upp det på Google också.',
      buttonLabel: 'Skriv ett omdöme',
      url,
      footnote: 'Länken är personlig och kan användas en gång. Fungerar inte knappen? Klistra in adressen i webbläsaren:',
    }),
  });
}
