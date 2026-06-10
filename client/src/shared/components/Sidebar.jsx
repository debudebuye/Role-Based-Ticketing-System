import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Ticket, 
  Users, 
  Plus,
  Settings,
  Activity
} from 'lucide-react';
import { useAuth } from '../../features/auth/auth.context.jsx';
import { ROLES } from '../utils/constants.js';

const Sidebar = () => {
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
      { name: 'Tickets',   href: '/app/tickets',   icon: Ticket          },
    ];

    if (user?.role === ROLES.CUSTOMER) {
      baseItems.push({ name: 'Create Ticket', href: '/app/tickets/new', icon: Plus });
    }

    if ([ROLES.ADMIN, ROLES.MANAGER].includes(user?.role)) {
      baseItems.push({ name: 'Users', href: '/app/users', icon: Users });
    }

    // Settings is available to every role
    baseItems.push({ name: 'Settings', href: '/app/settings', icon: Settings });

    if (user?.role === ROLES.ADMIN) {
      baseItems.push({ name: 'Monitoring', href: '/app/monitoring', icon: Activity });
    }

    return baseItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="mt-6 px-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;