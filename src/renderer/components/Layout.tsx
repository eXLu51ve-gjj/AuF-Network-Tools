import React from 'react';
import { Box, BoxProps, styled } from '@mui/material';

export interface LayoutProps extends BoxProps {
  direction?: 'row' | 'column';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: number | string;
  fullWidth?: boolean;
  fullHeight?: boolean;
  responsive?: boolean;
}

export const Layout = styled(Box, {
  shouldForwardProp: (prop) => 
    !['direction', 'justify', 'align', 'wrap', 'gap', 'fullWidth', 'fullHeight', 'responsive'].includes(prop as string),
})<LayoutProps>(({ 
  theme, 
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap = 0,
  fullWidth = false,
  fullHeight = false,
  responsive = true,
}) => ({
  display: 'flex',
  flexDirection: direction,
  justifyContent: justify,
  alignItems: align,
  flexWrap: wrap,
  gap: typeof gap === 'number' ? theme.spacing(gap) : gap,
  width: fullWidth ? '100%' : 'auto',
  height: fullHeight ? '100%' : 'auto',
  
  // Responsive behavior
  ...(responsive && {
    [theme.breakpoints.down('sm')]: {
      flexDirection: direction === 'row' ? 'column' : direction,
      gap: typeof gap === 'number' ? theme.spacing(Math.max(gap - 1, 0)) : gap,
    },
  }),
}));

// Container component for responsive width constraints
export interface ContainerProps extends BoxProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fluid?: boolean;
  centered?: boolean;
}

export const Container = styled(Box, {
  shouldForwardProp: (prop) => !['maxWidth', 'fluid', 'centered'].includes(prop as string),
})<ContainerProps>(({ theme, maxWidth = 'lg', fluid = false, centered = true }) => ({
  width: '100%',
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  marginLeft: 'auto',
  marginRight: 'auto',
  
  // Max width constraints
  ...(!fluid && maxWidth && {
    maxWidth: maxWidth === 'xs' ? '444px' :
              maxWidth === 'sm' ? '600px' :
              maxWidth === 'md' ? '900px' :
              maxWidth === 'lg' ? '1200px' :
              maxWidth === 'xl' ? '1536px' :
              '100%',
  }),
  
  // Centering
  ...(centered && {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  
  // Responsive padding
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

// Grid system component
export interface GridProps extends BoxProps {
  container?: boolean;
  item?: boolean;
  xs?: number | 'auto';
  sm?: number | 'auto';
  md?: number | 'auto';
  lg?: number | 'auto';
  xl?: number | 'auto';
  spacing?: number;
}

export const Grid = styled(Box, {
  shouldForwardProp: (prop) => 
    !['container', 'item', 'xs', 'sm', 'md', 'lg', 'xl', 'spacing'].includes(prop as string),
})<GridProps>(({ theme, container = false, item = false, xs, sm, md, lg, xl, spacing = 0 }) => {
  if (container) {
    return {
      display: 'flex',
      flexWrap: 'wrap',
      width: '100%',
      margin: `-${theme.spacing(spacing / 2)}`,
      
      '& > .MuiGrid-item': {
        padding: theme.spacing(spacing / 2),
      },
    };
  }
  
  if (item) {
    const styles: any = {
      flexGrow: 0,
      maxWidth: '100%',
      flexBasis: '100%',
      padding: theme.spacing(spacing / 2),
    };
    
    // Responsive column sizes
    const breakpoints = { xs, sm, md, lg, xl };
    const breakpointKeys = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    breakpointKeys.forEach((breakpoint) => {
      const value = breakpoints[breakpoint];
      if (value !== undefined) {
        if (value === 'auto') {
          styles[theme.breakpoints.up(breakpoint)] = {
            flexBasis: 'auto',
            flexGrow: 0,
            maxWidth: 'none',
          };
        } else if (typeof value === 'number') {
          const width = `${(value / 12) * 100}%`;
          styles[theme.breakpoints.up(breakpoint)] = {
            flexBasis: width,
            maxWidth: width,
            flexGrow: 0,
          };
        }
      }
    });
    
    return styles;
  }
  
  return {};
});

// Spacer component for flexible space
export const Spacer = styled(Box)(({ theme }) => ({
  flex: 1,
}));

// Divider component
export const Divider = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '1px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  margin: theme.spacing(2, 0),
}));

// Section component for content grouping
export interface SectionProps extends BoxProps {
  padded?: boolean;
  bordered?: boolean;
  background?: 'default' | 'paper' | 'transparent';
}

export const Section = styled(Box, {
  shouldForwardProp: (prop) => !['padded', 'bordered', 'background'].includes(prop as string),
})<SectionProps>(({ theme, padded = true, bordered = false, background = 'default' }) => ({
  backgroundColor: background === 'paper' ? theme.palette.background.paper :
                   background === 'transparent' ? 'transparent' :
                   theme.palette.background.default,
  padding: padded ? theme.spacing(3) : 0,
  borderRadius: '8px',
  border: bordered ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
  
  [theme.breakpoints.down('sm')]: {
    padding: padded ? theme.spacing(2) : 0,
  },
}));

export default Layout;