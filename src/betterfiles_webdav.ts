import { AuthType, createClient, type FileStat, type WebDAVClient } from "webdav";
import { BetterServLogger } from "./betterServLogger";
import { type BetterStarred, getCredentialsForDomain, getStarredFilesForDomain, setStarredFilesForDomain } from "./storage";
import { browser } from "browser-namespace";

const logger = new BetterServLogger("WebDAV");
let rtf: Intl.RelativeTimeFormat;
let lang: string;
let client: WebDAVClient;
let cloud = true;
let table: HTMLTableElement;
let actions: HTMLDivElement;

setup();

async function setup() {
    const credentials = await getCredentialsForDomain(window.location.host);

    const interval = setInterval(async () => { removePageLoader(interval) }, 10);

    if (!credentials || !credentials.username || !credentials.password) {
        logger.error("No credentials found for this domain");
        notifyNoCredentials();
        return;
    }

    client = createClient(`https://webdav.${window.location.host}/`, {
        username: credentials.username,
        password: credentials.password,
        authType: AuthType.Password
    });

    document.addEventListener("dragover", dragOverHandler);
    document.addEventListener("dragleave", dragLeaveHandler);
    document.addEventListener("drop", dropHandler);

    document.addEventListener("DOMContentLoaded", main);

    window.addEventListener("popstate", () => {
        populateContent(window.location.toString().split("/-/")[1]);
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
        window.location = `${browser.runtime.getURL("static/settings.html")}?iserv=${window.location.host}#account` as unknown as Location;
    });
}


async function main() {
    const content = document.getElementById("content");

    if (!content) return;
    cloud = detectCloud();

    table = createTable();
    actions = createActions();

    if (window.location.toString().endsWith("/iserv/file/cloud")) {
        cloud = true;
        makeTopbarFolders();
        const old_crumbs = document.querySelector(".topbar-breadcrumbs");
        if (old_crumbs) old_crumbs.innerHTML = "";
        return;
    }

    lang = document.querySelector("html")?.getAttribute("lang") || "en";
    rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });

    const path = window.location.toString().split("/-/")[1];
    const draggingOverlay = document.createElement("div");
    draggingOverlay.classList.add("dragging-overlay");
    document.body.appendChild(draggingOverlay);

    populateContent(path);
}

async function populateContent(path: string) {
    const content = document.getElementById("content");
    if (!content) return;

    const betterserv_table = document.querySelector(".betterserv-table");
    if (!betterserv_table) {
        content.innerHTML = "";
        content.appendChild(table);
        content.appendChild(actions);
    }

    const decodedPath = decodeURIComponent(path);
    const data = await client.getDirectoryContents(`/${decodedPath}`) as FileStat[];
    const tableBody = table.querySelector("tbody");
    if (!tableBody) return;
    tableBody.innerHTML = "";
    tableBody.appendChild(makeDotDotRow());

    const starred = await getStarredFilesForDomain(window.location.host);

    for (const file of data) {
        const row = makeFileRow(file, starred);
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
    if (window.location.toString().endsWith("/iserv/file/-/Files")) files_link.classList.add("active");
    files_link.href = "/iserv/file/-/Files";
    files_link.innerHTML = "Files";
    files_link.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", files_link.href);
        populateContent("/Files");
    });
    topbar_btns.appendChild(files_link);

    const groups_link = document.createElement("a");
    if (window.location.toString().endsWith("/iserv/file/-/Groups")) groups_link.classList.add("active");
    groups_link.href = "/iserv/file/-/Groups";
    groups_link.innerHTML = "Groups";
    groups_link.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", groups_link.href);
        populateContent("/Groups");
    });
    topbar_btns.appendChild(groups_link);

    if (!cloud) return;

    const cloud_link = document.createElement("a");
    if (window.location.toString().endsWith("/iserv/file/cloud")) cloud_link.classList.add("active");
    cloud_link.href = "/iserv/file/cloud";
    cloud_link.innerHTML = "Cloud";
    topbar_btns.appendChild(cloud_link);


    const collapsible = document.querySelector("div.content-header");
    if (collapsible) collapsible.remove();
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
    new_crumbs.appendChild(document.createElement("span")).textContent = "/";

    home.addEventListener("click", (e) => {
        e.preventDefault();
        window.history.pushState({}, "", home.href);
        populateContent("");
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
            populateContent(`/${pathParts.slice(0, i + 1).join("/")}`,);
        });
    }

    const lastCrumb = document.createElement("span");
    lastCrumb.innerHTML = path[path.length - 1];
    new_crumbs.appendChild(lastCrumb);

}

function createTable(): HTMLTableElement {
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

function createActions(): HTMLDivElement {
    const actions = document.createElement("div");
    actions.classList.add("betterserv-multifile-actions");

    actions.innerHTML = `
        <button class="betterserv-download-selected">Download Selected Files</button>
        <button class="betterserv-new-folder">New Folder</button>
        <button class="betterserv-upload">Upload (or just drag and drop)</button>
        <button class="betterserv-delete-selected danger right">Delete Selected</button>
    `;

    const downloadSelected = actions.querySelector(".betterserv-download-selected") as HTMLButtonElement;
    downloadSelected.addEventListener("click", async () => {
        const files = getCheckedFiles();
        for (const file of files) {
            downloadIfFile(file);
        }
    });

    const newFolder = actions.querySelector(".betterserv-new-folder") as HTMLButtonElement;
    newFolder.addEventListener("click", async () => {
        const folderName = prompt("Enter the name of the new folder");
        if (!folderName) return;
        await client.createDirectory(`${window.location.toString().split("/-/")[1]}/${folderName.trim()}`);
        populateContent(window.location.toString().split("/-/")[1]
        );
    });

    const upload = actions.querySelector(".betterserv-upload") as HTMLButtonElement;
    upload.addEventListener("click", async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.click();
        input.addEventListener("change", async () => {
            if (!input.files) return;
            const files = Array.from(input.files);
            for (const file of files) {
                const path = `${window.location.toString().split("/-/")[1]}/${file.name}`;
                await client.putFileContents(path, await file.text());
            }
            populateContent(window.location.toString().split("/-/")[1]);
        }
        );
    }
    );


    const deleteSelected = actions.querySelector(".betterserv-delete-selected") as HTMLButtonElement;
    deleteSelected.addEventListener("click", async () => {
        const files = getCheckedFiles();

        const confirmDelete = confirm(`Are you sure you want to delete ${files.length} files?`);
        if (!confirmDelete) return;

        await Promise.all(files.map((file) => client.deleteFile(file)));
        populateContent(window.location.toString().split("/-/")[1]);
    });

    return actions;
}

function getCheckedFiles(): string[] {
    const checkboxes = document.querySelectorAll(".betterserv-table input[type='checkbox']:checked");
    const files = Array.from(checkboxes).map((checkbox) => {
        const row = checkbox.parentElement?.parentElement as HTMLTableRowElement | null;
        if (!row) return "";
        const link = row.querySelector(".betterserv-download") as HTMLAnchorElement | null;
        if (!link) return "";

        return decodeURIComponent(link.href.split(window.location.host)[1]);
    });

    return files;
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
        populateContent(`/${path}`);
    });

    return row;
}

function makeFileRow(file: FileStat, starred: BetterStarred[]): HTMLTableRowElement | null {
    const row = document.createElement("tr");
    const href = `${window.location.toString().split("/-/")[0]}/-${file.filename}`;
    const lastmod = new Date(file.lastmod)
    if (href === decodeURI(window.location.toString())) return null;
    row.innerHTML = `
        <td><input type="checkbox"></input></td>
        <td><a class="betterserv-open" href="${href}">
            ${file.type === "directory" ?
            `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>` :
            file.filename.endsWith(".url") ?
                `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>` :
                `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>`}
            ${file.basename}${file.type === "directory" ? "/" : ""}
            </a></td>
        <td class="size">${file.type === "file" ? readableFileSize(file.size) : "Loading..."}</td>
        <td>${relativeDate(lastmod)}</td>
        <td>
            <button class="star-toggle">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>
            </button>
            <button class="actions-toggle">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" /></svg>
            </button>
            <div class="popover">
                <ul class="betterserv-fileactions">
                    <li><a class="betterserv-download" download>Download</a></li>
                    <li><a class="betterserv-rename" href="#">Rename</a></li>
                    <li><a class="star-toggle"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg></a></li>
                </ul>
            </div>  
        </td>
    `;

    if (file.type === "directory") {
        (client.getDirectoryContents(file.filename) as Promise<FileStat[]>).then((data) => {
            const sizeElement = row.querySelector(".size") as HTMLElement;
            sizeElement.textContent = `Contains ${data.length} Files`;
            if (data.length === 1) sizeElement.textContent = "Contains 1 File";
            if (data.length === 0) sizeElement.textContent = "Empty";
        });

        row.querySelector("a")?.addEventListener("click", (e) => {
            e.preventDefault();
            window.history.pushState({}, "", href);
            populateContent(file.filename);
        });

    } else {
        const anchor = row.querySelector(".betterserv-open") as HTMLAnchorElement;
        anchor.addEventListener("click", async (e) => {
            e.preventDefault();
            let tmpHref = href;
            if (file.filename.endsWith(".url")) {
                const content = await client.getFileContents(file.filename) as ArrayBuffer;
                const decoder = new TextDecoder("utf-8");
                const text = decoder.decode(content);
                tmpHref = text.split("\n")[1].split("URL=")[1].trim();
            }

            window.open(tmpHref, "_blank");
        });
    }

    const renameLink = row.querySelector(".betterserv-rename") as HTMLAnchorElement;
    renameLink.addEventListener("click", async (e) => {
        e.preventDefault();
        const newName = prompt("Enter the new name of the file", file.basename);
        if (!newName) return;
        await client.moveFile(file.filename, `${window.location.toString().split("/-/")[1]}/${newName}`);
        populateContent(window.location.toString().split("/-/")[1]);
    });

    const downloadLink = row.querySelector(".betterserv-download") as HTMLAnchorElement;
    downloadLink.href = client.getFileDownloadLink(file.filename)
    downloadLink.addEventListener("click", () => {
        window.open(downloadLink.href, "_blank");
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
    const isStarred = starred.some((star) => star.path.endsWith(`iserv/file/-${file.filename}`));
    if (file.type !== "directory" && star_toggle.length >= 1) star_toggle[0].style.display = "none";
    for (const el of star_toggle) {
        if (isStarred) el.classList.add("active");
        el.addEventListener("click", () => {
            el.classList.toggle("active");
            const star = el.classList.contains("active");

            if (star) {
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

async function downloadIfFile(path: string) {
    const stat = await client.stat(path) as FileStat;
    if (stat.type === "file") {
        window.open(client.getFileDownloadLink(path), "_blank");
    }
}

function dragOverHandler(e: DragEvent) {
    e.preventDefault();
    document.body.classList.add("dragging");
}

function dragLeaveHandler(e: DragEvent) {
    e.preventDefault();
    document.body.classList.remove("dragging");
}

async function dropHandler(e: DragEvent) {
    document.body.classList.remove("dragging");
    e.preventDefault();
    if (!e.dataTransfer) return;
    const items = e.dataTransfer.items;
    for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry()
        if (!item) continue;
        await scanItem(item);
    }
    populateContent(window.location.toString().split("/-/")[1]);
}

async function scanItem(item: FileSystemEntry) {
    if (item.isDirectory) {
        await handleFolder(item as FileSystemDirectoryEntry);
    } else {
        await handleFile(item as FileSystemFileEntry);
    }
}

async function handleFile(item: FileSystemFileEntry) {
    const file = await new Promise<File>((resolve) => item.file(resolve));
    const path = `${window.location.toString().split("/-/")[1]}/${item.fullPath}`;
    await client.putFileContents(path, await file.text());
}

async function handleFolder(item: FileSystemDirectoryEntry) {
    await client.createDirectory(`${window.location.toString().split("/-/")[1]}/${item.fullPath}`);

    const directoryReader = item.createReader();
    directoryReader.readEntries(async (entries) => {
        for (const entry of entries) {
            await scanItem(entry);
        }
    });
}

function detectCloud(): boolean {
    return !!document.getElementById("cloud-tab-link");
}