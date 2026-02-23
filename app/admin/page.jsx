"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { set } from "react-hook-form";

export default function AdminPage() {
  const router = useRouter();
  const auth = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // protect route
  useEffect(() => {
    if (!auth.uid) return;
    if (auth.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [auth, router]);

  // realtime users
  useEffect(() => {
    const usersRef = collection(db, "users");
    const tasksRef = collection(db, "tasks");

    let usersData = [];
    let tasksData = [];

    const unsubUsers = onSnapshot(usersRef, (snap) => {
      usersData = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));

      setUsers(usersData);
      computeStats(usersData, tasksData);
    });

    const unsubTasks = onSnapshot(tasksRef, (snap) => {
      const t = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      tasksData = t;
      setTasks(t); // store globally
      computeStats(usersData, tasksData);
    });

    function computeStats(users, tasks) {
      const totalUsers = users.length;
      const totalTasks = tasks.length;

      const statusCounts = {
        todo: 0,
        "in-progress": 0,
        done: 0,
      };

      tasks.forEach((t) => {
        statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
      });

      const tasksPerUser = users.map((u) => ({
        email: u.email,
        count: tasks.filter((t) => t.ownerId === u.uid).length,
      }));

      setStats({
        totalUsers,
        totalTasks,
        statusCounts,
        tasksPerUser,
      });
    }

    return () => {
      unsubUsers();
      unsubTasks();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Panel — Users</h1>

      {stats && (
        <div className="mb-8 grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>

          <div className="p-4 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Total Tasks</p>
            <p className="text-2xl font-bold">{stats.totalTasks}</p>
          </div>

          <div className="p-4 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Todo</p>
            <p className="text-xl">{stats.statusCounts.todo}</p>
          </div>

          <div className="p-4 bg-gray-900 rounded-lg">
            <p className="text-gray-400 text-sm">Done</p>
            <p className="text-xl">{stats.statusCounts.done}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-300 text-sm">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">UID</th>
              <th className="p-3">Tasks</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr
                key={u.uid}
                className="border-t border-gray-800 hover:bg-gray-800/40"
              >
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3 text-xs text-gray-400">{u.uid}</td>
                <td className="p-3">
                  <button
                    onClick={() => setSelectedUser(u)}
                    className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-500 rounded"
                  >
                    View Tasks
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
  <div className="fixed inset-0 bg-black/60 flex justify-end z-50">
    <div className="w-full md:w-[420px] h-full bg-gray-950 border-l border-gray-800 p-6 overflow-y-auto">

      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">{selectedUser.email}</h2>
          <p className="text-sm text-gray-400 capitalize">
            Role: {selectedUser.role}
          </p>
        </div>

        <button
          onClick={() => setSelectedUser(null)}
          className="text-gray-400 hover:text-white text-sm"
        >
          Close ✕
        </button>
      </div>

      {/* tasks */}
      <div className="space-y-3">
        {tasks.filter(t => t.ownerId === selectedUser.uid).length === 0 ? (
          <p className="text-gray-500 text-sm">No tasks created by this user</p>
        ) : (
          tasks
            .filter(t => t.ownerId === selectedUser.uid)
            .map(t => (
              <div
                key={t.id}
                className="p-4 bg-gray-900 rounded-lg border border-gray-800"
              >
                <p className="font-medium">{t.title}</p>

                <p className="text-sm text-gray-400">
                  {t.description}
                </p>

                <p
                  className={`text-xs mt-2 ${
                    t.status === "done"
                      ? "text-green-400"
                      : t.status === "in-progress"
                      ? "text-yellow-400"
                      : "text-gray-400"
                  }`}
                >
                  {t.status}
                </p>
              </div>
            ))
        )}
      </div>
    </div>
  </div>
)}
    </div>
  );
}
