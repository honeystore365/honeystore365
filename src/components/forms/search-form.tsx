'use client';

// Search form component with validation

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { SearchFormSchema, type SearchFormInput } from '@/lib/validation';
import { Filter, Search, X } from 'lucide-react';
import React from 'react';
import { FormInput, FormSelect } from './form-fields';
import { FormActions, FormProvider, SubmitButton } from './form-provider';

interface SearchFormProps {
  initialData?: Partial<SearchFormInput>;
  onSubmit: (data: SearchFormInput) => Promise<void>;
  onReset?: () => void;
  categories?: Array<{ value: string; label: string }>;
  showAdvancedFilters?: boolean;
  className?: string;
}

export function SearchForm({
  initialData = {},
  onSubmit,
  onReset,
  categories = [],
  showAdvancedFilters = true,
  className = '',
}: SearchFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'SearchForm' },
  });

  const [showFilters, setShowFilters] = React.useState(false);

  const handleSubmit = async (data: SearchFormInput) => {
    try {
      clearError();
      await onSubmit(data);
    } catch (err) {
      handleError(err as Error);
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    }
    setShowFilters(false);
  };

  const sortOptions = [
    { value: 'relevance', label: 'الأكثر صلة' },
    { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
    { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
    { value: 'newest', label: 'الأحدث' },
    { value: 'rating', label: 'الأعلى تقييماً' },
  ];

  const categoryOptions = [{ value: '', label: 'جميع الفئات' }, ...categories];

  return (
    <div className={className}>
      {error && (
        <div className='mb-4'>
          <ErrorDisplay error={error} onDismiss={clearError} />
        </div>
      )}

      <FormProvider
        schema={SearchFormSchema}
        defaultValues={initialData}
        mode='onSubmit'
        onSubmit={handleSubmit}
        className='space-y-4'
      >
        {/* Main Search Bar */}
        <div className='flex gap-2'>
          <div className='flex-1 relative'>
            <FormInput name='query' placeholder='ابحث عن المنتجات...' required dir='auto' className='pr-10' />
            <Search className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
          </div>

          <SubmitButton className='px-6' loadingText='جاري البحث...'>
            بحث
          </SubmitButton>

          {showAdvancedFilters && (
            <Button type='button' variant='outline' onClick={() => setShowFilters(!showFilters)} className='px-4'>
              <Filter className='w-4 h-4' />
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && showFilters && (
          <Card>
            <CardContent className='pt-6'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-lg font-medium'>فلاتر البحث</h3>
                  <Button type='button' variant='ghost' size='sm' onClick={() => setShowFilters(false)}>
                    <X className='w-4 h-4' />
                  </Button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <FormSelect name='category' label='الفئة' placeholder='اختر الفئة' options={categoryOptions} />

                  <FormInput name='minPrice' type='number' label='السعر الأدنى' placeholder='0' dir='ltr' />

                  <FormInput name='maxPrice' type='number' label='السعر الأعلى' placeholder='1000' dir='ltr' />

                  <FormSelect name='sortBy' label='ترتيب النتائج' placeholder='اختر الترتيب' options={sortOptions} />
                </div>

                <FormActions align='left'>
                  <Button type='button' variant='outline' onClick={handleReset}>
                    إعادة تعيين
                  </Button>

                  <SubmitButton>تطبيق الفلاتر</SubmitButton>
                </FormActions>
              </div>
            </CardContent>
          </Card>
        )}
      </FormProvider>
    </div>
  );
}

// Compact search form for headers or sidebars
interface CompactSearchFormProps {
  onSubmit: (query: string) => Promise<void>;
  placeholder?: string;
  className?: string;
}

export function CompactSearchForm({ onSubmit, placeholder = 'ابحث...', className = '' }: CompactSearchFormProps) {
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(query.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
      <div className='flex-1 relative'>
        <input
          type='text'
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className='w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          dir='auto'
        />
        <Search className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
      </div>

      <Button type='submit' disabled={!query.trim() || isLoading} size='sm'>
        {isLoading ? 'جاري البحث...' : 'بحث'}
      </Button>
    </form>
  );
}

// Search suggestions component
interface SearchSuggestionsProps {
  query: string;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
}

export function SearchSuggestions({ query, suggestions, onSuggestionClick, className = '' }: SearchSuggestionsProps) {
  if (!query || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className={`absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 ${className}`}
    >
      <div className='py-2'>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            type='button'
            onClick={() => onSuggestionClick(suggestion)}
            className='w-full px-4 py-2 text-right hover:bg-gray-50 focus:bg-gray-50 focus:outline-none'
          >
            <span className='flex items-center'>
              <Search className='w-4 h-4 text-gray-400 ml-2' />
              {suggestion}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
