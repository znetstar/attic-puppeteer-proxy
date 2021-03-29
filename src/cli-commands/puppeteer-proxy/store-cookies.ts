import {Command, flags} from '@oclif/command'
import {formatOutputFromFlags, OutputFormat, RPCProxy} from "@znetstar/attic-cli-common";
import * as  URL from "url";
import Config from "@znetstar/attic-cli-common/lib/Config";
import {IRPC} from "@znetstar/attic-common";
import {IRPCCookieStore} from "../../IRPCCookieStoreExt";
import {IPuppeteerCookieStoreBase} from "../../PuppeteerCookieStore";
const chrome = require('chrome-cookies-secure');

let StoreCookieRPCProxy: IRPCCookieStore = RPCProxy as IRPCCookieStore;

export default class StoreCookies extends Command {
    static description = 'shortens an existing URI, returning the new short url'


    static flags = {
        help: flags.help({char: 'h'}),
        url: flags.string({
            char: 'r',
            required: true
        }),
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

        let cookies: any  = await new Promise((resolve, reject) => {
            chrome.getCookies(flags.url, 'puppeteer', (err: any, cookies: any) => {
                if (err) reject(err);
                else resolve(cookies);
            });
        });

        let cookieStore: IPuppeteerCookieStoreBase = {
            cookies,
            profile: flags.profile,
            url: flags.url,
            name: flags.name
        };

        await StoreCookieRPCProxy.setPuppeteerCookieStore(cookieStore);

        let outString = formatOutputFromFlags(cookieStore, flags, [ 'url', 'name', 'profile' ])

        console.log(outString);
    }
}
