import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { UserPlus, LogIn, LogOut, X } from 'lucide-react';
import {LoginModal} from "@/components/LoginModal.jsx";
import {RegisterModal} from "@/components/RegisterModal.jsx";
import { authStyles } from './AuthStyles';

// Main Authentication Controls Component
export const AuthControls = () => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const { currentUser, logout } = useAuth();
    const [buttonHover, setButtonHover] = useState(null);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const openLoginModal = () => {
        setShowRegisterModal(false);
        setShowLoginModal(true);
    };

    const openRegisterModal = () => {
        setShowLoginModal(false);
        setShowRegisterModal(true);
    };

    const closeModals = () => {
        setShowLoginModal(false);
        setShowRegisterModal(false);
    };

    return (
        <div style={authStyles.container}>
            {currentUser ? (
                <div style={authStyles.authButtons}>
                    <div style={authStyles.userInfo}>
                        <span style={authStyles.greeting}>hello my friend</span>
                        <span style={authStyles.userName}>{currentUser.displayName}</span>
                    </div>
                    <button
                        style={{
                            ...authStyles.authButton,
                            ...(buttonHover === 'logout' ? authStyles.authButtonHover : {})
                        }}
                        onClick={handleLogout}
                        onMouseEnter={() => setButtonHover('logout')}
                        onMouseLeave={() => setButtonHover(null)}
                    >
                        <LogOut size={16} />
                        <span>signoff</span>
                    </button>
                </div>
            ) : (
                <div style={authStyles.authButtons}>
                    <button
                        style={{
                            ...authStyles.authButton,
                            ...(buttonHover === 'register' ? authStyles.authButtonHover : {})
                        }}
                        onClick={openRegisterModal}
                        onMouseEnter={() => setButtonHover('register')}
                        onMouseLeave={() => setButtonHover(null)}
                    >
                        <UserPlus size={16} />
                        <span>be my friend?</span>
                    </button>
                    <button
                        style={{
                            ...authStyles.authButton,
                            ...(buttonHover === 'login' ? authStyles.authButtonHover : {})
                        }}
                        onClick={openLoginModal}
                        onMouseEnter={() => setButtonHover('login')}
                        onMouseLeave={() => setButtonHover(null)}
                    >
                        <LogIn size={16} />
                        <span>i'm back!</span>
                    </button>
                </div>
            )}

            <LoginModal
                isOpen={showLoginModal}
                onClose={closeModals}
                onSwitchToRegister={openRegisterModal}
            />
            <RegisterModal
                isOpen={showRegisterModal}
                onClose={closeModals}
                onSwitchToLogin={openLoginModal}
            />
        </div>
    );
};