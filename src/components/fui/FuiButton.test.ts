import {mount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import FuiButton from './FuiButton.vue';

describe('FuiButton', () => {
    it('renders a button element', () => {
        const wrapper = mount(FuiButton);
        expect(wrapper.find('span').exists()).toBe(true);
        expect(wrapper.element).toMatchSnapshot();
    });

    it('emits a click event when clicked', async () => {
        const wrapper = mount(FuiButton);
        await wrapper.trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
    });
});
