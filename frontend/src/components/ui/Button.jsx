import React from 'react';
import { motion } from 'framer-motion';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon = null,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    onClick,
    type = 'button',
    className = '',
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
        secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
        outline: 'border-2 border-gray-400 dark:border-gray-500 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500 text-gray-700 dark:text-gray-300',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 text-gray-700 dark:text-gray-300',
        danger: 'bg-error text-white hover:bg-red-600 focus:ring-error shadow-sm',
        success: 'bg-success text-white hover:bg-green-600 focus:ring-success shadow-sm',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2.5 text-base',
        lg: 'px-6 py-3 text-lg',
        xl: 'px-8 py-4 text-xl',
    };

    const buttonClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
        <motion.button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || loading}
            whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            {...props}
        >
            {loading ? (
                <>
                    <div className="spinner" />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {icon && iconPosition === 'left' && <span className="inline-flex">{icon}</span>}
                    {children}
                    {icon && iconPosition === 'right' && <span className="inline-flex">{icon}</span>}
                </>
            )}
        </motion.button>
    );
};

export default Button;
