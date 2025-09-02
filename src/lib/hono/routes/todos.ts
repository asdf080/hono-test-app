import { zValidator } from "@hono/zod-validator";
import { createTodoSchema, updateTodoSchema } from "@/lib/hono/schema/todo-schema";
import { createFactory } from "hono/factory";
import { Hono } from "hono";

let todos: Array<{ id: number; title: string; completed: boolean }> = [];
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
  const newTodo = { id: nextId++, title, completed: false };
  todos.push(newTodo);
  return c.json(newTodo, 201);
});

const updateTodo = factory.createHandlers(zValidator("json", updateTodoSchema), async (c) => {
  const id = Number(c.req.param("id"));
  const todoIndex = todos.findIndex((t) => t.id === id);
  if (todoIndex === -1) {
    return c.json({ message: "Todo not found" }, 404);
  }
  todos[todoIndex].completed = true;

  return c.json(todos[todoIndex]);
});

const deleteTodo = factory.createHandlers((c) => {
  const id = Number(c.req.param("id"));
  const todoIndex = todos.findIndex((t) => t.id === id);
  if (todoIndex === -1) {
    return c.json({ message: "Todo not found" }, 404);
  }
  todos.splice(todoIndex, 1);
  return c.json({ message: "Todo deleted" });
});

const todosRoute = new Hono()
  .get("/", ...getTodos)
  .get("/:id", ...getTodo)
  .post("/", ...createTodo)
  .put("/:id", ...updateTodo)
  .delete("/:id", ...deleteTodo);

export default todosRoute;
