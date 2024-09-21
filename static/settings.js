const accountForm = document.getElementById("account");
const generalForm = document.getElementById("general");

main();

async function main() {
	const domain = new URLSearchParams(window.location.search).get("iserv");
	const urls = (await getStorage("betterserv-urls")) || [];

	if (!urls.includes(domain)) window.close();

	const domainSpans = document.querySelectorAll("span.domain");
	for (const domainSpan of domainSpans) {
		domainSpan.textContent = domain;
	}

	// General Settings
	const generalSettings = await getGeneralSettings(domain);
	for (const key in generalSettings) {
		const value = generalSettings[key];
		const input = generalForm.querySelector(`input[name='${key}']`);
		if (!input) continue;
		if (input.type === "checkbox") {
			input.checked = value;
		} else {
			input.value = value;
		}
	}

	generalForm.onsubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(generalForm);
		const settings = Object.fromEntries(formData);

		Object.keys(settings).forEach((key, index) => {
			let newValue = settings[key];
			if (newValue === "on") newValue = true;
			settings[key] = newValue;
		});

		await setGeneralSettings(domain, settings);
	};
	// End General Settings

	// Account Settings
	const username_input = accountForm.querySelector("input[name='username']");
	const password_input = accountForm.querySelector("input[name='password']");
	const account_submit = accountForm.querySelector("button[type='submit']");

	const credentials = await getCredentials(domain);
	username_input.value = credentials.username || "";
	password_input.placeholder = "*".repeat(credentials.password.length) || "";

	account_submit.disabled = !username_input.value || !password_input.value;
	username_input.oninput = password_input.oninput = () => {
		account_submit.disabled = !username_input.value || !password_input.value;
	};

	accountForm.onsubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(accountForm);
		await setCredentials(
			domain,
			formData.get("username"),
			formData.get("password"),
		);
	};
	// End Account Settings

	// Untis Account Settings
	const untisForm = document.getElementById("untis_account");
	const untis_school_input = untisForm.querySelector("input[name='school']");
	const untis_url_input = untisForm.querySelector("input[name='url']");
	const untis_uname_input = untisForm.querySelector("input[name='username']");
	const untis_pwd_input = untisForm.querySelector("input[name='password']");
	const untis_submit = untisForm.querySelector("button[type='submit']");

	const untis_credentials = await getUntisCredentials(domain);
	untis_school_input.value = untis_credentials.school || "";
	untis_url_input.value = untis_credentials.url || "";
	untis_uname_input.value = untis_credentials.username || "";
	untis_pwd_input.placeholder =
		"*".repeat(untis_credentials.password.length) || "";

	untis_submit.disabled =
		!untis_school_input.value ||
		!untis_url_input.value ||
		!untis_uname_input.value ||
		!untis_pwd_input.value;
	untis_school_input.oninput =
		untis_url_input.oninput =
		untis_uname_input.oninput =
		untis_pwd_input.oninput =
			() => {
				untis_submit.disabled =
					!untis_school_input.value ||
					!untis_url_input.value ||
					!untis_uname_input.value ||
					!untis_pwd_input.value;
			};

	untisForm.onsubmit = async (e) => {
		e.preventDefault();
		const formData = new FormData(untisForm);
		await setStorage(`betterserv-untis-${domain}`, {
			school: formData.get("school"),
			url: formData.get("url"),
			username: formData.get("username"),
			password: formData.get("password"),
		});
	};
}

async function getGeneralSettings(domain) {
	const generalSettings = await getStorage(`betterserv-general-${domain}`);
	if (!generalSettings) {
		await setStorage(`betterserv-general-${domain}`, {});
		return {};
	}
	return generalSettings;
}

async function getCredentials(domain) {
	const settings = await getStorage(`betterserv-credentials-${domain}`);
	if (!settings) {
		await setStorage(`betterserv-credentials-${domain}`, {
			username: "",
			password: "",
		});
		return {};
	}
	return settings;
}

async function getUntisCredentials(domain) {
	const settings = await getStorage(`betterserv-untis-${domain}`);
	if (!settings) {
		await setStorage(`betterserv-untis-${domain}`, {
			school: "",
			url: "",
			username: "",
			password: "",
		});
		return {};
	}
	return settings;
}

async function setCredentials(domain, username, password) {
	await setStorage(`betterserv-credentials-${domain}`, { username, password });
}

async function setGeneralSettings(domain, settings) {
	await setStorage(`betterserv-general-${domain}`, settings);
}

async function getStorage(key) {
	return await browser.storage.sync.get(key).then((res) => res[key]);
}

async function setStorage(key, value) {
	return await browser.storage.sync.set({ [key]: value });
}
