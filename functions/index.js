import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { google } from "googleapis";

initializeApp();

const db = getFirestore();
const storage = getStorage();

// Configuration constants
const COLLECTION_NAME = "artwork";
const SPREADSHEET_ID = "1M70uwu-jimO_ncWuPi7M0vtSeCaKeKr4RrB8OFbRsZU";
const SHEET_NAME = "Sheet2";
const IMAGES_BUCKET = "haven-art-site";
const DEV_API_KEY = 'local-dev-key';

/**
 * Fetches data from Google Sheets and associated Drive images
 * @returns {Promise<Array>} Array of row data with image information
 */
async function fetchSheetData() {
    const sheets = google.sheets('v4');
    const drive = google.drive('v3');

    try {
        // Get the sheet data
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A2:J`,
            key: process.env.GOOGLE_API_KEY
        });

        if (!response.data.values) {
            console.log('No data found in spreadsheet');
            return [];
        }

        // Attempt to get associated image files
        try {
            const imageFiles = await drive.files.list({
                q: `'${SPREADSHEET_ID}' in parents and mimeType contains 'image/'`,
                fields: 'files(id, name, webContentLink)',
                key: process.env.GOOGLE_API_KEY
            });

            console.log('Drive API response:', JSON.stringify(imageFiles.data, null, 2));
        } catch (driveError) {
            console.error('Error fetching Drive images:', driveError);
        }

        // Filter and normalize the rows
        const rows = response.data.values.filter(row => row.some(cell => cell?.trim()));
        console.log(`Found ${rows.length} non-empty rows of data`);

        return rows.map(row => {
            const paddedRow = [...row];
            while (paddedRow.length < 10) {
                paddedRow.push('');
            }
            return paddedRow;
        });

    } catch (error) {
        console.error('Error fetching sheet data:', error.message);
        if (error.response) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
        throw new Error(`Failed to fetch sheet data: ${error.message}`);
    }
}

/**
 * Converts raw sheet data to Firestore document format
 */
function formatDocument(rowData) {
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
    ] = rowData.map(cell => cell?.trim() || '');

    const normalizedId = originalId.toLowerCase().replace(/\s+/g, '-');

    return {
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
        imageData: imageData || '',
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };
}

function isAuthorized(authHeader) {
    if (!authHeader) return false;
    const token = authHeader.split('Bearer ')[1];
    if (!token) return false;
    return process.env.FUNCTIONS_EMULATOR === 'true' ? token === DEV_API_KEY : false;
}

/**
 * Main sync function exposed as HTTP endpoint
 */
export const syncArtworkFromSheets = onRequest({
    timeoutSeconds: 540,
    memory: '2GiB'
}, async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method not allowed');
            return;
        }

        const authHeader = req.headers.authorization;
        if (!isAuthorized(authHeader)) {
            res.status(401).json({
                error: 'Unauthorized',
                message: process.env.FUNCTIONS_EMULATOR === 'true'
                    ? 'Use Bearer local-dev-key for local testing'
                    : 'Invalid authorization token'
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

        const batch = db.batch();
        const results = {
            total: rows.length,
            processed: 0,
            errors: [],
            newIds: {}
        };

        for (const row of rows) {
            try {
                const [originalId] = row;
                if (!originalId?.trim()) {
                    results.errors.push(`Skipped row: Missing Item ID`);
                    continue;
                }

                const docData = formatDocument(row);
                console.log(`Processing document: ${docData.originalId}`);

                // Create a new document with auto-generated ID
                const docRef = db.collection(COLLECTION_NAME).doc();
                results.newIds[docData.originalId] = docRef.id;

                batch.set(docRef, docData);
                results.processed++;

            } catch (error) {
                console.error('Error processing row:', error);
                results.errors.push(`Error processing row: ${error.message}`);
            }
        }

        await batch.commit();

        res.status(200).json({
            message: 'Sync completed',
            ...results
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