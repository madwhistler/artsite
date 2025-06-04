// Import shared Firebase Admin initialization
import { db, storage } from './admin.js';
import { google } from "googleapis";
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';
import fetch from 'node-fetch';

// Contact form function will be imported after Firebase Admin is initialized

// Import firebase-functions using dynamic import
let functionsV1;
let onRequest;

try {
  const functionsModule = await import('firebase-functions');
  functionsV1 = functionsModule.default || functionsModule;

  const functionsV2Module = await import('firebase-functions/v2/https');
  onRequest = functionsV2Module.onRequest;
} catch (error) {
  console.error('Error importing firebase-functions:', error);
}

// Firebase Admin is initialized in admin.js

const COLLECTION_NAME = "artwork";
const SPREADSHEET_ID = "1M70uwu-jimO_ncWuPi7M0vtSeCaKeKr4RrB8OFbRsZU";
const SHEET_NAME = "Sheet2";
const API_KEYS = new Set([process.env.SYNC_API_KEY, 'doom-puppies-poop-on-trump-with-artistic-intent']);

function validateApiKey(authHeader) {
    if (!authHeader?.startsWith('Bearer ')) return false;
    const apiKey = authHeader.split('Bearer ')[1];
    return API_KEYS.has(apiKey);
}

async function getAuthClient() {
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';

    if (isEmulator) {
        try {
            // In local environment, use service account credentials
            const __dirname = path.dirname(fileURLToPath(import.meta.url));
            const keyPath = path.join(__dirname, 'config', 'credentials.json');

            // Always use the credentials file for authentication
            return new google.auth.GoogleAuth({
                keyFile: keyPath,
                scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
            }).getClient();
        } catch (error) {
            console.error('Error loading local credentials:', error);
            throw new Error('Failed to initialize local auth client: ' + error.message);
        }
    } else {
        // In deployed environment, use default credentials
        return new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        }).getClient();
    }
}

async function fetchSheetData() {
    // Access the actual spreadsheet data
    const sheets = google.sheets('v4');
    try {
        const authClient = await getAuthClient();

        const [valuesResponse, formattingResponse] = await Promise.all([
            sheets.spreadsheets.values.get({
                auth: authClient,
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEET_NAME}!A2:L` // Include column L for tags
            }),
            sheets.spreadsheets.get({
                auth: authClient,
                spreadsheetId: SPREADSHEET_ID,
                ranges: [`${SHEET_NAME}!A2:L`], // Include column L for tags
                fields: 'sheets.data.rowData.values.hyperlink,sheets.data.rowData.values.formattedValue'
            })
        ]);

        if (!valuesResponse.data.values) {
            console.log('No data found in spreadsheet');
            return [];
        }

        const values = valuesResponse.data.values;
        const formatting = formattingResponse.data.sheets[0].data[0].rowData || [];

        const enrichedRows = values.map((row, rowIndex) => {
            const formattingRow = formatting[rowIndex]?.values || [];
            return row.map((value, colIndex) => {
                const cellFormatting = formattingRow[colIndex] || {};
                return {
                    value: value || '',
                    hyperlink: cellFormatting.hyperlink || ''
                };
            });
        });

        return enrichedRows.filter(row => row.some(cell => cell.value?.trim()));
    } catch (error) {
        console.error('Error fetching sheet data:', error.message);
        if (error.response) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(`Failed to fetch sheet data: ${error.message}`);
    }
}

/**
 * Extract file ID from a Google Drive URL
 * @param {string} url - The Google Drive URL
 * @returns {string|null} - The file ID or null if not found
 */
function extractFileId(url) {
    if (!url) return null;

    // Handle "open" format URLs: https://drive.google.com/open?id=FILE_ID
    if (url.includes('open?id=')) {
        const idParam = url.split('open?id=')[1];
        // Extract the ID part before any additional parameters
        return idParam.split('&')[0];
    }

    // Handle "file/d" format URLs: https://drive.google.com/file/d/FILE_ID/view
    if (url.includes('/file/d/')) {
        const parts = url.split('/file/d/')[1].split('/');
        if (parts.length > 0) {
            return parts[0];
        }
    }

    // Handle direct lh3.googleusercontent.com URLs
    if (url.includes('lh3.googleusercontent.com/d/')) {
        const parts = url.split('lh3.googleusercontent.com/d/')[1].split('=');
        if (parts.length > 0) {
            return parts[0];
        }
    }

    // Handle other formats with a generic regex
    const match = url.match(/[-\w]{25,}/);
    return match ? match[0] : null;
}



/**
 * Check if an image already exists in Firebase Storage
 * @param {string} storagePath - The path to check in Firebase Storage
 * @returns {Promise<boolean>} - Promise resolving to true if the image exists
 */
async function checkImageExistsInStorage(storagePath) {
    try {
        const file = storage.bucket().file(storagePath);
        const [exists] = await file.exists();
        return exists;
    } catch (error) {
        console.error(`Error checking if image exists at ${storagePath}:`, error);
        return false;
    }
}

/**
 * Get the public URL for an image in Firebase Storage
 * @param {string} storagePath - The path to the image in Firebase Storage
 * @returns {string} - The public URL
 */
function getStorageImageUrl(storagePath) {
    // Check if we're in the emulator environment
    const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true';
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || storage.bucket().name;

    if (isEmulator) {
        // For emulator, use the standard emulator URL format
        return `http://localhost:9199/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media`;
    } else {
        // For production, use the standard Storage URL format
        return `https://storage.googleapis.com/${bucketName}/${storagePath}`;
    }
}

/**
 * Download an image from Google Drive
 * @param {string} fileId - The Google Drive file ID
 * @returns {Promise<Buffer>} - Promise resolving to image buffer
 */
async function downloadImageFromGoogleDrive(fileId) {
    if (!fileId) {
        throw new Error('No file ID provided');
    }

    const url = `https://lh3.googleusercontent.com/d/${fileId}=w0`;
    console.log(`Downloading image from: ${url}`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
        }

        return await response.buffer();
    } catch (error) {
        console.error(`Error downloading image with ID ${fileId}:`, error);
        throw error;
    }
}

/**
 * Upload an image to Firebase Storage
 * @param {Buffer} imageBuffer - The image data
 * @param {string} artworkId - The artwork ID
 * @param {string} fileId - The original Google Drive file ID
 * @returns {Promise<string>} - Promise resolving to the public URL
 */
async function uploadImageToStorage(imageBuffer, artworkId, fileId) {
    if (!imageBuffer) {
        throw new Error('No image buffer provided');
    }

    // Create a unique path for the image
    const storagePath = `artwork-images/${artworkId}/${fileId}.jpg`;

    try {
        // Get content type from the first few bytes of the buffer
        let contentType = 'image/jpeg'; // Default to JPEG
        if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50 && imageBuffer[2] === 0x4E && imageBuffer[3] === 0x47) {
            contentType = 'image/png';
        } else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49 && imageBuffer[2] === 0x46) {
            contentType = 'image/gif';
        }

        // Upload to Firebase Storage
        const file = storage.bucket().file(storagePath);

        // Save the file
        await file.save(imageBuffer, {
            metadata: {
                contentType,
                cacheControl: 'public, max-age=31536000' // 1 year cache
            }
        });

        // Make the file publicly accessible
        await file.makePublic();

        // Get the public URL
        const publicUrl = getStorageImageUrl(storagePath);

        // Verify the URL is accessible
        try {
            const testResponse = await fetch(publicUrl, { method: 'HEAD' });
            if (!testResponse.ok) {
                console.warn(`Warning: URL ${publicUrl} returned status ${testResponse.status}`);
            }
        } catch (testError) {
            console.warn(`Warning: Error testing URL ${publicUrl}: ${testError.message}`);
        }

        return publicUrl;
    } catch (error) {
        console.error(`Error uploading image for artwork ${artworkId}:`, error);
        throw error;
    }
}

function formatDocument(rowData) {
    // Extract the first 10 fields
    const [
        originalId,
        itemName,
        price,
        status,
        notes,
        medium,
        height,
        width,
        date,
        imageData
    ] = rowData.slice(0, 10).map(cell => cell.value?.trim() || '');

    // Extract image URL from the 11th column (index 10)
    const imageUrl = rowData[10]?.hyperlink || rowData[10]?.value || '';

    // Extract tags from the 12th column (index 11) if it exists
    const tagsString = rowData[11]?.value || '';

    // Process tags if they exist - split by comma and trim each tag
    const tagArray = tagsString
        ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

    const normalizedId = originalId.toLowerCase().replace(/\s+/g, '-');

    // Extract the Google Drive file ID from the image URL
    const fileId = extractFileId(imageUrl);

    const document = {
        originalId,
        normalizedId,
        itemName: itemName || '',
        price: parseFloat(price) || 0,
        status: status?.toLowerCase() || '',
        notes: notes || '',
        medium: medium || '',
        dimensions: {
            height: parseInt(height) || 0,
            width: parseInt(width) || 0
        },
        date: date || '',
        originalImageUrl: imageUrl, // Keep the original URL for reference
        googleDriveFileId: fileId, // Store the Google Drive file ID
        imageUrl: '', // Will be updated with Firebase Storage URL
        imageTitle: imageData || '',
        tags: tagArray, // Add the processed tags array
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    return document;
}

// Import and export the contact form function
import { sendContactEmail as contactEmailFunc } from './sendContactEmail.js';
export const sendContactEmail = contactEmailFunc;

// Import and export the Stripe payment functions
import { createContributionIntent, stripeWebhook } from './stripePayments.js';
export { createContributionIntent, stripeWebhook };

// Updated function with CORS and better logging
export const syncArtworkFromSheets = onRequest({
    timeoutSeconds: 540,
    memory: '2GiB',
    invoker: 'public', // Allow unauthenticated access
    cors: true, // Allow all origins
}, async (req, res) => {
    console.log('Sync artwork function called ');
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method not allowed');
            return;
        }

        if (!validateApiKey(req.headers.authorization)) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid API key'
            });
            return;
        }

        const rows = await fetchSheetData();

        if (!rows.length) {
            res.status(200).json({
                message: 'No data to sync',
                total: 0,
                processed: 0,
                errors: []
            });
            return;
        }

        // Start processing

        const batch = db.batch();
        const results = {
            total: rows.length,
            processed: 0,
            errors: [],
            newIds: {},
            imagesProcessed: 0
        };

        // Create a Set to collect unique tags
        const uniqueTags = new Set();

        for (const [index, row] of rows.entries()) {
            try {
                console.log(`\nProcessing row ${index + 1}/${rows.length}`);
                const originalId = row[0].value?.trim();
                if (!originalId) {
                    results.errors.push(`Skipped row ${index + 1}: Missing Item ID`);
                    continue;
                }

                // Format the document data
                const docData = formatDocument(row);

                // Create a document reference with a unique ID
                const docRef = db.collection(COLLECTION_NAME).doc();
                const artworkId = docRef.id;
                results.newIds[docData.originalId] = artworkId;

                // Process the image if a file ID is available
                if (docData.googleDriveFileId) {
                    try {
                        console.log(`Processing image for artwork ${docData.originalId} (${artworkId})`);

                        // Define the storage path for this image
                        const storagePath = `artwork-images/${artworkId}/${docData.googleDriveFileId}.jpg`;
                        docData.storageImagePath = storagePath;

                        // Check if the image already exists in Firebase Storage
                        const imageExists = await checkImageExistsInStorage(storagePath);

                        if (imageExists) {
                            // Image already exists, just get the URL
                            console.log(`Image for artwork ${docData.originalId} already exists in Storage. Skipping download.`);
                            const storageUrl = await getStorageImageUrl(storagePath);
                            docData.imageUrl = storageUrl;
                            results.imagesProcessed++;
                        } else {
                            // Image doesn't exist, download from Google Drive and upload to Storage
                            console.log(`Image for artwork ${docData.originalId} not found in Storage. Downloading from Google Drive.`);

                            // Download the image from Google Drive
                            const imageBuffer = await downloadImageFromGoogleDrive(docData.googleDriveFileId);

                            // Upload the image to Firebase Storage
                            const uploadResult = await uploadImageToStorage(imageBuffer, artworkId, docData.googleDriveFileId);

                            // Update the document with the Firebase Storage URL
                            docData.imageUrl = uploadResult;

                            results.imagesProcessed++;
                        }
                    } catch (imageError) {
                        console.error(`Error processing image for artwork ${docData.originalId}:`, imageError);
                        results.errors.push(`Error processing image for row ${index + 1}: ${imageError.message}`);

                        // If image processing fails, fall back to the original URL
                        docData.imageUrl = docData.originalImageUrl;
                    }
                } else {
                    console.warn(`No Google Drive file ID found for artwork ${docData.originalId}`);
                    // If no file ID is found, use the original URL
                    docData.imageUrl = docData.originalImageUrl;
                }

                console.log(`Processed document ${docData.originalId}:`, {
                    originalImageUrl: docData.originalImageUrl,
                    storageImageUrl: docData.imageUrl,
                    imageTitle: docData.imageTitle,
                    tags: docData.tags
                });

                // Add each tag to the uniqueTags Set
                if (docData.tags && Array.isArray(docData.tags)) {
                    docData.tags.forEach(tag => uniqueTags.add(tag));
                }

                // Add the document to the batch
                batch.set(docRef, docData);
                results.processed++;

            } catch (error) {
                console.error(`Error processing row ${index + 1}:`, error);
                results.errors.push(`Error processing row ${index + 1}: ${error.message}`);
            }
        }

        // Commit all the documents to Firestore
        await batch.commit();

        // Convert the Set to a sorted array and log all unique tags
        const allUniqueTags = Array.from(uniqueTags).sort();
        console.log('\n==== ALL UNIQUE TAGS AVAILABLE FOR GALLERY FILTERS ====');
        console.log(allUniqueTags);
        console.log(`Total unique tags: ${allUniqueTags.length}`);
        console.log('====================================================\n');



        res.status(200).json({
            message: 'Sync completed',
            ...results,
            imagesProcessed: results.imagesProcessed
        });

    } catch (error) {
        console.error('Sync failed:', error);
        res.status(500).json({
            error: 'Sync failed',
            message: error.message,
            stack: process.env.FUNCTIONS_EMULATOR === 'true' ? error.stack : undefined
        });
    }
});
