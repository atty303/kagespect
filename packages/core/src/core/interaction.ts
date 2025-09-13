import type { Id, RichText } from "./types.ts";

export type ConfirmSchema = { id: Id; message: RichText; default?: boolean };
export type InputSchema<T> = { id: Id; message: RichText; placeholder?: string; default?: T; validate?: (v: T)=>true|{message:string}; transform?: (v:T)=>T };
export type SelectSchema<T extends string> = { id: Id; message: RichText; options: readonly T[]; default?: T|T[] };
export type FormSchema<T> = { id: Id; title?: string; fields: Record<string, InputSchema<any>|SelectSchema<string>|ConfirmSchema> };

export type InteractionPolicy = { mode: "interactive"|"non-interactive"|"auto"; onMissing: "error"|"skip"|"use-default"; defaults?: Record<string, unknown> | ((key:string)=>unknown) };
export type PromptOpts = { signal?: AbortSignal; timeoutMs?: number; policy?: InteractionPolicy };

export type CliInteractionPort = {
  capabilities(): { interactive: boolean; secureInput: boolean; select: boolean };
  confirm(schema: ConfirmSchema, opts?: PromptOpts): Promise<boolean>;
  input(schema: InputSchema<string>, opts?: PromptOpts): Promise<string>;
  password(schema: InputSchema<string>, opts?: PromptOpts): Promise<string>;
  select(schema: SelectSchema<string>, opts?: PromptOpts): Promise<string>;
  multiSelect(schema: SelectSchema<string>, opts?: PromptOpts): Promise<string[]>;
  form<T>(schema: FormSchema<T>, opts?: PromptOpts): Promise<T>;
};
