const accountForm = document.querySelector("form");

main();

async function main() {
	const domain = new URLSearchParams(window.location.search).get("iserv");
	const urls = (await getStorage("betterserv-urls")) || [];

	if (!urls.includes(domain)) window.close();

	const domainSpans = document.querySelectorAll("span.domain");
	for (const domainSpan of domainSpans) {
		domainSpan.textContent = domain;
	}

	const username_input = accountForm.querySelector("input[name='username']");
	const password_input = accountForm.querySelector("input[name='password']");
	const account_submit = accountForm.querySelector("button[type='submit']");

	const settings = await getCreds(domain);
	username_input.value = settings.username || "";
	password_input.placeholder = "*".repeat(settings.password.length) || "";

	account_submit.disabled = !username_input.value || !password_input.value;
	username_input.oninput = password_input.oninput = () => {
		account_submit.disabled = !username_input.value || !password_input.value;
	};

	accountForm.onsubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(accountForm);
		await setStorage("betterserv-credentials", {
			[domain]: Object.fromEntries(formData),
		});
	};
}

async function getCreds(domain) {
	const credentials = (await getStorage("betterserv-credentials")) || {};
	return credentials[domain] || {};
}

async function getStorage(key) {
	return await browser.storage.sync.get(key).then((res) => res[key]);
}

async function setStorage(key, value) {
	return await browser.storage.sync.set({ [key]: value });
}
