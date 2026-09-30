# @vedantix/website-admin-core

Versioned React 18/19 shell shared by independently deployed Vedantix customer websites.
It provides responsive navigation, grouped modules, a consistent Vedantix theme and layout slots.
Existing site editors and backend permissions remain in the consuming website.

```tsx
import { WebsiteAdminShell, type AdminModule } from '@vedantix/website-admin-core';
import '@vedantix/website-admin-core/styles.css';

const modules: AdminModule[] = [
  { id: 'content', label: 'Pagina-inhoud', group: 'Website', enabled: true },
  { id: 'profile', label: 'Mijn account', group: 'Account', enabled: true },
];
// Use the app's own routing, unsaved-change guard and existing editors.
<WebsiteAdminShell site={site} user={user} modules={modules}
  activeModuleId={active} onModuleChange={selectModule} onSignOut={signOut}
  status={notice} bottomBar={saveControls}>
  {editor}
</WebsiteAdminShell>
```

Module visibility is presentation only; each backend must enforce site access independently.
The manifest stores module labels and availability; icons and content are supplied by the app.
`WebsiteAdminDataAdapter<Snapshot, Change>` is an optional contract for app-specific data access.
The shell neither fetches data nor manages authentication, drafts or unsaved changes.

Override `--va-primary`, `--va-primary-soft`, `--va-background`, `--va-surface`, `--va-text`,
`--va-muted` and `--va-border` on `.va-shell` for a theme. All CSS selectors are scoped to `.va-*`.
Place ordinary, non-fixed save controls in `bottomBar`; it stays inside the main column.
Use `status` for a banner and render a detailed page heading inside `children` if needed.

Build: `npm install` then `npm run build`. No React runtime is bundled.
Distribution: `npm pack`, copy the resulting archive into each site's `vendor/`, then depend on
`file:vendor/vedantix-website-admin-core-0.1.0.tgz` and update that site's lockfile.
A shared version change is rolled out explicitly to each site; no private registry is required.
