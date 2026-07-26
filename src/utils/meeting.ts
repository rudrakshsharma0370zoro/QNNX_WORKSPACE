

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
