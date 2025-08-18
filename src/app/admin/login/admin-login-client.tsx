'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminSession } from '@/context/AdminSessionProvider';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Eye, EyeOff, Loader2, Shield, Store } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminLoginClient() {
  const { adminSession, loading, signInAdmin } = useAdminSession();
  const { toast } = useToast();
  const router = useRouter();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Rediriger si déjà connecté en tant qu'admin
  useEffect(() => {
    if (!loading && adminSession) {
      router.push('/admin');
    }
  }, [adminSession, loading, router]);

  // Connexion admin avec service dédié
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      toast({
        title: 'خطأ في البيانات',
        description: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLogging(true);

      const result = await signInAdmin(credentials.email, credentials.password);

      if (result.success) {
        toast({
          title: 'مرحباً بك',
          description: 'تم تسجيل الدخول بنجاح إلى لوحة الإدارة',
          variant: 'default',
        });
        router.push('/admin');
      } else {
        toast({
          title: 'خطأ في تسجيل الدخول',
          description: result.error || 'فشل في تسجيل الدخول',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erreur connexion admin:', error);
      toast({
        title: 'خطأ في تسجيل الدخول',
        description: error.message || 'فشل في تسجيل الدخول',
        variant: 'destructive',
      });
    } finally {
      setIsLogging(false);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
          <p className='text-gray-600'>جاري التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo et titre */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center mb-4'>
            <Image src='/favicon.png' alt='مناحل الرحيق' width={60} height={60} className='rounded-lg' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>لوحة إدارة المتجر</h1>
          <p className='text-gray-600'>مناحل الرحيق - نظام الإدارة</p>
        </div>

        {/* Formulaire de connexion */}
        <Card className='shadow-lg border-0'>
          <CardHeader className='text-center pb-4'>
            <CardTitle className='flex items-center justify-center gap-2 text-blue-600'>
              <Shield className='h-5 w-5' />
              تسجيل دخول المدير
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminLogin} className='space-y-4'>
              {/* البريد الإلكتروني */}
              <div>
                <Label htmlFor='admin-email'>البريد الإلكتروني</Label>
                <Input
                  id='admin-email'
                  type='email'
                  value={credentials.email}
                  onChange={e => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  placeholder='admin@honeystore365.com'
                  required
                  className='mt-1'
                />
              </div>

              {/* كلمة المرور */}
              <div>
                <Label htmlFor='admin-password'>كلمة المرور</Label>
                <div className='relative mt-1'>
                  <Input
                    id='admin-password'
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={e => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder='كلمة مرور قوية'
                    required
                    className='pr-10'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                  >
                    {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
              </div>

              {/* زر تسجيل الدخول */}
              <Button
                type='submit'
                disabled={isLogging}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5'
              >
                {isLogging ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  <>
                    <Shield className='h-4 w-4 mr-2' />
                    دخول لوحة الإدارة
                  </>
                )}
              </Button>
            </form>

            {/* معلومات إضافية */}
            <div className='mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='flex items-start gap-3'>
                <AlertCircle className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
                <div className='text-sm text-blue-800'>
                  <p className='font-semibold mb-1'>ملاحظة للمدير:</p>
                  <ul className='space-y-1 text-xs'>
                    <li>• إذا كانت هذه المرة الأولى، سيتم إنشاء حساب المدير تلقائياً</li>
                    <li>• استخدم بريد إلكتروني آمن وكلمة مرور قوية</li>
                    <li>• هذا النظام مخصص للإدارة فقط</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* رابط العودة للمتجر */}
        <div className='text-center mt-6'>
          <Button variant='ghost' onClick={() => router.push('/')} className='text-gray-600 hover:text-gray-800'>
            <Store className='h-4 w-4 mr-2' />
            العودة للمتجر
          </Button>
        </div>
      </div>
    </div>
  );
}
