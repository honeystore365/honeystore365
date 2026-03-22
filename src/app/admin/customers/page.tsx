import { getCustomers } from "@/lib/db";
import { Users, Mail, Phone, MapPin, ShoppingBag, Calendar } from "lucide-react";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">إدارة العملاء</h1>
          <p className="text-gray-500 mt-1">{customers.length} عميل مسجل</p>
        </div>
      </div>

      {customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer: any) => (
            <div key={customer.id} className="card p-6 hover:shadow-lg transition-all">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {customer.first_name?.[0]?.toUpperCase() || customer.email?.[0]?.toUpperCase() || "?"}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">
                    {customer.first_name ? `${customer.first_name} ${customer.last_name || ""}` : "عميل"}
                  </h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                {customer.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-amber-500" />
                    {customer.phone}
                  </p>
                )}
                {customer.address && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    {customer.address}
                  </p>
                )}
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  عضو منذ: {customer.created_at ? new Date(customer.created_at).toLocaleDateString("ar-TN") : "غير محدد"}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Users className="w-20 h-20 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">لا يوجد عملاء</h3>
          <p className="text-gray-500">سيسجل العملاء عند إجراء طلب</p>
        </div>
      )}
    </div>
  );
}
