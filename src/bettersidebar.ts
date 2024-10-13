import { BetterServLogger } from "./betterserv_logger";
import { getStarredFilesForDomain, setStarredFilesForDomain } from "./storage";

const logger = new BetterServLogger("Sidebar");

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("idesk-sidebar") as HTMLDivElement | null;
    if (sidebar) {
        buildSidebar(sidebar);
    } else {
        logger.log("Sidebar not found");
    }
});

async function buildSidebar(sidebar: HTMLDivElement) {
    logger.log("Building sidebar");
    let starredItems = await getStarredFilesForDomain(window.location.host);

    const betterServPanel = document.createElement("div");
    betterServPanel.classList.add("panel");
    betterServPanel.classList.add("panel-dashboard");
    betterServPanel.classList.add("panel-default");
    betterServPanel.innerHTML = `
        <div class="panel-heading">
            <h2 class="panel-title">[BetterServ] <a target="_blank" href="https://github.com/Lutz-Pfannenschmidt/BetterServ">GitHub</a></h2>
        </div>
        <div class="panel-body">

            ${starredItems.length > 0 ? '<h2>Starred Files</h2> <div id="betterserv-starred"></div>' : ""}

        </div>`;

    const ttt = document.querySelector(".ttt-panel");
    if (ttt) {
        ttt.after(betterServPanel);
    } else {
        sidebar.prepend(betterServPanel);
    }

    const starred = document.getElementById("betterserv-starred");
    if (!starred) return

    for (const starredItem of starredItems) {
        if (!starredItem.path.includes(window.location.host)) continue;
        const div = document.createElement("div");

        const star_link = document.createElement("a");
        star_link.classList.add("star-toggle");
        star_link.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6"><path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" /></svg>`;
        star_link.classList.add("active");
        star_link.addEventListener("click", async (e) => {
            e.preventDefault();
            star_link.classList.toggle("active");
            const isStarred = star_link.classList.contains("active");

            if (isStarred) {
                starredItems.push(starredItem);
            } else {
                starredItems = starredItems.filter(
                    (item) => item.path !== starredItem.path && item.name !== starredItem.name,
                );
            }
            setStarredFilesForDomain(window.location.host, starredItems);

        });
        div.appendChild(star_link);

        const name = document.createElement("a");
        name.textContent = starredItem.name;
        name.href = starredItem.path;
        if (starredItem.path.startsWith(window.location.host)) name.href = `https://${starredItem.path}`
        div.appendChild(name);

        starred.appendChild(div);
    }
}

/**
 *
 * <span class="material-symbols-outlined">check_circle</span>
 * https://fonts.google.com/icons?query=ion&icon.platform=web
 * why is philosophie so stupid
 */
