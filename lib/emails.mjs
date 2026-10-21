import { Resend } from 'resend';

const FROM = () => process.env.RESEND_FROM || 'PRM Montage <no-reply@effektivmedia.nu>';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function layout({ heading, body, buttonLabel, url }) {
  return `<!doctype html>
<html lang="sv"><body style="margin:0;padding:32px 16px;background:#F3F7F6;font-family:'DM Sans',Arial,sans-serif;color:#1F5C50;">
  <table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;">
    <tr><td>
      <p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#1FA968;">PRM Montage</p>
      <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#1F5C50;">${heading}</h1>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#63706D;">${body}</p>
      <a href="${url}" style="display:inline-block;background:#1FA968;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:10px;">${buttonLabel}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#63706D;">Länken gäller i 15 minuter och kan bara användas en gång. Fungerar inte knappen? Klistra in adressen i webbläsaren:<br><span style="word-break:break-all;">${escapeHtml(url)}</span></p>
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
