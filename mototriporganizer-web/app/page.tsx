'use client';

import { useEffect, useState } from 'react';

interface UserInfo {
  name: string;
  email: string;
  picture?: string;
}

export default function Home() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            MotoTrip Organizer
          </h1>
          {user ? (
            <>
              <div className="flex items-center gap-4">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    Welcome, {user.name}!
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {user.email}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <a
                  href="/api/auth/logout"
                  className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  Logout
                </a>
              </div>
            </>
          ) : (
            <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Welcome to MotoTrip Organizer!
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
