import { DeckId } from '../types.js';

export type Keybind = { key: string; code: string; modifiers: string[] } | null;
// Common types shared across both content and background scripts

export const CURRENT_SCHEMA_VERSION = 1;

export type Config = {
    schemaVersion: number;

    apiToken: string | null;

    miningDeckId: DeckId | null;
    forqDeckId: DeckId | null;
    blacklistDeckId: DeckId | null;
    neverForgetDeckId: DeckId | null;

    contextWidth: number;
    forqOnMine: boolean;

    showPopupOnHover: boolean;
    touchscreenSupport: boolean;
    disableFadeAnimation: boolean;

    closePopupOnReview: boolean;
    gradeButtonsAtBottom: boolean;
    closeOnPopupClick: boolean;
    useShorterButtonNames: boolean;

    showPopupOnMouseClick: boolean;
    closePopupOnMouseLeave: boolean;
    newDeckIds: string;
    occurDeckIds: string;

    showPopupKey: Keybind;
    addKey: Keybind;
    dialogKey: Keybind;
    blacklistKey: Keybind;
    neverForgetKey: Keybind;
    nothingKey: Keybind;
    somethingKey: Keybind;
    hardKey: Keybind;
    goodKey: Keybind;
    easyKey: Keybind;

    customWordCSS: string;
    customPopupCSS: string;
};

export const defaultConfig: Config = {
    schemaVersion: CURRENT_SCHEMA_VERSION,

    apiToken: null,

    miningDeckId: null,
    forqDeckId: 'forq',
    blacklistDeckId: 'blacklist',
    neverForgetDeckId: 'never-forget',
    contextWidth: 1,
    forqOnMine: true,

    showPopupOnHover: false,
    touchscreenSupport: false,
    disableFadeAnimation: false,

    closePopupOnReview: true,
    gradeButtonsAtBottom: true,
    closeOnPopupClick: true,
    useShorterButtonNames: true,

    showPopupOnMouseClick: true,
    closePopupOnMouseLeave: false,
    newDeckIds: '',
    occurDeckIds: '',

    showPopupKey: { key: 'Shift', code: 'ShiftLeft', modifiers: [] },
    addKey: null,
    dialogKey: null,
    blacklistKey: null,
    neverForgetKey: null,
    nothingKey: null,
    somethingKey: null,
    hardKey: null,
    goodKey: null,
    easyKey: null,

    customWordCSS: `/***** On by default *****
These are easily editable or deletable styling options that I'm leaving on by default and think others would like too.
Feel free to delete them or surround the options you don't want with /* and */

.jpdb-word.new { color: rgb(180, 220, 255); }
.jpdb-word.not-in-deck { color: rgb(200, 200, 255); }
.jpdb-word.learning {}
.jpdb-word.due { color: rgb(255, 130, 120); }
.jpdb-word.failed { color: rgb(255, 100, 100); }
.jpdb-word.suspended {color: rgb(150, 150, 150); }

:where(.jpdb-word:not(.unparsed):hover) { text-decoration: underline; }

/*  Hide furigana unless hovering  */
.jpdb-word rt { font-size: 60%; }
.jpdb-word:not(:hover) .jpdb-furi { display: none; }

/*  Disable furigana  */
/*.jpdb-furi { display: none; }*/

/*  Transitions  */
.jpdb-word { transition: color 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }

/*  Base default settings  */
/*****
:where(.jpdb-word rt) { font-size: 60%; }
:where(.jpdb-word:not(.unparsed):hover) { text-decoration: underline; }
:where(.jpdb-word.locked) { color: rgb(119, 119, 119); }
:where(.jpdb-word.suspended) { color: rgb(119, 119, 119); }
:where(.jpdb-word.blacklisted) { color: rgb(119, 119, 119); }
:where(.jpdb-word.never-forget) { color: rgb(112, 192, 0); }
:where(.jpdb-word.not-in-deck) { color: rgba(75, 141, 255, 0.5); }
:where(.jpdb-word.new) { color: rgb(75, 141, 255); }
:where(.jpdb-word.learning) { color: rgb(94, 167, 128); }
:where(.jpdb-word.known) { color: rgb(112, 192, 0); }
:where(.jpdb-word.due) { color: rgb(255, 69, 0); }
:where(.jpdb-word.failed) { color: rgb(255, 0, 0); }
*****/`,
    customPopupCSS: `/* Make review/mining buttons bigger */
button { padding:10px 10px; font-size: 14px; flex-grow:1 }
#mine-buttons button { padding: 8px 0; }
article { max-height: 50vh }`,
};

function localStorageGet(key: string, fallback: any = null): any {
    const data = localStorage.getItem(key);
    if (data === null) return fallback;

    try {
        return JSON.parse(data) ?? fallback;
    } catch {
        return fallback;
    }
}

function localStorageSet(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
}

export function migrateSchema(config: Config) {
    if (config.schemaVersion === 0) {
        // Keybinds changed from string to object
        // We don't have all the information required to turn them into objects
        // Just delete them and let users re-enter them
        for (const key of [
            'showPopupKey',
            'blacklistKey',
            'neverForgetKey',
            'nothingKey',
            'somethingKey',
            'hardKey',
            'goodKey',
            'easyKey',
        ] as const) {
            config[key] = defaultConfig[key];
        }

        config.schemaVersion = 1;
    }
}

export function loadConfig(): Config {
    const config = Object.fromEntries(
        Object.entries(defaultConfig).map(([key, defaultValue]) => [key, localStorageGet(key, defaultValue)]),
    ) as Config;

    config.schemaVersion = localStorageGet('schemaVersion', 0);
    migrateSchema(config);

    // If the schema version is not the current version after applying all migrations, give up and refuse to load the config.
    // Use the default as a fallback.
    if (config.schemaVersion !== CURRENT_SCHEMA_VERSION) {
        return defaultConfig;
    }

    return config;
}

export function saveConfig(config: Config) {
    for (const [key, value] of Object.entries(config)) {
        localStorageSet(key, value);
    }
}
