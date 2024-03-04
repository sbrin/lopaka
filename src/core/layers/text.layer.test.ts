import {expect, test, vi} from 'vitest';
import {getFont, loadFont} from '../../draw/fonts';
import font from '../../draw/fonts/bdf/4x6.bdf';
import font2 from '../../draw/fonts/bdf/5x8.bdf';
import {FontFormat} from '../../draw/fonts/font';
import * as utils from '../../utils';
import {Point} from '../point';
import {EditMode} from './abstract.layer';
import {TextLayer} from './text.layer';

vi.spyOn(utils, 'generateUID').mockImplementation(() => '000001');

loadFont({
    name: '4x6',
    title: '4x6',
    file: font,
    format: FontFormat.FORMAT_BDF
});

loadFont({
    name: '5x8',
    title: '5x8',
    file: font2,
    format: FontFormat.FORMAT_BDF
});

const display = new Point(128, 64);
const scale = new Point(1, 1);

test('Create layer', () => {
    let layer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    layer.resize(display, scale);
    expect(layer.state).toMatchSnapshot();
    expect(layer.bounds).toMatchSnapshot();
});

test('Edit layer', () => {
    let layer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    layer.resize(display, scale);
    layer.startEdit(EditMode.CREATING, new Point(10, 10));
    layer.text = 'Hello';
    expect(layer.state).toMatchSnapshot();
    layer.edit(new Point(30, 20), new MouseEvent('mousemove'));
    layer.stopEdit();
    expect(layer.state).toMatchSnapshot();
    expect(layer.bounds).toMatchSnapshot();
});

test('Move layer', () => {
    let layer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    layer.resize(display, scale);
    layer.startEdit(EditMode.MOVING, new Point(10, 10));
    layer.edit(new Point(30, 20), new MouseEvent('mousemove'));
    expect(layer.position.xy).toEqual([20, 10]);
    expect(layer.state).toMatchSnapshot();
    layer.edit(new Point(40, 30), new MouseEvent('mousemove'));
    expect(layer.position.xy).toEqual([30, 20]);
    layer.stopEdit();
    expect(layer.state).toMatchSnapshot();
    expect(layer.bounds).toMatchSnapshot();
});

test('Modifiers', () => {
    let layer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: true,
            hasRGBSupport: true,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    layer.resize(display, scale);
    expect(layer.position.xy).toEqual([0, 0]);
    layer.modifiers.x.setValue(10);
    expect(layer.position.xy).toEqual([10, 0]);
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.y.setValue(20);
    expect(layer.position.xy).toEqual([10, 20]);
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.fontSize.setValue(2);
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.font.setValue('5x8');
    expect(layer.font).toEqual(getFont('5x8'));
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.text.setValue('Hello');
    expect(layer.text).toEqual('Hello');
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.color.setValue('#FF0000');
    expect(layer.color).toEqual('#FF0000');
    expect(layer.state).toMatchSnapshot();
    layer.modifiers.inverted.setValue(true);
    expect(layer.state).toMatchSnapshot();
});

test('Draw layer', () => {
    let layer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    layer.resize(display, scale);
    layer.text = 'Hello';
    layer.color = '#FF0000';
    layer.position = new Point(10, 10);
    layer.draw();
    expect((layer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
});
