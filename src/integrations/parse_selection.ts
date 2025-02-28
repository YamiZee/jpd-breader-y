// @reader content-script

import { paragraphsInNode, parseParagraphs } from './common.js';
import { requestParse } from '../content/background_comms.js';
import { showError } from '../content/toast.js';

try {
    const paragraphs = paragraphsInNode(document.body);

    if (paragraphs.length > 0) {
        const [batches, applied] = parseParagraphs(paragraphs);
        requestParse(batches);
        Promise.allSettled(applied);
    }
} catch (error) {
    showError(error);
}
