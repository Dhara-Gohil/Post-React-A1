"use client";
import {
  useAuthState,
  useSignInWithEmailAndPassword,
} from "react-firebase-hooks/auth";
import { useState, useEffect } from "react";
import { auth } from "../firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useDispatch } from "react-redux";
import { setUser } from "../store/authSlice";

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch();

  const [sessionUser, sessionLoading, sessionError] = useAuthState(auth);

  useEffect(() => {
    if (!sessionLoading && sessionUser) {
      router.push("/dashboard");
    }
  }, [sessionUser, sessionLoading, router]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const [signInWithEmailAndPassword, user, loading, firebaseError] =
    useSignInWithEmailAndPassword(auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return setError("Email and password required");
    }

    setError("");
    await signInWithEmailAndPassword(form.email, form.password);
  };

  

  useEffect(() => {
  const fetchRole = async () => {
    if (!user) return;

    const ref = doc(db, "users", user.user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const profile = snap.data();

      dispatch(
        setUser({
          uid: user.user.uid,
          email: user.user.email,
          role: profile.role,
        })
      );

      router.push("/dashboard");
    }
  };

  fetchRole();
}, [user, router, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-6 tracking-tight">
          Login
        </h2>

        {error && (
          <p className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4">
            {error}
          </p>
        )}

        {firebaseError && (
          <p className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4">
            {firebaseError.message}
          </p>
        )}

        {user && (
          <p className="bg-green-500/10 border border-green-500 text-green-400 text-sm p-3 rounded mb-4">
            Logged in successfully!
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none px-4 py-3 rounded-lg transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none px-4 py-3 rounded-lg transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition font-semibold py-3 rounded-lg shadow-lg shadow-indigo-900/40"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <p className="text-center text-gray-500 text-sm mt-6">
            Don’t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
