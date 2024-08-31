import { browser } from "browser-namespace";

export async function getFromBrowserStorage(key: string): Promise<unknown> {
    return await browser.storage.sync.get(key).then((res) => res[key]);
}

export async function setInBrowserStorage(key: string, value: unknown): Promise<void> {
    await browser.storage.sync.set({ [key]: value });
}

export async function getGeneralSettingsForDomain(domain: string): Promise<GeneralSettings> {
    return await getFromBrowserStorage(`betterserv-general-${domain}`) as GeneralSettings;
}

export async function setGeneralSettingsForDomain(domain: string, settings: GeneralSettings): Promise<void> {
    await setInBrowserStorage(`betterserv-general-${domain}`, settings);
}

export interface GeneralSettings {
    "hide-login": boolean;
    "custom-files": boolean;
    "tictactoe": boolean;
    "tictactoe-difficulty": number;
}