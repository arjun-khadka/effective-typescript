```tsx
import React, { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function ProductList({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const result = products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()),
    );

    setFilteredProducts(result);
  }, [products]);

  return (
    <div>
      <h2>Products: {filteredProducts.length}</h2>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder='Search products'
      />

      <ul>
        {filteredProducts.map((product, index) => (
          <li key={index}>
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
```
