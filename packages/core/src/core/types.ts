export type Id = string & { readonly __brand: "Id" };
export type Millis = number & { readonly __brand: "Millis" };
export const now = (): Millis => Date.now() as Millis;

export type Level = "trace"|"debug"|"info"|"warn"|"error"|"fatal";
export type Importance = "low"|"normal"|"high"|"critical";
export type Persistence = "ephemeral"|"persistent";
export type Labels = Record<string, string|number|boolean>;
export type RichText = string | { text: string; meta?: Record<string, unknown> };

export type ContextKind = "session"|"section"|"group"|"task"|"step";
export type ContextFrame = { kind: ContextKind; id: Id; title?: string; labels?: Labels };

export type StreamChannel = "stdout"|"stderr"|"other";
export type Unit = "count"|"bytes"|"ms"|"s"|"percent"|"ratio"|"ops"|"hz" | { custom: string };
export type MetricKind = "counter"|"gauge"|"histogram"|"summary";

export type Session = { id: Id; startedAt: Millis; meta?: Record<string, unknown> };
export type Section = { id: Id; sessionId: Id; title: string; subtitle?: string; importance?: Importance; parentId?: Id };
export type Group   = { id: Id; sessionId: Id; sectionId?: Id; title: string; collapsed?: boolean; parentId?: Id };
export type Task    = { id: Id; sessionId: Id; sectionId?: Id; name: string; total?: number; parentId?: Id };
export type Step    = { id: Id; taskId: Id; label: string; parentId?: Id };

export type Log = { id: Id; sessionId: Id; level: Level; message: RichText; context?: Record<string, unknown>; persistence?: Persistence };
export type Diagnostic = { id: Id; sessionId: Id; level: Exclude<Level, "trace"|"debug"|"info">; message: RichText; location?: { file?: string; line?: number; column?: number }; code?: string };
export type Span = { id: Id; sessionId: Id; name: string; startedAt: Millis; endedAt?: Millis; tags?: Labels };
export type Table = { id: Id; sessionId: Id; columns: string[]; rows: Array<Record<string, string|number>>; title?: string };
export type Artifact = { id: Id; sessionId: Id; kind: "file"|"dir"|"url"|"blob"; uri: string; label?: string; meta?: Record<string, unknown> };
export type Summary = { id: Id; sessionId: Id; items: Record<string, string|number> };

export type Stream = {
  id: Id; sessionId: Id; relatedTaskId?: Id; source?: string; labels?: Labels;
  encoding?: "utf8"|"binary"; lineBuffered?: boolean;
  truncatePolicy?: { maxBufferedBytes?: number; keep?: "head"|"tail" };
};

export type MetricSeries = { id: Id; sessionId: Id; name: string; kind: MetricKind; unit?: Unit; labels?: Labels; buckets?: number[] };
export type MetricPoint = { seriesId: Id; at: Millis; value: number; labels?: Labels };
