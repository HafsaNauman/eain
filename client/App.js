import React from "react";
import AppNavigator from "./AppNavigator";

import CartProvider from "./context/CartContext";
import WishlistProvider from "./context/WishlistContext";

export default function App() {
  return (
    <CartProvider>
      <WishlistProvider>
        <AppNavigator />
      </WishlistProvider>
    </CartProvider>
  );
}
