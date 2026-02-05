/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as branches from "../branches.js";
import type * as categories from "../categories.js";
import type * as coupons from "../coupons.js";
import type * as customers from "../customers.js";
import type * as dashboard from "../dashboard.js";
import type * as dataSyncVerification from "../dataSyncVerification.js";
import type * as discountUtils from "../discountUtils.js";
import type * as discounts from "../discounts.js";
import type * as email from "../email.js";
import type * as emailSetupGuide from "../emailSetupGuide.js";
import type * as employees from "../employees.js";
import type * as hr from "../hr.js";
import type * as http from "../http.js";
import type * as loyalty from "../loyalty.js";
import type * as notifications from "../notifications.js";
import type * as onlineStore from "../onlineStore.js";
import type * as outstanding from "../outstanding.js";
import type * as phase4Analytics from "../phase4Analytics.js";
import type * as productImageRecognition from "../productImageRecognition.js";
import type * as products from "../products.js";
import type * as refunds from "../refunds.js";
import type * as returns from "../returns.js";
import type * as reviews from "../reviews.js";
import type * as roleSeed from "../roleSeed.js";
import type * as router from "../router.js";
import type * as sales from "../sales.js";
import type * as settings from "../settings.js";
import type * as staffProductImages from "../staffProductImages.js";
import type * as staffProductSettings from "../staffProductSettings.js";
import type * as staffStatistics from "../staffStatistics.js";
import type * as stockManagement from "../stockManagement.js";
import type * as stockTransfer from "../stockTransfer.js";
import type * as userManagement from "../userManagement.js";
import type * as userRules from "../userRules.js";
import type * as whatsappOrders from "../whatsappOrders.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  backup: typeof backup;
  branches: typeof branches;
  categories: typeof categories;
  coupons: typeof coupons;
  customers: typeof customers;
  dashboard: typeof dashboard;
  dataSyncVerification: typeof dataSyncVerification;
  discountUtils: typeof discountUtils;
  discounts: typeof discounts;
  email: typeof email;
  emailSetupGuide: typeof emailSetupGuide;
  employees: typeof employees;
  hr: typeof hr;
  http: typeof http;
  loyalty: typeof loyalty;
  notifications: typeof notifications;
  onlineStore: typeof onlineStore;
  outstanding: typeof outstanding;
  phase4Analytics: typeof phase4Analytics;
  productImageRecognition: typeof productImageRecognition;
  products: typeof products;
  refunds: typeof refunds;
  returns: typeof returns;
  reviews: typeof reviews;
  roleSeed: typeof roleSeed;
  router: typeof router;
  sales: typeof sales;
  settings: typeof settings;
  staffProductImages: typeof staffProductImages;
  staffProductSettings: typeof staffProductSettings;
  staffStatistics: typeof staffStatistics;
  stockManagement: typeof stockManagement;
  stockTransfer: typeof stockTransfer;
  userManagement: typeof userManagement;
  userRules: typeof userRules;
  whatsappOrders: typeof whatsappOrders;
  wishlist: typeof wishlist;
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
