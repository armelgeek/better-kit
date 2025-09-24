import React, { useState } from 'react';
import type { AdminComponentProps, AdminFormConfig } from '../types';

export interface AdminFormProps extends AdminComponentProps {
  /**
   * Initial data for the form
   */
  initialData?: Record<string, any>;

  /**
   * Form configuration
   */
  config?: AdminFormConfig;

  /**
   * Form mode
   */
  mode?: 'create' | 'edit';

  /**
   * Form submission handler
   */
  onSubmit?: (data: Record<string, any>) => void | Promise<void>;

  /**
   * Form cancellation handler
   */
  onCancel?: () => void;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Form validation errors
   */
  errors?: Record<string, string>;

  /**
   * Custom CSS classes
   */
  className?: string;
}

/**
 * Admin Form Component
 * 
 * Provides a ready-to-use form for admin interfaces
 * with automatic field generation from resource schema
 */
export function AdminForm({
  resource,
  initialData = {},
  config = {},
  mode = 'create',
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  className = '',
  ...props
}: AdminFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const {
    fields = [],
    layout = 'vertical',
    validation = true
  } = config;

  // Handle form field changes
  const handleFieldChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    
    // Clear validation error for this field
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    if (!validation) return true;

    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      if (field.required && (!formData[field.key] || formData[field.key] === '')) {
        newErrors[field.key] = `${field.label} is required`;
      }

      // Add more validation rules as needed
      if (field.type === 'email' && formData[field.key]) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData[field.key])) {
          newErrors[field.key] = 'Please enter a valid email address';
        }
      }
    });

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validation && !validateForm()) {
      return;
    }

    try {
      await onSubmit?.(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  // Render form field based on type
  const renderField = (field: NonNullable<AdminFormConfig['fields']>[0]) => {
    const fieldError = validationErrors[field.key] || errors[field.key];
    const value = formData[field.key] || '';

    const commonProps = {
      id: field.key,
      name: field.key,
      required: field.required,
      className: `admin-input ${fieldError ? 'admin-input--error' : ''}`
    };

    let inputElement: React.ReactNode;

    switch (field.type) {
      case 'textarea':
        inputElement = (
          <textarea
            {...commonProps}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            rows={4}
          />
        );
        break;

      case 'select':
        inputElement = (
          <select
            {...commonProps}
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;

      case 'checkbox':
        inputElement = (
          <input
            {...commonProps}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
            className="admin-checkbox"
          />
        );
        break;

      case 'date':
        inputElement = (
          <input
            {...commonProps}
            type="date"
            value={value instanceof Date ? value.toISOString().split('T')[0] : value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        break;

      case 'number':
        inputElement = (
          <input
            {...commonProps}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.key, Number(e.target.value))}
          />
        );
        break;

      case 'password':
        inputElement = (
          <input
            {...commonProps}
            type="password"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        break;

      case 'email':
        inputElement = (
          <input
            {...commonProps}
            type="email"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        break;

      default: // text
        inputElement = (
          <input
            {...commonProps}
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          />
        );
        break;
    }

    return (
      <div key={field.key} className={`admin-form__field ${layout === 'horizontal' ? 'admin-form__field--horizontal' : ''}`}>
        <label htmlFor={field.key} className="admin-form__label">
          {field.label}
          {field.required && <span className="admin-form__required">*</span>}
        </label>
        <div className="admin-form__input-container">
          {inputElement}
          {fieldError && (
            <div className="admin-form__error">{fieldError}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`admin-form ${className}`}>
      <div className="admin-form__header">
        <h2 className="admin-form__title">
          {mode === 'create' ? `Create ${resource}` : `Edit ${resource}`}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="admin-form__form">
        <div className="admin-form__fields">
          {fields.map(renderField)}
        </div>

        <div className="admin-form__actions">
          <button
            type="button"
            onClick={onCancel}
            className="admin-button admin-button--secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="admin-button admin-button--primary"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="admin-spinner"></span>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </span>
            ) : (
              mode === 'create' ? `Create ${resource}` : `Update ${resource}`
            )}
          </button>
        </div>
      </form>

      {/* Default styles are provided via CSS classes */}
    </div>
  );
}