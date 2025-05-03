import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Check specifically for mobile devices rather than touch capability
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

            // Use navigator.userAgent as primary check
            if (mobileRegex.test(navigator.userAgent)) {
                return true;
            }

            // Additional check for screen size typical of mobile devices
            // Most mobile devices are narrower than 768px
            if (window.innerWidth <= 768) {
                return true;
            }

            return false;
        };

        const handleResize = () => {
            setIsMobile(checkMobile());
        };

        // Initial check
        handleResize();

        // Add resize listener
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return { isMobile };
};