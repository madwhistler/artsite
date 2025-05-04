import React, { createContext, useContext, useState } from 'react';

const LabelVisibilityContext = createContext();

export const LabelVisibilityProvider = ({ children }) => {
    const [labelsVisible, setLabelsVisible] = useState(true);

    return (
        <LabelVisibilityContext.Provider value={{ labelsVisible, setLabelsVisible }}>
            {children}
        </LabelVisibilityContext.Provider>
    );
};

export const useLabelVisibility = () => {
    const context = useContext(LabelVisibilityContext);
    if (!context) {
        throw new Error('useLabelVisibility must be used within a LabelVisibilityProvider');
    }
    return context;
};
