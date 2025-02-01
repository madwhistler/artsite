import { motion } from 'framer-motion';
import { useContext, useEffect, useState } from 'react';
import { styles } from '../components/styles.js';
import { galleryStyles } from './galleryStyles.js';
import { NavigationContext } from '../components/NavigationContext';
import { pageVariants } from '../animations/animationVariants';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';

const transformGoogleDriveUrl = (url) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
        const fileId = url.match(/[-\w]{25,}/);
        if (fileId) {
            return `https://drive.google.com/file/d/${fileId[0]}/preview`;
        }
    }
    return url;
};

export const Gallery = ({ title, galleryFilter }) => {
    const { isBackNavigation } = useContext(NavigationContext);
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArtworks = async () => {
            try {
                const artworksRef = collection(db, 'artwork');
                const conditions = [where('imageUrl', '>', '')];

                if (galleryFilter) {
                    conditions.push(where('originalId', '==', galleryFilter));
                }

                const q = query(artworksRef, ...conditions);

                const querySnapshot = await getDocs(q);
                const artworkData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setArtworks(artworkData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching artworks:', err);
                setError('Failed to load gallery items');
                setLoading(false);
            }
        };

        fetchArtworks();
    }, [galleryFilter]);

    return (
        <motion.div
            className="page"
            style={galleryStyles.container}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants(isBackNavigation)}
        >
            <div style={galleryStyles.header}>
                <h1 className="page-title" style={styles.pageTitle}>
                    {title}
                </h1>
            </div>

            <div style={galleryStyles.gridContainer}>
                {loading && (
                    <div style={galleryStyles.loadingMessage}>Loading...</div>
                )}
                {error && (
                    <div style={galleryStyles.errorMessage}>{error}</div>
                )}

                <div style={galleryStyles.grid}>
                    {artworks.map(artwork => (
                        <div
                            key={artwork.id}
                            style={galleryStyles.item}
                            onClick={() => console.log('Clicked artwork:', artwork.itemName)}
                        >
                            <div style={galleryStyles.imageContainer}>
                                <iframe
                                    src={transformGoogleDriveUrl(artwork.imageUrl)}
                                    style={galleryStyles.iframe}
                                    allow="autoplay"
                                    loading="lazy"
                                    title={artwork.itemName}
                                />
                            </div>
                            <div style={galleryStyles.info}>
                                <div style={galleryStyles.title}>
                                    {artwork.itemName}
                                </div>
                                <div style={galleryStyles.details}>
                                    {`${artwork.dimensions.height}x${artwork.dimensions.width}, ${artwork.medium}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};