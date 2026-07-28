

export function newJitsiLink(): string {
  return `https://meet.jit.si/QNNX-${crypto.randomUUID()}`;
}


export function joinUrl(meeting: { id: string; link?: string | null }): string {
  if (meeting.link) {
    let url = meeting.link;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  }
  return `https://meet.jit.si/QNNX-${meeting.id}`;
}


export function isUpcoming(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}


 
export function openGmailCompose(opts: { bcc: string; subject: string; body: string }): void {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: '',
    bcc: opts.bcc,
    su: opts.subject,
    body: opts.body,
  });
  window.open(`https://mail.google.com/mail/?${params.toString()}`, '_blank', 'noopener,noreferrer');
}

/**
 * True on phones/tablets (Android, iPhone, iPad, iPod). Used to pick the
 * right email-invite mechanism — see openEmailInvite() below.
 */
function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Opens an email draft pre-filled with a BCC list, subject, and body —
 * picking the delivery mechanism that actually works on the current device.
 *
 * Desktop: openGmailCompose() — loads Gmail's own web app, which reads the
 * URL and pre-fills the draft. This only works because it's Gmail's full
 * desktop website running its own JavaScript.
 *
 * Mobile: a plain mailto: link instead. On phones, Android in particular
 * very often intercepts mail.google.com links and hands them straight to
 * the native Gmail app via an OS-level intent — bypassing Gmail's website
 * (and its JavaScript) entirely, so the ?view=cm&bcc=... parameters are
 * never read and the draft opens empty. mailto: has no such gap: it's a
 * universal OS-level standard that every mobile mail app (including the
 * Gmail app itself) is built to parse correctly for recipients/subject/body.
 */
export function openEmailInvite(opts: { bcc: string; subject: string; body: string }): void {
  if (isMobileDevice()) {
    const params = new URLSearchParams({ subject: opts.subject, body: opts.body });
    window.location.href = `mailto:?bcc=${encodeURIComponent(opts.bcc)}&${params.toString()}`;
    return;
  }
  openGmailCompose(opts);
}
