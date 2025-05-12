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
    },
    imageContainer: {
        width: '100%',
        height: '300px',
        position: 'relative',
        backgroundColor: '#2a2a2a',
        overflow: 'hidden'
    },
    iframe: {
        width: '100%',
        height: '100%',
        border: 'none',
        position: 'absolute',
        top: 0,
        left: 0
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain', // Changed from 'cover' to 'contain' to preserve aspect ratio
        objectPosition: 'center',
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#2a2a2a',
        transition: 'transform 0.3s ease'
    },
    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0,
        transition: 'opacity 0.3s ease',
        animation: 'fadeIn 0.3s forwards'
    },
    zoomIcon: {
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    info: {
        padding: '1rem',
        color: '#ffffff'
    },
    infoContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    title: {
        fontSize: '1.1rem',
        marginBottom: '0.5rem'
    },
    details: {
        fontSize: '0.9rem',
        color: '#cccccc'
    },
    iconButton: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        transition: 'background-color 0.2s ease',
        position: 'relative',
    },
    iconBadge: {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: '#ffcc00',
        color: '#000',
        borderRadius: '50%',
        width: '18px',
        height: '18px',
        fontSize: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold'
    },
    favoriteButton: {
        cursor: 'pointer',
        padding: '0.25rem',
        borderRadius: '50%',
        transition: 'transform 0.2s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingMessage: {
        textAlign: 'center',
        padding: '2rem'
    },
    errorMessage: {
        textAlign: 'center',
        color: '#ff0000',
        padding: '2rem'
    },
    emptyMessage: {
        textAlign: 'center',
        color: '#cccccc',
        padding: '2rem'
    }
};