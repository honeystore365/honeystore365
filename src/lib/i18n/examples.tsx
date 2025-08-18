'use client';

import { useCommonTranslations, useI18n, useProductTranslations } from './hooks';

/**
 * Example component demonstrating currency formatting
 */
export function CurrencyExample() {
  const { formatters, currency } = useI18n();

  const price = 299.99;

  return (
    <div className='space-y-2'>
      <p>Price: {formatters.currency(price)}</p>
      <p>Currency Symbol: {currency.symbol}</p>
      <p>Currency Code: {currency.code}</p>
    </div>
  );
}

/**
 * Example component demonstrating date formatting
 */
export function DateExample() {
  const { formatters } = useI18n();

  const now = new Date();
  const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

  return (
    <div className='space-y-2'>
      <p>Current Date: {formatters.date(now, { dateStyle: 'full' })}</p>
      <p>Short Date: {formatters.date(now, { dateStyle: 'short' })}</p>
      <p>Relative Time: {formatters.relativeTime(pastDate)}</p>
    </div>
  );
}

/**
 * Example component demonstrating RTL-aware styling
 */
export function RTLExample() {
  const { rtl, isRtl } = useI18n();

  return (
    <div
      className={rtl.classes({
        common: 'p-4 border rounded',
        ltr: 'border-l-4 border-blue-500',
        rtl: 'border-r-4 border-blue-500',
      })}
      dir={rtl.direction}
    >
      <p className={rtl.class('textLeft')}>This text is aligned to the start of the reading direction</p>
      <div className={`flex ${rtl.class('flexRow')} items-center gap-2`}>
        <span>Direction:</span>
        <strong>{isRtl ? 'Right-to-Left' : 'Left-to-Right'}</strong>
      </div>
    </div>
  );
}

/**
 * Example component demonstrating number formatting
 */
export function NumberExample() {
  const { formatters } = useI18n();

  const largeNumber = 1234567.89;
  const percentage = 75.5;
  const fileSize = 1024 * 1024 * 2.5; // 2.5 MB

  return (
    <div className='space-y-2'>
      <p>Large Number: {formatters.number(largeNumber)}</p>
      <p>Percentage: {formatters.percentage(percentage)}</p>
      <p>File Size: {formatters.fileSize(fileSize)}</p>
    </div>
  );
}

/**
 * Example component demonstrating translation hooks
 */
export function TranslationExample() {
  const { t } = useI18n();
  const { common, navigation } = useCommonTranslations();
  const products = useProductTranslations();

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='font-semibold'>Common Translations:</h3>
        <div className='space-y-1'>
          <p>Loading: {common.loading}</p>
          <p>Save: {common.save}</p>
          <p>Cancel: {common.cancel}</p>
        </div>
      </div>

      <div>
        <h3 className='font-semibold'>Navigation:</h3>
        <div className='space-y-1'>
          <p>Home: {navigation.home}</p>
          <p>Products: {navigation.products}</p>
          <p>Cart: {navigation.cart}</p>
        </div>
      </div>

      <div>
        <h3 className='font-semibold'>Products:</h3>
        <div className='space-y-1'>
          <p>Title: {products.title}</p>
          <p>Add to Cart: {products.addToCart}</p>
          <p>Out of Stock: {products.outOfStock}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Example component demonstrating phone number formatting
 */
export function PhoneExample() {
  const { formatters } = useI18n();

  const phones = ['966501234567', '0501234567', '+966 50 123 4567'];

  return (
    <div className='space-y-2'>
      <h3 className='font-semibold'>Phone Number Formatting:</h3>
      {phones.map((phone, index) => (
        <p key={index}>
          {phone} → {formatters.phoneNumber(phone)}
        </p>
      ))}
    </div>
  );
}

/**
 * Complete example component showcasing all features
 */
export function I18nShowcase() {
  const { locale, direction, isRtl } = useI18n();

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-8' dir={direction}>
      <div className='text-center'>
        <h1 className='text-3xl font-bold mb-2'>Internationalization Showcase</h1>
        <p className='text-gray-600'>
          Current Locale: {locale} | Direction: {direction} | RTL: {isRtl ? 'Yes' : 'No'}
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='bg-gray-50 p-4 rounded-lg'>
          <h2 className='text-xl font-semibold mb-3'>Currency Formatting</h2>
          <CurrencyExample />
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h2 className='text-xl font-semibold mb-3'>Date Formatting</h2>
          <DateExample />
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h2 className='text-xl font-semibold mb-3'>Number Formatting</h2>
          <NumberExample />
        </div>

        <div className='bg-gray-50 p-4 rounded-lg'>
          <h2 className='text-xl font-semibold mb-3'>Phone Formatting</h2>
          <PhoneExample />
        </div>
      </div>

      <div className='bg-gray-50 p-4 rounded-lg'>
        <h2 className='text-xl font-semibold mb-3'>RTL Support</h2>
        <RTLExample />
      </div>

      <div className='bg-gray-50 p-4 rounded-lg'>
        <h2 className='text-xl font-semibold mb-3'>Translations</h2>
        <TranslationExample />
      </div>
    </div>
  );
}
