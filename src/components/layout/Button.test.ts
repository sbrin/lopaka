import {mount} from '@vue/test-utils';
import {describe, expect, it} from 'vitest';
import Button from '/src/components/layout/Button.vue';

describe('Button', () => {
    it('renders a button element', () => {
        const wrapper = mount(Button, {
            slots: {
                default: 'Test',
            },
        });
        expect(wrapper.find('.btn.btn-primary').exists()).toBe(true);
        expect(wrapper.element).toMatchSnapshot();
    });

    it('emits a click event when clicked', async () => {
        const wrapper = mount(Button);
        await wrapper.trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
    });
});
