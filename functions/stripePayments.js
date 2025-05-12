// Stripe payment processing functions
import { onCall } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { db } from './admin.js';

// Initialize Stripe with the secret key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a payment intent for contributions/donations
 * Supports both anonymous and identified contributors
 */
export const createContributionIntent = onCall({
  timeoutSeconds: 30,
  memory: '256MiB',
}, async (request) => {
  try {
    console.log('Contribution request received:', request.data);
    
    const { 
      amount, 
      isAnonymous = false, 
      contributorInfo = {},
      message = ''
    } = request.data;
    
    // Validate amount
    if (!amount || amount <= 0) {
      throw new Error('Contribution amount must be greater than 0');
    }
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents for Stripe
      currency: 'usd',
      metadata: {
        type: 'contribution',
        isAnonymous: isAnonymous.toString(),
        contributorName: isAnonymous ? 'Anonymous' : (contributorInfo.name || ''),
        contributorEmail: isAnonymous ? '' : (contributorInfo.email || ''),
        message: message || ''
      }
    });
    
    // Store payment intent in Firestore
    await db.collection('contributions').doc(paymentIntent.id).set({
      status: 'created',
      amount: amount,
      isAnonymous,
      contributorInfo: isAnonymous ? { name: 'Anonymous' } : contributorInfo,
      message: message || '',
      createdAt: new Date(),
      paymentIntentId: paymentIntent.id,
      metadata: paymentIntent.metadata
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      amount: amount
    };
  } catch (error) {
    console.error('Error creating contribution payment intent:', error);
    throw new Error(error.message);
  }
});

/**
 * Webhook to handle Stripe events
 * Primarily used to update contribution status and send thank you emails
 */
export const stripeWebhook = onRequest({
  timeoutSeconds: 60,
  memory: '256MiB',
}, async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  try {
    // Verify webhook signature
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    
    if (endpointSecret) {
      try {
        event = stripe.webhooks.constructEvent(
          req.rawBody,
          signature,
          endpointSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // For development without webhook signing
      event = req.body;
      console.log('Using webhook event without signature verification (development mode)');
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    res.status(200).send({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

/**
 * Handle successful payment
 * @param {Object} paymentIntent - The Stripe payment intent object
 */
async function handleSuccessfulPayment(paymentIntent) {
  try {
    const { id, metadata } = paymentIntent;
    
    // Check if this is a contribution
    if (metadata.type === 'contribution') {
      // Update contribution status in Firestore
      const contributionRef = db.collection('contributions').doc(id);
      const contributionDoc = await contributionRef.get();
      
      if (contributionDoc.exists) {
        await contributionRef.update({
          status: 'succeeded',
          updatedAt: new Date()
        });
        
        // Send thank you email if not anonymous
        if (metadata.isAnonymous !== 'true' && metadata.contributorEmail) {
          await sendThankYouEmail(paymentIntent);
        }
        
        // Send notification to admin
        await sendAdminNotification(paymentIntent);
      } else {
        console.error('Contribution document not found for payment intent:', id);
      }
    }
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 * @param {Object} paymentIntent - The Stripe payment intent object
 */
async function handleFailedPayment(paymentIntent) {
  try {
    const { id, metadata } = paymentIntent;
    
    // Check if this is a contribution
    if (metadata.type === 'contribution') {
      // Update contribution status in Firestore
      const contributionRef = db.collection('contributions').doc(id);
      const contributionDoc = await contributionRef.get();
      
      if (contributionDoc.exists) {
        await contributionRef.update({
          status: 'failed',
          updatedAt: new Date(),
          lastError: paymentIntent.last_payment_error?.message || 'Payment failed'
        });
      } else {
        console.error('Contribution document not found for payment intent:', id);
      }
    }
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

/**
 * Send thank you email to contributor
 * @param {Object} paymentIntent - The Stripe payment intent object
 */
async function sendThankYouEmail(paymentIntent) {
  try {
    const { metadata } = paymentIntent;
    const amount = paymentIntent.amount / 100; // Convert from cents
    
    // Create email data for firestore-send-email extension
    const emailData = {
      to: metadata.contributorEmail,
      message: {
        subject: 'Thank You for Your Contribution',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank You for Your Contribution</h2>
            <p>Dear ${metadata.contributorName},</p>
            <p>Thank you for your generous contribution of $${amount.toFixed(2)}. Your support is greatly appreciated.</p>
            ${metadata.message ? `<p>Your message: "${metadata.message}"</p>` : ''}
            <p>With gratitude,</p>
            <p>Haven Morris Visual Arts</p>
          </div>
        `
      }
    };
    
    // Use the firestore-send-email extension
    const emailRef = db.collection('mail').doc();
    await emailRef.set(emailData);
    
    console.log('Thank you email sent to:', metadata.contributorEmail);
  } catch (error) {
    console.error('Error sending thank you email:', error);
    // Don't throw, as this shouldn't block the payment process
  }
}

/**
 * Send notification to admin
 * @param {Object} paymentIntent - The Stripe payment intent object
 */
async function sendAdminNotification(paymentIntent) {
  try {
    const { metadata } = paymentIntent;
    const amount = paymentIntent.amount / 100; // Convert from cents
    const adminEmail = process.env.DEFAULT_EMAIL_TO || 'eilidh.haven@outlook.com';
    
    // Create email data for firestore-send-email extension
    const emailData = {
      to: adminEmail,
      message: {
        subject: 'New Contribution Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Contribution Received</h2>
            <p>A new contribution of $${amount.toFixed(2)} has been received.</p>
            <p>Contributor: ${metadata.isAnonymous === 'true' ? 'Anonymous' : metadata.contributorName}</p>
            ${metadata.contributorEmail ? `<p>Email: ${metadata.contributorEmail}</p>` : ''}
            ${metadata.message ? `<p>Message: "${metadata.message}"</p>` : ''}
            <p>Payment ID: ${paymentIntent.id}</p>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
        `
      }
    };
    
    // Use the firestore-send-email extension
    const emailRef = db.collection('mail').doc();
    await emailRef.set(emailData);
    
    console.log('Admin notification email sent to:', adminEmail);
  } catch (error) {
    console.error('Error sending admin notification:', error);
    // Don't throw, as this shouldn't block the payment process
  }
}
