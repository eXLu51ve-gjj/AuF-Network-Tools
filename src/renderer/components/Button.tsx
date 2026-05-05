import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps, styled } from '@mui/material';

export interface ButtonProps extends MuiButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  loading?: boolean;
}

const StyledButton = styled(MuiButton)(({ theme }) => ({
  // OLED theme specific styles
  borderRadius: '8px',
  fontWeight: 500,
  textTransform: 'none' as const,
  transition: 'all 0.2s ease-in-out',
  
  // Size variants
  '&.MuiButton-sizeSmall': {
    padding: '6px 12px',
    fontSize: '0.75rem',
    minHeight: '32px',
  },
  '&.MuiButton-sizeMedium': {
    padding: '8px 16px',
    fontSize: '0.875rem',
    minHeight: '36px',
  },
  '&.MuiButton-sizeLarge': {
    padding: '12px 24px',
    fontSize: '1rem',
    minHeight: '44px',
  },
  
  // Contained variant - OLED glow effect
  '&.MuiButton-contained': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
      transform: 'translateY(0)',
    },
  },
  
  // Outlined variant - subtle border
  '&.MuiButton-outlined': {
    borderWidth: '1px',
    '&:hover': {
      borderWidth: '1px',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  
  // Text variant - minimal
  '&.MuiButton-text': {
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
  },
  
  // Primary color - cyan glow
  '&.MuiButton-containedPrimary': {
    '&:hover': {
      boxShadow: `0 0 12px ${theme.palette.primary.main}40`,
    },
  },
  
  // Secondary color - magenta glow
  '&.MuiButton-containedSecondary': {
    '&:hover': {
      boxShadow: `0 0 12px ${theme.palette.secondary.main}40`,
    },
  },
  
  // Disabled state
  '&.Mui-disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  
  // Loading state
  '&.MuiButton-loading': {
    position: 'relative',
    color: 'transparent !important',
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '16px',
      height: '16px',
      top: '50%',
      left: '50%',
      marginTop: '-8px',
      marginLeft: '-8px',
      borderRadius: '50%',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTopColor: theme.palette.primary.main,
      animation: 'spin 1s linear infinite',
    },
  },
}));

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'contained',
  color = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  disabled,
  ...props
}) => {
  return (
    <StyledButton
      variant={variant}
      color={color}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled || loading}
      className={loading ? 'MuiButton-loading' : ''}
      {...props}
    >
      {children}
    </StyledButton>
  );
};

// Add CSS animation for loading spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Button;