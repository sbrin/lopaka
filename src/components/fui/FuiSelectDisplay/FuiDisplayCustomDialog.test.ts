import {mount} from '@vue/test-utils';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import FuiDisplayCustomDialog from './FuiDisplayCustomDialog.vue';

// Mock session to avoid localStorage dependencies
vi.mock('../../../core/session', () => ({
    useSession: () => ({
        state: {
            display: {x: 128, y: 64},
        },
        setDisplay: vi.fn(),
        saveDisplayCustom: vi.fn(),
    }),
}));

describe('FuiDisplayCustomDialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a popup element', () => {
        const wrapper = mount(FuiDisplayCustomDialog, {
            customWidth: 123,
            customHeight: 123
        });
        expect(wrapper.find('.fui-display-custom-dialog').exists()).toBe(true);
        expect(wrapper.element).toMatchSnapshot();
    });

    it('emits a cancelPopup event when clicked cancel', async () => {
        const wrapper = mount(FuiDisplayCustomDialog);
        const cancelButton = wrapper.find('.btn.btn-outline');
        expect(cancelButton.exists()).toBe(true);

        await cancelButton.trigger('click');
        expect(wrapper.emitted('cancelPopup')).toBeTruthy();
    });

    it('emits a setCustomDisplay event when clicked save', async () => {
        const wrapper = mount(FuiDisplayCustomDialog);
        const saveButton = wrapper.find('.btn.btn-success');
        expect(saveButton.exists()).toBe(true);

        await saveButton.trigger('click');
        expect(wrapper.emitted('setCustomDisplay')).toBeTruthy();
    });
});
