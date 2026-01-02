export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            MotoTrip Organizer
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Plan and organize your motorcycle adventures!
          </p>
          <div className="flex gap-4">
            <a
              href="/api/auth/login"
              className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 font-medium"
            >
              Get Started
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
