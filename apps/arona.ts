import { Plugin } from '#gc';

import { AronaAPI, AronaCache } from '#gc';
import { Arona } from '#gc.model';

export class AronaPlugin extends Plugin {
    userState: Map<number, Arona.UserState>;

    constructor() {
        super({
            name: 'Arona数据源攻略',
            dsc: '从 Arona Bot 数据源中搜索攻略图 (ba_plugin)',
            event: 'message',
            priority: '98',
            rule: [
                {
                    reg: '^(/arona|/a|/A|#arona|#a|#A) (.+)$',
                    fnc: 'arona'
                },
                {
                    reg: '^(/arona|/a|/A|#arona|#a|#A)! (.+)$',
                    fnc: 'arona_nocache'
                },
                {
                    reg: '\d+',
                    fnc: 'arona_options',
                    log: false
                }
            ]
        });
    
        this.userState = new Map<number, Arona.UserState>();
        AronaCache.init();
    }

    removePrefix(msg: string): string {
        return msg.split(' ').slice(1).join('').replace(/\s/g, '');
    }

    async image(entry: Arona.Entry, no_cache: boolean) {
        const hash = entry.hash;
        if (AronaCache.has(hash) && !no_cache) {
            await this.e.reply(AronaCache.get(hash));
        } else {
            const img = await AronaAPI.image(entry);
            if (img.image != null) {
                AronaCache.set(hash, img.image);
                await this.e.reply(img.image);
            } else {
                await this.e.reply(`下载图片出错: ${img.error_msg}`);
            }
        }
    }

    async search(msg: string, sender: number, no_cache: boolean) {
        const keyword = this.removePrefix(msg);
        this.userState.delete(sender);

        const res = await AronaAPI.search(keyword);
        if (res.status == Arona.Status.FUZZY_SEARCH) {
            let w = ['查询到多个结果: '];
            res.keywords.forEach((k, i) => {
                w.push(`${i + 1}. ${k}`);
            });
            this.userState.set(sender, {
                keywords: res.keywords,
                last_search_time: Date.now(),
                no_cache: no_cache
            });
            await this.e.reply(w.join('\n'));
        }
        else if (res.status == Arona.Status.FOUND) {
            await this.image(res.entry, no_cache);
        } else {
            await this.e.reply(`查询出错: ${res.error_msg}`);
        }
    }

    async arona() {
        await this.search(this.e.msg, this.e.sender.user_id, false);
    }

    async arona_nocache() {
        await this.search(this.e.msg, this.e.sender.user_id, true);
    }

    async arona_options() {
        const sender = this.e.sender.user_id;
        if (this.userState.has(sender)) {
            const state = this.userState.get(sender);
            if (Date.now() - state.last_search_time < 5*60*1000) {
                const idx = parseInt(this.e.msg);
                if (idx > 0 && idx <= state.keywords.length) {
                    const res = await AronaAPI.search(state.keywords[idx - 1]);
                    if (res.status == Arona.Status.FOUND) {
                        await this.image(res.entry, state.no_cache);
                    } else {
                        await this.e.reply(`查询出错: ${res.error_msg}`);
                    }
                    this.userState.delete(sender);
                }
            } else {
                this.userState.delete(sender);
            }
        }
    }
};
