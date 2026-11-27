# Architecture

These diagrams are the architecture source of truth. **Update them in the same pull request as any architectural change.** A change to a boundary, a flow, deployment, or the domain model updates the diagram here and links or adds an ADR in [`docs/adr/`](../adr/0001-record-architecture-decisions.md).

| Document | What it shows |
| --- | --- |
| [system-context.md](system-context.md) | People and the systems outside the app |
| [components.md](components.md) | Processes, modules, and where code lives |
| [data-flow.md](data-flow.md) | Login, offline sync, and the domain model |
| [deployment.md](deployment.md) | Where the app runs |

Facts under **Current** were checked against `integration` at `b6c208cf6` on 27 Nov 2026. Sections marked **Planned** are the March 2027 beta. They are decisions, and they are not in the tree yet.

The project stack is [ADR-0019](../adr/0019-future-of-work-project-stack.md).

The earlier `current-state.md` and `target-state.md` drafts are folded into the four documents above.
