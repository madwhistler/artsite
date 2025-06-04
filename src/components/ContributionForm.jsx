import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

// Load Stripe outside of component render to avoid recreating the Stripe object on every render
// Use the publishable key from environment variables
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Predefined contribution amounts
const CONTRIBUTION_AMOUNTS = [5, 10, 25, 50, 100];

// Styles for the form
const formStyles = {
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    backgroundColor: '#333',
    color: '#fff',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#555',
    borderRadius: '5px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '1rem',
    backgroundColor: '#333',
    color: '#fff',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#555',
    borderRadius: '5px',
    minHeight: '100px',
    outline: 'none',
    resize: 'vertical',
  },
  amountButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px',
  },
  amountButton: {
    flex: '1 0 calc(25% - 10px)',
    padding: '10px',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
  },
  amountButtonSelected: {
    backgroundColor: '#f8c630',
    color: '#000',
    border: '1px solid #f8c630',
  },
  customAmountContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  currencySymbol: {
    position: 'absolute',
    left: '12px',
    fontSize: '1rem',
    color: '#aaa',
  },
  customAmountInput: {
    width: '100%',
    padding: '12px 12px 12px 30px',
    fontSize: '1rem',
    backgroundColor: '#333',
    color: '#fff',
    border: '1px solid #555',
    borderRadius: '5px',
    outline: 'none',
  },
  checkbox: {
    marginRight: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1rem',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  cardElement: {
    padding: '12px',
    backgroundColor: '#333',
    border: '1px solid #555',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#f8c630',
    color: '#000',
    border: 'none',
    borderRadius: '5px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: '20px',
    fontSize: '0.9rem',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderRadius: '10px',
  },
  processingText: {
    color: '#fff',
    fontSize: '1.2rem',
    textAlign: 'center',
  }
};

// Card element options
const cardElementOptions = {
  style: {
    base: {
      color: '#fff',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4'
      }
    },
    invalid: {
      color: '#ff6b6b',
      iconColor: '#ff6b6b'
    }
  }
};

// The actual form component that uses Stripe Elements
const ContributionFormContent = ({ currentUser, onSuccess, anonymous = false }) => {
  const stripe = useStripe();
  const elements = useElements();

  // Form state
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [contributorInfo, setContributorInfo] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    message: ''
  });

  // UI state
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Update contributor info when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setContributorInfo(prev => ({
        ...prev,
        name: currentUser.displayName || prev.name,
        email: currentUser.email || prev.email
      }));
    }
  }, [currentUser]);

  // Handle predefined amount selection
  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount);
    setIsCustomAmount(false);
  };

  // Handle custom amount input
  const handleCustomAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setCustomAmount(value);

    if (value && !isNaN(parseFloat(value))) {
      setAmount(parseFloat(value));
    } else {
      setAmount(0);
    }
  };

  // Handle contributor info changes
  const handleContributorInfoChange = (e) => {
    const { name, value } = e.target;
    setContributorInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }

    // Validate amount
    if (amount <= 0) {
      setError('Please enter a valid contribution amount');
      return;
    }

    // Validate contributor info if not anonymous
    if (!anonymous) {
      if (!contributorInfo.name.trim()) {
        setError('Please enter your name');
        return;
      }

      if (!contributorInfo.email.trim()) {
        setError('Please enter your email');
        return;
      }

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contributorInfo.email)) {
        setError('Please enter a valid email address');
        return;
      }
    }

    setError(null);
    setProcessing(true);

    try {
      // Create payment intent on the server
      const createContributionIntent = httpsCallable(functions, 'createContributionIntent');
      const { data } = await createContributionIntent({
        amount,
        isAnonymous: anonymous,
        contributorInfo: anonymous ? {} : contributorInfo,
        message: contributorInfo.message
      });

      // Confirm card payment
      const cardElement = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: anonymous ? {} : {
              name: contributorInfo.name,
              email: contributorInfo.email
            }
          }
        }
      );

      if (stripeError) {
        setError(stripeError.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Payment successful
        onSuccess(amount);
      } else {
        setError('Payment processing failed. Please try again.');
      }
    } catch (err) {
      console.error('Error processing contribution:', err);
      setError(err.message || 'An error occurred while processing your contribution');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
      {/* Predefined amounts */}
      <div style={formStyles.formGroup}>
        <label style={formStyles.label}>Select Contribution Amount</label>
        <div style={formStyles.amountButtons}>
          {CONTRIBUTION_AMOUNTS.map(amt => (
            <button
              key={amt}
              type="button"
              style={{
                ...formStyles.amountButton,
                ...(amount === amt && !isCustomAmount ? formStyles.amountButtonSelected : {})
              }}
              onClick={() => handleAmountSelect(amt)}
            >
              ${amt}
            </button>
          ))}
        </div>
      </div>

      {/* Custom amount */}
      <div style={formStyles.formGroup}>
        <label style={formStyles.label}>
          <input
            type="checkbox"
            checked={isCustomAmount}
            onChange={() => setIsCustomAmount(!isCustomAmount)}
            style={formStyles.checkbox}
          />
          Custom Amount
        </label>

        {isCustomAmount && (
          <div style={{ position: 'relative' }}>
            <span style={formStyles.currencySymbol}>$</span>
            <input
              type="text"
              value={customAmount}
              onChange={handleCustomAmountChange}
              placeholder="Enter amount"
              style={formStyles.customAmountInput}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Contributor info (if not anonymous) */}
      {!anonymous && (
        <>
          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Name</label>
            <input
              type="text"
              name="name"
              value={contributorInfo.name}
              onChange={handleContributorInfoChange}
              placeholder="Your name"
              style={formStyles.input}
              required
            />
          </div>

          <div style={formStyles.formGroup}>
            <label style={formStyles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={contributorInfo.email}
              onChange={handleContributorInfoChange}
              placeholder="Your email"
              style={formStyles.input}
              required
            />
          </div>
        </>
      )}

      {/* Message (optional) */}
      <div style={formStyles.formGroup}>
        <textarea
          name="message"
          value={contributorInfo.message}
          onChange={handleContributorInfoChange}
          placeholder="Scribble me a note?"
          style={formStyles.textarea}
        />
      </div>

      {/* Card element */}
      <div style={formStyles.formGroup}>
        <label style={formStyles.label}>Card Details</label>
        <div style={formStyles.cardElement}>
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div style={formStyles.error}>
          {error}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!stripe || processing || amount <= 0}
        style={{
          ...formStyles.button,
          ...((!stripe || processing || amount <= 0) ? formStyles.buttonDisabled : {})
        }}
      >
        {processing ? 'Processing...' : `Contribute $${amount.toFixed(2)}`}
      </button>

      {/* Processing overlay */}
      {processing && (
        <div style={formStyles.processingOverlay}>
          <div style={formStyles.processingText}>
            Processing your contribution...
          </div>
        </div>
      )}
    </form>
  );
};

// Wrapper component that provides the Stripe context
export const ContributionForm = ({ currentUser, onSuccess, anonymous = false }) => {
  return (
    <Elements stripe={stripePromise}>
      <ContributionFormContent
        currentUser={currentUser}
        onSuccess={onSuccess}
        anonymous={anonymous}
      />
    </Elements>
  );
};
