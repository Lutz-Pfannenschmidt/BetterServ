// browser.webRequest.onBeforeRequest.addListener(
// 	(details) => {
// 		const urlMatches =
// 			details.url.includes("?_=") &&
// 			details.url.includes("iserv") &&
// 			details.url.includes("file");

// 		const isBetterServ = details.url.includes("?bs=true");

// 		if (!isBetterServ && urlMatches) {
// 			console.log("trying to block request to iserv files");
// 			return { cancel: true };
// 		}
// 	},
// 	{ urls: ["<all_urls>"] },
// 	["blocking"],
// );
