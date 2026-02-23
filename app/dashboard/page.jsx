"use client";

import { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import TaskForm from "../components/TaskForm";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import Button from "@mui/material/Button";

export default function Dashboard() {
  const router = useRouter();
  const authState = useSelector((state) => state.auth);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (!authState?.uid) return;

    const tasksRef = collection(db, "tasks");

    let unsub1, unsub2;

    if (authState.role === "admin") {
      unsub1 = onSnapshot(tasksRef, (snapshot) => {
        const liveTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTasks(liveTasks);
      });

      return () => unsub1();
    }

    // 🔹 tasks you created
    const ownerQuery = query(tasksRef, where("ownerId", "==", authState.uid));

    // 🔹 tasks assigned to you
    const assignedQuery = query(
      tasksRef,
      where("assignedTo", "==", authState.uid),
    );

    let ownerTasks = [];
    let assignedTasks = [];

    unsub1 = onSnapshot(ownerQuery, (snapshot) => {
      ownerTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks([...ownerTasks, ...assignedTasks]);
    });

    unsub2 = onSnapshot(assignedQuery, (snapshot) => {
      assignedTasks = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTasks([...ownerTasks, ...assignedTasks]);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [authState.uid, authState.role]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const paginatedTasks = filteredTasks.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">
            Logged in as: {authState.email}
          </p>
          <p className="text-xs text-indigo-400">Role: {authState.role}</p>
        </div>

        <Button variant="contained" color="error" onClick={handleSignOut}>
          Logout
        </Button>
      </div>

      <div className="mt-6">
        <TaskForm
          onCreated={() => {
            fetch(`/api/tasks?uid=${authState.uid}&role=${authState.role}`)
              .then((r) => r.json())
              .then(setTasks);
          }}
        />
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded bg-gray-900 border border-gray-800 w-full md:w-1/2"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded bg-gray-900 border border-gray-800"
        >
          <option value="all">All Status</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div className="mt-8 space-y-4">
        {paginatedTasks.length === 0 ? (
          <p className="text-gray-400">No tasks yet</p>
        ) : (
          paginatedTasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-gray-900 rounded-lg border border-gray-800"
            >
              <h3 className="font-semibold">{task.title}</h3>
              <p className="text-sm text-gray-400">{task.description}</p>
              <p
                className={`text-xs mt-2 ${
                  task.status === "done"
                    ? "text-green-400"
                    : task.status === "in-progress"
                      ? "text-yellow-400"
                      : "text-gray-400"
                }`}
              >
                Status: {task.status}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    fetch("/api/tasks", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: task.id,
                        status: "todo",
                      }),
                    })
                  }
                  className="bg-gray-700 px-3 py-1 rounded text-sm"
                >
                  Todo
                </button>
                <button
                  onClick={() =>
                    fetch("/api/tasks", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: task.id,
                        status: "in-progress",
                      }),
                    })
                  }
                  className="bg-yellow-600 px-3 py-1 rounded text-sm"
                >
                  In Progress
                </button>

                <button
                  onClick={() =>
                    fetch("/api/tasks", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: task.id, status: "done" }),
                    })
                  }
                  className="bg-green-600 px-3 py-1 rounded text-sm"
                >
                  Done
                </button>

                <button
                  onClick={() =>
                    fetch("/api/tasks", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ id: task.id }),
                    })
                  }
                  className="bg-red-600 px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 bg-gray-800 rounded"
          >
            Prev
          </button>

          <button
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 bg-gray-800 rounded"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
