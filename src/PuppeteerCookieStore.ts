import {IApplicationContext} from "@znetstar/attic-common/lib/Server";
import { ObjectId } from 'mongodb';
import {IRPC} from "@znetstar/attic-common";
import {IRPCCookieStore, IRPCCookieStoreExt} from "./IRPCCookieStoreExt";

type Mongoose = any;
type Schema = any;
type Types = any;
type Document = any;

const ApplicationContext = (global as any).ApplicationContext as IApplicationContext;
const mongoose = ApplicationContext.mongoose as Mongoose;

export interface IPuppeteerCookieStoreBase {
    id?: string;
    _id?: string;
    cookie: any;
    profile?: string;
    name: string;
    key: string;
}

export interface IPuppeteerCookieStoreModel {
    id: ObjectId;
    _id: ObjectId;
    cookie: any;
    profile?: string;
    name: string;
    key: string;
}

export type IPuppeteerCookieStore = IPuppeteerCookieStoreBase&IPuppeteerCookieStoreModel;


// @ts-ignore
export const PuppeteerCookieStoreSchema = <Schema<IPuppeteerCookieStore>>(new (require('mongoose').Schema)({
    cookie: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    profile: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: 'puppeteer_cookie_store'
}))

let rpcMethods: IRPCCookieStore = ApplicationContext.rpcServer.methods as IRPCCookieStore;

rpcMethods.storePuppeteerCookie = async function (cookieStore: IPuppeteerCookieStoreBase): Promise<void> {
    await PuppeteerCookieStore.updateOne({
        name: cookieStore.name,
        'cookie.name': cookieStore.cookie.name,
        'cookie.domain': cookieStore.cookie.domain,
        'cookie.path': cookieStore.cookie.path
    }, {
        $set: {
            name: cookieStore.name,
            profile: cookieStore.profile,
            cookie: cookieStore.cookie,
            key: cookieStore.key
        }
    }, {
        upsert: true
    });
}

PuppeteerCookieStoreSchema.index({
    name: 1,
    'cookie.domain': 1

}, {});


PuppeteerCookieStoreSchema.index({
    name: 1,
    'cookie.name': 1,
    'cookie.domain': 1,
    'cookie.path': 1,
}, {
    unique: true
});


export const PuppeteerCookieStore = mongoose.model('PuppeteerCookieStore', PuppeteerCookieStoreSchema);
export default PuppeteerCookieStore;