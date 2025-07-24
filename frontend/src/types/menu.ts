export interface MenuItem {
  id: number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  category: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  modifiers?: {
    spiceLevel?: string;
    extras?: string[];
  };
  specialInstructions?: string;
} 