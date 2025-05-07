import React from 'react';
import { EditableMulti } from './EditableMulti';

/**
 * Test page for the multi-section Editable component
 */
export const EditableMultiTest = () => {
    return (
        <div>
            <h1>Multi-Section Editable Component Test</h1>
            <EditableMulti
                title="Multi-Section Test Page"
                pageId="multi-section-test"
                sections={[
                    {
                        image: '/Haven.jpeg',
                        align: 'left',
                        content: '/ArtistBio.html'
                    },
                    {
                        image: '/Haven.jpeg',
                        align: 'right',
                        content: '/ArtistStatement.html'
                    }
                ]}
            />
        </div>
    );
};
