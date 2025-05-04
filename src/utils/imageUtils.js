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
