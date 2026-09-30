import type { CSSProperties, ReactNode } from "react";

export interface AdminSite { id: string; name: string; publicUrl: string; logoUrl?: string }
export interface AdminUser { label: string; email?: string }
export type WebsiteAdminLoginMode = "customer" | "platform";
export interface WebsiteAdminLoginCredentials { email: string; password: string; mode: WebsiteAdminLoginMode }
export interface WebsiteAdminLoginProps {
  site: AdminSite;
  onSubmit: (credentials: WebsiteAdminLoginCredentials) => void | Promise<void>;
  mode?: WebsiteAdminLoginMode;
  onModeChange?: (mode: WebsiteAdminLoginMode) => void;
  busy?: boolean;
  error?: string | null;
  notice?: string | null;
  recoveryUrl?: string;
  supportEmail?: string;
  returnUrl?: string;
  demoUrl?: string;
  footer?: ReactNode;
  className?: string;
}
export interface AdminModuleDefinition {
  id: string;
  label: string;
  description?: string;
  group?: string;
  enabled: boolean;
}
export interface AdminModule extends AdminModuleDefinition { icon?: ReactNode }
export interface SiteAdminManifest {
  version: 1;
  site: AdminSite;
  modules: readonly AdminModuleDefinition[];
}
export interface AdminRequestContext { signal?: AbortSignal }
/** Site-specific implementations retain their own validation, permissions and storage. */
export interface WebsiteAdminDataAdapter<Snapshot, Change> {
  load(context?: AdminRequestContext): Promise<Snapshot>;
  save(change: Change, context?: AdminRequestContext): Promise<Snapshot>;
}
export interface WebsiteAdminShellProps {
  site: AdminSite;
  user: AdminUser;
  modules: readonly AdminModule[];
  activeModuleId: string;
  onModuleChange: (id: string) => void;
  onSignOut: () => void | Promise<void>;
  children: ReactNode;
  headerActions?: ReactNode;
  status?: ReactNode;
  bottomBar?: ReactNode;
  className?: string;
  style?: CSSProperties;
  signOutLabel?: string;
  signOutDisabled?: boolean;
}
