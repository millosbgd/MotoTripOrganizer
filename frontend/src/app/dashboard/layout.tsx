'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [isBootstrapping, setIsBootstrapping] = useState(false);
  const [isBootstrapped, setIsBootstrapped] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const checkBootstrap = async () => {
      if (!user) return;

      try {
        await userApi.getCurrentUser();
        setIsBootstrapped(true);
      } catch (error: any) {
        if (error.response?.status === 404) {
          // User needs bootstrap
          await handleBootstrap();
        } else {
          console.error('Error checking user:', error);
          toast.error('Failed to load user data');
        }
      }
    };

    checkBootstrap();
  }, [user]);

  const handleBootstrap = async () => {
    if (!user) return;

    setIsBootstrapping(true);
    try {
      await userApi.bootstrap({
        displayName: user.name || user.email || 'Unknown',
      });
      setIsBootstrapped(true);
      toast.success('Welcome! Your account is ready.');
    } catch (error) {
      console.error('Bootstrap failed:', error);
      toast.error('Failed to initialize account');
    } finally {
      setIsBootstrapping(false);
    }
  };

  if (isLoading || !user || isBootstrapping || !isBootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isBootstrapping ? 'Setting up your account...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <a href="/dashboard" className="flex items-center">
                <span className="text-2xl mr-2">🏍️</span>
                <span className="text-xl font-bold text-primary-600">
                  Moto Trip Organizer
                </span>
              </a>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <a
                  href="/dashboard"
                  className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-primary-500 text-sm font-medium"
                >
                  My Trips
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img
                    src={user.picture || '/default-avatar.png'}
                    alt={user.name || 'User'}
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {user.name}
                  </span>
                </div>
                <a
                  href="/api/auth/logout"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign Out
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
