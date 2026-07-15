import { useAuthStore } from '@/store/authStore';
import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-text-secondary hover:text-text-primary">
          <Menu size={24} />
        </button>
        {/* Breadcrumb will go here */}
        <div className="text-sm text-text-muted hidden md:block">
          WMS Enterprise / <span className="text-text-primary font-medium">Dashboard</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative text-text-secondary hover:text-text-primary transition-colors">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[10px] text-white flex items-center justify-center font-bold">
            3
          </span>
        </button>

        <div className="relative">
          <button 
            className="flex items-center gap-3 text-left"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-text-primary">
                {user?.fullName || 'Người dùng'} {user?.username && `(${user.username})`}
              </p>
              <p className="text-xs text-text-muted">{user?.email || (user?.role === 1 ? 'Admin' : 'Staff')}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl shadow-lg border border-border py-1 z-30">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-medium text-text-primary truncate">{user?.email}</p>
              </div>
              <button 
                className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-background hover:text-text-primary flex items-center gap-2"
              >
                <User size={16} /> Thông tin cá nhân
              </button>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 flex items-center gap-2"
              >
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
