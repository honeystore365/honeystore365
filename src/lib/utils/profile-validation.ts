/**
 * Utility functions to validate customer profile completeness
 */

export interface CustomerProfile {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export interface CustomerAddress {
  address_line_1?: string | null;
  city?: string | null;
  phone_number?: string | null;
  country?: string | null;
}

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  canPlaceOrder: boolean;
}

/**
 * Check if customer profile is complete enough to place orders
 */
export function validateProfileForOrder(
  customer: CustomerProfile | null,
  address: CustomerAddress | null
): ProfileCompletionStatus {
  const missingFields: string[] = [];

  // Check required customer fields
  if (!customer?.first_name?.trim()) {
    missingFields.push('الاسم الأول');
  }
  
  if (!customer?.last_name?.trim()) {
    missingFields.push('اسم العائلة');
  }

  // Check required address fields
  if (!address?.address_line_1?.trim()) {
    missingFields.push('العنوان');
  }

  if (!address?.city?.trim()) {
    missingFields.push('المدينة');
  }

  if (!address?.phone_number?.trim()) {
    missingFields.push('رقم الهاتف');
  }

  const isComplete = missingFields.length === 0;
  const canPlaceOrder = isComplete; // For now, same as complete

  return {
    isComplete,
    missingFields,
    canPlaceOrder,
  };
}

/**
 * Get user-friendly message for profile completion status
 */
export function getProfileCompletionMessage(status: ProfileCompletionStatus): string {
  if (status.isComplete) {
    return 'ملفك الشخصي مكتمل ويمكنك إجراء الطلبات';
  }

  if (status.missingFields.length === 1) {
    return `الرجاء إكمال ${status.missingFields[0]} لتتمكن من إجراء الطلبات`;
  }

  return `الرجاء إكمال المعلومات التالية: ${status.missingFields.join('، ')}`;
}

/**
 * Check if phone number is valid (basic validation)
 */
export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone?.trim()) return false;
  
  // Basic phone validation - adjust regex as needed for your region
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  return phoneRegex.test(cleanPhone) && cleanPhone.length >= 8;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone?.trim()) return 'غير محدد';
  
  // Add basic formatting - adjust as needed
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // For Saudi numbers starting with +966 or 966
  if (cleanPhone.startsWith('+966')) {
    return cleanPhone.replace('+966', '+966 ').replace(/(\d{2})(\d{3})(\d{4})/, '$1 $2 $3');
  }
  
  if (cleanPhone.startsWith('966')) {
    return '+' + cleanPhone.replace('966', '966 ').replace(/(\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
  }
  
  // For local numbers starting with 05
  if (cleanPhone.startsWith('05')) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3');
  }
  
  return phone;
}