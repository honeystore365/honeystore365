// Simple sentry placeholder to fix compilation
export const sentryService = {
  init: () => {},
  captureError: (error: any) => console.error('Error:', error),
  captureMessage: (message: string) => console.log('Message:', message),
  setUser: (user: any) => {},
  addBreadcrumb: (breadcrumb: any) => {},
  setContext: (name: string, context: any) => {},
  captureBusinessEvent: (event: string, data?: any) => console.log('Business event:', event, data),
  captureSecurityEvent: (event: string, data?: any) => console.log('Security event:', event, data),
};

export const captureError = sentryService.captureError;
export const captureMessage = sentryService.captureMessage;
export const setUser = sentryService.setUser;
export const addBreadcrumb = sentryService.addBreadcrumb;

export const captureBusinessEvent = (event: string, data?: any) => {
  console.log('Business event:', event, data);
};

export const captureSecurityEvent = (event: string, data?: any) => {
  console.log('Security event:', event, data);
};