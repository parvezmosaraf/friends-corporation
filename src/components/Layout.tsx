import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  BarChart3, 
  Building2,
  Menu,
  X,
  LogOut,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInstallPWA } from '@/hooks/useInstallPWA';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/admin', icon: Users, label: 'Employees' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { installable, installed, promptInstall } = useInstallPWA();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-safe-bottom overflow-x-hidden">
      {/* Top Navigation Bar - safe area so logo/nav don't sit under status bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl pt-safe-top">
        <div className="container mx-auto flex h-14 min-h-touch sm:h-16 items-center justify-between gap-2 px-content sm:px-6 md:px-8">
          <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3" aria-label="Friends Corp home">
            <div className="flex h-9 w-9 shrink-0 sm:h-10 sm:w-10 items-center justify-center rounded-xl gradient-primary">
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-lg font-bold">Friends Corp</h1>
              <p className="text-xs text-muted-foreground">Salary Management</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2',
                      isActive && 'bg-primary/10 text-primary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
            {installable && !installed && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={promptInstall}
              >
                <Download className="h-4 w-4" />
                Install app
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 min-h-touch text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </nav>

          {/* Mobile Menu Button - touch target 44px */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-min-touch w-min-touch min-w-[44px] min-h-[44px] shrink-0"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border/40 bg-background"
          >
            <div className="container mx-auto p-4 space-y-2 px-content sm:px-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setMobileMenuOpen(false)}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 min-h-touch',
                        isActive && 'bg-primary/10 text-primary'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                );
              })}
              {installable && !installed && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    promptInstall();
                  }}
                >
                  <Download className="h-4 w-4" />
                  Install app
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </motion.nav>
        )}
      </header>

      {/* Main Content - px-content = at least 20px (or safe area) so content isn't cut off on mobile */}
      <main className="container mx-auto py-6 sm:py-8 px-content sm:px-6 md:px-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
