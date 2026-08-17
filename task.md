# Phase 1
- [x] Setup new file routes for `/host`, `/join`, and `/arena/[roomId]` in Next.js App Router (`src/app`).
- [x] Extract the current game display logic from `src/app/page.tsx` into `/arena/[roomId]`.
- [x] Move `MatchSetupWizard` logic to the `/host` route. (The user wants to keep the MatchSetupWizard functionality for hosts).
- [x] Create a new professional landing page in `src/app/page.tsx` with "Host Match", "Join Match", and "Local Match" entry points. Ensure the design matches the current design practices of the project.

# Phase 2: Firebase Real-time Hardening
- [x] Audit and update `src/hooks/useFirebaseMatch.ts` for reliable 6-digit room code generation.
- [x] Implement robust host/guest state synchronization in Firebase.
- [x] Guarantee connection tracking (disconnects/reconnects).

# Phase 3: Zustand State Refactor
- [x] Refactor `timerStore.ts` and `tournamentStore.ts` to clearly delineate local UI state and shared match state.
- [x] Update components to subscribe cleanly without race conditions. Ensure that Guests act strictly as consumers of the Host's truth, while still allowing optimistic local timer updates.

# Phase 4: Local Bot Match Engine
- [x] Implement the local bot match logic in a dedicated controller or hook (`useBotController`) that simulates bot progression and operates against local Zustand state (`timerStore`, `tournamentStore`) without touching Firebase.
- [x] Connect bot events to the activity feed to simulate real players.
- [x] The UI should support a "Local Match" from the main page, dropping the player into `/arena/local` (or a local room logic) with just bots.
