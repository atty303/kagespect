import type {
  Id, Millis, Level, Persistence, RichText, ContextFrame, Stream,
  Log, Diagnostic, Span, Table, Artifact, Summary, Task, Session, Section
} from "./types.ts";

export type UiState = {
  session?: Session;
  sections: Section[];
  tasks: Record<Id, {
    def: Task; startedAt?: Millis; progress?: number;
    finished?: { ok: boolean; at: Millis; durationMs?: Millis; result?: RichText };
    messages: Array<{ at: Millis; level: Level; text: RichText; persistence: Persistence }>
  }>;
  contextStack: ContextFrame[];
  streams: Record<Id, { def: Stream; seq: number; open: boolean }>;
  logs: Log[]; diags: Diagnostic[]; spans: Record<Id, Span>;
  tables: Table[]; artifacts: Artifact[]; summary?: Summary;
};

export const initialState = (): UiState => ({
  sections: [], tasks: {}, contextStack: [], streams: {}, logs: [], diags: [], spans: {}, tables: [], artifacts: []
});
