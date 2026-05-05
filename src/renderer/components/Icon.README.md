# Icon Component

A theme-aware SVG icon component for the WiFi Network Tools application with OLED black theme support.

## Features

- **Theme-aware coloring**: Icons inherit colors from the OLED theme or can be customized
- **Size system**: Predefined sizes (16px, 20px, 24px, 32px, 48px) or custom numeric sizes
- **Interactive states**: Hover, active, and disabled states with smooth transitions
- **Active state indicator**: Pulse animation for active icons
- **Accessibility**: Proper ARIA labels and keyboard navigation support
- **OLED theme compatible**: Designed for true black (#000000) backgrounds

## Available Icons

The component includes SVG icons for all network diagnostic tools:

- `ping` - Network ping/echo request
- `traceroute` - Network path discovery
- `wifi` - Wireless network
- `ssh` - Secure shell terminal
- `port-scan` - Network port scanning
- `dns` - Domain name resolution
- `settings` - Configuration/settings

## Usage

```tsx
import { Icon } from './components';

// Basic usage
<Icon name="ping" />

// With size
<Icon name="wifi" size="lg" /> // 32px
<Icon name="ssh" size="xl" /> // 48px
<Icon name="dns" size={64} /> // Custom 64px

// Interactive icon
<Icon 
  name="settings" 
  interactive 
  onClick={() => console.log('Clicked!')}
/>

// Active state (for navigation)
<Icon name="ping" active />

// Custom color
<Icon name="traceroute" color="#00ffff" />

// Disabled state
<Icon name="port-scan" disabled />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `IconName` | Required | Name of the icon to display |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| number` | `'md'` | Size of the icon (xs:16px, sm:20px, md:24px, lg:32px, xl:48px) |
| `color` | `string` | `'currentColor'` | Color of the icon (defaults to theme color) |
| `interactive` | `boolean` | `false` | Whether the icon is interactive (has hover/active states) |
| `active` | `boolean` | `false` | Whether the icon is in active state (shows pulse indicator) |
| `disabled` | `boolean` | `false` | Whether the icon is disabled |
| `onClick` | `(event: React.MouseEvent) => void` | - | Click handler for interactive icons |
| `className` | `string` | - | Additional CSS class name |
| `style` | `React.CSSProperties` | - | Additional inline styles |

## IconName Type

```typescript
type IconName = 
  | 'ping' 
  | 'traceroute' 
  | 'wifi' 
  | 'ssh' 
  | 'port-scan' 
  | 'dns'
  | 'settings';
```

## Styling

Icons use `currentColor` by default, which inherits from the parent element's color. This makes them theme-aware automatically.

### Size Mapping
- `xs`: 16px (extra small)
- `sm`: 20px (small)
- `md`: 24px (medium) - matches requirement
- `lg`: 32px (large) - matches requirement
- `xl`: 48px (extra large) - matches requirement

### Interactive States
- **Hover**: Scale up 10% with cyan glow effect
- **Active**: Scale down 5% with darker color
- **Disabled**: 50% opacity, no pointer events
- **Active state**: Pulse animation at bottom

### Transitions
All state changes use `0.2s ease-in-out` transitions for smooth animations.

## Accessibility

- Interactive icons have `role="button"` and are keyboard focusable
- Non-interactive icons have `role="img"`
- All icons have `aria-label` describing the icon
- SVG elements have `aria-hidden="true"` and `focusable="false"`

## Requirements Satisfied

This component satisfies:
- **Requirement 4.3**: Uses SVG icons for all interface controls
- **Requirement 4.5**: Supports smooth animations and transitions

## Implementation Details

The component uses inline SVG for simplicity and performance. All icons are defined in the component file with consistent stroke properties for the OLED theme.

SVG properties:
- `stroke="currentColor"` - Inherits color from theme
- `strokeWidth="1.5"` - Consistent line weight
- `strokeLinecap="round"` - Rounded line ends
- `strokeLinejoin="round"` - Rounded corners
- `fill="none"` - No fill for outline style

## Adding New Icons

To add a new icon:

1. Add the icon name to the `IconName` type
2. Add the SVG component to the `ICON_DATA` object
3. Update the `getAvailableIcons()` function if using dynamic loading

## Example: Custom Icon Implementation

```tsx
// In Icon.tsx
const ICON_DATA: Record<IconName, React.ReactNode> = {
  // ... existing icons
  'new-icon': (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      {/* SVG paths here */}
    </svg>
  ),
};

// Update IconName type
type IconName = 
  | 'ping' 
  | 'traceroute' 
  | 'wifi' 
  | 'ssh' 
  | 'port-scan' 
  | 'dns'
  | 'settings'
  | 'new-icon'; // Add new icon name
```