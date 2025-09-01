import { zValidator } from "@hono/zod-validator";
import { createTodoSchema } from "@/lib/hono/schema/todo-schema";
import { createFactory } from "hono/factory";
import { Hono } from "hono";

let todos: Array<{ id: number; title: string }> = [];
let nextId = 1;

const factory = createFactory();

const getTodos = factory.createHandlers((c) => {
  return c.json(todos);
});

const getTodo = factory.createHandlers((c) => {
  const id = Number(c.req.param("id"));
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return c.json({ message: "Todo not found" }, 404);
  }
  return c.json(todo);
});

const createTodo = factory.createHandlers(zValidator("json", createTodoSchema), async (c) => {
  const { title } = c.req.valid("json");
  const newTodo = { id: nextId++, title };
  todos.push(newTodo);
  return c.json(newTodo, 201);
});

const todosRoute = new Hono()
  .get("/", ...getTodos)
  .get("/:id", ...getTodo)
  .post("/", ...createTodo);

export default todosRoute;
