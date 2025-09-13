import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createBus } from "../src/core/bus.ts";
import { createModel } from "../src/core/model.ts";

Deno.test("core: minimal flow", async () => {
  const events: any[] = [];
  const bus = createBus();
  bus.on({ emit: (e) => void events.push(e) });

  const m = createModel(bus, { now: () => 1000 as any }, { gen: () => "id" as any });
  await m.dispatch({ c: "beginSession" });
  await m.dispatch({ c: "endSession", ok: true });

  assertEquals(events.map((e) => e.t), ["SessionStarted", "SessionEnded"]);
});
