import {AbstractLayer, TLayerState} from '../core/layers/abstract.layer';
import {LayerClassMap} from '../core/session';

export const layersMock: AbstractLayer[] = [
    {
        n: 'box_veqtjp8jf9ln6isyfz',
        t: 'box',
        c: '#FF0000',
        i: 0,
        p: [107, 46],
        u: 'veqtjp8jf9ln6isyfz',
        s: [18, 15]
    },
    {
        n: 'box_utlxpqvhdxnln6it5pw',
        t: 'box',
        c: '#00FF00',
        i: 1,
        p: [97, 2],
        u: 'utlxpqvhdxnln6it5pw',
        s: [27, 11]
    },
    {
        n: 'box_eu6bpe0xpvvln6itc2e',
        t: 'box',
        c: '#0000FF',
        i: 2,
        p: [106, 19],
        u: 'eu6bpe0xpvvln6itc2e',
        s: [19, 18],
        radius: 0
    },
    {
        n: 'str_s3m4u762qpln6jvm90',
        t: 'string',
        c: '#000000',
        i: 5,
        p: [3, 11],
        u: 's3m4u762qpln6jvm90',
        d: 'Text',
        s: [50, 8],
        f: 'helvB08_tr'
    },
    {
        n: 'line_b11j6xs5t46ln6jw96h',
        t: 'line',
        c: '#FFFFFF',
        i: 8,
        p1: [2, 16],
        u: 'b11j6xs5t46ln6jw96h',
        p2: [68, 16]
    },
    {
        n: 'dot_6n8rac0nxpcln6jwdwr',
        t: 'dot',
        c: '#000000',
        i: 9,
        p: [62, 4],
        u: '6n8rac0nxpcln6jwdwr',
        s: [1, 1]
    },
    {
        n: 'dot_ema2hee85mln6jweht',
        t: 'dot',
        c: '#000000',
        i: 10,
        p: [67, 8],
        u: 'ema2hee85mln6jweht',
        s: [1, 1]
    },
    {
        n: 'dot_j1ol1lo5nkln6jwfmg',
        t: 'dot',
        c: '#000000',
        i: 11,
        p: [72, 12],
        u: 'j1ol1lo5nkln6jwfmg',
        s: [1, 1]
    },
    {
        n: 'circle_6uf3k6wj82ln6jwi73',
        t: 'circle',
        c: '#0000FF',
        i: 12,
        p: [8, 29],
        u: '6uf3k6wj82ln6jwi73',
        r: 12
    },
    {
        n: 'disc_aibkefmz3cln6jwlit',
        t: 'disc',
        c: '#FF0000',
        i: 13,
        p: [14, 40],
        u: 'aibkefmz3cln6jwlit',
        r: 3
    },
    {
        n: 'frame_g7pk1wfbqqkln6jwxby',
        t: 'frame',
        c: '#00FF00',
        i: 14,
        p: [44, 29],
        u: 'g7pk1wfbqqkln6jwxby',
        s: [44, 28]
    },
    {
        n: 'draw_rrsjcz4oz2ln6jx4y4',
        t: 'paint',
        c: '#FF0000',
        i: 15,
        p: [0, 0],
        u: 'rrsjcz4oz2ln6jx4y4',
        s: [128, 64],
        d: []
    }
].map((l) => {
    const type: ELayerType = l.t as any;
    const layer = new LayerClassMap[type]({
        hasCustomFontSize: false,
        hasInvertedColors: false,
        hasRGBSupport: false
    });
    layer.loadState(l);
    return layer;
});
