# AGENTS.md — Building **Kagespect Core** (for autonomous agents)

> **Scope:** This guide is for agents that **develop Kagespect core itself** (the pure TypeScript nucleus in `packages/core`). It is **not** for application authors who only use Kagespect.
>
> **Tagline:** *Semantic output for modern CLIs.*

---

## 0) Non‑negotiables (read first)

* **Pure core**: No I/O, no timers, no global state, no terminal control, no `console.*`. The core emits **Events**, nothing else.
* **Deno + ESM only** in `packages/core`. Do **not** import Node or npm packages here. (Renderers may use npm via Deno.)
* **Type aliases, not interfaces** — use `type` for all public shapes; rely on discriminated unions for Events.
* **Determinism**: Make behavior reproducible — inject `Clock` and `IdGen` everywhere time/IDs appear.
* **SemVer**: Additive changes → **minor**; breaking field/shape changes → **major**. Never silently break.

---

## 1) Repository map (monorepo)

```
packages/
  core/                 # YOU ARE HERE — pure TS nucleus (Deno/ESM)
    mod.ts
    src/core/{types,events,state,bus,model,capabilities,interaction}.ts
    test/*.test.ts
  renderer-consola/     # minimal non‑TTY sink (npm:consola via Deno) — can evolve independently
```

Root `deno.jsonc` defines workspace + import maps:

* `kagespect/core` → `packages/core/mod.ts`

---

## 2) Architectural pinch points (what must not drift)

1. **Command → Event normalization** is the heart: commands are *intent*, events are *facts*.
2. **Event Bus** delivers events to zero or more sinks in order; **one sink’s failure must not affect others**.
3. **UiState** is an in‑memory projection for tests and simple queries; it is **not a persistence layer**.
4. **Prompts are out‑of‑band** (Interaction Port). No blocking UI in core; only type contracts.

---

## 3) Public API contract

### Exports (stable surface)

* `types.ts`: `Id`, `Millis`, `Level`, `RichText`, `Persistence`, domain types
* `events.ts`: `Command`, `Event` (discriminated unions)
* `state.ts`: `UiState`, `initialState()`
* `bus.ts`: `UiEventSink`, `UiEventBus`, `createBus()`
* `model.ts`: `createModel()`, `Clock`, `IdGen`, `UiModel`
* `capabilities.ts`: `UiCapabilities`
* `interaction.ts`: prompt schema types & `CliInteractionPort`

### Backward‑compat rules

* **Add fields** as optional; never repurpose fields.
* **Rename/Remove** → major bump.
* **New events/commands** → minor bump (ensure default no‑op behavior for old sinks).
* **Session.meta.schemaVersion**: bump when event shapes materially change.

---

## 4) Type system policies

* Prefer **`type`** over `interface` (no declaration merging).
* Use **brands** (e.g., `Id`, `Millis`) to avoid accidental mixups.
* Events/Commands must be **discriminated** via `t` / `c` string literals.
* Avoid classes; use functions & plain objects.
* Enable `exactOptionalPropertyTypes` semantics (already set at repo level).
* No `any` in public API; if unavoidable, constrain generics.

---

## 5) State machine invariants (must hold)

* **Lifecycle**: No event before `SessionStarted`, none after `SessionEnded`.
* **Context LIFO**: `ContextPopped` must match the most recent compatible `ContextPushed`.
* **Streams**: `StreamChunk.seq` strictly increases per stream; chunks only while stream open.
* **Progress**: `progress.value` monotonic non‑decreasing per task (agents may restart a task by starting a new one).
* **Time**: All event timestamps (`at`) come from injected `Clock`.

Provide tests whenever you touch code that affects these.

---

## 6) Error handling policy

* **Model**: On invariant violation, `dispatch()` **throws** `Error` (programmer error). Do not auto‑correct silently.
* **Bus**: `publish()` **isolates** sink failures (catch per sink; do not rethrow).
* **No logging** in core. Tests can observe behavior via events/state.

---

## 7) Performance budgets

* Avoid per‑message allocations in hot paths; reuse small helpers.
* Keep `dispatch()` **strictly sequential**. Concurrency belongs outside core.
* Cost model target: O(1) per event (amortized). No unbounded scans except in tests.

---

## 8) Test policy (Deno)

* Use `deno test` with STD asserts only. No flaky tests.
* **Deterministic IDs/time** via injected `Clock`/`IdGen`.
* Provide **golden tests** for common flows (session, task lifecycle, streams).
* Provide **property‑style** tests for invariants where reasonable (e.g., random sequences respecting grammar).
* Coverage: keep core lines **≥ 90%**.

Tasks:

```bash
deno task fmt
deno task lint
deno task test
```

---

## 9) Change workflow for agents

1. **Pick an issue** or open an RFC for schema changes (new commands/events).
2. Update **types** first; run type‑check.
3. Implement normalization in `model.ts` (Command → Event) and **update state projection** if needed.
4. Extend/adjust tests (`packages/core/test/*.test.ts`). Ensure invariants.
5. Update **docs**: `README.md` (core), `AGENTS.md` (this file) if rules changed.
6. `deno task fmt && deno task lint && deno task test` must pass.
7. Open PR with checklist filled.

PR checklist (must pass):

* [ ] Public API unchanged or documented as **minor/major**
* [ ] Invariants preserved + tests added/updated
* [ ] Deterministic tests (no wall‑clock, no randomness without seed)
* [ ] No I/O, no globals, no npm imports in core
* [ ] Docs updated (README/AGENTS)

---

## 10) Adding a new Command/Event (recipe)

**Example:** add `t: "NotePublished"` event for brief annotations.

1. Add to `events.ts`: command `publishNote`, event `NotePublished` (tagged union).
2. In `model.ts`, handle `c: "publishNote"` → validate session → emit `NotePublished`.
3. `state.ts`: decide whether state tracks notes (optional).
4. Tests: one golden (happy path), one invariant (no session → throw).
5. Docs: mention in README Concepts table.

Back‑compat rules apply: fields optional first; default behavior for older sinks is to ignore unknown events.

---

## 11) Security & privacy

* Treat event payloads as **logs**; never record secrets in clear text.
* `password` and other sensitive prompts exist only as **types** here — core must not hold or echo secrets.
* No dynamic code execution, no network, no file I/O in core.

---

## 12) Cross‑package boundaries

* `renderer-consola` may import npm packages via Deno (`npm:`). `core` **must not**.
* Breaking changes in `core` require synchronized PRs for renderers. Prefer additive evolution.

---

## 13) Coding conventions

* Filenames: `snake_case.ts` inside `src/core/`.
* Export surface from `mod.ts` only; avoid deep imports across packages (use import map).
* Literals over enums; small helper functions over classes.
* Prefer `const` objects for internal tables (e.g., level maps).
* Document non‑obvious branches with one‑line comments (imperative mood).

---

## 14) Versioning & release notes

* Versioning handled at repo tags; keep a human‑readable `CHANGELOG.md` at root.
* Record schema bumps in `Session.meta.schemaVersion`.
* For each release: summarize new commands/events, backward‑compat notes, migration tips for sinks.

---

## 15) Known trade‑offs (intentional)

* **No implicit batching**: agents must decide message granularity.
* **No built‑in persistence**: replay is external (JSONL sink is out of core).
* **Sequential dispatch** keeps reasoning simple; parallelism is a renderer concern.

---

## 16) How to think like Kagespect (for agents)

* Prefer **meaning over rendering**. If you’re about to add color or width, you’re in the wrong package.
* Prefer **structures** (`Table`, `Artifact`, `MetricSeries`) over blobs of text.
* Prefer **explicit lifecycle** (`TaskStarted/Finished`) to ad‑hoc strings.

> Agents are not painters here — they are *court reporters*. Record facts cleanly; let renderers stage the spectacle.
