export interface CartItem {
  id: string | number;
  productId: string | number;
  quantity: number;
  price: number;
}

export interface SavedCart {
  id: string;
  date: string;
  items: CartItem[];
}

// Mock data for the shopping cart
export const mockCartItems: CartItem[] = [
  { id: 1, productId: 1, quantity: 1, price: 799.99 },
  { id: 2, productId: 6, quantity: 2, price: 399.99 } // Out of stock item
];

export const mockSavedCarts: SavedCart[] = [
  {
    id: "d0b4f43b34bdc5c2",
    date: "3/8/2025 at 3:50:00 PM",
    items: [
      { id: 1, productId: 1, quantity: 1, price: 799.99 },
      { id: 2, productId: 6, quantity: 1, price: 399.99 }, // Out of stock item
      { id: 3, productId: 4, quantity: 2, price: 279.99 }  // Low stock item
    ]
  },
  {
    id: "e5c3f28a9d71b4e6",
    date: "3/10/2025 at 2:25:00 PM",
    items: [
      { id: 4, productId: 2, quantity: 2, price: 449.99 },
      { id: 5, productId: 3, quantity: 1, price: 299.99 }
    ]
  }
];

// Mock data for saved for later items
export const mockSavedForLaterItems: CartItem[] = [
  { id: 3, productId: 6, quantity: 1, price: 399.99 }, // Out of stock item
  { id: 4, productId: 5, quantity: 1, price: 349.99 }  // Low stock item
];

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

export const getCartItemCount = (items: CartItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

export const generateCartId = (): string => {
  return Math.random().toString(16).slice(2, 18);
};

// List of adjectives and nouns for mnemonic cart names
const adjectives = [
  "Happy", "Bright", "Swift", "Clever", "Gentle", "Bold", "Calm", "Brave", 
  "Eager", "Kind", "Proud", "Wise", "Loyal", "Noble", "Quiet", "Smart"
];

const nouns = [
  "Tiger", "Eagle", "Panda", "Dolphin", "Wolf", "Lion", "Falcon", "Bear", 
  "Hawk", "Whale", "Fox", "Deer", "Owl", "Rabbit", "Turtle", "Horse"
];

// Generate a consistent mnemonic name from a cart id
export const getCartMnemonic = (cartId: string): string => {
  // Use the first 8 chars of the id to create a stable hash
  const idFragment = cartId.substring(0, 8);
  
  // Convert to numbers we can use as indices
  let adjIndex = 0;
  let nounIndex = 0;
  
  // Simple hashing algorithm to get consistent indices
  for (let i = 0; i < 4; i++) {
    adjIndex += idFragment.charCodeAt(i);
  }
  
  for (let i = 4; i < 8; i++) {
    nounIndex += idFragment.charCodeAt(i);
  }
  
  // Get adjective and noun using modulo to stay within array bounds
  const adjective = adjectives[adjIndex % adjectives.length];
  const noun = nouns[nounIndex % nouns.length];
  
  return `${adjective} ${noun}`;
};

// Merge items function to combine items from a saved cart with current items
export const mergeCartItems = (currentItems: CartItem[], savedItems: CartItem[]): CartItem[] => {
  const mergedItems = [...currentItems];
  
  savedItems.forEach(savedItem => {
    const existingItemIndex = mergedItems.findIndex(item => 
      item.productId === savedItem.productId
    );
    
    if (existingItemIndex !== -1) {
      // If item exists, increase quantity
      mergedItems[existingItemIndex] = {
        ...mergedItems[existingItemIndex],
        quantity: mergedItems[existingItemIndex].quantity + savedItem.quantity
      };
    } else {
      // Otherwise add as new item with new ID
      mergedItems.push({
        ...savedItem,
        id: Date.now() + Math.random()
      });
    }
  });
  
  return mergedItems;
};
