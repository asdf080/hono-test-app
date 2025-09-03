export let todos: Array<{ id: number; title: string; completed: boolean }> = [];
export let nextId = 1;

export const getTodosHandler = async (c) => {
  const todoList = todos;
  return c.json(todoList);
};

export const getTodoHandler = async (c) => {
  const { id } = c.req.param();
  const todo = todos.find((t) => t.id === Number(id));
  if (!todo) {
    return c.json({ message: "Todo not found" }, 404);
  }
  return c.json(todo);
};

export const createTodoHandler = async (c) => {
  const { title } = c.req.valid("json");
  const newTodo = { id: nextId++, title, completed: false };
  todos.push(newTodo);
  return c.json(newTodo, 201);
};

export const updateTodoHandler = async (c) => {
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
};

export const deleteTodoHandler = async (c) => {
  const { id } = c.req.param();
  const index = todos.findIndex((t) => t.id === Number(id));
  if (index === -1) {
    return c.json({ message: "Todo not found" }, 404);
  }
  todos.splice(index, 1);
  return c.json({ message: "Todo deleted" });
};
