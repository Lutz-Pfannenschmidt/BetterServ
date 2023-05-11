btn = document.getElementById("submit")
inpt = document.getElementById("uriInput")

let iservBaseUri = getStorage("iservBaseUri")
iservBaseUri.then((value) => {
    inpt.placeholder = value.iservBaseUri
})

btn.addEventListener("click", (e) => {
    e.preventDefault()
    let iservBaseUri = inpt.value
    browser.storage.sync.set({iservBaseUri});
})

async function getStorage(key) {
    return await browser.storage.sync.get(key)
}