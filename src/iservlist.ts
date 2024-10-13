import { getFromBrowserStorage, setInBrowserStorage } from "./storage";

main();

async function main() {
    const urls = (await getFromBrowserStorage("betterserv-urls") || []) as string[];

    if (urls.includes(window.location.host)) return;
    urls.push(window.location.host);
    await setInBrowserStorage("betterserv-urls", urls);
}
