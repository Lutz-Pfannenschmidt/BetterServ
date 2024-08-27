document.addEventListener("DOMContentLoaded", main);

let selectAll = true;

async function main() {
	const table = document.querySelector("#files");
	if (!table) {
		betterError("File table not found", "Files");
		return;
	}

	setInterval(() => {
		prettierFiles();
	}, 500);

	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			prettierFiles();
		}
	});
	observer.observe(table, { childList: true });
	betterLog("Observer started", undefined, "Files");
}

async function prettierFiles() {
	const checkbox_head = document.querySelector("#files thead th.files-id");
	if (!checkbox_head) return;
	checkbox_head.onclick = () => {
		const checkboxes = document.querySelectorAll(
			"#files tbody input[type=checkbox]",
		);
		for (const checkbox of checkboxes) {
			checkbox.checked = selectAll;
		}
		const custom_checkboxes = document.querySelectorAll(
			".betterserv-checkbox:not(.like)",
		);
		for (const checkbox of custom_checkboxes) {
			checkbox.classList.toggle("checked", selectAll);
		}
		selectAll = !selectAll;
	};

	const rows = document.querySelectorAll("#files tbody tr");
	if (!rows) return;

	// [[url, name], [url, name], ...]
	let liked = await getStorage("betterserv-liked");
	if (typeof liked === "undefined") {
		await browser.storage.sync.set({
			"betterserv-liked": [],
		});
		liked = [];
	}

	if (typeof liked !== "object") return;

	const old_checkboxes = document.querySelectorAll(
		"#files tbody .betterserv-checkbox",
	);
	for (const checkbox of old_checkboxes) {
		checkbox.outerHTML = "";
	}

	for (const row of rows) {
		if (row.nodeName.toLowerCase() !== "tr") return;
		row.classList.add("betterserv-modified");

		const td = row.querySelector("td.files-id");
		if (!td) return;
		td.style.display = "flex";
		const checkbox = td.querySelector("input[type=checkbox]");
		checkbox.style.display = "none";

		const url = row.querySelector(".files-name a").href;
		const name = row.querySelector(".files-name").textContent;
		let isLiked = liked.some((item) => item[0] === url && item[1] === name);

		const new_checkbox = document.createElement("a");
		new_checkbox.classList.add("betterserv-checkbox");
		new_checkbox.href = "#";
		new_checkbox.addEventListener("click", (e) => {
			e.preventDefault();
			new_checkbox.classList.toggle("checked");
		});
		td.appendChild(new_checkbox);

		const like_checkbox = document.createElement("a");
		like_checkbox.classList.add("betterserv-checkbox", "like");
		like_checkbox.href = "#";
		if (isLiked) like_checkbox.classList.add("checked");
		like_checkbox.addEventListener("click", async (e) => {
			e.preventDefault();
			like_checkbox.classList.toggle("checked");
			isLiked = !isLiked;

			if (isLiked) {
				liked.push([url, name]);

				await browser.storage.sync.set({
					"betterserv-liked": liked,
				});
			} else {
				liked = liked.filter((item) => item[0] !== url && item[1] !== name);

				await browser.storage.sync.set({
					"betterserv-liked": liked,
				});
			}
		});
		td.appendChild(like_checkbox);
	}
}

function getStorage(key) {
	return browser.storage.sync.get(key).then((res) => res[key]);
}
