import React, { useMemo } from 'react';
import { styled } from '@mui/material/styles';
import { useTheme } from '../contexts/ThemeContext';

// Icon types
export type IconName = 
  | 'ping' 
  | 'traceroute' 
  | 'wifi' 
  | 'ssh' 
  | 'port-scan' 
  | 'dns'
  | 'settings';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface IconProps {
  /** Name of the icon to display */
  name: IconName;
  /** Size of the icon (xs: 16px, sm: 20px, md: 24px, lg: 32px, xl: 48px) or custom number */
  size?: IconSize;
  /** Color of the icon (defaults to currentColor from theme) */
  color?: string;
  /** Additional CSS class name */
  className?: string;
  /** Whether the icon is interactive (has hover/active states) */
  interactive?: boolean;
  /** Whether the icon is in active state */
  active?: boolean;
  /** Whether the icon is disabled */
  disabled?: boolean;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  /** Additional styles */
  style?: React.CSSProperties;
}

// Size mapping - matches requirements: 16px, 24px, 32px, 48px
const SIZE_MAP: Record<string, number> = {
  xs: 16,  // Extra small
  sm: 20,  // Small (not in requirements but useful)
  md: 24,  // Medium (matches 24px requirement)
  lg: 32,  // Large (matches 32px requirement)
  xl: 48,  // Extra large (matches 48px requirement)
};

// Icon container styled component
const IconContainer = styled('div', {
  shouldForwardProp: (prop) => 
    !['size', 'color', 'interactive', 'active', 'disabled'].includes(prop as string),
})<{
  size: number;
  color: string;
  interactive: boolean;
  active: boolean;
  disabled: boolean;
}>(({ theme, size, color, interactive, active, disabled }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: size,
  height: size,
  color: disabled ? theme.palette.text.disabled : color,
  cursor: disabled ? 'not-allowed' : (interactive ? 'pointer' : 'default'),
  opacity: disabled ? 0.5 : 1,
  transition: 'all 0.2s ease-in-out',
  position: 'relative',
  
  // Interactive states with smooth transitions
  ...(interactive && !disabled && {
    '&:hover': {
      color: active ? theme.palette.primary.light : theme.palette.primary.main,
      transform: 'scale(1.1)',
      '& svg': {
        filter: 'drop-shadow(0 0 4px rgba(0, 255, 255, 0.3))',
      },
    },
    '&:active': {
      color: theme.palette.primary.dark,
      transform: 'scale(0.95)',
      transition: 'transform 0.1s ease-in-out',
    },
  }),
  
  // Active state with pulse animation
  ...(active && {
    color: theme.palette.primary.main,
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: -4,
      left: '50%',
      transform: 'translateX(-50%)',
      width: size * 0.5,
      height: 2,
      backgroundColor: theme.palette.primary.main,
      borderRadius: 1,
      animation: 'pulse 2s infinite',
    },
  }),
  
  // Focus styles for accessibility
  '&:focus-visible': {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
    borderRadius: 4,
  },
}));

// SVG wrapper styled component
const SvgWrapper = styled('svg')({
  width: '100%',
  height: '100%',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  transition: 'all 0.2s ease-in-out',
});

// Icon SVG data - using the actual SVG files we created
const ICON_DATA: Record<IconName, React.ReactNode> = {
  'ping': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="4" x2="12" y2="8" />
      <line x1="12" y1="16" x2="12" y2="20" />
      <line x1="4" y1="12" x2="8" y2="12" />
      <line x1="16" y1="12" x2="20" y2="12" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  'traceroute': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" />
      <circle cx="3" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="21" cy="12" r="2" />
      <path d="M7 8l2-2M7 16l2 2M17 8l-2-2M17 16l-2 2" />
    </svg>
  ),
  'wifi': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
      <circle cx="12" cy="20" r="1" />
    </svg>
  ),
  'ssh': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="7" y1="7" x2="17" y2="7" />
      <line x1="7" y1="11" x2="17" y2="11" />
      <line x1="7" y1="15" x2="13" y2="15" />
      <line x1="7" y1="19" x2="10" y2="19" />
      <circle cx="19" cy="19" r="1" />
    </svg>
  ),
  'port-scan': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <circle cx="6" cy="6" r="1" />
      <circle cx="12" cy="6" r="1" />
      <circle cx="18" cy="6" r="1" />
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
      <circle cx="6" cy="18" r="1" />
      <circle cx="12" cy="18" r="1" />
      <circle cx="18" cy="18" r="1" />
    </svg>
  ),
  'dns': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
      <line x1="12" y1="2" x2="12" y2="22" />
      <circle cx="12" cy="7" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  ),
  'settings': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};

/**
 * Icon component for displaying SVG icons with theme-aware coloring
 * 
 * Features:
 * - Theme-aware coloring (uses currentColor from theme)
 * - Size system: xs(16px), sm(20px), md(24px), lg(32px), xl(48px) or custom number
 * - Interactive states with hover/active animations
 * - Active state indicator with pulse animation
 * - Accessibility support
 * - Smooth transitions (0.2s ease-in-out)
 * - OLED theme compatible
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color,
  className,
  interactive = false,
  active = false,
  disabled = false,
  onClick,
  style,
}) => {
  const { theme } = useTheme();
  
  // Calculate actual size
  const actualSize = useMemo(() => {
    if (typeof size === 'number') {
      return size;
    }
    return SIZE_MAP[size] || SIZE_MAP.md;
  }, [size]);
  
  // Determine color - defaults to currentColor which inherits from theme
  const iconColor = color || 'currentColor';
  
  // Get icon SVG component
  const IconSvg = ICON_DATA[name];
  
  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!disabled && onClick) {
      onClick(event);
    }
  };
  
  return (
    <IconContainer
      size={actualSize}
      color={iconColor}
      interactive={interactive}
      active={active}
      disabled={disabled}
      className={className}
      onClick={handleClick}
      style={style}
      role={interactive ? 'button' : 'img'}
      aria-label={`${name} icon`}
      tabIndex={interactive && !disabled ? 0 : -1}
    >
      <SvgWrapper viewBox="0 0 24 24">
        {IconSvg}
      </SvgWrapper>
    </IconContainer>
  );
};

// Add CSS animation for active state pulse
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default Icon;