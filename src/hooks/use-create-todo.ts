"use client";

import { honoClient } from "@/lib/hono/client/hono-client";
import { useMutation } from "@tanstack/react-query";

export function useCreateTodo() {
  return useMutation({
    mutationFn: async (title: string) => {
      const res = await honoClient.api.todos.$post({ json: { title } });
      return res.json();
    },
  });
}
