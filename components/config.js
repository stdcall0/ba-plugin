import fs from 'fs';
import { Path } from "#gc";
import { ConfigFile } from "#gc.model";
class Config {
    static add(key, path) {
        Config.files.set(key, new ConfigFile(path));
    }
    static get(key) {
        return Config.files.get(key);
    }
    static load() {
        const dir_config = `${Path.Config}`;
        const dir_default_config = `${Path.Config}/default_config`;
        // List all YAML files names in default_config
        const files = fs.readdirSync(dir_default_config).filter(file => file.endsWith('.yaml'));
        // Copy all files from default_config to config if not exists
        files.forEach(file => {
            const path = `${dir_config}/${file}`;
            if (!fs.existsSync(path)) {
                fs.copyFileSync(`${dir_default_config}/${file}`, path);
            }
            // Name is the file name without extension
            const name = file.split('.').slice(0, -1).join('.');
            Config.add(name, path);
        });
    }
}
Config.files = new Map();
export default Config;
;