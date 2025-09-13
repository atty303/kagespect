import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { createBus } from "kagespect/core/core/bus.ts";
import { createModel } from "kagespect/core/core/model.ts";
import { createConsolaSink } from "../src/consola_sink.ts";

Deno.test("renderer-consola hooks into bus", async () => {
  const bus = createBus();
  // Attach the sink; consola will write to stdout; here we just ensure no throw.
  bus.on(createConsolaSink({ tag: "kagespect" }));

  const m = createModel(bus, { now: () => 1000 as any }, { gen: () => "id" as any });
  await m.dispatch({ c: "beginSession" });
  await m.dispatch({ c: "openSection", section: { title: "Build" } });
  await m.dispatch({ c: "startTask", task: { name: "Compile", total: 1 } });
  const taskId = Object.keys(m.state().tasks)[0] as any;
  await m.dispatch({ c: "taskMsg", taskId, message: "chunk #1", level: "info" });
  await m.dispatch({ c: "finishTask", taskId, ok: true, result: "OK" });
  await m.dispatch({ c: "publishSummary", summary: { items: { status: "ok" } } });
  await m.dispatch({ c: "endSession", ok: true });

  assertEquals(typeof m.state, "function");
});
