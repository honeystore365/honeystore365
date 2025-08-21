import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { axe } from 'jest-axe';

// Mock the monitoring hooks and API
jest.mock('@/hooks/useMonitoring', () => ({
  useMonitoring: () => ({
    getStats: jest.fn().mockResolvedValue({
      pageViews: 1000,
      uniqueVisitors: 500,
      averageSessionDuration: 120,
      bounceRate: 25,
      topPages: [
        { path: '/', views: 500 },
        { path: '/products', views: 300 },
      ],
      errors: 15,
    }),
    trackEvent: jest.fn(),
  }),
}));

describe('MonitoringDashboard Component', () => {
  it('renders loading state initially', () => {
    render(<MonitoringDashboard />);

    expect(screen.getByText(/جاري تحميل البيانات/i)).toBeInTheDocument();
  });

  it('renders dashboard with stats after loading', async () => {
    render(<MonitoringDashboard />);

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.queryByText(/جاري تحميل البيانات/i)).not.toBeInTheDocument();
    });

    // Check for stats display
    expect(screen.getByText('1000')).toBeInTheDocument(); // Page views
    expect(screen.getByText('500')).toBeInTheDocument(); // Unique visitors
    expect(screen.getByText('120')).toBeInTheDocument(); // Avg session duration
    expect(screen.getByText('25%')).toBeInTheDocument(); // Bounce rate
    expect(screen.getByText('15')).toBeInTheDocument(); // Errors
  });

  it('toggles visibility when toggle button is clicked', async () => {
    render(<MonitoringDashboard />);

    // Dashboard should be hidden initially
    expect(screen.queryByText(/إحصائيات الموقع/i)).not.toBeInTheDocument();

    // Click the toggle button
    fireEvent.click(screen.getByRole('button', { name: /عرض الإحصائيات/i }));

    // Dashboard should be visible
    expect(screen.getByText(/إحصائيات الموقع/i)).toBeInTheDocument();

    // Click the toggle button again
    fireEvent.click(screen.getByRole('button', { name: /إخفاء الإحصائيات/i }));

    // Dashboard should be hidden again
    expect(screen.queryByText(/إحصائيات الموقع/i)).not.toBeInTheDocument();
  });

  it('is accessible', async () => {
    const { container } = render(<MonitoringDashboard />);

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.queryByText(/جاري تحميل البيانات/i)).not.toBeInTheDocument();
    });

    // Show the dashboard
    fireEvent.click(screen.getByRole('button', { name: /عرض الإحصائيات/i }));

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
