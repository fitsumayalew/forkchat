/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as account_mutations from "../account/mutations.js";
import type * as account_queries from "../account/queries.js";
import type * as ai_chat from "../ai/chat.js";
import type * as attachments_index from "../attachments/index.js";
import type * as attachments_mutations from "../attachments/mutations.js";
import type * as attachments_queries from "../attachments/queries.js";
import type * as auth from "../auth.js";
import type * as folders_mutations from "../folders/mutations.js";
import type * as folders_queries from "../folders/queries.js";
import type * as http from "../http.js";
import type * as messages_mutations from "../messages/mutations.js";
import type * as messages_queries from "../messages/queries.js";
import type * as threads_mutations from "../threads/mutations.js";
import type * as threads_queries from "../threads/queries.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "account/mutations": typeof account_mutations;
  "account/queries": typeof account_queries;
  "ai/chat": typeof ai_chat;
  "attachments/index": typeof attachments_index;
  "attachments/mutations": typeof attachments_mutations;
  "attachments/queries": typeof attachments_queries;
  auth: typeof auth;
  "folders/mutations": typeof folders_mutations;
  "folders/queries": typeof folders_queries;
  http: typeof http;
  "messages/mutations": typeof messages_mutations;
  "messages/queries": typeof messages_queries;
  "threads/mutations": typeof threads_mutations;
  "threads/queries": typeof threads_queries;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
