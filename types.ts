
import { LucideIcon } from 'lucide-react';

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  image?: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface Package {
  name: string;
  price: string;
  duration: string;
  target: string;
  features: string[];
  highlight?: boolean;
  // Detailed breakdown
  deliverables?: {
    model: string[];
    docs: string[];
    support: string[];
    other?: string[];
  };
  notIncluded?: string[];
  bestFor?: string[];
}

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
}

export interface AddOn {
  title: string;
  price: string;
  desc: string;
}

export interface FAQItem {
  q: string;
  a: string;
}
