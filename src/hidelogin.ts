import { BetterServLogger } from "./betterserv_logger";
import { getGeneralSettingsForDomain } from "./storage";

const logger = new BetterServLogger("HideLogin");
main();

async function main() {
    const settings = await getGeneralSettingsForDomain(window.location.host);
    if (!settings["hide-login"]) return;
    logger.log("Hiding last login");

    const panels = document.querySelectorAll(".panel");
    for (const panel of panels) {
        const anchors = panel.querySelectorAll("a");
        for (const anchor of anchors) {
            if (
                anchor.href.includes("iserv/profile/login") &&
                !anchor.classList.contains("betterserv")
            ) {
                panel.remove();
            }
        }
    }
}