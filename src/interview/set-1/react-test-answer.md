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
// ❌ memo will NOT help if props (items, onSelect) change identity every render

export default function App() {
  const data = ['Apple', 'Apricot', 'Banana', 'Blueberry', 'Cherry'];
  // ❌ WRONG: data is recreated on every render (new array each time)
  // ❌ This breaks useMemo dependency and causes unnecessary recomputation

  const [query, setQuery] = useState('');
  const [count, setCount] = useState(0);

  const filtered = useMemo(() => {
    return data.filter((item) =>
      item.toLowerCase().includes(query.toLowerCase()),
    );
  }, [data]);
  // ❌ WRONG: missing dependency "query"
  // ❌ BUG: typing will not correctly recompute filtered list
  // ❌ ALSO WRONG: depends on "data" which changes every render → memo useless

  const handleSelect = useCallback(
    (item: string) => {
      console.log('selected:', item);
    },
    [query],
  );
  // ❌ WRONG: query is NOT used inside the callback
  // ❌ This causes function to be recreated whenever query changes
  // ❌ That breaks memoization of child component

  const title = useMemo(() => {
    return `Results (${filtered.length})`;
  }, [filtered, count]);
  // ❌ WRONG: unnecessary useMemo (string computation is trivial)
  // ❌ WRONG: count is not used in calculation
  // ❌ Adds complexity without benefit

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
      {/* ❌ MINOR: should prefer functional update: setCount(c => c + 1) */}

      <MemoResults items={[...filtered]} onSelect={handleSelect} />
      {/* ❌ WRONG: [...filtered] creates a NEW array every render */}
      {/* ❌ This breaks React.memo because props are never equal */}
      {/* ❌ Child will re-render even when data is unchanged */}
    </div>
  );
}
```
