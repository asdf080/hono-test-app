"use client";
import { useCreateTodo } from "@/hooks/use-create-todo";
import { useGetTodoList } from "@/hooks/use-get-todo";
import { useState } from "react";

export default function Todo() {
  const [text, setText] = useState("");
  const { data, isLoading, refetch } = useGetTodoList();
  const { mutate, isPending } = useCreateTodo();

  const handleAdd = () => {
    if (text.trim()) {
      mutate(text, {
        onSuccess: () => {
          refetch();
          setText("");
        },
        onError: (error) => {
          console.error("Error adding todo:", error);
        },
      });
    }
  };

  return (
    <div>
      <div className="flex">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={handleAdd} disabled={isPending}>
          {isPending ? "Adding..." : "Add Todo"}
        </button>
      </div>
      <ul>
        {isLoading && <li>Loading...</li>}
        {data && data.map((todo) => <li key={todo.id}>{todo.title}</li>)}
      </ul>
    </div>
  );
}
