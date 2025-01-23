import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useContext } from 'react';
import { ArtDecoNav } from './components/ArtDecoNav';
import { AuthControls } from './components/AuthControls';
import { PageTransition } from './components/PageTransition';
import { NavigationProvider, NavigationContext } from './components/NavigationContext';
import { PAGES } from './config';
import { styles } from './components/styles';
import { pageVariants } from './animations/animationVariants';

// Generic Page Component (fallback)
const Page = ({ title }) => {
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
                {title}
            </h1>
        </motion.div>
    );
};

function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="sync" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route
                    path="/"
                    element={
                        <PageTransition>
                            <AuthControls />
                            <ArtDecoNav />
                        </PageTransition>
                    }
                />
                {Object.entries(PAGES).map(([tileId, { path, component: Component, title }]) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            <PageTransition>
                                {Component ? <Component /> : <Page title={title} />}
                            </PageTransition>
                        }
                    />
                ))}
            </Routes>
        </AnimatePresence>
    );
}

function App() {
    return (
        <Router>
            <NavigationProvider>
                <AppRoutes />
            </NavigationProvider>
        </Router>
    );
}

export default App;