'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  created_at: string;
  image_url: string | null;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const router = useRouter();

  const ADMIN_EMAIL = 'honeystore365@gmail.com';

  useEffect(() => {
    checkAdminStatusAndFetchData();
  }, []);

  const checkAdminStatusAndFetchData = async () => {
    setLoading(true);
    setError('');
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      setError(userError?.message || 'User not authenticated.');
      setLoading(false);
      return;
    }

    if (user?.email === ADMIN_EMAIL) {
      setIsAdmin(true);
      fetchAdminData();
    } else {
      setIsAdmin(false);
      setError('Access denied. You are not authorized to view this page.');
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    if (!isAdmin) return;

    // Fetch Customers
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('*');

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      setError(customersError.message);
    } else {
      setCustomers(customersData || []);
    }

    // Fetch Categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      setError(categoriesError.message);
    } else {
      setCategories(categoriesData || []);
    }

    // Fetch Products
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      setError(productsError.message);
    } else {
      setProducts(productsData || []);
    }

    setLoading(false);
  };

  // CRUD operations for customers
  const [newCustomer, setNewCustomer] = useState({ first_name: '', last_name: '', email: '' });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCreateCustomer = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('customers')
      .insert([newCustomer]);

    if (error) {
      console.error('Error creating customer:', error);
      setError(error.message);
    } else {
      setNewCustomer({ first_name: '', last_name: '', email: '' });
      fetchAdminData(); // Refresh data
    }
    setLoading(false);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('customers')
      .update(selectedCustomer)
      .eq('id', selectedCustomer.id);

    if (error) {
      console.error('Error updating customer:', error);
      setError(error.message);
    } else {
      setSelectedCustomer(null);
      fetchAdminData(); // Refresh data
    }
    setLoading(false);
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);

    if (error) {
      console.error('Error deleting customer:', error);
      setError(error.message);
    } else {
      fetchAdminData(); // Refresh data
    }
    setLoading(false);
  };


  if (loading) {
    return <div className="container mx-auto py-10 text-center">Loading admin panel...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-10 text-center text-red-500">Error: {error}</div>;
  }

  if (!isAdmin) {
    return <div className="container mx-auto py-10 text-center text-red-500">Access denied.</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Admin Panel
      </h1>

      {/* Customers Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Customers</h2>

        {/* Create Customer Form */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Create Customer</h3>
          <input
            type="text"
            placeholder="First Name"
            className="border rounded p-2 mr-2"
            value={newCustomer.first_name}
            onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="border rounded p-2 mr-2"
            value={newCustomer.last_name}
            onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="border rounded p-2 mr-2"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          />
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" onClick={handleCreateCustomer}>
            Create
          </button>
        </div>

        {customers.length > 0 ? (
          <ul className="list-disc pl-5">
            {customers.map(customer => (
              <li key={customer.id}>
                {customer.first_name} {customer.last_name} ({customer.email})
                <button className="ml-2 text-blue-500 hover:text-blue-700" onClick={() => setSelectedCustomer(customer)}>
                  Update
                </button>
                <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => handleDeleteCustomer(customer.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No customers found.</p>
        )}

        {/* Update Customer Form */}
        {selectedCustomer && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Update Customer</h3>
            <input
              type="text"
              placeholder="First Name"
              className="border rounded p-2 mr-2"
              value={selectedCustomer.first_name}
              onChange={(e) => setSelectedCustomer({ ...selectedCustomer, first_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              className="border rounded p-2 mr-2"
              value={selectedCustomer.last_name}
              onChange={(e) => setSelectedCustomer({ ...selectedCustomer, last_name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              className="border rounded p-2 mr-2"
              value={selectedCustomer.email}
              onChange={(e) => setSelectedCustomer({ ...selectedCustomer, email: e.target.value })}
            />
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleUpdateCustomer}>
              Update
            </button>
          </div>
        )}
      </div>

      {/* Categories Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Categories</h2>
         {categories.length > 0 ? (
          <ul className="list-disc pl-5">
            {categories.map(category => (
              <li key={category.id}>{category.name}</li>
            ))}
          </ul>
        ) : (
          <p>No categories found.</p>
        )}
      </div>

      {/* Products Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Products</h2>
         {products.length > 0 ? (
          <ul className="list-disc pl-5">
            {products.map(product => (
              <li key={product.id}>{product.name} - {product.price}</li>
            ))}
          </ul>
        ) : (
          <p>No products found.</p>
        )}
      </div>
    </div>
  );
}