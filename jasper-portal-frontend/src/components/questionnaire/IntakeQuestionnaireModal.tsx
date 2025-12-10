'use client'

import { useState, useEffect } from 'react'
import { questionnaireApi, QuestionnaireData } from '@/lib/api'

interface IntakeQuestionnaireModalProps {
  isOpen: boolean
  onComplete: () => void
}

const STEPS = [
  { id: 1, title: 'Company Information', description: 'Tell us about your company' },
  { id: 2, title: 'Project Details', description: 'Describe your project' },
  { id: 3, title: 'Funding Requirements', description: 'Your funding needs' },
  { id: 4, title: 'Documents Available', description: 'Documentation status' },
  { id: 5, title: 'Impact & ESG', description: 'Social and environmental impact' },
  { id: 6, title: 'Additional Information', description: 'Any other details' },
]

const SDG_OPTIONS = [
  { value: 'sdg1', label: 'SDG 1: No Poverty' },
  { value: 'sdg2', label: 'SDG 2: Zero Hunger' },
  { value: 'sdg3', label: 'SDG 3: Good Health' },
  { value: 'sdg4', label: 'SDG 4: Quality Education' },
  { value: 'sdg5', label: 'SDG 5: Gender Equality' },
  { value: 'sdg6', label: 'SDG 6: Clean Water' },
  { value: 'sdg7', label: 'SDG 7: Affordable Energy' },
  { value: 'sdg8', label: 'SDG 8: Decent Work' },
  { value: 'sdg9', label: 'SDG 9: Industry & Innovation' },
  { value: 'sdg10', label: 'SDG 10: Reduced Inequalities' },
  { value: 'sdg11', label: 'SDG 11: Sustainable Cities' },
  { value: 'sdg12', label: 'SDG 12: Responsible Consumption' },
  { value: 'sdg13', label: 'SDG 13: Climate Action' },
  { value: 'sdg14', label: 'SDG 14: Life Below Water' },
  { value: 'sdg15', label: 'SDG 15: Life on Land' },
  { value: 'sdg16', label: 'SDG 16: Peace & Justice' },
  { value: 'sdg17', label: 'SDG 17: Partnerships' },
]

const DFI_OPTIONS = [
  'IFC (World Bank)',
  'African Development Bank (AfDB)',
  'Development Bank of Southern Africa (DBSA)',
  'Industrial Development Corporation (IDC)',
  'European Investment Bank (EIB)',
  'German Development Bank (KfW)',
  'French Development Agency (AFD)',
  'UK CDC',
  'US DFC',
  'Other',
]

export function IntakeQuestionnaireModal({ isOpen, onComplete }: IntakeQuestionnaireModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<QuestionnaireData>({
    company_description: '',
    years_in_operation: undefined,
    employee_count: '',
    annual_revenue_range: '',
    project_name: '',
    project_description: '',
    project_location: '',
    project_value_estimate: undefined,
    project_timeline: undefined,
    project_readiness: undefined,
    funding_status: undefined,
    funding_amount_required: undefined,
    dfi_experience: false,
    previous_dfi_partners: [],
    preferred_dfis: [],
    has_business_plan: false,
    has_financial_statements: false,
    has_feasibility_study: false,
    has_environmental_assessment: false,
    has_legal_documentation: false,
    additional_documents: '',
    jobs_to_be_created: undefined,
    sdg_alignment: [],
    environmental_benefits: '',
    social_impact_description: '',
    challenges_faced: '',
    specific_assistance_needed: '',
    how_did_you_hear: '',
    additional_comments: '',
    completed: false,
  })

  useEffect(() => {
    if (isOpen) {
      loadExistingData()
    }
  }, [isOpen])

  const loadExistingData = async () => {
    try {
      const existing = await questionnaireApi.get()
      if (existing) {
        setFormData({ ...formData, ...existing })
      }
    } catch (err) {
      // No existing data, start fresh
    }
  }

  const handleInputChange = (field: keyof QuestionnaireData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleMultiSelect = (field: 'sdg_alignment' | 'preferred_dfis' | 'previous_dfi_partners', value: string) => {
    setFormData(prev => {
      const current = prev[field] || []
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) }
      }
      return { ...prev, [field]: [...current, value] }
    })
  }

  const saveProgress = async (markComplete: boolean = false) => {
    setSaving(true)
    setError(null)
    try {
      const dataToSave = { ...formData, completed: markComplete }
      await questionnaireApi.save(dataToSave)
      if (markComplete) {
        onComplete()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save questionnaire')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async () => {
    await saveProgress(false)
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    await saveProgress(true)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-jasper-navy px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Client Intake Questionnaire</h2>
                <p className="text-sm text-gray-300 mt-1">
                  Help us understand your needs better
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">
                  Step {currentStep} of {STEPS.length}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex space-x-2">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={`flex-1 h-2 rounded-full transition-colors ${
                      step.id <= currentStep ? 'bg-jasper-emerald' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <p className="text-white mt-2 font-medium">{STEPS[currentStep - 1].title}</p>
              <p className="text-gray-300 text-sm">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>

          {/* Form content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Description
                  </label>
                  <textarea
                    value={formData.company_description || ''}
                    onChange={(e) => handleInputChange('company_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="Brief description of your company and its main activities..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Years in Operation
                    </label>
                    <input
                      type="number"
                      value={formData.years_in_operation || ''}
                      onChange={(e) => handleInputChange('years_in_operation', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                      placeholder="e.g. 5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Employees
                    </label>
                    <select
                      value={formData.employee_count || ''}
                      onChange={(e) => handleInputChange('employee_count', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    >
                      <option value="">Select range</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Revenue Range (USD)
                  </label>
                  <select
                    value={formData.annual_revenue_range || ''}
                    onChange={(e) => handleInputChange('annual_revenue_range', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                  >
                    <option value="">Select range</option>
                    <option value="< $100K">Less than $100,000</option>
                    <option value="$100K - $500K">$100,000 - $500,000</option>
                    <option value="$500K - $1M">$500,000 - $1 million</option>
                    <option value="$1M - $5M">$1 million - $5 million</option>
                    <option value="$5M - $10M">$5 million - $10 million</option>
                    <option value="$10M - $50M">$10 million - $50 million</option>
                    <option value="> $50M">More than $50 million</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 2: Project Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.project_name || ''}
                    onChange={(e) => handleInputChange('project_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="e.g. Solar Farm Development Phase 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Description
                  </label>
                  <textarea
                    value={formData.project_description || ''}
                    onChange={(e) => handleInputChange('project_description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="Describe the project scope, objectives, and expected outcomes..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Location
                    </label>
                    <input
                      type="text"
                      value={formData.project_location || ''}
                      onChange={(e) => handleInputChange('project_location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                      placeholder="e.g. Gauteng, South Africa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Project Value (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.project_value_estimate || ''}
                      onChange={(e) => handleInputChange('project_value_estimate', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                      placeholder="e.g. 5000000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Timeline
                    </label>
                    <select
                      value={formData.project_timeline || ''}
                      onChange={(e) => handleInputChange('project_timeline', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    >
                      <option value="">Select timeline</option>
                      <option value="urgent">Urgent (less than 1 month)</option>
                      <option value="short">Short (1-3 months)</option>
                      <option value="medium">Medium (3-6 months)</option>
                      <option value="long">Long (6-12 months)</option>
                      <option value="flexible">Flexible (no specific timeline)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Readiness
                    </label>
                    <select
                      value={formData.project_readiness || ''}
                      onChange={(e) => handleInputChange('project_readiness', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    >
                      <option value="">Select readiness level</option>
                      <option value="concept">Concept - Just an idea</option>
                      <option value="feasibility">Feasibility - Doing feasibility studies</option>
                      <option value="planning">Planning - Detailed planning stage</option>
                      <option value="ready_for_funding">Ready for Funding - Ready to approach funders</option>
                      <option value="implementation">Implementation - Already implementing</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Funding Requirements */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Funding Status
                    </label>
                    <select
                      value={formData.funding_status || ''}
                      onChange={(e) => handleInputChange('funding_status', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    >
                      <option value="">Select status</option>
                      <option value="self_funded">Self-funded</option>
                      <option value="seeking_funding">Seeking funding</option>
                      <option value="partially_funded">Partially funded</option>
                      <option value="fully_funded">Fully funded</option>
                      <option value="not_applicable">Not applicable</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funding Amount Required (USD)
                    </label>
                    <input
                      type="number"
                      value={formData.funding_amount_required || ''}
                      onChange={(e) => handleInputChange('funding_amount_required', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                      placeholder="e.g. 2000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.dfi_experience || false}
                      onChange={(e) => handleInputChange('dfi_experience', e.target.checked)}
                      className="w-4 h-4 text-jasper-emerald border-gray-300 rounded focus:ring-jasper-emerald"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Has your company worked with Development Finance Institutions (DFIs) before?
                    </span>
                  </label>
                </div>

                {formData.dfi_experience && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous DFI Partners (select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {DFI_OPTIONS.map((dfi) => (
                        <label key={dfi} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(formData.previous_dfi_partners || []).includes(dfi)}
                            onChange={() => handleMultiSelect('previous_dfi_partners', dfi)}
                            className="w-4 h-4 text-jasper-emerald border-gray-300 rounded focus:ring-jasper-emerald"
                          />
                          <span className="text-sm text-gray-700">{dfi}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred DFIs to Target (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {DFI_OPTIONS.map((dfi) => (
                      <label key={dfi} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData.preferred_dfis || []).includes(dfi)}
                          onChange={() => handleMultiSelect('preferred_dfis', dfi)}
                          className="w-4 h-4 text-jasper-emerald border-gray-300 rounded focus:ring-jasper-emerald"
                        />
                        <span className="text-sm text-gray-700">{dfi}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents Available */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Please indicate which documents you currently have available. This helps us understand
                  your readiness level and what support you may need.
                </p>

                <div className="space-y-3">
                  {[
                    { field: 'has_business_plan', label: 'Business Plan' },
                    { field: 'has_financial_statements', label: 'Financial Statements (last 3 years)' },
                    { field: 'has_feasibility_study', label: 'Feasibility Study' },
                    { field: 'has_environmental_assessment', label: 'Environmental Impact Assessment' },
                    { field: 'has_legal_documentation', label: 'Legal Documentation (incorporation, permits, etc.)' },
                  ].map(({ field, label }) => (
                    <label key={field} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData[field as keyof QuestionnaireData] as boolean || false}
                        onChange={(e) => handleInputChange(field as keyof QuestionnaireData, e.target.checked)}
                        className="w-5 h-5 text-jasper-emerald border-gray-300 rounded focus:ring-jasper-emerald"
                      />
                      <span className="text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Other Documents Available
                  </label>
                  <textarea
                    value={formData.additional_documents || ''}
                    onChange={(e) => handleInputChange('additional_documents', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="List any other relevant documents you have..."
                  />
                </div>
              </div>
            )}

            {/* Step 5: Impact & ESG */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jobs to be Created
                  </label>
                  <input
                    type="number"
                    value={formData.jobs_to_be_created || ''}
                    onChange={(e) => handleInputChange('jobs_to_be_created', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="Estimated number of jobs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UN Sustainable Development Goals Alignment (select all that apply)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {SDG_OPTIONS.map((sdg) => (
                      <label key={sdg.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={(formData.sdg_alignment || []).includes(sdg.value)}
                          onChange={() => handleMultiSelect('sdg_alignment', sdg.value)}
                          className="w-4 h-4 text-jasper-emerald border-gray-300 rounded focus:ring-jasper-emerald"
                        />
                        <span className="text-sm text-gray-700">{sdg.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Environmental Benefits
                  </label>
                  <textarea
                    value={formData.environmental_benefits || ''}
                    onChange={(e) => handleInputChange('environmental_benefits', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="Describe any environmental benefits of your project..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Social Impact Description
                  </label>
                  <textarea
                    value={formData.social_impact_description || ''}
                    onChange={(e) => handleInputChange('social_impact_description', e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="Describe the social impact of your project..."
                  />
                </div>
              </div>
            )}

            {/* Step 6: Additional Information */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Main Challenges Faced
                  </label>
                  <textarea
                    value={formData.challenges_faced || ''}
                    onChange={(e) => handleInputChange('challenges_faced', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="What are the main challenges you're currently facing?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Assistance Needed
                  </label>
                  <textarea
                    value={formData.specific_assistance_needed || ''}
                    onChange={(e) => handleInputChange('specific_assistance_needed', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="What specific assistance do you need from JASPER?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    How Did You Hear About Us?
                  </label>
                  <select
                    value={formData.how_did_you_hear || ''}
                    onChange={(e) => handleInputChange('how_did_you_hear', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                  >
                    <option value="">Select an option</option>
                    <option value="website">Website</option>
                    <option value="referral">Referral from a contact</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="conference">Conference/Event</option>
                    <option value="search">Search engine</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Comments
                  </label>
                  <textarea
                    value={formData.additional_comments || ''}
                    onChange={(e) => handleInputChange('additional_comments', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jasper-emerald focus:border-transparent"
                    placeholder="Any other information you'd like to share..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer with navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  disabled={saving}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => saveProgress(false)}
                disabled={saving}
                className="px-4 py-2 text-jasper-emerald hover:text-jasper-emerald/80 font-medium transition-colors"
              >
                {saving ? 'Saving...' : 'Save Progress'}
              </button>

              {currentStep < STEPS.length ? (
                <button
                  onClick={handleNext}
                  disabled={saving}
                  className="px-6 py-2 bg-jasper-emerald text-white rounded-lg hover:bg-jasper-emerald/90 font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2 bg-jasper-emerald text-white rounded-lg hover:bg-jasper-emerald/90 font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Submitting...' : 'Submit Questionnaire'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
