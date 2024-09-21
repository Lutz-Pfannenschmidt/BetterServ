import { randomAsciiArt, shark } from "./ascii_art";

export interface Mail {
    answered: boolean;
    attachments: boolean;
    date: string;
    flagged: boolean;
    forwarded: boolean;
    from: From;
    path: Path;
    seen: boolean;
    size: Size;
    subject: string;
    to: string;
    uid: string;
}

export interface Size {
    display: string;
    order: number;
}

export interface Path {
    url: string;
    display: string;
    data: string;
}

export interface To {
    name: string;
}

export interface From {
    url: string;
    name: string;
}

async function getEmail(
    iserv: string,
    path = 'INBOX',
    unseen = true,
    length = 5,
    start = 0,
    orderColumn = 'date',
    orderDir = 'desc'
): Promise<{ data: Mail[], unseen: number }> {
    const url = `https://${iserv}/iserv/mail/api/message/list?path=${path}${unseen ? "&searchQuery[flagUnseen]=true" : ""}&length=${length}&start=${start}&order[column]=${orderColumn}&order[dir]=${orderDir}`;

    const response = await fetch(url);
    const data = await response.json();

    return data;
}

export async function populateEmail(iserv: string) {
    makeEmailLinks(iserv);
    const unseen_data = await getEmail(iserv, 'INBOX', true, 20, 0, 'date', 'desc');
    const unseen_element = document.getElementById('unseen_emails') as HTMLUListElement;
    unseen_element.innerHTML = '';

    for (const mail of unseen_data.data) {
        unseen_element.appendChild(makeEmailElement(mail, iserv));
    }

    const unseen_badge = document.getElementById('unseen_badge') as HTMLSpanElement;
    unseen_badge.textContent = unseen_data.unseen.toString();
    unseen_badge.classList.remove('hidden');
    if (unseen_data.unseen > 0) return

    unseen_badge.classList.add('hidden');
    const ascii_art = document.createElement('pre');
    ascii_art.textContent = "No new emails, have a fish instead:\n\n";
    ascii_art.textContent += randomAsciiArt();
    ascii_art.classList.add('ascii_art');
    unseen_element.appendChild(ascii_art);
}

async function makeEmailLinks(iserv: string) {
    const mail_write_anchor = document.getElementById('mail_write_anchor') as HTMLAnchorElement;
    const mail_inbox_anchor = document.getElementById('mail_inbox_anchor') as HTMLAnchorElement;

    mail_inbox_anchor.href = `https://${iserv}/iserv/mail?path=INBOX`;
    const csrf_token = await getMailComposeCSRF(iserv);
    if (csrf_token === '#') return;
    mail_write_anchor.href = `https://${iserv}/iserv/mail/compose/create/new?csrf_token=${csrf_token}`;
}

async function getMailComposeCSRF(iserv: string): Promise<string> {
    const response = await fetch(`https://${iserv}/iserv/mail?path=INBOX`);
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const csrf_anchor = doc.getElementById("mail-compose") as HTMLAnchorElement | null;

    if (!csrf_anchor) return '#';
    const csrf_url = new URL(csrf_anchor.href);
    return csrf_url.searchParams.get('csrf_token') || '#';
}

function makeEmailElement(mail: Mail, iserv: string): HTMLLIElement {
    const li = document.createElement('li');

    const sender_anchor = document.createElement('a');
    sender_anchor.classList.add('sender');
    sender_anchor.textContent = mail.from.name;
    sender_anchor.href = `https://${iserv}/iserv/mail?path=INBOX&msg=${mail.uid}`;
    sender_anchor.target = '_blank';
    li.appendChild(sender_anchor);

    const date_span = document.createElement('span');
    date_span.classList.add('date');
    date_span.textContent = mail.date;
    li.appendChild(date_span);

    const subject_span = document.createElement('span');
    subject_span.classList.add('subject');
    subject_span.textContent = `> ${mail.subject}`;
    li.appendChild(subject_span);

    li.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        window.open(`https://${iserv}/iserv/mail?path=INBOX&msg=${mail.uid}`);
    });

    return li;
}