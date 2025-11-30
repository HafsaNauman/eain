// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   ScrollView,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   RefreshControl,
//   Alert
// } from 'react-native';
// import { Ionicons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { getAllListings } from '../api/catalogService';
// import { useTranslation } from 'react-i18next';

// const categories = ['All', 'Electronics', 'Fashion & Apparel', 'Home & Garden', 'Health & Beauty', 'Sports & Fitness'];

// function HomeScreen() {
//   const { i18n } = useTranslation();
//   const isUrdu = i18n.language === 'ur';
//   const navigation = useNavigation();

//   // State
//   const [products, setProducts] = useState([]);
//   const [cart, setCart] = useState([]);
//   const [wishlist, setWishlist] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');
//   const [page, setPage] = useState(0);

//   // Fetch listings on mount and when category/search changes
//   useEffect(() => {
//     fetchListings(true);
//   }, [selectedCategory]);

//   const fetchListings = async (reset = false) => {
//     try {
//       if (reset) {
//         setLoading(true);
//         setPage(0);
//       } else {
//         setRefreshing(true);
//       }

//       setError('');

//       const result = await getAllListings({
//         limit: 50,
//         offset: 0,
//         q: searchQuery || undefined,
//       });

//       if (result.success) {
//         setProducts(result.data.listings);
//         console.log(`✅ Loaded ${result.data.listings.length} products`);
//       } else {
//         setError(result.error);
//         Alert.alert('Error', result.error);
//       }
//     } catch (err) {
//       console.error('❌ Fetch Error:', err);
//       setError('Failed to load products');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleSearch = () => {
//     fetchListings(true);
//   };

//   const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

//   // Filter products by category
//   const filteredProducts = products.filter(product => {
//     const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
//     return matchesCategory;
//   });

//   const addToCart = (product) => {
//     const existing = cart.find(item => item.listing_id === product.listing_id);
//     if (existing) {
//       setCart(cart.map(item =>
//         item.listing_id === product.listing_id
//           ? { ...item, quantity: item.quantity + 1 }
//           : item
//       ));
//     } else {
//       setCart([...cart, { ...product, quantity: 1 }]);
//     }
//     Alert.alert('Added to Cart', `${product.title_en} added to your cart`);
//   };

//   const toggleWishlist = (product) => {
//     if (wishlist.find(item => item.listing_id === product.listing_id)) {
//       setWishlist(wishlist.filter(item => item.listing_id !== product.listing_id));
//       Alert.alert('Removed', 'Removed from favorites');
//     } else {
//       setWishlist([...wishlist, product]);
//       Alert.alert('Added', 'Added to favorites');
//     }
//   };

//   const navigateToProductDetail = (listingId) => {
//     navigation.navigate('ProductDetail', { listingId });
//   };

//   return (
//     <View style={styles.container}>
//       {/* Top Bar */}
//       <View style={styles.headerBar}>
//         <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
//           <Ionicons
//             name={menuOpen ? "close" : "menu"}
//             size={28}
//             color="#fff"
//           />
//         </TouchableOpacity>

//         <Text style={styles.logo}>EAIN</Text>

//         <TouchableOpacity onPress={() => navigation.navigate('Cart')}>

//           <Ionicons name="cart-outline" size={28} color="#fff" />
//           {cartCount > 0 && (
//             <View style={styles.cartBadge}>
//               <Text style={styles.cartBadgeText}>{cartCount}</Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* Main Scroll Content */}
//       <ScrollView
//         style={styles.scrollArea}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={() => fetchListings(false)}
//             colors={['#036c5f']}
//           />
//         }
//       >
//         {/* Search bar */}
//         <View style={styles.searchBar}>
//           <Ionicons name="search" size={20} color="#036c5f" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search products..."
//             placeholderTextColor="#8CBFC5"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             onSubmitEditing={handleSearch}
//             returnKeyType="search"
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity onPress={() => {
//               setSearchQuery('');
//               fetchListings(true);
//             }}>
//               <Ionicons name="close-circle" size={20} color="#036c5f" />
//             </TouchableOpacity>
//           )}
//         </View>

//         {/* Categories */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
//           {categories.map(cat => (
//             <TouchableOpacity
//               key={cat}
//               onPress={() => setSelectedCategory(cat)}
//               style={[
//                 styles.categoryBtn,
//                 selectedCategory === cat && styles.categorySelected
//               ]}
//             >
//               <Text style={{
//                 color: selectedCategory === cat ? '#fff' : '#036c5f',
//                 fontWeight: selectedCategory === cat ? 'bold' : 'normal'
//               }}>
//                 {cat}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Loading Indicator */}
//         {loading && (
//           <View style={{ paddingVertical: 20, alignItems: 'center' }}>
//             <ActivityIndicator size="large" color="#036c5f" />
//             <Text style={{ marginTop: 10, color: '#8CBFC5' }}>Loading products...</Text>
//           </View>
//         )}

//         {/* Error Message */}
//         {error && !loading && (
//           <View style={{ padding: 16, backgroundColor: '#ffebee', borderRadius: 8, marginBottom: 16 }}>
//             <Text style={{ color: '#c62828' }}>{error}</Text>
//             <TouchableOpacity onPress={() => fetchListings(true)} style={{ marginTop: 8 }}>
//               <Text style={{ color: '#036c5f', fontWeight: 'bold' }}>Retry</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Products Section */}
//         {!loading && (
//           <>
//             <Text style={styles.sectionTitle}>
//               Products ({filteredProducts.length})
//             </Text>

//             {filteredProducts.length === 0 && !loading && (
//               <View style={{ padding: 20, alignItems: 'center' }}>
//                 <Ionicons name="basket-outline" size={48} color="#8CBFC5" />
//                 <Text style={{ marginTop: 10, color: '#8CBFC5' }}>No products found</Text>
//               </View>
//             )}

//             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//               {filteredProducts.map(product => (
//                 <TouchableOpacity
//                   key={product.listing_id}
//                   style={styles.productCard}
//                   onPress={() => navigateToProductDetail(product.listing_id)}
//                 >
//                   {/* Product Image */}
//                   <Image
//                     source={{
//                       uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'
//                     }}
//                     style={styles.productImage}
//                   />

//                   {/* Product Info */}
//                   <Text style={styles.productName} numberOfLines={2}>
//                     {isUrdu && product.title_ur ? product.title_ur : product.title_en}
//                   </Text>

//                   <Text style={styles.productPrice}>
//                     {product.currency} {product.price?.toLocaleString()}
//                   </Text>

//                   {/* Vendor Name */}
//                   <Text style={{ fontSize: 11, color: '#666', marginBottom: 8 }} numberOfLines={1}>
//                     {product.Vendor?.business_name_en || 'Unknown'}
//                   </Text>

//                   {/* Actions */}
//                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                     <TouchableOpacity
//                       onPress={() => addToCart(product)}
//                       style={{
//                         backgroundColor: '#036c5f',
//                         paddingHorizontal: 12,
//                         paddingVertical: 6,
//                         borderRadius: 8
//                       }}
//                     >
//                       <Ionicons name="cart-outline" size={16} color="#fff" />
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       onPress={() => toggleWishlist(product)}
//                       style={{ marginLeft: 8 }}
//                     >
//                       <Ionicons
//                         name={wishlist.find(i => i.listing_id === product.listing_id) ? "heart" : "heart-outline"}
//                         size={24}
//                         color={wishlist.find(i => i.listing_id === product.listing_id) ? "#036c5f" : "#8CBFC5"}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </>
//         )}

//         {/* Favorites Section */}
//         <Text style={styles.sectionTitle}>Your Favorites</Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           {wishlist.map(product => (
//             <TouchableOpacity
//               key={product.listing_id}
//               style={styles.favoriteCard}
//               onPress={() => navigateToProductDetail(product.listing_id)}
//             >
//               <Image
//                 source={{
//                   uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'
//                 }}
//                 style={styles.productImage}
//               />
//               <Text style={{ ...styles.productName, color: '#fff' }} numberOfLines={2}>
//                 {isUrdu && product.title_ur ? product.title_ur : product.title_en}
//               </Text>
//               <Text style={{ ...styles.productPrice, color: '#fff' }}>
//                 {product.currency} {product.price?.toLocaleString()}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {wishlist.length === 0 && (
//           <Text style={styles.noFavorites}>No favorites yet</Text>
//         )}
//       </ScrollView>

//       {/* Bottom Nav */}
//       <View style={styles.bottomNav}>
//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="home" size={24} color="#036c5f" />
//           <Text style={{ color: '#036c5f', fontSize: 12 }}>Home</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="cart-outline" size={24} color="#666" />
//           <Text style={{ color: '#666', fontSize: 12 }}>Cart</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="heart-outline" size={24} color="#666" />
//           <Text style={{ color: '#666', fontSize: 12 }}>Wishlist</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => navigation.navigate('Profile')}
//           style={styles.navBtn}
//         >
//           <Ionicons name="person-outline" size={24} color="#666" />
//           <Text style={{ color: '#666', fontSize: 12 }}>Profile</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#ffffff' },
//   headerBar: {
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#036c5f',
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20
//   },
//   logo: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
//   cartBadge: {
//     backgroundColor: '#FFFFFF',
//     position: 'absolute',
//     right: -10,
//     top: -8,
//     borderRadius: 10,
//     paddingHorizontal: 5
//   },
//   cartBadgeText: { color: '#036c5f', fontWeight: 'bold' },
//   scrollArea: { padding: 16 },
//   searchBar: {
//     backgroundColor: '#e0f7fa',
//     borderRadius: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     marginBottom: 16
//   },
//   searchInput: { flex: 1, fontSize: 16, color: '#036c5f', marginLeft: 8 },
//   categories: { marginBottom: 16 },
//   categoryBtn: {
//     backgroundColor: '#e0f7fa',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 30,
//     marginRight: 10
//   },
//   categorySelected: { backgroundColor: '#036c5f' },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     marginTop: 8,
//     color: '#036c5f'
//   },
//   productCard: {
//     backgroundColor: '#fff6ed',
//     borderRadius: 16,
//     marginRight: 12,
//     padding: 15,
//     alignItems: 'center',
//     width: 140,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.07,
//     shadowRadius: 5,
//     elevation: 2
//   },
//   favoriteCard: {
//     backgroundColor: '#036c5f',
//     borderRadius: 16,
//     marginRight: 12,
//     padding: 15,
//     alignItems: 'center',
//     width: 140,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.07,
//     shadowRadius: 5,
//     elevation: 2
//   },
//   productImage: {
//     width: 100,
//     height: 100,
//     marginBottom: 8,
//     borderRadius: 8,
//     resizeMode: 'cover'
//   },
//   productName: {
//     fontWeight: 'bold',
//     fontSize: 13,
//     color: '#036c5f',
//     marginBottom: 4,
//     textAlign: 'center',
//     minHeight: 36
//   },
//   productPrice: {
//     color: '#036c5f',
//     fontWeight: 'bold',
//     marginBottom: 8,
//     fontSize: 14
//   },
//   noFavorites: { padding: 24, color: '#8CBFC5', textAlign: 'center' },
//   bottomNav: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     paddingVertical: 10
//   },
//   navBtn: { alignItems: 'center' }
// });

// export default HomeScreen;


// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   TextInput,
//   ScrollView,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   RefreshControl,
//   Alert,
//   Modal,
// } from 'react-native';
// import { Ionicons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';
// import { Picker } from '@react-native-picker/picker';
// import { getAllListings, searchListings } from '../api/catalogService';
// import { useTranslation } from 'react-i18next';

// const categories = ['All', 'Electronics', 'Fashion & Apparel', 'Home & Garden', 'Health & Beauty', 'Sports & Fitness', 'Food & Beverage'];
// const cities = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
// const sortOptions = [
//   { label: 'Newest First', value: 'created_at' },
//   { label: 'Price: Low to High', value: 'price_asc' },
//   { label: 'Price: High to Low', value: 'price_desc' },
// ];

// function HomeScreen() {
//   const { i18n } = useTranslation();
//   const isUrdu = i18n.language === 'ur';
//   const navigation = useNavigation();

//   // State
//   const [products, setProducts] = useState([]);
//   const [cart, setCart] = useState([]);
//   const [wishlist, setWishlist] = useState([]);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [selectedCity, setSelectedCity] = useState('All Cities');
//   const [selectedSort, setSelectedSort] = useState('created_at');
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [showFilters, setShowFilters] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');

//   // Debounce timer for search
//   const [searchTimer, setSearchTimer] = useState(null);

//   // Fetch listings on mount
//   useEffect(() => {
//     fetchListings();
//   }, []);

//   // Debounced search - triggers 500ms after user stops typing
//   useEffect(() => {
//     if (searchTimer) {
//       clearTimeout(searchTimer);
//     }

//     const timer = setTimeout(() => {
//       fetchListings();
//     }, 500);

//     setSearchTimer(timer);

//     return () => clearTimeout(timer);
//   }, [searchQuery, selectedCategory, selectedCity, selectedSort]);

//   const fetchListings = async (isRefresh = false) => {
//     try {
//       if (isRefresh) {
//         setRefreshing(true);
//       } else if (products.length === 0) {
//         setLoading(true);
//       }

//       setError('');

//       // Build filters
//       const filters = {
//         limit: 50,
//         offset: 0,
//       };

//       // Add search query
//       if (searchQuery.trim()) {
//         filters.q = searchQuery.trim();
//       }

//       // Add category filter
//       if (selectedCategory !== 'All') {
//         filters.category = selectedCategory;
//       }

//       // Add city filter
//       if (selectedCity !== 'All Cities') {
//         filters.city = selectedCity;
//       }

//       // Add sort
//       if (selectedSort !== 'created_at') {
//         filters.sort = selectedSort;
//       }

//       // Use advanced search if filters are applied
//       const hasFilters = selectedCategory !== 'All' || selectedCity !== 'All Cities' || selectedSort !== 'created_at';

//       const result = hasFilters
//         ? await searchListings(filters)
//         : await getAllListings(filters);

//       if (result.success) {
//         setProducts(result.data.listings);
//         console.log(`✅ Loaded ${result.data.listings.length} products`);
//       } else {
//         setError(result.error);
//       }
//     } catch (err) {
//       console.error('❌ Fetch Error:', err);
//       setError('Failed to load products');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const handleRefresh = () => {
//     fetchListings(true);
//   };

//   const clearFilters = () => {
//     setSearchQuery('');
//     setSelectedCategory('All');
//     setSelectedCity('All Cities');
//     setSelectedSort('created_at');
//     setShowFilters(false);
//   };

//   const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
//   const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

//   const addToCart = (product) => {
//     const existing = cart.find(item => item.listing_id === product.listing_id);
//     if (existing) {
//       setCart(cart.map(item =>
//         item.listing_id === product.listing_id
//           ? { ...item, quantity: item.quantity + 1 }
//           : item
//       ));
//     } else {
//       setCart([...cart, { ...product, quantity: 1 }]);
//     }
//     Alert.alert('Added to Cart', `${product.title_en} added to your cart`);
//   };

//   const toggleWishlist = (product) => {
//     if (wishlist.find(item => item.listing_id === product.listing_id)) {
//       setWishlist(wishlist.filter(item => item.listing_id !== product.listing_id));
//     } else {
//       setWishlist([...wishlist, product]);
//     }
//   };

//   const navigateToProductDetail = (listingId) => {
//     navigation.navigate('ProductDetail', { listingId });
//   };

//   const activeFiltersCount =
//     (selectedCategory !== 'All' ? 1 : 0) +
//     (selectedCity !== 'All Cities' ? 1 : 0) +
//     (selectedSort !== 'created_at' ? 1 : 0);

//   return (
//     <View style={styles.container}>
//       {/* Top Bar */}
//       <View style={styles.headerBar}>
//         <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
//           <Ionicons
//             name={menuOpen ? "close" : "menu"}
//             size={28}
//             color="#fff"
//           />
//         </TouchableOpacity>

//         <Text style={styles.logo}>EAIN</Text>

//         <TouchableOpacity onPress={() => Alert.alert('Cart', 'Cart feature coming soon')}>
//           <Ionicons name="cart-outline" size={28} color="#fff" />
//           {cartCount > 0 && (
//             <View style={styles.cartBadge}>
//               <Text style={styles.cartBadgeText}>{cartCount}</Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>

//       {/* Main Scroll Content */}
//       <ScrollView
//         style={styles.scrollArea}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             colors={['#036c5f']}
//           />
//         }
//       >
//         {/* Search bar */}
//         <View style={styles.searchBar}>
//           <Ionicons name="search" size={20} color="#036c5f" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search products..."
//             placeholderTextColor="#8CBFC5"
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             returnKeyType="search"
//           />
//           {searchQuery.length > 0 && (
//             <TouchableOpacity onPress={() => setSearchQuery('')}>
//               <Ionicons name="close-circle" size={20} color="#036c5f" />
//             </TouchableOpacity>
//           )}

//           {/* Filter Button */}
//           <TouchableOpacity
//             onPress={() => setShowFilters(true)}
//             style={styles.filterButton}
//           >
//             <Ionicons name="options-outline" size={20} color="#036c5f" />
//             {activeFiltersCount > 0 && (
//               <View style={styles.filterBadge}>
//                 <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         </View>

//         {/* Active Filters Display */}
//         {activeFiltersCount > 0 && (
//           <View style={styles.activeFilters}>
//             {selectedCity !== 'All Cities' && (
//               <View style={styles.filterChip}>
//                 <Ionicons name="location" size={12} color="#036c5f" />
//                 <Text style={styles.filterChipText}>{selectedCity}</Text>
//                 <TouchableOpacity onPress={() => setSelectedCity('All Cities')}>
//                   <Ionicons name="close-circle" size={14} color="#036c5f" />
//                 </TouchableOpacity>
//               </View>
//             )}
//             {selectedCategory !== 'All' && (
//               <View style={styles.filterChip}>
//                 <Text style={styles.filterChipText}>{selectedCategory}</Text>
//                 <TouchableOpacity onPress={() => setSelectedCategory('All')}>
//                   <Ionicons name="close-circle" size={14} color="#036c5f" />
//                 </TouchableOpacity>
//               </View>
//             )}
//             <TouchableOpacity onPress={clearFilters}>
//               <Text style={styles.clearFiltersText}>Clear All</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Categories */}
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
//           {categories.map(cat => (
//             <TouchableOpacity
//               key={cat}
//               onPress={() => setSelectedCategory(cat)}
//               style={[
//                 styles.categoryBtn,
//                 selectedCategory === cat && styles.categorySelected
//               ]}
//             >
//               <Text style={{
//                 color: selectedCategory === cat ? '#fff' : '#036c5f',
//                 fontWeight: selectedCategory === cat ? 'bold' : 'normal'
//               }}>
//                 {cat}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {/* Loading Indicator */}
//         {loading && (
//           <View style={{ paddingVertical: 20, alignItems: 'center' }}>
//             <ActivityIndicator size="large" color="#036c5f" />
//             <Text style={{ marginTop: 10, color: '#8CBFC5' }}>Loading products...</Text>
//           </View>
//         )}

//         {/* Error Message */}
//         {error && !loading && (
//           <View style={{ padding: 16, backgroundColor: '#ffebee', borderRadius: 8, marginBottom: 16 }}>
//             <Text style={{ color: '#c62828' }}>{error}</Text>
//             <TouchableOpacity onPress={() => fetchListings()} style={{ marginTop: 8 }}>
//               <Text style={{ color: '#036c5f', fontWeight: 'bold' }}>Retry</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {/* Products Section */}
//         {!loading && (
//           <>
//             <Text style={styles.sectionTitle}>
//               Products ({products.length})
//             </Text>

//             {products.length === 0 && (
//               <View style={{ padding: 20, alignItems: 'center' }}>
//                 <Ionicons name="basket-outline" size={48} color="#8CBFC5" />
//                 <Text style={{ marginTop: 10, color: '#8CBFC5' }}>
//                   {searchQuery || activeFiltersCount > 0
//                     ? 'No products match your search'
//                     : 'No products found'}
//                 </Text>
//                 {activeFiltersCount > 0 && (
//                   <TouchableOpacity onPress={clearFilters} style={{ marginTop: 10 }}>
//                     <Text style={{ color: '#036c5f', fontWeight: 'bold' }}>Clear Filters</Text>
//                   </TouchableOpacity>
//                 )}
//               </View>
//             )}

//             <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//               {products.map(product => (
//                 <TouchableOpacity
//                   key={product.listing_id}
//                   style={styles.productCard}
//                   onPress={() => navigateToProductDetail(product.listing_id)}
//                 >
//                   <Image
//                     source={{
//                       uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'
//                     }}
//                     style={styles.productImage}
//                   />

//                   <Text style={styles.productName} numberOfLines={2}>
//                     {isUrdu && product.title_ur ? product.title_ur : product.title_en}
//                   </Text>

//                   <Text style={styles.productPrice}>
//                     {product.currency} {product.price?.toLocaleString()}
//                   </Text>

//                   <Text style={{ fontSize: 11, color: '#666', marginBottom: 8 }} numberOfLines={1}>
//                     {product.Vendor?.business_name_en || 'Unknown'}
//                   </Text>

//                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
//                     <TouchableOpacity
//                       onPress={() => addToCart(product)}
//                       style={{
//                         backgroundColor: '#036c5f',
//                         paddingHorizontal: 12,
//                         paddingVertical: 6,
//                         borderRadius: 8
//                       }}
//                     >
//                       <Ionicons name="cart-outline" size={16} color="#fff" />
//                     </TouchableOpacity>

//                     <TouchableOpacity
//                       onPress={() => toggleWishlist(product)}
//                       style={{ marginLeft: 8 }}
//                     >
//                       <Ionicons
//                         name={wishlist.find(i => i.listing_id === product.listing_id) ? "heart" : "heart-outline"}
//                         size={24}
//                         color={wishlist.find(i => i.listing_id === product.listing_id) ? "#036c5f" : "#8CBFC5"}
//                       />
//                     </TouchableOpacity>
//                   </View>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </>
//         )}

//         {/* Favorites Section */}
//         <Text style={styles.sectionTitle}>Your Favorites</Text>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false}>
//           {wishlist.map(product => (
//             <TouchableOpacity
//               key={product.listing_id}
//               style={styles.favoriteCard}
//               onPress={() => navigateToProductDetail(product.listing_id)}
//             >
//               <Image
//                 source={{
//                   uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'
//                 }}
//                 style={styles.productImage}
//               />
//               <Text style={{ ...styles.productName, color: '#fff' }} numberOfLines={2}>
//                 {isUrdu && product.title_ur ? product.title_ur : product.title_en}
//               </Text>
//               <Text style={{ ...styles.productPrice, color: '#fff' }}>
//                 {product.currency} {product.price?.toLocaleString()}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         {wishlist.length === 0 && (
//           <Text style={styles.noFavorites}>No favorites yet</Text>
//         )}
//       </ScrollView>

//       {/* Filter Modal */}
//       <Modal
//         visible={showFilters}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowFilters(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Filters</Text>
//               <TouchableOpacity onPress={() => setShowFilters(false)}>
//                 <Ionicons name="close" size={24} color="#036c5f" />
//               </TouchableOpacity>
//             </View>

//             <ScrollView style={styles.modalBody}>
//               {/* City Filter */}
//               <Text style={styles.filterLabel}>City</Text>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedCity}
//                   onValueChange={(value) => setSelectedCity(value)}
//                   style={styles.picker}
//                 >
//                   {cities.map(city => (
//                     <Picker.Item key={city} label={city} value={city} />
//                   ))}
//                 </Picker>
//               </View>

//               {/* Category Filter */}
//               <Text style={styles.filterLabel}>Category</Text>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedCategory}
//                   onValueChange={(value) => setSelectedCategory(value)}
//                   style={styles.picker}
//                 >
//                   {categories.map(cat => (
//                     <Picker.Item key={cat} label={cat} value={cat} />
//                   ))}
//                 </Picker>
//               </View>

//               {/* Sort Filter */}
//               <Text style={styles.filterLabel}>Sort By</Text>
//               <View style={styles.pickerWrapper}>
//                 <Picker
//                   selectedValue={selectedSort}
//                   onValueChange={(value) => setSelectedSort(value)}
//                   style={styles.picker}
//                 >
//                   {sortOptions.map(option => (
//                     <Picker.Item key={option.value} label={option.label} value={option.value} />
//                   ))}
//                 </Picker>
//               </View>
//             </ScrollView>

//             <View style={styles.modalFooter}>
//               <TouchableOpacity
//                 style={styles.clearButton}
//                 onPress={clearFilters}
//               >
//                 <Text style={styles.clearButtonText}>Clear All</Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 style={styles.applyButton}
//                 onPress={() => setShowFilters(false)}
//               >
//                 <Text style={styles.applyButtonText}>Apply Filters</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Bottom Nav */}
//       <View style={styles.bottomNav}>
//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="home" size={24} color="#036c5f" />
//           <Text style={{ color: '#036c5f', fontSize: 12 }}>Home</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="cart-outline" size={24} color="#666" />
//           <Text style={{ color: '#666', fontSize: 12 }}>Cart</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.navBtn}>
//           <Ionicons name="heart-outline" size={24} color="#666" />
//           <Text style={{ color: '#666', fontSize: 12 }}>Wishlist</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           onPress={() => navigation.navigate('Profile')}
//           style={styles.navBtn}
//         >
//           <Ionicons name="person-outline" size={24} color="#666" />
//           <Text style={{ color: '#666', fontSize: 12 }}>Profile</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#ffffff' },
//   headerBar: {
//     padding: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#036c5f',
//     borderBottomLeftRadius: 20,
//     borderBottomRightRadius: 20
//   },
//   logo: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
//   cartBadge: {
//     backgroundColor: '#FFFFFF',
//     position: 'absolute',
//     right: -10,
//     top: -8,
//     borderRadius: 10,
//     paddingHorizontal: 5
//   },
//   cartBadgeText: { color: '#036c5f', fontWeight: 'bold', fontSize: 10 },
//   scrollArea: { padding: 16 },
//   searchBar: {
//     backgroundColor: '#e0f7fa',
//     borderRadius: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 10,
//     marginBottom: 12
//   },
//   searchInput: { flex: 1, fontSize: 16, color: '#036c5f', marginLeft: 8 },
//   filterButton: {
//     marginLeft: 8,
//     position: 'relative',
//   },
//   filterBadge: {
//     position: 'absolute',
//     top: -5,
//     right: -5,
//     backgroundColor: '#ff6b6b',
//     borderRadius: 10,
//     width: 16,
//     height: 16,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   filterBadgeText: {
//     color: '#fff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   activeFilters: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 12,
//     alignItems: 'center',
//   },
//   filterChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#e0f7fa',
//     borderRadius: 16,
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     marginRight: 8,
//     marginBottom: 8,
//   },
//   filterChipText: {
//     fontSize: 12,
//     color: '#036c5f',
//     marginHorizontal: 4,
//   },
//   clearFiltersText: {
//     fontSize: 12,
//     color: '#ff6b6b',
//     fontWeight: 'bold',
//     marginLeft: 8,
//   },
//   categories: { marginBottom: 16 },
//   categoryBtn: {
//     backgroundColor: '#e0f7fa',
//     paddingVertical: 8,
//     paddingHorizontal: 16,
//     borderRadius: 30,
//     marginRight: 10
//   },
//   categorySelected: { backgroundColor: '#036c5f' },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 12,
//     marginTop: 8,
//     color: '#036c5f'
//   },
//   productCard: {
//     backgroundColor: '#fff6ed',
//     borderRadius: 16,
//     marginRight: 12,
//     padding: 15,
//     alignItems: 'center',
//     width: 140,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.07,
//     shadowRadius: 5,
//     elevation: 2
//   },
//   favoriteCard: {
//     backgroundColor: '#036c5f',
//     borderRadius: 16,
//     marginRight: 12,
//     padding: 15,
//     alignItems: 'center',
//     width: 140,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.07,
//     shadowRadius: 5,
//     elevation: 2
//   },
//   productImage: {
//     width: 100,
//     height: 100,
//     marginBottom: 8,
//     borderRadius: 8,
//     resizeMode: 'cover'
//   },
//   productName: {
//     fontWeight: 'bold',
//     fontSize: 13,
//     color: '#036c5f',
//     marginBottom: 4,
//     textAlign: 'center',
//     minHeight: 36
//   },
//   productPrice: {
//     color: '#036c5f',
//     fontWeight: 'bold',
//     marginBottom: 8,
//     fontSize: 14
//   },
//   noFavorites: { padding: 24, color: '#8CBFC5', textAlign: 'center' },
//   bottomNav: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     paddingVertical: 10
//   },
//   navBtn: { alignItems: 'center' },

//   // Modal Styles
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: '80%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e0e0e0',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#036c5f',
//   },
//   modalBody: {
//     padding: 20,
//   },
//   filterLabel: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//     marginTop: 12,
//   },
//   pickerWrapper: {
//     backgroundColor: '#F8F8F8',
//     borderWidth: 1,
//     borderColor: '#E5E5E5',
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginBottom: 12,
//   },
//   picker: {
//     height: 50,
//   },
//   modalFooter: {
//     flexDirection: 'row',
//     padding: 20,
//     borderTopWidth: 1,
//     borderTopColor: '#e0e0e0',
//     gap: 12,
//   },
//   clearButton: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   clearButtonText: {
//     color: '#666',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   applyButton: {
//     flex: 1,
//     backgroundColor: '#036c5f',
//     padding: 16,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   applyButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });

// export default HomeScreen;


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { getAllListings, searchListings } from '../api/catalogService';
import { useTranslation } from 'react-i18next';

const categories = ['All', 'Electronics', 'Fashion & Apparel', 'Home & Garden', 'Health & Beauty', 'Sports & Fitness', 'Food & Beverage'];
const cities = ['All Cities', 'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'];
const sortOptions = [
  { label: 'Newest First', value: 'created_at' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
];

function HomeScreen() {
  const { i18n } = useTranslation();
  const isUrdu = i18n.language === 'ur';
  const navigation = useNavigation();

  // State
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedSort, setSelectedSort] = useState('created_at');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Debounce timer for search
  const [searchTimer, setSearchTimer] = useState(null);

  // Fetch listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  // Debounced search - triggers 500ms after user stops typing
  useEffect(() => {
    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    const timer = setTimeout(() => {
      fetchListings();
    }, 500);

    setSearchTimer(timer);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedCity, selectedSort]);

  const fetchListings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (products.length === 0) {
        setLoading(true);
      }

      setError('');

      // Build filters
      const filters = {
        limit: 50,
        offset: 0,
      };

      // Add search query
      if (searchQuery.trim()) {
        filters.q = searchQuery.trim();
      }

      // Add category filter
      if (selectedCategory !== 'All') {
        filters.category = selectedCategory;
      }

      // Add city filter
      if (selectedCity !== 'All Cities') {
        filters.city = selectedCity;
      }

      // Add sort
      if (selectedSort !== 'created_at') {
        filters.sort = selectedSort;
      }

      // Use advanced search if filters are applied
      const hasFilters = selectedCategory !== 'All' || selectedCity !== 'All Cities' || selectedSort !== 'created_at';

      const result = hasFilters
        ? await searchListings(filters)
        : await getAllListings(filters);

      if (result.success) {
        setProducts(result.data.listings);
        console.log(`✅ Loaded ${result.data.listings.length} products`);
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error('❌ Fetch Error:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchListings(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedCity('All Cities');
    setSelectedSort('created_at');
    setShowFilters(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product) => {
    const existing = cart.find(item => item.listing_id === product.listing_id);
    if (existing) {
      setCart(cart.map(item =>
        item.listing_id === product.listing_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    Alert.alert('Added to Cart', `${product.title_en} added to your cart`);
  };

  const toggleWishlist = (product) => {
    if (wishlist.find(item => item.listing_id === product.listing_id)) {
      setWishlist(wishlist.filter(item => item.listing_id !== product.listing_id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  const navigateToProductDetail = (listingId) => {
    navigation.navigate('CustomerProduct', { listingId });  // ✅ CORRECT
  };


  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedCity !== 'All Cities' ? 1 : 0) +
    (selectedSort !== 'created_at' ? 1 : 0);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          <Ionicons
            name={menuOpen ? "close" : "menu"}
            size={28}
            color="#fff"
          />
        </TouchableOpacity>

        <Text style={styles.logo}>EAIN</Text>

        <TouchableOpacity onPress={() => Alert.alert('Cart', 'Cart feature coming soon')}>
          <Ionicons name="cart-outline" size={28} color="#fff" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        style={styles.scrollArea}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#036c5f']}
          />
        }
      >
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#036c5f" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#8CBFC5"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#036c5f" />
            </TouchableOpacity>
          )}

          {/* Filter Button */}
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={styles.filterButton}
          >
            <Ionicons name="options-outline" size={20} color="#036c5f" />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filters Display */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFilters}>
            {selectedCity !== 'All Cities' && (
              <View style={styles.filterChip}>
                <Ionicons name="location" size={12} color="#036c5f" />
                <Text style={styles.filterChipText}>{selectedCity}</Text>
                <TouchableOpacity onPress={() => setSelectedCity('All Cities')}>
                  <Ionicons name="close-circle" size={14} color="#036c5f" />
                </TouchableOpacity>
              </View>
            )}
            {selectedCategory !== 'All' && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>{selectedCategory}</Text>
                <TouchableOpacity onPress={() => setSelectedCategory('All')}>
                  <Ionicons name="close-circle" size={14} color="#036c5f" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryBtn,
                selectedCategory === cat && styles.categorySelected
              ]}
            >
              <Text style={{
                color: selectedCategory === cat ? '#fff' : '#036c5f',
                fontWeight: selectedCategory === cat ? 'bold' : 'normal'
              }}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading Indicator */}
        {loading && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#036c5f" />
            <Text style={{ marginTop: 10, color: '#8CBFC5' }}>Loading products...</Text>
          </View>
        )}

        {/* Error Message */}
        {error && !loading && (
          <View style={{ padding: 16, backgroundColor: '#ffebee', borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#c62828' }}>{error}</Text>
            <TouchableOpacity onPress={() => fetchListings()} style={{ marginTop: 8 }}>
              <Text style={{ color: '#036c5f', fontWeight: 'bold' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Products Section */}
        {!loading && (
          <>
            <Text style={styles.sectionTitle}>
              Products ({products.length})
            </Text>

            {products.length === 0 && (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Ionicons name="basket-outline" size={48} color="#8CBFC5" />
                <Text style={{ marginTop: 10, color: '#8CBFC5' }}>
                  {searchQuery || activeFiltersCount > 0
                    ? 'No products match your search'
                    : 'No products found'}
                </Text>
                {activeFiltersCount > 0 && (
                  <TouchableOpacity onPress={clearFilters} style={{ marginTop: 10 }}>
                    <Text style={{ color: '#036c5f', fontWeight: 'bold' }}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {products.map(product => (
                <TouchableOpacity
                  key={product.listing_id}
                  style={styles.productCard}
                  onPress={() => navigateToProductDetail(product.listing_id)}
                >
                  <Image
                    source={{
                      uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'
                    }}
                    style={styles.productImage}
                  />

                  <Text style={styles.productName} numberOfLines={2}>
                    {isUrdu && product.title_ur ? product.title_ur : product.title_en}
                  </Text>

                  <Text style={styles.productPrice}>
                    {product.currency} {product.price?.toLocaleString()}
                  </Text>

                  <Text style={{ fontSize: 11, color: '#666', marginBottom: 8 }} numberOfLines={1}>
                    {product.Vendor?.business_name_en || 'Unknown'}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        addToCart(product);
                      }}
                      style={{
                        backgroundColor: '#036c5f',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8
                      }}
                    >
                      <Ionicons name="cart-outline" size={16} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      style={{ marginLeft: 8 }}
                    >
                      <Ionicons
                        name={wishlist.find(i => i.listing_id === product.listing_id) ? "heart" : "heart-outline"}
                        size={24}
                        color={wishlist.find(i => i.listing_id === product.listing_id) ? "#036c5f" : "#8CBFC5"}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Favorites Section */}
        <Text style={styles.sectionTitle}>Your Favorites</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {wishlist.map(product => (
            <TouchableOpacity
              key={product.listing_id}
              style={styles.favoriteCard}
              onPress={() => navigateToProductDetail(product.listing_id)}
            >
              <Image
                source={{
                  uri: product.media?.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'
                }}
                style={styles.productImage}
              />
              <Text style={{ ...styles.productName, color: '#fff' }} numberOfLines={2}>
                {isUrdu && product.title_ur ? product.title_ur : product.title_en}
              </Text>
              <Text style={{ ...styles.productPrice, color: '#fff' }}>
                {product.currency} {product.price?.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {wishlist.length === 0 && (
          <Text style={styles.noFavorites}>No favorites yet</Text>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#036c5f" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* City Filter */}
              <Text style={styles.filterLabel}>City</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedCity}
                  onValueChange={(value) => setSelectedCity(value)}
                  style={styles.picker}
                >
                  {cities.map(city => (
                    <Picker.Item key={city} label={city} value={city} />
                  ))}
                </Picker>
              </View>

              {/* Category Filter */}
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedCategory}
                  onValueChange={(value) => setSelectedCategory(value)}
                  style={styles.picker}
                >
                  {categories.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>
              </View>

              {/* Sort Filter */}
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedSort}
                  onValueChange={(value) => setSelectedSort(value)}
                  style={styles.picker}
                >
                  {sortOptions.map(option => (
                    <Picker.Item key={option.value} label={option.label} value={option.value} />
                  ))}
                </Picker>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => { }}
          style={styles.navBtn}
        >
          <Ionicons name="home" size={24} color="#036c5f" />
          <Text style={{ color: '#036c5f', fontSize: 12 }}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            console.log('Navigating to MyOrders');
            navigation.navigate('MyOrders');
          }}
          style={styles.navBtn}
        >
          <Ionicons name="receipt-outline" size={24} color="#666" />
          <Text style={{ color: '#666', fontSize: 12 }}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { }}
          style={styles.navBtn}
        >
          <Ionicons name="heart-outline" size={24} color="#666" />
          <Text style={{ color: '#666', fontSize: 12 }}>Wishlist</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            console.log('Navigating to Profile');
            navigation.navigate('Profile');
          }}
          style={styles.navBtn}
        >
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={{ color: '#666', fontSize: 12 }}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerBar: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#036c5f',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20
  },
  logo: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
  cartBadge: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    right: -10,
    top: -8,
    borderRadius: 10,
    paddingHorizontal: 5
  },
  cartBadgeText: { color: '#036c5f', fontWeight: 'bold', fontSize: 10 },
  scrollArea: { padding: 16 },
  searchBar: {
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginBottom: 12
  },
  searchInput: { flex: 1, fontSize: 16, color: '#036c5f', marginLeft: 8 },
  filterButton: {
    marginLeft: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff6b6b',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f7fa',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipText: {
    fontSize: 12,
    color: '#036c5f',
    marginHorizontal: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    color: '#ff6b6b',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  categories: { marginBottom: 16 },
  categoryBtn: {
    backgroundColor: '#e0f7fa',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    marginRight: 10
  },
  categorySelected: { backgroundColor: '#036c5f' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    color: '#036c5f'
  },
  productCard: {
    backgroundColor: '#fff6ed',
    borderRadius: 16,
    marginRight: 12,
    padding: 15,
    alignItems: 'center',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2
  },
  favoriteCard: {
    backgroundColor: '#036c5f',
    borderRadius: 16,
    marginRight: 12,
    padding: 15,
    alignItems: 'center',
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2
  },
  productImage: {
    width: 100,
    height: 100,
    marginBottom: 8,
    borderRadius: 8,
    resizeMode: 'cover'
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#036c5f',
    marginBottom: 4,
    textAlign: 'center',
    minHeight: 36
  },
  productPrice: {
    color: '#036c5f',
    fontWeight: 'bold',
    marginBottom: 8,
    fontSize: 14
  },
  noFavorites: { padding: 24, color: '#8CBFC5', textAlign: 'center' },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10
  },
  navBtn: { alignItems: 'center' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#036c5f',
  },
  modalBody: {
    padding: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  pickerWrapper: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  picker: {
    height: 50,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#036c5f',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;
