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
    cookies: any;
    profile?: string;
    name: string;
}

export interface IPuppeteerCookieStoreModel {
    id: ObjectId;
    _id: ObjectId;
    cookies: any;
    profile?: string;
    name: string;
}

export type IPuppeteerCookieStore = IPuppeteerCookieStoreBase&IPuppeteerCookieStoreModel;


// @ts-ignore
export const PuppeteerCookieStoreSchema = <Schema<IPuppeteerCookieStore>>(new (require('mongoose').Schema)({
    cookies: {
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
    }
}, {
    timestamps: true,
    collection: 'puppeteer_cookie_store'
}))

let rpcMethods: IRPCCookieStore = ApplicationContext.rpcServer.methods as IRPCCookieStore;

rpcMethods.setPuppeteerCookieStore = async function (cookieStore: IPuppeteerCookieStoreBase): Promise<void> {
    await PuppeteerCookieStore.updateOne({
        name: cookieStore.name
    }, {
        $set: {
            name: cookieStore.name,
            profile: cookieStore.profile,
            cookies: cookieStore.cookies
        }
    }, {
        upsert: true
    });
}

rpcMethods.setPuppeteerCookieStores = async function (cookieStores: IPuppeteerCookieStoreBase[]): Promise<void> {
    for (let cookieStore of cookieStores) {
        await PuppeteerCookieStore.updateOne({
            name: cookieStore.name
        }, {
            $set: {
                name: cookieStore.name,
                profile: cookieStore.profile,
                cookies: cookieStore.cookies
            }
        }, {
            upsert: true
        });
    }
}


PuppeteerCookieStoreSchema.index({
    name: 1,
    url: 1
}, {
    unique: true
});


export const PuppeteerCookieStore = mongoose.model('PuppeteerCookieStore', PuppeteerCookieStoreSchema);
export default PuppeteerCookieStore;