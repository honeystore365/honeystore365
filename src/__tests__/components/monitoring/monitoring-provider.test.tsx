import { MonitoringProvider, useMonitoring } from '@/components/monitoring/MonitoringProvider';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

// Mock the pathname hook
jest.mock('next/navigation', () => ({
  usePathname: () => '/test-page',
}));

// Test component that uses the monitoring context
const TestComponent = () => {
  const monitoring = useMonitoring();
  return (
    <div>
      <div data-testid='user-id'>{monitoring.userId || 'no-user'}</div>
      <div data-testid='page'>{monitoring.currentPage}</div>
      <button onClick={() => monitoring.trackEvent('test-event')}>Track Event</button>
      <button onClick={() => monitoring.trackError('test-error')}>Track Error</button>
    </div>
  );
};

describe('MonitoringProvider Component', () => {
  it('provides monitoring context to children', () => {
    render(
      <MonitoringProvider userId='test-user' userEmail='test@example.com'>
        <TestComponent />
      </MonitoringProvider>
    );

    expect(screen.getByTestId('user-id')).toHaveTextContent('test-user');
    expect(screen.getByTestId('page')).toHaveTextContent('/test-page');
  });

  it('provides default values when user info is not provided', () => {
    render(
      <MonitoringProvider>
        <TestComponent />
      </MonitoringProvider>
    );

    expect(screen.getByTestId('user-id')).toHaveTextContent('no-user');
    expect(screen.getByTestId('page')).toHaveTextContent('/test-page');
  });

  it('updates current page when pathname changes', () => {
    const { usePathname } = require('next/navigation');
    usePathname.mockReturnValue('/new-page');

    render(
      <MonitoringProvider>
        <TestComponent />
      </MonitoringProvider>
    );

    expect(screen.getByTestId('page')).toHaveTextContent('/new-page');
  });

  it('throws error when useMonitoring is used outside of MonitoringProvider', () => {
    // Suppress console.error for this test
    const originalConsoleError = console.error;
    console.error = jest.fn();

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useMonitoring must be used within a MonitoringProvider');

    // Restore console.error
    console.error = originalConsoleError;
  });

  it('is accessible', async () => {
    const { container } = render(
      <MonitoringProvider>
        <div>Test Content</div>
      </MonitoringProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
