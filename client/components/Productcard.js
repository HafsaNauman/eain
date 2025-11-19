import { Heart, Star } from "lucide-react-native";

export default function ProductCard({ product, onAdd, onWishlist, isWishlisted }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="relative">
        <div className="bg-teal-50 h-32 flex items-center justify-center text-5xl">
          {product.image || "📦"}
        </div>

        <button
          onClick={onWishlist}
          className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md"
        >
          <Heart
            size={18}
            className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}
          />
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-semibold line-clamp-2">{product.name}</h3>

        <div className="flex items-center gap-1 text-sm text-yellow-500">
          <Star size={14} /> {product.rating} ({product.reviews})
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-teal-600 font-bold">${product.price}</span>
          <button
            className="px-3 py-1 bg-teal-500 text-white rounded-full text-xs"
            onClick={onAdd}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
