'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Nav config — add items here as new pages are built
// ---------------------------------------------------------------------------
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Products', href: '/products', icon: ShoppingBag },
];

// ---------------------------------------------------------------------------
// NavLink — single navigation entry
// ---------------------------------------------------------------------------
function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'bg-indigo-50 text-indigo-700'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={18} />
      {item.label}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// SidebarContent — shared between desktop aside and mobile drawer
// ---------------------------------------------------------------------------
function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <span className="text-base font-bold text-gray-900 tracking-tight">
          Product Admin
        </span>
        {/* Close button — mobile drawer only */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-600 transition p-1 -mr-1 rounded"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar — desktop persistent + mobile drawer
// ---------------------------------------------------------------------------
interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:shrink-0 bg-white border-r border-gray-200 min-h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar — drawer with backdrop */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-xl lg:hidden flex flex-col">
            <SidebarContent onClose={onClose} />
          </aside>
        </>
      )}
    </>
  );
}
