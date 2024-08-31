import { browser } from "browser-namespace";
import { BetterServLogger } from "./betterServLogger";
import { getFromBrowserStorage } from "./storage";

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
    let likedItems = await getFromBrowserStorage("betterserv-liked") as [string, string][];

    const betterServPanel = document.createElement("div");
    betterServPanel.classList.add("panel");
    betterServPanel.classList.add("panel-dashboard");
    betterServPanel.classList.add("panel-default");
    betterServPanel.innerHTML = `
        <div class="panel-heading">
            <h2 class="panel-title">[BetterServ] <a target="_blank" href="https://github.com/Lutz-Pfannenschmidt/BetterServ">GitHub</a></h2>
        </div>
        <div class="panel-body">

            ${likedItems.length > 0 ? '<h2>Liked Files</h2> <div id="betterserv-liked"></div>' : ""}

        </div>`;

    sidebar.prepend(betterServPanel);

    const liked = document.getElementById("betterserv-liked");
    if (!liked) return

    for (const likedItem of likedItems) {
        if (!likedItem[0].includes(window.location.host)) continue;
        const div = document.createElement("div");

        const like_checkbox = document.createElement("a");
        like_checkbox.classList.add("betterserv-checkbox", "like");
        like_checkbox.href = "#";
        like_checkbox.classList.add("checked");
        like_checkbox.addEventListener("click", async (e) => {
            e.preventDefault();
            like_checkbox.classList.toggle("checked");

            likedItems = likedItems.filter(
                (item) => item[0] !== likedItem[0] && item[1] !== likedItem[1],
            );

            await browser.storage.sync.set({
                "betterserv-liked": likedItems,
            });
            div.outerHTML = "";
        });
        div.appendChild(like_checkbox);

        const name = document.createElement("a");
        name.textContent = likedItem[1];
        name.href = likedItem[0];
        div.appendChild(name);

        liked.appendChild(div);
    }
}

/**
 *
 * <span class="material-symbols-outlined">check_circle</span>
 * https://fonts.google.com/icons?query=ion&icon.platform=web
 * why is philosophie so stupid
 */
