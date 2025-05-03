import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { UserPlus, LogIn, LogOut, X } from 'lucide-react';
import { authStyles } from './AuthStyles';

// Login Modal Component
export const LoginModal = ({ isOpen, onClose, onSwitchToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, authError, setAuthError } = useAuth();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(email, password);
            setEmail('');
            setPassword('');
            onClose();
        } catch (error) {
            console.error("Login error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setAuthError(null);
        setEmail('');
        setPassword('');
        onClose();
    };

    return (
        <div style={authStyles.modalOverlay} onClick={handleClose}>
            <div style={authStyles.modalContent} onClick={e => e.stopPropagation()}>
                <button style={authStyles.closeButton} onClick={handleClose}>
                    <X size={18} />
                </button>
                <h2 style={authStyles.modalTitle}>Welcome Back!</h2>
                <form style={authStyles.form} onSubmit={handleSubmit}>
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
                        {isSubmitting ? 'Logging in...' : 'I\'m back!'}
                    </button>
                </form>
                <div style={authStyles.switchText}>
                    New here?{' '}
                    <span
                        style={authStyles.switchLink}
                        onClick={() => {
                            setAuthError(null);
                            onSwitchToRegister();
                        }}
                    >
                        Be my friend?
                    </span>
                </div>
            </div>
        </div>
    );
};