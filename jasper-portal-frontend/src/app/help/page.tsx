'use client'

import { useState } from 'react'
import { Header } from '@/components/layout'
import {
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  FolderKanban,
  Users,
  CreditCard,
  Settings,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FAQItem {
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I create a new project?',
    answer: 'Navigate to the Projects page and click the "New Project" button. Fill in the project details including name, client, value, and target dates. The project will automatically be assigned a reference number.',
  },
  {
    category: 'Getting Started',
    question: 'How do I add a new client?',
    answer: 'Go to the Clients page and click "Add Client". Enter the company information, primary contact details, and any relevant notes. You can also specify their DFI targets and funding requirements.',
  },
  {
    category: 'Projects',
    question: 'What are the different project stages?',
    answer: 'Projects progress through: Inquiry → Proposal → Negotiation → Contracted → In Progress → Completed. Each stage has specific milestones and can be advanced from the project detail page.',
  },
  {
    category: 'Projects',
    question: 'How do I upload documents to a project?',
    answer: 'Open the project detail page and scroll to the Documents section. Click "Upload Document" to add files. You can mark documents as client-visible to share them through the portal.',
  },
  {
    category: 'Invoicing',
    question: 'How do I create an invoice?',
    answer: 'Go to Invoices and click "New Invoice". Select the client and project, add line items with descriptions and amounts, set payment terms, and send directly from the platform.',
  },
  {
    category: 'Invoicing',
    question: 'What payment methods are accepted?',
    answer: 'JASPER accepts bank transfers (EFT), credit card payments, and cryptocurrency (USDT TRC-20/ERC-20). International payments receive a 5% discount for crypto payments.',
  },
  {
    category: 'Messages',
    question: 'How do I communicate with clients?',
    answer: 'Use the Messages section to send and receive messages from clients. You can attach documents and track conversation history. Clients receive email notifications for new messages.',
  },
  {
    category: 'Account',
    question: 'How do I change my password?',
    answer: 'Go to Settings → Security and click "Change Password". Enter your current password and your new password twice to confirm. Passwords must be at least 8 characters.',
  },
  {
    category: 'Account',
    question: 'How do I enable dark mode?',
    answer: 'Go to Settings → Appearance and select your preferred theme: Light, Dark, or System (follows your device settings). The change applies immediately.',
  },
]

const categories = [
  { name: 'Getting Started', icon: Book },
  { name: 'Projects', icon: FolderKanban },
  { name: 'Invoicing', icon: CreditCard },
  { name: 'Messages', icon: MessageCircle },
  { name: 'Account', icon: Settings },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === null || faq.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header title="Help Center" subtitle="Find answers and get support" />

      <div className="p-6 max-w-5xl mx-auto">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-jasper-slate" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12 py-4 text-lg"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <QuickLink
            icon={FileText}
            title="Documentation"
            description="Read the full guide"
            href="#faqs"
          />
          <QuickLink
            icon={MessageCircle}
            title="Live Chat"
            description="Chat with support"
            onClick={() => window.open('mailto:support@jasperfinance.org', '_blank')}
          />
          <QuickLink
            icon={Mail}
            title="Email Support"
            description="models@jasperfinance.org"
            href="mailto:models@jasperfinance.org"
          />
          <QuickLink
            icon={Phone}
            title="Call Us"
            description="+27 (0) 11 123 4567"
            href="tel:+27111234567"
          />
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeCategory === null
                ? 'bg-jasper-emerald text-white'
                : 'bg-surface-primary text-jasper-slate hover:bg-surface-tertiary'
            )}
          >
            All Topics
          </button>
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                activeCategory === category.name
                  ? 'bg-jasper-emerald text-white'
                  : 'bg-surface-primary text-jasper-slate hover:bg-surface-tertiary'
              )}
            >
              <category.icon className="w-4 h-4" />
              {category.name}
            </button>
          ))}
        </div>

        {/* FAQs */}
        <div id="faqs" className="space-y-3">
          <h2 className="text-lg font-semibold text-jasper-carbon mb-4">
            Frequently Asked Questions
          </h2>

          {filteredFAQs.map((faq, index) => (
            <div key={index} className="card overflow-hidden">
              <button
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-secondary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="badge badge-info text-xs">{faq.category}</span>
                  <span className="font-medium text-jasper-carbon">{faq.question}</span>
                </div>
                {openFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-jasper-slate flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-jasper-slate flex-shrink-0" />
                )}
              </button>
              {openFAQ === index && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-jasper-slate leading-relaxed pl-[88px]">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}

          {filteredFAQs.length === 0 && (
            <div className="card p-8 text-center">
              <HelpCircle className="w-12 h-12 text-jasper-slate mx-auto mb-3" />
              <p className="text-jasper-slate">No results found for "{searchQuery}"</p>
              <p className="text-sm text-jasper-slate-light mt-1">
                Try different keywords or contact support
              </p>
            </div>
          )}
        </div>

        {/* Contact Support Card */}
        <div className="mt-8 card bg-gradient-to-br from-jasper-navy to-jasper-graphite text-white">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-jasper-emerald/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-jasper-emerald" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Need More Help?</h3>
                <p className="text-gray-300 mb-4">
                  Our support team is available Monday to Friday, 8:00 AM - 6:00 PM (SAST).
                  We typically respond within 24 hours.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="mailto:models@jasperfinance.org"
                    className="btn-primary text-sm"
                  >
                    <Mail className="w-4 h-4" />
                    Email Support
                  </a>
                  <a
                    href="https://jasperfinance.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Visit Website
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  icon: Icon,
  title,
  description,
  href,
  onClick,
}: {
  icon: any
  title: string
  description: string
  href?: string
  onClick?: () => void
}) {
  const Component = href ? 'a' : 'button'
  const props = href ? { href, target: href.startsWith('http') ? '_blank' : undefined } : { onClick }

  return (
    <Component
      {...props}
      className="card card-hover p-4 text-left flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-jasper-emerald/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-jasper-emerald" />
      </div>
      <div>
        <p className="font-medium text-jasper-carbon">{title}</p>
        <p className="text-sm text-jasper-slate">{description}</p>
      </div>
    </Component>
  )
}
