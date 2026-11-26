```tsx
import express, { Request, Response } from 'express';

const app = express();

type Profile = {
  id: string;
  name: string;
};

type Order = {
  id: string;
  total: number;
};

app.get('/dashboard/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  // ⚠️ No validation:
  // - could be empty
  // - could contain unsafe characters
  // - directly used in URL

  const [profileRes, ordersRes] = await Promise.all([
    fetch(`https://api.example.com/profiles/${userId}`),
    fetch(`https://api.example.com/orders?userId=${userId}`),
  ]);
  // ❌ No try/catch:
  // - network error → unhandled rejection
  // - timeout → request hangs or crashes

  // ❌ Promise.all fail-fast:
  // - if ONE request fails → entire route fails
  // - no option for partial response (maybe acceptable, but not considered)

  const profile = (await profileRes.json()) as Profile;
  const orders = (await ordersRes.json()) as Order[];
  // ❌ Dangerous TypeScript cast:
  // - upstream JSON is untrusted
  // - `as Profile` does NOT validate shape
  // - could be `{ error: ... }` or invalid data
  // - gives false confidence

  if (!profile) {
    res.status(404).json({ message: 'Profile not found' });
  }
  // ❌ Missing return:
  // - code continues after sending response
  // - may send multiple responses → runtime error

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  // ❌ Assumes orders is valid array:
  // - if upstream returns wrong shape → crash
  // - if total is not number → NaN

  res.json({
    userId,
    name: profile.name.trim(),
    // ❌ Assumes profile.name is string:
    // - if null/undefined → crash

    orderCount: orders.length,
    totalSpent,
  });
  // ❌ No status code clarity:
  // - always 200 even if upstream partially failed
});
```
