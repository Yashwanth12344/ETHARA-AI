import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  Users, 
  LogOut,
  Menu,
  X,
  Settings
} from 'lucide-react';
import '../styles/sidebar.css';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    { 
      label: 'Projects', 
      icon: FolderOpen, 
      path: '/projects',
      active: location.pathname.startsWith('/project')
    },
    { 
      label: 'Tasks', 
      icon: CheckSquare, 
      path: '/tasks',
      active: location.pathname.startsWith('/tasks')
    },
    { 
      label: 'Members', 
      icon: Users, 
      path: '/members',
      active: location.pathname.startsWith('/members')
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-text">
              <h2>TaskForge</h2>
              <span>Team Manager</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section">
            <p className="nav-label">Menu</p>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  className={`nav-item ${item.active ? 'active' : ''}`}
                  onClick={() => {
                    handleNavigation(item.path);
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  title={item.label}
                >
                  <Icon size={20} />
                  <span className="nav-label-text">{item.label}</span>
                  {item.active && <div className="nav-indicator"></div>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="sidebar-user">
          <div className="user-card">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <span className={`user-role ${user?.role?.toLowerCase()}`}>
                {user?.role}
              </span>
            </div>
          </div>

          <button className="btn-logout" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)}></div>}
    </>
  );
}
