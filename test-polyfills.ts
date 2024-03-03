import {vi} from 'vitest';

const getContextMock = (state: any[], type: string) => {
    if (type !== '2d') {
        throw Error(`Canvas context ${type} disallowed for tests`);
    }
    return new Proxy<CanvasRenderingContext2D>({} as CanvasRenderingContext2D, {
        get: (c: CanvasRenderingContext2D, command: any) => {
            if (command == 'getState') {
                return () => state;
            }
            if (command == 'createPattern') {
                return () => ({
                    setTransform: vi.fn()
                });
            } else if (command == 'measureText') {
                return () => 10;
            } else if (command == 'backingStorePixelRatio') {
                return 1;
            } else if (command == 'getImageData') {
                return () => ({
                    data: new Uint8ClampedArray(100 * 100 * 4)
                });
            }

            return (...args) => {
                state.push({command, args});
            };
        },
        set: (c: CanvasRenderingContext2D, property: any, value: any) => {
            state.push({property, value});
            return true;
        }
    });
};

function mock(w: any, d: any) {
    const createElement = d.createElement;
    d.createElement = (...args: any[]) => {
        const el = createElement.apply(d, args);
        if (args[0] == 'canvas') {
            const state = [];
            Object.assign(el, {
                toDataURL: () => 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=',
                // mock canvas 2d context
                getContext: getContextMock.bind(null, state)
            });
        }
        return el;
    };

    vi.stubGlobal('OffscreenCanvas', function () {
        const state = [];
        this.getContext = getContextMock.bind(null, state);
    });

    vi.stubGlobal('DOMMatrix', function () {
        (this.scale = vi.fn(() => this)), (this.translate = vi.fn(() => this));
    });

    vi.stubGlobal('Path2D', function () {
        (this.rect = vi.fn(
            // emulate actual rect implementation
            (...props) =>
                (this._path = [
                    {
                        props: {
                            x: props[0],
                            y: props[1],
                            width: props[2],
                            height: props[3]
                        }
                    }
                ])
        )),
            (this.toJSON = () => {
                let rect = this._path[0].props;
                return `M${rect.x} ${rect.y} h ${rect.width} v ${rect.height} h -${rect.width} Z`;
            });
    });

    vi.stubGlobal('fetch', (...args: any[]) => {
        throw Error(`Fetch is disallowed for tests ${JSON.stringify(args)}`);
    });
    w.requestAnimationFrame = (fn: Function) => w.setTimeout(fn, 0);
    vi.stubGlobal('requestAnimationFrame', (fn: Function) => w.setTimeout(fn, 0));
    vi.stubGlobal('requestIdleCallback', w.requestAnimationFrame.bind(w));
    vi.stubGlobal('devicePixelRatio', 1);
    vi.stubGlobal(
        'ImageData',
        class {
            data = new Uint8ClampedArray(this.width * this.height * 4);
            constructor(
                private width: number,
                private height: number
            ) {}
        }
    );

    // resize observer mock
    vi.stubGlobal(
        'ResizeObserver',
        class {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
        }
    );

    w.matchMedia = function () {
        return {addListener: () => {}};
    };
}

mock(window, window.document);
