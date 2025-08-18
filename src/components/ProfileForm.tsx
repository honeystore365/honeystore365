'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/useTranslation';

interface ProfileFormProps {
  initialData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  onSubmit?: (data: any) => void;
}

export default function ProfileForm({ initialData, onSubmit }: ProfileFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="firstName">{t('auth.firstName')}</Label>
        <Input
          id="firstName"
          value={formData.firstName}
          onChange={(e) => handleChange('firstName', e.target.value)}
          placeholder={t('profile.firstNamePlaceholder')}
        />
      </div>

      <div>
        <Label htmlFor="lastName">{t('auth.lastName')}</Label>
        <Input
          id="lastName"
          value={formData.lastName}
          onChange={(e) => handleChange('lastName', e.target.value)}
          placeholder={t('profile.lastNamePlaceholder')}
        />
      </div>

      <div>
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder={t('profile.emailPlaceholder')}
        />
      </div>

      <div>
        <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder={t('profile.phonePlaceholder')}
        />
      </div>

      <Button type="submit" className="w-full">
        {t('profile.saveChanges')}
      </Button>
    </form>
  );
}