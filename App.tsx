import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import Page from './app/page';
import SectorsPage from './app/sectors/page';
import ProcessPage from './app/process/page';
import ContactPage from './app/contact/page';
import FAQPage from './app/faq/page';
import TermsPage from './app/terms/page';
import NotFoundPage from './app/404/page';
import { SectorPage } from './components/SectorPage';

// Simple Route Types
type Route =
  | { path: 'home' }
  | { path: 'sectors-list' }
  | { path: 'process' }
  | { path: 'contact' }
  | { path: 'faq' }
  | { path: 'terms' }
  | { path: 'sector-detail'; slug: string }
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
    } else if (cleanPath.startsWith('/sectors/')) {
      const parts = cleanPath.split('/');
      // Expected format: ["", "sectors", "slug"]
      if (parts.length >= 3) {
          const slug = parts[2];
          if (slug && slug.trim() !== '') {
              return { path: 'sector-detail', slug };
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

      {route.path === 'sector-detail' && (
        <SectorPage
          // Use slug as key to force remount/animation when switching between sectors
          key={`sector-${route.slug}`}
          slug={route.slug}
          onBack={() => navigate('/sectors')}
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
  );
};

export default App;