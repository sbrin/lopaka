import {AdafruitPlatform} from '../platforms/adafruit';
import {AdafruitMonochromePlatform} from '../platforms/adafruit_mono';
import {FlipperPlatform} from '../platforms/flipper';
import {InkplatePlatform} from '../platforms/inkplate';
import {U8g2Platform} from '../platforms/u8g2';
import {Uint32RawPlatform} from '../platforms/uint32-raw';

const platforms = {
    [U8g2Platform.id]: new U8g2Platform(),
    [AdafruitPlatform.id]: new AdafruitPlatform(),
    [AdafruitMonochromePlatform.id]: new AdafruitMonochromePlatform(),
    [Uint32RawPlatform.id]: new Uint32RawPlatform(),
    [FlipperPlatform.id]: new FlipperPlatform(),
    [InkplatePlatform.id]: new InkplatePlatform()
};

export function getTemplates(platform: string): string[] {
    return Object.keys(platforms[platform].getTemplates());
}

export default platforms;
