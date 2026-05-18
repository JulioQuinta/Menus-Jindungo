import imageCompression from 'browser-image-compression';

/**
 * High-performance image compression and resizing using browser-image-compression
 * @param {File} file - The raw image file
 * @param {Object} options - Compression options
 */
export const compressImage = async (file, options = {}) => {
    const { 
        maxWidth = 1024, 
        quality = 0.75, 
        forceSquare = false, // browser-image-compression doesn't support forceSquare directly, we handle it if needed
        format = 'image/webp'
    } = options;

    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Step 1: Crop to square if requested (using canvas before compression)
    let fileToCompress = file;
    
    if (forceSquare) {
        fileToCompress = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = Math.min(img.width, img.height);
                    const startX = (img.width - size) / 2;
                    const startY = (img.height - size) / 2;
                    
                    canvas.width = Math.min(size, maxWidth);
                    canvas.height = canvas.width;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
                    
                    canvas.toBlob((blob) => {
                        if(blob) {
                            resolve(new File([blob], file.name, { type: file.type, lastModified: Date.now() }));
                        } else {
                            resolve(file); // fallback
                        }
                    }, file.type);
                };
                img.onerror = () => resolve(file);
            };
            reader.onerror = () => resolve(file);
        });
    }

    // Step 2: Compress using browser-image-compression
    const compressionOptions = {
        maxSizeMB: 0.3, // Target under 300KB
        maxWidthOrHeight: maxWidth,
        useWebWorker: true,
        fileType: format,
        initialQuality: quality
    };

    try {
        const compressedBlob = await imageCompression(fileToCompress, compressionOptions);
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        return new File([compressedBlob], newFileName, {
            type: format,
            lastModified: Date.now(),
        });
    } catch (error) {
        console.error('Image compression error:', error);
        return fileToCompress; // Return original/squared file if compression fails
    }
};
