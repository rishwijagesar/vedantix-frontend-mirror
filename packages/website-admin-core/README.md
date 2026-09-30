# @vedantix/website-admin-core

Versioned React 18/19 shell and login shared by independently deployed Vedantix customer websites.
Version 0.3.0 provides responsive navigation, grouped modules, a consistent Vedantix theme,
layout slots and `WebsiteAdminLogin`. Existing account providers, credentials, site editors
and backend permissions remain in the consuming website.

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
`file:vendor/vedantix-website-admin-core-0.3.0.tgz` and update that site's lockfile.
A shared version change is rolled out explicitly to each site; no private registry is required.

## Shared login, existing accounts

```tsx
import { WebsiteAdminLogin } from '@vedantix/website-admin-core';
<WebsiteAdminLogin site={site}
  onSubmit={({ email, password }) => signIn(email, password)}
  busy={busy} error={error} recoveryUrl={recoveryUrl}
  supportEmail="info@vedantix.nl" footer={existingActivationLink} />
```

The component displays one email/password form with no account-type selector or provider-specific
instructions. The consuming website supplies its sign-in handler and recovery route, including
any server-side provider resolution. Existing passwords are passed unchanged; the component
sets no minimum password length, makes no authentication request, migrates no account and sends
no recovery email itself. The deprecated optional `mode`/`onModeChange` props remain source-compatible:
`mode` is retained in the submit payload, while `onModeChange` is never called. They never add
controls or provider-specific text to the form. The 0.2.1 sidebar overflow fix is retained.

## Central presentation updates

On a new login-screen visit the component requests the fixed public URL
`https://vedantix.nl/api/public/website-admin-login`. This is a validated JSON presentation,
not remotely executable code or an external CSS file. It can change text, `split`/`centered`
layout, two colors and an enumerated corner radius. The endpoint uses public caching up to
60 seconds. All consumers already on 0.2.0 can receive those presentation changes without
a site rebuild, on a subsequent visit once the cached response is stale.

The local blue design appears immediately. The request omits credentials and referrer,
rejects redirects, stops after three seconds and accepts at most 4096 bytes. Unknown fields,
HTML, URLs, CSS expressions, unsupported values or colors with inadequate contrast fail
validation. A failed request keeps the local design. A response received after focus,
typing or interaction cannot change the active form layout.

Tenant identity, credential fields, labels, authentication callbacks,
recovery/support links and security messages are never controlled by that JSON. New
structural features still require a new package release and explicit consumer update;
the pinned tarball itself does not update automatically.
