import iconsGaai from './gaai';
import iconsFlipper from '../icons/flipper';

interface IIconsList {
    [key: string]: {
        title: string,
        icons: Record<any, ImageData>
    }
}

export const iconsList: IIconsList = {
    'gaai': {
        title: 'Gaai',
        icons: iconsGaai,
    },
    'flipper': {
        title: 'Flipper Zero',
        icons: iconsFlipper,
    },
}