'use client';

import { useState, useRef, useEffect } from 'react';
import { Menu, UserRound, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : 'Admin';

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
        aria-label="Open menu"
        id="topbar-menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer pushes user widget to the right on desktop */}
      <div className="flex-1" />

      {/* User profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          id="topbar-profile"
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition text-sm"
        >
          {/* Avatar chip */}
          <span className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <UserRound size={15} />
          </span>

          {/* Name + role — hidden on xs */}
          <span className="hidden sm:block">
            <span className="font-medium text-gray-900 max-w-[120px] truncate block leading-tight">
              {displayName}
            </span>
            <span className="text-xs text-gray-400 block leading-tight">
              Administrator
            </span>
          </span>

          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown panel */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50">
            {/* User info */}
            <div className="px-4 py-2.5 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {displayName}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.email ?? ''}
              </p>
            </div>

            {/* Logout */}
            <div className="pt-1">
              <button
                type="button"
                id="topbar-logout"
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
