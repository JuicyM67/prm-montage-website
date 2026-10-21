const rtf = new Intl.RelativeTimeFormat('sv', { numeric: 'auto' });

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return '–';
  const diff = (new Date(value).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs < 60) return 'just nu';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day');
  return new Date(value).toLocaleDateString('sv-SE');
}

export function fullDate(value: string | Date | null | undefined): string {
  if (!value) return '–';
  return new Date(value).toLocaleString('sv-SE', { dateStyle: 'medium', timeStyle: 'short' });
}

export const number = (n: number | null | undefined) => (n == null ? '–' : n.toLocaleString('sv-SE'));

export const LEAD_TYPES: Record<string, string> = {
  offert: 'Offert',
  jour: 'Jour',
  contact: 'Kontakt',
  hire: 'Offert (popup)',
  area: 'Ortssida',
};

export const LEAD_STATUS: Record<string, string> = {
  ny: 'Ny',
  hanterad: 'Hanterad',
  arkiverad: 'Arkiverad',
};

export function describeActivity(a: { action: string; subject: string | null; user_name: string | null; meta?: any }): string {
  const who = a.user_name || 'Någon';
  const subject = a.subject || '';
  switch (a.action) {
    case 'lead.created': return `Ny förfrågan från ${subject}`;
    case 'lead.status': return `${who} markerade ${subject} som ${(LEAD_STATUS[a.meta?.status] || a.meta?.status || '').toLowerCase()}`;
    case 'user.invited': return `${who} bjöd in ${subject}`;
    case 'user.reinvited': return `${who} skickade om inbjudan till ${subject}`;
    case 'user.removed': return `${who} tog bort ${subject}`;
    default: return `${who}: ${a.action}${subject ? ' – ' + subject : ''}`;
  }
}
