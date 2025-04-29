// Ce fichier a été déplacé dans src/app/admin/layout.tsx

import Sidebar from './Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
}

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-100 p-4">
      <h2 className="text-xl font-semibold mb-4">Admin Menu</h2>
      <ul>
        <li><a href="/admin">Dashboard</a></li>
        <li><a href="/admin/customers">Customers</a></li>
        <li><a href="/admin/categories">Categories</a></li>
        <li><a href="/admin/products">Products</a></li>
      </ul>
    </div>
  );
};
