<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Public positioning architecture
- Route head() owns public title and social metadata; the shared SEO component renders canonical links and visible-content JSON-LD during SSR without manual head mutation, preventing stale or duplicate tags.
- Business-software content is shared separately from live website/catalog pricing so software quote scope cannot silently change website prices or historical billing.
- Preserve production canonical URLs independently of the preview origin so the migration retains existing search identities.
- The contact form submits to the `contact-enquiry` Edge Function (table `contact_enquiries`) and only reports success once the server confirms storage. If that call fails it says so and offers the shared email-draft builder as an explicit mailto fallback; other website enquiry forms still use the mailto handoff and never claim server delivery.
- Shared service-navigation data drives the public megamenu, footer service links and service cards so every offered service has the same real destination.
- The illustrative hero uses CSS timelines with pause state and reduced-motion end-state overrides; it is browser-safe and server-rendered without video or external product data.
- Additional quotation-based services use a shared content page with leaf route metadata and visible-content Service/Breadcrumb schemas, separate from website pricing and admin catalog logic.
