'use client';

import { signIn } from '@/actions/authActions';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RiGoogleFill, RiFacebookFill } from "@remixicon/react";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('message');

  return (
    <div className="min-h-screen py-10 bg-background flex justify-center items-center">
      {/* === السطر الذي تم تعديله === */}
      <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8"> {/* تم إضافة max-w-md وإزالة ml-auto mr-auto */}
      {/* ملاحظة: يمكنك تغيير max-w-md إلى قيمة أخرى مثل:
          max-w-sm (أصغر)
          max-w-lg (أكبر قليلاً)
          max-w-xl (أكبر)
          حسب العرض الذي تراه مناسبًا للنموذج.
      */}
        <h1 className="text-4xl font-bold mb-8 text-center text-foreground">
          تسجيل الدخول
        </h1>

        <Card className="w-full border-border shadow-lg">
          <CardContent className="pt-6 pb-8 px-6">
            <form className="flex flex-col gap-5" action={signIn}>
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  <p>{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  name="email"
                  className="h-12 text-base"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور"
                  name="password"
                  className="h-12 text-base"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button 
                type="submit" 
                className="h-12 text-base mt-2 rounded-full"
              >
                تسجيل الدخول
              </Button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-primary hover:underline text-base">
                هل نسيت كلمة المرور؟
              </a>
            </div>

            <div className="mt-8 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    أو سجل الدخول باستخدام
                  </span>
                </div>
              </div>

              <div className="flex gap-4 justify-center mt-4">
                <Button variant="outline" className="flex-1 h-12" onClick={(e) => { e.preventDefault(); /* TODO: Implement Google sign-in */ }}>
                  <RiGoogleFill className="mr-2 h-5 w-5 text-[#DB4437]" />
                  جوجل
                </Button>
                <Button variant="outline" className="flex-1 h-12" onClick={(e) => { e.preventDefault(); /* TODO: Implement Facebook sign-in */ }}>
                  <RiFacebookFill className="mr-2 h-5 w-5 text-[#1877f2]" />
                  فيسبوك
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
