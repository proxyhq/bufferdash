/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as bridgeCustomers from "../bridgeCustomers.js";
import type * as bridgeWallets from "../bridgeWallets.js";
import type * as bridgeWebhooks from "../bridgeWebhooks.js";
import type * as http from "../http.js";
import type * as kycLinks from "../kycLinks.js";
import type * as liquidationAddresses from "../liquidationAddresses.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  bridgeCustomers: typeof bridgeCustomers;
  bridgeWallets: typeof bridgeWallets;
  bridgeWebhooks: typeof bridgeWebhooks;
  http: typeof http;
  kycLinks: typeof kycLinks;
  liquidationAddresses: typeof liquidationAddresses;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
