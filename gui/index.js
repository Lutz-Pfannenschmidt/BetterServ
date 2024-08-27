main();

async function main() {
	const urls = (await getStorage("betterserv-urls")) || [];
	const div = document.getElementById("betterserv-urls");

	div.innerHTML = `
        <h2>IServ Settings</h2>
        <ul>
            ${urls.map((url) => `<li><a target="_blank" href="${browser.runtime.getURL("gui/settings.html")}?iserv=${url}">${url}</a></li>`).join("")}
        </ul>
    `;
}

function getStorage(key) {
	return browser.storage.sync.get(key).then((res) => res[key]);
}
