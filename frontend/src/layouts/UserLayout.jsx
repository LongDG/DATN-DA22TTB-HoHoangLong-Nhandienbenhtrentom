import { useState, useEffect } from 'react';
import { Outlet, useOutletContext } from 'react-router-dom';
import { UserHeader } from '../components/user/UserHeader';
import { UserFooter } from '../components/user/UserFooter';
import { ZaloButton } from '../components/user/ZaloButton';
import { CartDrawer } from '../components/user/CartDrawer';

export default function UserLayout({ user, onLogout }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('aquahealth_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCart, setShowCart] = useState(false);

  // Lưu giỏ hàng vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    localStorage.setItem('aquahealth_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
    );
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* Shared Header */}
      <UserHeader
        user={user}
        onLogout={onLogout}
        cartCount={cartCount}
        onOpenCart={() => setShowCart(true)}
      />

      {/* Cart Drawer */}
      {showCart && (
        <CartDrawer
          cart={cart}
          onClose={() => setShowCart(false)}
          onRemove={removeFromCart}
          onQty={updateQty}
        />
      )}

      {/* Page Content — truyền context giỏ hàng xuống child */}
      <main className="flex-1">
        <Outlet context={{ cart, addToCart, removeFromCart, updateQty, user }} />
      </main>

      {/* Shared Footer */}
      <UserFooter />

      {/* Floating Zalo */}
      <ZaloButton />
    </div>
  );
}
