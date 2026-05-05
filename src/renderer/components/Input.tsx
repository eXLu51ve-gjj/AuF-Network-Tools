import React, { forwardRef, useState } from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  styled,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  variant?: 'outlined' | 'filled' | 'standard';
  type?: 'text' | 'password' | 'number' | 'email' | 'url';
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  compact?: boolean;
}

const StyledTextField = styled(TextField)(({ theme }) => ({
  // OLED theme specific styles
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}40`,
    },
    
    '&.Mui-error': {
      boxShadow: `0 0 0 2px ${theme.palette.error.main}40`,
    },
  },
  
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transition: 'border-color 0.2s ease-in-out',
  },
  
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.primary.main,
    borderWidth: '1px',
  },
  
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
  
  '& .MuiInputBase-input': {
    color: theme.palette.text.primary,
    padding: '12px 14px',
    fontSize: '0.875rem',
    
    '&::placeholder': {
      color: 'rgba(255, 255, 255, 0.4)',
      opacity: 1,
    },
  },
  
  '& .MuiFormHelperText-root': {
    marginLeft: 0,
    marginTop: '4px',
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.6)',
    
    '&.Mui-error': {
      color: theme.palette.error.main,
    },
  },
  
  // Compact variant
  '&.MuiInput-compact': {
    '& .MuiInputBase-input': {
      padding: '8px 12px',
      fontSize: '0.8125rem',
    },
    
    '& .MuiInputLabel-root': {
      fontSize: '0.8125rem',
      transform: 'translate(14px, 10px) scale(1)',
      
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px, -9px) scale(0.75)',
      },
    },
  },
  
  // Disabled state
  '& .Mui-disabled': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
}));

export const Input = forwardRef<HTMLDivElement, InputProps>(({
  variant = 'outlined',
  type = 'text',
  label,
  placeholder,
  helperText,
  error = false,
  fullWidth = true,
  startIcon,
  endIcon,
  showPasswordToggle = false,
  compact = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  const adornments = {
    startAdornment: startIcon ? (
      <InputAdornment position="start">{startIcon}</InputAdornment>
    ) : undefined,
    endAdornment: (endIcon || (type === 'password' && showPasswordToggle)) ? (
      <InputAdornment position="end">
        {type === 'password' && showPasswordToggle ? (
          <IconButton
            aria-label="toggle password visibility"
            onClick={handleTogglePassword}
            edge="end"
            size="small"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        ) : (
          endIcon
        )}
      </InputAdornment>
    ) : undefined,
  };
  
  return (
    <StyledTextField
      ref={ref}
      variant={variant}
      type={inputType}
      label={label}
      placeholder={placeholder}
      helperText={helperText}
      error={error}
      fullWidth={fullWidth}
      InputProps={adornments}
      className={compact ? 'MuiInput-compact' : ''}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;