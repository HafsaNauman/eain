import { useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import CartScreen from "./screens/CartScreen";
import WishlistScreen from "./screens/Wishlistscreen";

import { Home, Heart, ShoppingCart } from "lucide-react-native";



export default function AppNavigator() {
  const [screen, setScreen] = useState("home");

  const screens = {
    home: <HomeScreen />,
    cart: <CartScreen />,
    wishlist: <WishlistScreen />,
  };

  return (
    <div className="max-w-md mx-auto h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        {screens[screen]}
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around bg-white border-t p-3 fixed bottom-0 left-0 right-0">
        <button onClick={() => setScreen("home")}>
          <Home />
        </button>
        <button onClick={() => setScreen("wishlist")}>
          <Heart />
        </button>
        <button onClick={() => setScreen("cart")}>
          <ShoppingCart />
        </button>
      </div>
    </div>
  );
}
