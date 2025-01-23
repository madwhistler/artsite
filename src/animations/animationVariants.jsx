// Common transition settings
const pageTransition = {
    type: 'tween',
    duration: 0.5,
    ease: 'easeInOut'
};

export const pageVariants = (isBackNavigation) => ({
    initial: {
        x: isBackNavigation ? '-100%' : '100%',
        opacity: 0,
        position: 'fixed',
        width: '100%',
        height: '100%'
    },
    animate: {
        x: 0,
        opacity: 1,
        position: 'fixed',
        width: '100%',
        height: '100%',
        transition: pageTransition
    },
    exit: {
        x: isBackNavigation ? '100%' : '-100%',
        opacity: 0,
        position: 'fixed',
        width: '100%',
        height: '100%',
        transition: {
            ...pageTransition,
            delay: 0 // Ensure no delay on exit
        }
    }
});