buildTable();

async function buildTable() {
	const list = document.getElementById("betterserv-liked");
	list.innerHTML = "";
	const folders = (await getStorage("betterserv-liked")) || [];

	folders.forEach(async (folder, i) => {
		const tr = document.createElement("tr");
		const nameTd = document.createElement("td");
		const actionTd = document.createElement("td");
		const folderLink = document.createElement("a");
		const removeLink = document.createElement("a");
		folderLink.href = folder[0];
		folderLink.textContent = folder[1];
		removeLink.href = "#";
		removeLink.textContent = "heart_minus";
		removeLink.style.color = "var(--betterserv-accent)";
		removeLink.classList.add("icons");

		removeLink.addEventListener(
			"click",
			async (e) => {
				e.preventDefault();
				const folders = await getStorage("betterserv-liked");

				folders.splice(i, 1);

				await browser.storage.sync.set({
					"betterserv-liked": folders,
				});

				buildTable();
			},
			{ once: true },
		);

		nameTd.appendChild(folderLink);
		actionTd.appendChild(removeLink);
		tr.appendChild(nameTd);
		tr.appendChild(actionTd);
		list.appendChild(tr);
	});
}

async function getStorage(key) {
	const resp = await browser.storage.sync.get(key);
	return resp[key];
}
