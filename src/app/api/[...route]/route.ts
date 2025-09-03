import { logger } from "@/lib/hono/middleware/logger";
import { todosRoute } from "@/lib/hono/routes/todos";
import { OpenAPIHono } from "@hono/zod-openapi";
import { handle } from "hono/vercel";
import { swaggerUI } from "@hono/swagger-ui";

const app = new OpenAPIHono().basePath("/api");

app.use("*", logger);

const routes = app.route("/todos", todosRoute);

app.doc("/doc-json", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "My API",
  },
});
app.get("/doc", swaggerUI({ url: "/api/doc-json" }));

const handler = handle(app);

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };

export type AppType = typeof routes;
