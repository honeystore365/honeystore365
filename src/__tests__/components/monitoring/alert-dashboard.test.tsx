import { AlertDashboard } from '@/components/monitoring/AlertDashboard';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';

// Mock the alerts API
jest.mock('@/lib/monitoring/alerts', () => ({
  getAlertRules: jest.fn().mockResolvedValue([
    { id: '1', name: 'High Error Rate', metric: 'errors', threshold: 10, severity: 'high', enabled: true },
    { id: '2', name: 'Slow Response Time', metric: 'responseTime', threshold: 1000, severity: 'medium', enabled: true },
  ]),
  getRecentAlertEvents: jest.fn().mockResolvedValue([
    {
      id: '1',
      ruleId: '1',
      timestamp: new Date().toISOString(),
      message: 'Error rate exceeded threshold',
      status: 'active',
    },
    {
      id: '2',
      ruleId: '2',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      message: 'Response time exceeded threshold',
      status: 'resolved',
    },
  ]),
  updateAlertRule: jest.fn().mockResolvedValue(true),
  acknowledgeAlert: jest.fn().mockResolvedValue(true),
}));

describe('AlertDashboard Component', () => {
  it('renders loading state initially', () => {
    render(<AlertDashboard />);

    expect(screen.getByText(/جاري تحميل التنبيهات/i)).toBeInTheDocument();
  });

  it('renders alert rules and events after loading', async () => {
    render(<AlertDashboard />);

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.queryByText(/جاري تحميل التنبيهات/i)).not.toBeInTheDocument();
    });

    // Check for alert rules
    expect(screen.getByText('High Error Rate')).toBeInTheDocument();
    expect(screen.getByText('Slow Response Time')).toBeInTheDocument();

    // Check for alert events
    expect(screen.getByText('Error rate exceeded threshold')).toBeInTheDocument();
    expect(screen.getByText('Response time exceeded threshold')).toBeInTheDocument();
  });

  it('toggles alert rule status when toggle button is clicked', async () => {
    const { updateAlertRule } = require('@/lib/monitoring/alerts');
    render(<AlertDashboard />);

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.queryByText(/جاري تحميل التنبيهات/i)).not.toBeInTheDocument();
    });

    // Find the toggle button for the first alert rule
    const toggleButtons = screen.getAllByRole('switch');
    fireEvent.click(toggleButtons[0]);

    // Check if updateAlertRule was called
    expect(updateAlertRule).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        enabled: false,
      })
    );
  });

  it('acknowledges alert when acknowledge button is clicked', async () => {
    const { acknowledgeAlert } = require('@/lib/monitoring/alerts');
    render(<AlertDashboard />);

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.queryByText(/جاري تحميل التنبيهات/i)).not.toBeInTheDocument();
    });

    // Find the acknowledge button for the active alert
    const acknowledgeButton = screen.getByRole('button', { name: /تأكيد/i });
    fireEvent.click(acknowledgeButton);

    // Check if acknowledgeAlert was called
    expect(acknowledgeAlert).toHaveBeenCalledWith('1');
  });

  it('is accessible', async () => {
    const { container } = render(<AlertDashboard />);

    // Wait for alerts to load
    await waitFor(() => {
      expect(screen.queryByText(/جاري تحميل التنبيهات/i)).not.toBeInTheDocument();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
