import {Keys} from '../../core/keys.enum';
import {Session} from '../../core/session';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class AnimationPlugin extends AbstractEditorPlugin {
    constructor(session: Session, container: HTMLElement) {
        super(session, container);
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {frames, currentFrameIndex, isPlaying} = this.session.state;

        if (frames.length === 0) return;

        switch (key) {
            case Keys.Comma:
                // Previous frame
                event.preventDefault();
                if (isPlaying) this.session.pauseAnimation();
                if (currentFrameIndex > 0) {
                    this.session.setCurrentFrame(currentFrameIndex - 1);
                }
                break;

            case Keys.Period:
                // Next frame
                event.preventDefault();
                if (isPlaying) this.session.pauseAnimation();
                if (currentFrameIndex < frames.length - 1) {
                    this.session.setCurrentFrame(currentFrameIndex + 1);
                }
                break;

            case Keys.Space:
                // Play/Pause toggle (only when not editing text)
                if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                    event.preventDefault();
                    if (isPlaying) {
                        this.session.pauseAnimation();
                    } else {
                        this.session.playAnimation();
                    }
                }
                break;

            case Keys.ArrowLeft:
                // Alt + Left for previous frame
                if (event.altKey && !isPlaying) {
                    event.preventDefault();
                    if (currentFrameIndex > 0) {
                        this.session.setCurrentFrame(currentFrameIndex - 1);
                    }
                }
                break;

            case Keys.ArrowRight:
                // Alt + Right for next frame
                if (event.altKey && !isPlaying) {
                    event.preventDefault();
                    if (currentFrameIndex < frames.length - 1) {
                        this.session.setCurrentFrame(currentFrameIndex + 1);
                    }
                }
                break;
        }
    }
}
