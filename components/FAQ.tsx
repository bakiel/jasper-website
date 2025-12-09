'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const QUESTIONS = [
  {
    q: "How does the Python-to-C# pipeline work?",
    a: "We transpile your Python business logic into highly optimized C# binaries during the build process. This ensures you get the development speed of Python with the runtime performance of a compiled language."
  },
  {
    q: "Can I import existing Excel models?",
    a: "Yes. Our ingestion engine can parse standard financial modeling structures from Excel, converting named ranges and logic chains into our dependency graph automatically."
  },
  {
    q: "Is the iterative solver configurable?",
    a: "Absolutely. You can define convergence thresholds, maximum iteration counts, and circularity breakers at both the global and module level."
  },
  {
    q: "What compliance standards do you support?",
    a: "JASPER is SOC2 Type II certified and complies with major regulatory frameworks including GDPR and CCPA. We offer full audit logs for every calculation change."
  }
];

const FAQItem: React.FC<{ q: string; a: string; isOpen: boolean; toggle: () => void }> = ({ q, a, isOpen, toggle }) => {
  return (
    <div className="border-b border-white/10">
      <button 
        onClick={toggle}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className={`text-lg font-medium transition-colors ${isOpen ? 'text-brand-emerald' : 'text-white group-hover:text-brand-emerald'}`}>
          {q}
        </span>
        <span className={`ml-6 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          {isOpen ? <Minus className="w-5 h-5 text-brand-emerald" /> : <Plus className="w-5 h-5 text-brand-gray" />}
        </span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-brand-gray leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-brand-navy relative">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row gap-16">
          
          <div className="lg:w-1/3">
            <h2 className="text-3xl font-bold text-white mb-4">
              Frequently asked questions
            </h2>
            <p className="text-brand-gray mb-8">
              Can't find the answer you're looking for? Reach out to our technical support team.
            </p>
            <a href="#" className="text-brand-emerald font-medium hover:underline">
              Contact Support &rarr;
            </a>
          </div>

          <div className="lg:w-2/3">
            {QUESTIONS.map((item, idx) => (
              <FAQItem 
                key={idx}
                q={item.q}
                a={item.a}
                isOpen={openIndex === idx}
                toggle={() => setOpenIndex(openIndex === idx ? null : idx)}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};