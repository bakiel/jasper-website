import React from 'react';

export const metadata = {
  title: 'JASPER™ Financial Architecture',
  description: 'Investment-Grade Financial Models. Mathematically Proven. Globally Available.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              darkMode: 'class',
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['Poppins', 'sans-serif'],
                  },
                  colors: {
                    brand: {
                      navy: '#0F172A',    /* Carbon Black - Deep backgrounds */
                      dark: '#0B1E2B',    /* Navy Dark */
                      surface: '#1A3A4C', /* Navy Light - Cards */
                      emerald: '#2C8A5B', /* Brand Emerald - Primary Accent */
                      glow: '#44D685',    /* Lighter Emerald for glow effects */
                      text: '#FFFFFF',    /* White */
                      muted: '#94A3B8',   /* Gray - Secondary Text */
                      border: '#CBD5E1',  /* Gray Light */
                    },
                    train: {
                      navy: '#002060',
                      grey: '#5A5A5A',
                      green: '#2C8A5B',
                      gold: '#C4961A',
                      orange: '#ED7D31',
                      red: '#C00000',
                      purple: '#7030A0',
                    }
                  },
                  backgroundImage: {
                    'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                    'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2C8A5B33 0deg, #2C8A5B00 180deg, #2C8A5B33 360deg)',
                  },
                  animation: {
                    'gradient-x': 'gradient-x 3s ease infinite',
                    'shimmer': 'shimmer 2s linear infinite',
                    'border-beam': 'border-beam calc(var(--duration)*1s) infinite linear',
                    'spotlight': 'spotlight 2s ease .75s 1 forwards',
                  },
                  keyframes: {
                    'gradient-x': {
                      '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                      },
                      '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                      },
                    },
                    'shimmer': {
                      'from': {
                        'transform': 'translateX(-100%)'
                      },
                      'to': {
                        'transform': 'translateX(100%)'
                      }
                    },
                    'border-beam': {
                      '100%': {
                        'offset-distance': '100%',
                      },
                    },
                    'spotlight': {
                      '0%': {
                        opacity: '0',
                        transform: 'translate(-72%, -62%) scale(0.5)',
                      },
                      '100%': {
                        opacity: '1',
                        transform: 'translate(-50%,-40%) scale(1)',
                      },
                    },
                  }
                },
              },
            }
          `
        }} />
        <style dangerouslySetInnerHTML={{__html: `
          body {
            background-color: #0F172A; /* Carbon Black */
            color: #FFFFFF;
            font-family: 'Poppins', sans-serif;
            overflow-x: hidden;
          }
          ::-webkit-scrollbar {
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #0F172A;
          }
          ::-webkit-scrollbar-thumb {
            background: #1A3A4C;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #2C8A5B;
          }
          .perspective-1000 {
            perspective: 1000px;
          }
          .bg-grid-white {
            background-size: 40px 40px;
            background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}