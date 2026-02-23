'use client';

import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { useState, useEffect } from "react";


export default function TaskForm({ onCreated }) {
  const [users, setUsers] = useState([]);

  const { register, handleSubmit, reset } = useForm();
  const authState = useSelector((state) => state.auth);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  const onSubmit = async (data) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        ownerId: authState.uid,
      }),
    });

    if (res.ok) {
      reset();
      onCreated(); // refetch tasks
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 p-4 bg-gray-900 rounded-lg border border-gray-800"
    >
      <input
        {...register("title", { required: true, minLength: 3 })}
        placeholder="Task title"
        className="w-full p-2 bg-gray-800 rounded"
      />
      <select
        {...register("assignedTo")}
        className="w-full p-2 bg-gray-800 rounded"
      >
        <option value="">Assign to (optional)</option>
        {users.map((u) => (
          <option key={u.uid} value={u.uid}>
            {u.email}
          </option>
        ))}
      </select>

      <textarea
        {...register("description", { required: true })}
        placeholder="Task description"
        className="w-full p-2 bg-gray-800 rounded"
      />

      <input
        type="date"
        {...register("dueDate", { required: true })}
        className="w-full p-2 bg-gray-800 rounded"
      />

      <button className="bg-indigo-600 px-4 py-2 rounded">Save Task</button>
    </form>
  );
}
