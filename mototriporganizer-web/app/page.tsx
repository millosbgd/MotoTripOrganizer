'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Ulogovan → redirect na /trips
        router.push('/trips');
      } else {
        // Nije ulogovan → redirect na login
        window.location.href = '/api/auth/login';
      }
    }
  }, [user, isLoading, router]);

  // Dok se proverava autentikacija
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Učitavanje...
          </h1>
        </div>
      </main>
    </div>
  );
}
