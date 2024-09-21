import { getFromBrowserStorage } from "./storage";
import { populateEmail } from "./dashboard_mail";
import { populateTimetable } from "./dashboard_timetable";
import { populateStarredFiles } from "./dashboard_files";

main();
async function main() {
    const iserv_list = document.getElementById('iserv_list') as HTMLUListElement;
    const iserv_options = document.getElementById('iserv_options') as HTMLSelectElement;
    const urls = (await getFromBrowserStorage("betterserv-urls") || []) as string[];

    for (const url of urls) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = url;
        a.href = `https://${url}`;
        li.appendChild(a);
        iserv_list.appendChild(li);

        const option = document.createElement('option');
        option.textContent = url;
        option.value = url;
        iserv_options.appendChild(option);
    }

    const prefered_iserv = localStorage.getItem('prefered_iserv');
    if (prefered_iserv) {
        iserv_options.value = prefered_iserv;
    }

    populateDashboard(iserv_options.value);
    iserv_options.addEventListener('change', changeIServ);
}

function changeIServ(e: Event) {
    const target = e.target as HTMLSelectElement;
    localStorage.setItem('prefered_iserv', target.value);
    populateDashboard(target.value);
}

async function populateDashboard(iserv: string) {
    const settings_anchor = document.getElementById('settings_anchor') as HTMLAnchorElement;
    settings_anchor.href = `settings.html?iserv=${iserv}`;

    populateEmail(iserv);
    populateTimetable(iserv);
    populateStarredFiles(iserv);
}

