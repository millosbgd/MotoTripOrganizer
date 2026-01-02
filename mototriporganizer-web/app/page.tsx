'use client';

import { useEffect, useState } from 'react';

interface User {
  name?: string;
  email?: string;
  picture?: string;
  sub?: string;
}

export default function Home() {
  const [message, setMessage] = useState('Loading...');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch API test message
    fetch('/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(() => setMessage('Error loading'));

    // Fetch user session
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            MotoTrip Organizer
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {message}
          </p>
          <p className="text-sm text-zinc-500">
            🎉 Deployed on Vercel - Next.js working perfectly!
          </p>

          <div className="mt-8 flex flex-col gap-4 w-full">
            {loading ? (
              <p className="text-sm text-zinc-500">Checking authentication...</p>
            ) : user ? (
              <div className="flex flex-col gap-4 p-6 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
                <div className="flex items-center gap-4">
                  {user.picture && (
                    <img 
                      src={user.picture} 
                      alt={user.name || 'User'} 
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-black dark:text-zinc-50">
                      {user.name}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href="/trips"
                    className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  >
                    🏍️ Moji Trip-ovi
                  </a>
                  <a
                    href="/api/auth/logout"
                    className="inline-flex items-center justify-center rounded-md border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-black dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Logout
                  </a>
                </div>
              </div>
            ) : (
              <a
                href="/api/auth/login"
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
