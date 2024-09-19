import { getFromBrowserStorage } from "./storage";
import { browser } from "browser-namespace";

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
    getMostViewedSites();
}

async function getMostViewedSites() {
    const historyItems = await browser.history.search({
        text: '',
        startTime: 0,
        maxResults: 9999999999
    }) as { url: string, title: string }[];

    const urlCount: Record<string, number> = {};

    for (const item of historyItems) {
        const url = new URL(item.url);
        const host = url.host;
        if (urlCount[host]) {
            urlCount[host]++;
        } else {
            urlCount[host] = 1;
        }
    }

    const bookmarks = await browser.bookmarks.search({}) as { url: string, title: string }[];

    // Add bookmarks to the urlCount and urlTitles objects
    for (const bookmark of bookmarks) {
        if (!bookmark.url) continue;
        const url = new URL(bookmark.url);
        const host = url.host;
        if (urlCount[host]) {
            urlCount[host] += 5;
        } else {
            urlCount[host] = 5;
        }
    }

    const sortedUrls = Object.entries(urlCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    for (const [url, count] of sortedUrls) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = `${url} (${count})`;
        a.href = `https://${url}`;
        li.appendChild(a);
        document.getElementById('most_viewed')?.appendChild(li);
    }
}
