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

function isProfile(value: unknown): value is Profile {
  if (typeof value !== 'object' || value === null) return false;

  const v = value as Record<string, unknown>;
  return typeof v.id === 'string' && typeof v.name === 'string';
}

function isOrderArray(value: unknown): value is Order[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).total === 'number',
    )
  );
}

app.get('/dashboard/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId?.trim();

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const profileUrl = new URL(
      `https://api.example.com/profiles/${encodeURIComponent(userId)}`,
    );
    const ordersUrl = new URL('https://api.example.com/orders');
    ordersUrl.searchParams.set('userId', userId);

    const [profileRes, ordersRes] = await Promise.all([
      fetch(profileUrl, { signal: controller.signal }),
      fetch(ordersUrl, { signal: controller.signal }),
    ]);

    if (profileRes.status === 404) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    if (!profileRes.ok || !ordersRes.ok) {
      return res.status(502).json({ message: 'Upstream service error' });
    }

    const profileJson: unknown = await profileRes.json();
    const ordersJson: unknown = await ordersRes.json();

    if (!isProfile(profileJson) || !isOrderArray(ordersJson)) {
      return res.status(502).json({ message: 'Invalid upstream response' });
    }

    const totalSpent = ordersJson.reduce((sum, order) => sum + order.total, 0);

    return res.status(200).json({
      userId,
      name: profileJson.name.trim(),
      orderCount: ordersJson.length,
      totalSpent,
    });
  } catch (error) {
    const isAbort = error instanceof Error && error.name === 'AbortError';

    return res.status(isAbort ? 504 : 500).json({
      message: isAbort ? 'Upstream timeout' : 'Internal server error',
    });
  } finally {
    clearTimeout(timeout);
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```
