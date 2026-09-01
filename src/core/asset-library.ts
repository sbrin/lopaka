/**
 * Editor asset library.
 *
 * Assets come from two local sources: the icon packs bundled with the build,
 * and the images the user imported into the current session. Catalog shaping
 * and search are pure so they can be tested without the canvas stack.
 */

import {iconsList} from '/src/icons/icons';
import type {TPlatformFeatures} from '/src/platforms/platform';

export type TEditorAssetKind = 'image' | 'icon';
export type TEditorAssetSource = 'builtin' | 'session';
export type TEditorAssetColorMode = 'monochrome' | 'rgb';
export type TEditorAssetSupportedProperty = 'x' | 'y' | 'color';

export type TEditorAssetCatalogEntry = {
    assetId: string;
    kind: TEditorAssetKind;
    source: TEditorAssetSource;
    name: string;
    collection: string;
    width: number;
    height: number;
    colorMode: TEditorAssetColorMode;
};

export type TEditorAssetSearchItem = TEditorAssetCatalogEntry & {
    supportedProperties: TEditorAssetSupportedProperty[];
};

export type TEditorAssetSearchRequest = {
    query?: string;
    kinds?: TEditorAssetKind[];
    sources?: TEditorAssetSource[];
    limit?: number;
    cursor?: string;
};

export type TEditorAssetSearchResult = {items: TEditorAssetSearchItem[]; nextCursor?: string};

export type TAssetLibraryErrorCode = 'invalid_input' | 'not_found' | 'unsupported_for_platform' | 'internal_error';

export class AssetLibraryError extends Error {
    constructor(
        public readonly code: TAssetLibraryErrorCode,
        message: string
    ) {
        super(message);
        this.name = 'AssetLibraryError';
    }
}

export type TEditorResolvedAsset = TEditorAssetCatalogEntry & {
    kind: 'image' | 'icon';
    image: HTMLImageElement;
};

type TAssetCatalogRuntimeEntry = TEditorAssetCatalogEntry & {
    image?: HTMLImageElement;
    imageUrl?: string;
};

export function builtInIconAssetId(packKey: string, iconName: string): string {
    return `icon:${packKey}:${iconName}`;
}

export function sessionImageAssetId(image: TLayerImageData): string {
    return image.id != null
        ? `session-image:${image.id}`
        : `session-image:local:${encodeURIComponent(image.name)}:${image.width}x${image.height}`;
}

/** Sort into a stable order and report which properties a placement accepts. */
export function createAssetCatalog(
    entries: readonly TEditorAssetCatalogEntry[],
    options: {colorSupported: boolean}
): TEditorAssetSearchItem[] {
    return [...entries]
        .sort((left, right) => left.assetId.localeCompare(right.assetId))
        .map((entry) => {
            const colorizable = entry.colorMode === 'monochrome' && options.colorSupported;
            return {
                assetId: entry.assetId,
                kind: entry.kind,
                source: entry.source,
                name: entry.name,
                collection: entry.collection,
                width: entry.width,
                height: entry.height,
                colorMode: entry.colorMode,
                supportedProperties: ['x' as const, 'y' as const, ...(colorizable ? (['color'] as const) : [])],
            };
        });
}

export function searchAssetCatalog(
    catalog: readonly TEditorAssetSearchItem[],
    request: TEditorAssetSearchRequest
): TEditorAssetSearchResult {
    const query = request.query?.trim().toLowerCase() ?? '';
    const kinds = request.kinds ? new Set(request.kinds) : null;
    const sources = request.sources ? new Set(request.sources) : null;
    const limit = request.limit ?? 20;
    const matching = catalog.filter((item) => {
        if (request.cursor && item.assetId <= request.cursor) return false;
        if (kinds && !kinds.has(item.kind)) return false;
        if (sources && !sources.has(item.source)) return false;
        if (!query) return true;
        return [item.name, item.collection, item.assetId].some((value) => value.toLowerCase().includes(query));
    });
    const items = matching.slice(0, limit);
    return {
        items,
        ...(matching.length > items.length && items.length > 0 ? {nextCursor: items[items.length - 1].assetId} : {}),
    };
}

function imageElementForUrl(url: string, metadata: {name: string; width: number; height: number; colorMode: string}) {
    const image = new Image();
    image.src = url;
    image.dataset.name = metadata.name;
    image.dataset.w = String(metadata.width);
    image.dataset.h = String(metadata.height);
    image.dataset.colorMode = metadata.colorMode;
    return image;
}

async function waitForImage(image: HTMLImageElement, signal?: AbortSignal): Promise<HTMLImageElement> {
    signal?.throwIfAborted();
    if (image.complete && image.naturalWidth > 0) return image;
    await new Promise<void>((resolve, reject) => {
        const cleanup = () => {
            image.removeEventListener('load', loaded);
            image.removeEventListener('error', failed);
            signal?.removeEventListener('abort', aborted);
        };
        const loaded = () => {
            cleanup();
            resolve();
        };
        const failed = () => {
            cleanup();
            reject(new AssetLibraryError('internal_error', 'The asset image could not be loaded.'));
        };
        const aborted = () => {
            cleanup();
            reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
        };
        image.addEventListener('load', loaded, {once: true});
        image.addEventListener('error', failed, {once: true});
        signal?.addEventListener('abort', aborted, {once: true});
        if (image.complete) {
            if (image.naturalWidth > 0) loaded();
            else failed();
        }
    });
    signal?.throwIfAborted();
    return image;
}

async function imageToPngDataUrl(image: HTMLImageElement, width: number, height: number, signal?: AbortSignal) {
    await waitForImage(image, signal);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new AssetLibraryError('internal_error', 'The asset preview canvas is unavailable.');
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/png');
}

export type TEditorAssetLibrarySession = {
    state: {
        customImages: TLayerImageData[];
    };
    getPlatformFeatures?: () => Partial<TPlatformFeatures>;
};

export class EditorAssetLibrary {
    constructor(private readonly session: TEditorAssetLibrarySession) {}

    private builtInIcons(): TAssetCatalogRuntimeEntry[] {
        return Object.entries(iconsList).flatMap(([packKey, pack]) =>
            pack.icons.map((icon) => ({
                assetId: builtInIconAssetId(packKey, icon.name),
                kind: 'icon' as const,
                source: 'builtin' as const,
                name: icon.name,
                collection: pack.title,
                width: icon.width,
                height: icon.height,
                colorMode: 'monochrome' as const,
                imageUrl: icon.image,
            }))
        );
    }

    private sessionImages(): TAssetCatalogRuntimeEntry[] {
        return (this.session.state.customImages ?? []).map((image) => ({
            assetId: sessionImageAssetId(image),
            kind: 'image',
            source: 'session',
            name: image.name,
            collection: 'Imported',
            width: image.width,
            height: image.height,
            colorMode: image.colorMode === 'rgb' ? 'rgb' : 'monochrome',
            image: image.image,
        }));
    }

    private runtimeEntries(): TAssetCatalogRuntimeEntry[] {
        return [...this.builtInIcons(), ...this.sessionImages()];
    }

    private policy() {
        const features = this.session.getPlatformFeatures?.() ?? {};
        return {colorSupported: Boolean(features.hasRGBSupport || features.hasIndexedColors)};
    }

    search(request: TEditorAssetSearchRequest): TEditorAssetSearchResult {
        return searchAssetCatalog(createAssetCatalog(this.runtimeEntries(), this.policy()), request);
    }

    private findRuntimeEntry(assetId: string): TAssetCatalogRuntimeEntry {
        const entry = this.runtimeEntries().find((candidate) => candidate.assetId === assetId);
        if (!entry) throw new AssetLibraryError('not_found', 'That asset is not available in the current editor.');
        return entry;
    }

    async resolve(assetId: string, options: {signal?: AbortSignal} = {}): Promise<TEditorResolvedAsset> {
        options.signal?.throwIfAborted();
        const entry = this.findRuntimeEntry(assetId);
        const image = entry.image ?? imageElementForUrl(entry.imageUrl!, entry);
        await waitForImage(image, options.signal);
        return {...entry, kind: entry.kind, image};
    }

    async preview(
        assetId: string,
        options: {signal?: AbortSignal} = {}
    ): Promise<{assetId: string; pngDataUrl: string; width: number; height: number}> {
        const asset = await this.resolve(assetId, options);
        options.signal?.throwIfAborted();
        return {
            assetId,
            pngDataUrl: await imageToPngDataUrl(asset.image, asset.width, asset.height, options.signal),
            width: asset.width,
            height: asset.height,
        };
    }
}

export function createEditorAssetLibrary(session: TEditorAssetLibrarySession): EditorAssetLibrary {
    return new EditorAssetLibrary(session);
}
