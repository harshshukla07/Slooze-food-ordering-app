'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-gray-700">
            <Link href="/" className="text-gray-800 hover:text-gray-700">
              Slooze Foods
            </Link>
          </div>
          <div className="flex items-center">
            {user ? (
              // If user is logged in
              <div className="flex items-center space-x-4">
                <Link href="/cart" className="text-gray-600 hover:text-gray-800">
                  Cart
                </Link>
                <Link href="/orders" className="text-gray-600 hover:text-gray-800">
                  My Orders
                </Link>
                <div className="text-right">
                  <Link href="/profile" className="hover:text-indigo-600">
                    <p className="font-semibold text-gray-800">{user.name}</p>
                  </Link>
                  <p className="text-xs text-gray-600 capitalize">{user.role.toLowerCase()} - {user.country}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Logout
                </button>
              </div>
            ) : (
              // If user is logged out
              <Link href="/login">
                <span className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
                  Login
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}