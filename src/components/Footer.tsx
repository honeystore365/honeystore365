"use client";

export default function Footer() {
  return (
    <footer className="bg-amber-900 text-amber-100 py-8 mt-12" dir="rtl">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">🍯 HoneyStore</h3>
            <p className="text-amber-200">أفضل العسل والتمور التونسية الطبيعية</p>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2">
              <li><a href="/products" className="text-amber-200 hover:text-white">المنتجات</a></li>
              <li><a href="/cart" className="text-amber-200 hover:text-white">السلة</a></li>
              <li><a href="/contact" className="text-amber-200 hover:text-white">اتصل بنا</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-4">تواصل معنا</h4>
            <p className="text-amber-200">📍 تونس</p>
            <p className="text-amber-200">📞 +216 XX XXX XXXX</p>
            <p className="text-amber-200">✉️ contact@honeystore.tn</p>
          </div>
        </div>
        <div className="border-t border-amber-800 mt-8 pt-8 text-center text-amber-300">
          <p>© 2024 HoneyStore Tunisia. جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
