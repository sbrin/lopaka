import {mount} from '@vue/test-utils';
import FuiButton from './FuiButton.vue';
import {describe, expect, it} from 'vitest';

describe('FuiButton', () => {
    it('renders a button element', () => {
        const wrapper = mount(FuiButton);
        expect(wrapper.find('button').exists()).toBe(true);
        expect(wrapper.element).toMatchSnapshot();
    });

    it('emits a click event when clicked', async () => {
        const wrapper = mount(FuiButton);
        await wrapper.trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
    });
});
