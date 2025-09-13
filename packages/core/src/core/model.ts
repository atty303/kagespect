import { createBus, type UiEventBus, type UiEventSink } from "./bus.ts";
import { initialState, type UiState } from "./state.ts";
import { now, type Millis, type Id, type Session, type Section, type Task, type Log, type Diagnostic, type Summary, type Stream, type MetricSeries, type MetricPoint, type RichText } from "./types.ts";
import type { Event, Command } from "./events.ts";

export type Clock = { now(): Millis };
export type IdGen = { gen(): Id };
export type UiModel = {
  dispatch(cmd: Command): Promise<void> | void;
  on(sink: UiEventSink): void; off(sink: UiEventSink): void;
  state(): Readonly<UiState>;
};

export const createModel = (
  bus: UiEventBus = createBus(),
  clock: Clock = { now },
  idg: IdGen = { gen: () => crypto.randomUUID() as Id },
): UiModel => {
  const s = initialState();
  const emit = (ev: Event) => bus.publish(ev);
  const at = () => clock.now();
  const ensureSession = () => { if (!s.session) throw new Error("session not started"); };

  return {
    async dispatch(cmd) {
      switch (cmd.c) {
        case "beginSession": {
          const session: Session = { id: idg.gen(), startedAt: at(), meta: cmd.session?.meta };
          s.session = session; await emit({ t: "SessionStarted", at: at(), session });
          break;
        }
        case "endSession": {
          if (!s.session) return; await emit({ t: "SessionEnded", at: at(), sessionId: s.session.id, ok: cmd.ok });
          break;
        }
        case "openSection": {
          ensureSession(); const section: Section = { id: idg.gen(), sessionId: s.session!.id, ...cmd.section };
          s.sections.push(section); await emit({ t: "SectionOpened", at: at(), section });
          break;
        }
        case "startTask": {
          ensureSession(); const task: Task = { id: idg.gen(), sessionId: s.session!.id, ...cmd.task };
          s.tasks[task.id] = { def: task, startedAt: at(), messages: [] };
          await emit({ t: "TaskStarted", at: at(), task });
          break;
        }
        case "progress": {
          const t = s.tasks[cmd.taskId]; if (!t) break; t.progress = cmd.value;
          await emit({ t: "TaskProgressed", at: at(), taskId: cmd.taskId, value: cmd.value });
          break;
        }
        case "taskMsg": {
          const t = s.tasks[cmd.taskId]; if (!t) break;
          const level = cmd.level ?? "info"; const persistence = cmd.persistence ?? "persistent";
          t.messages.push({ at: at(), level, text: cmd.message, persistence });
          await emit({ t: "TaskMessage", at: at(), taskId: cmd.taskId, message: cmd.message, level, persistence });
          break;
        }
        case "finishTask": {
          const t = s.tasks[cmd.taskId]; if (!t) break; const end = at();
          const durationMs = t.startedAt ? (end - t.startedAt) as Millis : undefined;
          t.finished = { ok: cmd.ok, at: end, durationMs, result: cmd.result };
          await emit({ t: "TaskFinished", at: end, taskId: cmd.taskId, ok: cmd.ok, durationMs, result: cmd.result });
          break;
        }
        case "pushContext": {
          s.contextStack.push(cmd.frame); await emit({ t: "ContextPushed", at: at(), frame: cmd.frame });
          break;
        }
        case "popContext": {
          const idx = s.contextStack.findLastIndex((f) => f.kind === cmd.kind && f.id === cmd.id);
          if (idx >= 0) s.contextStack.splice(idx, 1);
          await emit({ t: "ContextPopped", at: at(), kind: cmd.kind, id: cmd.id });
          break;
        }
        case "openStream": {
          ensureSession(); const stream: Stream = { id: idg.gen(), sessionId: s.session!.id, ...cmd.stream };
          s.streams[stream.id] = { def: stream, seq: 0, open: true };
          await emit({ t: "StreamOpened", at: at(), stream });
          break;
        }
        case "writeStream": {
          const st = s.streams[cmd.streamId]; if (!st || !st.open) break;
          const seq = ++st.seq; await emit({ t: "StreamChunk", at: at(), streamId: cmd.streamId, channel: cmd.channel, seq, data: cmd.data });
          break;
        }
        case "closeStream": {
          const st = s.streams[cmd.streamId]; if (!st) break; st.open = false;
          await emit({ t: "StreamClosed", at: at(), streamId: cmd.streamId, summary: cmd.summary });
          break;
        }
        case "defineSeries": {
          ensureSession(); const series: MetricSeries = { id: idg.gen(), sessionId: s.session!.id, ...cmd.series };
          await emit({ t: "MetricSeriesDefined", at: at(), series });
          break;
        }
        case "observe": {
          const point: MetricPoint = { ...cmd.point, at: at() } as MetricPoint;
          await emit({ t: "MetricObserved", at: point.at, point });
          break;
        }
        case "endSeries": {
          await emit({ t: "MetricSeriesEnded", at: at(), seriesId: cmd.seriesId, summary: cmd.summary });
          break;
        }
        case "appendLog": {
          ensureSession(); const log: Log = { id: idg.gen(), sessionId: s.session!.id, level: cmd.log.level, message: cmd.log.message, context: cmd.log.context, persistence: cmd.log.persistence ?? "persistent" };
          s.logs.push(log); await emit({ t: "LogAppended", at: at(), log });
          break;
        }
        case "emitDiag": {
          ensureSession(); const diag: Diagnostic = { id: idg.gen(), sessionId: s.session!.id, ...cmd.diag };
          s.diags.push(diag); await emit({ t: "Diagnostic", at: at(), diag });
          break;
        }
        case "publishTable": {
          ensureSession(); const table: Table = { id: idg.gen(), sessionId: s.session!.id, ...cmd.table };
          s.tables.push(table); await emit({ t: "TablePublished", at: at(), table });
          break;
        }
        case "addArtifact": {
          ensureSession(); const artifact: Artifact = { id: idg.gen(), sessionId: s.session!.id, ...cmd.artifact };
          s.artifacts.push(artifact); await emit({ t: "ArtifactAdded", at: at(), artifact });
          break;
        }
        case "publishSummary": {
          ensureSession(); const summary: Summary = { id: idg.gen(), sessionId: s.session!.id, ...cmd.summary };
          s.summary = summary; await emit({ t: "SummaryReady", at: at(), summary });
          break;
        }
      }
    },
    on: (sink) => bus.on(sink),
    off: (sink) => bus.off(sink),
    state: () => s,
  };
};
