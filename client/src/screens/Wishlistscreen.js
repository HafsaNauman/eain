import { useContext } from "react";
import { WishlistContext } from "/context/WishlistContext";

export default function WishlistScreen() {
  const { wishlist } = useContext(WishlistContext);

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold mb-4">Wishlist</h1>

      {wishlist.length === 0 ? (
        <p>No items in wishlist.</p>
      ) : (
        wishlist.map(item => (
          <div key={item.id} className="bg-white p-4 mb-3 rounded-xl shadow">
            <div className="flex gap-3">
              <div className="text-4xl">{item.image}</div>
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-teal-600 font-bold">${item.price}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
