// functions/uploadInitialContent.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Storage } = require('@google-cloud/storage');

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();
const storage = new Storage();
const bucket = storage.bucket('your-firebase-storage-bucket-name.appspot.com'); // Replace with your bucket name

/**
 * Firebase function to upload initial content from public directory to Firestore and Storage
 * This should be run once to initialize content, or whenever you want to reset to original content
 */
exports.uploadInitialContent = functions.https.onCall(async (data, context) => {
    // Check if request is made by an admin
    if (!context.auth || context.auth.token.email !== 'madwhistler.morris@gmail.com') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only the site owner can upload initial content'
        );
    }

    const contentMappings = [
        {
            textFile: 'public/content/ArtistBio.html',
            imagePath: 'public/images/ArtistPhoto.svg',
            firestoreId: 'ArtistBio.html',
            storagePath: 'editablePages/ArtistPhoto.svg'
        }
        // Add more mappings as needed for other editable pages
    ];

    const results = [];

    for (const mapping of contentMappings) {
        try {
            // Upload text content to Firestore
            const textContent = fs.readFileSync(path.join(__dirname, '..', mapping.textFile), 'utf8');
            await db.collection('editablePages').doc(mapping.firestoreId).set({
                content: textContent,
                originalPath: mapping.textFile,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            // Upload image to Storage
            const tempFilePath = path.join(os.tmpdir(), path.basename(mapping.imagePath));
            fs.copyFileSync(path.join(__dirname, '..', mapping.imagePath), tempFilePath);

            await bucket.upload(tempFilePath, {
                destination: mapping.storagePath,
                metadata: {
                    contentType: getContentType(mapping.imagePath),
                    metadata: {
                        originalPath: mapping.imagePath
                    }
                }
            });

            // Clean up temp file
            fs.unlinkSync(tempFilePath);

            results.push({
                id: mapping.firestoreId,
                status: 'success',
                message: `Content uploaded successfully`
            });
        } catch (error) {
            console.error(`Error uploading content for ${mapping.firestoreId}:`, error);
            results.push({
                id: mapping.firestoreId,
                status: 'error',
                message: error.message
            });
        }
    }

    return { results };
});

// Helper function to determine content type
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.png':
            return 'image/png';
        case '.gif':
            return 'image/gif';
        case '.svg':
            return 'image/svg+xml';
        case '.html':
            return 'text/html';
        default:
            return 'application/octet-stream';
    }
}