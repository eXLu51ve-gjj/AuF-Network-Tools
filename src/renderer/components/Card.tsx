import React from 'react';
import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardContent,
  CardHeader,
  CardActions,
  CardMedia,
  Typography,
  styled,
} from '@mui/material';

export interface CardProps extends MuiCardProps {
  title?: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  media?: {
    src: string;
    alt?: string;
    height?: number | string;
  };
  compact?: boolean;
  elevation?: number;
  hoverEffect?: boolean;
}

const StyledCard = styled(MuiCard)(({ theme }) => ({
  // OLED theme specific styles
  backgroundColor: theme.palette.background.paper,
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  transition: 'all 0.3s ease-in-out',
  overflow: 'hidden',
  
  // Elevation variants
  '&.MuiCard-elevation0': {
    boxShadow: 'none',
  },
  '&.MuiCard-elevation1': {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
  '&.MuiCard-elevation2': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
  },
  '&.MuiCard-elevation3': {
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.5)',
  },
  
  // Hover effect
  '&.MuiCard-hover': {
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
  },
  
  // Compact variant
  '&.MuiCard-compact': {
    '& .MuiCardHeader-root': {
      padding: '12px 16px',
    },
    '& .MuiCardContent-root': {
      padding: '12px 16px',
      paddingTop: 0,
    },
    '& .MuiCardActions-root': {
      padding: '8px 16px',
    },
  },
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: '16px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  
  '& .MuiCardHeader-title': {
    fontSize: '1rem',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
  
  '& .MuiCardHeader-subheader': {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    marginTop: '2px',
  },
  
  '& .MuiCardHeader-avatar': {
    marginRight: '12px',
  },
  
  '& .MuiCardHeader-action': {
    marginTop: 0,
    marginRight: 0,
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  padding: '20px',
  '&:last-child': {
    paddingBottom: '20px',
  },
}));

const StyledCardActions = styled(CardActions)(({ theme }) => ({
  padding: '16px 20px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  
  '& > *': {
    margin: '0 4px',
  },
  
  '& > *:first-of-type': {
    marginLeft: 0,
  },
  
  '& > *:last-of-type': {
    marginRight: 0,
  },
}));

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  avatar,
  action,
  media,
  children,
  compact = false,
  elevation = 1,
  hoverEffect = false,
  ...props
}) => {
  const cardClasses = [
    `MuiCard-elevation${Math.min(Math.max(elevation, 0), 3)}`,
    compact ? 'MuiCard-compact' : '',
    hoverEffect ? 'MuiCard-hover' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <StyledCard className={cardClasses} {...props}>
      {(title || avatar || action) && (
        <StyledCardHeader
          avatar={avatar}
          title={title}
          subheader={subtitle}
          action={action}
        />
      )}
      
      {media && (
        <CardMedia
          component="img"
          height={media.height || 140}
          image={media.src}
          alt={media.alt || ''}
          sx={{
            objectFit: 'cover',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }}
        />
      )}
      
      <StyledCardContent>
        {children}
      </StyledCardContent>
      
      {props.children && React.Children.toArray(props.children).some(
        child => React.isValidElement(child) && child.type === CardActions
      ) ? null : (
        <StyledCardActions>
          {props.children && React.Children.toArray(props.children).filter(
            child => React.isValidElement(child) && child.type !== CardContent
          )}
        </StyledCardActions>
      )}
    </StyledCard>
  );
};

// Helper components
export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 1 }}>
    {children}
  </Typography>
);

export const CardSubtitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
    {children}
  </Typography>
);

export const CardText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body1" sx={{ mb: 1 }}>
    {children}
  </Typography>
);

export default Card;