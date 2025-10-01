'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/auth-context';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Truck,
  MapPin,
  Building2,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Bell,
} from 'lucide-react';
import { UserRole } from '../types';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [UserRole.DISPATCHER, UserRole.OPS_MANAGER, UserRole.CONTRACTOR_FOCAL_POINT, UserRole.MAINTENANCE, UserRole.FINANCE_AUDIT],
  },
  {
    title: 'My Assignment',
    href: '/driver-dashboard',
    icon: Truck,
    roles: [UserRole.DRIVER],
  },
  {
    title: 'Drivers',
    href: '/drivers',
    icon: Users,
    roles: [UserRole.DISPATCHER, UserRole.OPS_MANAGER, UserRole.CONTRACTOR_FOCAL_POINT],
  },
  {
    title: 'Fleet',
    href: '/fleet',
    icon: Truck,
    roles: [UserRole.DISPATCHER, UserRole.OPS_MANAGER, UserRole.MAINTENANCE],
  },
  {
    title: 'Missions',
    href: '/missions',
    icon: MapPin,
    roles: [UserRole.DISPATCHER, UserRole.OPS_MANAGER],
  },
  {
    title: 'Contractors',
    href: '/contractors',
    icon: Building2,
    roles: [UserRole.OPS_MANAGER, UserRole.CONTRACTOR_FOCAL_POINT],
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: [UserRole.OPS_MANAGER, UserRole.FINANCE_AUDIT],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: [UserRole.OPS_MANAGER],
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hasPermission = (allowedRoles: UserRole[]) => {
    return user && allowedRoles.includes(user.role);
  };  const availableNavItems = navigationItems.filter(item => 
    hasPermission(item.roles)
  );

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.OPS_MANAGER:
        return 'default';
      case UserRole.DISPATCHER:
        return 'secondary';
      case UserRole.CONTRACTOR_FOCAL_POINT:
        return 'outline';
      case UserRole.MAINTENANCE:
        return 'destructive';
      case UserRole.FINANCE_AUDIT:
        return 'secondary';
      case UserRole.DRIVER:
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            <Link
              href={user?.role === UserRole.DRIVER ? '/driver-dashboard' : '/dashboard'}
              className="flex items-center space-x-2"
            >
              <MapPin className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Gaza Logistics</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1 ml-8">
            {availableNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4 ml-auto">
            {/* Notifications */}
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>

            {/* Organization Badge */}
            <Badge variant="outline" className="hidden sm:inline-flex">
              {user?.tenantId}
            </Badge>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.name || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name || user?.email}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    <Badge 
                      variant={getRoleBadgeColor(user?.role || UserRole.DISPATCHER)} 
                      className="w-fit text-xs"
                    >
                      {user?.role.replace('_', ' ')}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b bg-background">
          <nav className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-2">
            {availableNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-md text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="w-full max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}