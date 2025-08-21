import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { fireEvent, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { setupComponentTest } from '../../utils/test-env-setup';

// Setup the test environment
setupComponentTest();

// Mock the locale switch hook
jest.mock('@/hooks/use-locale-switch', () => ({
  useLocaleSwitch: () => ({
    currentLocale: 'ar',
    switchLocale: jest.fn(),
    availableLocales: [
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'en', name: 'English', flag: '🇬🇧' },
    ],
  }),
}));

describe('LanguageSwitcher Component', () => {
  it('renders dropdown variant correctly', () => {
    render(<LanguageSwitcher variant='dropdown' />);

    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('🇸🇦')).toBeInTheDocument();
  });

  it('renders buttons variant correctly', () => {
    render(<LanguageSwitcher variant='buttons' />);

    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('renders without icon when showIcon is false', () => {
    render(<LanguageSwitcher variant='dropdown' showIcon={false} />);

    expect(screen.getByText('العربية')).toBeInTheDocument();
    expect(screen.queryByText('🇸🇦')).not.toBeInTheDocument();
  });

  it('calls switchLocale when a language is selected', () => {
    const { useLocaleSwitch } = require('@/hooks/use-locale-switch');
    const mockSwitchLocale = jest.fn();
    useLocaleSwitch.mockReturnValue({
      currentLocale: 'ar',
      switchLocale: mockSwitchLocale,
      availableLocales: [
        { code: 'ar', name: 'العربية', flag: '🇸🇦' },
        { code: 'en', name: 'English', flag: '🇬🇧' },
      ],
    });

    render(<LanguageSwitcher variant='buttons' />);

    fireEvent.click(screen.getByText('English'));
    expect(mockSwitchLocale).toHaveBeenCalledWith('en');
  });

  it('is accessible', async () => {
    const { container } = render(<LanguageSwitcher variant='dropdown' />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
