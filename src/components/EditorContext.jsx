import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create context
const EditorContext = createContext();

// List of email addresses allowed to edit content and moderate comments
const EDITOR_EMAILS = [
    'madwhistler.morris@gmail.com',
    // Add more editor emails as needed
];

export const EditorProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [isEditor, setIsEditor] = useState(false);

    // Check if the current user is an editor
    useEffect(() => {
        if (currentUser && currentUser.email) {
            setIsEditor(EDITOR_EMAILS.includes(currentUser.email));
        } else {
            setIsEditor(false);
        }
    }, [currentUser]);

    return (
        <EditorContext.Provider value={{ isEditor }}>
            {children}
        </EditorContext.Provider>
    );
};

// Custom hook for using the editor context
export const useEditor = () => {
    const context = useContext(EditorContext);
    if (!context) {
        throw new Error('useEditor must be used within an EditorProvider');
    }
    return context;
};
