import imageCompression from 'browser-image-compression';
import toast from 'react-hot-toast';

/**
 * Optimizes an image file for web before uploading to Supabase.
 * @param {File} file - The original image file.
 * @param {Object} options - Custom options for compression.
 * @returns {Promise<File>} - The compressed image file.
 */
export const optimizeImage = async (file, options = {}) => {
    // Basic validation
    if (!file || !file.type.startsWith('image/')) {
        toast.error('Ficheiro inválido. Por favor selecione uma imagem.');
        throw new Error('Invalid file type');
    }

    const defaultOptions = {
        maxSizeMB: 0.3, // Compress to max 300KB
        maxWidthOrHeight: 1200, // Max dimension
        useWebWorker: true, // Use multi-threading
        fileType: 'image/webp', // Convert to WebP for best compression/quality ratio
        initialQuality: 0.8,
        ...options
    };

    try {
        // If file is already small (e.g. < 100KB), we might skip aggressive compression,
        // but converting to WebP is usually still beneficial.
        const compressedFile = await imageCompression(file, defaultOptions);
        
        // Ensure the new file has a proper name ending in .webp
        const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + '.webp';
        
        // Return a new File object with the updated name and type
        return new File([compressedFile], newFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
        });
    } catch (error) {
        console.error('Error compressing image:', error);
        toast.error('Erro ao otimizar imagem. O ficheiro original será utilizado.');
        // Fallback to original file if compression fails
        return file;
    }
};
