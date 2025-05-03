// server.js or similar
const express = require('express');
const multer = require('multer'); // For file uploads
const fs = require('fs');
const path = require('path');
const { getAuth } = require('firebase-admin/auth');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to verify Firebase authentication
const authenticateUser = async (req, res, next) => {
    try {
        const idToken = req.headers.authorization?.split('Bearer ')[1];
        if (!idToken) throw new Error('No token provided');

        const decodedToken = await getAuth().verifyIdToken(idToken);
        if (decodedToken.email !== 'madwhistler.morris@gmail.com') {
            throw new Error('Unauthorized user');
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Save HTML content
app.post('/api/save-content', authenticateUser, (req, res) => {
    const { filePath, content } = req.body;

    // Security check: ensure path is within public directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith('public/') || normalizedPath.includes('..')) {
        return res.status(403).json({ error: 'Invalid file path' });
    }

    fs.writeFile(normalizedPath, content, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Upload image
app.post('/api/upload-image', authenticateUser, upload.single('image'), (req, res) => {
    const { destination } = req.body;

    // Security check: ensure path is within public directory
    const normalizedPath = path.normalize(destination);
    if (!normalizedPath.startsWith('public/') || normalizedPath.includes('..')) {
        return res.status(403).json({ error: 'Invalid file path' });
    }

    fs.writeFile(normalizedPath, req.file.buffer, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, path: normalizedPath });
    });
});

app.listen(3001, () => console.log('Content management API running on port 3001'));