'use client';

import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase/config';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) router.replace('/dashboard');
    else router.replace('/login');
  }, [user, loading, router]);

  return <p className="p-6 text-white">Redirecting...</p>;
}