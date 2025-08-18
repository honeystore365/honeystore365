'use client';

// Review form component with validation

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useErrorHandling } from '@/hooks/use-error-handling';
import { ReviewFormSchema, type ReviewFormInput } from '@/lib/validation';
import { Star } from 'lucide-react';
import React from 'react';
import { FormInput, FormRadioGroup, FormTextarea } from './form-fields';
import { CancelButton, FormActions, FormProvider, FormSection, SubmitButton } from './form-provider';

interface ReviewFormProps {
  productId: string;
  productName?: string;
  initialData?: Partial<ReviewFormInput>;
  onSubmit: (data: ReviewFormInput) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ReviewForm({
  productId,
  productName,
  initialData = {},
  onSubmit,
  onCancel,
  className = '',
}: ReviewFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'ReviewForm' },
  });

  const [selectedRating, setSelectedRating] = React.useState<number>(initialData.rating || 0);

  const handleSubmit = async (data: ReviewFormInput) => {
    try {
      clearError();
      await onSubmit({ ...data, productId });
    } catch (err) {
      handleError(err as Error);
    }
  };

  const ratingOptions = [
    { value: '5', label: '5 نجوم - ممتاز', description: 'منتج رائع، أنصح به بشدة' },
    { value: '4', label: '4 نجوم - جيد جداً', description: 'منتج جيد مع بعض النقاط البسيطة' },
    { value: '3', label: '3 نجوم - جيد', description: 'منتج مقبول، يحتاج تحسين' },
    { value: '2', label: '2 نجمة - ضعيف', description: 'منتج دون التوقعات' },
    { value: '1', label: '1 نجمة - سيء جداً', description: 'منتج سيء، لا أنصح به' },
  ];

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => {
    return (
      <div className='flex items-center space-x-1 space-x-reverse'>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type='button'
            onClick={() => onRatingChange(star)}
            className={`p-1 rounded-full transition-colors ${
              star <= rating ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star className='w-8 h-8' fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
        <span className='mr-2 text-sm text-gray-600'>{rating > 0 ? `${rating} من 5` : 'اختر التقييم'}</span>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>كتابة مراجعة</CardTitle>
        <CardDescription>{productName ? `شارك رأيك في ${productName}` : 'شارك تجربتك مع هذا المنتج'}</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className='mb-6'>
            <ErrorDisplay error={error} onDismiss={clearError} />
          </div>
        )}

        <FormProvider
          schema={ReviewFormSchema}
          defaultValues={{ productId, ...initialData }}
          mode='onChange'
          onSubmit={handleSubmit}
          className='space-y-6'
        >
          {/* Rating Section */}
          <FormSection title='التقييم العام' description='كيف تقيم هذا المنتج بشكل عام؟'>
            <div className='space-y-4'>
              <StarRating
                rating={selectedRating}
                onRatingChange={rating => {
                  setSelectedRating(rating);
                  // Update form value
                }}
              />

              <FormRadioGroup name='rating' options={ratingOptions} required className='space-y-3' />
            </div>
          </FormSection>

          {/* Review Details */}
          <FormSection title='تفاصيل المراجعة' description='اكتب مراجعة مفصلة لمساعدة العملاء الآخرين'>
            <FormInput
              name='title'
              label='عنوان المراجعة'
              placeholder='اكتب عنوان مختصر لمراجعتك'
              dir='auto'
              description='عنوان يلخص رأيك في المنتج (اختياري)'
            />

            <FormTextarea
              name='comment'
              label='المراجعة'
              placeholder='اكتب مراجعتك هنا... شارك تجربتك مع المنتج، الجودة، الطعم، التغليف، وأي ملاحظات أخرى'
              required
              rows={6}
              maxLength={1000}
              dir='auto'
              description='اكتب مراجعة مفصلة ومفيدة (10 أحرف على الأقل)'
            />
          </FormSection>

          {/* Form Actions */}
          <FormActions>
            {onCancel && <CancelButton onClick={onCancel}>إلغاء</CancelButton>}

            <SubmitButton loadingText='جاري النشر...'>نشر المراجعة</SubmitButton>
          </FormActions>
        </FormProvider>
      </CardContent>
    </Card>
  );
}

// Quick review form for simple ratings
interface QuickReviewFormProps {
  productId: string;
  onSubmit: (data: Pick<ReviewFormInput, 'productId' | 'rating' | 'comment'>) => Promise<void>;
  className?: string;
}

export function QuickReviewForm({ productId, onSubmit, className = '' }: QuickReviewFormProps) {
  const { error, handleError, clearError } = useErrorHandling({
    context: { component: 'QuickReviewForm' },
  });

  const [rating, setRating] = React.useState<number>(0);

  const quickSchema = ReviewFormSchema.pick({
    productId: true,
    rating: true,
    comment: true,
  });

  const handleSubmit = async (data: Pick<ReviewFormInput, 'productId' | 'rating' | 'comment'>) => {
    try {
      clearError();
      await onSubmit({ ...data, productId });
    } catch (err) {
      handleError(err as Error);
    }
  };

  const StarRating = () => {
    return (
      <div className='flex items-center space-x-1 space-x-reverse'>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type='button'
            onClick={() => setRating(star)}
            className={`p-1 transition-colors ${
              star <= rating ? 'text-yellow-400 hover:text-yellow-500' : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star className='w-6 h-6' fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h4 className='text-sm font-medium mb-2'>قيم هذا المنتج</h4>
        <StarRating />
      </div>

      {error && <ErrorDisplay error={error} onDismiss={clearError} />}

      <FormProvider
        schema={quickSchema}
        defaultValues={{ productId, rating }}
        mode='onBlur'
        onSubmit={handleSubmit}
        className='space-y-3'
      >
        <FormTextarea
          name='comment'
          label='تعليق سريع'
          placeholder='اكتب تعليق مختصر عن المنتج...'
          required
          rows={3}
          maxLength={500}
          dir='auto'
        />

        <SubmitButton className='w-full' size='sm'>
          إرسال التقييم
        </SubmitButton>
      </FormProvider>
    </div>
  );
}
