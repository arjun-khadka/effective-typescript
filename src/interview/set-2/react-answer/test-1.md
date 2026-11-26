```tsx
import React, { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  price: number;
};

export default function ProductList({ products }: { products: Product[] }) {
  const [search, setSearch] = useState('');

  // ISSUE:
  // filteredProducts is derived from products + search.
  // It should usually not be stored in separate state.
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    const result = products.filter((product) =>
      product.name.toLowerCase().includes(search.toLowerCase()),
    );

    setFilteredProducts(result);
  }, [products]);
  // ISSUE:
  // search is missing from dependencies.
  //
  // BIGGER ISSUE:
  // This effect is unnecessary because filteredProducts can be calculated
  // during render from products + search.

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
          // ISSUE:
          // index is a bad key here because the list is filtered.
          // Use product.id instead.
          <li key={index}>
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

<details>
<summary><strong>Expected Findings</strong></summary>

1. filteredProducts is derived state and should not be stored in state. FilteredProducts is derived from products and search. Since it can be calculated during render, storing it in state introduces unnecessary synchronization logic, extra renders, and opportunities for bugs. Should remove the state and compute it directly. Only store filteredUsers if the filtered list itself becomes independently editable, like manual reorder, pinning, temporary removal, selection order, or local changes that are not simply users + search
2. useEffect is unnecessary. The effect is unnecessary because it is only synchronizing derived state. filteredProducts can be calculated directly from products and search during render. Removing the effect eliminates an extra render, removes synchronization logic, and avoids dependency bugs
3. key={index} should use product.id.Using index as a key is problematic because this list is filtered. When items are removed, indexes shift and React may associate component state with the wrong item. Keys should represent stable item identity, so product.id is the correct key.

</details>

<details>
<summary><strong>Bonus</strong></summary>

4. search is missing from dependency array.
5. Initial render shows stale/empty derived state until effect runs.

</details>
