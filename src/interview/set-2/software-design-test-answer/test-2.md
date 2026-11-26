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
    // ISSUE:
    // Method name "process" is vague.
    // It does not clearly say this is charging/processing payment.

    if (order.amount <= 0) {
      throw new Error('Invalid amount');
    }

    // ISSUE:
    // Only amount is validated.
    // order.id and customerEmail may also matter.

    if (order.paymentMethod === 'credit-card') {
      console.log('Charging credit card');

      // ISSUE:
      // Business service directly calls external API.
      // This couples payment logic to infrastructure and makes testing harder.

      await fetch('https://payments.example.com/credit-card', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.id,
          amount: order.amount,
        }),
      });

      // ISSUE:
      // fetch does not throw on HTTP 400/500.
      // response.ok is not checked.
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

    // ISSUE:
    // If a new payment method is added, this method must be edited.
    // This violates Open/Closed Principle.
    //
    // Better direction:
    // Use separate payment handlers/strategies per payment method.

    // ISSUE:
    // This logs success even if the upstream payment API failed.
    console.log('Payment processed for order ' + order.id);

    // ISSUE:
    // console.log is mixed into business logic.
    // Prefer an injected logger or logging at a boundary.
  }
}
```

<details>
<summary><strong>Expected Findings</strong></summary>

1. `PaymentService.process` has too many responsibilities. It validates the order, chooses the payment method, builds API requests, calls external payment APIs, and logs messages. This violates Single Responsibility Principle. Better direction: separate validation, payment method handling, external API calling, and logging.

2. The payment branching violates Open/Closed Principle. Every new payment method requires editing the same `if / else if` chain. This makes existing code more fragile. Better direction: use a Strategy/handler per payment method so new payment methods can be added without modifying the central service logic.

3. The service directly depends on `fetch`. Calling `fetch` inside the business service couples payment logic to infrastructure details. This makes unit testing harder because tests must mock global network calls. Better direction: depend on an abstraction like `PaymentHandler`, `PaymentGateway`, or an injected HTTP client.

4. External API response handling is missing. `fetch` does not throw for HTTP `400`, `404`, or `500`. Without checking `response.ok`, failed payment responses may still be treated as successful. Payment code must explicitly verify the upstream response.

5. Payment success is assumed too early. The code logs `"Payment processed"` after the fetch call regardless of whether the payment API actually succeeded. This can create misleading logs and false business assumptions. Success should only be logged after the response is verified.

6. There is duplicated request logic across payment branches. Each branch logs, uses `POST`, builds a similar payload, and calls a different URL. Duplication increases maintenance cost and can cause inconsistent behavior when one branch is updated and others are forgotten.

7. `console.log` is mixed into business logic. Logging is a side effect and makes the method harder to test. In production code, logging should usually be handled through an injected logger or at an application boundary.

8. `process` is a vague method name. It does not clearly communicate whether the method validates, charges, records, or completes payment. A clearer name like `processPayment`, `chargeOrder`, or `payForOrder` would better reveal intent.

</details>

<details>
<summary><strong>Bonus</strong></summary>

9. `customerEmail` is unused. This may indicate incomplete behavior, unnecessary data in the type, or missing receipt/notification logic. Unused fields should be questioned during review.

10. Validation is incomplete. The code only validates `amount`. It does not validate `order.id`, `customerEmail`, or whether the payment method is supported at runtime if input comes from an external boundary.

11. The design is hard to unit test. To test behavior, the test must inspect global `fetch` calls and branch-specific URLs. With separate payment handlers, each method could be tested independently.

12. The union type `PaymentMethod` is useful, but it does not solve the design issue. Strong typing limits valid values, but behavior is still centralized in one growing `if / else` method.

13. Payment operations need idempotency thinking. Retrying failed payment requests blindly can double-charge customers. A stronger candidate may mention idempotency keys, retries, timeout behavior, and failure policy.

14. Timeout and resilience are missing. External payment APIs can hang or fail slowly. Real payment code usually needs timeout handling, upstream failure mapping, and clear retry rules.

</details>

<details>
<summary><strong>Possible Refactor</strong></summary>

```ts
type PaymentMethod = 'credit-card' | 'paypal' | 'gift-card';

type Order = {
  id: string;
  customerEmail: string;
  amount: number;
  paymentMethod: PaymentMethod;
};

interface PaymentHandler {
  method: PaymentMethod;
  charge(order: Order): Promise<void>;
}

class PaymentService {
  constructor(private readonly handlers: PaymentHandler[]) {}

  async processPayment(order: Order): Promise<void> {
    if (order.amount <= 0) {
      throw new Error('Invalid amount');
    }

    const handler = this.handlers.find((h) => h.method === order.paymentMethod);

    if (!handler) {
      throw new Error(`Unsupported payment method: ${order.paymentMethod}`);
    }

    await handler.charge(order);
  }
}

class CreditCardPaymentHandler implements PaymentHandler {
  method: PaymentMethod = 'credit-card';

  async charge(order: Order): Promise<void> {
    const response = await fetch('https://payments.example.com/credit-card', {
      method: 'POST',
      body: JSON.stringify({
        orderId: order.id,
        amount: order.amount,
      }),
    });

    if (!response.ok) {
      throw new Error('Credit card payment failed');
    }
  }
}
```

</details>
