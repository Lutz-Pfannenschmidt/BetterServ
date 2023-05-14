let iservBaseUri = getStorage("iservBaseUri")
iservBaseUri.then((value) => {
    if (window.location.toString().includes(value.iservBaseUri)) {
        main(value.iservBaseUri)
    }
})


function main(url) {
    let css = ["css/symbols.css", "css/ubuntu.css", "css/style.css", "css/betterserv.css"]
    let js = ["js/inject.js"]

    for (const j of js) {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = browser.runtime.getURL(j);
        document.getElementsByTagName( "head" )[0].appendChild( script );
    }

    for (const j of css) {
        let link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = browser.runtime.getURL(j);
        document.getElementsByTagName( "head" )[0].appendChild( link );
    }

    let extensionUrl = document.createElement("var");
    extensionUrl.textContent = browser.runtime.getURL("")
    extensionUrl.id = "BetterServUrl"
    document.getElementsByTagName( "head" )[0].appendChild( extensionUrl )

    let iServUrl = document.createElement("var");
    iServUrl.textContent = url
    iServUrl.id = "IServUrl"
    document.getElementsByTagName( "head" )[0].appendChild( iServUrl )

}

async function getStorage(key) {
    return await browser.storage.sync.get(key);
}