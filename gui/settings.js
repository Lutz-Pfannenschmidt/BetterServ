btn = document.getElementById("submit")
input = document.getElementById("uriInput")

getStorage("iservBaseUri").then((value) => {
    input.placeholder = value || "https://yourschool.com/iserv/"
})

btn.addEventListener("click", (e) => {
    e.preventDefault()
    let iservBaseUri = input.value
    browser.storage.sync.set({iservBaseUri})
    window.location.pathname = "/gui/index.html"
})

async function getStorage(key) {
    let resp = await browser.storage.sync.get(key)
    return resp[key]
}