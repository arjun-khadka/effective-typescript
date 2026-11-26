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

  const [profileRes, ordersRes] = await Promise.all([
    fetch(`https://api.example.com/profiles/${userId}`),
    fetch(`https://api.example.com/orders?userId=${userId}`),
  ]);

  const profile = (await profileRes.json()) as Profile;
  const orders = (await ordersRes.json()) as Order[];

  if (!profile) {
    res.status(404).json({ message: 'Profile not found' });
  }

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);

  res.json({
    userId,
    name: profile.name.trim(),
    orderCount: orders.length,
    totalSpent,
  });
});

app.listen(3000);
```
