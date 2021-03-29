import {IPuppeteerCookieStoreBase} from "./PuppeteerCookieStore";
import {IRPC} from "@znetstar/attic-common";

export interface IRPCCookieStoreExt {
    storePuppeteerCookie(store: IPuppeteerCookieStoreBase): Promise<void>;
}

export type IRPCCookieStore = IRPC&IRPCCookieStoreExt;