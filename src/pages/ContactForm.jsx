import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../components/AuthContext';
import { pageVariants } from '../animations/animationVariants';
import { NavigationContext } from '../components/NavigationContext';
import { useContext } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase.js';
import './ContactForm.css';

/**
 * Contact Form Page Component
 * @param {Object} props - Component props
 * @param {string} props.emailTo - Email address to send form submissions to
 * @param {string} props.backgroundAnimation - Background animation video path
 */
export const ContactForm = ({
  emailTo = "eilidh.haven@outlook.com",
  backgroundAnimation = "/Mihu_Frame.mp4"
}) => {
  const { currentUser } = useAuth();
  const { isBackNavigation } = useContext(NavigationContext);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const formRef = useRef(null);

  // Initialize form with user data if available
  useEffect(() => {
    if (currentUser) {
      setFormState(prev => ({
        ...prev,
        name: currentUser.displayName || '',
        email: currentUser.email || ''
      }));
    }
  }, [currentUser]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formState.name.trim()) {
      newErrors.name = 'Please enter your name';
    }

    if (!formState.email.trim()) {
      newErrors.email = 'Please enter your email';
    } else if (!/^\S+@\S+\.\S+$/.test(formState.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formState.subject.trim()) {
      newErrors.subject = 'Please enter a subject';
    }

    if (!formState.message.trim()) {
      newErrors.message = 'Please enter a message';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      console.log('Submitting contact form...');

      // Call Firebase function to send email
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
      const result = await sendContactEmail({
        name: formState.name,
        email: formState.email,
        subject: formState.subject,
        message: formState.message,
        to: emailTo
      });

      console.log('Contact form submission result:', result);

      if (result.data && result.data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thanks so much for your message! I\'ll get back to you when I can pull my head out of paint fumes.'
        });

        // Reset form
        setFormState({
          name: currentUser?.displayName || '',
          email: currentUser?.email || '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error((result.data && result.data.error) || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setSubmitStatus({
        type: 'error',
        message: error.message || 'Sorry, there was a problem sending your message. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="contact-page"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants(isBackNavigation)}
    >
      <div className="contact-background">
        <video
          className="background-video"
          src={backgroundAnimation}
          autoPlay
          loop
          muted
          playsInline
        />
      </div>

      <div className="contact-container">
        <div className="contact-form-container">
          {submitStatus?.type === 'success' ? (
            <div className="success-message">
              <h2>Thank You!</h2>
              <p>{submitStatus.message}</p>
              <button
                className="send-another-button"
                onClick={() => setSubmitStatus(null)}
              >
                You Bet!
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Your Name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formState.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="Your Email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formState.subject}
                  onChange={handleChange}
                  className={errors.subject ? 'error' : ''}
                  placeholder="Subject"
                />
                {errors.subject && <span className="error-message">{errors.subject}</span>}
              </div>

              <div className="form-group">
                <textarea
                  id="message"
                  name="message"
                  value={formState.message}
                  onChange={handleChange}
                  rows="6"
                  className={errors.message ? 'error' : ''}
                  placeholder="Your Message"
                ></textarea>
                {errors.message && <span className="error-message">{errors.message}</span>}
              </div>

              {submitStatus?.type === 'error' && (
                <div className="error-alert">
                  {submitStatus.message}
                </div>
              )}

              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="spinner" size={18} />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Contact Me!
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
};
