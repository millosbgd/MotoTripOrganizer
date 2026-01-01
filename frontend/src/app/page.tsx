export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="text-center text-white p-8">
        <h1 className="text-6xl font-bold mb-4">🏍️ Moto Trip Organizer</h1>
        <p className="text-2xl mb-8">Plan your perfect motorcycle adventure</p>
        
        <div className="space-x-4">
          <a
            href="/api/auth/login"
            className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/api/auth/login?screen_hint=signup"
            className="inline-block bg-primary-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-900 transition-colors border-2 border-white"
          >
            Sign Up
          </a>
        </div>
        
        <div className="mt-16 text-primary-100">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl mb-2">🗺️</div>
              <h3 className="font-semibold mb-2">Plan Routes</h3>
              <p className="text-sm">Organize trips with stages and waypoints</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl mb-2">👥</div>
              <h3 className="font-semibold mb-2">Collaborate</h3>
              <p className="text-sm">Share trips with your riding buddies</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="font-semibold mb-2">Track Expenses</h3>
              <p className="text-sm">Split costs and manage trip budgets</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
