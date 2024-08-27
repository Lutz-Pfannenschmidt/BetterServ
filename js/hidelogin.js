main();

async function main() {
	const settings = await getGeneralSettings(window.location.host);
	if (!settings["hide-login"]) return;

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

async function getGeneralSettings(domain) {
	const generalSettings = await getStorage(`betterserv-general-${domain}`);
	if (!generalSettings) {
		await setStorage(`betterserv-general-${domain}`, {});
		return {};
	}
	return generalSettings;
}
async function getStorage(key) {
	return await browser.storage.sync.get(key).then((res) => res[key]);
}
