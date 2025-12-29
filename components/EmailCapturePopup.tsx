import React, { useState, useEffect, useCallback } from 'react';
import { X, Check, Mail, User } from 'lucide-react';

/**
 * EmailCapturePopup Component
 *
 * Modal popup for newsletter subscription that appears when user scrolls 60% down article.
 * Features:
 * - Category-aware messaging (DFI Insights, Climate Finance, default)
 * - LocalStorage persistence (7-day cooldown)
 * - Success animation with checkmark
 * - Click-outside and ESC key to close
 * - Fully accessible with ARIA labels
 * - JASPER brand colors (Navy/Emerald)
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface EmailCapturePopupProps {
  /** Content category for personalized messaging */
  category?: 'dfi-insights' | 'climate-finance' | 'default';
  /** Scroll threshold percentage (0-100) to trigger popup */
  scrollThreshold?: number;
  /** LocalStorage key prefix for tracking dismissals */
  storageKey?: string;
  /** Cooldown period in days before showing popup again */
  cooldownDays?: number;
  /** API endpoint for subscription */
  apiEndpoint?: string;
}

interface SubscriptionFormData {
  name: string;
  email: string;
  source_page: string;
  category: string;
}

interface PopupContent {
  headline: string;
  subhead: string;
  tag: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POPUP_CONTENT: Record<string, PopupContent> = {
  'dfi-insights': {
    headline: 'Get DFI Funding Insights',
    subhead: 'Weekly analysis of IFC, BII, and AfDB investment trends.',
    tag: 'DFI INSIGHTS',
  },
  'climate-finance': {
    headline: 'Climate Finance Newsletter',
    subhead: 'Green funding opportunities and ESG compliance updates.',
    tag: 'CLIMATE FINANCE',
  },
  default: {
    headline: 'JASPER Insights',
    subhead: 'Expert analysis on African project finance and DFI funding.',
    tag: 'FINANCIAL INTELLIGENCE',
  },
};

const STORAGE_PREFIX = 'jasper_email_popup';
const DEFAULT_COOLDOWN_DAYS = 7;
const DEFAULT_SCROLL_THRESHOLD = 60;
// Use the integrated CRM intake endpoint
const DEFAULT_API_ENDPOINT = 'https://api.jasperfinance.org/api/v1/intake/newsletter';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EmailCapturePopup: React.FC<EmailCapturePopupProps> = ({
  category = 'default',
  scrollThreshold = DEFAULT_SCROLL_THRESHOLD,
  storageKey = STORAGE_PREFIX,
  cooldownDays = DEFAULT_COOLDOWN_DAYS,
  apiEndpoint = DEFAULT_API_ENDPOINT,
}) => {
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [isVisible, setIsVisible] = useState(false);
  const [hasScrolledEnough, setHasScrolledEnough] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: '',
    email: '',
    source_page: typeof window !== 'undefined' ? window.location.pathname : '',
    category: category,
  });

  // --------------------------------------------------------------------------
  // CONTENT SELECTION
  // --------------------------------------------------------------------------
  const content = POPUP_CONTENT[category] || POPUP_CONTENT.default;

  // --------------------------------------------------------------------------
  // LOCAL STORAGE HELPERS
  // --------------------------------------------------------------------------
  const checkCooldown = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;

    const key = `${storageKey}_dismissed`;
    const dismissedAt = localStorage.getItem(key);

    if (!dismissedAt) return true;

    const dismissedDate = new Date(dismissedAt);
    const cooldownEnd = new Date(
      dismissedDate.getTime() + cooldownDays * 24 * 60 * 60 * 1000
    );

    return new Date() > cooldownEnd;
  }, [storageKey, cooldownDays]);

  const setDismissed = useCallback((): void => {
    if (typeof window === 'undefined') return;

    const key = `${storageKey}_dismissed`;
    localStorage.setItem(key, new Date().toISOString());
  }, [storageKey]);

  // --------------------------------------------------------------------------
  // SCROLL TRACKING
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = (): void => {
      const scrollPercent =
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;

      if (scrollPercent >= scrollThreshold && !hasScrolledEnough) {
        setHasScrolledEnough(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollThreshold, hasScrolledEnough]);

  // --------------------------------------------------------------------------
  // POPUP VISIBILITY LOGIC
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (hasScrolledEnough && checkCooldown() && !isSuccess) {
      // Delay popup appearance slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasScrolledEnough, checkCooldown, isSuccess]);

  // --------------------------------------------------------------------------
  // CLOSE HANDLERS
  // --------------------------------------------------------------------------
  const handleClose = useCallback((): void => {
    setIsVisible(false);
    setDismissed();
  }, [setDismissed]);

  const handleOutsideClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>): void => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  // ESC key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isVisible) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isVisible, handleClose]);

  // --------------------------------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null); // Clear error on input
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Please enter your first name');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Subscription failed. Please try again.');
      }

      // Success state
      setIsSuccess(true);
      setDismissed();

      // Auto-close after success animation
      setTimeout(() => {
        setIsVisible(false);
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER CONDITIONS
  // --------------------------------------------------------------------------
  if (!isVisible) return null;

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-headline"
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl animate-slideUp">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          aria-label="Close popup"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-8">
          {isSuccess ? (
            // SUCCESS STATE
            <div className="text-center py-8 animate-fadeIn">
              <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-emerald-100 animate-scaleIn">
                <Check size={32} className="text-jasper-emerald" />
              </div>
              <h3 className="text-2xl font-semibold text-jasper-navy mb-2">
                You're subscribed!
              </h3>
              <p className="text-gray-600">
                Check your inbox for a confirmation email.
              </p>
            </div>
          ) : (
            // FORM STATE
            <>
              {/* Tag */}
              <div className="inline-block px-3 py-1 mb-4 text-xs font-semibold tracking-wider text-jasper-emerald bg-emerald-50 rounded-full">
                {content.tag}
              </div>

              {/* Headline */}
              <h2
                id="popup-headline"
                className="text-2xl font-bold text-jasper-navy mb-2 leading-tight"
              >
                {content.headline}
              </h2>

              {/* Subhead */}
              <p className="text-gray-600 mb-6">
                {content.subhead}
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* First Name Input */}
                <div>
                  <label htmlFor="name" className="sr-only">
                    First Name
                  </label>
                  <div className="relative">
                    <User
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="First name"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent transition-all outline-none"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email address"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent transition-all outline-none"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-6 bg-jasper-emerald hover:bg-jasper-emerald-dark text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 focus:ring-jasper-emerald"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Subscribing...
                    </span>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>

              {/* Privacy Note */}
              <p className="mt-4 text-xs text-gray-500 text-center">
                We respect your privacy. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>

      {/* Inline Styles for Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
};

export default EmailCapturePopup;
