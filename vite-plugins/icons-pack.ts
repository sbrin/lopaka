import {Plugin} from 'vite';
import path from 'path';
import fs from 'fs';
const ext = /\.pack$/;
const packExt = /\.icons\.pack$/;
const iconReg = /(.*?)_(\d+)x(\d+).png/;

const iconsPackPlugin: Plugin = {
    name: 'icons.pack',
    transform(code, id) {
        if (packExt.test(id)) {
            const dir = path.dirname(id);
            const meta: any = code.split('\n').reduce((acc, cur) => {
                if (cur.length) {
                    acc[cur.split(':')[0]] = cur.split(':')[1].trim();
                }
                return acc;
            }, {});

            // read list of files from meta.source
            const sourceDir = path.resolve(dir, meta.source);
            const icons = fs.readdirSync(sourceDir).reduce((acc: any[], cur) => {
                const icon = fs.readFileSync(path.resolve(sourceDir, cur));
                const iconData: any = iconReg.exec(cur);
                if (iconData) {
                    acc.push({
                        name: iconData[1],
                        width: Number(iconData[2]),
                        height: Number(iconData[3]),
                        image: `data:image/png;base64,${icon.toString('base64')}`
                    });
                }
                return acc;
            }, []);
            return {
                code: `
/*
    @author: ${meta.author}
    @link: ${meta.link}
    @license: ${meta.license}   
*/
export default ${JSON.stringify(icons)}`,
                map: null
            };
        }
    }
};
export default iconsPackPlugin;
