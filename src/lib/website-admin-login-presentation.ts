import { DEFAULT_LOGIN_PRESENTATION, type LoginPresentation } from "../../packages/website-admin-core/src/login-presentation.ts";

/**
 * One published presentation for every connected customer login.
 * Edit here and deploy Vedantix; clients pick up changes on their next visit
 * (public cache: 60 seconds). Credentials and authentication stay in each site.
 */
export const websiteAdminLoginPresentation: Readonly<LoginPresentation> = {
  ...DEFAULT_LOGIN_PRESENTATION,
};
