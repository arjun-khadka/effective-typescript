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

const MemoUserTable = memo(UserTable);

export default function UsersPage() {
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

  const handleSelectUser = useCallback(
    (user: User) => {
      setCounter(counter + 1);
      console.log('selected', user.name);
    },
    [counter],
  );

  const title = useMemo(() => {
    return `Users (${filteredUsers.length})`;
  }, [filteredUsers, counter]);

  return (
    <div>
      <h2>{title}</h2>

      <select value={role} onChange={(e) => setRole(e.target.value as any)}>
        <option value='all'>All</option>
        <option value='admin'>Admins</option>
        <option value='user'>Users</option>
      </select>

      <MemoUserTable
        users={[...filteredUsers]}
        onSelectUser={handleSelectUser}
      />
    </div>
  );
}
```
