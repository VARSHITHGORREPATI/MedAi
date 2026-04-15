import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

const Input = forwardRef(({
    label,
    error,
    helperText,
    icon,
    iconPosition = 'left',
    type = 'text',
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const inputClasses = `
    w-full px-4 py-2.5 bg-white dark:bg-gray-800 border rounded-lg
    text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:border-transparent
    transition-all duration-200
    ${error ? 'border-error focus:ring-error' : 'border-gray-400 dark:border-gray-500 focus:ring-primary-500'}
    ${icon ? (iconPosition === 'left' ? 'pl-11' : 'pr-11') : ''}
    ${className}
  `;

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && iconPosition === 'left' && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        {icon}
                    </div>
                )}

                <motion.input
                    ref={ref}
                    type={type}
                    className={inputClasses}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    {...props}
                />

                {icon && iconPosition === 'right' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                        {icon}
                    </div>
                )}
            </div>

            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1.5 text-sm text-error"
                >
                    {error}
                </motion.p>
            )}

            {helperText && !error && (
                <p className="mt-1.5 text-sm text-neutral-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
