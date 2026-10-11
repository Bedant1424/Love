import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { CatalogueView } from './components/CatalogueView';
import { CustomerForm } from './components/CustomerForm';
import { CartView } from './components/CartView';
import { ReviewView } from './components/ReviewView';
import { StickyCartBar } from './components/StickyCartBar';
import { useCart } from './hooks/useCart';
import { CustomerDetails } from './types/customer';
import { CategoryId } from './types/catalogue';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedCatalogueCategory, setSelectedCatalogueCategory] = useState<
    CategoryId | 'all'
  >('all');

  // Customer details are held in TRANSIENT application memory only (never in LocalStorage)
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    fullName: '',
    mobileNumber: '',
    fulfilmentPreference: 'COUNTER_PICKUP',
    ageConfirmed: true,
    notes: '',
  });

  const cart = useCart();

  useEffect(() => {
    // Redirect any customer visit to /admin to the separate secure owner domain
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
      window.location.replace('https://nagarjuna-traders-owner.pages.dev');
    }
  }, []);

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base text-content-primary p-4 text-center">
        <div className="max-w-md p-6 bg-bg-surface border border-white/10 rounded-2xl shadow-xl">
          <p className="text-sm font-semibold mb-2">Redirecting to Owner Portal</p>
          <p className="text-xs text-content-muted mb-4">
            Store administration is hosted separately. Redirecting to nagarjuna-traders-owner.pages.dev...
          </p>
          <a
            href="https://nagarjuna-traders-owner.pages.dev"
            className="inline-block px-4 py-2 bg-festive-marigold text-black font-semibold rounded-xl text-xs"
          >
            Go to Owner Portal →
          </a>
        </div>
      </div>
    );
  }

  const handleSelectCategoryFromHome = (catId: CategoryId) => {
    setSelectedCatalogueCategory(catId);
    setActiveTab('catalogue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCustomerSubmit = (details: CustomerDetails) => {
    setCustomerDetails(details);
    if (!cart.isEmpty) {
      handleNavigateToTab('review');
    } else {
      handleNavigateToTab('catalogue');
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg-base text-content-primary selection:bg-festive-marigold selection:text-black">
      {/* Top Sticky Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleNavigateToTab}
        cartCount={cart.totals.totalQuantity}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'home' && (
          <HomeView
            onSelectCategory={handleSelectCategoryFromHome}
            onExploreCatalogue={() => {
              setSelectedCatalogueCategory('all');
              handleNavigateToTab('catalogue');
            }}
            onEnterCustomerDetails={() => handleNavigateToTab('customer')}
          />
        )}

        {activeTab === 'catalogue' && (
          <CatalogueView
            key={selectedCatalogueCategory}
            initialCategory={selectedCatalogueCategory}
            getItemQuantity={cart.getItemQuantity}
            onAddItem={cart.addItem}
            onIncrement={cart.incrementQuantity}
            onDecrement={cart.decrementQuantity}
          />
        )}

        {activeTab === 'customer' && (
          <CustomerForm
            initialValues={customerDetails}
            onSubmit={handleCustomerSubmit}
            onBackToCatalogue={() => handleNavigateToTab('catalogue')}
          />
        )}

        {activeTab === 'cart' && (
          <CartView
            items={cart.items}
            totals={cart.totals}
            onIncrement={cart.incrementQuantity}
            onDecrement={cart.decrementQuantity}
            onRemove={cart.removeItem}
            onClear={cart.clearCart}
            onContinueShopping={() => handleNavigateToTab('catalogue')}
            onProceedToReview={() => {
              if (
                !customerDetails.fullName.trim() ||
                !customerDetails.mobileNumber.trim()
              ) {
                handleNavigateToTab('customer');
              } else {
                handleNavigateToTab('review');
              }
            }}
          />
        )}

        {activeTab === 'review' && (
          <ReviewView
            customer={customerDetails}
            items={cart.items}
            totals={cart.totals}
            onEditCustomer={() => handleNavigateToTab('customer')}
            onEditCart={() => handleNavigateToTab('cart')}
            onResetOrder={() => {
              cart.clearCart();
              handleNavigateToTab('catalogue');
            }}
          />
        )}
      </main>

      {/* Mobile Sticky Cart Bar (Shown only when browsing catalogue/home and cart is not empty) */}
      {(activeTab === 'catalogue' || activeTab === 'home') && (
        <StickyCartBar
          totals={cart.totals}
          onReviewCart={() => handleNavigateToTab('cart')}
        />
      )}

      {/* Global Footer */}
      <Footer onSelectTab={handleNavigateToTab} />
    </div>
  );
};

export default App;
