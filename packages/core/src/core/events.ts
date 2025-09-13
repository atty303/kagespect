import type {
  Id, Millis, RichText, Level, ContextFrame, StreamChannel,
  Session, Section, Task, Step, Log, Diagnostic, Span, Table, Artifact, Summary,
  Stream, MetricSeries, MetricPoint
} from "./types.ts";

export type Command =
  | { c: "beginSession"; session?: Partial<Session> }
  | { c: "endSession"; ok: boolean }
  | { c: "openSection"; section: Omit<Section, "id"|"sessionId"> }
  | { c: "startTask";   task: Omit<Task, "id"|"sessionId"> }
  | { c: "progress";    taskId: Id; value: number }
  | { c: "taskMsg";     taskId: Id; message: RichText; level?: Level; persistence?: "ephemeral"|"persistent" }
  | { c: "finishTask";  taskId: Id; ok: boolean; result?: RichText }
  | { c: "pushContext"; frame: ContextFrame }
  | { c: "popContext";  kind: ContextFrame["kind"]; id: Id }
  | { c: "openStream";  stream: Omit<Stream, "id"|"sessionId"> }
  | { c: "writeStream"; streamId: Id; channel: StreamChannel; data: Uint8Array|string }
  | { c: "closeStream"; streamId: Id; summary?: RichText }
  | { c: "defineSeries"; series: Omit<MetricSeries, "id"|"sessionId"> }
  | { c: "observe";      point: Omit<MetricPoint, "at"> }
  | { c: "endSeries";    seriesId: Id; summary?: RichText }
  | { c: "appendLog";    log: Omit<Log, "id"|"sessionId"> }
  | { c: "emitDiag";     diag: Omit<Diagnostic, "id"|"sessionId"> }
  | { c: "publishTable"; table: Omit<Table, "id"|"sessionId"> }
  | { c: "addArtifact";  artifact: Omit<Artifact, "id"|"sessionId"> }
  | { c: "publishSummary"; summary: Omit<Summary, "id"|"sessionId"> };

export type Event =
  | { t: "SessionStarted"; at: Millis; session: Session }
  | { t: "SessionEnded";   at: Millis; sessionId: Id; ok: boolean }
  | { t: "SectionOpened";  at: Millis; section: Section }
  | { t: "TaskStarted";    at: Millis; task: Task }
  | { t: "TaskProgressed"; at: Millis; taskId: Id; value: number }
  | { t: "TaskMessage";    at: Millis; taskId: Id; message: RichText; level?: Level; persistence?: "ephemeral"|"persistent" }
  | { t: "TaskFinished";   at: Millis; taskId: Id; ok: boolean; result?: RichText; durationMs?: Millis }
  | { t: "ContextPushed";  at: Millis; frame: ContextFrame }
  | { t: "ContextPopped";  at: Millis; kind: ContextFrame["kind"]; id: Id }
  | { t: "StreamOpened";   at: Millis; stream: Stream }
  | { t: "StreamChunk";    at: Millis; streamId: Id; channel: StreamChannel; seq: number; data: Uint8Array|string; eof?: boolean }
  | { t: "StreamClosed";   at: Millis; streamId: Id; summary?: RichText }
  | { t: "MetricSeriesDefined"; at: Millis; series: MetricSeries }
  | { t: "MetricObserved";     at: Millis; point: MetricPoint }
  | { t: "MetricSeriesEnded";  at: Millis; seriesId: Id; summary?: RichText }
  | { t: "LogAppended";    at: Millis; log: Log }
  | { t: "Diagnostic";     at: Millis; diag: Diagnostic }
  | { t: "TablePublished"; at: Millis; table: Table }
  | { t: "ArtifactAdded";  at: Millis; artifact: Artifact }
  | { t: "SummaryReady";   at: Millis; summary: Summary };
