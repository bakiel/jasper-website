import React, { createContext, useContext, useState, useEffect } from 'react';

// Mock Router Context mimicking next/navigation
interface RouterContextType {
  path: string;
  push: (path: string) => void;
}

const RouterContext = createContext<RouterContextType>({ 
  path: '/', 
  push: () => {} 
});

export const RouterProvider = ({ children }: { children: React.ReactNode }) => {
  // Using simple state for routing in this SPA environment
  const [path, setPath] = useState('/');

  const push = (newPath: string) => {
    setPath(newPath);
    // In a real app we might use window.history.pushState here, 
    // but for iframe safety we'll stick to React state.
  };

  return (
    <RouterContext.Provider value={{ path, push }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  return { push: context.push };
};

export const usePathname = () => {
  const context = useContext(RouterContext);
  return context.path;
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export const Link: React.FC<LinkProps> = ({ href, children, className, ...props }) => {
  const { push } = useRouter();
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        push(href);
      }}
      className={className}
      data-active={isActive}
      {...props}
    >
      {children}
    </a>
  );
};
