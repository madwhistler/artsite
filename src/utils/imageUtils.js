/**
 * Utility functions for image processing
 */

/**
 * Resize an image and convert it to base64
 * @param {File} file - The image file to process
 * @param {number} maxWidth - Maximum width of the resized image
 * @param {number} maxHeight - Maximum height of the resized image
 * @returns {Promise<string>} - Promise resolving to base64 string
 */
export const resizeAndConvertToBase64 = (file, maxWidth = 400, maxHeight = 300) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                // Calculate new dimensions while maintaining aspect ratio
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = Math.round(width * (maxHeight / height));
                    height = maxHeight;
                }

                // Create canvas and resize image
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to base64 with reduced quality for JPEG
                const quality = 0.5; // Reduced quality to make file smaller
                const base64 = canvas.toDataURL(file.type, quality);

                // Get file size in KB
                const sizeInKB = Math.round(base64.length / 1.37 / 1024); // Approximate size calculation
                console.log(`Resized image: ${width}x${height}, ~${sizeInKB}KB`);

                // Check if the base64 string is too large for Firestore (max 1MB)
                if (base64.length > 900000) { // Leave some margin below 1MB
                    console.warn('Image is too large, reducing further...');
                    // Create a smaller version
                    const smallerCanvas = document.createElement('canvas');
                    const smallerWidth = Math.round(width * 0.7);
                    const smallerHeight = Math.round(height * 0.7);
                    smallerCanvas.width = smallerWidth;
                    smallerCanvas.height = smallerHeight;

                    const smallerCtx = smallerCanvas.getContext('2d');
                    smallerCtx.drawImage(img, 0, 0, smallerWidth, smallerHeight);

                    const smallerBase64 = smallerCanvas.toDataURL(file.type, 0.4);
                    console.log(`Further reduced image: ${smallerWidth}x${smallerHeight}, ~${Math.round(smallerBase64.length / 1.37 / 1024)}KB`);

                    resolve(smallerBase64);
                } else {
                    resolve(base64);
                }
            };
            img.onerror = (error) => {
                reject(error);
            };
        };
        reader.onerror = (error) => {
            reject(error);
        };
    });
};

/**
 * Convert a file to base64 without resizing
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - Promise resolving to base64 string
 */
export const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Transforms image URLs to ensure they work in both emulator and production environments
 * @param {string} url - The original image URL
 * @param {boolean} useCacheBusting - Whether to add cache busting parameters
 * @returns {string} - The transformed URL
 */
export const transformImageUrl = (url, useCacheBusting = false) => {
    if (!url) return '';

    // The correct bucket name
    const correctBucket = 'haven-artsite.firebasestorage.app';

    // If it's a Firebase Storage URL with the correct bucket
    if (url.includes(`storage.googleapis.com/${correctBucket}`)) {
        return url;
    }
    
    // If it's a Firebase Storage URL with the incorrect bucket
    if (url.includes('storage.googleapis.com/haven-artsite.appspot.com')) {
        return url.replace('haven-artsite.appspot.com', correctBucket);
    }
    
    // If it's a Firebase Storage emulator URL
    if (url.includes('localhost:9199')) {
        // For deployed site, convert emulator URLs to production format
        if (!window.location.hostname.includes('localhost')) {
            const path = url.split('?')[0].split('/o/')[1];
            return `https://storage.googleapis.com/${correctBucket}/${decodeURIComponent(path)}`;
        }
        // Keep emulator URL when running locally
        return url;
    }

    // If it's already a Google Photos URL, return it as is
    if (url.includes('lh3.googleusercontent.com')) {
        return url;
    }

    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
        let fileId = extractFileId(url);
        
        if (fileId) {
            // For Google Drive images, use the direct thumbnail approach
            // Use w0 parameter to get the original size image without cropping
            let thumbnailUrl = `https://lh3.googleusercontent.com/d/${fileId}=w0`;

            // Only add cache-busting when explicitly requested (for retries)
            if (useCacheBusting) {
                const cacheBuster = new Date().getTime();
                thumbnailUrl += `?cb=${cacheBuster}`;
            }

            return thumbnailUrl;
        }
    }

    // Only add cache-busting when explicitly requested
    if (useCacheBusting) {
        if (url.includes('?')) {
            return `${url}&cb=${new Date().getTime()}`;
        } else {
            return `${url}?cb=${new Date().getTime()}`;
        }
    }

    return url;
};

/**
 * Extracts the file ID from a Google Drive URL
 * @param {string} url - The Google Drive URL
 * @returns {string|null} - The extracted file ID or null
 */
export const extractFileId = (url) => {
    if (!url) return null;

    if (url.includes('drive.google.com')) {
        // Handle "open" format URLs: https://drive.google.com/open?id=FILE_ID
        if (url.includes('open?id=')) {
            const idParam = url.split('open?id=')[1];
            // Extract the ID part before any additional parameters
            return idParam.split('&')[0];
        }
        else if (url.includes('/file/d/')) {
            const parts = url.split('/file/d/')[1].split('/');
            if (parts.length > 0) {
                return parts[0];
            }
        }
        // Handle other formats with a generic regex
        else {
            const match = url.match(/[-\w]{25,}/);
            return match ? match[0] : null;
        }
    }

    return null;
};