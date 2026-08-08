/**
 * Resolves asset paths dynamically based on the running environment (Web vs Electron).
 * Electron (running via file:// and HashRouter) needs relative path './'
 * Web (running via http:// and BrowserRouter) needs absolute path '/'
 */
export const getAssetPath = (path) => {
    if (!path) return '';
    
    // If it's already an absolute URL (like Supabase storage) or base64, return as is
    if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) {
        return path;
    }
    
    const isElectron = typeof window !== 'undefined' && 
                       window.navigator && 
                       window.navigator.userAgent && 
                       window.navigator.userAgent.includes('Electron');
    
    // Remove leading slash if present to make it relative for cleaning
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    if (isElectron) {
        return `./${cleanPath}`;
    }
    return `/${cleanPath}`;
};
