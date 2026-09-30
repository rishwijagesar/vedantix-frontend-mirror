import type { CSSProperties, ReactNode, ReactElement } from "react";
export interface AdminSite { id: string; name: string; publicUrl: string; logoUrl?: string }
export interface AdminUser { label: string; email?: string }
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
