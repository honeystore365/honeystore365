import { SiteHeader } from '@/components/site-header';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

// Mock the session hook
jest.mock('@/context/SessionProvider', () => ({
  useSession: () => ({
    session: null,
    loading: false,
    supabase: {
      auth: {
        signOut: jest.fn(),
      },
    },
  }),
}));

// Mock the navigation hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('SiteHeader Component', () => {
  it('renders logo and navigation links', () => {
    render(<SiteHeader />);

    // Check for logo and main navigation links
    expect(screen.getByAltText(/مناحل الرحيق/i)).toBeInTheDocument();
    expect(screen.getByText(/الرئيسية/i)).toBeInTheDocument();
    expect(screen.getByText(/المنتجات/i)).toBeInTheDocument();
    expect(screen.getByText(/من نحن/i)).toBeInTheDocument();
    expect(screen.getByText(/اتصل بنا/i)).toBeInTheDocument();
  });

  it('renders login button when user is not authenticated', () => {
    render(<SiteHeader />);

    expect(screen.getByText(/تسجيل الدخول/i)).toBeInTheDocument();
  });

  it('renders user menu when user is authenticated', () => {
    // Override the mock for this specific test
    jest.spyOn(require('@/context/SessionProvider'), 'useSession').mockImplementation(() => ({
      session: { user: { email: 'test@example.com' } },
      loading: false,
      supabase: {
        auth: {
          signOut: jest.fn(),
        },
      },
    }));

    render(<SiteHeader />);

    expect(screen.getByText(/حسابي/i)).toBeInTheDocument();
  });

  it('shows loading state when session is loading', () => {
    // Override the mock for this specific test
    jest.spyOn(require('@/context/SessionProvider'), 'useSession').mockImplementation(() => ({
      session: null,
      loading: true,
      supabase: {
        auth: {
          signOut: jest.fn(),
        },
      },
    }));

    render(<SiteHeader />);

    // Should show a loading indicator instead of login/account buttons
    expect(screen.queryByText(/تسجيل الدخول/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/حسابي/i)).not.toBeInTheDocument();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    render(<SiteHeader />);

    // Mobile menu should be hidden initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click the menu button
    fireEvent.click(screen.getByLabelText(/فتح القائمة/i));

    // Mobile menu should be visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Click the close button
    fireEvent.click(screen.getByLabelText(/إغلاق القائمة/i));

    // Mobile menu should be hidden again
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is accessible', async () => {
    const { container } = render(<SiteHeader />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
