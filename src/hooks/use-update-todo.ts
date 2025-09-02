"use client";

import { honoClient } from "@/lib/hono/client/hono-client";
import { useMutation } from "@tanstack/react-query";

export function useUpdateTodo() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await honoClient.api.todos[":id"].$put({ json: { completed: true }, param: { id } });
      return res.json();
    },
  });
}
