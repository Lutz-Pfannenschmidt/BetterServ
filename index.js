getStorage("iservBaseUri").then(async function(value) {
    if (window.location.toString().includes(value)) {
        main(value)
    }

    if (window.location.toString().includes("/file/-")) {
        pinFileTable()
    }
})


function main(url) {
    let css = ["css/symbols.css", "css/ubuntu.css", "css/betterserv.css"]
    let js = ["js/inject.js"]

    for (const j of js) {
        let script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = browser.runtime.getURL(j)
        document.getElementsByTagName( "head" )[0].appendChild( script )
    }

    for (const j of css) {
        let link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = browser.runtime.getURL(j)
        document.getElementsByTagName( "head" )[0].appendChild( link )
    }

    let extensionUrl = document.createElement("var")
    extensionUrl.textContent = browser.runtime.getURL("")
    extensionUrl.id = "BetterServUrl"
    document.getElementsByTagName( "head" )[0].appendChild( extensionUrl )

    let iServUrl = document.createElement("var")
    iServUrl.textContent = url
    iServUrl.id = "IServUrl"
    document.getElementsByTagName( "head" )[0].appendChild( iServUrl )

}

async function pinFileTable() {
    await delay(300)

    let links = document.getElementsByTagName('a')

    for (let i = 0; i < links.length; i++) {
        links[i].addEventListener('click', async function(e) {
            if (e.target.id.includes("betterserv")) return
            await delay(10)
            window.location.reload()
        })
    }

    let table = document.getElementById("files")
    let tbody = table.querySelector("tbody")
    let entries = tbody.children
    let list = await getStorage("betterServLikedFolders")
    if (typeof list === "undefined") {
        await browser.storage.sync.set({
            "betterServLikedFolders": []
        })
        list = []
    }

    console.log(entries)

    entries.forEach(async function (entry) {
        console.log(entry)
        if(entry.nodeName.toLowerCase() !== "tr") return
        let td = entry.firstChild
        let likeFolderLink = document.createElement("a")
        let likeIcon = document.createElement("span")
        likeFolderLink.href = "#"
        likeFolderLink.appendChild(likeIcon)
        likeFolderLink.classList.add("betterserv-likeFolder")
        likeIcon.classList.add("material-symbols-outlined")
        likeIcon.textContent = "favorite"

        let checkbox = td.querySelector("input[type=checkbox]")
        checkbox.style.display = "none"

        let checkboxLink = document.createElement("a")
        let checkboxIcon = document.createElement("span")
        checkboxLink.href = "#"
        checkboxLink.appendChild(checkboxIcon)
        checkboxLink.classList.add("betterserv-checkboxFolder")
        checkboxIcon.classList.add("material-symbols-outlined")
        checkboxIcon.textContent = "check_box_outline_blank"

        checkboxLink.addEventListener("click", async function (e) {
            e.preventDefault()
            checkbox.checked = !checkbox.checked
            checkboxIcon.textContent = checkboxIcon.textContent === "check_box" ? "check_box_outline_blank" : "check_box"
        })

        let likePos = arrayContainsArray(list, [entry.querySelector(".files-name a").href, entry.querySelector(".files-name").textContent])
        let isLiked = likePos >= 0

        if (isLiked) {
            likeIcon.style.color = "var(--betterserv-accent)"
            likeIcon.innerText = "heart_minus"
        }

        likeFolderLink.addEventListener("click", async function (e) {
            e.preventDefault()
            const folders = await getStorage("betterServLikedFolders")

            if (isLiked) {
                likeIcon.style.color = "var(--betterserv-text)"
                likeIcon.innerText = "favorite"

                folders.splice(likePos, 1)

                await browser.storage.sync.set({
                    "betterServLikedFolders": folders
                })

            } else {
                likeIcon.style.color = "var(--betterserv-accent)"
                likeIcon.innerText = "heart_minus"

                folders.push([entry.querySelector(".files-name a").href, entry.querySelector(".files-name").textContent])

                await browser.storage.sync.set({
                    "betterServLikedFolders": folders
                })
            }

            isLiked = !isLiked
        })

        td.appendChild(checkboxLink)
        td.appendChild(likeFolderLink)
        td.style.display = "flex"
    })


}

const delay = ms => new Promise(res => setTimeout(res, ms))

HTMLCollection.prototype.forEach = Array.prototype.forEach

/**
 * Checks if an array contains a different array and returns its index if found, or -1 if not found.
 * @param {Array} arr1 - The main array to search in.
 * @param {Array} arr2 - The array to check for.
 * @returns {number} - The index of the subarray if found, or -1 if not found.
 */
function arrayContainsArray(arr1, arr2) {
    for (let i = 0; i < arr1.length; i++) {
        const arr = arr1[i]
        if (
            Array.isArray(arr) &&
            arr.length === arr2.length &&
            arr.every((val, index) => val === arr2[index])
        ) {
            return i
        }
    }
    return -1
}

async function getStorage(key) {
    let resp = await browser.storage.sync.get(key)
    return resp[key]
}