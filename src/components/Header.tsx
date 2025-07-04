
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import { Home, User, LogOut, Building, Search } from 'lucide-react';

const Header: React.FC = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 space-x-reverse">
            <Building className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-primary">عقاري سوريا</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
            <Link to="/" className="flex items-center space-x-1 space-x-reverse text-gray-700 hover:text-primary transition-colors">
              <Home className="h-4 w-4" />
              <span>الرئيسية</span>
            </Link>
            <Link to="/properties" className="flex items-center space-x-1 space-x-reverse text-gray-700 hover:text-primary transition-colors">
              <Search className="h-4 w-4" />
              <span>العقارات</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-4 space-x-reverse">
            {currentUser ? (
              <div className="flex items-center space-x-3 space-x-reverse">
                <Link
                  to={userData?.role === 'owner' ? '/landlord-dashboard' : '/renter-dashboard'}
                  className="flex items-center space-x-1 space-x-reverse text-gray-700 hover:text-primary transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>{userData?.name}</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1 space-x-reverse"
                >
                  <LogOut className="h-4 w-4" />
                  <span>خروج</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Link to="/login">
                  <Button variant="outline">دخول</Button>
                </Link>
                <Link to="/register">
                  <Button>تسجيل</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
