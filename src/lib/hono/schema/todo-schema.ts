import { z } from "@hono/zod-openapi";

export const TodoSchema = z
  .object({
    id: z.number(),
    title: z.string().openapi({ example: "Sample Todo" }),
    completed: z.boolean().default(false),
  })
  .openapi("Todo");

export const GetTodoParamsSchema = z
  .object({
    id: z.number(),
  })
  .openapi("GetTodoParams");

export const CreateTodoSchema = z
  .object({
    title: z.string().openapi({ example: "Sample Todo" }),
  })
  .openapi("CreateTodo");

export const UpdateTodoSchema = z
  .object({
    title: z.string().optional().openapi({ example: "Updated Todo Title" }),
    completed: z.boolean().optional(),
  })
  .openapi("UpdateTodo");
