import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الإعدادات - لوحة تحكم المشرف',
  description: 'إدارة الفئات وإعدادات المتجر',
};

import SettingsClient from './settings-client';

export default function AdminSettingsPage() {
  return (
    <div className='space-y-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>الإعدادات</h1>
        <p className='text-gray-600'>إدارة الفئات وإعدادات المتجر</p>
      </div>
      <SettingsClient />
    </div>
  );
}
