import React, { createContext, useState, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const NavigationContext = createContext({
    isBackNavigation: false,
    setIsBackNavigation: () => {}
});

export const NavigationProvider = ({ children }) => {
    const [isBackNavigation, setIsBackNavigation] = useState(false);
    const location = useLocation();

    // Use useLayoutEffect to ensure navigation state is updated before animations
    useLayoutEffect(() => {
        const timer = setTimeout(() => {
            setIsBackNavigation(false);
        }, 50);
        return () => clearTimeout(timer);
    }, [location.pathname]);

    return (
        <NavigationContext.Provider value={{ isBackNavigation, setIsBackNavigation }}>
            {children}
        </NavigationContext.Provider>
    );
};