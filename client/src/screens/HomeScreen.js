import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Image } from 'react-native';
import { Ionicons, FontAwesome, Feather, AntDesign } from '@expo/vector-icons';
import headphones from '../../assets/headphones.png';
import { useNavigation } from '@react-navigation/native';

const categories = ['All', 'Electronics', 'Fashion', 'Accessories', 'Home', 'Sports'];

const mockProducts = [
  { id: 1, name: 'Wireless Headphones', price: 89.99, image: headphones, category: 'Electronics', rating: 4.5, reviews: 128, stock: 50 },
  { id: 2, name: 'Smart Watch', price: 199.99, image: '⌚', category: 'Electronics', rating: 4.8, reviews: 256, stock: 30 },
  { id: 3, name: 'Leather Backpack', price: 79.99, image: '🎒', category: 'Accessories', rating: 4.3, reviews: 89, stock: 40 },
  { id: 4, name: 'Running Shoes', price: 129.99, image: '👟', category: 'Fashion', rating: 4.7, reviews: 342, stock: 60 },
  { id: 5, name: 'Sunglasses', price: 59.99, image: '🕶️', category: 'Accessories', rating: 4.4, reviews: 176, stock: 80 },
  { id: 6, name: 'Portable Speaker', price: 49.99, image: '🔊', category: 'Electronics', rating: 4.6, reviews: 203, stock: 45 },
];

function HomeScreen() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('home');
  const navigation = useNavigation();

  useEffect(() => {
    setProducts(mockProducts);
  }, []);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = products.filter(product => 
    (selectedCategory === 'All' || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogin = () => setUser({ name: 'User', email: 'user@mail.com' });
  const handleRegister = () => setUser({ name: 'User', email: 'user@mail.com' });
  const handleLogout = () => setUser(null);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const toggleWishlist = (product) => {
    if (wishlist.find(item => item.id === product.id)) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)}>
          {menuOpen
            ? <Feather name="x" size={24} color="#FFFFFF" />
            : <Feather name="menu" size={24} color="#036c5f" />
          }
        </TouchableOpacity>
        <Text style={styles.logo}>EAIN</Text>
        <TouchableOpacity onPress={() => setCurrentScreen('cart')}>
          <Ionicons name="cart-outline" size={24} color="#036c5f" />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Scroll Content */}
      <ScrollView contentContainerStyle={styles.scrollArea}>
        {/* Search bar */}
        <View style={styles.searchBar}>
          <Feather name="search" size={22} color="#036c5f" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search products…"
            placeholderTextColor="#8CBFC5"
          />
        </View>
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
              <Text style={{ color: selectedCategory === cat ? '#fff' : '#036c5f' }}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Section */}
        <Text style={styles.sectionTitle}>Products</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 16 }}
        >
          {filteredProducts.map(product => (
            <View key={product.id} style={styles.productCard}>
              {typeof product.image === "string" ? (
                <Text style={styles.productEmoji}>{product.image}</Text>
              ) : (
                <Image source={product.image} style={styles.productImage} />
              )}
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>${product.price}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity onPress={() => addToCart(product)}>
                  <Ionicons name="cart" size={20} color="#036c5f" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleWishlist(product)} style={{ marginLeft: 8 }}>
                  <FontAwesome
                    name="heart"
                    size={20}
                    color={wishlist.find(i => i.id === product.id) ? "#036c5f" : "#8CBFC5"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Favorites Section */}
        <Text style={styles.sectionTitle}>Your Favorites</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {wishlist.map(product => (
            <View key={product.id} style={styles.favoriteCard}>
              {typeof product.image === "string" ? (
                <Text style={styles.productEmoji}>{product.image}</Text>
              ) : (
                <Image source={product.image} style={styles.productImage} />
              )}
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>${product.price}</Text>
            </View>
          ))}
          {wishlist.length === 0 && (
            <Text style={styles.noFavorites}>No favorites yet</Text>
          )}
        </ScrollView>
      </ScrollView>
      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => setCurrentScreen('home')} style={styles.navBtn}>
          <AntDesign name="home" size={22} color="#036c5f" />
          <Text>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('cart')} style={styles.navBtn}>
          <Ionicons name="cart-outline" size={22} color="#036c5f" />
          <Text>Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentScreen('wishlist')} style={styles.navBtn}>
          <FontAwesome name="heart" size={22} color="#FA6E79" />
          <Text>Wishlist</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.navBtn}>
          <FontAwesome name="user" size={22} color="#036c5f" />
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerBar: {
    padding: 16,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#036c5f',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20
  },
  logo: { fontWeight: 'bold', fontSize: 22, color: '#fff' },
  cartBadge: {
    backgroundColor: '#FFFFFF', position: 'absolute', right: -10, top: -8, borderRadius: 10, paddingHorizontal: 5
  },
  cartBadgeText: { color: '#036c5f', fontWeight: 'bold' },
  scrollArea: { padding: 16 },
  searchBar: {
    backgroundColor: '#e0f7fa',
    borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 10, marginBottom: 16
  },
  searchInput: { flex: 1, fontSize: 16, color: '#036c5f' },
  categories: { marginBottom: 16, flexDirection: 'row' },
  categoryBtn: {
    backgroundColor: '#e0f7fa',
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 30, marginRight: 10
  },
  categorySelected: { backgroundColor: '#036c5f' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#036c5f' },
  productCard: {
    backgroundColor: '#fff6ed', borderRadius: 16, marginRight: 12,
    padding: 15, alignItems: 'center', width: 120, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 5, elevation: 2
  },
  favoriteCard: {
    backgroundColor: '#036c5f', borderRadius: 16, marginRight: 12, padding: 15,
    alignItems: 'center', width: 120, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07, shadowRadius: 5, elevation: 2
  },
  productImage: {
    width: 80,
    height: 80,
    marginBottom: 6,
    resizeMode: 'contain'
  },
  productEmoji: { fontSize: 32 },
  productName: { fontWeight: 'bold', fontSize: 14, color: '#036c5f', marginBottom: 4 },
  productPrice: { color: '#036c5f', fontWeight: 'bold', marginBottom: 6 },
  noFavorites: { padding: 24, color: '#8CBFC5' },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingVertical: 10
  },
  navBtn: { alignItems: 'center' }
});

export default HomeScreen;
