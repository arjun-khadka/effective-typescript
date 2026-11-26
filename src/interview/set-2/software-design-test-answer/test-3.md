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
    // ISSUE:
    // This method is doing validation, pricing, discounting,
    // payment, persistence, email, and ID generation.
    // Too many responsibilities in one workflow method.

    if (!request.customerId) {
      throw new Error('Customer is required');
    }

    if (request.items.length === 0) {
      throw new Error('Order must have items');
    }

    // ISSUE:
    // Validation is incomplete.
    // No validation for customerEmail, paymentToken, item price,
    // item quantity, negative values, NaN, or malformed input.

    let total = 0;

    for (const item of request.items) {
      total += item.price * item.quantity;
    }

    // ISSUE:
    // Client-provided prices are trusted.
    // In many systems, prices should come from a trusted catalog.

    if (total > 500) {
      total = total - total * 0.1;
    }

    // ISSUE:
    // Discount rule is hardcoded inside the workflow.
    // Better as a pricing/discount policy.

    const paymentResponse = await fetch('https://payments.example.com/charge', {
      method: 'POST',
      body: JSON.stringify({
        token: request.paymentToken,
        amount: total,
      }),
    });

    // ISSUE:
    // Direct fetch to payment provider couples the use case to infrastructure.
    // Better: PaymentGateway abstraction.
    //
    // ISSUE:
    // No timeout/cancellation.
    //
    // ISSUE:
    // No idempotency key. Retry may double-charge.
    //
    // ISSUE:
    // response.ok is not checked.

    const paymentResult = await paymentResponse.json();

    // ISSUE:
    // Upstream JSON is trusted without validation.

    if (!paymentResult.success) {
      throw new Error('Payment failed');
    }

    const orderId = Math.random().toString();

    // ISSUE:
    // Math.random is not safe for order IDs.
    // Use UUID/ULID/database-generated ID.

    await fetch('https://database.example.com/orders', {
      method: 'POST',
      body: JSON.stringify({
        id: orderId,
        customerId: request.customerId,
        total,
        items: request.items,
      }),
    });

    // ISSUE:
    // Persistence is directly implemented as HTTP call.
    // Better: OrderRepository abstraction.
    //
    // ISSUE:
    // Consistency risk:
    // payment succeeded, but saving order may fail.

    await fetch('https://email.example.com/send', {
      method: 'POST',
      body: JSON.stringify({
        to: request.customerEmail,
        subject: 'Order confirmation',
        body: 'Your order ' + orderId + ' has been placed.',
      }),
    });

    // ISSUE:
    // Email is in the critical path.
    // If email fails after payment/order save, what should happen?
    // Usually use async event/outbox for notification.

    return orderId;
  }
}
```

<details>
<summary><strong>Refactor Direction</strong></summary>

1. Keep `OrderService` / `PlaceOrderUseCase` as an orchestrator only. It should coordinate the workflow, but it should not directly know how to call payment APIs, save to database, send email, calculate discounts, or generate IDs. Its job is to express the business flow: validate request, calculate total, charge payment, save order, publish/send confirmation.

2. Move pricing and discount rules into separate domain services. Total calculation and discount logic should not be buried inside the workflow method. Create something like `PricingService` or `DiscountPolicy` so pricing rules can be tested independently and changed without editing the whole order flow.

```ts
interface DiscountPolicy {
  apply(total: number): number;
}
```

3. Do not trust client-provided prices. Instead of using `item.price` from the request, load product prices from a trusted product catalog or pricing service. The request should usually contain `productId` and `quantity`, not authoritative prices.

```ts
type PlaceOrderItem = {
  productId: string;
  quantity: number;
};
```

4. Hide payment details behind a `PaymentGateway`. The order use case should not call `fetch("https://payments...")` directly. It should call an abstraction that handles HTTP status codes, timeouts, response validation, idempotency keys, and provider-specific details.

```ts
interface PaymentGateway {
  charge(command: ChargePaymentCommand): Promise<PaymentResult>;
}
```

5. Hide persistence behind an `OrderRepository`. The use case should not know whether orders are saved through SQL, HTTP, MongoDB, or anything else.

```ts
interface OrderRepository {
  save(order: Order): Promise<void>;
}
```

6. Move ID generation behind an `IdGenerator`. Avoid `Math.random()` for business IDs. Use UUID, ULID, database-generated ID, or a domain-specific order number generator.

```ts
interface IdGenerator {
  newId(): string;
}
```

7. Do not send email directly in the critical path unless the business requires it. Usually, after the order is saved, publish an `OrderPlaced` event or write to an outbox table. A background worker can send the email. This avoids failing the whole order because email is temporarily down.

```ts
interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
```

8. Think carefully about consistency. The original code charges payment first, then saves the order. If saving fails, the customer may be charged without an order record. A better design needs a clear policy: save pending order first, charge with idempotency key, update status after payment, and use compensation/refund if necessary.

A common safer flow is:

```txt
Validate request
Create order with PendingPayment status
Save order
Charge payment with idempotency key
If payment succeeds:
  mark order as Paid / Placed
  publish OrderPlaced event
If payment fails:
  mark order as PaymentFailed
```

9. Use explicit error types or result objects. Invalid input, payment declined, payment provider timeout, persistence failure, and email failure are not the same kind of error. A senior design should separate domain errors from infrastructure failures.

10. Add runtime validation at boundaries. `PlaceOrderRequest` comes from outside. Validate customer ID, email, payment token, product IDs, quantities, and item structure before building a domain order.

---

</details>

<details>
<summary><strong>Possible Refactor</strong></summary>

```ts
type PlaceOrderRequest = {
  customerId: string;
  customerEmail: string;
  items: {
    productId: string;
    quantity: number;
  }[];
  paymentToken: string;
};

type OrderStatus = 'PendingPayment' | 'Paid' | 'PaymentFailed';

type Order = {
  id: string;
  customerId: string;
  customerEmail: string;
  items: OrderLine[];
  total: number;
  status: OrderStatus;
};

type OrderLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

interface ProductCatalog {
  getPrices(productIds: string[]): Promise<Map<string, number>>;
}

interface DiscountPolicy {
  apply(total: number): number;
}

interface PaymentGateway {
  charge(command: {
    orderId: string;
    paymentToken: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ success: boolean; transactionId?: string }>;
}

interface OrderRepository {
  save(order: Order): Promise<void>;
  updateStatus(orderId: string, status: OrderStatus): Promise<void>;
}

interface IdGenerator {
  newId(): string;
}

interface EventPublisher {
  publish(event: { type: 'OrderPlaced'; orderId: string }): Promise<void>;
}

class PlaceOrderUseCase {
  constructor(
    private readonly productCatalog: ProductCatalog,
    private readonly discountPolicy: DiscountPolicy,
    private readonly paymentGateway: PaymentGateway,
    private readonly orderRepository: OrderRepository,
    private readonly idGenerator: IdGenerator,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(request: PlaceOrderRequest): Promise<string> {
    // validate request
    // load trusted prices
    // calculate total
    // apply discount
    // create pending order
    // save order
    // charge payment
    // update order status
    // publish OrderPlaced event
    return '';
  }
}
```

</details>
