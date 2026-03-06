import {AbstractLayer} from '../../core/layers/abstract.layer';
import {AbstractTool} from './abstract.tool';

// #2196f3

export class ImageTool extends AbstractTool {
    name = 'image';

    createLayer(): AbstractLayer {
        return null;
    }

    onActivate(): void {
        this.openImageWizard();
    }

    private openImageWizard(): void {
        // Open wizard through session state
        this.editor.session.openImageWizard(
            null, // FuiEditor handles the save logic
            () => this.onWizardClose()
        );
    }

    private onWizardClose(): void {
        // Deactivate the tool after closing wizard
        this.editor.setTool(null);
    }

    onDeactivate(): void {
        // Close wizard if it's open when tool is deactivated
        if (this.editor.session.state.imageWizard.isOpen) {
            this.editor.session.closeImageWizard();
        }
    }
}
