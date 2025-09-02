"use client";

import { honoClient } from "@/lib/hono/client/hono-client";
import { useMutation } from "@tanstack/react-query";

export function useDeleteTodo() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await honoClient.api.todos[":id"].$delete({ param: { id } });
      return res.json();
    },
  });
}
