/**
 * High-performance image compression and resizing
 * @param {File} file - The raw image file
 * @param {Object} options - Compression options
 */
export const compressImage = (file, options = {}) => {
    const { 
        maxWidth = 1024, 
        quality = 0.75, 
        forceSquare = false,
        format = 'image/webp' // Default to WebP for superior compression
    } = options;

    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Square cropping logic
                if (forceSquare) {
                    const size = Math.min(width, height);
                    const startX = (width - size) / 2;
                    const startY = (height - size) / 2;
                    
                    canvas.width = Math.min(size, maxWidth);
                    canvas.height = canvas.width;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, startX, startY, size, size, 0, 0, canvas.width, canvas.height);
                } else {
                    // Standard resizing
                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, width, height);
                }

                canvas.toBlob((blob) => {
                    if (blob) {
                        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        resolve(new File([blob], newFileName, {
                            type: format,
                            lastModified: Date.now(),
                        }));
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                }, format, quality);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
