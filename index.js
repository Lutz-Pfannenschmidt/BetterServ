if (window.location.toString().includes("/iserv/")) {
	main("/iserv/");
} else {
	console.log(window.location.toString());
}

function main(url) {
	const css = ["css/symbols.css", "css/ubuntu.css", "css/betterserv.css"];
	const js = ["js/inject.js"];

	for (const j of js) {
		const script = document.createElement("script");
		script.type = "text/javascript";
		script.src = browser.runtime.getURL(j);
		document.getElementsByTagName("head")[0].appendChild(script);
	}

	for (const j of css) {
		const link = document.createElement("link");
		link.rel = "stylesheet";
		link.href = browser.runtime.getURL(j);
		document.getElementsByTagName("head")[0].appendChild(link);
	}

	const extensionUrl = document.createElement("var");
	extensionUrl.textContent = browser.runtime.getURL("");
	extensionUrl.id = "BetterServUrl";
	document.getElementsByTagName("head")[0].appendChild(extensionUrl);

	const iServUrl = document.createElement("var");
	iServUrl.textContent = url;
	iServUrl.id = "IServUrl";
	document.getElementsByTagName("head")[0].appendChild(iServUrl);
}

async function pinFileTable() {
	await delay(300);

	const links = document.querySelectorAll(
		"#content #files a, #content a.files-link",
	);

	for (let i = 0; i < links.length; i++) {
		links[i].addEventListener("click", async (e) => {
			if (e.target.id.includes("betterserv")) return;
			await delay(100);
			const custom = document
				.getElementById("content")
				.querySelectorAll(".betterserv-files");
			for (let j = 0; j < custom.length; j++) {
				custom[j].outerHTML = "";
			}
			pinFileTable();
		});
	}

	const table = document.getElementById("files");
	const tbody = table.querySelector("tbody");
	const entries = tbody.children;
	let list = await getStorage("betterServLikedFolders");
	if (typeof list === "undefined") {
		await browser.storage.sync.set({
			betterServLikedFolders: [],
		});
		list = [];
	}

	console.log(entries);
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

HTMLCollection.prototype.forEach = Array.prototype.forEach;

/**
 * Checks if an array contains a different array and returns its index if found, or -1 if not found.
 * @param {Array} arr1 - The main array to search in.
 * @param {Array} arr2 - The array to check for.
 * @returns {number} - The index of the subarray if found, or -1 if not found.
 */
function arrayContainsArray(arr1, arr2) {
	for (let i = 0; i < arr1.length; i++) {
		const arr = arr1[i];
		if (
			Array.isArray(arr) &&
			arr.length === arr2.length &&
			arr.every((val, index) => val === arr2[index])
		) {
			return i;
		}
	}
	return -1;
}

async function getStorage(key) {
	const resp = await browser.storage.sync.get(key);
	return resp[key];
}
