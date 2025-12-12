import { useState, useCallback, useMemo } from 'react'
import { isValidEmail, isValidPhone, INPUT_LIMITS } from '@/lib/sanitize'

/**
 * Validation rule types
 */
type ValidationRule =
  | { type: 'required'; message?: string }
  | { type: 'email'; message?: string }
  | { type: 'phone'; message?: string }
  | { type: 'minLength'; value: number; message?: string }
  | { type: 'maxLength'; value: number; message?: string }
  | { type: 'min'; value: number; message?: string }
  | { type: 'max'; value: number; message?: string }
  | { type: 'pattern'; value: RegExp; message?: string }
  | { type: 'url'; message?: string }
  | { type: 'custom'; validate: (value: any) => boolean; message: string }

/**
 * Field configuration
 */
interface FieldConfig {
  rules: ValidationRule[]
  validateOnChange?: boolean
  validateOnBlur?: boolean
}

/**
 * Form configuration
 */
type FormConfig<T extends Record<string, any>> = {
  [K in keyof T]?: FieldConfig
}

/**
 * Field state
 */
interface FieldState {
  value: any
  error: string | null
  touched: boolean
  dirty: boolean
}

/**
 * Hook return type
 */
interface UseFormValidationReturn<T extends Record<string, any>> {
  values: T
  errors: Record<keyof T, string | null>
  touched: Record<keyof T, boolean>
  isValid: boolean
  isDirty: boolean
  setValue: (field: keyof T, value: any) => void
  setValues: (values: Partial<T>) => void
  setTouched: (field: keyof T) => void
  validateField: (field: keyof T) => string | null
  validateForm: () => boolean
  resetForm: () => void
  getFieldProps: (field: keyof T) => {
    value: any
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
    onBlur: () => void
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }
}

/**
 * Default error messages
 */
const defaultMessages: Record<string, string> = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  minLength: 'This field is too short',
  maxLength: 'This field is too long',
  min: 'Value is too small',
  max: 'Value is too large',
  pattern: 'Invalid format',
  url: 'Please enter a valid URL',
}

/**
 * Validate a single value against rules
 */
function validateValue(value: any, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          return rule.message || defaultMessages.required
        }
        break

      case 'email':
        if (value && !isValidEmail(value)) {
          return rule.message || defaultMessages.email
        }
        break

      case 'phone':
        if (value && !isValidPhone(value)) {
          return rule.message || defaultMessages.phone
        }
        break

      case 'minLength':
        if (value && String(value).length < rule.value) {
          return rule.message || `Must be at least ${rule.value} characters`
        }
        break

      case 'maxLength':
        if (value && String(value).length > rule.value) {
          return rule.message || `Must be ${rule.value} characters or less`
        }
        break

      case 'min':
        if (value !== '' && value !== undefined && Number(value) < rule.value) {
          return rule.message || `Must be at least ${rule.value}`
        }
        break

      case 'max':
        if (value !== '' && value !== undefined && Number(value) > rule.value) {
          return rule.message || `Must be ${rule.value} or less`
        }
        break

      case 'pattern':
        if (value && !rule.value.test(String(value))) {
          return rule.message || defaultMessages.pattern
        }
        break

      case 'url':
        if (value) {
          try {
            const url = new URL(value.startsWith('http') ? value : `https://${value}`)
            if (!['http:', 'https:'].includes(url.protocol)) {
              return rule.message || defaultMessages.url
            }
          } catch {
            return rule.message || defaultMessages.url
          }
        }
        break

      case 'custom':
        if (!rule.validate(value)) {
          return rule.message
        }
        break
    }
  }

  return null
}

/**
 * Form validation hook with real-time feedback
 */
export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  config: FormConfig<T>
): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues)
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>(
    Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof T, boolean>)
  )
  const [errors, setErrorsState] = useState<Record<keyof T, string | null>>(
    Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<keyof T, string | null>)
  )

  const validateField = useCallback((field: keyof T): string | null => {
    const fieldConfig = config[field]
    if (!fieldConfig) return null

    const error = validateValue(values[field], fieldConfig.rules)
    setErrorsState(prev => ({ ...prev, [field]: error }))
    return error
  }, [config, values])

  const setValue = useCallback((field: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }))

    const fieldConfig = config[field]
    if (fieldConfig?.validateOnChange !== false) {
      const error = validateValue(value, fieldConfig?.rules || [])
      setErrorsState(prev => ({ ...prev, [field]: error }))
    }
  }, [config])

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }))
  }, [])

  const setTouched = useCallback((field: keyof T) => {
    setTouchedState(prev => ({ ...prev, [field]: true }))

    const fieldConfig = config[field]
    if (fieldConfig?.validateOnBlur !== false) {
      validateField(field)
    }
  }, [config, validateField])

  const validateForm = useCallback((): boolean => {
    let isValid = true
    const newErrors: Record<string, string | null> = {}

    for (const field of Object.keys(config) as (keyof T)[]) {
      const fieldConfig = config[field]
      if (fieldConfig) {
        const error = validateValue(values[field], fieldConfig.rules)
        newErrors[field as string] = error
        if (error) isValid = false
      }
    }

    setErrorsState(prev => ({ ...prev, ...newErrors }))
    setTouchedState(prev => {
      const newTouched = { ...prev }
      for (const field of Object.keys(config)) {
        newTouched[field as keyof T] = true
      }
      return newTouched
    })

    return isValid
  }, [config, values])

  const resetForm = useCallback(() => {
    setValuesState(initialValues)
    setTouchedState(
      Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<keyof T, boolean>)
    )
    setErrorsState(
      Object.keys(initialValues).reduce((acc, key) => ({ ...acc, [key]: null }), {} as Record<keyof T, string | null>)
    )
  }, [initialValues])

  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValue(field, e.target.value)
    },
    onBlur: () => setTouched(field),
    'aria-invalid': touched[field] && !!errors[field],
    'aria-describedby': errors[field] ? `${String(field)}-error` : undefined,
  }), [values, touched, errors, setValue, setTouched])

  const isValid = useMemo(() => {
    return Object.values(errors).every(error => error === null)
  }, [errors])

  const isDirty = useMemo(() => {
    return Object.keys(initialValues).some(key => values[key as keyof T] !== initialValues[key as keyof T])
  }, [initialValues, values])

  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    setValue,
    setValues,
    setTouched,
    validateField,
    validateForm,
    resetForm,
    getFieldProps,
  }
}

/**
 * Pre-configured validation rules for common fields
 */
export const validationRules = {
  required: (message?: string): ValidationRule => ({ type: 'required', message }),
  email: (message?: string): ValidationRule => ({ type: 'email', message }),
  phone: (message?: string): ValidationRule => ({ type: 'phone', message }),
  minLength: (value: number, message?: string): ValidationRule => ({ type: 'minLength', value, message }),
  maxLength: (value: number, message?: string): ValidationRule => ({ type: 'maxLength', value, message }),
  min: (value: number, message?: string): ValidationRule => ({ type: 'min', value, message }),
  max: (value: number, message?: string): ValidationRule => ({ type: 'max', value, message }),
  pattern: (value: RegExp, message?: string): ValidationRule => ({ type: 'pattern', value, message }),
  url: (message?: string): ValidationRule => ({ type: 'url', message }),
  custom: (validate: (value: any) => boolean, message: string): ValidationRule => ({ type: 'custom', validate, message }),

  // Preset rules based on INPUT_LIMITS
  name: (): ValidationRule[] => [
    { type: 'required' },
    { type: 'maxLength', value: INPUT_LIMITS.name },
  ],
  optionalName: (): ValidationRule[] => [
    { type: 'maxLength', value: INPUT_LIMITS.name },
  ],
  emailField: (): ValidationRule[] => [
    { type: 'required' },
    { type: 'email' },
    { type: 'maxLength', value: INPUT_LIMITS.email },
  ],
  optionalEmail: (): ValidationRule[] => [
    { type: 'email' },
    { type: 'maxLength', value: INPUT_LIMITS.email },
  ],
  phoneField: (): ValidationRule[] => [
    { type: 'phone' },
    { type: 'maxLength', value: INPUT_LIMITS.phone },
  ],
  description: (): ValidationRule[] => [
    { type: 'maxLength', value: INPUT_LIMITS.description },
  ],
  notes: (): ValidationRule[] => [
    { type: 'maxLength', value: INPUT_LIMITS.notes },
  ],
  urlField: (): ValidationRule[] => [
    { type: 'url' },
    { type: 'maxLength', value: INPUT_LIMITS.url },
  ],
}
