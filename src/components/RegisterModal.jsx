import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { UserPlus, LogIn, LogOut, X } from 'lucide-react';
import { authStyles } from './AuthStyles';

// Register Modal Component
export const RegisterModal = ({ isOpen, onClose, onSwitchToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, authError, setAuthError } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await register(email, password, firstName);
            setEmail('');
            setPassword('');
            setFirstName('');
            onClose();
        } catch (error) {
            console.error("Registration error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAuthError(null);
        setEmail('');
        setPassword('');
        setFirstName('');
        onClose();
    };

    return (
        <div style={authStyles.modalOverlay} onClick={handleClose}>
            <div style={authStyles.modalContent} onClick={e => e.stopPropagation()}>
                <button style={authStyles.closeButton} onClick={handleClose}>
                    <X size={18} />
                </button>
                <h2 style={authStyles.modalTitle}>Be My Friend?</h2>
                <form style={authStyles.form} onSubmit={handleSubmit}>
                    <div style={authStyles.inputGroup}>
                        <label style={authStyles.label}>First Name</label>
                        <input
                            style={authStyles.input}
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            required
                        />
                    </div>
                    <div style={authStyles.inputGroup}>
                        <label style={authStyles.label}>Email</label>
                        <input
                            style={authStyles.input}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={authStyles.inputGroup}>
                        <label style={authStyles.label}>Password</label>
                        <input
                            style={authStyles.input}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6"
                        />
                    </div>
                    {authError && <div style={authStyles.errorMessage}>{authError}</div>}
                    <button
                        type="submit"
                        style={{
                            ...authStyles.submitButton,
                            ...(isSubmitting ? { opacity: 0.7 } : {})
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creating account...' : 'Join the circle'}
                    </button>
                </form>
                <div style={authStyles.switchText}>
                    Already a friend?{' '}
                    <span
                        style={authStyles.switchLink}
                        onClick={() => {
                            setAuthError(null);
                            onSwitchToLogin();
                        }}
                    >
                        I'm back!
                    </span>
                </div>
            </div>
        </div>
    );
};