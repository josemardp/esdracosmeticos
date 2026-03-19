/**
 * Analytics helper for GA4 integration.
 * 
 * To activate:
 * 1. Get your GA4 Measurement ID (G-XXXXXXXXXX) from Google Analytics
 * 2. Add the GA4 script tag to index.html:
 *    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
 *    <script>
 *      window.dataLayer = window.dataLayer || [];
 *      function gtag(){dataLayer.push(arguments);}
 *      gtag('js', new Date());
 *      gtag('config', 'G-XXXXXXXXXX');
 *    </script>
 * 3. All trackEvent calls below will automatically work with GA4
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, params);
  }
  // Debug in development
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${eventName}`, params);
  }
}

// E-commerce events (GA4 standard)
export function trackViewItem(item: { id: string; name: string; price: number; category?: string }) {
  trackEvent("view_item", {
    currency: "BRL",
    value: item.price,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, item_category: item.category }],
  });
}

export function trackAddToCart(item: { id: string; name: string; price: number; quantity: number }) {
  trackEvent("add_to_cart", {
    currency: "BRL",
    value: item.price * item.quantity,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }],
  });
}

export function trackRemoveFromCart(item: { id: string; name: string; price: number; quantity: number }) {
  trackEvent("remove_from_cart", {
    currency: "BRL",
    value: item.price * item.quantity,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }],
  });
}

export function trackBeginCheckout(value: number, items: { id: string; name: string; price: number; quantity: number }[]) {
  trackEvent("begin_checkout", {
    currency: "BRL",
    value,
    items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}

export function trackPurchase(orderId: string, value: number, items: { id: string; name: string; price: number; quantity: number }[]) {
  trackEvent("purchase", {
    transaction_id: orderId,
    currency: "BRL",
    value,
    items: items.map(i => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}

export function trackWhatsAppClick(context: string) {
  trackEvent("whatsapp_click", { context });
}

export function trackSupportSubmit() {
  trackEvent("support_form_submit");
}

export function trackSearch(query: string) {
  trackEvent("search", { search_term: query });
}
