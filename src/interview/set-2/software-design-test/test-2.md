```ts
type PaymentMethod = 'credit-card' | 'paypal' | 'gift-card';

type Order = {
  id: string;
  customerEmail: string;
  amount: number;
  paymentMethod: PaymentMethod;
};

class PaymentService {
  async process(order: Order): Promise<void> {
    if (order.amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (order.paymentMethod === 'credit-card') {
      console.log('Charging credit card');
      await fetch('https://payments.example.com/credit-card', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          amount: order.amount,
        }),
      });
    } else if (order.paymentMethod === 'paypal') {
      console.log('Charging PayPal');
      await fetch('https://payments.example.com/paypal', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          amount: order.amount,
        }),
      });
    } else if (order.paymentMethod === 'gift-card') {
      console.log('Charging gift card');
      await fetch('https://payments.example.com/gift-card', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          amount: order.amount,
        }),
      });
    }

    console.log('Payment processed for order ' + order.id);
  }
}
```
