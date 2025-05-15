'use server';

import { createClientServer } from '@/lib/supabaseClientServer';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string; // Or province
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export async function updateUserProfileAndAddress(
  formData: ProfileUpdateData,
  redirectTo?: string | null
): Promise<{ success: boolean; error?: string; customerId?: string }> {
  const supabase = await createClientServer();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: 'User not authenticated.' };
  }

  const userId = user.id;

  // 1. Update 'customers' table
  // The 'id' of the customer is the same as user.id
  const customerUpdatePayload = {
    first_name: formData.firstName,
    last_name: formData.lastName,
    // email: user.email // email is usually managed by auth and might not need explicit update here
  };
  console.log(`[updateUserProfileAndAddress] Attempting to update customer ${userId} with payload:`, customerUpdatePayload);
  const { data: customerData, error: customerUpdateError } = await supabase
    .from('customers')
    .update(customerUpdatePayload)
    .eq('id', userId)
    .select('id')
    .single();

  if (customerUpdateError || !customerData) {
    console.error(`[updateUserProfileAndAddress] Error updating customer ${userId}:`, JSON.stringify(customerUpdateError, null, 2));
    // If customer record doesn't exist (PGRST116: No rows found for update), create it.
    if (customerUpdateError?.code === 'PGRST116' || (customerUpdateError === null && !customerData) ) {
      const customerInsertPayload = {
        id: userId, // Set customer ID to user ID
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: user.email, // Make sure email is populated
      };
      console.log(`[updateUserProfileAndAddress] Customer ${userId} not found for update, attempting insert with payload:`, customerInsertPayload);
      const { data: newCustomerData, error: customerInsertError } = await supabase
        .from('customers')
        .insert(customerInsertPayload)
        .select('id')
        .single();
      
      if (customerInsertError || !newCustomerData) {
        console.error(`[updateUserProfileAndAddress] Error inserting customer ${userId}:`, JSON.stringify(customerInsertError, null, 2));
        return { success: false, error: `Failed to create customer record: ${customerInsertError?.message}` };
      }
      console.log(`[updateUserProfileAndAddress] Customer record created for ${userId} with id ${newCustomerData.id}`);
    } else {
      // Some other error occurred during update
      return { success: false, error: `Failed to update customer record: ${customerUpdateError?.message}` };
    }
  } else {
    console.log(`[updateUserProfileAndAddress] Customer record updated for ${userId} with id ${customerData.id}`);
  }
  const customerId = userId; // Since customer.id is user.id

  // 2. Upsert 'addresses' table
  // Check if an address exists for this customer_id, if so update, else insert.
  // For simplicity, we'll assume one primary address. A more complex system might handle multiple.
  
  const { data: existingAddress, error: addressFetchError } = await supabase
    .from('addresses')
    .select('id')
    .eq('customer_id', customerId)
    // .eq('is_primary', true) // If you have a primary address flag
    .limit(1)
    .single();

  if (addressFetchError && addressFetchError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for upsert
      console.error(`Error fetching existing address for customer ${customerId}:`, addressFetchError);
      return { success: false, error: `Failed to check existing address: ${addressFetchError.message}` };
  }

  const addressPayload = {
    customer_id: customerId,
    address_line_1: formData.addressLine1,
    address_line_2: formData.addressLine2 || null,
    city: formData.city,
    state: formData.state,
    postal_code: formData.postalCode,
    country: formData.country,
    phone_number: formData.phoneNumber,
  };

  if (existingAddress) {
    // Update existing address
    const { error: addressUpdateError } = await supabase
      .from('addresses')
      .update(addressPayload)
      .eq('id', existingAddress.id);
    if (addressUpdateError) {
      console.error(`Error updating address ${existingAddress.id}:`, addressUpdateError);
      return { success: false, error: `Failed to update address: ${addressUpdateError.message}` };
    }
    console.log(`Address ${existingAddress.id} updated for customer ${customerId}`);
  } else {
    // Insert new address
    const { error: addressInsertError } = await supabase
      .from('addresses')
      .insert(addressPayload);
    if (addressInsertError) {
      console.error(`Error inserting address for customer ${customerId}:`, addressInsertError);
      return { success: false, error: `Failed to insert address: ${addressInsertError.message}` };
    }
    console.log(`New address inserted for customer ${customerId}`);
  }

  // Revalidate paths that might display this data
  revalidatePath('/profile');
  if (redirectTo) {
    revalidatePath(redirectTo);
  }
  
  if (redirectTo) {
    redirect(redirectTo);
  }

  return { success: true, customerId };
}
