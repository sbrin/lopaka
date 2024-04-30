import {expect, test, vi} from 'vitest';
import * as utils from '../../utils';
import {Point} from '../point';
import {EditMode} from './abstract.layer';
import {DotLayer} from './dot.layer';

vi.spyOn(utils, 'generateUID').mockImplementation(() => '000001');

const display = new Point(128, 64);
const scale = new Point(1, 1);

test('Create layer', () => {
    let layer = new DotLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: false,
        hasRGBSupport: false,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    expect(layer.state).toMatchSnapshot();
    expect(layer.bounds).toMatchSnapshot();
});

test('Edit layer', () => {
    let layer = new DotLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: false,
        hasRGBSupport: false,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    layer.startEdit(EditMode.CREATING, new Point(10, 10), layer.editPoints[0]);
    expect(layer.state).toMatchSnapshot();
    layer.edit(new Point(30, 20), new MouseEvent('mousemove'));
    layer.stopEdit();
    expect(layer.state).toMatchSnapshot();
    expect(layer.bounds).toMatchSnapshot();
});

test('Move layer', () => {
    let layer = new DotLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: false,
        hasRGBSupport: false,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    layer.startEdit(EditMode.MOVING, new Point(10, 10), layer.editPoints[0]);
    layer.edit(new Point(30, 20), new MouseEvent('mousemove'));
    expect(layer.position.xy).toEqual([30, 20]);
    expect(layer.state).toMatchSnapshot();
    layer.edit(new Point(40, 30), new MouseEvent('mousemove'));
    expect(layer.position.xy).toEqual([40, 30]);
    layer.stopEdit();
    expect(layer.state).toMatchSnapshot();
    expect(layer.bounds).toMatchSnapshot();
});

test('Modifiers', () => {
    let layer = new DotLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: true,
        hasRGBSupport: true,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    expect(layer.position.xy).toEqual([0, 0]);
    layer.modifiers.x.setValue(10);
    expect(layer.position.xy).toEqual([10, 0]);
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.y.setValue(20);
    expect(layer.position.xy).toEqual([10, 20]);
    layer.modifiers.color.setValue('#FF0000');
    expect(layer.color).toEqual('#FF0000');
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.inverted.setValue(true);
    expect(layer.state).toMatchSnapshot();
});

test('Draw layer', () => {
    let layer = new DotLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: false,
        hasRGBSupport: false,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    layer.color = '#FF0000';
    layer.position = new Point(10, 10);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
});
