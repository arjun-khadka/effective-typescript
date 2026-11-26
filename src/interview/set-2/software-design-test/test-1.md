```ts
class OrderProcessor {
  process(c: string, a: number, t: string): number {
    if (c === null || c === '') {
      throw new Error('bad customer');
    }

    let d = 0;

    if (t === 'GOLD') {
      d = a * 0.1;
    } else if (t === 'SILVER') {
      d = a * 0.05;
    } else if (t === 'BRONZE') {
      d = a * 0.02;
    }

    let total = a - d;

    if (total < 0) {
      total = 0;
    }

    console.log('Customer ' + c + ' paid ' + total);

    return total;
  }
}
```
