import { LayoutDashboard, UserPlus, BookOpen, GraduationCap, User } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'regular-student', label: 'Regular Students', icon: GraduationCap },
    { id: 'als-student', label: 'ALS Students', icon: BookOpen },
    { id: 'als-new-enrollees', label: 'ALS New Enrollees', icon: UserPlus },
    { id: 'new-student', label: 'New Enrollees', icon: UserPlus },
    { id: 'teacher-account', label: 'Teacher Account', icon: User },
  ];


  return (
    <div className="w-48 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 text-white h-screen fixed left-0 top-0 shadow-xl">
      <div className="p-4 border-b border-slate-600">
        <h1 className="text-lg font-bold tracking-tight">Form2</h1>
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
        <div className="p-3 text-xs text-slate-400 text-center border-t border-slate-700">
          <p>@2025, developed by SIRIUS</p>
          <p>for a better desktop.</p>
        </div>
      </div>
    </div>
  );
}
