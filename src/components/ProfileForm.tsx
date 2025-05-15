'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfileAndAddress } from '@/actions/profileActions';

interface ProfileData {
  id?: string;
  username?: string | null;
  avatar_url?: string | null;
  website?: string | null;
}

interface CustomerData {
  id?: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

interface AddressData {
  id?: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  phone_number?: string | null;
}

interface ProfileFormProps {
  customer: CustomerData | null;
  address: AddressData | null; // Assuming one address for simplicity
}

export default function ProfileForm({ customer, address }: ProfileFormProps) {
  const [firstName, setFirstName] = useState(customer?.first_name || '');
  const [lastName, setLastName] = useState(customer?.last_name || '');
  const [addressLine1, setAddressLine1] = useState(address?.address_line_1 || '');
  const [addressLine2, setAddressLine2] = useState(address?.address_line_2 || '');
  const [city, setCity] = useState(address?.city || '');
  const [state, setState] = useState(address?.state || ''); // e.g. province/region
  const [postalCode, setPostalCode] = useState(address?.postal_code || '');
  const [country, setCountry] = useState(address?.country || 'Tunisia'); // Default to Tunisia
  const [phoneNumber, setPhoneNumber] = useState(address?.phone_number || '');

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (reason === 'profile_incomplete') {
      toast({
        title: "معلومات الملف الشخصي غير مكتملة",
        description: "الرجاء إكمال جميع الحقول المطلوبة للمتابعة.",
        variant: "default",
        duration: 5000,
      });
    }
  }, [reason, toast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!firstName || !lastName || !addressLine1 || !city || !state || !postalCode || !country || !phoneNumber) {
      toast({
        title: "حقول مطلوبة",
        description: "الرجاء ملء جميع الحقول الإلزامية.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    const formData = {
      firstName,
      lastName,
      addressLine1,
      addressLine2: addressLine2 || undefined,
      city,
      state,
      postalCode,
      country,
      phoneNumber,
    };

    const result = await updateUserProfileAndAddress(formData, redirectTo);

    if (result.success) {
      toast({
        title: "تم تحديث الملف الشخصي بنجاح!",
        description: "تم حفظ معلوماتك.",
        variant: "default", // Or "success" if you add that variant
      });
      // Redirection is handled by the server action if redirectTo is provided
      // If no redirectTo, or if server action doesn't redirect, you might refresh or stay.
      if (!redirectTo) {
        router.refresh(); // Refresh current page data if not redirecting
      }
    } else {
      toast({
        title: "خطأ في تحديث الملف الشخصي",
        description: result.error || "حدث خطأ غير متوقع.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white shadow-md rounded-xl p-6 sm:p-8">
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700">المعلومات الشخصية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">الاسم الأول <span className="text-destructive">*</span></Label>
            <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required disabled={isLoading} />
          </div>
          <div>
            <Label htmlFor="lastName">اسم العائلة <span className="text-destructive">*</span></Label>
            <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required disabled={isLoading} />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700">معلومات العنوان</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="addressLine1">سطر العنوان 1 <span className="text-destructive">*</span></Label>
            <Input id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required disabled={isLoading} />
          </div>
          <div>
            <Label htmlFor="addressLine2">سطر العنوان 2 (اختياري)</Label>
            <Input id="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} disabled={isLoading} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">المدينة <span className="text-destructive">*</span></Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="state">الولاية/المقاطعة <span className="text-destructive">*</span></Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} required disabled={isLoading} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postalCode">الرمز البريدي <span className="text-destructive">*</span></Label>
              <Input id="postalCode" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="country">الدولة <span className="text-destructive">*</span></Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} required disabled={isLoading} />
            </div>
          </div>
          <div>
            <Label htmlFor="phoneNumber">رقم الهاتف <span className="text-destructive">*</span></Label>
            <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required disabled={isLoading} />
          </div>
        </div>
      </div>
      
      <Button type="submit" className="w-full bg-honey hover:bg-honey-dark text-white" disabled={isLoading}>
        {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
      </Button>
    </form>
  );
}
