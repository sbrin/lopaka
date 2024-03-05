import {expect, test, vi} from 'vitest';
import * as utils from '../../utils';
import {Point} from '../point';
import {EditMode} from './abstract.layer';
import {LineLayer} from './line.layer';

vi.spyOn(utils, 'generateUID').mockImplementation(() => '000001');

const display = new Point(128, 64);
const scale = new Point(1, 1);

test('Create layer', () => {
    let layer = new LineLayer({
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
    let layer = new LineLayer({
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
    let layer = new LineLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: false,
        hasRGBSupport: false,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    layer.p1 = new Point(5, 5);
    layer.p2 = new Point(15, 15);
    layer.startEdit(EditMode.MOVING, new Point(5, 5), layer.editPoints[0]);
    layer.edit(new Point(10, 20), new MouseEvent('mousemove'));
    expect(layer.p1.xy).toEqual([10, 20]);
    expect(layer.p2.xy).toEqual([20, 30]);
    expect(layer.state).toMatchSnapshot();
    layer.edit(new Point(40, 30), new MouseEvent('mousemove'));
    expect(layer.p1.xy).toEqual([40, 30]);
    expect(layer.p2.xy).toEqual([50, 40]);
    layer.stopEdit();
    expect(layer.state).toMatchSnapshot();
    expect(layer.bounds).toMatchSnapshot();
});

test('Modifiers', () => {
    let layer = new LineLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: true,
        hasRGBSupport: true,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    expect(layer.p1.xy).toEqual([0, 0]);
    layer.modifiers.x1.setValue(10);
    layer.modifiers.y1.setValue(20);
    expect(layer.p1.xy).toEqual([10, 20]);
    layer.modifiers.x2.setValue(30);
    layer.modifiers.y2.setValue(40);
    expect(layer.p2.xy).toEqual([30, 40]);
    expect(layer.bounds).toMatchSnapshot();
    expect(layer.state).toMatchSnapshot();
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.color.setValue('#FF0000');
    expect(layer.color).toEqual('#FF0000');
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.inverted.setValue(true);
    expect(layer.state).toMatchSnapshot();
});

test('Draw layer', () => {
    let layer = new LineLayer({
        defaultColor: '#FFFFFF',
        hasCustomFontSize: true,
        hasInvertedColors: false,
        hasRGBSupport: false,
        screenBgColor: '#000000'
    });
    layer.resize(display, scale);
    layer.color = '#FF0000';
    // different line's directions to test the draw function
    // horizontal line
    layer.p1 = new Point(10, 10);
    layer.p2 = new Point(20, 10);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
    (layer.getBuffer().getContext('2d') as any).clearState();
    // vertical line
    layer.p1 = new Point(10, 10);
    layer.p2 = new Point(10, 20);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
    (layer.getBuffer().getContext('2d') as any).clearState();
    // diagonal line
    layer.p1 = new Point(10, 10);
    layer.p2 = new Point(20, 20);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
    (layer.getBuffer().getContext('2d') as any).clearState();
    // diagonal line
    layer.p1 = new Point(20, 10);
    layer.p2 = new Point(10, 20);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
    (layer.getBuffer().getContext('2d') as any).clearState();
    // diagonal line
    layer.p1 = new Point(10, 20);
    layer.p2 = new Point(20, 10);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
    (layer.getBuffer().getContext('2d') as any).clearState();
    // diagonal line
    layer.p1 = new Point(20, 20);
    layer.p2 = new Point(10, 10);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
    (layer.getBuffer().getContext('2d') as any).clearState();
});
