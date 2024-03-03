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
    let textLayer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    textLayer.resize(display, scale);
    expect(textLayer.state).toMatchSnapshot();
    expect(textLayer.bounds).toMatchSnapshot();
});

test('Edit layer', () => {
    let textLayer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    textLayer.resize(display, scale);
    textLayer.startEdit(EditMode.CREATING, new Point(10, 10));
    textLayer.text = 'Hello';
    expect(textLayer.state).toMatchSnapshot();
    textLayer.edit(new Point(30, 20), new MouseEvent('mousemove'));
    textLayer.stopEdit();
    expect(textLayer.state).toMatchSnapshot();
    expect(textLayer.bounds).toMatchSnapshot();
});

test('Move layer', () => {
    let textLayer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    textLayer.resize(display, scale);
    textLayer.startEdit(EditMode.MOVING, new Point(10, 10));
    textLayer.edit(new Point(30, 20), new MouseEvent('mousemove'));
    expect(textLayer.position.xy).toEqual([20, 10]);
    expect(textLayer.state).toMatchSnapshot();
    textLayer.edit(new Point(40, 30), new MouseEvent('mousemove'));
    expect(textLayer.position.xy).toEqual([30, 20]);
    textLayer.stopEdit();
    expect(textLayer.state).toMatchSnapshot();
    expect(textLayer.bounds).toMatchSnapshot();
});

test('Modifiers', () => {
    let textLayer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: true,
            hasRGBSupport: true,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    textLayer.resize(display, scale);
    expect(textLayer.position.xy).toEqual([0, 0]);
    textLayer.modifiers.x.setValue(10);
    expect(textLayer.position.xy).toEqual([10, 0]);
    expect(textLayer.state).toMatchSnapshot();
    textLayer.modifiers.y.setValue(20);
    expect(textLayer.position.xy).toEqual([10, 20]);
    expect(textLayer.state).toMatchSnapshot();
    textLayer.modifiers.fontSize.setValue(2);
    expect(textLayer.state).toMatchSnapshot();
    textLayer.modifiers.font.setValue('5x8');
    expect(textLayer.font).toEqual(getFont('5x8'));
    expect(textLayer.state).toMatchSnapshot();
    textLayer.modifiers.text.setValue('Hello');
    expect(textLayer.text).toEqual('Hello');
    expect(textLayer.state).toMatchSnapshot();
    textLayer.modifiers.color.setValue('#FF0000');
    expect(textLayer.color).toEqual('#FF0000');
    expect(textLayer.state).toMatchSnapshot();
    textLayer.modifiers.inverted.setValue(true);
    expect(textLayer.state).toMatchSnapshot();
});

test('Draw text layer', () => {
    let textLayer = new TextLayer(
        {
            defaultColor: '#FFFFFF',
            hasCustomFontSize: true,
            hasInvertedColors: false,
            hasRGBSupport: false,
            screenBgColor: '#000000'
        },
        getFont('4x6')
    );
    textLayer.resize(display, scale);
    textLayer.text = 'Hello';
    textLayer.color = '#FF0000';
    textLayer.position = new Point(10, 10);
    textLayer.draw();
    expect((textLayer.getBuffer().getContext('2d') as any).getState()).toMatchSnapshot();
});
