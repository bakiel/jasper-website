import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';

// Lazy load pages for code splitting - reduces initial bundle size
const Page = lazy(() => import('./app/page'));
const SectorsPage = lazy(() => import('./app/sectors/page'));
const ProcessPage = lazy(() => import('./app/process/page'));
const ContactPage = lazy(() => import('./app/contact/page'));
const FAQPage = lazy(() => import('./app/faq/page'));
const TermsPage = lazy(() => import('./app/terms/page'));
const NotFoundPage = lazy(() => import('./app/404/page'));
const LoginPage = lazy(() => import('./app/login/page'));
const PortalPage = lazy(() => import('./app/portal/page'));
const SectorPage = lazy(() => import('./components/SectorPage').then(module => ({ default: module.SectorPage })));
const MarketPage = lazy(() => import('./components/MarketPage').then(module => ({ default: module.MarketPage })));
const ChinesePage = lazy(() => import('./app/zh/page'));
const InsightsPage = lazy(() => import('./app/insights/page'));
const ArticlePage = lazy(() => import('./app/insights/[slug]/page'));

// Loading spinner component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0a192f]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#10b981]/20 border-t-[#10b981] rounded-full animate-spin" />
      <p className="text-white/60 text-sm">Loading...</p>
    </div>
  </div>
);

// Simple Route Types
type Route =
  | { path: 'home' }
  | { path: 'sectors-list' }
  | { path: 'process' }
  | { path: 'contact' }
  | { path: 'faq' }
  | { path: 'terms' }
  | { path: 'login' }
  | { path: 'portal' }
  | { path: 'zh' }
  | { path: 'insights' }
  | { path: 'insights-detail'; slug: string }
  | { path: 'sector-detail'; slug: string }
  | { path: 'market-detail'; slug: string }
  | { path: '404' };

const App: React.FC = () => {
  const [route, setRoute] = useState<Route>({ path: 'home' });

  const getRouteFromPath = (pathname: string): Route => {
    // Robust cleaning: remove trailing slash, ensure lowercase for matching
    const cleanPath = pathname.endsWith('/') && pathname.length > 1
      ? pathname.slice(0, -1).toLowerCase()
      : pathname.toLowerCase();

    if (cleanPath === '' || cleanPath === '/') {
      return { path: 'home' };
    } else if (cleanPath === '/sectors') {
      return { path: 'sectors-list' };
    } else if (cleanPath === '/process') {
      return { path: 'process' };
    } else if (cleanPath === '/contact') {
      return { path: 'contact' };
    } else if (cleanPath === '/faq') {
      return { path: 'faq' };
    } else if (cleanPath === '/terms') {
      return { path: 'terms' };
    } else if (cleanPath === '/login') {
      return { path: 'login' };
    } else if (cleanPath === '/portal') {
      return { path: 'portal' };
    } else if (cleanPath === '/zh') {
      return { path: 'zh' };
    } else if (cleanPath === '/insights') {
      return { path: 'insights' };
    } else if (cleanPath.startsWith('/insights/')) {
      const parts = cleanPath.split('/');
      // Expected format: ["", "insights", "slug"]
      if (parts.length >= 3) {
          const slug = parts[2];
          if (slug && slug.trim() !== '') {
              return { path: 'insights-detail', slug };
          }
      }
    } else if (cleanPath.startsWith('/sectors/')) {
      const parts = cleanPath.split('/');
      // Expected format: ["", "sectors", "slug"]
      if (parts.length >= 3) {
          const slug = parts[2];
          if (slug && slug.trim() !== '') {
              return { path: 'sector-detail', slug };
          }
      }
    } else if (cleanPath.startsWith('/markets/')) {
      const parts = cleanPath.split('/');
      // Expected format: ["", "markets", "slug"]
      if (parts.length >= 3) {
          const slug = parts[2];
          if (slug && slug.trim() !== '') {
              return { path: 'market-detail', slug };
          }
      }
    }

    // Show 404 for unknown routes
    return { path: '404' };
  };

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const currentRoute = getRouteFromPath(window.location.pathname);
      setRoute(currentRoute);
    };

    window.addEventListener('popstate', handlePopState);

    // Initial Route Check
    handlePopState();

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helper
  const navigate = (path: string) => {
    // Prevent redundant pushState if path hasn't changed
    if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
    }
    setRoute(getRouteFromPath(path));
    window.scrollTo({ top: 0, behavior: 'auto' }); // Instant scroll to top on nav
  };

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AnimatePresence mode="wait">
        {route.path === 'home' && (
          <Page
            key="home"
            onNavigate={navigate}
          />
        )}

        {route.path === 'sectors-list' && (
          <SectorsPage
            key="sectors-list"
            onNavigate={navigate}
          />
        )}

        {route.path === 'process' && (
          <ProcessPage
              key="process"
              onNavigate={navigate}
          />
        )}

        {route.path === 'contact' && (
          <ContactPage
              key="contact"
              onNavigate={navigate}
          />
        )}

        {route.path === 'faq' && (
          <FAQPage
              key="faq"
              onNavigate={navigate}
          />
        )}

        {route.path === 'terms' && (
          <TermsPage
              key="terms"
              onNavigate={navigate}
          />
        )}

        {route.path === 'login' && (
          <LoginPage
              key="login"
          />
        )}

        {route.path === 'portal' && (
          <PortalPage
              key="portal"
          />
        )}

        {route.path === 'zh' && (
          <ChinesePage
              key="zh"
              onNavigate={navigate}
          />
        )}

        {route.path === 'insights' && (
          <InsightsPage
              key="insights"
              onNavigate={navigate}
          />
        )}

        {route.path === 'insights-detail' && (
          <ArticlePage
            key={`article-${route.slug}`}
            slug={route.slug}
            onBack={() => navigate('/insights')}
            onNavigate={navigate}
          />
        )}

        {route.path === 'sector-detail' && (
          <SectorPage
            // Use slug as key to force remount/animation when switching between sectors
            key={`sector-${route.slug}`}
            slug={route.slug}
            onBack={() => navigate('/sectors')}
            onNavigate={navigate}
          />
        )}

        {route.path === 'market-detail' && (
          <MarketPage
            key={`market-${route.slug}`}
            slug={route.slug}
            onBack={() => navigate('/')}
            onNavigate={navigate}
          />
        )}

        {/* 404 Page */}
        {route.path === '404' && (
          <NotFoundPage
              key="404"
              onNavigate={navigate}
          />
        )}
      </AnimatePresence>
    </Suspense>
  );
};

export default App;
