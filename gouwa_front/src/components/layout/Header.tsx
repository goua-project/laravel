import React from 'react';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContextAdmin';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
      <div className="flex items-center flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6A00] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            3
          </span>
        </button>

        <div className="flex items-center space-x-3">
          <img
            src={user?.avatar}
            alt="Avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-gray-500">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};