import { LayoutDashboard, UserPlus, BookOpen, GraduationCap, User, LogOut } from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPage, onNavigate, onLogout }: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'regular-student', label: 'Regular Students', icon: GraduationCap },
    { id: 'als-student', label: 'ALS Students', icon: BookOpen },
    { id: 'als-new-enrollees', label: 'ALS New Enrollees', icon: UserPlus },
    { id: 'new-student', label: 'New Enrollees', icon: UserPlus },
    { id: 'app-users', label: 'AppUsers', icon: User },
  ];


  return (
    <div className="w-48 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 text-white h-screen fixed left-0 top-0 shadow-xl">
      
      <div className="p-4 border-b border-slate-600 flex justify-center">
        <img src="/src/assets/Logo.png" alt="Logo" className="h-20 w-20" />
      </div>
      <div className="p-4 border-b border-slate-600">
        <h1 className="text-lg font-bold tracking-tight">Kasiglahan Village Senior Hish School</h1>
      </div>

      <nav className="p-3 space-y-1 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full text-left px-4 py-3 transition-all duration-200 flex items-center space-x-2 ${
                isActive
                  ? 'bg-slate-600 text-white border-l-4 border-blue-400'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon size={16} />
              <span className="font-normal text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogoutClick}
            className="w-full text-left px-4 py-3 transition-all duration-200 flex items-center space-x-2 text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <LogOut size={16} />
            <span className="font-normal text-sm">Logout</span>
          </button>
        </div>
        <div className="p-3 text-xs text-slate-400 text-center">
          <p>@2025, developed by SIRIUS</p>
          <p>for a better desktop.</p>
        </div>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
            <div className="flex space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
