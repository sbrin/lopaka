import flipperPack from './flipper.icons.pack';
import gaaiPack from './gaai.icons.pack';

interface IIconsList {
    [key: string]: {
        title: string;
        icons: TPackImage[];
    };
}

export const iconsList: IIconsList = {
    gaai: {
        title: 'Gaai',
        icons: gaaiPack
    },
    flipper: {
        title: 'Flipper Zero',
        icons: flipperPack
    }
};
