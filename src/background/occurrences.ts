import * as backend from './backend.js';

const deckVocabOccurMap = new Map<string, Map<string, number>>();

export async function resetOccurrenceMaps(deck_ids: number[] | string) {
    deck_ids = typeof deck_ids === 'number' ? [deck_ids] : deck_ids;
    if (deck_ids == 'all') deck_ids = (await backend.listUserDecks())[0];
    if (typeof deck_ids === 'string') {
        deck_ids = deck_ids.split(',').map(Number);
    }
    deckVocabOccurMap.clear();
    for (const deck_id of deck_ids as number[]) {
        await fetchOccurrenceMap(deck_id);
    }
    localStorage.setItem('occurMap', mapToJson(deckVocabOccurMap));
    console.log('Occurrences synced with server');
}

export async function getOccurrence(vid: number, sid: number, deck_ids: number[] | string) {
    deck_ids = typeof deck_ids === 'number' ? [deck_ids] : deck_ids;
    if (deck_ids == 'all') deck_ids = (await backend.listUserDecks())[0];
    if (typeof deck_ids === 'string') {
        deck_ids = deck_ids.split(',').map(Number);
    }
    let totalOccurrences = 0;
    for (const deck_id of deck_ids as number[]) {
        const vocab_id = [vid, sid].join(',');
        const occurMap = await getVocabOccurMap(deck_id);
        if (occurMap) {
            const occurrences = occurMap.get(vocab_id) || 0;
            totalOccurrences += occurrences;
        }
    }
    return totalOccurrences;
}

export function incrementOccurrence(vid: number, sid: number, deck_id: number) {
    const vocabOccurMap = deckVocabOccurMap.get(deck_id.toString());
    if (!vocabOccurMap) return;
    const value = vocabOccurMap.get([vid, sid].join(',')) || 0;
    vocabOccurMap.set([vid, sid].join(','), value + 1);
    deckVocabOccurMap.set(deck_id.toString(), vocabOccurMap);
    setCachedOccurMap(deck_id, vocabOccurMap);
    return value + 1;
}

async function getVocabOccurMap(deck_id: number) {
    const localOccurMap = deckVocabOccurMap.get(deck_id.toString());
    if (localOccurMap) {
        console.log(`Occurance map for deck ${deck_id} fetched locally`);
        return localOccurMap;
    }

    const cachedOccurMapJson = localStorage.getItem('occurMap');
    if (cachedOccurMapJson) {
        const cachedOccurMap = jsonToMap(cachedOccurMapJson).get(deck_id.toString());
        if (cachedOccurMap) {
            deckVocabOccurMap.set(deck_id.toString(), cachedOccurMap);
            console.log(`Occurance map for deck ${deck_id} fetched from localstorage`);
            return cachedOccurMap;
        }
    }
    return await fetchOccurrenceMap(deck_id);
}

async function fetchOccurrenceMap(deck_id: number) {
    const occurenceMap = (await backend.getVocabOccurenceMap(deck_id))[0];

    deckVocabOccurMap.set(deck_id.toString(), occurenceMap);
    setCachedOccurMap(deck_id, occurenceMap);

    console.log(`Occurance map for deck ${deck_id} fetched from api`);

    return occurenceMap;
}

function setCachedOccurMap(deck_id: number, map: Map<string, number>) {
    if (!localStorage.getItem('occurMap')) {
        localStorage.setItem('occurMap', mapToJson(deckVocabOccurMap));
    }
    const occurMapJson = localStorage.getItem('occurMap');
    if (occurMapJson) {
        const occurMap = jsonToMap(occurMapJson);
        occurMap.set(deck_id.toString(), map);
        localStorage.setItem('occurMap', mapToJson(occurMap));
    }
}

function mapToJson(map: Map<string, any>) {
    return JSON.stringify(Object.fromEntries([...map].map(([key, innerMap]) => [key, Object.fromEntries(innerMap)])));
}

function jsonToMap(json: string) {
    const obj = JSON.parse(json) as object;
    const map = new Map<string, Map<string, number>>(
        Object.entries(obj).map(([key, value]) => [key, new Map(Object.entries(value as Record<string, number>))]),
    );
    return map;
}
