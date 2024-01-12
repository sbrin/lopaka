import {mount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import FuiDisplayCustomDialog from './FuiDisplayCustomDialog.vue';

describe('FuiDisplayCustomDialog', () => {
    it('renders a popup element', () => {
        const wrapper = mount(FuiDisplayCustomDialog, {
            customWidth: 123,
            customHeight: 123,
        });
        expect(wrapper.find('.fui-display-custom-dialog').exists()).toBe(true);
        expect(wrapper.element).toMatchSnapshot();
    });


    it('emits a cancelPopup event when clicked cancel', async () => {
        const wrapper = mount(FuiDisplayCustomDialog);
        const cancelButton = wrapper.find('.fui-display-custom-dialog__cancel');
        expect(cancelButton.exists()).toBe(true);

        await cancelButton.trigger('click');
        expect(wrapper.emitted('cancelPopup')).toBeTruthy();
    });

    it('emits a setCustomDisplay event when clicked save', async () => {
        const wrapper = mount(FuiDisplayCustomDialog);
        const saveButton = wrapper.find('.fui-display-custom-dialog__save');
        expect(saveButton.exists()).toBe(true);

        await saveButton.trigger('click');
        expect(wrapper.emitted('setCustomDisplay')).toBeTruthy();
    });
});
