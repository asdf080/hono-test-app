import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { TodoSchema, CreateTodoSchema, UpdateTodoSchema } from "@/lib/hono/schema/todo-schema";
import { getTodosHandler } from "@/lib/hono/handlers/todos";

export let todos: Array<{ id: number; title: string; completed: boolean }> = [];
export let nextId = 1;

const getTodos = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.array(TodoSchema),
        },
      },
      description: "todo list",
    },
    404: { description: "Not found" },
  },
});

const getTodo = createRoute({
  method: "get",
  path: "/:id",
  responses: {
    200: {
      description: "A single todo",
      content: {
        "application/json": {
          schema: TodoSchema,
        },
      },
    },
    404: {
      description: "Todo not found",
    },
  },
});

const createTodo = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "application/json": { schema: CreateTodoSchema },
      },
    },
  },
  responses: {
    201: {
      description: "Todo created",
      content: {
        "application/json": {
          schema: TodoSchema,
        },
      },
    },
  },
});

const updateTodo = createRoute({
  method: "put",
  path: "/:id",
  request: {
    body: {
      content: {
        "application/json": { schema: UpdateTodoSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Todo updated",
      content: {
        "application/json": {
          schema: TodoSchema,
        },
      },
    },
    404: {
      description: "Todo not found",
    },
  },
});

const deleteTodo = createRoute({
  method: "delete",
  path: "/:id",
  responses: {
    204: {
      description: "Todo deleted",
    },
    404: {
      description: "Todo not found",
    },
  },
});

export const todosRoute = new OpenAPIHono()
  .openapi(getTodos, async (c) => {
    const todoList = todos;
    return c.json(todoList);
  })
  .openapi(getTodo, async (c) => {
    const { id } = c.req.param();
    const todo = todos.find((t) => t.id === Number(id));
    if (!todo) {
      return c.json({ message: "Todo not found" }, 404);
    }
    return c.json(todo);
  })
  .openapi(createTodo, async (c) => {
    const { title } = c.req.valid("json");
    const newTodo = { id: nextId++, title, completed: false };
    todos.push(newTodo);
    return c.json(newTodo, 201);
  })
  .openapi(updateTodo, async (c) => {
    const { id } = c.req.param();
    const { completed, title } = c.req.valid("json");
    const todo = todos.find((t) => t.id === Number(id));
    if (!todo) {
      return c.json({ message: "Todo not found" }, 404);
    }
    if (title) {
      todo.title = title;
    }
    if (completed !== undefined) {
      todo.completed = completed;
    }
    return c.json(todo);
  })
  .openapi(deleteTodo, async (c) => {
    const { id } = c.req.param();
    const index = todos.findIndex((t) => t.id === Number(id));
    if (index === -1) {
      return c.json({ message: "Todo not found" }, 404);
    }
    todos.splice(index, 1);
    return c.json({ message: "Todo deleted" });
  });
