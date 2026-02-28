import React from 'react';
import styles from './Input.module.css';

export type InputVariant = 'default' | 'filled';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: 'small' | 'medium' | 'large';
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  variant = 'default',
  size = 'medium',
  label,
  error,
  icon,
  fullWidth = false,
  className,
  ...props
}) => {
  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    styles.input,
    styles[variant],
    styles[size],
    error && styles.error,
    icon && styles.hasIcon,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputWrapper}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input className={inputClasses} {...props} />
      </div>
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  variant = 'default',
  label,
  error,
  fullWidth = false,
  className,
  ...props
}) => {
  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
  ].filter(Boolean).join(' ');

  const textAreaClasses = [
    styles.textarea,
    styles[variant],
    error && styles.error,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <textarea className={textAreaClasses} {...props} />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
};
