import * as URL from "url";
import {IDriverGet, IEntity, ILocation, IUser} from "@znetstar/attic-common";
import {IHTTPResponse} from "@znetstar/attic-common/lib/IRPC";
import fetch from "node-fetch";
import * as puppeteer from 'puppeteer';
import {Browser, LaunchOptions, BrowserLaunchArgumentOptions, PDFOptions} from 'puppeteer';
import {IApplicationContext} from "@znetstar/attic-common/lib/Server";
import PuppeteerCookieStore, {IPuppeteerCookieStore, IPuppeteerCookieStoreBase} from "./PuppeteerCookieStore";

export interface HTTPPuppeteerProxyDriverOptions {
    browser?: Browser,
    options?: LaunchOptions&BrowserLaunchArgumentOptions
}

export enum HTTPPuppeteerProxyDriverExportTypes {
    mhtml = 'mhtml',
    pdf = 'pdf',
    html = 'html'
}

export interface HTTPPuppeteerProxyDriverLocationOptions {
    exportType: HTTPPuppeteerProxyDriverExportTypes,
    pdfOptions?: PDFOptions,
    cookieStoreName?: string;
}

const ApplicationContext = (global as any).ApplicationContext as IApplicationContext;
let defaultOptions: HTTPPuppeteerProxyDriverOptions = { options: { headless: false } };

export const defaultPDFOptions: PDFOptions = {
    format: 'letter',
    margin: {
        bottom: '0.39in',
        left: '0.39in',
        right: '0.39in',
        top: '0.39in'
    }
}

export const defaultLocationOptions: HTTPPuppeteerProxyDriverLocationOptions = {
    exportType: HTTPPuppeteerProxyDriverExportTypes.pdf,
    pdfOptions: defaultPDFOptions,
    cookieStoreName: 'default'
}


export default class HTTPPuppeteerProxyDriverBase implements IDriverGet<IHTTPResponse>{
    protected browser?: Browser = this.options.browser;

    public static set DefaultOptions(v: HTTPPuppeteerProxyDriverOptions) { defaultOptions = v; }
    public static get DefaultOptions(): HTTPPuppeteerProxyDriverOptions { return defaultOptions; }

    constructor(public user?: IUser, protected options: HTTPPuppeteerProxyDriverOptions = HTTPPuppeteerProxyDriverBase.DefaultOptions) {
    }

    public async getCookieStore(url: string, name: string): Promise<IPuppeteerCookieStore[]|null> {
        let parsedUrl = URL.parse(url);
        let host = parsedUrl.host.split('.').slice(-2, 3).join('\\.')
        let regex = new RegExp(`${host}`, 'ig');
        let q = {
            name,
            'cookie.domain': regex
        };
        let jar = await PuppeteerCookieStore.find(q).lean().exec(q);

        return jar;
    }

    public async get(location: ILocation): Promise<IHTTPResponse|null> {
        let entity: IEntity = location.entity as IEntity;
        (ApplicationContext.logs as any).silly({
            method: 'HTTPPuppeteerProxyDriver.get.start',
            params: [ location ]
        });

        const page = await this.browser.newPage();

        let options: HTTPPuppeteerProxyDriverLocationOptions = {
            ...defaultLocationOptions,
            ...(location.driverOptions || {})
        };

        let cookieStore = options.cookieStoreName ? await this.getCookieStore(entity.source.href, options.cookieStoreName) : null;

        let sourceHref = URL.parse(entity.source.href);
        if (cookieStore) {
            let cookies = cookieStore.map((c: any) => {
                return c.cookie;
            });
            await page.setCookie(...cookies);
        }

        await page.goto(entity.source.href, {
             waitUntil: 'networkidle0'
        });


        let result: IHTTPResponse = null;
        if (options.exportType === HTTPPuppeteerProxyDriverExportTypes.mhtml) {
            const cdp = await page.target().createCDPSession();
            const { data } = await cdp.send('Page.captureSnapshot', { format: 'mhtml' });
            result = {
              method: 'GET',
              href: entity.source.href,
              body: Buffer.from(data, 'utf8'),
              headers: new Map<string, string>([
                  [
                      'Content-Type', 'multipart/related'
                  ]
              ]),
              status: 200
            };
        } else if ( options.exportType === HTTPPuppeteerProxyDriverExportTypes.html ) {
            let data = await page.content();

            result = {
                method: 'GET',
                href: entity.source.href,
                body: Buffer.from(data, 'utf8'),
                headers: new Map<string, string>([
                    [
                        'Content-Type', 'text/html'
                    ]
                ]),
                status: 200
            };
        } else if ( options.exportType === HTTPPuppeteerProxyDriverExportTypes.pdf ) {
            let data = await page.pdf(options.pdfOptions || defaultPDFOptions);

            result = {
                method: 'GET',
                href: entity.source.href,
                body: data,
                headers: new Map<string, string>([
                    [
                        'Content-Type', 'application/pdf'
                    ]
                ]),
                status: 200
            };
        }
        await page.close();

        (ApplicationContext.logs as any).silly({
            method: 'HTTPPuppeteerProxyDriver.get.complete',
            params: [ location ]
        });
        return result;
    }

    public async head(location: ILocation): Promise<IHTTPResponse|null> {
        let entity: IEntity = location.entity as IEntity;
        let realHead = (await fetch(entity.source.href, {
            method: 'HEAD'
        }));

        let headers = Array.from(realHead.headers.entries())

        return {
            status: realHead.status,
            headers: new Map<string, string>(headers),
            body: null,
            href: location.href,
            method: 'HEAD'
        };
    }
}