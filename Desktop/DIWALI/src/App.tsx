import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { CatalogueView } from './components/CatalogueView';
import { CustomerForm } from './components/CustomerForm';
import { CartView } from './components/CartView';
import { ReviewView } from './components/ReviewView';
import { AdminView } from './components/AdminView';
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
    ageConfirmed: false,
    notes: '',
  });

  const cart = useCart();

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
                !customerDetails.ageConfirmed
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

        {activeTab === 'admin' && (
          <AdminView onBackToCustomerSite={() => handleNavigateToTab('home')} />
        )}
      </main>

      {/* Mobile Sticky Cart Bar (Shown only when browsing catalogue/home and cart is not empty) */}
      {(activeTab === 'catalogue' || activeTab === 'home') && (
        <StickyCartBar
          totals={cart.totals}
          onReviewCart={() => handleNavigateToTab('cart')}
        />
      )}

      {/* Global Footer with Disclaimers */}
      <Footer />
    </div>
  );
};

export default App;
