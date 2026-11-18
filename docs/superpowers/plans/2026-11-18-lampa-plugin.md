# Lampa integration implementation plan

**Goal:** Keep standalone Movie Kombat and add launch/watch inside Lampa.
**Architecture:** A small Lampa plugin opens the existing HTTPS app in a fullscreen iframe. A versioned postMessage bridge validates origin, source window and session. Watching opens the TMDB card using Lampa.Activity.push, never starts a provider automatically.
**Tech stack:** Native JS, Lampa menu/controller APIs, existing static GitHub Pages hosting.
**Spec:** User-approved two-launch-mode proposal in this conversation; histories may remain separate.

- [x] Test standalone behavior, bridge handshake, wrong origins/windows/sessions, invalid IDs, close/reopen cleanup.
- [x] Add plugins/movie-kombat.js with one menu entry, fullscreen container and cleanup.
- [x] Add src/lampa-bridge.js; watch delegates only with active handshake; Back on home exits embedded app.
- [x] Verify existing tests, browser host harness and installation instructions.

Constraints: no framework, no changes to Lampa settings or unrelated plugins, no source autoplay, no implicit synchronization. Support modern Menu.addButton and older menu markup. Focus must enter the iframe; parent controller provides fallback remote keys. Timeout must leave an exit route. Publishable plugin URL supplied only after files are deployed.

Review: corrected host-remote Back to delegate Escape after handshake; explicitly supported opaque packaged and extension parent origins with source/session validation. All 26 tests pass. Browser harness using distinct localhost/127.0.0.1 origins successfully launched a battle and received TMDB movie 11674 through Activity.push. Real TV verification remains manual.
