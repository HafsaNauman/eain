// /**
//  * Product Detail Screen - STOCK MANAGEMENT COMPLETE
//  * Shows full product information with vendor details + stock validation
//  */
// import React, { useState, useEffect } from 'react';
// import {
//     View,
//     Text,
//     StyleSheet,
//     ScrollView,
//     Image,
//     TouchableOpacity,
//     ActivityIndicator,
//     Dimensions,
//     Alert,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useTranslation } from 'react-i18next';
// import { useAppSelector } from '../../redux/hooks';  // ✅ STOCK: Redux auth
// import { getListingDetails } from '../../api/catalogService';
// import CustomButton from '../../components/common/CustomButton';
// import StockIndicator from '../../components/StockIndicator';  // ✅ STOCK: Import
// import QuantityPicker from '../../components/common/QuantityPicker';  // ✅ STOCK: Import
// import { getFirstImage, getAllImages } from '../../utils/imageHelper';

// const { width } = Dimensions.get('window');

// const CustomerProductScreen = ({ route, navigation }) => {
//     const { listingId } = route.params;
//     const { i18n, t } = useTranslation();
//     const isUrdu = i18n.language === 'ur';

//     // ✅ STOCK: Redux auth check (female-only filtering)
//     const { user } = useAppSelector(state => state.auth);

//     const [product, setProduct] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
//     const [activeImageIndex, setActiveImageIndex] = useState(0);
//     const [isFavorite, setIsFavorite] = useState(false);
//     const [quantity, setQuantity] = useState(1);  // ✅ STOCK: Quantity selector

//     useEffect(() => {
//         fetchProductDetails();
//     }, [listingId]);

//     const fetchProductDetails = async () => {
//         try {
//             setLoading(true);
//             setError('');

//             const result = await getListingDetails(listingId);

//             if (result.success) {
//                 setProduct(result.data);
//                 console.log('📦 Product loaded:', result.data);
//                 console.log('🖼️ Product media:', result.data.media);
//             } else {
//                 setError(result.error);
//                 Alert.alert(t('common.error'), result.error);
//             }
//         } catch (err) {
//             console.error('❌ Fetch Product Details Error:', err);
//             setError(t('errors.networkError'));
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ✅ STOCK: Calculate available stock
//     const availableStock = product?.track_inventory 
//         ? Math.max(0, (product.stock_quantity || 0) - (product.reserved_quantity || 0))
//         : null;
//     const isOutOfStock = availableStock === 0 && product?.track_inventory;
//     const maxQuantity = availableStock !== null ? availableStock : 999;

//     const handleOrderNow = () => {
//         // ✅ STOCK: Block out-of-stock orders
//         if (isOutOfStock) {
//             Alert.alert('Out of Stock', 'This product is currently unavailable.');
//             return;
//         }
//         if (quantity > maxQuantity) {
//             Alert.alert('Stock Limit', `Only ${maxQuantity} items available.`);
//             return;
//         }
//         navigation.navigate('Checkout', { 
//             product, 
//             quantity  // ✅ STOCK: Pass quantity to checkout
//         });
//     };

//     const toggleFavorite = () => {
//         setIsFavorite(!isFavorite);
//         Alert.alert(
//             isFavorite ? t('customerProduct.removedFromFavorites') : t('customerProduct.addedToFavorites'),
//             isFavorite ? t('customerProduct.favoriteRemoved') : t('customerProduct.favoriteAdded')
//         );
//     };

//     if (loading) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#036c5f" />
//                 <Text style={styles.loadingText}>{t('customerProduct.loadingProduct')}</Text>
//             </View>
//         );
//     }

//     if (error || !product) {
//         return (
//             <View style={styles.errorContainer}>
//                 <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
//                 <Text style={styles.errorText}>{error || t('customerProduct.productNotFound')}</Text>
//                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
//                     <Text style={styles.backButtonText}>{t('customerProduct.goBack')}</Text>
//                 </TouchableOpacity>
//             </View>
//         );
//     }

//     // Extract images using helper function to handle both array and object formats
//     const images = getAllImages(product.media);

//     const title = isUrdu && product.title_ur ? product.title_ur : product.title_en;
//     const description = isUrdu && product.description_ur ? product.description_ur : product.description_en;

//     return (
//         <SafeAreaView style={styles.container} edges={['top']}>
//             {/* Header */}
//             <View style={styles.header}>
//                 <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
//                     <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
//                 </TouchableOpacity>
//                 <Text style={styles.headerTitle}>{t('customerProduct.productDetails')}</Text>
//                 <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
//                     <Ionicons
//                         name={isFavorite ? "heart" : "heart-outline"}
//                         size={24}
//                         color={isFavorite ? "#ff6b6b" : "#1a1a1a"}
//                     />
//                 </TouchableOpacity>
//             </View>

//             <ScrollView showsVerticalScrollIndicator={false}>
//                 {/* Image Carousel */}
//                 <View style={styles.imageContainer}>
//                     <ScrollView
//                         horizontal
//                         pagingEnabled
//                         showsHorizontalScrollIndicator={false}
//                         onScroll={(event) => {
//                             const index = Math.round(event.nativeEvent.contentOffset.x / width);
//                             setActiveImageIndex(index);
//                         }}
//                         scrollEventThrottle={16}
//                     >
//                         {images.map((image, index) => (
//                             <Image
//                                 key={index}
//                                 source={{ uri: image }}
//                                 style={styles.productImage}
//                                 resizeMode="cover"
//                             />
//                         ))}
//                     </ScrollView>

//                     {/* Image Dots */}
//                     {images.length > 1 && (
//                         <View style={styles.dotsContainer}>
//                             {images.map((_, index) => (
//                                 <View
//                                     key={index}
//                                     style={[
//                                         styles.dot,
//                                         index === activeImageIndex && styles.activeDot,
//                                     ]}
//                                 />
//                             ))}
//                         </View>
//                     )}
//                 </View>

//                 {/* Product Info */}
//                 <View style={styles.contentContainer}>
//                     {/* Category & Female Only Badge */}
//                     <View style={styles.badgeRow}>
//                         {product.category && (
//                             <View style={styles.categoryBadge}>
//                                 <Text style={styles.categoryText}>{product.category}</Text>
//                             </View>
//                         )}
//                         {product.is_female_only && (
//                             <View style={styles.femaleOnlyBadge}>
//                                 <Ionicons name="female" size={14} color="#ff6b9d" />
//                                 <Text style={styles.femaleOnlyText}>{t('customerProduct.femaleOnly')}</Text>
//                             </View>
//                         )}
//                     </View>

//                     {/* Title */}
//                     <Text style={styles.title}>{title}</Text>

//                     {/* Price */}
//                     <Text style={styles.price}>
//                         {product.currency} {product.price?.toLocaleString()}
//                     </Text>

//                     {/* ✅ STOCK: Stock Indicator */}
//                     {product.track_inventory && (
//                         <View style={[styles.badgeRow, { marginTop: 8, marginBottom: 16 }]}>
//                             <StockIndicator
//                                 stockQuantity={product.stock_quantity}
//                                 reservedQuantity={product.reserved_quantity}
//                                 trackInventory={true}
//                             />
//                         </View>
//                     )}

//                     {/* ✅ STOCK: Out of Stock Warning */}
//                     {isOutOfStock && (
//                         <View style={styles.outOfStockContainer}>
//                             <Ionicons name="close-circle" size={48} color="#ff6b6b" />
//                             <Text style={styles.outOfStockText}>Out of Stock</Text>
//                             <Text style={styles.outOfStockSubtext}>Check back later</Text>
//                         </View>
//                     )}

//                     {/* Tags */}
//                     {product.tags && product.tags.length > 0 && (
//                         <View style={styles.tagsContainer}>
//                             {product.tags.map((tag, index) => (
//                                 <View key={index} style={styles.tag}>
//                                     <Text style={styles.tagText}>{tag}</Text>
//                                 </View>
//                             ))}
//                         </View>
//                     )}

//                     {/* ✅ STOCK: Quantity Selector */}
//                     {!isOutOfStock && (
//                         <View style={styles.quantitySection}>
//                             <Text style={styles.sectionTitle}>Quantity</Text>
//                             <QuantityPicker
//                                 value={quantity}
//                                 onChange={setQuantity}
//                                 max={maxQuantity}
//                                 min={1}
//                             />
//                             {availableStock !== null && (
//                                 <Text style={styles.stockInfo}>
//                                     📦 {availableStock} available
//                                 </Text>
//                             )}
//                         </View>
//                     )}

//                     {/* Description */}
//                     {description && (
//                         <View style={styles.section}>
//                             <Text style={styles.sectionTitle}>{t('customerProduct.aboutProduct')}</Text>
//                             <Text style={styles.descriptionText}>{description}</Text>
//                         </View>
//                     )}

//                     {/* Vendor Info */}
//                     {product.Vendor && (
//                         <View style={styles.vendorCard}>
//                             <View style={styles.vendorHeader}>
//                                 <View style={styles.vendorLogoContainer}>
//                                     {product.Vendor.media?.logo_url ? (
//                                         <Image
//                                             source={{ uri: product.Vendor.media.logo_url }}
//                                             style={styles.vendorLogo}
//                                         />
//                                     ) : (
//                                         <View style={styles.vendorLogoPlaceholder}>
//                                             <Ionicons name="storefront" size={24} color="#036c5f" />
//                                         </View>
//                                     )}
//                                 </View>
//                                 <View style={styles.vendorInfo}>
//                                     <Text style={styles.vendorName}>
//                                         {isUrdu && product.Vendor.business_name_ur
//                                             ? product.Vendor.business_name_ur
//                                             : product.Vendor.business_name_en}
//                                     </Text>
//                                     {product.Vendor.city && (
//                                         <View style={styles.locationRow}>
//                                             <Ionicons name="location-outline" size={14} color="#666" />
//                                             <Text style={styles.locationText}>
//                                                 {product.Vendor.city}
//                                                 {product.Vendor.area ? `, ${product.Vendor.area}` : ''}
//                                             </Text>
//                                         </View>
//                                     )}
//                                 </View>
//                             </View>

//                             {product.Vendor.description_en && (
//                                 <Text style={styles.vendorDescription} numberOfLines={3}>
//                                     {isUrdu && product.Vendor.description_ur
//                                         ? product.Vendor.description_ur
//                                         : product.Vendor.description_en}
//                                 </Text>
//                             )}

//                             <TouchableOpacity
//                                 style={styles.viewStoreButton}
//                                 onPress={() =>
//                                     navigation.navigate('VendorStore', { vendorId: product.Vendor.vendor_id })
//                                 }
//                             >
//                                 <Text style={styles.viewStoreText}>{t('customerProduct.viewStore')}</Text>
//                                 <Ionicons name="arrow-forward" size={16} color="#036c5f" />
//                             </TouchableOpacity>
//                         </View>
//                     )}
//                 </View>
//             </ScrollView>

//             {/* Bottom CTA */}
//             <View style={styles.bottomBar}>
//                 <CustomButton
//                 title={`Add to Cart (${quantity})`}
//                 onPress={() => {
//                   // Add to Redux cart
//                  dispatch(addToCart({ 
//                   ...product, 
//                   quantity,
//                      image_url: getFirstImage(product.media) 
//                     }));
//       Alert.alert('✅ Added!', `${quantity}x ${title} added to cart`);
//       navigation.navigate('Cart');  // 👈 LINK TO CART
//     }}
//     style={styles.addToCartButton}
//     disabled={isOutOfStock}
//   />
//                 <CustomButton
//                     title={
//                         isOutOfStock 
//                             ? 'Sold Out' 
//                             : `Order Now (${quantity})`
//                     }
//                     onPress={handleOrderNow}
//                     style={[
//                         styles.orderButton,
//                         isOutOfStock && styles.disabledButton
//                     ]}
//                     disabled={isOutOfStock || loading}
//                 />
//             </View>
//         </SafeAreaView>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#fff',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#fff',
//     },
//     loadingText: {
//         marginTop: 12,
//         fontSize: 16,
//         color: '#666',
//     },
//     errorContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         padding: 20,
//         backgroundColor: '#fff',
//     },
//     errorText: {
//         fontSize: 16,
//         color: '#666',
//         marginTop: 16,
//         textAlign: 'center',
//     },
//     backButton: {
//         marginTop: 20,
//         paddingVertical: 12,
//         paddingHorizontal: 24,
//         backgroundColor: '#036c5f',
//         borderRadius: 8,
//     },
//     backButtonText: {
//         color: '#fff',
//         fontWeight: 'bold',
//     },
//     header: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingHorizontal: 16,
//         paddingVertical: 12,
//         backgroundColor: '#fff',
//         borderBottomWidth: 1,
//         borderBottomColor: '#e0e0e0',
//     },
//     headerButton: {
//         padding: 8,
//     },
//     headerTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#1a1a1a',
//     },
//     imageContainer: {
//         width: width,
//         height: width,
//         backgroundColor: '#f5f5f5',
//     },
//     productImage: {
//         width: width,
//         height: width,
//     },
//     dotsContainer: {
//         position: 'absolute',
//         bottom: 16,
//         left: 0,
//         right: 0,
//         flexDirection: 'row',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     dot: {
//         width: 8,
//         height: 8,
//         borderRadius: 4,
//         backgroundColor: 'rgba(255,255,255,0.5)',
//         marginHorizontal: 4,
//     },
//     activeDot: {
//         backgroundColor: '#fff',
//         width: 24,
//     },
//     contentContainer: {
//         padding: 20,
//     },
//     badgeRow: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: 12,
//     },
//     categoryBadge: {
//         backgroundColor: '#e0f7fa',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 16,
//         marginRight: 8,
//     },
//     categoryText: {
//         fontSize: 12,
//         color: '#036c5f',
//         fontWeight: '600',
//     },
//     femaleOnlyBadge: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         backgroundColor: '#ffe0f0',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 16,
//     },
//     femaleOnlyText: {
//         fontSize: 12,
//         color: '#ff6b9d',
//         fontWeight: '600',
//         marginLeft: 4,
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         color: '#1a1a1a',
//         marginBottom: 8,
//     },
//     price: {
//         fontSize: 28,
//         fontWeight: 'bold',
//         color: '#036c5f',
//         marginBottom: 16,
//     },
//     tagsContainer: {
//         flexDirection: 'row',
//         flexWrap: 'wrap',
//         marginBottom: 20,
//     },
//     tag: {
//         backgroundColor: '#f5f5f5',
//         paddingHorizontal: 12,
//         paddingVertical: 6,
//         borderRadius: 12,
//         marginRight: 8,
//         marginBottom: 8,
//     },
//     tagText: {
//         fontSize: 12,
//         color: '#666',
//     },
//     section: {
//         marginBottom: 24,
//     },
//     sectionTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#1a1a1a',
//         marginBottom: 8,
//     },
//     descriptionText: {
//         fontSize: 15,
//         color: '#666',
//         lineHeight: 22,
//     },
//     // ✅ STOCK: NEW STYLES
//     outOfStockContainer: {
//         backgroundColor: '#ffebee',
//         padding: 20,
//         borderRadius: 12,
//         alignItems: 'center',
//         marginVertical: 16,
//     },
//     outOfStockText: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         color: '#c62828',
//         marginTop: 8,
//         textAlign: 'center',
//     },
//     outOfStockSubtext: {
//         fontSize: 14,
//         color: '#666',
//         textAlign: 'center',
//         marginTop: 4,
//     },
//     quantitySection: {
//         marginBottom: 24,
//     },
//     stockInfo: {
//         fontSize: 14,
//         color: '#666',
//         marginTop: 8,
//         textAlign: 'center',
//     },
//     vendorCard: {
//         backgroundColor: '#f9f9f9',
//         borderRadius: 12,
//         padding: 16,
//         marginBottom: 20,
//     },
//     vendorHeader: {
//         flexDirection: 'row',
//         marginBottom: 12,
//     },
//     vendorLogoContainer: {
//         marginRight: 12,
//     },
//     vendorLogo: {
//         width: 50,
//         height: 50,
//         borderRadius: 25,
//     },
//     vendorLogoPlaceholder: {
//         width: 50,
//         height: 50,
//         borderRadius: 25,
//         backgroundColor: '#e0f7fa',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     vendorInfo: {
//         flex: 1,
//         justifyContent: 'center',
//     },
//     vendorName: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: '#1a1a1a',
//         marginBottom: 4,
//     },
//     locationRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     locationText: {
//         fontSize: 13,
//         color: '#666',
//         marginLeft: 4,
//     },
//     vendorDescription: {
//         fontSize: 13,
//         color: '#666',
//         lineHeight: 18,
//         marginBottom: 12,
//     },
//     viewStoreButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'center',
//         paddingVertical: 10,
//     },
//     viewStoreText: {
//         fontSize: 14,
//         color: '#036c5f',
//         fontWeight: '600',
//         marginRight: 4,
//     },
//     bottomBar: {
//         padding: 16,
//         backgroundColor: '#fff',
//         borderTopWidth: 1,
//         borderTopColor: '#e0e0e0',
//     },
//     orderButton: {
//         backgroundColor: '#036c5f',
//     },
//     disabledButton: {
//         backgroundColor: '#ccc',
//     },
//     addToCartButton: {
//   backgroundColor: '#10B981', // Green
//   marginBottom: 12,
// },
// floatingCart: {
//   position: 'absolute',
//   bottom: 20,
//   right: 20,
//   width: 56,
//   height: 56,
//   borderRadius: 28,
//   backgroundColor: '#036c5f',
//   alignItems: 'center',
//   justifyContent: 'center',
//   shadowColor: '#000',
//   shadowOffset: { width: 0, height: 4 },
//   shadowOpacity: 0.3,
//   shadowRadius: 8,
//   elevation: 8,
// },
// cartBadge: {
//   position: 'absolute',
//   top: -4,
//   right: -4,
//   backgroundColor: '#EF4444',
//   borderRadius: 10,
//   minWidth: 20,
//   height: 20,
//   alignItems: 'center',
//   justifyContent: 'center',
// },
// cartBadgeText: {
//   color: '#fff',
//   fontSize: 12,
//   fontWeight: 'bold',
// },

// });

// export default CustomerProductScreen;


/**
 * CustomerProductScreen.js
 * Customer-facing product detail screen
 * Stock-aware + vendor-type aware + ✨ Similar Items (recommender)
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
import { useDispatch } from 'react-redux';                          // ✅ ADDED
import { useAppSelector } from '../../redux/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ ADDED
import axios from 'axios';                                           // ✅ ADDED
import { addItem } from '../../redux/slices/cartSlice';
import { getListingDetails } from '../../api/catalogService';
import CustomButton from '../../components/common/CustomButton';
import StockIndicator from '../../components/StockIndicator';
import QuantityPicker from '../../components/common/QuantityPicker';
import { getFirstImage, getAllImages } from '../../utils/imageHelper';

const { width } = Dimensions.get('window');
const TEAL = '#036c5f';
const BACKEND_URL = 'https://2b02-149-40-194-235.ngrok-free.app'; // ← your Express backend IP

// ─── Recommender helpers ─────────────────────────────────────────────────────
const logEvent = async (userId, listingId, eventType) => {
    try {
        await axios.post(`${BACKEND_URL}/api/recommend/events`, {
            user_id: userId,
            listing_id: String(listingId),
            event_type: eventType,
        });
    } catch (_) { } // fire-and-forget
};
// ─────────────────────────────────────────────────────────────────────────────

const CustomerProductScreen = ({ route, navigation }) => {
    const { listingId } = route.params;
    const { i18n, t } = useTranslation();
    const isUrdu = i18n.language === 'ur';
    const dispatch = useDispatch();                                  // ✅ ADDED
    const { user } = useAppSelector(state => state.auth);

    // ── existing state ──────────────────────────────────────────────────────
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);
    const [quantity, setQuantity] = useState(1);

    // ── recommender state ───────────────────────────────────────────────────
    const [similarItems, setSimilarItems] = useState([]);           // ✅ ADDED
    const [similarLoading, setSimilarLoading] = useState(false);    // ✅ ADDED
    const [currentUserId, setCurrentUserId] = useState(null);       // ✅ ADDED

    // ── on mount: get user_id, log view, fetch similar ──────────────────────
    useEffect(() => {
        fetchProductDetails();
        // ✅ ADDED: get user_id + log view + fetch similar in parallel
        (async () => {
            const uid = await AsyncStorage.getItem('user_id');
            setCurrentUserId(uid);
            if (uid) logEvent(uid, listingId, 'view');
            setSimilarLoading(true);
            try {
                const { data } = await axios.get(
                    `${BACKEND_URL}/api/recommend/similar/${listingId}`,
                    { params: { top_k: 8 } }
                );
                if (data?.results?.length > 0) {
                    // Enrich each result with real catalog data — catalog title/price win over recommender metadata
                    const enriched = await Promise.all(
                        data.results.map(async (item) => {
                            try {
                                const res = await axios.get(
                                    `${BACKEND_URL}/api/catalog/listings/${item.item_id}`,
                                    { timeout: 5000 }
                                );
                                const catalog = res.data?.data?.listing || res.data?.data || null;
                                return {
                                    ...item,
                                    _media: catalog?.media || null,
                                    title: catalog?.title_en || catalog?.title || item.title,
                                    category: catalog?.category || item.category,
                                    price: catalog?.price ?? item.price,
                                };
                            } catch (_) {
                                return item;
                            }
                        })
                    );
                    setSimilarItems(enriched);
                    console.log(`✅ Similar items: ${enriched.length}`);
                }
            } catch (_) {
                console.warn('Similar items unavailable');
            } finally {
                setSimilarLoading(false);
            }
        })();
    }, [listingId]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const result = await getListingDetails(listingId);
            if (result.success) {
                setProduct(result.data);
                console.log('📦 Product loaded:', result.data);
                console.log('🖼️ Product media:', result.data.media);
            } else {
                setError(result.error);
                Alert.alert(t('common.error'), result.error);
            }
        } catch (err) {
            console.error('❌ Fetch Product Details Error:', err);
            setError(t('errors.networkError'));
        } finally {
            setLoading(false);
        }
    };

    const availableStock = product?.track_inventory
        ? Math.max(0, (product.stock_quantity || 0) - (product.reserved_quantity || 0))
        : null;
    const isOutOfStock = availableStock === 0 && product?.track_inventory;
    const maxQuantity = availableStock !== null ? availableStock : 999;

    const handleOrderNow = () => {
        if (isOutOfStock) {
            Alert.alert('Out of Stock', 'This product is currently unavailable.');
            return;
        }
        if (quantity > maxQuantity) {
            Alert.alert('Stock Limit', `Only ${maxQuantity} items available.`);
            return;
        }
        navigation.navigate('Checkout', { product, quantity });
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
        // ✅ ADDED: log wishlist event
        if (!isFavorite && currentUserId) logEvent(currentUserId, listingId, 'wishlist');
        Alert.alert(
            isFavorite ? t('customerProduct.removedFromFavorites') : t('customerProduct.addedToFavorites'),
            isFavorite ? t('customerProduct.favoriteRemoved') : t('customerProduct.favoriteAdded')
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={TEAL} />
                <Text style={styles.loadingText}>{t('customerProduct.loadingProduct')}</Text>
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#ff6b6b" />
                <Text style={styles.errorText}>{error || t('customerProduct.productNotFound')}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>{t('customerProduct.goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const images = getAllImages(product.media);
    const title = isUrdu && product.title_ur ? product.title_ur : product.title_en;
    const description = isUrdu && product.description_ur ? product.description_ur : product.description_en;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>

            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('customerProduct.productDetails')}</Text>
                <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
                    <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={24}
                        color={isFavorite ? '#ff6b6b' : '#1a1a1a'}
                    />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

                {/* ── Image Carousel ─────────────────────────────────────── */}
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
                    {images.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {images.map((_, index) => (
                                <View
                                    key={index}
                                    style={[styles.dot, index === activeImageIndex && styles.activeDot]}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* ── Product Info ────────────────────────────────────────── */}
                <View style={styles.contentContainer}>

                    <View style={styles.badgeRow}>
                        {product.category && (
                            <View style={styles.categoryBadge}>
                                <Text style={styles.categoryText}>{product.category}</Text>
                            </View>
                        )}
                        {product.is_female_only && (
                            <View style={styles.femaleOnlyBadge}>
                                <Ionicons name="female" size={14} color="#ff6b9d" />
                                <Text style={styles.femaleOnlyText}>{t('customerProduct.femaleOnly')}</Text>
                            </View>
                        )}
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.price}>
                        {product.currency} {product.price?.toLocaleString()}
                    </Text>

                    {product.track_inventory && (
                        <View style={[styles.badgeRow, { marginTop: 8, marginBottom: 16 }]}>
                            <StockIndicator
                                stockQuantity={product.stock_quantity}
                                reservedQuantity={product.reserved_quantity}
                                trackInventory={true}
                            />
                        </View>
                    )}

                    {isOutOfStock && (
                        <View style={styles.outOfStockContainer}>
                            <Ionicons name="close-circle" size={48} color="#ff6b6b" />
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                            <Text style={styles.outOfStockSubtext}>Check back later</Text>
                        </View>
                    )}

                    {product.tags && product.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                            {product.tags.map((tag, index) => (
                                <View key={index} style={styles.tag}>
                                    <Text style={styles.tagText}>{tag}</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    {!isOutOfStock && (
                        <View style={styles.quantitySection}>
                            <Text style={styles.sectionTitle}>Quantity</Text>
                            <QuantityPicker
                                value={quantity}
                                onChange={setQuantity}
                                max={maxQuantity}
                                min={1}
                            />
                            {availableStock !== null && (
                                <Text style={styles.stockInfo}>📦 {availableStock} available</Text>
                            )}
                        </View>
                    )}

                    {description && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{t('customerProduct.aboutProduct')}</Text>
                            <Text style={styles.descriptionText}>{description}</Text>
                        </View>
                    )}

                    {/* Vendor Card */}
                    {product.Vendor && (
                        <View style={styles.vendorCard}>
                            <View style={styles.vendorHeader}>
                                <View style={styles.vendorLogoContainer}>
                                    {product.Vendor.media?.logo_url ? (
                                        <Image source={{ uri: product.Vendor.media.logo_url }} style={styles.vendorLogo} />
                                    ) : (
                                        <View style={styles.vendorLogoPlaceholder}>
                                            <Ionicons name="storefront" size={24} color={TEAL} />
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
                                onPress={() => navigation.navigate('VendorStore', { vendorId: product.Vendor.vendor_id })}
                            >
                                <Text style={styles.viewStoreText}>{t('customerProduct.viewStore')}</Text>
                                <Ionicons name="arrow-forward" size={16} color={TEAL} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ──  Similar Items ─────────────────────────────────────── */}
                {/* ✅ ADDED: entire section below */}
                <View style={styles.similarSection}>
                    <View style={styles.similarHeader}>
                        <Text style={styles.sectionTitle}> Similar Items</Text>
                        {similarLoading && (
                            <ActivityIndicator size="small" color={TEAL} style={{ marginLeft: 8 }} />
                        )}
                    </View>

                    {!similarLoading && similarItems.length === 0 && (
                        <Text style={styles.noSimilarText}>No similar items found</Text>
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {similarItems.map(item => (
                            <TouchableOpacity
                                key={item.item_id}
                                style={styles.similarCard}
                                activeOpacity={0.82}
                                onPress={() => {
                                    if (currentUserId) logEvent(currentUserId, item.item_id, 'click');
                                    navigation.push('CustomerProduct', { listingId: item.item_id });
                                }}
                            >
                                {getFirstImage(item._media) ? (
                                    <Image
                                        source={{ uri: getFirstImage(item._media) }}
                                        style={styles.similarImage}
                                    />
                                ) : (
                                    <View style={[styles.similarImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                                        <Ionicons name="image-outline" size={28} color="#8CBFC5" />
                                    </View>
                                )}
                                <View style={{ padding: 8 }}>
                                    <Text style={styles.similarTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.similarPrice}>
                                        PKR {item.price?.toLocaleString()}
                                    </Text>
                                    <Text style={styles.similarCategory} numberOfLines={1}>
                                        {item.category}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── Bottom CTA ──────────────────────────────────────────────── */}
            <View style={styles.bottomBar}>
                <CustomButton
                    title={`Add to Cart (${quantity})`}
                    onPress={() => {
                        // ✅ FIXED: dispatch now declared above
                        dispatch(addItem({
                            product: {
                                id: product.listing_id,
                                title: title,
                                price: product.price,
                                image_url: getFirstImage(product.media),
                                vendor_id: product.Vendor?.vendor_id,
                                ...product
                            },
                            quantity
                        }));
                        // ✅ ADDED: log add_to_cart event
                        if (currentUserId) logEvent(currentUserId, listingId, 'add_to_cart');
                        Alert.alert('✅ Added!', `${quantity}x ${title} added to cart`);
                        navigation.navigate('Cart');
                    }}
                    style={styles.addToCartButton}
                    disabled={isOutOfStock}
                />
                <CustomButton
                    title={isOutOfStock ? 'Sold Out' : `Order Now (${quantity})`}
                    onPress={handleOrderNow}
                    style={[styles.orderButton, isOutOfStock && styles.disabledButton]}
                    disabled={isOutOfStock || loading}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
    loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
    errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
    errorText: { fontSize: 16, color: '#666', marginTop: 16, textAlign: 'center' },
    backButton: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: TEAL, borderRadius: 8 },
    backButtonText: { color: '#fff', fontWeight: 'bold' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    headerButton: { padding: 8 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    imageContainer: { width: width, height: width, backgroundColor: '#f5f5f5' },
    productImage: { width: width, height: width },
    dotsContainer: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)', marginHorizontal: 4 },
    activeDot: { backgroundColor: '#fff', width: 24 },
    contentContainer: { padding: 20 },
    badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
    categoryBadge: { backgroundColor: '#e0f7fa', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8 },
    categoryText: { fontSize: 12, color: TEAL, fontWeight: '600' },
    femaleOnlyBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffe0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    femaleOnlyText: { fontSize: 12, color: '#ff6b9d', fontWeight: '600', marginLeft: 4 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
    price: { fontSize: 28, fontWeight: 'bold', color: TEAL, marginBottom: 16 },
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
    tag: { backgroundColor: '#f5f5f5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginRight: 8, marginBottom: 8 },
    tagText: { fontSize: 12, color: '#666' },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
    descriptionText: { fontSize: 15, color: '#666', lineHeight: 22 },
    outOfStockContainer: { backgroundColor: '#ffebee', padding: 20, borderRadius: 12, alignItems: 'center', marginVertical: 16 },
    outOfStockText: { fontSize: 18, fontWeight: 'bold', color: '#c62828', marginTop: 8, textAlign: 'center' },
    outOfStockSubtext: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 4 },
    quantitySection: { marginBottom: 24 },
    stockInfo: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' },
    vendorCard: { backgroundColor: '#f9f9f9', borderRadius: 12, padding: 16, marginBottom: 20 },
    vendorHeader: { flexDirection: 'row', marginBottom: 12 },
    vendorLogoContainer: { marginRight: 12 },
    vendorLogo: { width: 50, height: 50, borderRadius: 25 },
    vendorLogoPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e0f7fa', justifyContent: 'center', alignItems: 'center' },
    vendorInfo: { flex: 1, justifyContent: 'center' },
    vendorName: { fontSize: 16, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 4 },
    locationRow: { flexDirection: 'row', alignItems: 'center' },
    locationText: { fontSize: 13, color: '#666', marginLeft: 4 },
    vendorDescription: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12 },
    viewStoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
    viewStoreText: { fontSize: 14, color: TEAL, fontWeight: '600', marginRight: 4 },

    // ── Similar Items ─────────────────────────────────────────────────────
    similarSection: { paddingLeft: 20, paddingBottom: 8 },
    similarHeader: { flexDirection: 'row', alignItems: 'center', paddingRight: 20, marginBottom: 4 },
    noSimilarText: { color: '#8CBFC5', fontSize: 13, paddingVertical: 8 },
    similarCard: {
        width: 140,
        marginRight: 12,
        backgroundColor: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 4,
    },
    similarImage: { width: 140, height: 110, resizeMode: 'cover' },
    simBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(3,108,95,0.85)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
    simBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    similarTitle: { fontSize: 12, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
    similarPrice: { fontSize: 13, fontWeight: '700', color: TEAL, marginBottom: 2 },
    similarCategory: { fontSize: 11, color: '#888' },

    // ── Bottom Bar ────────────────────────────────────────────────────────
    bottomBar: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0' },
    orderButton: { backgroundColor: TEAL },
    disabledButton: { backgroundColor: '#ccc' },
    addToCartButton: { backgroundColor: '#10B981', marginBottom: 12 },
    floatingCart: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: TEAL, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
    cartBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    cartBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});

export default CustomerProductScreen;
