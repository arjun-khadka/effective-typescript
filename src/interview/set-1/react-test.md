```tsx
import React, { useState, useMemo, useCallback } from 'react';

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
  // Simplified static data for demo purposes (could be large / dynamic in real usage)
  const data = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];

  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);

  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
  }, [data]);

  const handleSelect = useCallback(
    (item: string) => {
      console.log('selected:', item);
    },
    [query],
  );

  const title = useMemo(() => {
    return `Results (${filtered.length})`;
  }, [filtered, count]);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <h2>{title}</h2>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder='Search'
      />

      <button onClick={() => setCount(count + 1)} style={{ marginLeft: 8 }}>
        Clicked {count}
      </button>

      <MemoResults items={[...filtered]} onSelect={handleSelect} />
    </div>
  );
}
```
