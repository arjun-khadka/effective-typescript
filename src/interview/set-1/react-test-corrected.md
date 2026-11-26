```tsx
import React, { useState, useMemo, useCallback } from 'react';

const DATA = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];

type ResultsProps = {
  items: string[];
  onSelect: (item: string) => void;
};

function Results({ items, onSelect }: ResultsProps) {
  console.log('Results render');

  return (
    <ul>
      {items.map((item) => (
        <li key={item} onClick={() => onSelect(item)}>
          {item}
        </li>
      ))}
    </ul>
  );
}

const MemoResults = React.memo(Results);

export default function App() {
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);

  const filtered = useMemo(() => {
    return DATA.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  const handleSelect = useCallback((item: string) => {
    console.log('selected:', item);
  }, []);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h2>Results ({filtered.length})</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search'
      />

      <button onClick={() => setCount((c) => c + 1)} style={{ marginLeft: 8 }}>
        Clicked {count}
      </button>

      <MemoResults items={filtered} onSelect={handleSelect} />
    </div>
  );
}
```
