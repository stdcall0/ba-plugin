import fs from 'fs';
import path from 'path';

import { Logger, Config, Path } from '#gc';

export default abstract class Cache {
    static get cache_path() {
        const cache_path_sub = Config.get('arona').get('cache.path') as string;
        return path.join(Path.Process, cache_path_sub);
    }

    static get expire() {
        return Config.get('arona').get('cache.expire') as number;
    }

    static checkExpire(mtime: Date) {
        const now = new Date();
        const diff = now.getTime() - mtime.getTime();
        return diff / 1000 > Cache.expire;
    }

    static init() {
        const auto_clear = Config.get('arona').get('cache.auto_clear') as boolean;
        if (auto_clear) {
            try {
                fs.rmSync(Cache.cache_path, { recursive: true });
            } catch (e) { }
        }

        try {
            fs.mkdirSync(Cache.cache_path, { recursive: true });
        } catch (e) { }
        if (!fs.existsSync(Cache.cache_path)) {
            Logger.error("[ba-plugin][arona] Cannot create cache folder: " + Cache.cache_path);
        }
    }

    static has(hash: string): boolean {
        const file_path = path.join(Cache.cache_path, hash);
        if (!fs.existsSync(file_path)) return false;

        const stat = fs.statSync(file_path);
        if (Cache.checkExpire(stat.mtime)) {
            try {
                fs.rmSync(file_path);
            } catch (e) { }
            return false;
        }
        return true;
    }

    static get(hash: string): string {
        const file_path = path.join(Cache.cache_path, hash);
        return fs.readFileSync(file_path, 'utf8');
    }

    static set(hash: string, data: string) {
        const file_path = path.join(Cache.cache_path, hash);
        fs.writeFileSync(file_path, data, 'utf8');
    }
};
