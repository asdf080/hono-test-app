# Next.js + Hono 사용법

## Step 1: 패키지 설치

```bash
pnpm add hono @hono/zod-validator zod
```

## Step 2: 기본 Hono 앱 생성

`app/api/[...route]/route.ts` 파일 생성:

```typescript
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => {
  return c.json({ message: "Hello Hono!" });
});

const handler = handle(app);
export { handler as GET };
```

**테스트**: `localhost:3000/api/hello` 접속

## Step 3: 경로 매개변수와 POST 요청 처리

```typescript
// GET /api/todos/:id
app.get("/todos/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id, message: `Todo ${id}` });
});

// POST 요청 처리
app.post("/todos", async (c) => {
  const body = await c.req.json();
  return c.json({ received: body });
});

// export에 POST 추가
export { handler as GET, handler as POST };
```

**테스트**:

- GET: `localhost:3000/api/todos/123`
- POST: `curl -X POST localhost:3000/api/todos -H "Content-Type: application/json" -d '{"title":"테스트"}'`

## Step 4: 메모리 저장소와 실제 데이터 처리

```typescript
// 메모리 저장소
let todos: Array<{ id: number; title: string; completed: boolean }> = [];
let nextId = 1;

app.post("/todos", async (c) => {
  const { title } = await c.req.json();

  const todo = {
    id: nextId++,
    title,
    completed: false,
  };

  todos.push(todo);
  return c.json({ todo }, 201);
});

app.get("/todos", (c) => {
  return c.json({ todos });
});
```

## Step 5: 개별 조회와 에러 처리

```typescript
app.get("/todos/:id", (c) => {
  const id = Number(c.req.param("id"));
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  return c.json({ todo });
});
```

## Step 6: 미들웨어 생성

`lib/hono/middleware/logger.ts`:

```typescript
import type { Context, Next } from "hono";

export const logger = async (c: Context, next: Next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.url} - ${ms}ms`);
};
```

메인 파일에 적용:

```typescript
import { logger } from "@/lib/hono/middleware/logger";

app.use("*", logger);
```

## Step 7: Zod 검증 스키마

`lib/hono/schemas/todo-schema.ts`:

```typescript
import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export const updateTodoSchema = z.object({
  title: z.string().optional(),
  completed: z.boolean().optional(),
});
```

라우트에 적용:

```typescript
import { zValidator } from "@hono/zod-validator";
import { createTodoSchema } from "@/lib/hono/schemas/todo-schema";

app.post("/todos", zValidator("json", createTodoSchema), async (c) => {
  const { title } = c.req.valid("json"); // 타입 안전!
  // 로직...
});
```

## Step 8: 라우트 분리

이제 API가 복잡해지면서 하나의 파일에서 관리하기 어려워졌습니다. todos 관련 로직을 별도 파일로 분리해보겠습니다.

### 문제: RPC 타입 추론과 라우트 분리의 딜레마

라우트를 분리하면서도 RPC의 타입 추론을 유지하려면 **체이닝**이 필수입니다. 하지만 개별 핸들러 함수를 분리하면서 체이닝을 유지하기 어렵죠.

### 해결책: Factory 패턴 활용

`lib/hono/routes/todos.ts`:

```typescript
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createTodoSchema } from "../schemas/todo-schema";

// 메모리 저장소 (분리된 파일로 이동)
let todos: Array<{ id: number; title: string; completed: boolean }> = [];
let nextId = 1;

const factory = createFactory();

// 개별 핸들러들 - Factory로 깔끔하게 분리
const getTodos = factory.createHandlers((c) => {
  return c.json({ todos });
});

const getTodo = factory.createHandlers((c) => {
  const id = Number(c.req.param("id"));
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  return c.json({ todo });
});

const createTodo = factory.createHandlers(zValidator("json", createTodoSchema), async (c) => {
  const { title } = c.req.valid("json");
  const todo = {
    id: nextId++,
    title,
    completed: false,
  };
  todos.push(todo);
  return c.json({ todo }, 201);
});

// 체이닝으로 타입 추론 보장
const todosRoute = new Hono()
  .get("/", ...getTodos)
  .get("/:id", ...getTodo)
  .post("/", ...createTodo);

export default todosRoute;
```

### 메인 파일 수정

```typescript
// app/api/[...route]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";
import todosRoute from "@/lib/hono/routes/todos";
import { logger } from "@/lib/hono/middleware/logger";

const app = new Hono().basePath("/"); // /api 제거

app.use("*", logger);
const routes = app.route("/todos", todosRoute); // todos 라우트 마운트

const handler = handle(app);
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };

// 중요: app이 아닌 routes를 export
export type AppType = typeof routes;
```

**핵심 변경점:**

1. **todos 로직 완전 분리**: 메인 파일에서 todos 관련 코드 제거
2. **Factory 패턴**: 핸들러 함수별 분리하면서도 체이닝 유지
3. **basePath 조정**: `/api` → `/` (중복 방지)
4. **타입 추론 보장**: `typeof routes` export

## Step 9: RPC 클라이언트 설정

`lib/hono/client/hono-client.ts`:

```typescript
import type { AppType } from "@/app/api/[...route]/route";
import { hc } from "hono/client";

export const honoClient = hc<AppType>("/api");
```

## Step 10: 라우트 분리 심화 (선택사항)

### 왜 라우트를 분리할까?

현재까지는 모든 라우트를 메인 파일에 작성했습니다. 이는 간단한 API에서는 문제없지만, API가 많아질수록 몇 가지 문제점이 생깁니다:

**문제점들:**

- 한 파일이 너무 길어짐
- 도메인별 관리가 어려움
- 팀 협업 시 충돌 위험
- 코드 재사용성 부족

### 현재 사용 중인 메인 파일 방식 (라우트 체이닝)

```typescript
// app/api/[...route]/route.ts - 현재 방식
const app = new Hono().basePath("/");
app.use("*", logger);

// 도메인별 라우트를 체이닝으로 연결
const routes = app
  .route("/todos", todosRoute)
  .route("/users", usersRoute) // 추가된다면
  .route("/posts", postsRoute); // 추가된다면

export type AppType = typeof routes;
```

**이 방식의 특징:**

- 도메인별로 라우트 파일 분리 가능
- RPC 타입 추론을 위한 체이닝 유지
- 새로운 도메인 추가 시 한 줄만 추가하면 됨

### Factory를 사용한 이유

라우트 파일에서 이런 식으로 작성하면 함수가 inline으로 들어가서 분리가 어려웠습니다:

```typescript
// 함수 분리가 어려운 방식
const todosRoute = new Hono()
  .get("/", (c) => {
    // 긴 로직이 여기 들어감
    const todos = getAllTodos();
    return c.json({ todos });
  })
  .post("/", zValidator("json", createTodoSchema), (c) => {
    // 또 긴 로직이 여기 들어감
    const { title } = c.req.valid("json");
    // ...
  });
// 함수들이 계속 inline으로...
```

Factory 패턴을 사용하면 **함수를 깔끔하게 분리**할 수 있습니다:

```typescript
// Factory로 함수 분리
const factory = createFactory();

// 각 핸들러를 별도 함수로 분리
const getTodos = factory.createHandlers((c) => {
  return c.json({ todos });
});

const createTodo = factory.createHandlers(zValidator("json", createTodoSchema), async (c) => {
  const { title } = c.req.valid("json");
  // 로직...
});

// 체이닝에서 스프레드로 사용
const todosRoute = new Hono()
  .get("/", ...getTodos) // 분리된 함수 사용
  .post("/", ...createTodo); // 분리된 함수 사용
```

**Factory 사용 이유:**

- **함수 분리**: inline 핸들러를 별도 함수로 분리 가능
- **재사용성**: 같은 로직을 다른 라우트에서도 사용 가능
- **가독성**: 체이닝 부분이 깔끔해짐
- **유지보수**: 각 핸들러를 독립적으로 관리 가능

### 개선된 방식 (라우트 분리)

#### 1\. todos 라우트 분리

`lib/hono/routes/todos.ts`:

```typescript
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { createTodoSchema } from "../schemas/todo-schema";

// 메모리 저장소
let todos: Array<{ id: number; title: string; completed: boolean }> = [];
let nextId = 1;

const factory = createFactory();

// 개별 핸들러들
const getTodos = factory.createHandlers((c) => {
  return c.json({ todos });
});

const getTodo = factory.createHandlers((c) => {
  const id = Number(c.req.param("id"));
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return c.json({ error: "Todo not found" }, 404);
  }

  return c.json({ todo });
});

const createTodo = factory.createHandlers(zValidator("json", createTodoSchema), async (c) => {
  const { title } = c.req.valid("json");
  const todo = {
    id: nextId++,
    title,
    completed: false,
  };
  todos.push(todo);
  return c.json({ todo }, 201);
});

// 체이닝으로 타입 추론 보장
const todosRoute = new Hono()
  .get("/", ...getTodos)
  .get("/:id", ...getTodo)
  .post("/", ...createTodo);

export default todosRoute;
```

#### 2\. 메인 파일 정리

```typescript
// app/api/[...route]/route.ts - 개선된 방식
import { Hono } from "hono";
import { handle } from "hono/vercel";
import todosRoute from "@/lib/hono/routes/todos";
import { logger } from "@/lib/hono/middleware/logger";

const app = new Hono().basePath("/");

app.use("*", logger);
const routes = app.route("/todos", todosRoute);

const handler = handle(app);
export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };

// RPC를 위한 타입 export
export type AppType = typeof routes;
```

### 주요 변경점

1. **basePath 변경**: `/api` → `/` (중복 방지)
2. **타입 export**: `typeof app` → `typeof routes`
3. **Factory 패턴**: 핸들러를 깔끔하게 분리
4. **체이닝 유지**: RPC 타입 추론을 위해

### 장점

- **모듈화**: 도메인별 파일 분리
- **재사용성**: Factory로 핸들러 재사용 가능
- **협업**: 팀원별로 다른 라우트 작업 가능
- **유지보수**: 각 도메인 로직을 독립적으로 관리

<br>
```

## 핵심 포인트

### 1. basePath vs hc 매개변수

```typescript
// 서버
const app = new Hono().basePath("/"); // 루트 경로
// 클라이언트
const client = hc<AppType>("/api"); // API 경로

// 결과: /api/todos ✅
```

### 2\. 타입 추론을 위한 체이닝

```typescript
// ❌ 타입 추론 안됨
const app = new Hono();
app.get("/", handler);
app.post("/", handler);

// ✅ 타입 추론 됨
const app = new Hono().get("/", handler).post("/", handler);
```

### 3\. RPC 타입 추론 핵심

```typescript
// 라우트가 마운트된 결과를 export
const routes = app.route("/todos", todosRoute);
export type AppType = typeof routes; // app이 아닌 routes!
```

### 4\. Zod Validator 옵션

```typescript
zValidator("json", schema); // JSON body 검증
zValidator("query", schema); // 쿼리 파라미터 검증
zValidator("param", schema); // 경로 파라미터 검증
zValidator("header", schema); // 헤더 검증
```

### 5\. Factory 패턴 활용

```typescript
const factory = createFactory();

// 미들웨어 + 핸들러를 배열로 반환
const handlers = factory.createHandlers(middleware1, middleware2, (c) => c.json({ result: "ok" }));

// 스프레드로 사용
app.get("/path", ...handlers);
```

## 최종 파일 구조

```
src/
├── app/
│   └── api/
│       └── [...route]/
│           └── route.ts              # 메인 API 핸들러
├── lib/
│   └── hono/
│       ├── client/
│       │   └── hono-client.ts        # RPC 클라이언트
│       ├── middleware/
│       │   └── logger.ts             # 미들웨어
│       ├── routes/
│       │   └── todos.ts              # 라우트별 핸들러
│       └── schemas/
│           └── todo-schema.ts        # Zod 스키마
```
