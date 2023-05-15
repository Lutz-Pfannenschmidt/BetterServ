getStorage("iservBaseUri").then((value) => {
    if (!value) {
        window.location.pathname = "/gui/settings.html"
    }
})

buildTable()

async function buildTable() {
    let list = document.getElementById("betterServLikedFolders")
    list.innerHTML = ""
    const folders = await getStorage("betterServLikedFolders") || []

    folders.forEach(async (folder, i) => {
        let tr = document.createElement("tr")
        let nameTd = document.createElement("td")
        let actionTd = document.createElement("td")
        let folderLink = document.createElement("a")
        let removeLink = document.createElement("a")
        folderLink.href = folder[0]
        folderLink.textContent = folder[1]
        removeLink.href = "#"
        removeLink.textContent = "heart_minus"
        removeLink.classList.add("icons")

        removeLink.addEventListener("click", async (e) => {
            e.preventDefault();
            const folders = await getStorage("betterServLikedFolders");

            folders.splice(i, 1);

            await browser.storage.sync.set({
                "betterServLikedFolders": folders
            });

            buildTable();
        }, { once: true })

        nameTd.appendChild(folderLink)
        actionTd.appendChild(removeLink)
        tr.appendChild(nameTd)
        tr.appendChild(actionTd)
        list.appendChild(tr)
    });
}

async function getStorage(key) {
    let resp = await browser.storage.sync.get(key)
    return resp[key]
}