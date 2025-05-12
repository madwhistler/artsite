import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ArtDecoNav } from './components/ArtDecoNav';
import { AuthControls } from './components/AuthControls';
import { PageTransition } from './components/PageTransition';
import { NavigationProvider } from './components/NavigationContext';
import { LabelVisibilityProvider } from './components/LabelVisibilityContext';
import { FavoritesProvider } from './components/FavoritesContext';
import { SiteFavoritesProvider } from './components/SiteFavoritesContext';
import { CommentsProvider } from './components/CommentsContext';
import { EditorProvider } from './components/EditorContext';
import { LabelToggle } from './components/LabelToggle';
import {AuthProvider} from "@/components/AuthContext.jsx";
import { PAGES } from './config';


function AppRoutes() {
    const location = useLocation();

    return (
        <AnimatePresence mode="sync" initial={false}>
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={
                    <PageTransition>
                        <AuthControls />
                        <ArtDecoNav />
                    </PageTransition>
                } />
                {Object.entries(PAGES).map(([id, page]) => (
                    <Route
                        key={id}
                        path={page.path}
                        element={
                            <PageTransition>
                                <page.component {...page.props} />
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
            <AuthProvider>
                <NavigationProvider>
                    <LabelVisibilityProvider>
                        <FavoritesProvider>
                            <SiteFavoritesProvider>
                                <EditorProvider>
                                    <CommentsProvider>
                                        <LabelToggle />
                                        <AppRoutes />
                                    </CommentsProvider>
                                </EditorProvider>
                            </SiteFavoritesProvider>
                        </FavoritesProvider>
                    </LabelVisibilityProvider>
                </NavigationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;