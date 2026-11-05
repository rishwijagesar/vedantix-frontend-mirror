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
- Website enquiry forms preserve entered details through a shared email-draft builder and never claim server delivery; the existing contact flow remains an explicit mailto handoff.
