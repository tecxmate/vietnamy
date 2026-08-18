// Best-effort screenshot of the current screen for bug reports.
//
// There is no browser API that hands us the real rendered pixels without a
// permission prompt (getDisplayMedia is unsupported on iOS Safari, which is the
// primary target), so we rasterise the live DOM instead. The result is an
// approximation — html2canvas cannot parse color-mix() or backdrop-filter, so a
// few surfaces come out flat — but the layout, text, and state of the screen all
// survive, which is what triage actually needs.

// Cap the long edge so a 3x phone screen doesn't produce a multi-megabyte upload.
const MAX_EDGE = 1000;
const JPEG_QUALITY = 0.72;

// The reporter's own UI is on screen by the time the capture runs, so exclude it
// rather than making the user wait for a capture before the modal opens.
const IGNORED_CLASSES = ['feedback-reporter', 'feedback-modal-shell'];

function shouldIgnore(element) {
    return IGNORED_CLASSES.some(name => element?.classList?.contains(name));
}

/**
 * Rasterise the current screen.
 * @returns {Promise<Blob|null>} a JPEG blob, or null if capture is not possible.
 */
export async function captureScreenshot() {
    if (typeof document === 'undefined') return null;

    try {
        // Dynamically imported so html2canvas stays out of the main bundle — it is
        // only ever needed once the user decides to file a report.
        const { default: html2canvas } = await import('html2canvas');
        const target = document.body;
        const longEdge = Math.max(target.clientWidth || 0, target.clientHeight || 0) || MAX_EDGE;

        const canvas = await html2canvas(target, {
            scale: Math.min(1, MAX_EDGE / longEdge),
            backgroundColor: getComputedStyle(document.body).backgroundColor || '#ffffff',
            logging: false,
            useCORS: true,
            ignoreElements: shouldIgnore,
        });

        return await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY);
        });
    } catch {
        // A failed screenshot must never block the report itself.
        return null;
    }
}

/**
 * Upload a captured screenshot. Returns `{ url, key }` on success, or null when
 * storage is unconfigured or the upload fails.
 */
export async function uploadScreenshot(blob) {
    if (!blob) return null;
    try {
        const response = await fetch('/api/feedback-screenshot', {
            method: 'POST',
            headers: { 'Content-Type': blob.type || 'image/jpeg' },
            body: blob,
        });
        if (!response.ok) return null;
        const result = await response.json();
        return result?.key ? { url: result.url || '', key: result.key } : null;
    } catch {
        return null;
    }
}
