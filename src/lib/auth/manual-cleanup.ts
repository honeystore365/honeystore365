/**
 * Manual cleanup script that can be run in browser console
 * to fix auth token issues
 */

export function manualAuthCleanup() {
  console.log('🧹 Starting manual auth cleanup...');
  
  // Clear localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Removed localStorage key: ${key}`);
  });
  
  // Clear cookies
  document.cookie.split(";").forEach(cookie => {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.startsWith('sb-') || name.includes('supabase')) {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      console.log(`✅ Removed cookie: ${name}`);
    }
  });
  
  console.log('🎉 Auth cleanup completed! Please refresh the page.');
  
  // Auto-refresh after 2 seconds
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}

// Make it available globally for console access
if (typeof window !== 'undefined') {
  (window as any).manualAuthCleanup = manualAuthCleanup;
  console.log('💡 Run manualAuthCleanup() in console to fix auth issues');
}