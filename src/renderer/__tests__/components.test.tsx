import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../contexts/ThemeContext';
import { Button, Input, Card, Modal, Icon } from '../components';

describe('OLED Theme Base Components', () => {
  const renderWithTheme = (component: React.ReactNode) => {
    return render(
      <ThemeProvider>
        {component}
      </ThemeProvider>
    );
  };

  describe('Button Component', () => {
    it('renders primary button with OLED styling', () => {
      renderWithTheme(<Button>Test Button</Button>);
      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('MuiButton-contained');
    });

    it('renders secondary button with OLED styling', () => {
      renderWithTheme(<Button color="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button', { name: /secondary button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('MuiButton-containedSecondary');
    });

    it('renders outlined variant', () => {
      renderWithTheme(<Button variant="outlined">Outlined Button</Button>);
      const button = screen.getByRole('button', { name: /outlined button/i });
      expect(button).toHaveClass('MuiButton-outlined');
    });

    it('renders different sizes', () => {
      const { rerender } = renderWithTheme(<Button size="small">Small</Button>);
      let button = screen.getByRole('button', { name: /small/i });
      expect(button).toHaveClass('MuiButton-sizeSmall');

      rerender(
        <ThemeProvider>
          <Button size="large">Large</Button>
        </ThemeProvider>
      );
      button = screen.getByRole('button', { name: /large/i });
      expect(button).toHaveClass('MuiButton-sizeLarge');
    });
  });

  describe('Input Component', () => {
    it('renders text input with OLED styling', () => {
      renderWithTheme(<Input label="Test Input" />);
      const input = screen.getByLabelText(/test input/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'text');
    });

    it('renders password input with toggle', () => {
      renderWithTheme(
        <Input 
          type="password" 
          label="Password" 
          showPasswordToggle 
        />
      );
      const input = screen.getByLabelText(/password/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'password');
      
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('renders with start icon', () => {
      renderWithTheme(
        <Input 
          label="With Icon" 
          startIcon={<span data-testid="start-icon">🔍</span>}
        />
      );
      const icon = screen.getByTestId('start-icon');
      expect(icon).toBeInTheDocument();
    });

    it('renders compact variant', () => {
      renderWithTheme(<Input label="Compact" compact />);
      const input = screen.getByLabelText(/compact/i);
      expect(input).toBeInTheDocument();
    });
  });

  describe('Card Component', () => {
    it('renders card with title and content', () => {
      renderWithTheme(
        <Card title="Test Card">
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText(/test card/i)).toBeInTheDocument();
      expect(screen.getByText(/card content/i)).toBeInTheDocument();
    });

    it('renders card with subtitle', () => {
      renderWithTheme(
        <Card title="Test Card" subtitle="This is a subtitle">
          <p>Card content</p>
        </Card>
      );
      expect(screen.getByText(/this is a subtitle/i)).toBeInTheDocument();
    });

    it('renders compact card', () => {
      renderWithTheme(
        <Card title="Compact Card" compact>
          <p>Compact content</p>
        </Card>
      );
      expect(screen.getByText(/compact card/i)).toBeInTheDocument();
    });

    it('renders card with hover effect', () => {
      renderWithTheme(
        <Card title="Hover Card" hoverEffect>
          <p>Hover over me</p>
        </Card>
      );
      const card = screen.getByText(/hover card/i).closest('.MuiCard-root');
      expect(card).toHaveClass('MuiCard-hover');
    });
  });

  describe('Modal Component', () => {
    it('renders modal with title', () => {
      renderWithTheme(
        <Modal open={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText(/test modal/i)).toBeInTheDocument();
      expect(screen.getByText(/modal content/i)).toBeInTheDocument();
    });

    it('renders modal with subtitle', () => {
      renderWithTheme(
        <Modal 
          open={true} 
          onClose={() => {}} 
          title="Test Modal" 
          subtitle="This is a subtitle"
        >
          <p>Modal content</p>
        </Modal>
      );
      expect(screen.getByText(/this is a subtitle/i)).toBeInTheDocument();
    });

    it('renders different modal sizes', () => {
      const { rerender } = renderWithTheme(
        <Modal open={true} onClose={() => {}} title="Small Modal" size="sm">
          <p>Small content</p>
        </Modal>
      );
      let modal = screen.getByText(/small modal/i).closest('.MuiModal-sizeSm');
      expect(modal).toBeInTheDocument();

      rerender(
        <ThemeProvider>
          <Modal open={true} onClose={() => {}} title="Large Modal" size="lg">
            <p>Large content</p>
          </Modal>
        </ThemeProvider>
      );
      modal = screen.getByText(/large modal/i).closest('.MuiModal-sizeLg');
      expect(modal).toBeInTheDocument();
    });

    it('renders compact modal', () => {
      renderWithTheme(
        <Modal open={true} onClose={() => {}} title="Compact Modal" compact>
          <p>Compact content</p>
        </Modal>
      );
      const modal = screen.getByText(/compact modal/i).closest('.MuiModal-compact');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('Icon Component', () => {
    it('renders ping icon', () => {
      renderWithTheme(<Icon name="ping" />);
      const icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders traceroute icon', () => {
      renderWithTheme(<Icon name="traceroute" />);
      const icon = screen.getByRole('img', { name: /traceroute icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders wifi icon', () => {
      renderWithTheme(<Icon name="wifi" />);
      const icon = screen.getByRole('img', { name: /wifi icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders ssh icon', () => {
      renderWithTheme(<Icon name="ssh" />);
      const icon = screen.getByRole('img', { name: /ssh icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders port-scan icon', () => {
      renderWithTheme(<Icon name="port-scan" />);
      const icon = screen.getByRole('img', { name: /port-scan icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders dns icon', () => {
      renderWithTheme(<Icon name="dns" />);
      const icon = screen.getByRole('img', { name: /dns icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders settings icon', () => {
      renderWithTheme(<Icon name="settings" />);
      const icon = screen.getByRole('img', { name: /settings icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders different sizes', () => {
      const { rerender } = renderWithTheme(<Icon name="ping" size="xs" />);
      let icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();

      rerender(
        <ThemeProvider>
          <Icon name="ping" size="lg" />
        </ThemeProvider>
      );
      icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();

      rerender(
        <ThemeProvider>
          <Icon name="ping" size="xl" />
        </ThemeProvider>
      );
      icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders interactive icon', () => {
      renderWithTheme(<Icon name="ping" interactive />);
      const icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders active icon', () => {
      renderWithTheme(<Icon name="ping" active />);
      const icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders disabled icon', () => {
      renderWithTheme(<Icon name="ping" disabled />);
      const icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();
    });

    it('renders icon with custom color', () => {
      renderWithTheme(<Icon name="ping" color="#00ffff" />);
      const icon = screen.getByRole('img', { name: /ping icon/i });
      expect(icon).toBeInTheDocument();
    });
  });
});