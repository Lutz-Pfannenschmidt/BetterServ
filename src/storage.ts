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

export async function getCredentialsForDomain(domain: string): Promise<Credentials> {
    return await getFromBrowserStorage(`betterserv-credentials-${domain}`) as Credentials;
}

export async function setCredentialsForDomain(domain: string, settings: Credentials): Promise<void> {
    await setInBrowserStorage(`betterserv-credentials-${domain}`, settings);
}

export interface Credentials {
    "username": string;
    "password": string;
}

export async function getStarredFilesForDomain(domain: string): Promise<BetterStarred[]> {
    const starred = await getFromBrowserStorage(`betterserv-starred-${domain}`) as BetterStarred[];
    if (!Array.isArray(starred)) return [];
    if (starred.length === 0) {
        await setStarredFilesForDomain(domain, []);
        return [];
    }
    return starred;
}

export async function setStarredFilesForDomain(domain: string, starred: BetterStarred[]): Promise<void> {
    await setInBrowserStorage(`betterserv-starred-${domain}`, starred);
}

export interface BetterStarred {
    "path": string;
    "name": string;
}