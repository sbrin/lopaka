import {getFont, loadFont} from '../../draw/fonts';
import {logEvent} from '../../utils';
import {Point} from '../point';
import {AbstractProvider, TProject} from './abstract.provider';

export class LocalProvider extends AbstractProvider {
    private prefix: string = 'lopaka_';

    async loadProject(): Promise<void> {
        const {platform, layers} = this.session.state;
        const {platforms, lock, unlock, editor, virtualScreen} = this.session;
        let project = JSON.parse(localStorage.getItem(`${this.prefix}project_${this.session.state.platform}`));
        if (project) {
            const display = Point.fromString(project.display);
            this.session.setDisplay(this.session.displays.find((d) => d.equals(display)));
            this.session.setScale(project.scale * 100);
        }
        // preload fonts
        const fonts = platforms[platform].getFonts();
        lock();
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
        const project: TProject = {
            display: display.toString(),
            platform,
            layers: layers.map((l) => l.getState()),
            scale: scale.x
        };
        localStorage.setItem(`${this.prefix}project_${platform}`, JSON.stringify(project));
    }

    async updateThumbnail(): Promise<void> {
        const canvas = this.session.virtualScreen.canvas;
        const thumbnail = document.createElement('canvas');
        thumbnail.width = 128;
        thumbnail.height = 128;
        const ctx = thumbnail.getContext('2d');
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, thumbnail.width, thumbnail.height);
        localStorage.setItem('thumbnail', thumbnail.toDataURL());
    }
}
