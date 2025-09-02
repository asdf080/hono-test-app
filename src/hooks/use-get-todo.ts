"use client";
import { useQuery } from "@tanstack/react-query";
import { honoClient } from "@/lib/hono/client/hono-client";

export function useGetTodoList() {
  return useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await honoClient.api.todos.$get();
      return res.json();
    },
  });
}
