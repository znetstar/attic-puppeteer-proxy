import {IApplicationContext, IPlugin} from "@znetstar/attic-common/lib/Server/index";
import IConfig from "@znetstar/attic-common/lib/Server/IConfig";
import HTTPPuppeteerProxyDriver from "./HTTPPuppeteerProxyDriver";
import * as puppeteer from "puppeteer";
import {LaunchOptions} from "puppeteer";

interface ConfigExt {
    puppeteerOptions: LaunchOptions
}

export type AtticPuppeteerProxyConfig =  IConfig&ConfigExt;

export class AtticServerPuppeteerProxy implements IPlugin {
    constructor(public applicationContext: IApplicationContext) {

    }

    public async init(): Promise<void> {
        let config: AtticPuppeteerProxyConfig = this.applicationContext.config as AtticPuppeteerProxyConfig;
        const browser = await puppeteer.launch({
            headless: true,
            ...(config.puppeteerOptions || {})
        });


        require('./PuppeteerCookieStore');

        HTTPPuppeteerProxyDriver.DefaultOptions.browser = browser;
        await this.applicationContext.loadDriver(HTTPPuppeteerProxyDriver, 'HTTPPuppeteerProxyDriver');
    }

    public get name(): string {
        return JSON.parse((require('fs').readFileSync(require('path').join(__dirname, '..', 'package.json'), 'utf8'))).name;
    }
}

export default AtticServerPuppeteerProxy;