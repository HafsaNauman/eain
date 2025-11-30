/**
 * Product Detail Screen
 * Shows full product information with vendor details
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { getListingDetails } from '../../api/catalogService';
import CustomButton from '../../components/common/CustomButton';

const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
    const { listingId } = route.params;
    const { i18n } = useTranslation();
    const isUrdu = i18n.language === 'ur';

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        fetchProductDetails();
    }, [listingId]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            setError('');

            const result = await getListingDetails(listingId);

            if (result.success) {
                setProduct(result.data);
            } else {
                setError(result.error);
                Alert.alert('Error', result.error);
            }
        } catch (err) {
            console.error('❌ Fetch Product Details Error:', err);
            setError('Failed to load product details');
        } finally {
            setLoading(false);
        }
    };

    const handleOrderNow = () => {
        navigation.navigate('Checkout', { product });
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        Alert.alert(
            isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
            isFavorite ? 'Product removed from your wishlist' : 'Product added to your wishlist'
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#036c5f" />
                <Text style={styles.loadingText}>Loading product...</Text>
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
                <Text style={styles.errorText}>{error || 'Product not found'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const images = product.media?.images || ['https://via.placeholder.com/400'];
    const title = isUrdu && product.title_ur ? product.title_ur : product.title_en;
    const description = isUrdu && product.description_ur ? product.description_ur : product.description_en;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
                    <Ionicons
                        name={isFavorite ? "heart" : "heart-outline"}
                        size={24}
                        color={isFavorite ? "#ff6b6b" : "#1a1a1a"}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Image Carousel */}
                <View style={styles.imageContainer}>
                    <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / width);
                            setActiveImageIndex(index);
                        }}
                        scrollEventThrottle={16}
                    >
                        {images.map((image, index) => (
                            <Image
                                key={index}
                                source={{ uri: image }}
                                style={styles.productImage}
                                resizeMode="cover"
                            />
                        ))}
                    </ScrollView>

                    {/* Image Dots */}
                    {images.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === activeImageIndex && styles.activeDot,
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* Product Info */}
                <View style={styles.contentContainer}>
                    {/* Category & Female Only Badge */}
                    <View style={styles.badgeRow}>
                        {product.category && (
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{product.category}</Text>
                            </View>
                        )}
                        {product.is_female_only && (
                            <View style={styles.femaleOnlyBadge}>
                                <Ionicons name="female" size={14} color="#ff6b9d" />
                                <Text style={styles.femaleOnlyText}>Female Only</Text>
                            </View>
                        )}
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Price */}
                    <Text style={styles.price}>
                        {product.currency} {product.price?.toLocaleString()}
                    </Text>

                    {/* Tags */}
                    {product.tags && product.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {product.tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Description */}
                    {description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>About this product</Text>
                            <Text style={styles.descriptionText}>{description}</Text>
                        </View>
                    )}

                    {/* Vendor Info */}
                    {product.Vendor && (
                        <View style={styles.vendorCard}>
                            <View style={styles.vendorHeader}>
                                <View style={styles.vendorLogoContainer}>
                                    {product.Vendor.media?.logo_url ? (
                                        <Image
                                            source={{ uri: product.Vendor.media.logo_url }}
                                            style={styles.vendorLogo}
                                        />
                                    ) : (
                                        <View style={styles.vendorLogoPlaceholder}>
                                            <Ionicons name="storefront" size={24} color="#036c5f" />
                                        </View>
                                    )}
                                </View>
                                <View style={styles.vendorInfo}>
                                    <Text style={styles.vendorName}>
                                        {isUrdu && product.Vendor.business_name_ur
                                            ? product.Vendor.business_name_ur
                                            : product.Vendor.business_name_en}
                                    </Text>
                                    {product.Vendor.city && (
                                        <View style={styles.locationRow}>
                                            <Ionicons name="location-outline" size={14} color="#666" />
                                            <Text style={styles.locationText}>
                                                {product.Vendor.city}
                                                {product.Vendor.area ? `, ${product.Vendor.area}` : ''}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {product.Vendor.description_en && (
                                <Text style={styles.vendorDescription} numberOfLines={3}>
                                    {isUrdu && product.Vendor.description_ur
                                        ? product.Vendor.description_ur
                                        : product.Vendor.description_en}
                                </Text>
                            )}

                            <TouchableOpacity
                                style={styles.viewStoreButton}
                                onPress={() =>
                                    navigation.navigate('VendorStore', { vendorId: product.Vendor.vendor_id })
                                }
                            >
                                <Text style={styles.viewStoreText}>View Store</Text>
                                <Ionicons name="arrow-forward" size={16} color="#036c5f" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View style={styles.bottomBar}>
                <CustomButton
                    title="Order Now"
                    onPress={handleOrderNow}
                    style={styles.orderButton}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#036c5f',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    imageContainer: {
        width: width,
        height: width,
        backgroundColor: '#f5f5f5',
    },
    productImage: {
        width: width,
        height: width,
    },
    dotsContainer: {
        position: 'absolute',
        bottom: 16,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.5)',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#fff',
        width: 24,
    },
    contentContainer: {
        padding: 20,
    },
    badgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: '#e0f7fa',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    categoryText: {
        fontSize: 12,
        color: '#036c5f',
        fontWeight: '600',
    },
    femaleOnlyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffe0f0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    femaleOnlyText: {
        fontSize: 12,
        color: '#ff6b9d',
        fontWeight: '600',
        marginLeft: 4,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    price: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#036c5f',
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    tag: {
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginRight: 8,
        marginBottom: 8,
    },
    tagText: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    vendorCard: {
        backgroundColor: '#f9f9f9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    vendorHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    vendorLogoContainer: {
        marginRight: 12,
    },
    vendorLogo: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    vendorLogoPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#e0f7fa',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vendorInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    vendorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    vendorDescription: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 12,
    },
    viewStoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    viewStoreText: {
        fontSize: 14,
        color: '#036c5f',
        fontWeight: '600',
        marginRight: 4,
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    orderButton: {
        backgroundColor: '#036c5f',
    },
});

export default ProductDetailScreen;
