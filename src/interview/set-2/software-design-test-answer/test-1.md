```ts
class OrderProcessor {
  process(c: string, a: number, t: string): number {
    // ISSUE:
    // Method name "process" is vague.
    // It does not explain what is processed or what is returned.
    // Better: calculateOrderTotal or calculateDiscountedTotal.

    // ISSUE:
    // Parameter names c, a, and t are unclear.
    // Names should reveal intent.
    // Better: customerName, amount, customerTier.

    if (c === null || c === '') {
      throw new Error('bad customer');
    }

    // ISSUE:
    // Customer validation is incomplete.
    // It does not reject whitespace-only values like "   ".
    // Better: customerName.trim().length > 0.

    let d = 0;

    // ISSUE:
    // Variable name d is unclear.
    // Better: discount or discountAmount.

    if (t === 'GOLD') {
      d = a * 0.1;
    } else if (t === 'SILVER') {
      d = a * 0.05;
    } else if (t === 'BRONZE') {
      d = a * 0.02;
    }

    // ISSUE:
    // Magic strings are used for tiers.
    // Typos or casing differences can silently produce wrong behavior.
    //
    // ISSUE:
    // t is typed as string, so TypeScript allows any value.
    // Better: type CustomerTier = "GOLD" | "SILVER" | "BRONZE".

    let total = a - d;

    if (total < 0) {
      total = 0;
    }

    // ISSUE:
    // Invalid amount is not clearly validated.
    // Negative or invalid amount is silently corrected instead of rejected.

    console.log('Customer ' + c + ' paid ' + total);

    // ISSUE:
    // This method mixes calculation and logging.
    // console.log is a side effect and makes the method harder to test.

    return total;
  }
}
```

<details>
<summary><strong>Expected Findings</strong></summary>

1. Bad names: `c`, `a`, `t`, `d`
2. Magic strings: `"GOLD"`, `"SILVER"`, `"BRONZE"`
3. Weak TypeScript type: `t: string`
4. Mixed calculation and logging
5. Incomplete validation

</details>

<details>
<summary><strong>Bonus</strong></summary>

6. Vague method name `process`
7. Bad error message / generic error
8. Silently correcting invalid amount
9. Class may be unnecessary
10. Discount logic may become harder to maintain

</details>

<details>
<summary><strong>Possible Refactor</strong></summary>

```ts
type CustomerTier = 'GOLD' | 'SILVER' | 'BRONZE';

function calculateDiscountedTotal(
  customerName: string,
  amount: number,
  tier: CustomerTier,
): number {
  if (customerName.trim().length === 0) {
    throw new Error('Customer name is required');
  }

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Amount must be a valid positive number');
  }

  let discountRate = 0;

  if (tier === 'GOLD') {
    discountRate = 0.1;
  } else if (tier === 'SILVER') {
    discountRate = 0.05;
  } else if (tier === 'BRONZE') {
    discountRate = 0.02;
  }

  return amount - amount * discountRate;
}
```

</details>
