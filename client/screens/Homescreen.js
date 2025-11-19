const HomeScreen = () => (
    <div className="flex-1 overflow-auto pb-20">
      <div className="bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to EAIN</h1>
        <p className="text-teal-50 mb-4">Discover amazing products at great prices</p>
        <div className="bg-white rounded-full flex items-center px-4 py-2">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 ml-2 outline-none text-gray-800"
          />
        </div>
      </div>

      <div className="p-4 bg-white">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Categories</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 bg-gradient-to-r from-peach-100 to-peach-50">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🔥</span>
            <h2 className="text-lg font-semibold text-gray-800">Hot Deals</h2>
          </div>
          <p className="text-gray-600 text-sm">Up to 50% off on selected items</p>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Products</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-teal-500" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="relative">
                  <div className="bg-gradient-to-br from-peach-100 to-teal-50 h-32 flex items-center justify-center text-5xl">
                    {product.image || '📦'}
                  </div>
                  {product.stock < 10 && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      Only {product.stock} left
                    </div>
                  )}
                  <button
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md"
                  >
                    <Heart
                      size={18}
                      className={wishlist.find(item => item.id === product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}
                    />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600">{product.rating} ({product.reviews})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-teal-600 font-bold">${product.price}</span>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        product.stock === 0
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-teal-500 text-white hover:bg-teal-600'
                      }`}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );