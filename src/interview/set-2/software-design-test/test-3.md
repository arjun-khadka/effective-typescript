```ts
type OrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

type PlaceOrderRequest = {
  customerId: string;
  customerEmail: string;
  items: OrderItem[];
  paymentToken: string;
};

class OrderService {
  async placeOrder(request: PlaceOrderRequest): Promise<string> {
    if (!request.customerId) {
      throw new Error('Customer is required');
    }

    if (request.items.length === 0) {
      throw new Error('Order must have items');
    }

    let total = 0;

    for (const item of request.items) {
      total += item.price * item.quantity;
    }

    if (total > 500) {
      total = total - total * 0.1;
    }

    const paymentResponse = await fetch('https://payments.example.com/charge', {
      method: 'POST',
      body: JSON.stringify({
        token: request.paymentToken,
        amount: total,
      }),
    });

    const paymentResult = await paymentResponse.json();

    if (!paymentResult.success) {
      throw new Error('Payment failed');
    }

    const orderId = Math.random().toString();

    await fetch('https://database.example.com/orders', {
      method: 'POST',
      body: JSON.stringify({
        id: orderId,
        customerId: request.customerId,
        total,
        items: request.items,
      }),
    });

    await fetch('https://email.example.com/send', {
      method: 'POST',
      body: JSON.stringify({
        to: request.customerEmail,
        subject: 'Order confirmation',
        body: 'Your order ' + orderId + ' has been placed.',
      }),
    });

    return orderId;
  }
}
```
