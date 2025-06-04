import { onCall } from 'firebase-functions/v2/https';
// Import shared Firebase Admin initialization
import { db } from './admin.js';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_EMAILS_PER_IP = 5;
const MAX_EMAILS_PER_EMAIL = 3;

// Firestore instance is imported from admin.js

/**
 * Firebase function to send contact form emails
 * Includes rate limiting by IP address and email address
 */
// Updated function with CORS and better logging
export const sendContactEmail = onCall({
  timeoutSeconds: 30,
  memory: '256MiB',
  maxInstances: 10,
  invoker: 'public', // Allow unauthenticated access
  cors: true, // Allow all origins
}, async (request) => {
  console.log('Contact form function called with request:', {
    ip: request.rawRequest?.ip || 'unknown',
    headers: request.rawRequest?.headers || {},
    method: request.rawRequest?.method || 'unknown',
    url: request.rawRequest?.url || 'unknown'
  });
  try {
    console.log('Contact form submission received:', request.data);

    // Extract data from request
    const { name, email, subject, message, to } = request.data;
    const timestamp = new Date();
    const ip = request?.rawRequest?.ip || request?.context?.rawRequest?.ip || 'unknown';

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return {
        success: false,
        error: 'Missing required fields'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: 'Invalid email format'
      };
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimits(ip, email);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.message
      };
    }

    // Set up email data for the firestore-send-email extension
    const toEmail = to || process.env.DEFAULT_EMAIL_TO || 'eilidh.haven@outlook.com';

    // Create the email data object according to the extension's requirements
    const emailData = {
      to: toEmail,
      replyTo: email,
      message: {
        subject: `Contact Form: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a6c6f;">New Contact Form Message</h2>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #4a6c6f;">
              <p style="white-space: pre-line;">${message}</p>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">
              This message was sent from the contact form on your website.
            </p>
          </div>
        `
      }
    };

    // Send the email via Firestore
    console.log('Sending email via Firestore mail collection...');
    try {
      const emailId = await sendEmailViaFirestore(emailData);
      console.log('Mail document created successfully with ID:', emailId);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email: ' + (error.message || 'Unknown error'));
    }



    // Record the email in Firestore for rate limiting
    await recordEmailSent(ip, email, {
      name,
      email,
      subject,
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      timestamp,
      ip
    });

    return {
      success: true,
      message: 'Email sent successfully'
    };

  } catch (error) {
    console.error('Error sending email:', error);

    return {
      success: false,
      error: 'Failed to send email'
    };
  }
});

/**
 * Send email using the firestore-send-email extension
 * @param {Object} emailData - Email data including to, subject, and message
 * @returns {Promise<string>} - Document ID of the created email
 */
async function sendEmailViaFirestore(emailData) {
  try {
    // Create a document in the 'mail' collection
    const emailRef = db.collection('mail').doc();

    // Set the email data
    await emailRef.set(emailData);

    console.log('Email document created with ID:', emailRef.id);
    return emailRef.id;
  } catch (error) {
    console.error('Error creating email document:', error);
    throw error;
  }
}

/**
 * Check rate limits for IP and email address
 */
async function checkRateLimits(ip, email) {
  // Skip rate limiting in development/emulator
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    console.log('Rate limiting skipped in development environment');
    return { allowed: true };
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_LIMIT_WINDOW_MS);

    // Check IP address rate limit
    const ipRef = db.collection('contactFormRateLimit').doc(ip);
    const ipDoc = await ipRef.get();

    if (ipDoc.exists) {
      const ipData = ipDoc.data();
      const recentEmails = ipData.timestamps.filter(timestamp =>
        timestamp.toDate() >= windowStart
      );

      if (recentEmails.length >= MAX_EMAILS_PER_IP) {
        return {
          allowed: false,
          message: 'Rate limit exceeded. Please try again later.'
        };
      }
    }

    // Check email address rate limit
    const emailRef = db.collection('contactFormRateLimit').doc(`email_${email}`);
    const emailDoc = await emailRef.get();

    if (emailDoc.exists) {
      const emailData = emailDoc.data();
      const recentEmails = emailData.timestamps.filter(timestamp =>
        timestamp.toDate() >= windowStart
      );

      if (recentEmails.length >= MAX_EMAILS_PER_EMAIL) {
        return {
          allowed: false,
          message: 'Rate limit exceeded for this email address. Please try again later.'
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking rate limits:', error);
    // If there's an error checking rate limits, allow the request to proceed
    return { allowed: true };
  }
}

/**
 * Record email sent for rate limiting
 */
async function recordEmailSent(ip, email, metadata) {
  // Skip recording in development/emulator
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    console.log('Email recording skipped in development environment');
    console.log('Would record metadata:', metadata);
    return;
  }

  try {
    const now = new Date();
    const batch = db.batch();

    // Update IP record
    const ipRef = db.collection('contactFormRateLimit').doc(ip);
    const ipDoc = await ipRef.get();

    if (ipDoc.exists) {
      batch.update(ipRef, {
        timestamps: [...ipDoc.data().timestamps, now],
        lastEmail: now,
        count: ipDoc.data().count + 1
      });
    } else {
      batch.set(ipRef, {
        timestamps: [now],
        firstEmail: now,
        lastEmail: now,
        count: 1
      });
    }

    // Update email record
    const emailRef = db.collection('contactFormRateLimit').doc(`email_${email}`);
    const emailDoc = await emailRef.get();

    if (emailDoc.exists) {
      batch.update(emailRef, {
        timestamps: [...emailDoc.data().timestamps, now],
        lastEmail: now,
        count: emailDoc.data().count + 1
      });
    } else {
      batch.set(emailRef, {
        timestamps: [now],
        firstEmail: now,
        lastEmail: now,
        count: 1
      });
    }

    // Store the email metadata
    const metadataRef = db.collection('contactFormSubmissions').doc();
    batch.set(metadataRef, metadata);

    // Commit all updates
    await batch.commit();
  } catch (error) {
    console.error('Error recording email sent:', error);
    // Continue even if recording fails
  }
}
