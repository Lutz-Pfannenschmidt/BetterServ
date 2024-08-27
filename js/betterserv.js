function betterLog(string, list = [], module = "") {
	let name = "BetterServ";
	if (module) {
		name = `BetterServ ${module}`;
	}
	if (list.length > 0) {
		console.group(`%c[${name}]`, "color: green", string);
		list.forEach((item, index) => {
			console.log(`%c[${index + 1}/${list.length}]`, "color: green", item);
		});
		console.groupEnd();
	} else {
		console.log("%c[BetterServ]", "color: green", string);
	}
}

function betterError(string, module = "") {
	let name = "BetterServ";
	if (module) {
		name = `BetterServ ${module}`;
	}
	console.log(`%c[${name}]`, "color: red", string);
}

const BETTERSERV_URL = browser.runtime.getURL("");
const BASE_URL = `${window.location.toString().split("/iserv")[0]}/iserv`;
const ADD_FOLDER_URL = `${BASE_URL}/file/add/folder`;
const UPLOAD_FILE_URL = `${BASE_URL}/file/upload`;
const BASE_FOLDER_URL = `${BASE_URL}/file/-`;
const DEFAULT_FILES = [];
// const DEFAULT_FILES = ["settings.json", "banner.png", "README.md"];

main();

async function main() {
	console.log("%cBetterIserv loaded", "font-size: 30px");

	document.addEventListener("DOMContentLoaded", () => {
		const sidebar = document.getElementById("idesk-sidebar");
		if (sidebar) {
			buildSidebar(sidebar);
		} else {
			betterLog("Sidebar not found");
		}
	});

	let exists = 0;
	const messages = [];

	const folderExists = await getFileExists(".betterserv");
	messages.push(
		folderExists ? "✅ .betterserv exists" : "❌ .betterserv does not exist",
	);
	exists += folderExists;

	for (const filename of DEFAULT_FILES) {
		const fileExists = await getFileExists(`.betterserv/${filename}`);
		messages.push(
			fileExists ? `✅ ${filename} exists` : `❌ ${filename} does not exist`,
		);
		exists += fileExists;
	}

	if (exists < DEFAULT_FILES.length + 1) {
		betterLog(
			`${exists}/${DEFAULT_FILES.length + 1} default files are present. Creating remaining ${DEFAULT_FILES.length + 1 - exists}`,
			messages,
		);
		await createDefaultFiles();
	} else {
		betterLog(
			`${DEFAULT_FILES.length + 1}/${DEFAULT_FILES.length + 1} Default files exist. Skipping creation`,
			messages,
		);
	}
}

async function buildSidebar(sidebar) {
	betterLog("Building sidebar");
	let likedItems = await getStorage("betterserv-liked");

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
	if (liked) {
		for (const likedItem of likedItems) {
			if (!likedItem[0].inludes(window.location.host)) continue;
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
}

async function createDefaultFiles() {
	const token = await getFileFactoryToken();
	await createFolder(".betterserv", "", token);
}

async function createFolder(name, path, token) {
	await fetch(ADD_FOLDER_URL, {
		credentials: "include",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"X-Requested-With": "XMLHttpRequest",
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-origin",
		},
		body: `file_factory%5Bitem%5D%5Bname%5D=${name}&file_factory%5Bpath%5D=${path}&file_factory%5B_token%5D=${token}&file_factory%5Bsubmit%5D=`,
		method: "POST",
		mode: "cors",
	});
}

async function getFileFactoryToken() {
	const response = await fetch(ADD_FOLDER_URL);
	const html = await response.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const node = doc.documentElement;
	return node.querySelector("#file_factory__token").value;
}

async function getUploadToken() {
	const response = await fetch(BASE_FOLDER_URL);
	const html = await response.text();
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, "text/html");
	const node = doc.documentElement;
	return node.querySelector("#upload__token").value;
}

async function getFileExists(path) {
	const response = await fetch(`${BASE_FOLDER_URL}/${path}`);
	return !response.redirected;
}

function uploadFile(filename, path, fileContent, uploadToken) {
	const formData = new FormData();
	formData.append("upload[path]", path);
	formData.append("upload[_token]", uploadToken);

	const blob = new Blob([fileContent], { type: "application/octet-stream" });
	formData.append("upload[file][]", blob, filename);

	fetch(UPLOAD_FILE_URL, {
		method: "POST",
		body: formData,
	})
		.then((response) => {
			if (!response.ok) {
				betterError("File upload failed");
			}
			return response.text();
		})
		.then((data) => {
			betterLog("File uploaded successfully:", [data]);
		})
		.catch((error) => {
			error("File upload failed", [error.toString()]);
		});
}

function getStorage(key) {
	return browser.storage.sync.get(key).then((res) => res[key]);
}

/**
 *
 * <span class="material-symbols-outlined">check_circle</span>
 * https://fonts.google.com/icons?query=ion&icon.platform=web
 * why is philosophie so stupid
 */
