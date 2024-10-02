import { type Credentials, type GeneralSettings, getCredentialsForDomain, getGeneralSettingsForDomain, getUntisCredentialsForDomain, setCredentialsForDomain, setGeneralSettingsForDomain, setUntisCredentialsForDomain, type UntisCredentials } from "./storage";

setup();

async function setup() {
    const domain = new URLSearchParams(window.location.search).get("iserv");
    if (!domain) {
        alert("Do not manually open this page. It is used by the extension.");
        return;
    }

    const domainSpans = document.querySelectorAll(".domain");
    for (const domainSpan of domainSpans) {
        domainSpan.textContent = domain
    }

    const inputs = document.querySelectorAll("input");
    for (const input of inputs) {
        input.addEventListener("input", onValueChange);
    }

    const generalForm = document.getElementById("general") as HTMLFormElement;
    const accountForm = document.getElementById("account") as HTMLFormElement;
    const untisForm = document.getElementById("untis") as HTMLFormElement;

    generalForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await setGeneralSettingsForDomain(domain, {
            "hide-login": generalForm["hide-login"].checked,
            "tictactoe": generalForm.tictactoe.checked,
            "tictactoe-difficulty": generalForm["tictactoe-difficulty"].value,
        } as GeneralSettings);
        disableSubmitButton(generalForm);
    });

    accountForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await setCredentialsForDomain(domain, {
            "username": accountForm.username.value,
            "password": accountForm.password.value
        } as Credentials);
        disableSubmitButton(accountForm);
    });

    untisForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        await setUntisCredentialsForDomain(domain, {
            "school": untisForm.school.value,
            "url": untisForm.url.value,
            "username": untisForm.username.value,
            "password": untisForm.password.value
        } as UntisCredentials);
        disableSubmitButton(untisForm);
    });

    const generalSettings = await getGeneralSettingsForDomain(domain);
    const credentials = await getCredentialsForDomain(domain);
    const untisCredentials = await getUntisCredentialsForDomain(domain);

    generalForm["hide-login"].checked = generalSettings["hide-login"];
    generalForm["tictactoe-difficulty"].value = generalSettings["tictactoe-difficulty"];
    generalForm.tictactoe.checked = generalSettings.tictactoe;

    accountForm.username.value = credentials.username;
    accountForm.password.value = credentials.password;

    untisForm.school.value = untisCredentials.school;
    untisForm.url.value = untisCredentials.url;
    untisForm.username.value = untisCredentials.username;
    untisForm.password.value = untisCredentials.password;


}

function onValueChange(event: Event) {
    const target = event.target as HTMLElement;
    if (target.tagName !== "INPUT") return;
    const form = target.closest("form") as HTMLFormElement;
    const submitButton = form.querySelector("button[type=submit]") as HTMLButtonElement;
    submitButton.disabled = false;
}

function disableSubmitButton(form: HTMLFormElement) {
    const submitButton = form.querySelector("button[type=submit]") as HTMLButtonElement;
    submitButton.disabled = true;
}