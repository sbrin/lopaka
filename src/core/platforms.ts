import {AdafruitPlatform} from '../platforms/adafruit';
import {AdafruitMonochromePlatform} from '../platforms/adafruit_mono';
import {ArduinoGFXPlatform} from '../platforms/arduinogfx';
import {EsphomePlatform} from '../platforms/esphome';
import {FlipperPlatform} from '../platforms/flipper';
import {InkplatePlatform} from '../platforms/inkplate';
import {TFTeSPIPlatform} from '../platforms/tft-espi';
import {U8g2Platform} from '../platforms/u8g2';
import {Uint32RawPlatform} from '../platforms/uint32-raw';
import {LVGLPlatform} from '/src/platforms/lvgl';
import {FreestylePlatform} from '../platforms/freestyle';
import {MicropythonPlatform} from '/src/platforms/micropython';
import {GxEPD2Platform} from '/src/platforms/gxepd2';
const platforms = {
    [TFTeSPIPlatform.id]: new TFTeSPIPlatform(),
    [U8g2Platform.id]: new U8g2Platform(),
    [LVGLPlatform.id]: new LVGLPlatform(),
    [AdafruitPlatform.id]: new AdafruitPlatform(),
    [AdafruitMonochromePlatform.id]: new AdafruitMonochromePlatform(),
    [ArduinoGFXPlatform.id]: new ArduinoGFXPlatform(),
    [EsphomePlatform.id]: new EsphomePlatform(),
    [MicropythonPlatform.id]: new MicropythonPlatform(),
    [FlipperPlatform.id]: new FlipperPlatform(),
    [InkplatePlatform.id]: new InkplatePlatform(),
    [GxEPD2Platform.id]: new GxEPD2Platform(),
    [Uint32RawPlatform.id]: new Uint32RawPlatform(),
    [FreestylePlatform.id]: new FreestylePlatform(),
};

export function getTemplates(platform: string): string[] {
    return Object.keys(platforms[platform].getTemplates());
}

export default platforms;
