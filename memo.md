# Next.js + Zod OpenAPI Hono

## Zod OpenAPI Hono

- OpenAPI를 지원하는 Hono 확장판
- zod를 사용한 유효성 검사 지원
- Swagger 문서 자동 생성 지원

## 사용법

### 설치

```bash
npm i hono zod @hono/zod-openapi
```

### 스키마 설정

```typescript
// src/lib/hono/schema/todo-schema.ts
import { z } from "@hono/zod-openapi";

export const TodoSchema = z
  .object({
    id: z.number(),
    title: z.string().openapi({ example: "Sample Todo" }),
    completed: z.boolean().default(false),
  })
  .openapi("Todo");
```

.openapi("name")가 있어야 Swagger 문서에서 Schema를 확인할 수 있다.

### 라우트 설정

라우트 경로, 메서드, 요청/응답 스키마 등을 설정한다.

```typescript
// src/lib/hono/routes/todo.ts
import { createRoute } from "@hono/zod-openapi";
import { TodoSchema } from "@/lib/hono/schema/todo-schema";

export const getTodos = createRoute({
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

export const createTodo = createRoute({
  // 생략
});

export const todosRoute = new OpenAPIHono().openapi(getTodos, async (c) => {
  const todoList = todos;
  return c.json(todoList);
});
.openapi(createTodo, async (c) => {
  //생략
})
```

openapi의 매개변수

- 첫번째: 라우트 정의
- 두번째: 실제 비즈니스 로직을 처리하는 핸들러

설정한 라우트를 hono에 적용한다.

```typescript
// src/app/api/[...route]/route.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { todosRoute } from "@/lib/hono/routes/todos";

const app = new OpenAPIHono().basePath("/api");

const routes = app.route("/todos", todosRoute);

const handler = handle(app);
export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
export type AppType = typeof routes;
```

### API 명세서 생성

라우트 파일에 문서생성 코드 추가

```typescript
// src/app/api/[...route]/route.ts
app.doc("/doc-json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});
app.get("/doc", swaggerUI({ url: "/api/doc-json" }));
```
