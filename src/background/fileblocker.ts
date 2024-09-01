import { browser } from "browser-namespace";

browser.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.url.includes("iserv/file") && details.url.includes("?_=") && !details.url.includes("?betterfiles")) {
            return { cancel: true };
        }
    },
    { urls: ["<all_urls>"] },
    ["blocking"],
);
