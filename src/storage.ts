import { browser } from "browser-namespace";
import _ from "lodash";

export async function getFromBrowserStorage(key: string): Promise<unknown> {
    return await browser.storage.sync.get(key).then((res) => res[key]);
}

export async function setInBrowserStorage(key: string, value: unknown): Promise<void> {
    await browser.storage.sync.set({ [key]: value });
}

export async function getGeneralSettingsForDomain(domain: string): Promise<GeneralSettings> {
    const settings = await getFromBrowserStorage(`betterserv-general-${domain}`) as GeneralSettings;
    if (_.isEmpty(settings)) {
        setGeneralSettingsForDomain(domain, {
            "hide-login": false,
            "custom-files": false,
            "tictactoe": false,
            "tictactoe-difficulty": 1
        });
        return getGeneralSettingsForDomain(domain);
    }
    return settings;
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
    const creds = await getFromBrowserStorage(`betterserv-credentials-${domain}`) as Credentials;
    if (_.isEmpty(creds)) {
        setCredentialsForDomain(domain, {
            "username": "",
            "password": ""
        });
        return getCredentialsForDomain(domain);
    }
    return creds;
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
    if (_.isEmpty(starred)) {
        setStarredFilesForDomain(domain, []);
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

export async function getUntisCredentialsForDomain(domain: string): Promise<UntisCredentials> {
    const creds = await getFromBrowserStorage(`betterserv-untis-${domain}`) as UntisCredentials;
    if (_.isEmpty(creds)) {
        setUntisCredentialsForDomain(domain, {
            "school": "",
            "username": "",
            "password": "",
            "url": ""
        });
        return getUntisCredentialsForDomain(domain);
    }
    return creds;
}

export async function setUntisCredentialsForDomain(domain: string, settings: UntisCredentials): Promise<void> {
    await setInBrowserStorage(`betterserv-untis-${domain}`, settings);
}

export interface UntisCredentials {
    "school": string;
    "username": string;
    "password": string;
    "url": string;
}