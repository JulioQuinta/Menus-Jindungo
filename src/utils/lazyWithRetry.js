import { lazy } from 'react';

/**
 * Enhanced React.lazy wrapper that handles ChunkLoadError (common in PWAs after new deployments).
 * If a module fails to load, it will reload the page once to fetch the new code.
 */
export const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenForceReloaded = window.localStorage.getItem(
      'jindungo_page_reloaded'
    );

    try {
      return await componentImport();
    } catch (error) {
      console.error('Lazy loading error caught:', error);

      // If we already reloaded and it still fails, show the error
      if (pageHasBeenForceReloaded) {
        throw error;
      }

      // Mark that we are reloading to avoid an infinite loop
      window.localStorage.setItem('jindungo_page_reloaded', 'true');
      
      // Reload the page to get the latest manifest/chunks
      window.location.reload();
      
      // Return a dummy promise that won't resolve (page is reloading anyway)
      return new Promise(() => {});
    }
  });

// Clear the reload flag after a successful load of the main app
export const clearReloadFlag = () => {
    window.localStorage.removeItem('jindungo_page_reloaded');
};
