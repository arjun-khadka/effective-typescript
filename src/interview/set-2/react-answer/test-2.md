```tsx
import React, { memo, useCallback, useMemo, useState } from 'react';

type User = {
  id: string;
  name: string;
  role: 'admin' | 'user';
};

type UserTableProps = {
  users: User[];
  onSelectUser: (user: User) => void;
};

function UserTable({ users, onSelectUser }: UserTableProps) {
  console.log('UserTable render');

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id} onClick={() => onSelectUser(user)}>
          {user.name} - {user.role}
        </li>
      ))}
    </ul>
  );
}

// NOTE:
// React.memo only helps when props keep stable references.
const MemoUserTable = memo(UserTable);

export default function UsersPage() {
  // ISSUE:
  // users is recreated on every render.
  //
  // Better:
  // Move outside component if static.
  const users = [
    { id: '1', name: 'Alice', role: 'admin' as const },
    { id: '2', name: 'Bob', role: 'user' as const },
    { id: '3', name: 'Charlie', role: 'user' as const },
  ];

  const [role, setRole] = useState<'all' | 'admin' | 'user'>('all');
  const [counter, setCounter] = useState(0);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => role === 'all' || user.role === role);
  }, [role]);

  // ISSUE:
  // users is used inside useMemo but missing from dependencies.
  //
  // TECHNICALLY:
  // [users, role]
  //
  // BIGGER ISSUE:
  // users is recreated every render anyway.
  // The memoization strategy is weak.

  const handleSelectUser = useCallback(
    (user: User) => {
      setCounter(counter + 1);
      console.log('selected', user.name);
    },
    [counter],
  );

  // ISSUE:
  // Callback depends on counter because it uses:
  //
  //   setCounter(counter + 1)
  //
  // Every counter update creates a new function.
  //
  // Since this callback is passed to MemoUserTable,
  // React.memo becomes less effective.
  //
  // Better:
  //
  // setCounter((c) => c + 1)
  //
  // Then:
  //
  // const handleSelectUser = useCallback(..., [])

  const title = useMemo(() => {
    return `Users (${filteredUsers.length})`;
  }, [filteredUsers, counter]);

  // ISSUE:
  // Tiny string calculation.
  // useMemo is unnecessary.
  //
  // ISSUE:
  // counter is not even used in the title.

  return (
    <div>
      <h2>{title}</h2>

      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        {/* ISSUE:
            as any removes type safety.
            Minor TypeScript smell. */}

        <option value='all'>All</option>
        <option value='admin'>Admins</option>
        <option value='user'>Users</option>
      </select>

      <MemoUserTable
        users={[...filteredUsers]}
        // ISSUE:
        // New array every render.
        //
        // React.memo compares references.
        //
        // [...filteredUsers]
        //
        // always creates a new reference,
        // defeating memoization.

        onSelectUser={handleSelectUser}
        // ISSUE:
        // Callback reference changes whenever
        // counter changes.
      />
    </div>
  );
}
```

<details>
<summary><strong>Expected Findings</strong></summary>

1. `users` is recreated every render. Since the array is declared inside `UsersPage`, every render creates a new array reference even if the content is the same. This weakens memoization and can cause unnecessary recalculations or child renders. If the data is static, move it outside the component. If the list changes through add/edit/delete/fetch, then store it in state.

2. `users` is missing from the `useMemo` dependency array. `filteredUsers` uses both `users` and `role`, so technically both should be dependencies. However, adding `users` exposes the bigger issue: `users` is recreated every render, so the memo would still recompute every render. Better fix is to stabilize `users` or remove unnecessary memoization.

3. `[...filteredUsers]` breaks `React.memo`. Spreading creates a new array every render. `React.memo` compares props by reference, not deep equality, so `MemoUserTable` receives a new `users` prop and re-renders even when the actual list did not change. Pass `filteredUsers` directly.

4. `handleSelectUser` changes whenever `counter` changes. The callback uses `setCounter(counter + 1)`, so it depends on `counter`. Every counter update creates a new function reference, which is passed to `MemoUserTable` and can cause re-render. Use functional update: `setCounter((c) => c + 1)` so the callback can stay stable.

5. `title` does not need `useMemo`. `Users (${filteredUsers.length})` is a tiny string calculation. Memoizing it adds complexity without real benefit. It can be rendered inline.

</details>

<details>
<summary><strong>Bonus</strong></summary>

6. `counter` is an unnecessary dependency for `title`. The title does not use `counter`, so it should not be in the dependency array if `useMemo` is kept.

7. `as any` removes type safety. `e.target.value` is a string, but `role` expects `"all" | "admin" | "user"`. Better to use a named `RoleFilter` type and avoid `any`.

8. `React.memo` may be unnecessary for such a small list. A strong candidate may say the code is over-optimized and should be simplified unless profiling shows a real performance problem.

</details>
