/**
 * Share utilities for encoding/decoding project data in URLs.
 * Uses pako compression + base64 encoding to fit layer data in URL hash.
 */
import pako from 'pako';

/**
 * Compress and encode layer data into a URL-safe string.
 */
export function encodeSharePayload(data: Record<string, any>): string {
    const json = JSON.stringify(data);
    const compressed = pako.deflate(json, { level: 9 });
    // Convert to base64, then make URL-safe
    const binary = String.fromCharCode(...compressed);
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode and decompress a share payload from URL hash.
 */
export function decodeSharePayload(payload: string): Record<string, any> | null {
    try {
        // Restore base64 padding and characters
        let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        const binary = atob(base64);
        const compressed = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            compressed[i] = binary.charCodeAt(i);
        }
        const decompressed = pako.inflate(compressed);
        const json = new TextDecoder().decode(decompressed);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Generate a share URL for the current page with encoded project data.
 */
export function generateShareUrl(layers: any[], platform: string, display: { x: number; y: number }, title?: string): string {
    const payload = {
        v: 1, // version for future schema evolution
        platform,
        display: [display.x, display.y],
        layers,
        title: title || 'Lopaka Design',
    };
    const encoded = encodeSharePayload(payload);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#share=${encoded}`;
}

/**
 * Extract share data from the current URL hash if present.
 */
export function getShareDataFromUrl(): Record<string, any> | null {
    const hash = window.location.hash;
    if (!hash.startsWith('#share=')) {
        return null;
    }
    const payload = hash.substring('#share='.length);
    return decodeSharePayload(payload);
}

/**
 * Check if the current URL contains share data.
 */
export function isShareMode(): boolean {
    return window.location.hash.startsWith('#share=');
}
