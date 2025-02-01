export const galleryStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100%',
        backgroundColor: '#000000',
        color: '#FFFFFF',
        overflow: 'hidden'
    },
    header: {
        padding: '2rem',
        textAlign: 'center',
        flexShrink: 0
    },
    gridContainer: {
        flexGrow: 1,
        overflow: 'auto',
        padding: '0 2rem 2rem 2rem'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
    },
    item: {
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'transform 0.2s ease-in-out',
        cursor: 'pointer',
        '&:hover': {
            transform: 'scale(1.02)'
        }
    },
    imageContainer: {
        width: '100%',
        height: '300px',
        position: 'relative',
        backgroundColor: '#2a2a2a'
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
        position: 'absolute',
        top: 0,
        left: 0
    },
    info: {
        padding: '1rem',
        color: '#ffffff'
    },
    title: {
        fontSize: '1.1rem',
        marginBottom: '0.5rem'
    },
    details: {
        fontSize: '0.9rem',
        color: '#cccccc'
    },
    loadingMessage: {
        textAlign: 'center'
    },
    errorMessage: {
        textAlign: 'center',
        color: '#ff0000'
    }
};