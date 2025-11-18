const CartScreen = () => (
    <div className="flex-1 overflow-auto pb-32">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">Shopping Cart</h1>
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <button
              onClick={() => setCurrentScreen('home')}
              className="bg-teal-500 text-white px-6 py-2 rounded-full hover:bg-teal-600 transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {cart.map(item => (
              <div key={item.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <div className="flex gap-4">
                  <div className="bg-gradient-to-br from-peach-100 to-teal-50 w-20 h-20 rounded-lg flex items-center justify-center text-3xl flex-shrink-0">
                    {item.image || '📦'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 mb-1">{item.name}</h3>
                    <p className="text-teal-600 font-bold mb-2">${item.price}</p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        -
                      </button>
                      <span className="font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-teal-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto text-red-500 hover:text-red-600 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">Subtotal</span>
            <span className="text-xl font-bold text-gray-800">${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={() => setCurrentScreen('checkout')}
            className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 rounded-full font-semibold hover:from-teal-600 hover:to-teal-700 transition-all"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );