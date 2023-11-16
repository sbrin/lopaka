import {getFont, loadFont} from '../../draw/fonts';
import {Point} from '../point';
import {Session} from '../session';
import {AbstractProvider, TProject} from './abstract.provider';

export class ExternalProvider extends AbstractProvider {
    private id: string = 'lopaka_app';
    private onLoad: (project: TProject) => void;
    private loader: Promise<TProject> = new Promise((resolve: (project: TProject) => void) => (this.onLoad = resolve));

    public autoload: boolean = true;

    constructor(protected session: Session) {
        super(session);
        parent.postMessage({target: this.id, type: 'mounted'}, '*');
        session.lock();
        window.addEventListener('message', (event) => {
            const {data} = event;
            if (data && data.target === this.id) {
                const {type, payload} = data;
                switch (type) {
                    case 'updateLayers':
                        this.session.clearLayers();
                        this.loadLayers(data.layers);
                        break;
                    case 'loadProject':
                        this.onLoad({
                            display: payload.display.replace('×', ','),
                            platform: payload.library,
                            layers: payload.layers,
                            scale: payload.scale || 400
                        });
                        break;
                }
            }
        });
    }

    async loadProject(): Promise<void> {
        const project = await this.loader;
        const {platforms, lock, unlock, editor, virtualScreen} = this.session;
        const display = Point.fromString(project.display);
        this.session.setPlatform(project.platform);
        this.session.setDisplay(this.session.displays.find((d) => d.equals(display)));
        this.session.setScale(project.scale * 100);
        // preload fonts
        const fonts = platforms[project.platform].getFonts();
        // preload default font
        return Promise.all(fonts.map((font) => loadFont(font))).then(() => {
            editor.font = getFont(fonts[0].name);
            unlock();
            if (project) {
                this.loadLayers(project.layers);
                virtualScreen.redraw();
            }
        });
    }

    async saveProject(): Promise<void> {
        const {display, platform, scale, layers} = this.session.state;
        const project: any = {
            display: display.toString().replace(',', '×'),
            library: platform,
            layers: layers.map((l) => l.getState()),
            scale: scale.x
        };
        parent.postMessage({target: this.id, type: 'saveProject', payload: project}, '*');
        this.updateThumbnail();
    }

    async updateThumbnail(): Promise<void> {
        const canvas = this.session.virtualScreen.canvas;
        const thumbnail = document.createElement('canvas');
        thumbnail.width = 128;
        thumbnail.height = 128;
        const ctx = thumbnail.getContext('2d');
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, thumbnail.width, thumbnail.height);
        parent.postMessage({target: this.id, type: 'updateThumbnail', payload: thumbnail.toDataURL()}, '*');
    }
}
