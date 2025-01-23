import { motion } from 'framer-motion';
import { useContext } from 'react';
import { styles } from '../components/styles.js';
import { NavigationContext } from '../components/NavigationContext';
import { pageVariants } from '../animations/animationVariants';

export const Ignorance = () => {
    const { isBackNavigation } = useContext(NavigationContext);

    return (
        <motion.div
            className="page"
            style={styles.page}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants(isBackNavigation)}
        >
            <h1 className="page-title" style={styles.pageTitle}>
                Ignorance
            </h1>
        </motion.div>
    );
};