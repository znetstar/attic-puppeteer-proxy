import {Command, flags} from '@oclif/command'
import {formatOutputFromFlags, OutputFormat, RPCProxy} from "@znetstar/attic-cli-common";
import * as  URL from "url";
import Config from "@znetstar/attic-cli-common/lib/Config";
import {IRPC} from "@znetstar/attic-common";
import {IRPCCookieStore} from "../../IRPCCookieStoreExt";
import {IPuppeteerCookieStoreBase} from "../../PuppeteerCookieStore";
const chrome = require('@znetstar/chrome-cookies-secure');

let StoreCookieRPCProxy: IRPCCookieStore = RPCProxy as IRPCCookieStore;

export default class StoreCookies extends Command {
    static aliases = [ 'sc' ];

    static description = 'shortens an existing URI, returning the new short url'


    static flags = {
        help: flags.help({char: 'h'}),
        profile: flags.string({
            char: 'p',
            required: false
        }),
        name: flags.string({
            char:  'n',
            required: true,
            default: 'default'
        }),
        format: flags.enum<OutputFormat>({
            options: [ OutputFormat.text, OutputFormat.json ],
            default: Config.outputFormat
        }),
        verbose: flags.boolean({
            default: Config.verbose,
            required: false,
            char: 'v'
        })
    }


    async run() {
        await this.config.runHook('config', {});
        const {args, flags} = this.parse(StoreCookies);

        let cookies: any = await new Promise((resolve, reject) => {
            chrome.getCookies('puppeteer', (err: any, cookies: any) => {
                if (err) reject(err);
                else resolve(cookies);
            });
        });

        let results: any[] = [];
        for (let cookie of cookies) {
            let cookieStore: IPuppeteerCookieStoreBase = {
                key: cookie.name,
                cookie,
                name: flags.name,
                profile: flags.profile
            }

            await StoreCookieRPCProxy.storePuppeteerCookie(cookieStore);
            results.push(cookieStore);
        }

        let outString = formatOutputFromFlags(results, flags, [ 'name', 'key', 'profile' ])

        console.log(outString);
    }
}
