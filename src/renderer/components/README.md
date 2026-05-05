# OLED Theme Base Components

This directory contains the base UI components for the WiFi Network Tools application, implementing the OLED black theme as specified in Requirements 4.1, 4.2, 4.6, and 4.7.

## Components

### 1. Button
OLED-themed button component with glow effects and compact design.

**Features:**
- Primary (cyan) and secondary (magenta) variants
- Outlined and text variants
- Small, medium, and large sizes
- Loading state with spinner
- OLED glow hover effects
- Compact spacing

**Usage:**
```tsx
import { Button } from './components';

<Button variant="contained" color="primary">
  Primary Button
</Button>

<Button variant="outlined" size="small">
  Small Outlined
</Button>

<Button loading>
  Loading...
</Button>
```

### 2. Input
OLED-themed input component with password toggle and compact variants.

**Features:**
- Text, password, number, email, and URL types
- Start and end icons
- Password visibility toggle
- Compact variant for dense layouts
- Error states with helper text
- OLED focus glow effects

**Usage:**
```tsx
import { Input } from './components';
import { Search, Visibility } from '@mui/icons-material';

<Input 
  label="Search"
  placeholder="Enter search term..."
  startIcon={<Search />}
/>

<Input 
  label="Password"
  type="password"
  showPasswordToggle
/>

<Input 
  label="Compact Field"
  compact
/>
```

### 3. Card
OLED-themed card component with hover effects and compact design.

**Features:**
- Title and subtitle support
- Avatar and action areas
- Media/image support
- Compact variant
- Hover effect with elevation
- Multiple elevation levels (0-3)

**Usage:**
```tsx
import { Card, CardTitle, CardText } from './components';

<Card title="Network Card" subtitle="Status: Active" hoverEffect>
  <CardText>
    Network information and statistics
  </CardText>
</Card>

<Card compact title="Compact Card">
  <CardText>
    Minimal padding for dense layouts
  </CardText>
</Card>
```

### 4. Modal
OLED-themed modal dialog with backdrop blur and responsive sizing.

**Features:**
- Multiple sizes (xs, sm, md, lg, xl, full)
- Backdrop blur effect
- Compact variant
- Close button with OLED styling
- Header with title and subtitle
- Footer area for actions

**Usage:**
```tsx
import { Modal, ModalBody, ModalActions } from './components';

<Modal
  open={isOpen}
  onClose={handleClose}
  title="Confirmation"
  subtitle="Are you sure you want to proceed?"
  size="sm"
  backdropBlur
>
  <ModalBody>
    <p>This action cannot be undone.</p>
  </ModalBody>
  <ModalActions>
    <Button variant="outlined" onClick={handleClose}>
      Cancel
    </Button>
    <Button onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalActions>
</Modal>
```

### 5. Layout System
Responsive layout components with CSS Grid/Flexbox.

**Components:**
- `Layout`: Flexbox container with responsive direction
- `Container`: Responsive width container with max-width constraints
- `Grid`: 12-column grid system with responsive breakpoints
- `Spacer`: Flexible space component
- `Divider`: Horizontal divider with OLED styling
- `Section`: Content grouping with background options

**Usage:**
```tsx
import { Layout, Container, Grid, Section } from './components';

<Container maxWidth="lg">
  <Section background="paper">
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>Column 1</Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>Column 2</Card>
      </Grid>
    </Grid>
  </Section>
</Container>
```

## OLED Theme Implementation

All components implement the following OLED theme characteristics:

### 1. True Black Backgrounds
- `background.default`: `#000000` (true black)
- `background.paper`: `#0a0a0a` (very dark gray)

### 2. High Contrast Colors
- `text.primary`: `#ffffff` (white)
- `text.secondary`: `#cccccc` (light gray)
- `primary.main`: `#00ffff` (cyan)
- `secondary.main`: `#ff00ff` (magenta)

### 3. Compact Design
- 8px spacing unit (Material-UI default)
- Reduced padding in compact variants
- Efficient use of screen space
- Minimal visual clutter

### 4. Responsive Behavior
- Components adapt to screen size
- Grid system reflows columns
- Layout direction changes on mobile
- Font sizes adjust appropriately

### 5. OLED-Specific Effects
- Glow effects on hover/focus
- Subtle shadows for depth
- Smooth transitions (300ms)
- Backdrop blur for modals

## Property Tests

The theme implementation includes property-based tests that validate:

1. **Theme Consistency**: All components use true black backgrounds and high contrast colors
2. **Responsive Layout**: Components adapt to different screen resolutions
3. **Compact Design**: Components maintain efficient screen space usage

## Requirements Satisfied

This implementation satisfies the following requirements:

- **4.1**: Uses true black (#000000) backgrounds throughout
- **4.2**: Uses high contrast colors (white, cyan, magenta) on black backgrounds
- **4.6**: Provides fully responsive layout adjustments for all screen resolutions
- **4.7**: Implements compact UI elements with efficient use of screen space

## Usage Guidelines

1. Always wrap components with `ThemeProvider` from `./contexts/ThemeContext`
2. Use the provided components instead of raw Material-UI components
3. Follow the compact design principles for optimal OLED display usage
4. Test responsive behavior at different screen sizes
5. Maintain high contrast ratios for accessibility