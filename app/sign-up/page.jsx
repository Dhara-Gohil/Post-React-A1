"use client";
import { useCreateUserWithEmailAndPassword , useAuthState} from "react-firebase-hooks/auth";
import { useState } from "react";
import { auth } from "../firebase/config";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation"; 
import {doc , setDoc} from "firebase/firestore";
import {db} from "../firebase/config";

export default function Signup() {
  const router = useRouter();
  const [sessionUser, sessionLoading, sessionError] = useAuthState(auth);
  
useEffect(() => {
  if (!sessionLoading && sessionUser) {
    router.push("/dashboard");
  }
}, [sessionUser, sessionLoading, router]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const [createUserWithEmailAndPassword, user, loading, firebaseError] =
    useCreateUserWithEmailAndPassword(auth);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password || !form.confirmPassword) {
      return setError("All fields are required");
    }

    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    if (form.password !== form.confirmPassword) {
      return setError("Passwords do not match");
    }

    setError("");

    // 🔥 THIS is what actually creates the Firebase user
    const result = await createUserWithEmailAndPassword(
      form.email,
      form.password,
    );

    if (result?.user) {
      const newUser = result.user;
      // Create a Firestore document for the new user
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: form.email,
        role:"user",
        createdAt: new Date(),
      });

      setForm({
        email: "",
        password: "",
        confirmPassword: "",
      });
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white px-4">
      <div className="w-full max-w-md bg-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-800">
        <h2 className="text-3xl font-bold text-center mb-6 tracking-tight">
          Create Account
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
            Account created successfully!
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

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium"
            >
              Login instead
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
