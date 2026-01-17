import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SignOutDialog } from '@/components/SignOutDialog';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
// vitLogo import removed


interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, role, profile, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signOutDialogOpen, setSignOutDialogOpen] = useState(false);

  const handleSignOutClick = () => {
    setSignOutDialogOpen(true);
  };

  const handleSignOutConfirm = async () => {
    await signOut();
    router.push('/login');
  };

  const isAdmin = role === 'admin';
  const isWorker = role === 'worker';

  const navigation = isAdmin
    ? [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'All Complaints', href: '/admin/complaints', icon: FileText },
      { name: 'Workers', href: '/admin/workers', icon: Users },
    ]
    : isWorker
      ? [
        { name: 'Dashboard', href: '/worker', icon: LayoutDashboard },
      ]
      : [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Raise Complaint', href: '/new-complaint', icon: PlusCircle },
        { name: 'My Complaints', href: '/my-complaints', icon: FileText },
        { name: 'My Profile', href: '/profile', icon: Settings },
      ];

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin / Warden';
    if (isWorker) return 'Worker';
    return 'Student';
  };

  const getRoleIcon = () => {
    if (isAdmin) return <Shield className="h-3 w-3" />;
    if (isWorker) return <Wrench className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2">
            <img src="/vit-logo.jpg" alt="VIT Logo" className="h-8 w-8 rounded-full bg-white" />
            <span className="font-semibold">VIT HostelCare</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {(isAdmin || isWorker) && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {getRoleIcon()}
              {isAdmin ? 'Admin' : 'Worker'}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between gap-3 px-6 border-b">
            <div className="flex items-center gap-3">
              <img src="/vit-logo.jpg" alt="VIT Logo" className="h-9 w-9 rounded-full bg-white" />
              <span className="font-bold text-xl">VIT HostelCare</span>
            </div>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold">
                  {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {getRoleIcon()}
                  {getRoleLabel()}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOutClick}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8">{children}</div>
      </main>

      {/* Sign Out Confirmation Dialog */}
      <SignOutDialog
        open={signOutDialogOpen}
        onOpenChange={setSignOutDialogOpen}
        onConfirm={handleSignOutConfirm}
      />
    </div>
  );
}
