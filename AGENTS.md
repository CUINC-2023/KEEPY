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

- Homepage and next-season preview share `src/lib/season-time.ts` for a hydration-safe Taipei-target countdown and time-node labels, because independently hardcoded dates drift.
- Editable front-end copy is read only via `src/lib/content-store.ts` (`useContent`, localStorage `pf-content-overrides-v1`), because list, detail and homepage must stay in sync.
- Missing-card display preferences use `src/lib/album-visibility.ts` keyed by pool and each actual card grade in versioned localStorage across pool covers, public card details and player album, because a hidden Local Mock card must not expose its image through another preview entrance or change ownership; missing card definitions fail closed.
- The legacy `/draw` entry redirects to `/app/draw/p-uniform`, because fixed 10+1 Demo results and controls must not diverge across draw entrances.
