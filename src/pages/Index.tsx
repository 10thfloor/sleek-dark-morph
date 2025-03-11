
import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import UserProfile from '@/components/UserProfile';
import Cart from '@/components/Cart';
import SavedCarts from '@/components/SavedCarts';
import SavedForLater from '@/components/SavedForLater';
import ProductInventory from '@/components/ProductInventory';
import { 
  CartItem,
  SavedCart,
  mockCartItems,
  mockSavedCarts,
  mockSavedForLaterItems,
  generateCartId,
  formatCurrency,
  calculateTotal
} from '@/utils/cartUtils';

const productInventory: Record<number, number> = {
  1: 5,  // Alpha SV Jacket
  2: 8,  // Beta AR Pants
  3: 12, // Atom LT Hoody
  4: 3,  // Cerium Down Vest
  5: 6,  // Gamma MX Softshell
  6: 0,  // Zeta SL Rain Jacket - Out of stock
  7: 15, // Covert Fleece
  8: 4   // Proton AR Insulated
};

const Index = () => {
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>(mockCartItems);
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>(mockSavedCarts);
  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>(mockSavedForLaterItems);
  const [inventory, setInventory] = useState<Record<number, number>>(productInventory);
  const [userId] = useState("user-123");
  const [cartHistory, setCartHistory] = useState<CartItem[][]>([]);
  const [showUndoToast, setShowUndoToast] = useState(false);

  useEffect(() => {
    document.querySelectorAll('.cart-section').forEach((el, i) => {
      (el as HTMLElement).style.animationDelay = `${i * 0.1}s`;
    });
  }, []);

  // Save the current cart to history before replacing it
  const saveToHistory = (items: CartItem[]) => {
    if (items.length > 0) {
      setCartHistory(prev => [...prev, [...items]]);
    }
  };

  // Revert to the previous cart
  const undoCartLoad = () => {
    if (cartHistory.length > 0) {
      const prevCart = cartHistory[cartHistory.length - 1];
      
      // Adjust inventory
      const tempInventory = { ...inventory };
      
      // Return current cart items to inventory
      cartItems.forEach(item => {
        tempInventory[Number(item.productId)] += item.quantity;
      });
      
      // Remove previous cart items from inventory
      prevCart.forEach(item => {
        tempInventory[Number(item.productId)] -= item.quantity;
      });
      
      setInventory(tempInventory);
      setCartItems(prevCart);
      setCartHistory(prev => prev.slice(0, -1));
      setShowUndoToast(false);
      
      toast({
        title: "Cart Restored",
        description: "Your previous cart has been restored.",
      });
    }
  };

  const handleAddToCart = (productId: number, price: number) => {
    if (inventory[productId] <= 0) {
      toast({
        title: "Out of Stock",
        description: `Product #${productId} is currently out of stock.`,
        variant: "destructive",
      });
      return;
    }

    const existingItemIndex = cartItems.findIndex(item => item.productId === productId);
    
    if (existingItemIndex !== -1) {
      if (cartItems[existingItemIndex].quantity < inventory[productId]) {
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += 1;
        setCartItems(updatedItems);
        
        const updatedInventory = { ...inventory };
        updatedInventory[productId] -= 1;
        setInventory(updatedInventory);
      } else {
        toast({
          title: "Inventory Limit Reached",
          description: `Sorry, we only have ${inventory[productId]} of this item in stock.`,
          variant: "destructive",
        });
        return;
      }
    } else {
      const newItem: CartItem = {
        id: Date.now(),
        productId,
        quantity: 1,
        price
      };
      setCartItems([...cartItems, newItem]);
      
      const updatedInventory = { ...inventory };
      updatedInventory[productId] -= 1;
      setInventory(updatedInventory);
    }
    
    toast({
      title: "Item Added",
      description: `Added product #${productId} to your cart.`,
    });
  };

  const handleUpdateQuantity = (id: string | number, quantity: number) => {
    const cartItem = cartItems.find(item => item.id === id);
    if (!cartItem) return;
    
    const productId = cartItem.productId;
    const currentQuantity = cartItem.quantity;
    
    const availableInventory = inventory[Number(productId)] + currentQuantity;
    
    if (quantity > availableInventory) {
      toast({
        title: "Inventory Limit Reached",
        description: `Sorry, we only have ${availableInventory} of this item in stock.`,
        variant: "destructive",
      });
      return;
    }
    
    setCartItems(
      cartItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
    
    const updatedInventory = { ...inventory };
    updatedInventory[Number(productId)] = availableInventory - quantity;
    setInventory(updatedInventory);
  };

  const handleRemoveItem = (id: string | number) => {
    const itemToRemove = cartItems.find(item => item.id === id);
    if (itemToRemove) {
      const updatedInventory = { ...inventory };
      updatedInventory[Number(itemToRemove.productId)] += itemToRemove.quantity;
      setInventory(updatedInventory);
      
      setCartItems(cartItems.filter(item => item.id !== id));
      
      toast({
        title: "Item Removed",
        description: "The item has been removed from your cart.",
      });
    }
  };

  const handleSaveCart = () => {
    if (cartItems.length === 0) return;
    
    const date = new Date();
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()} at ${date.toLocaleTimeString()}`;
    
    const newSavedCart: SavedCart = {
      id: generateCartId(),
      date: formattedDate,
      items: [...cartItems]
    };
    
    setSavedCarts([...savedCarts, newSavedCart]);
    
    toast({
      title: "Cart Saved",
      description: "Your cart has been saved successfully.",
    });
  };

  const handleLoadCart = (cartId: string) => {
    const cartToLoad = savedCarts.find(cart => cart.id === cartId);
    
    if (cartToLoad) {
      const tempInventory = { ...inventory };
      let insufficientInventory = false;
      
      // Save current cart to history before replacing it
      saveToHistory([...cartItems]);
      
      // Return current cart items to inventory
      cartItems.forEach(item => {
        tempInventory[Number(item.productId)] += item.quantity;
      });
      
      // Check if all items in the saved cart are available
      cartToLoad.items.forEach(item => {
        if (tempInventory[Number(item.productId)] < item.quantity) {
          insufficientInventory = true;
        } else {
          tempInventory[Number(item.productId)] -= item.quantity;
        }
      });
      
      if (insufficientInventory) {
        toast({
          title: "Insufficient Inventory",
          description: "Some items in this saved cart are no longer available in sufficient quantity.",
          variant: "destructive",
        });
        return;
      }
      
      setCartItems([...cartToLoad.items]);
      setInventory(tempInventory);
      
      toast({
        title: "Cart Loaded",
        description: "The saved cart has been loaded successfully.",
        action: cartHistory.length > 0 ? (
          <button 
            onClick={undoCartLoad}
            className="bg-primary text-primary-foreground px-3 py-1 rounded-md text-xs"
          >
            Undo
          </button>
        ) : undefined
      });
      
      setShowUndoToast(true);
    }
  };

  const handleDeleteCart = (cartId: string) => {
    setSavedCarts(savedCarts.filter(cart => cart.id !== cartId));
    
    toast({
      title: "Cart Deleted",
      description: "The saved cart has been deleted.",
    });
  };

  const handleSaveForLater = (id: string | number) => {
    const itemToSave = cartItems.find(item => item.id === id);
    
    if (itemToSave) {
      setSavedForLaterItems([...savedForLaterItems, itemToSave]);
      
      handleRemoveItem(id);
      
      toast({
        title: "Item Saved",
        description: "Item has been saved for later.",
      });
    }
  };

  const handleMoveToCart = (id: string | number) => {
    const itemToMove = savedForLaterItems.find(item => item.id === id);
    
    if (itemToMove) {
      const productId = Number(itemToMove.productId);
      
      const existingItemIndex = cartItems.findIndex(cartItem => 
        cartItem.productId === itemToMove.productId
      );
      
      const totalRequestedQuantity = existingItemIndex !== -1 
        ? cartItems[existingItemIndex].quantity + itemToMove.quantity 
        : itemToMove.quantity;
      
      if (inventory[productId] < itemToMove.quantity) {
        toast({
          title: "Insufficient Inventory",
          description: `Sorry, we only have ${inventory[productId]} of this item available.`,
          variant: "destructive",
        });
        return;
      }
      
      const updatedInventory = { ...inventory };
      updatedInventory[productId] -= itemToMove.quantity;
      setInventory(updatedInventory);
      
      if (existingItemIndex !== -1) {
        const updatedCartItems = [...cartItems];
        updatedCartItems[existingItemIndex].quantity += itemToMove.quantity;
        setCartItems(updatedCartItems);
      } else {
        setCartItems([...cartItems, itemToMove]);
      }
      
      setSavedForLaterItems(savedForLaterItems.filter(item => item.id !== id));
      
      toast({
        title: "Item Moved",
        description: "Item has been moved to your cart.",
      });
    }
  };

  const handleRemoveSavedItem = (id: string | number) => {
    setSavedForLaterItems(savedForLaterItems.filter(item => item.id !== id));
    
    toast({
      title: "Item Removed",
      description: "The saved item has been removed.",
    });
  };

  const handleEmailCurrentCart = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "There are no items in your cart to email.",
        variant: "destructive",
      });
      return;
    }
    
    const cartItemsText = cartItems.map(item => {
      const productName = inventory[Number(item.productId)] !== undefined ? 
        `Product #${item.productId}` : `Product #${item.productId}`;
      return `${productName} - Qty: ${item.quantity} - ${formatCurrency(item.price * item.quantity)}`;
    }).join('%0D%0A');
    
    const emailSubject = `My Shopping Cart`;
    const emailBody = `My Current Cart Items:%0D%0A%0D%0A${cartItemsText}%0D%0A%0D%0ATotal: ${formatCurrency(calculateTotal(cartItems))}`;
    
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    
    toast({
      title: "Email Prepared",
      description: "Your email client should open with your cart details.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-foreground animate-fade-in">
            Shopping Cart with tRPC and NATS
          </h1>
          <div className="h-1 w-24 bg-primary rounded animate-pulse-subtle"></div>
        </header>
        
        <div className="cart-section mb-6">
          <UserProfile userId={userId} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-7 space-y-6">
            <div className="cart-section">
              <ProductInventory onAddToCart={handleAddToCart} />
            </div>
            
            <div className="cart-section">
              <SavedCarts 
                savedCarts={savedCarts}
                onLoadCart={handleLoadCart}
                onDeleteCart={handleDeleteCart}
              />
            </div>
          </div>
          
          <div className="md:col-span-5 space-y-4">
            <div className="cart-section">
              <Cart 
                items={cartItems}
                onSaveCart={handleSaveCart}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onSaveForLater={handleSaveForLater}
                onEmailCart={handleEmailCurrentCart}
              />
            </div>
            
            <div className="cart-section">
              <SavedForLater
                items={savedForLaterItems}
                onMoveToCart={handleMoveToCart}
                onRemoveItem={handleRemoveSavedItem}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
