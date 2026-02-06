/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as exams from "../exams.js";
import type * as flashcards from "../flashcards.js";
import type * as http from "../http.js";
import type * as library from "../library.js";
import type * as migrations from "../migrations.js";
import type * as mockExams from "../mockExams.js";
import type * as questions from "../questions.js";
import type * as savedExams from "../savedExams.js";
import type * as schema_proposed from "../schema_proposed.js";
import type * as seedLibrary from "../seedLibrary.js";
import type * as seedQuestions from "../seedQuestions.js";
import type * as subscriptions from "../subscriptions.js";
import type * as userProgress from "../userProgress.js";
import type * as users from "../users.js";
import type * as webhooks from "../webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  crons: typeof crons;
  exams: typeof exams;
  flashcards: typeof flashcards;
  http: typeof http;
  library: typeof library;
  migrations: typeof migrations;
  mockExams: typeof mockExams;
  questions: typeof questions;
  savedExams: typeof savedExams;
  schema_proposed: typeof schema_proposed;
  seedLibrary: typeof seedLibrary;
  seedQuestions: typeof seedQuestions;
  subscriptions: typeof subscriptions;
  userProgress: typeof userProgress;
  users: typeof users;
  webhooks: typeof webhooks;
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
