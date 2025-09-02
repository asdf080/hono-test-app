import { swaggerUI } from "@hono/swagger-ui";
import type { Hono } from "hono";

const openApiDoc = {
  openapi: "3.0.0",
  info: {
    title: "API Documentation",
    version: "1.0.0",
    description: "API documentation for your service",
  },
  paths: {
    "/todos": {
      get: {
        summary: "Get all todos",
        responses: {
          "200": {
            description: "List of todos",
          },
        },
      },
      post: {
        summary: "Create a todo",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                },
                required: ["title"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Todo created",
          },
        },
      },
    },
    "/todos/{id}": {
      get: {
        summary: "Get a todo by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "A single todo",
          },
          "404": {
            description: "Todo not found",
          },
        },
      },
      put: {
        summary: "Update a todo to completed",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Todo updated",
          },
          "404": {
            description: "Todo not found",
          },
        },
      },
      delete: {
        summary: "Delete a todo",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": {
            description: "Todo deleted",
          },
          "404": {
            description: "Todo not found",
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Hono) => {
  app.get("/doc", (c) => c.json(openApiDoc));
  app.get("/ui", swaggerUI({ url: "/api/doc" }));
};
