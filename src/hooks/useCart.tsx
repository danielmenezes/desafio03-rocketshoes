import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => Promise<void>;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });



  const addProduct = async (productId: number) => {
    try {
      const stock: Stock = await api.get(`/stock/${productId}`)
        .then(response => response.data);

      const [productFiltered] = cart.filter(product => product.id === productId);

      if (productFiltered) {
        if (productFiltered.amount < stock.amount) {

          const newCart = cart.map(product => {
            if (product.id === productId) {
              return {
                ...product,
                amount: product.amount + 1
              }
            }

            return product;
          });

          setCart([
            ...newCart
          ]);

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));

        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }

      } else {

        if (stock.amount >= 1) {
          const product: Product = await api.get(`/products/${productId}`)
            .then(response => response.data);

          const newCart = [
            ...cart, {
              ...product,
              amount: 1
            }
          ]

          setCart(newCart)

          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find(product => product.id === productId);

      if (product) {
        const newCart = cart.filter(product => product.id !== productId);

        setCart([
          ...newCart,
        ]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Erro na remoção do produto');
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {

    try {
      const stock: Stock = await api.get(`/stock/${productId}`)
        .then(response => response.data);

      if (amount > 0 && stock.amount >= amount) {
        const newCart = cart.map(product => {
          if (product.id === productId) {
            return {
              ...product,
              amount: amount,
            }
          }

          return product;
        })

        setCart([
          ...newCart,
        ]);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
