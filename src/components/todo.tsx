"use client";
import { useCreateTodo } from "@/hooks/use-create-todo";
import { useDeleteTodo } from "@/hooks/use-delete-todo";
import { useGetTodoList } from "@/hooks/use-get-todo";
import { useUpdateTodo } from "@/hooks/use-update-todo";
import { useState } from "react";

export default function Todo() {
  const [text, setText] = useState("");
  const { data, isLoading, refetch } = useGetTodoList();
  const { mutate, isPending } = useCreateTodo();
  const { mutate: updateTodo } = useUpdateTodo();
  const { mutate: deleteTodo } = useDeleteTodo();

  const onSuccess = () => {
    refetch();
    setText("");
  };

  const handleAdd = () => {
    if (text.trim()) {
      mutate(text, {
        onSuccess,
        onError: (error) => {
          console.error("Error adding todo:", error);
        },
      });
    }
  };

  const handleEdit = (id: number) => {
    updateTodo(`${id}`, {
      onSuccess,
      onError: (error) => {
        console.error("Error updating todo:", error);
      },
    });
  };
  const handleDelete = (id: number) => {
    deleteTodo(`${id}`, {
      onSuccess,
      onError: (error) => {
        console.error("Error deleting todo:", error);
      },
    });
  };

  return (
    <section>
      <div className="flex">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
        <button onClick={handleAdd} disabled={isPending}>
          {isPending ? "Adding..." : "Add Todo"}
        </button>
      </div>
      <ul>
        {isLoading && <li>Loading...</li>}
        {data &&
          data.map((todo) => {
            const { completed, id, title } = todo;
            return (
              <li key={id}>
                {title}
                <div className="flex">
                  <button onClick={() => handleEdit(id)} disabled={completed}>
                    {completed ? "Completed" : "unCompleted"}
                  </button>
                  <button onClick={() => handleDelete(id)}>Delete</button>
                </div>
              </li>
            );
          })}
      </ul>
    </section>
  );
}
