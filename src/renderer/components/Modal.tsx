import React from 'react';
import {
  Modal as MuiModal,
  ModalProps as MuiModalProps,
  Box,
  IconButton,
  Typography,
  styled,
} from '@mui/material';
import { Close } from '@mui/icons-material';

export interface ModalProps extends Omit<MuiModalProps, 'title'> {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  backdropBlur?: boolean;
  compact?: boolean;
}

const ModalBackdrop = styled(Box)(({ theme }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: theme.zIndex.modal,
  
  // Backdrop blur effect
  '&.MuiModal-backdropBlur': {
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
}));

const ModalContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  
  // Size variants
  '&.MuiModal-sizeXs': {
    width: '400px',
    maxWidth: '90vw',
  },
  '&.MuiModal-sizeSm': {
    width: '500px',
    maxWidth: '90vw',
  },
  '&.MuiModal-sizeMd': {
    width: '600px',
    maxWidth: '90vw',
  },
  '&.MuiModal-sizeLg': {
    width: '800px',
    maxWidth: '90vw',
  },
  '&.MuiModal-sizeXl': {
    width: '1000px',
    maxWidth: '90vw',
  },
  '&.MuiModal-sizeFull': {
    width: '95vw',
    height: '95vh',
  },
  
  // Compact variant
  '&.MuiModal-compact': {
    '& .MuiModal-header': {
      padding: '12px 16px',
    },
    '& .MuiModal-content': {
      padding: '16px',
    },
    '& .MuiModal-footer': {
      padding: '12px 16px',
    },
  },
}));

const ModalHeader = styled(Box)(({ theme }) => ({
  padding: '20px 24px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: 0,
  
  '& .MuiModal-title': {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
    margin: 0,
  },
  
  '& .MuiModal-subtitle': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginTop: '4px',
  },
}));

const ModalContent = styled(Box)(({ theme }) => ({
  padding: '24px',
  flex: 1,
  overflow: 'auto',
  
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
  },
  
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
  },
}));

const ModalFooter = styled(Box)(({ theme }) => ({
  padding: '20px 24px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '12px',
  flexShrink: 0,
}));

const CloseButton = styled(IconButton)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  padding: '4px',
  
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: theme.palette.text.primary,
  },
}));

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  backdropBlur = true,
  compact = false,
  ...props
}) => {
  const modalClasses = [
    `MuiModal-size${size.charAt(0).toUpperCase() + size.slice(1)}`,
    compact ? 'MuiModal-compact' : '',
  ].filter(Boolean).join(' ');
  
  const backdropClasses = backdropBlur ? 'MuiModal-backdropBlur' : '';
  
  return (
    <MuiModal
      open={open}
      onClose={onClose}
      {...props}
    >
      <ModalBackdrop className={backdropClasses}>
        <ModalContainer className={modalClasses}>
          {(title || showCloseButton) && (
            <ModalHeader className="MuiModal-header">
              <Box>
                {title && (
                  <Typography variant="h6" className="MuiModal-title">
                    {title}
                  </Typography>
                )}
                {subtitle && (
                  <Typography variant="body2" className="MuiModal-subtitle">
                    {subtitle}
                  </Typography>
                )}
              </Box>
              {showCloseButton && (
                <CloseButton
                  aria-label="close"
                  onClick={onClose}
                  size="small"
                >
                  <Close />
                </CloseButton>
              )}
            </ModalHeader>
          )}
          
          <ModalContent className="MuiModal-content">
            {children}
          </ModalContent>
          
          {props.children && React.Children.toArray(props.children).some(
            child => React.isValidElement(child) && child.type === ModalFooter
          ) ? null : (
            <ModalFooter className="MuiModal-footer">
              {props.children && React.Children.toArray(props.children).filter(
                child => React.isValidElement(child) && child.type !== ModalContent
              )}
            </ModalFooter>
          )}
        </ModalContainer>
      </ModalBackdrop>
    </MuiModal>
  );
};

// Helper components
export const ModalBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ mb: 3 }}>{children}</Box>
);

export const ModalActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
    {children}
  </Box>
);

export default Modal;