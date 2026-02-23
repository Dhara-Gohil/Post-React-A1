'use client';

import { useEffect } from "react";
import { auth } from "./firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase/config";
import { useDispatch } from "react-redux";
import { setUser, clearUser } from "./store/authSlice";

export default function AuthProvider({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        dispatch(clearUser());
        return;
      }

      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const profile = snap.data();

        dispatch(setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: profile.role,
        }));
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return children;
}