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
      tasksData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
