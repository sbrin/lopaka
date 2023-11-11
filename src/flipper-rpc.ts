import FlipperAPI from './prebuilt/flipper-js.mjs';
import {imgDataToXBMP} from './utils';

const serial = navigator.serial;
const FLIPPER_DEVICE_ID = {usbVendorId: 0x0483, usbProductId: 0x5740};

async function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export class FlipperRPC {
    flipper: any = null;
    connected: boolean = false;
    rpcStarted: boolean = false;
    reconnectionLoop: any;

    constructor() {
        this.flipper = new FlipperAPI();
    }

    async connect(): Promise<boolean | void> {
        if (!serial) {
            return;
        }
        // Try to get ports
        let ports = await serial.getPorts();
        // maybe need to request
        if (!ports.length) {
            try {
                // const requestedPort =
                await serial.requestPort({
                    filters: [FLIPPER_DEVICE_ID]
                });
            } catch (e) {
                console.log(e);
            }
            // if (requestedPort) {
            ports = await serial.getPorts();
            // }
            if (!ports.length) {
                throw new Error('No ports found');
            }
        }
        // if port found, connect
        if (ports && ports.length > 0) {
            await this.flipper.connect();
            console.log('Connected to Flipper');
            this.connected = true;
            await wait(300);
            await this.start();
            this.reconnectionLoop = setInterval(async () => {
                if (!this.connected) {
                    await this.connect();
                }
            }, 1000);
        }
        return this.connected;
    }

    async disconnect() {
        clearInterval(this.reconnectionLoop);
        await this.flipper.disconnect();
        this.connected = false;
    }

    async start() {
        await this.flipper.startRPCSession().catch((e) => console.error('Could not start RPC session', e));
        this.rpcStarted = true;
        console.log('Started RPC session');
        await this.flipper.RPC('guiStartVirtualDisplay');
        console.log('Started virtual display');
    }

    async stop() {
        await this.flipper.stopRPCSession();
        this.rpcStarted = false;
    }

    private async backlight() {
        await this.flipper.RPC('guiSendInputEvent', {key: 'OK', type: 'PRESS'});
        await this.flipper.RPC('guiSendInputEvent', {key: 'OK', type: 'SHORT'});
        await this.flipper.RPC('guiSendInputEvent', {key: 'OK', type: 'RELEASE'});
    }

    async sendImage(imageData: ImageData) {
        if (!this.connected) {
            return;
        }
        if (!this.rpcStarted) {
            await this.start();
        }
        const xbmBytes = imgDataToXBMP(imageData, 0, 0, imageData.width, imageData.height);
        await this.backlight();
        return await this.flipper.RPC('guiScreenFrame', {data: new Uint8Array(xbmBytes as any)});
    }
}
