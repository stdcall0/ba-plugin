import axios from 'axios';
import crypto from 'crypto';
import { Logger, Config } from '#gc';
import { Arona } from '#gc.model';
export default class API {
    static get api_url() {
        return Config.get('arona').get('search_api');
    }
    static get image_url() {
        return Config.get('arona').get('image_cdn');
    }
    static async search(keyword) {
        return axios.get(API.api_url, { params: {
                'name': keyword
            } }).then((res) => {
            const resp = res.data;
            if (resp.status == Arona.Status.FUZZY_SEARCH) {
                const keywords = resp.data.map((t) => t.name);
                return {
                    status: Arona.Status.FUZZY_SEARCH,
                    keywords: keywords,
                    entry: null,
                    error_msg: null
                };
            }
            else if (resp.status == Arona.Status.FOUND) {
                return {
                    status: Arona.Status.FOUND,
                    keywords: null,
                    entry: resp.data[0],
                    error_msg: null
                };
            }
            else {
                return {
                    status: Arona.Status.ERROR,
                    keywords: null,
                    entry: null,
                    error_msg: resp.message
                };
            }
        }).catch((e) => {
            Logger.error("[ba-plugin][arona] HTTP Error: ", e);
            return {
                status: Arona.Status.ERROR,
                keywords: null,
                entry: null,
                error_msg: e
            };
        });
    }
    static async image(entry) {
        const url = `${API.api_url}${entry.path}`;
        return axios.get(url, { responseType: 'arraybuffer' }).then((res) => {
            const hash = crypto.createHash('md5').update(res.data, 'binary').digest('hex');
            if (hash != entry.hash) {
                Logger.warn("[ba-plugin][arona] Image hash mismatch: ", entry.name);
                return {
                    image: null,
                    error_msg: "Image hash mismatch"
                };
            }
            else {
                return {
                    image: res.data,
                    error_msg: null
                };
            }
        }).catch((e) => {
            Logger.warn("[ba-plugin][arona] HTTP Error: ", e);
            return {
                image: null,
                error_msg: e
            };
        });
    }
}
;
