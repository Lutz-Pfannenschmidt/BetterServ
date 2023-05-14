class BetterServ {
    static log(string, list = []) {
        if (list.length > 0) {
            console.group("%c[BetterServ]", "color: green", string)
            list.forEach((item, index) => {
                console.log(`%c[${index + 1}/${list.length}]`, "color: green", item)
            })
            console.groupEnd()
        } else {
            console.log("%c[BetterServ]", "color: green", string)
        }
    }
    static error(string) {
        console.log("%c[BetterServ]", "color: green", string)
    }
}

const BETTERSERV_URL = document.getElementById("BetterServUrl").textContent

let BASE_URL = document.getElementById("IServUrl").textContent
BASE_URL = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL

const ADD_FOLDER_URL = BASE_URL + "/file/add/folder"
const UPLOAD_FILE_URL = BASE_URL + "/file/upload"
const BASE_FOLDER_URL = BASE_URL + "/file/-"
const DEFAULT_FILES = []
// const DEFAULT_FILES = ["settings.json", "banner.png", "README.md"]

main()

async function main() {
    console.log("%cBetterIserv loaded", "font-size: 30px")


    let sidebar = document.getElementById("idesk-sidebar")
    let betterServPanel = document.createElement("div")
    betterServPanel.classList.add("panel")
    betterServPanel.classList.add("panel-dashboard")
    betterServPanel.classList.add("panel-default")
    betterServPanel.innerHTML = `
        <div class="panel-heading">
            <h2 class="panel-title betterserv-title">[BetterServ] <a href="https://github.com/Lutz-Pfannenschmidt/BetterServ">GitHub</a></h2>
        </div>
        <div class="panel-body">
            <h2>Settings</h2>
            <div>
                <label class="betterserv-switch">
                    <input type="checkbox" checked id="myCheckbox">
                    <span class="betterserv-slider betterserv-round"></span>
                </label>
                Change Document Title
            </div>
            <div>
                <select id="betterserv-banner-selection">
                    <option value="gradient">Linear Gradient (Default)</option>
                    <option value="image">Custom Image</option>
                    <option value="color">A Single Color</option>
                </select>
                <label for="betterserv-banner-selection">Type of banner</label>
            </div>

        </div>`

    sidebar.prepend(betterServPanel)

    const checkbox = document.getElementById('myCheckbox')

    checkbox.addEventListener('change', (event) => {
        if (event.currentTarget.checked) {
            alert('checked');
        } else {
            alert('not checked');
        }
    })



    let exists = 0
    let messages = []

    let folderExists = await getFileExists(".betterserv")
    messages.push(folderExists ? `✅ .betterserv exists` : `❌ .betterserv does not exist`)
    exists += folderExists

    for (const filename of DEFAULT_FILES) {
        let fileExists = await getFileExists(".betterserv/" + filename)
        messages.push(fileExists ? `✅ ${filename} exists` : `❌ ${filename} does not exist`)
        exists += fileExists
    }

    if (exists < DEFAULT_FILES.length + 1) {
        BetterServ.log(`${exists}/${DEFAULT_FILES.length + 1} default files are present. Creating remaining ${DEFAULT_FILES.length + 1 - exists}`, messages)
        await createDefaultFiles()
    } else {
        BetterServ.log(`${DEFAULT_FILES.length + 1}/${DEFAULT_FILES.length + 1} Default files exist. Skipping creation`, messages)
    }
}

async function createDefaultFiles() {
    let token = await getFileFactoryToken()
    await createFolder(".betterserv", "", token)
}

async function createFolder(name, path, token) {
    await fetch(ADD_FOLDER_URL, {
        "credentials": "include",
        "headers": {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin"
        },
        "body": `file_factory%5Bitem%5D%5Bname%5D=${name}&file_factory%5Bpath%5D=${path}&file_factory%5B_token%5D=${token}&file_factory%5Bsubmit%5D=`,
        "method": "POST",
        "mode": "cors"
    })
}

async function getFileFactoryToken(){
    let response = await fetch(ADD_FOLDER_URL)
    let html = await response.text()
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const node = doc.documentElement;
    return node.querySelector("#file_factory__token").value
}

async function getUploadToken(){
    let response = await fetch(BASE_FOLDER_URL)
    let html = await response.text()
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const node = doc.documentElement;
    return node.querySelector("#upload__token").value
}

async function getFileExists(path){
    let response = await fetch(`${BASE_FOLDER_URL}/${path}`)
    return !response.redirected
}

function uploadFile(filename, path, fileContent, uploadToken) {
    let formData = new FormData();
    formData.append('upload[path]', path);
    formData.append('upload[_token]', uploadToken);

    let blob = new Blob([fileContent], { type: 'application/octet-stream' });
    formData.append('upload[file][]', blob, filename);

    fetch(UPLOAD_FILE_URL, {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                BetterServ.error('File upload failed');
            }
            return response.text();
        })
        .then(data => {
            BetterServ.log('File uploaded successfully:', [data]);
        })
        .catch(error => {
            BetterServ.error('File upload failed', [error.toString()]);
        });
}


/**
 * 
 * <span class="material-symbols-outlined">check_circle</span>
 * https://fonts.google.com/icons?query=ion&icon.platform=web
 * why is philosophie so stupid
 */