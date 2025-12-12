import React from 'react';
import { RouterProvider, usePathname } from './lib/navigation';
import RootLayout from './app/layout';
import DashboardPage from './app/page';
import SequencesPage from './app/sequences/page';
import LeadsPage from './app/leads/page';

// Route Switcher Component
const PageSwitcher = () => {
  const pathname = usePathname();

  switch (pathname) {
    case '/':
      return <DashboardPage />;
    case '/sequences':
      return <SequencesPage />;
    case '/leads':
      return <LeadsPage />;
    default:
      // Fallback for demo purposes
      return <DashboardPage />;
  }
};

const App: React.FC = () => {
  return (
    <RouterProvider children={
      <RootLayout children={
        <PageSwitcher />
      } />
    } />
  );
};

export default App;