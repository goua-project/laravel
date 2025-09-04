import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  FileText,
  Menu,
  X,
  TrendingUp,
  UserX,
  MessageSquare,
  PieChart,
  Crown,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Utilisateurs', path: '/admin/users' },

  { icon: Store, label: 'Boutiques', path: '/admin/shops' },
  { icon: Package, label: 'Produits', path: '/products' },
  { icon: ShoppingCart, label: 'Commandes', path: '/orders' },
  { icon: BarChart3, label: 'Rapports', path: '/reports' },
  { icon: TrendingUp, label: 'Boutiques Tendance', path: '/trending-shops' },
  { icon: UserX, label: 'Commandes Invitées', path: '/guest-orders' },
  { icon: MessageSquare, label: 'Modération Avis', path: '/reviews' },
  { icon: PieChart, label: 'Analytics Enrichis', path: '/analytics' },
  { icon: Crown, label: 'Abonnements', path: '/subscriptions' },
  { icon: CreditCard, label: 'Transactions', path: '/transactions' },
  { icon: Settings, label: 'Paramètres', path: '/settings' },
  { icon: FileText, label: 'Logs', path: '/logs' },
];

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  return (
    <div className={`bg-[#1C1C1C] text-white transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#FF6A00] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="text-xl font-bold">Gouwadan</span>
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1 rounded-md hover:bg-gray-700 transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
      </div>

      <nav className="mt-8">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-700 ${
                      isActive ? 'bg-[#FF6A00] text-white' : 'text-gray-300'
                    }`
                  }
                >
                  <IconComponent size={20} className="flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3 transition-opacity duration-300">{item.label}</span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};