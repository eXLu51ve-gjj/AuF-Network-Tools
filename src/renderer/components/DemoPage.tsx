import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  Modal, 
  Layout, 
  Container, 
  Grid, 
  Section,
  CardTitle,
  CardSubtitle,
  CardText,
  ModalBody,
  ModalActions,
  Icon
} from './index';
import { Visibility, Search, Wifi, Settings } from '@mui/icons-material';

export const DemoPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [password, setPassword] = useState('');

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <Container maxWidth="lg">
      <Section background="paper" sx={{ mt: 4, mb: 4 }}>
        <CardTitle>OLED Theme Base Components Demo</CardTitle>
        <CardSubtitle>
          Demonstrating the base UI components with OLED black theme styling
        </CardSubtitle>

        <Grid container spacing={3}>
          {/* Button Examples */}
          <Grid item xs={12} md={6}>
            <Card title="Button Components" compact>
              <CardText>Primary and secondary buttons with OLED glow effects</CardText>
              <Layout direction="row" gap={2} wrap="wrap">
                <Button variant="contained" color="primary">
                  Primary Button
                </Button>
                <Button variant="contained" color="secondary">
                  Secondary Button
                </Button>
                <Button variant="outlined">
                  Outlined Button
                </Button>
                <Button variant="text">
                  Text Button
                </Button>
                <Button size="small">
                  Small Button
                </Button>
                <Button size="large">
                  Large Button
                </Button>
                <Button loading>
                  Loading Button
                </Button>
              </Layout>
            </Card>
          </Grid>

          {/* Input Examples */}
          <Grid item xs={12} md={6}>
            <Card title="Input Components" compact>
              <CardText>Various input types with OLED styling</CardText>
              <Layout direction="column" gap={2}>
                <Input 
                  label="Text Input" 
                  placeholder="Enter text here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  startIcon={<Search />}
                />
                <Input 
                  label="Password Input" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  showPasswordToggle
                  startIcon={<Visibility />}
                />
                <Input 
                  label="Compact Input" 
                  compact
                  placeholder="Compact style..."
                />
                <Input 
                  label="Disabled Input" 
                  disabled
                  value="Disabled field"
                />
                <Input 
                  label="Error Input" 
                  error
                  helperText="This field has an error"
                  value="Invalid value"
                />
              </Layout>
            </Card>
          </Grid>

          {/* Card Examples */}
          <Grid item xs={12}>
            <Card title="Card Components" compact>
              <CardText>Different card styles with hover effects</CardText>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card 
                    title="Standard Card"
                    subtitle="With subtitle"
                    hoverEffect
                  >
                    <CardText>
                      This card has hover effect and standard elevation.
                    </CardText>
                    <Layout direction="row" gap={1}>
                      <Button size="small">Action 1</Button>
                      <Button size="small" variant="outlined">Action 2</Button>
                    </Layout>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card 
                    title="Compact Card"
                    compact
                    avatar={<Wifi />}
                  >
                    <CardText>
                      Compact card with avatar and reduced padding.
                    </CardText>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card 
                    title="High Elevation"
                    elevation={3}
                    action={<Button size="small">Action</Button>}
                  >
                    <CardText>
                      Card with higher elevation and action button.
                    </CardText>
                  </Card>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Layout Examples */}
          <Grid item xs={12}>
            <Card title="Layout System" compact>
              <CardText>Responsive layout components with CSS Grid/Flexbox</CardText>
              
              <Section background="default" bordered sx={{ mb: 3 }}>
                <CardTitle>Container & Grid</CardTitle>
                <CardSubtitle>Responsive grid system with 12 columns</CardSubtitle>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card compact>
                      <CardText>Column 1</CardText>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card compact>
                      <CardText>Column 2</CardText>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card compact>
                      <CardText>Column 3</CardText>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Card compact>
                      <CardText>Column 4</CardText>
                    </Card>
                  </Grid>
                </Grid>
              </Section>

              <Section background="default" bordered>
                <CardTitle>Flex Layout</CardTitle>
                <CardSubtitle>Flexbox-based layout components</CardSubtitle>
                
                <Layout direction="row" gap={2} wrap="wrap" sx={{ mb: 2 }}>
                  <Button>Item 1</Button>
                  <Button>Item 2</Button>
                  <Button>Item 3</Button>
                  <Button>Item 4</Button>
                  <Button>Item 5</Button>
                </Layout>

                <Layout direction="column" gap={2}>
                  <Input label="Field 1" />
                  <Input label="Field 2" />
                  <Input label="Field 3" />
                </Layout>
              </Section>
            </Card>
          </Grid>

          {/* Modal Example */}
          <Grid item xs={12}>
            <Card title="Modal Component" compact>
              <CardText>Modal dialog with backdrop blur and OLED styling</CardText>
              <Button onClick={handleOpenModal}>
                Open Modal
              </Button>

              <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                title="Demo Modal"
                subtitle="This is a modal dialog with OLED theme"
                size="md"
                backdropBlur
              >
                <ModalBody>
                  <CardText>
                    This modal demonstrates the OLED theme styling with true black
                    background, high contrast colors, and smooth animations.
                  </CardText>
                  <Input 
                    label="Modal Input" 
                    placeholder="Type something..."
                    fullWidth
                    sx={{ mb: 3 }}
                  />
                </ModalBody>
                <ModalActions>
                  <Button variant="outlined" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleCloseModal}>
                    Confirm
                  </Button>
                </ModalActions>
              </Modal>
            </Card>
          </Grid>

          {/* Icon Component Demo */}
          <Grid item xs={12}>
            <Card title="Icon Component" compact>
              <CardText>SVG icons with theme-aware coloring and interactive states</CardText>
              
              <Section background="default" bordered sx={{ mb: 3 }}>
                <CardTitle>Network Tool Icons</CardTitle>
                <CardSubtitle>All required network diagnostic tool icons</CardSubtitle>
                
                <Layout direction="row" gap={3} wrap="wrap" sx={{ mb: 3 }}>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ping" size="lg" />
                    <CardText>Ping</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="traceroute" size="lg" />
                    <CardText>Traceroute</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="wifi" size="lg" />
                    <CardText>WiFi</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ssh" size="lg" />
                    <CardText>SSH</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="port-scan" size="lg" />
                    <CardText>Port Scan</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="dns" size="lg" />
                    <CardText>DNS</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="settings" size="lg" />
                    <CardText>Settings</CardText>
                  </Layout>
                </Layout>
              </Section>

              <Section background="default" bordered sx={{ mb: 3 }}>
                <CardTitle>Size Variants</CardTitle>
                <CardSubtitle>Icon sizing system: 16px, 24px, 32px, 48px</CardSubtitle>
                
                <Layout direction="row" alignItems="center" gap={3} wrap="wrap">
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ping" size="xs" />
                    <CardText>16px (xs)</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ping" size="sm" />
                    <CardText>20px (sm)</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ping" size="md" />
                    <CardText>24px (md)</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ping" size="lg" />
                    <CardText>32px (lg)</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ping" size="xl" />
                    <CardText>48px (xl)</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ping" size={64} />
                    <CardText>64px (custom)</CardText>
                  </Layout>
                </Layout>
              </Section>

              <Section background="default" bordered sx={{ mb: 3 }}>
                <CardTitle>Interactive States</CardTitle>
                <CardSubtitle>Hover, active, and disabled states with smooth transitions</CardSubtitle>
                
                <Layout direction="row" gap={3} wrap="wrap">
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="wifi" size="lg" interactive />
                    <CardText>Interactive (hover me)</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="wifi" size="lg" interactive active />
                    <CardText>Active State</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="wifi" size="lg" disabled />
                    <CardText>Disabled</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon 
                      name="settings" 
                      size="lg" 
                      interactive 
                      onClick={() => alert('Icon clicked!')}
                    />
                    <CardText>Clickable</CardText>
                  </Layout>
                </Layout>
              </Section>

              <Section background="default" bordered>
                <CardTitle>Theme-Aware Coloring</CardTitle>
                <CardSubtitle>Icons inherit colors from theme or can be customized</CardSubtitle>
                
                <Layout direction="row" gap={3} wrap="wrap">
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ssh" size="lg" />
                    <CardText>Default (theme)</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ssh" size="lg" color="#00ffff" />
                    <CardText>Cyan</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ssh" size="lg" color="#ff00ff" />
                    <CardText>Magenta</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ssh" size="lg" color="#00ff00" />
                    <CardText>Green</CardText>
                  </Layout>
                  <Layout direction="column" alignItems="center" gap={1}>
                    <Icon name="ssh" size="lg" color="#ffff00" />
                    <CardText>Yellow</CardText>
                  </Layout>
                </Layout>
              </Section>
            </Card>
          </Grid>

          {/* Responsive Demo */}
          <Grid item xs={12}>
            <Card title="Responsive Design" compact>
              <CardText>Components adapt to different screen sizes</CardText>
              <CardSubtitle>
                Resize the window to see responsive behavior
              </CardSubtitle>
              
              <Layout direction="row" gap={2} responsive sx={{ mb: 3 }}>
                <Button fullWidth>Responsive Button 1</Button>
                <Button fullWidth>Responsive Button 2</Button>
                <Button fullWidth>Responsive Button 3</Button>
              </Layout>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card compact>
                    <CardTitle>Mobile</CardTitle>
                    <CardText>Full width on mobile devices</CardText>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card compact>
                    <CardTitle>Tablet</CardTitle>
                    <CardText>Half width on tablets</CardText>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card compact>
                    <CardTitle>Desktop</CardTitle>
                    <CardText>One third width on desktop</CardText>
                  </Card>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>

        {/* Theme Consistency Note */}
        <Card sx={{ mt: 4 }} elevation={2}>
          <CardTitle>Theme Consistency</CardTitle>
          <CardText>
            All components use the OLED black theme with:
          </CardText>
          <ul>
            <li>True black (#000000) backgrounds</li>
            <li>High contrast colors (white, cyan, magenta)</li>
            <li>Compact spacing and efficient layout</li>
            <li>Smooth transitions and animations</li>
            <li>Responsive design for all screen sizes</li>
          </ul>
          <CardSubtitle>
            This implementation satisfies Requirements 4.1, 4.2, 4.6, and 4.7
          </CardSubtitle>
        </Card>
      </Section>
    </Container>
  );
};

export default DemoPage;