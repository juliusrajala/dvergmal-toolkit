import { z } from "zod";

export const FieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  input: z.enum(["text", "number"]),
});

export const GroupSchema = z.object({
  id: z.string(),
  label: z.string(),
  fields: z.array(FieldSchema),
});

export const SheetSchema = z.object({
  title: z.string(),
  system: z.string(),
  groups: z.array(GroupSchema),
});

export type Sheet = z.infer<typeof SheetSchema>;
