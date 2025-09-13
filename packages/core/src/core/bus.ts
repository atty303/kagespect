import type { Event } from "./events.ts";

export type UiEventSink = { emit(ev: Event): void | Promise<void> };

export type UiEventBus = {
  publish(ev: Event): Promise<void>;
  on(sink: UiEventSink): void;
  off(sink: UiEventSink): void;
};

export const createBus = (): UiEventBus => {
  const sinks = new Set<UiEventSink>();
  return {
    async publish(ev) {
      for (const s of sinks) {
        try { await s.emit(ev); } catch { /* isolate sink errors */ }
      }
    },
    on: (s) => void sinks.add(s),
    off: (s) => void sinks.delete(s),
  };
};
