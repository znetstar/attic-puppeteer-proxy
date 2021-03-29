import {IApplicationContext, IPlugin} from "@znetstar/attic-common/lib/Server";
import HTTPPuppeteerProxyDriver from "./HTTPPuppeteerProxyDriver";
import * as puppeteer from "puppeteer";

export class AtticServerPuppeteerProxy implements IPlugin {
    constructor(public applicationContext: IApplicationContext) {

    }

    public async init(): Promise<void> {
        const browser = await puppeteer.launch({
            headless: true
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