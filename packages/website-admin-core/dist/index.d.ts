import type { CSSProperties, ReactNode, ReactElement } from "react";
export interface AdminSite { id: string; name: string; publicUrl: string; logoUrl?: string }
export interface AdminUser { label: string; email?: string }
export type WebsiteAdminLoginMode = "customer" | "platform";
export interface WebsiteAdminLoginCredentials { email: string; password: string; mode: WebsiteAdminLoginMode }
export interface WebsiteAdminLoginProps {
  site: AdminSite; onSubmit: (credentials: WebsiteAdminLoginCredentials) => void | Promise<void>;
  mode?: WebsiteAdminLoginMode; onModeChange?: (mode: WebsiteAdminLoginMode) => void;
  busy?: boolean; error?: string | null; notice?: string | null; recoveryUrl?: string;
  supportEmail?: string; returnUrl?: string; demoUrl?: string; footer?: ReactNode; className?: string;
}
export interface LoginPresentation {
  version: 1; layout: "split" | "centered"; brandName: string; eyebrow: string;
  storyTitle: string; storyText: string; heading: string; description: string;
  primaryColor: string; backgroundColor: string; borderRadius: "8px" | "12px" | "16px" | "24px";
}
export declare const DEFAULT_LOGIN_PRESENTATION: Readonly<LoginPresentation>;
export declare const WEBSITE_ADMIN_LOGIN_PRESENTATION_URL: "https://vedantix.nl/api/public/website-admin-login";
export declare const LOGIN_PRESENTATION_MAX_BYTES: 4096;
export declare const LOGIN_PRESENTATION_TIMEOUT_MS: 3000;
export declare function validateLoginPresentation(value: unknown): LoginPresentation | null;
export declare function loadLoginPresentation(fetcher?: typeof fetch, signal?: AbortSignal): Promise<Readonly<LoginPresentation>>;
export declare function WebsiteAdminLogin(props: WebsiteAdminLoginProps): ReactElement;
export interface AdminModuleDefinition { id: string; label: string; description?: string; group?: string; enabled: boolean }
export interface AdminModule extends AdminModuleDefinition { icon?: ReactNode }
export interface SiteAdminManifest { version: 1; site: AdminSite; modules: readonly AdminModuleDefinition[] }
export interface AdminRequestContext { signal?: AbortSignal }
export interface WebsiteAdminDataAdapter<Snapshot, Change> {
  load(context?: AdminRequestContext): Promise<Snapshot>;
  save(change: Change, context?: AdminRequestContext): Promise<Snapshot>;
}
export interface WebsiteAdminShellProps {
  site: AdminSite; user: AdminUser; modules: readonly AdminModule[]; activeModuleId: string;
  onModuleChange: (id: string) => void; onSignOut: () => void | Promise<void>; children: ReactNode;
  headerActions?: ReactNode; status?: ReactNode; bottomBar?: ReactNode; className?: string;
  style?: CSSProperties; signOutLabel?: string; signOutDisabled?: boolean;
}
export declare function WebsiteAdminShell(props: WebsiteAdminShellProps): ReactElement;
export declare function enabledModules<T extends AdminModuleDefinition>(modules: readonly T[]): T[];
export declare function groupModules<T extends AdminModuleDefinition>(modules: readonly T[]): { label: string; modules: T[] }[];
export declare function safePublicUrl(value: string): string | null;
