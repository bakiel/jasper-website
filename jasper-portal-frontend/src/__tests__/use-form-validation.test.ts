import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation, validationRules } from '../hooks/use-form-validation'

describe('useFormValidation', () => {
  const initialValues = {
    name: '',
    email: '',
    phone: '',
    age: '',
    website: '',
    description: '',
  }

  const config = {
    name: {
      rules: [
        { type: 'required' as const },
        { type: 'minLength' as const, value: 2 },
        { type: 'maxLength' as const, value: 100 },
      ],
    },
    email: {
      rules: [
        { type: 'required' as const },
        { type: 'email' as const },
      ],
    },
    phone: {
      rules: [
        { type: 'phone' as const },
      ],
    },
    age: {
      rules: [
        { type: 'min' as const, value: 18 },
        { type: 'max' as const, value: 120 },
      ],
    },
    website: {
      rules: [
        { type: 'url' as const },
      ],
    },
  }

  describe('initial state', () => {
    it('should initialize with provided values', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      expect(result.current.values).toEqual(initialValues)
    })

    it('should start with no errors', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      Object.values(result.current.errors).forEach(error => {
        expect(error).toBeNull()
      })
    })

    it('should start with no touched fields', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      Object.values(result.current.touched).forEach(touched => {
        expect(touched).toBe(false)
      })
    })

    it('should report isValid as true initially (no validation run yet)', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      expect(result.current.isValid).toBe(true)
    })

    it('should report isDirty as false initially', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      expect(result.current.isDirty).toBe(false)
    })
  })

  describe('setValue', () => {
    it('should update a single value', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('name', 'John Doe')
      })

      expect(result.current.values.name).toBe('John Doe')
    })

    it('should mark form as dirty after value change', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('name', 'John')
      })

      expect(result.current.isDirty).toBe(true)
    })

    it('should validate on change by default', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('name', 'J')
      })

      expect(result.current.errors.name).toBe('Must be at least 2 characters')
    })
  })

  describe('setValues', () => {
    it('should update multiple values at once', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValues({ name: 'John', email: 'john@example.com' })
      })

      expect(result.current.values.name).toBe('John')
      expect(result.current.values.email).toBe('john@example.com')
    })
  })

  describe('setTouched', () => {
    it('should mark a field as touched', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setTouched('name')
      })

      expect(result.current.touched.name).toBe(true)
    })

    it('should trigger validation on blur', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setTouched('email')
      })

      expect(result.current.errors.email).toBe('This field is required')
    })
  })

  describe('validateField', () => {
    it('should validate required fields', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        const error = result.current.validateField('name')
        expect(error).toBe('This field is required')
      })
    })

    it('should validate email format', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('email', 'invalid-email')
      })

      expect(result.current.errors.email).toBe('Please enter a valid email address')
    })

    it('should accept valid email', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('email', 'test@example.com')
      })

      expect(result.current.errors.email).toBeNull()
    })

    it('should validate phone format', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('phone', 'invalid')
      })

      expect(result.current.errors.phone).toBe('Please enter a valid phone number')
    })

    it('should validate min value', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('age', '15')
      })

      expect(result.current.errors.age).toBe('Must be at least 18')
    })

    it('should validate max value', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('age', '150')
      })

      expect(result.current.errors.age).toBe('Must be 120 or less')
    })

    it('should validate URL format', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('website', 'not a url !!!')
      })

      expect(result.current.errors.website).toBe('Please enter a valid URL')
    })

    it('should accept valid URL', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('website', 'https://example.com')
      })

      expect(result.current.errors.website).toBeNull()
    })
  })

  describe('validateForm', () => {
    it('should validate all fields and return false for invalid form', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      let isValid: boolean = false
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(false)
      expect(result.current.errors.name).toBe('This field is required')
      expect(result.current.errors.email).toBe('This field is required')
    })

    it('should return true for valid form', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('name', 'John Doe')
        result.current.setValue('email', 'john@example.com')
      })

      let isValid: boolean = false
      act(() => {
        isValid = result.current.validateForm()
      })

      expect(isValid).toBe(true)
    })

    it('should mark all fields as touched after validation', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.validateForm()
      })

      expect(result.current.touched.name).toBe(true)
      expect(result.current.touched.email).toBe(true)
    })
  })

  describe('resetForm', () => {
    it('should reset values to initial state', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('name', 'John')
        result.current.setValue('email', 'john@test.com')
        result.current.resetForm()
      })

      expect(result.current.values).toEqual(initialValues)
    })

    it('should clear all errors', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.validateForm()
        result.current.resetForm()
      })

      Object.values(result.current.errors).forEach(error => {
        expect(error).toBeNull()
      })
    })

    it('should reset touched state', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setTouched('name')
        result.current.setTouched('email')
        result.current.resetForm()
      })

      Object.values(result.current.touched).forEach(touched => {
        expect(touched).toBe(false)
      })
    })

    it('should reset isDirty to false', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setValue('name', 'John')
        result.current.resetForm()
      })

      expect(result.current.isDirty).toBe(false)
    })
  })

  describe('getFieldProps', () => {
    it('should return value for the field', () => {
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, config))

      const props = result.current.getFieldProps('name')
      expect(props.value).toBe('John')
    })

    it('should return onChange handler', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      const props = result.current.getFieldProps('name')
      expect(typeof props.onChange).toBe('function')
    })

    it('should return onBlur handler', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      const props = result.current.getFieldProps('name')
      expect(typeof props.onBlur).toBe('function')
    })

    it('should return aria-invalid false when no error', () => {
      const { result } = renderHook(() => useFormValidation({ name: 'John' }, config))

      const props = result.current.getFieldProps('name')
      expect(props['aria-invalid']).toBe(false)
    })

    it('should return aria-invalid true when touched with error', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setTouched('name')
      })

      const props = result.current.getFieldProps('name')
      expect(props['aria-invalid']).toBe(true)
    })

    it('should return aria-describedby when there is an error', () => {
      const { result } = renderHook(() => useFormValidation(initialValues, config))

      act(() => {
        result.current.setTouched('name')
      })

      const props = result.current.getFieldProps('name')
      expect(props['aria-describedby']).toBe('name-error')
    })
  })

  describe('custom validation', () => {
    it('should support custom validation functions', () => {
      const customConfig = {
        password: {
          rules: [
            { type: 'required' as const },
            {
              type: 'custom' as const,
              validate: (value: string) => value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value),
              message: 'Password must be 8+ chars with uppercase and number',
            },
          ],
        },
      }

      const { result } = renderHook(() => useFormValidation({ password: '' }, customConfig))

      act(() => {
        result.current.setValue('password', 'weak')
      })

      expect(result.current.errors.password).toBe('Password must be 8+ chars with uppercase and number')

      act(() => {
        result.current.setValue('password', 'StrongPass1')
      })

      expect(result.current.errors.password).toBeNull()
    })
  })

  describe('pattern validation', () => {
    it('should validate against regex pattern', () => {
      const patternConfig = {
        code: {
          rules: [
            { type: 'pattern' as const, value: /^[A-Z]{3}-\d{4}$/, message: 'Must be format XXX-0000' },
          ],
        },
      }

      const { result } = renderHook(() => useFormValidation({ code: '' }, patternConfig))

      act(() => {
        result.current.setValue('code', 'invalid')
      })

      expect(result.current.errors.code).toBe('Must be format XXX-0000')

      act(() => {
        result.current.setValue('code', 'ABC-1234')
      })

      expect(result.current.errors.code).toBeNull()
    })
  })
})

describe('validationRules helpers', () => {
  it('should create required rule', () => {
    const rule = validationRules.required()
    expect(rule).toEqual({ type: 'required', message: undefined })
  })

  it('should create required rule with custom message', () => {
    const rule = validationRules.required('Name is required')
    expect(rule).toEqual({ type: 'required', message: 'Name is required' })
  })

  it('should create email rule', () => {
    const rule = validationRules.email()
    expect(rule).toEqual({ type: 'email', message: undefined })
  })

  it('should create minLength rule', () => {
    const rule = validationRules.minLength(5)
    expect(rule).toEqual({ type: 'minLength', value: 5, message: undefined })
  })

  it('should create maxLength rule', () => {
    const rule = validationRules.maxLength(100)
    expect(rule).toEqual({ type: 'maxLength', value: 100, message: undefined })
  })

  it('should create min rule', () => {
    const rule = validationRules.min(18)
    expect(rule).toEqual({ type: 'min', value: 18, message: undefined })
  })

  it('should create max rule', () => {
    const rule = validationRules.max(100)
    expect(rule).toEqual({ type: 'max', value: 100, message: undefined })
  })

  it('should create pattern rule', () => {
    const regex = /^[A-Z]+$/
    const rule = validationRules.pattern(regex)
    expect(rule).toEqual({ type: 'pattern', value: regex, message: undefined })
  })

  it('should create url rule', () => {
    const rule = validationRules.url()
    expect(rule).toEqual({ type: 'url', message: undefined })
  })

  it('should create custom rule', () => {
    const validate = (v: any) => v === 'test'
    const rule = validationRules.custom(validate, 'Must be "test"')
    expect(rule.type).toBe('custom')
    expect(rule.message).toBe('Must be "test"')
  })

  describe('preset rules', () => {
    it('should return name validation rules', () => {
      const rules = validationRules.name()
      expect(rules).toHaveLength(2)
      expect(rules[0].type).toBe('required')
      expect(rules[1].type).toBe('maxLength')
    })

    it('should return optional name validation rules', () => {
      const rules = validationRules.optionalName()
      expect(rules).toHaveLength(1)
      expect(rules[0].type).toBe('maxLength')
    })

    it('should return email field validation rules', () => {
      const rules = validationRules.emailField()
      expect(rules).toHaveLength(3)
      expect(rules[0].type).toBe('required')
      expect(rules[1].type).toBe('email')
      expect(rules[2].type).toBe('maxLength')
    })

    it('should return phone field validation rules', () => {
      const rules = validationRules.phoneField()
      expect(rules).toHaveLength(2)
      expect(rules[0].type).toBe('phone')
      expect(rules[1].type).toBe('maxLength')
    })

    it('should return url field validation rules', () => {
      const rules = validationRules.urlField()
      expect(rules).toHaveLength(2)
      expect(rules[0].type).toBe('url')
      expect(rules[1].type).toBe('maxLength')
    })
  })
})
