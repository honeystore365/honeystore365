import AdminLayout from './layout';

export default function AdminPage() {
  return (
    <AdminLayout>
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Admin Panel
        </h1>
        <p className="text-center">Welcome to the admin panel!</p>
      </div>
    </AdminLayout>
  );
}
