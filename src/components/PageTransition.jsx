import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { NavigationContext } from './NavigationContext';

export const PageTransition = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setIsBackNavigation } = useContext(NavigationContext);
    const isHomePage = location.pathname === '/';

    const handleBack = (e) => {
        e.stopPropagation();
        setIsBackNavigation(true);
        navigate('/');
    };

    return (
        <div className="page-container">
            {!isHomePage && (
                <button
                    onClick={handleBack}
                    style={{
                        position: 'fixed',
                        top: '2rem',
                        left: '2rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        zIndex: 100,
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#E5E5E5',
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <ChevronLeft size={32} />
                </button>
            )}
            {children}
        </div>
    );
};