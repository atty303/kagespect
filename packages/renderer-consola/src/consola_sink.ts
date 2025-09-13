import type { UiEventSink } from "kagespect/core/core/bus.ts";
import type { Event } from "kagespect/core/core/events.ts";
// Import consola from npm via Deno's npm specifier
import consola from "npm:consola@3";

export type ConsolaSinkOptions = {
  tag?: string;
  showTimestamps?: boolean;
};

export function createConsolaSink(opts: ConsolaSinkOptions = {}): UiEventSink {
  const logger = opts.tag ? consola.withTag(opts.tag) : consola;
  const ts = () => opts.showTimestamps ? `[${new Date().toISOString()}] ` : "";

  const levelMap: Record<string, (msg: string) => void> = {
    trace: (m) => logger.trace(m),
    debug: (m) => logger.debug(m),
    info:  (m) => logger.info(m),
    warn:  (m) => logger.warn(m),
    error: (m) => logger.error(m),
    fatal: (m) => logger.fatal(m),
  };

  const print = (lvl: keyof typeof levelMap, msg: string) => levelMap[lvl](`${ts()}${msg}`);

  return {
    emit(ev: Event) {
      switch (ev.t) {
        case "SectionOpened":
          print("info", `§ ${ev.section.title}`);
          break;
        case "TaskStarted":
          print("info", `▶ ${ev.task.name}`);
          break;
        case "TaskProgressed":
          print("debug", `… ${ev.taskId} ${ev.value}`);
          break;
        case "TaskFinished":
          print(ev.ok ? "info" : "error", `■ ${ev.taskId} ${ev.ok ? "OK" : "FAIL"}${ev.durationMs ? ` (${ev.durationMs}ms)` : ""}`);
          break;
        case "TaskMessage": {
          const lvl = (ev.level ?? "info") as keyof typeof levelMap;
          const txt = typeof ev.message === "string" ? ev.message : ev.message.text;
          print(lvl, `• ${txt}`);
          break;
        }
        case "LogAppended": {
          const lvl = (ev.log.level ?? "info") as keyof typeof levelMap;
          const txt = typeof ev.log.message === "string" ? ev.log.message : ev.log.message.text;
          print(lvl, txt);
          break;
        }
        case "Diagnostic": {
          const txt = typeof ev.diag.message === "string" ? ev.diag.message : ev.diag.message.text;
          print("warn", `! ${txt}`);
          break;
        }
        case "SummaryReady": {
          const items = Object.entries(ev.summary.items).map(([k,v]) => `${k}=${v}`).join(" ");
          print("info", `Σ ${items}`);
          break;
        }
        default:
          // ignore other events in minimal sink
          break;
      }
    }
  };
}
