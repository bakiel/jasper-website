'use client'

import { useState } from 'react'
import Image from 'next/image'

const SECTORS = [
  { value: 'renewable-energy', label: 'Renewable Energy' },
  { value: 'data-centres', label: 'Data Centres' },
  { value: 'agri-industrial', label: 'Agri-Industrial' },
  { value: 'climate-finance', label: 'Climate Finance' },
  { value: 'technology', label: 'Technology' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'other', label: 'Other' },
]

const FUNDING_STAGES = [
  { value: 'seed', label: 'Seed / Pre-Revenue' },
  { value: 'series-a', label: 'Series A' },
  { value: 'series-b', label: 'Series B+' },
  { value: 'growth', label: 'Growth Stage' },
  { value: 'expansion', label: 'Expansion' },
  { value: 'established', label: 'Established Business' },
]

const FUNDING_RANGES = [
  { value: 'under-10m', label: 'Under R10 million' },
  { value: '10m-50m', label: 'R10 - R50 million' },
  { value: '50m-100m', label: 'R50 - R100 million' },
  { value: '100m-500m', label: 'R100 - R500 million' },
  { value: '500m-1b', label: 'R500M - R1 billion' },
  { value: 'over-1b', label: 'Over R1 billion' },
  { value: 'undetermined', label: 'Not yet determined' },
]

const PROJECT_COST_RANGES = [
  { value: 'under-10m', label: 'Under R10 million' },
  { value: '10m-50m', label: 'R10 - R50 million' },
  { value: '50m-100m', label: 'R50 - R100 million' },
  { value: '100m-500m', label: 'R100 - R500 million' },
  { value: '500m-1b', label: 'R500M - R1 billion' },
  { value: 'over-1b', label: 'Over R1 billion' },
  { value: 'undetermined', label: 'Not yet determined' },
]

const CONSTRUCTION_PERIODS = [
  { value: 'under-1-year', label: 'Under 1 year' },
  { value: '1-2-years', label: '1 - 2 years' },
  { value: '2-3-years', label: '2 - 3 years' },
  { value: 'over-3-years', label: 'Over 3 years' },
]

const OPERATING_PERIODS = [
  { value: '10-years', label: '10 years' },
  { value: '15-years', label: '15 years' },
  { value: '20-years', label: '20 years' },
  { value: '25-plus-years', label: '25+ years' },
]

const PACKAGES = [
  { value: 'growth', label: 'Growth ($12,000)', description: '10-year model, basic sensitivity, 2 revisions' },
  { value: 'institutional', label: 'Institutional ($25,000)', description: '15-year model, Monte Carlo, DFI documentation, 3 revisions' },
  { value: 'infrastructure', label: 'Infrastructure ($45,000)', description: '20-year model, full analytics suite, 5 revisions' },
  { value: 'strategic', label: 'Strategic ($85,000+)', description: 'Complex multi-project, bespoke requirements, unlimited support' },
  { value: 'unsure', label: 'Not sure - please advise based on my requirements', description: '' },
]

const TIMELINE_OPTIONS = [
  { value: 'urgent', label: 'Urgent (1-2 weeks)' },
  { value: 'standard', label: 'Standard (3-4 weeks)' },
  { value: 'flexible', label: 'Flexible (1-2 months)' },
  { value: 'planning', label: 'Planning stage' },
]

const AFRICAN_DFIS = [
  { value: 'idc', label: 'IDC (South Africa)' },
  { value: 'dbsa', label: 'DBSA' },
  { value: 'afdb', label: 'AfDB' },
  { value: 'afreximbank', label: 'Afreximbank' },
  { value: 'tdb', label: 'TDB' },
  { value: 'other-african-dfi', label: 'Other African DFI' },
]

const INTERNATIONAL_DFIS = [
  { value: 'ifc', label: 'IFC (World Bank)' },
  { value: 'dfc', label: 'US DFC' },
  { value: 'bii', label: 'British International Investment' },
  { value: 'deg', label: 'DEG (Germany)' },
  { value: 'fmo', label: 'FMO (Netherlands)' },
  { value: 'proparco', label: 'Proparco (France)' },
]

const OTHER_FUNDERS = [
  { value: 'commercial-banks', label: 'Commercial Banks' },
  { value: 'private-equity', label: 'Private Equity' },
  { value: 'sovereign-wealth', label: 'Sovereign Wealth Fund' },
  { value: 'impact-investors', label: 'Impact Investors' },
  { value: 'family-office', label: 'Family Office' },
]

const EXISTING_MATERIALS = [
  { value: 'business-plan', label: 'Business Plan' },
  { value: 'feasibility-study', label: 'Feasibility Study' },
  { value: 'existing-model', label: 'Existing Financial Model' },
  { value: 'engineering-studies', label: 'Engineering Studies / EPC Quotes' },
  { value: 'eia', label: 'Environmental Impact Assessment' },
  { value: 'legal-approvals', label: 'Legal / Regulatory Approvals' },
  { value: 'loi-customers', label: 'Letters of Intent from Customers' },
  { value: 'term-sheets', label: 'Term Sheets from Funders' },
]

type FormData = {
  // Contact Info
  name: string
  jobTitle: string
  company: string
  email: string
  phone: string
  country: string
  // Project Overview
  projectName: string
  projectDescription: string
  sector: string
  projectLocation: string
  // Financial Requirements
  projectCost: string
  fundingAmount: string
  equityPercent: string
  debtPercent: string
  grantsPercent: string
  fundingStage: string
  // Timeline
  constructionPeriod: string
  operatingPeriod: string
  targetCloseDate: string
  // Target Funders
  africanDfis: string[]
  internationalDfis: string[]
  otherFunders: string[]
  otherFunderDetail: string
  // Existing Materials
  existingMaterials: string[]
  // Model Requirements
  selectedPackage: string
  specificRequirements: string
  // Timeline & Budget
  deliveryTimeline: string
  budgetRange: string
  // Additional
  referralSource: string
  additionalInfo: string
}

export default function IntakePage() {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [reference, setReference] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<FormData>({
    name: '',
    jobTitle: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    projectName: '',
    projectDescription: '',
    sector: '',
    projectLocation: '',
    projectCost: '',
    fundingAmount: '',
    equityPercent: '',
    debtPercent: '',
    grantsPercent: '',
    fundingStage: '',
    constructionPeriod: '',
    operatingPeriod: '',
    targetCloseDate: '',
    africanDfis: [],
    internationalDfis: [],
    otherFunders: [],
    otherFunderDetail: '',
    existingMaterials: [],
    selectedPackage: '',
    specificRequirements: '',
    deliveryTimeline: '',
    budgetRange: '',
    referralSource: '',
    additionalInfo: '',
  })

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const toggleArrayField = (field: keyof FormData, value: string) => {
    const current = formData[field] as string[]
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    updateField(field, updated)
  }

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1) {
      if (!formData.name.trim()) newErrors.name = 'Full name is required'
      if (!formData.email.trim()) newErrors.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email required'
      if (!formData.company.trim()) newErrors.company = 'Company name is required'
    }

    if (stepNum === 2) {
      if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required'
      if (!formData.projectDescription.trim()) newErrors.projectDescription = 'Project description is required'
      else if (formData.projectDescription.length < 50) newErrors.projectDescription = 'Please provide at least 50 characters'
      if (!formData.sector) newErrors.sector = 'Please select an industry sector'
    }

    if (stepNum === 3) {
      if (!formData.fundingStage) newErrors.fundingStage = 'Please select a funding stage'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 6))
    }
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async () => {
    if (!validateStep(step)) return

    setIsSubmitting(true)

    try {
      const response = await fetch('https://api.jasperfinance.org/api/v1/crm/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.phone || null,
          sector: formData.sector,
          fundingStage: formData.fundingStage,
          fundingAmount: formData.fundingAmount || null,
          message: `
PROJECT: ${formData.projectName}
${formData.projectDescription}

LOCATION: ${formData.projectLocation || 'Not specified'}
PROJECT COST: ${formData.projectCost || 'Not specified'}
FUNDING SOUGHT: ${formData.fundingAmount || 'Not specified'}
STRUCTURE: Equity ${formData.equityPercent || '?'}% / Debt ${formData.debtPercent || '?'}% / Grants ${formData.grantsPercent || '?'}%

TIMELINE:
- Construction: ${formData.constructionPeriod || 'Not specified'}
- Operating Period: ${formData.operatingPeriod || 'Not specified'}
- Target Close: ${formData.targetCloseDate || 'Not specified'}

TARGET FUNDERS:
- African DFIs: ${formData.africanDfis.join(', ') || 'None selected'}
- International DFIs: ${formData.internationalDfis.join(', ') || 'None selected'}
- Other: ${formData.otherFunders.join(', ') || 'None selected'}

EXISTING MATERIALS: ${formData.existingMaterials.join(', ') || 'None'}

PACKAGE INTEREST: ${formData.selectedPackage || 'Not specified'}
SPECIFIC REQUIREMENTS: ${formData.specificRequirements || 'None'}
DELIVERY TIMELINE: ${formData.deliveryTimeline || 'Not specified'}
BUDGET: ${formData.budgetRange || 'As per package pricing'}

ADDITIONAL INFO: ${formData.additionalInfo || 'None'}
          `.trim(),
          referralSource: formData.referralSource || null,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setReference(result.reference)
        setSubmitted(true)
      } else {
        setErrors({ submit: result.message || 'Submission failed. Please try again.' })
      }
    } catch {
      setErrors({ submit: 'Network error. Please try again or contact us directly.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center p-8">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-jasper-emerald/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-jasper-emerald" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-jasper-navy mb-2">Thank You!</h1>
          <p className="text-jasper-slate mb-4">
            Your project questionnaire has been submitted successfully.
          </p>
          <p className="text-sm text-jasper-slate-light mb-6">
            Reference: <span className="font-mono font-medium text-jasper-emerald">{reference}</span>
          </p>
          <p className="text-sm text-jasper-slate">
            Our team will review your enquiry and respond within 24-48 hours.
          </p>
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-jasper-slate-light">
              Questions? Contact us at{' '}
              <a href="mailto:models@jasperfinance.org" className="text-jasper-emerald hover:underline">
                models@jasperfinance.org
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/jasper-icon.png"
              alt="JASPER"
              width={60}
              height={60}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-3xl font-bold text-jasper-navy tracking-tight">JASPER</h1>
          <p className="text-sm text-jasper-slate tracking-wider uppercase">Financial Architecture</p>
          <div className="mt-4 inline-block px-6 py-2 bg-jasper-emerald text-white rounded-lg">
            <span className="font-semibold">Client Project Questionnaire</span>
          </div>
          <p className="mt-3 text-sm text-jasper-slate italic">DFI-Grade Financial Modelling</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-jasper-slate mb-2">
            <span>Step {step} of 6</span>
            <span>{Math.round((step / 6) * 100)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(step / 6) * 100}%` }} />
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          {/* Step 1: Contact Info */}
          {step === 1 && (
            <div className="card-body">
              <h2 className="text-lg font-semibold text-jasper-navy mb-6 pb-3 border-b border-border">
                1. Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Full Name *</label>
                  <input
                    type="text"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                    placeholder="John Smith"
                  />
                  {errors.name && <p className="text-xs text-status-error mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="input-label">Job Title / Role</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.jobTitle}
                    onChange={e => updateField('jobTitle', e.target.value)}
                    placeholder="CEO, CFO, Project Manager..."
                  />
                </div>
                <div>
                  <label className="input-label">Company / Organisation *</label>
                  <input
                    type="text"
                    className={`input ${errors.company ? 'input-error' : ''}`}
                    value={formData.company}
                    onChange={e => updateField('company', e.target.value)}
                    placeholder="Company name"
                  />
                  {errors.company && <p className="text-xs text-status-error mt-1">{errors.company}</p>}
                </div>
                <div>
                  <label className="input-label">Email Address *</label>
                  <input
                    type="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    placeholder="email@company.com"
                  />
                  {errors.email && <p className="text-xs text-status-error mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="input-label">Phone Number</label>
                  <input
                    type="tel"
                    className="input"
                    value={formData.phone}
                    onChange={e => updateField('phone', e.target.value)}
                    placeholder="+27 82 123 4567"
                  />
                </div>
                <div>
                  <label className="input-label">Country</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.country}
                    onChange={e => updateField('country', e.target.value)}
                    placeholder="South Africa"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Project Overview */}
          {step === 2 && (
            <div className="card-body">
              <h2 className="text-lg font-semibold text-jasper-navy mb-6 pb-3 border-b border-border">
                2. Project Overview
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Project Name *</label>
                  <input
                    type="text"
                    className={`input ${errors.projectName ? 'input-error' : ''}`}
                    value={formData.projectName}
                    onChange={e => updateField('projectName', e.target.value)}
                    placeholder="e.g., 50MW Solar Plant Phase 1"
                  />
                  {errors.projectName && <p className="text-xs text-status-error mt-1">{errors.projectName}</p>}
                </div>
                <div>
                  <label className="input-label">Project Description *</label>
                  <textarea
                    className={`input min-h-[120px] ${errors.projectDescription ? 'input-error' : ''}`}
                    value={formData.projectDescription}
                    onChange={e => updateField('projectDescription', e.target.value)}
                    placeholder="Brief summary of what the project involves..."
                  />
                  {errors.projectDescription && <p className="text-xs text-status-error mt-1">{errors.projectDescription}</p>}
                </div>
                <div>
                  <label className="input-label">Industry Sector *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {SECTORS.map(s => (
                      <label
                        key={s.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                          ${formData.sector === s.value
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="radio"
                          name="sector"
                          value={s.value}
                          checked={formData.sector === s.value}
                          onChange={e => updateField('sector', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${formData.sector === s.value ? 'border-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.sector === s.value && <div className="w-2 h-2 rounded-full bg-jasper-emerald" />}
                        </div>
                        <span className="text-sm">{s.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.sector && <p className="text-xs text-status-error mt-1">{errors.sector}</p>}
                </div>
                <div>
                  <label className="input-label">Project Location</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.projectLocation}
                    onChange={e => updateField('projectLocation', e.target.value)}
                    placeholder="Country / Region"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Requirements */}
          {step === 3 && (
            <div className="card-body">
              <h2 className="text-lg font-semibold text-jasper-navy mb-6 pb-3 border-b border-border">
                3. Financial Requirements
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="input-label">Total Project Cost Estimate</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {PROJECT_COST_RANGES.map(r => (
                      <label
                        key={r.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.projectCost === r.value
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="radio"
                          name="projectCost"
                          value={r.value}
                          checked={formData.projectCost === r.value}
                          onChange={e => updateField('projectCost', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.projectCost === r.value ? 'border-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.projectCost === r.value && <div className="w-2 h-2 rounded-full bg-jasper-emerald" />}
                        </div>
                        <span>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">Funding Amount Sought</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {FUNDING_RANGES.map(r => (
                      <label
                        key={r.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.fundingAmount === r.value
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="radio"
                          name="fundingAmount"
                          value={r.value}
                          checked={formData.fundingAmount === r.value}
                          onChange={e => updateField('fundingAmount', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.fundingAmount === r.value ? 'border-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.fundingAmount === r.value && <div className="w-2 h-2 rounded-full bg-jasper-emerald" />}
                        </div>
                        <span>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">Proposed Funding Structure</label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="text-xs text-jasper-slate">Equity %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input mt-1"
                        value={formData.equityPercent}
                        onChange={e => updateField('equityPercent', e.target.value)}
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-jasper-slate">Senior Debt %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input mt-1"
                        value={formData.debtPercent}
                        onChange={e => updateField('debtPercent', e.target.value)}
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-jasper-slate">Grants/Subsidies %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="input mt-1"
                        value={formData.grantsPercent}
                        onChange={e => updateField('grantsPercent', e.target.value)}
                        placeholder="10"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="input-label">Current Funding Stage *</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {FUNDING_STAGES.map(s => (
                      <label
                        key={s.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.fundingStage === s.value
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="radio"
                          name="fundingStage"
                          value={s.value}
                          checked={formData.fundingStage === s.value}
                          onChange={e => updateField('fundingStage', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.fundingStage === s.value ? 'border-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.fundingStage === s.value && <div className="w-2 h-2 rounded-full bg-jasper-emerald" />}
                        </div>
                        <span>{s.label}</span>
                      </label>
                    ))}
                  </div>
                  {errors.fundingStage && <p className="text-xs text-status-error mt-1">{errors.fundingStage}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Timeline & Funders */}
          {step === 4 && (
            <div className="card-body">
              <h2 className="text-lg font-semibold text-jasper-navy mb-6 pb-3 border-b border-border">
                4. Project Timeline & Target Funders
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">Construction / Development Period</label>
                    <select
                      className="input"
                      value={formData.constructionPeriod}
                      onChange={e => updateField('constructionPeriod', e.target.value)}
                    >
                      <option value="">Select period...</option>
                      {CONSTRUCTION_PERIODS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Operating Period for Projections</label>
                    <select
                      className="input"
                      value={formData.operatingPeriod}
                      onChange={e => updateField('operatingPeriod', e.target.value)}
                    >
                      <option value="">Select period...</option>
                      {OPERATING_PERIODS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="input-label">Target Financial Close Date</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.targetCloseDate}
                    onChange={e => updateField('targetCloseDate', e.target.value)}
                    placeholder="e.g., Q2 2025"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <label className="input-label mb-3">Target Funders (select all that apply)</label>

                  <p className="text-sm font-medium text-jasper-navy mb-2">African DFIs</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {AFRICAN_DFIS.map(f => (
                      <label
                        key={f.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.africanDfis.includes(f.value)
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.africanDfis.includes(f.value)}
                          onChange={() => toggleArrayField('africanDfis', f.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.africanDfis.includes(f.value) ? 'border-jasper-emerald bg-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.africanDfis.includes(f.value) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>

                  <p className="text-sm font-medium text-jasper-navy mb-2">International DFIs</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {INTERNATIONAL_DFIS.map(f => (
                      <label
                        key={f.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.internationalDfis.includes(f.value)
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.internationalDfis.includes(f.value)}
                          onChange={() => toggleArrayField('internationalDfis', f.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.internationalDfis.includes(f.value) ? 'border-jasper-emerald bg-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.internationalDfis.includes(f.value) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>

                  <p className="text-sm font-medium text-jasper-navy mb-2">Other Funders</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {OTHER_FUNDERS.map(f => (
                      <label
                        key={f.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.otherFunders.includes(f.value)
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.otherFunders.includes(f.value)}
                          onChange={() => toggleArrayField('otherFunders', f.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.otherFunders.includes(f.value) ? 'border-jasper-emerald bg-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.otherFunders.includes(f.value) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Materials & Package */}
          {step === 5 && (
            <div className="card-body">
              <h2 className="text-lg font-semibold text-jasper-navy mb-6 pb-3 border-b border-border">
                5. Existing Materials & Package Selection
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="input-label mb-3">What materials do you already have?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXISTING_MATERIALS.map(m => (
                      <label
                        key={m.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.existingMaterials.includes(m.value)
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.existingMaterials.includes(m.value)}
                          onChange={() => toggleArrayField('existingMaterials', m.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.existingMaterials.includes(m.value) ? 'border-jasper-emerald bg-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.existingMaterials.includes(m.value) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span>{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <label className="input-label mb-3">Which JASPER package are you interested in?</label>
                  <div className="space-y-2">
                    {PACKAGES.map(p => (
                      <label
                        key={p.value}
                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all
                          ${formData.selectedPackage === p.value
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="radio"
                          name="package"
                          value={p.value}
                          checked={formData.selectedPackage === p.value}
                          onChange={e => updateField('selectedPackage', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 mt-0.5 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.selectedPackage === p.value ? 'border-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.selectedPackage === p.value && <div className="w-2 h-2 rounded-full bg-jasper-emerald" />}
                        </div>
                        <div>
                          <span className="font-medium text-jasper-navy">{p.label}</span>
                          {p.description && <p className="text-sm text-jasper-slate mt-1">{p.description}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">Any specific model features or requirements?</label>
                  <textarea
                    className="input min-h-[80px]"
                    value={formData.specificRequirements}
                    onChange={e => updateField('specificRequirements', e.target.value)}
                    placeholder="e.g., Multi-currency support, specific DFI templates, Monte Carlo simulation..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Timeline & Additional */}
          {step === 6 && (
            <div className="card-body">
              <h2 className="text-lg font-semibold text-jasper-navy mb-6 pb-3 border-b border-border">
                6. Timeline & Additional Information
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="input-label">When do you need the model?</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {TIMELINE_OPTIONS.map(t => (
                      <label
                        key={t.value}
                        className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                          ${formData.deliveryTimeline === t.value
                            ? 'border-jasper-emerald bg-jasper-emerald/5'
                            : 'border-border hover:border-jasper-slate-light'
                          }`}
                      >
                        <input
                          type="radio"
                          name="timeline"
                          value={t.value}
                          checked={formData.deliveryTimeline === t.value}
                          onChange={e => updateField('deliveryTimeline', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                          ${formData.deliveryTimeline === t.value ? 'border-jasper-emerald' : 'border-jasper-slate-light'}`}>
                          {formData.deliveryTimeline === t.value && <div className="w-2 h-2 rounded-full bg-jasper-emerald" />}
                        </div>
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="input-label">Budget Range (if different from package pricing)</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.budgetRange}
                    onChange={e => updateField('budgetRange', e.target.value)}
                    placeholder="Leave blank if using package pricing"
                  />
                </div>

                <div>
                  <label className="input-label">How did you hear about JASPER?</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.referralSource}
                    onChange={e => updateField('referralSource', e.target.value)}
                    placeholder="e.g., LinkedIn, Google, referral from..."
                  />
                </div>

                <div>
                  <label className="input-label">Any other information you'd like to share?</label>
                  <textarea
                    className="input min-h-[100px]"
                    value={formData.additionalInfo}
                    onChange={e => updateField('additionalInfo', e.target.value)}
                    placeholder="Additional context, questions, or special requirements..."
                  />
                </div>

                {errors.submit && (
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{errors.submit}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="card-footer flex justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 1}
              className="btn-secondary"
            >
              Previous
            </button>
            {step < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Questionnaire'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-jasper-slate-light">
          <p>JASPER Financial Architecture is a division of Gahn Eden (Pty) Ltd.</p>
          <p className="mt-1">All information provided is treated as confidential.</p>
          <p className="mt-3">
            <a href="mailto:models@jasperfinance.org" className="text-jasper-emerald hover:underline">
              models@jasperfinance.org
            </a>
            {' | '}
            <a href="https://jasperfinance.org" className="text-jasper-emerald hover:underline">
              jasperfinance.org
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
