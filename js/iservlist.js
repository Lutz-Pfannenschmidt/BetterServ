main();

async function main() {
	const urls = (await getStorage("betterserv-urls")) || [];

	if (urls.includes(window.location.host)) return;
	urls.push(window.location.host);
	await browser.storage.sync.set({
		"betterserv-urls": urls,
	});
}
