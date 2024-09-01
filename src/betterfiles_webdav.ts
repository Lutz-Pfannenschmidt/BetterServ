import { AuthType, createClient, ResponseDataDetailed, type FileStat, type WebDAVClient } from "webdav";
import { BetterServLogger } from "./betterServLogger";
import { type BetterStarred, getCredentialsForDomain, getGeneralSettingsForDomain, getStarredFilesForDomain, setStarredFilesForDomain } from "./storage";
import { browser } from "browser-namespace";

const logger = new BetterServLogger("WebDAV");
let rtf: Intl.RelativeTimeFormat;
let lang: string;
let client: WebDAVClient;

setup();

async function setup() {
    const generalSettings = await getGeneralSettingsForDomain(window.location.host);
    const credentials = await getCredentialsForDomain(window.location.host);

    const interval = setInterval(async () => { removePageLoader(interval) }, 10);

    if (!credentials) {
        logger.error("No credentials found for this domain");
        notifyNoCredentials();
        return;
    }

    client = createClient(`https://webdav.${window.location.host}/`, {
        username: credentials.username,
        password: credentials.password,
        authType: AuthType.Password
    });

    document.addEventListener("DOMContentLoaded", main);

    window.addEventListener("popstate", () => {
        populateContent(window.location.toString().split("/-/")[1], document.querySelector(".betterserv-table") as HTMLTableElement);
    });

    logger.log("Setup complete");
}

async function removePageLoader(interval: NodeJS.Timeout) {
    const page_loader = document.getElementById("iserv-page-loader");
    if (!page_loader) return;
    page_loader.remove();
    logger.log("Page loader removed");
    clearInterval(interval);
}

function notifyNoCredentials() {
    const content = document.getElementById("content");
    if (!content) return;
    content.innerHTML = `
        <div class="betterserv-notify">
            <h1>No credentials found for this domain</h1>
            <p>Please go to the BetterServ settings and enter your credentials for this domain to use BetterFiles</p>
            <a href="#">Go to settings</a>
        </div>
    `;

    const settingsLink = content.querySelector("a");
    if (!settingsLink) return;
    settingsLink.addEventListener("click", (e) => {
        e.preventDefault();
        window.location = `${browser.runtime.getURL("static/settings.html")}?iserv=${window.location.host}` as unknown as Location;
    });
}


async function main() {
    const content = document.getElementById("content");

    if (!content) return;

    const table = generateContent();
    content.innerHTML = "";
    content.appendChild(table);

    const path = window.location.toString().split("/-/")[1];

    lang = document.querySelector("html")?.getAttribute("lang") || "en";
    rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

    populateContent(path, table);
}

async function populateContent(path: string, table: HTMLTableElement) {
    const decodedPath = decodeURIComponent(path);
    const data = await client.getDirectoryContents(`/${decodedPath}`) as FileStat[];
    const tableBody = table.querySelector("tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    tableBody.appendChild(makeDotDotRow());

    const starred = await getStarredFilesForDomain(window.location.host);

    for (const file of data) {
        const row = await makeFileRow(file, starred);
        if (!row) continue;
        tableBody.appendChild(row);
    }

    makeBreadcrumbs();
    makeTopbarFolders();
}

function makeTopbarFolders() {
    const topbar_btns = document.querySelector(".topbar-buttons");
    if (!topbar_btns) return;

    topbar_btns.innerHTML = "";
    topbar_btns.classList.add("betterserv-topbar-buttons");

    const files_link = document.createElement("a");
    if (window.location.toString().split("/-/")[1].replaceAll("/", "") === "Files") files_link.classList.add("active");
    files_link.href = `${window.location.toString().split("/-/")[0]}/-/Files`;
    files_link.innerHTML = "Files";
    files_link.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", files_link.href);
        populateContent("/Files", document.querySelector(".betterserv-table") as HTMLTableElement);
    });
    topbar_btns.appendChild(files_link);

    const groups_link = document.createElement("a");
    if (window.location.toString().split("/-/")[1].replaceAll("/", "") === "Groups") groups_link.classList.add("active");
    groups_link.href = `${window.location.toString().split("/-/")[0]}/-/Groups`;
    groups_link.innerHTML = "Groups";
    groups_link.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", groups_link.href);
        populateContent("/Groups", document.querySelector(".betterserv-table") as HTMLTableElement);
    });
    topbar_btns.appendChild(groups_link);


}

function makeBreadcrumbs() {
    const old_crumbs = document.querySelector(".topbar-breadcrumbs");
    if (old_crumbs) old_crumbs.outerHTML = "";

    const topbar_btns = document.querySelector(".topbar-buttons");
    if (!topbar_btns) return;

    const new_crumbs = document.createElement("div");
    new_crumbs.classList.add("topbar-breadcrumbs");
    topbar_btns.after(new_crumbs);


    const home = document.createElement("a");
    home.href = `${window.location.toString().split("/-/")[0]}/-/`;
    home.innerHTML = "Home";
    new_crumbs.appendChild(home);
    new_crumbs.appendChild(document.createTextNode("/"));

    home.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", home.href);
        populateContent("", document.querySelector(".betterserv-table") as HTMLTableElement);
    });

    const path = decodeURI(window.location.toString()).split("/-/")[1].split("/");
    const pathParts = path.slice(0, -1);

    for (let i = 0; i < pathParts.length; i++) {
        const crumb = document.createElement("a");
        const href = `${decodeURI(window.location.toString()).split("/-/")[0]}/-/${pathParts.slice(0, i + 1).join("/")}`;
        crumb.href = href;
        crumb.textContent = pathParts[i];
        new_crumbs.appendChild(crumb);
        new_crumbs.appendChild(document.createTextNode("/"));

        crumb.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, "", href);
            populateContent(`/${pathParts.slice(0, i + 1).join("/")}`, document.querySelector(".betterserv-table") as HTMLTableElement);
        });
    }

    const lastCrumb = document.createElement("span");
    lastCrumb.innerHTML = path[path.length - 1];
    new_crumbs.appendChild(lastCrumb);

}

function generateContent(): HTMLTableElement {
    const table = document.createElement("table");
    table.classList.add("betterserv-table");
    table.innerHTML = `
        <thead>
            <tr>
                <th class="check" scope="col"></th>
                <th class="name" scope="col">Name</th>
                <th class="size" scope="col">Size</th>
                <th class="mod" scope="col">Last Modified</th>
                <th class="actions" scope="col"></th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    return table;
}

function makeDotDotRow(): HTMLTableRowElement {
    const row = document.createElement("tr");
    const path = window.location.toString().split("/-/")[1].split("/").slice(0, -1).join("/");
    const href = `${window.location.toString().split("/-/")[0]}/-/${path}`;
    row.innerHTML = `
        <td></td>
        <td><a href="${href}">..</a></td>
        <td></td>
        <td></td>
        <td></td>
    `;
    row.querySelector("a")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", href);
        populateContent(`/${path}`, document.querySelector(".betterserv-table") as HTMLTableElement);
    });

    return row;
}

function makeFileRow(file: FileStat, starred: BetterStarred[]): HTMLTableRowElement | null {
    const row = document.createElement("tr");
    const href = `${window.location.toString().split("/-/")[0]}/-${file.filename}`;
    const lastmod = new Date(file.lastmod)
    if (href === window.location.toString()) return null;
    row.innerHTML = `
        <td><input type="checkbox"></input></td>
        <td><a href="${`${href}`}">${file.basename}${file.type === "directory" ? "/" : ""}</a></td>
        <td class="size">${file.type === "file" ? readableFileSize(file.size) : "Loading..."}</td>
        <td>${relativeDate(lastmod)}</td>
        <td>
            <button class="star-toggle">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
            </button>
            <button class="actions-toggle">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke="white" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>
            </button>
            <div class="popover">
                <ul class="betterserv-fileactions">
                    <li><a class="betterserv-download" download>Download</a></li>
                    <li><a class="betterserv-open" target="_blank">Open</a></li>
                    <li><a class="star-toggle"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg></a></li>
                </ul>
            </div>  
        </td>
    `;

    if (file.type === "directory") {
        (client.getDirectoryContents(file.filename) as Promise<FileStat[]>).then((data) => {
            const sizeElement = row.querySelector(".size") as HTMLElement;
            sizeElement.textContent = `Contains ${data.length} Files and Folders`;
            if (data.length === 1) sizeElement.textContent = "Contains 1 File or Folder";
            if (data.length === 0) sizeElement.textContent = "Empty";
        });
    }

    const downloadLink = row.querySelector(".betterserv-download") as HTMLAnchorElement;
    downloadLink.href = client.getFileDownloadLink(file.filename)

    row.querySelector("a")?.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", href);
        populateContent(file.filename, row.parentElement?.parentElement as HTMLTableElement);
    });

    const actions_toggle = row.querySelector(".actions-toggle") as HTMLElement;
    if (file.type === "directory") actions_toggle.style.display = "none";
    actions_toggle.addEventListener("click", () => {
        const popover = row.querySelector(".popover") as HTMLElement;
        if (!popover) return;
        const popovers = document.querySelectorAll(".popover");
        for (const p of popovers) {
            if (p !== popover) p.classList.remove("active");
        }
        popover.classList.toggle("active");

        const w = popover.offsetWidth;
        const h = popover.offsetHeight;
        const toggleX = actions_toggle.getBoundingClientRect().left;
        const toggleY = actions_toggle.getBoundingClientRect().top;
        const toggleH = actions_toggle.offsetHeight;

        const scrollX = window.scrollX;
        const scrollY = window.scrollY;

        popover.style.left = `${toggleX - w + scrollX}px`;
        popover.style.top = `${toggleY + toggleH / 2 - h / 2 + scrollY}px`;

        document.addEventListener("click", (e) => {
            if (!popover.contains(e.target as Node) && !actions_toggle.contains(e.target as Node)) {
                popover.classList.remove("active");
                document.removeEventListener("click", () => { });
            }
        });
    });

    const star_toggle = row.querySelectorAll(".star-toggle") as NodeListOf<HTMLElement>;
    let isStarred = starred.some((star) => star.path.endsWith(`iserv/file/-${file.filename}`));
    if (file.type !== "directory" && star_toggle.length >= 1) star_toggle[0].style.display = "none";
    for (const el of star_toggle) {
        if (isStarred) el.classList.add("active");
        el.addEventListener("click", () => {
            el.classList.toggle("active");
            isStarred = !isStarred

            console.log(starred);

            if (isStarred) {
                starred.push({ path: `${window.location.host}/iserv/file/-${file.filename}`, name: file.basename });
                setStarredFilesForDomain(window.location.host, starred);
            } else {
                const new_starred = starred.filter((star) => !star.path.endsWith(`iserv/file/-${file.filename}`));
                setStarredFilesForDomain(window.location.host, new_starred);
            }
        });
    }

    return row;
}

function relativeDate(date: Date): string {
    const diff = date.getTime() - Date.now();
    const diffInMinutes = Math.round(diff / 1000 / 60);

    if (diffInMinutes >= -60) {
        return rtf.format(diffInMinutes, "minute");
    }

    if (diffInMinutes >= -(24 * 3)) {
        return rtf.format(diffInMinutes / 60, "hour");
    }

    return date.toLocaleDateString(lang);
}

function readableFileSize(size: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let unitIndex = 0;
    let updatedSize = size;
    while (updatedSize > 1000 && unitIndex < units.length - 1) {
        updatedSize /= 1000;
        unitIndex++;
    }
    return `${updatedSize.toFixed(2)} ${units[unitIndex]}`;
}