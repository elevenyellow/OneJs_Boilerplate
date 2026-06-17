# Feature Walkthrough — From Zero to Production

End-to-end guide to add a new bounded context to the OneJs boilerplate. Uses a real-but-fictional **`Order`** context as the running example: customers create orders, each order has line items, orders can be paid or cancelled.

This walkthrough follows the project's TDD discipline (Reason → Red → Green → Refactor → Re-evaluate) and the no-magic-strings / no-primitives rules. If you skip the conventions, you'll fight the linter and reviewers — read [DDD Principles](conventions/architecture/ddd-principles.md) first.

---

## Step 0 — Plan before code

Before touching files, write the following in your task notes (or an OpenSpec proposal):

1. **Use cases** the context exposes: `placeOrder`, `payOrder`, `cancelOrder`.
2. **Entities** with identity: `Order`.
3. **Value Objects** without identity: `OrderId`, `Money`, `OrderStatus`, `LineItem`.
4. **Domain events** the context emits: `OrderPlacedEvent`, `OrderPaidEvent`, `OrderCancelledEvent`.
5. **Integration events** other contexts care about: `OrderPlacedIntegrationEvent`.
6. **Repository port**: `IOrderRepository.findById/save/findByCustomer`.
7. **External adapters**: payment gateway? email? — only what's needed for v1.

A two-paragraph design beats a half-coded prototype every time.

---

## Step 1 — Create the package skeleton

```bash
mkdir -p packages/order/{domain/{entities,value-objects,repositories,events,constants},application/{dtos},infrastructure/{repositories,controllers}}
mkdir -p packages/order/__tests__/{domain,application,infrastructure,integration,e2e}
```

Add a minimal `package.json`:

```json
// packages/order/package.json
{
  "name": "@order",
  "version": "1.0.0",
  "type": "module",
  "private": true,
  "main": "index.ts"
}
```

Add the workspace path alias to `tsconfig.json`:

```json
"@order": ["./packages/order"],
"@order/*": ["./packages/order/*"]
```

Run `bun install` to wire it into the workspace.

---

## Step 2 — Domain layer

Domain has **zero external dependencies** (no Prisma, no Elysia, no HTTP). It exports:

- Value Objects (validated constructors)
- Entities (immutable, business behavior as methods)
- Repository interfaces (ports)
- Domain events
- Error/log scope constants

### 2.1 — Error & log constants

```typescript
// packages/order/domain/constants/error-types.ts
export const OrderErrorTypes = {
  VALIDATION_FAILED: 'OrderValidationFailed',
  NOT_FOUND: 'OrderNotFound',
  ALREADY_PAID: 'OrderAlreadyPaid',
  ALREADY_CANCELLED: 'OrderAlreadyCancelled',
} as const

export const OrderErrorMessages = {
  MONEY_NEGATIVE: 'Money amount cannot be negative',
  MONEY_INVALID_CURRENCY: 'Invalid currency code',
  ORDER_EMPTY: 'Order must have at least one line item',
  ORDER_NOT_FOUND: 'Order not found',
  ORDER_ALREADY_PAID: 'Order is already paid',
  ORDER_ALREADY_CANCELLED: 'Order is already cancelled',
} as const
```

```typescript
// packages/order/domain/constants/log-scopes.ts
export const OrderLogScopes = {
  SERVICE: 'order:service',
  CONTROLLER: 'order:controller',
  REPOSITORY: 'order:repository',
} as const
```

**Rule**: no inline string literals for error types, error messages, or log scopes. Use these constants everywhere in this context.

### 2.2 — Value Objects

```typescript
// packages/order/domain/value-objects/money.ts
import { ValueObject, ValueObjectBase, OneJsError, ErrorCodes } from '@OneJs/core'
import { OrderErrorTypes, OrderErrorMessages } from '../constants/error-types'

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP'] as const

@ValueObject()
export class Money extends ValueObjectBase<{ amount: number; currency: string }> {
  private constructor(value: { amount: number; currency: string }) { super(value) }

  static create(amount: number, currency: string): Money {
    if (amount < 0)
      throw new OneJsError(OrderErrorTypes.VALIDATION_FAILED, 400, OrderErrorMessages.MONEY_NEGATIVE, { amount }, ErrorCodes.VALIDATION_FAILED)
    if (!VALID_CURRENCIES.includes(currency as any))
      throw new OneJsError(OrderErrorTypes.VALIDATION_FAILED, 400, OrderErrorMessages.MONEY_INVALID_CURRENCY, { currency }, ErrorCodes.VALIDATION_FAILED)
    return new Money({ amount, currency })
  }

  add(other: Money): Money {
    if (other.getValue().currency !== this.getValue().currency)
      throw new OneJsError(OrderErrorTypes.VALIDATION_FAILED, 400, 'Currency mismatch', {}, ErrorCodes.VALIDATION_FAILED)
    return Money.create(this.getValue().amount + other.getValue().amount, this.getValue().currency)
  }
}
```

Mirror the same pattern for `OrderId`, `OrderStatus`, `LineItem`. Each lives in its own file under `domain/value-objects/`.

### 2.3 — Entity

```typescript
// packages/order/domain/entities/order.ts
import { Entity, EntityBase, OneJsError, ErrorCodes } from '@OneJs/core'
import { OrderId } from '../value-objects/order-id'
import { Money } from '../value-objects/money'
import { OrderStatus } from '../value-objects/order-status'
import { LineItem } from '../value-objects/line-item'
import { OrderErrorTypes, OrderErrorMessages } from '../constants/error-types'
import { OrderDto } from '../../application/dtos/order.dto'

@Entity()
export class Order extends EntityBase<OrderId> {
  constructor(
    id: OrderId,
    readonly customerId: string,
    readonly items: readonly LineItem[],
    readonly total: Money,
    readonly status: OrderStatus,
    readonly placedAt: Date,
    readonly paidAt: Date | null,
  ) {
    super(id)
  }

  static place(customerId: string, items: LineItem[]): Order {
    if (items.length === 0)
      throw new OneJsError(OrderErrorTypes.VALIDATION_FAILED, 400, OrderErrorMessages.ORDER_EMPTY, {}, ErrorCodes.VALIDATION_FAILED)
    const total = items.reduce((sum, item) => sum.add(item.subtotal()), Money.create(0, items[0].subtotal().getValue().currency))
    return new Order(OrderId.generateUniqueId(), customerId, items, total, OrderStatus.pending(), new Date(), null)
  }

  pay(): Order {
    if (this.status.isPaid())
      throw new OneJsError(OrderErrorTypes.ALREADY_PAID, 409, OrderErrorMessages.ORDER_ALREADY_PAID, {}, ErrorCodes.VALIDATION_FAILED)
    if (this.status.isCancelled())
      throw new OneJsError(OrderErrorTypes.ALREADY_CANCELLED, 409, OrderErrorMessages.ORDER_ALREADY_CANCELLED, {}, ErrorCodes.VALIDATION_FAILED)
    return new Order(this.getId(), this.customerId, this.items, this.total, OrderStatus.paid(), this.placedAt, new Date())
  }

  toDto(): OrderDto {
    return new OrderDto(
      this.getId().getValue(),
      this.customerId,
      this.items.map((i) => i.toDto()),
      this.total.getValue(),
      this.status.getValue(),
      this.placedAt,
      this.paidAt,
    )
  }
}
```

Key properties:
- `readonly` everywhere — entity is immutable.
- `place()` is the factory; `pay()` returns a new `Order` (no mutation).
- Behavior lives on the entity (`pay()`, `cancel()`), not in a service. Services just orchestrate.
- `toDto()` is the persistence/transport boundary.

### 2.4 — Repository port

```typescript
// packages/order/domain/repositories/order.repository.interface.ts
import type { Order } from '../entities/order'
import type { OrderId } from '../value-objects/order-id'

export interface IOrderRepository {
  findById(id: OrderId): Promise<Order | null>
  findByCustomer(customerId: string): Promise<Order[]>
  save(order: Order): Promise<void>
}
```

VOs as parameters — never primitives.

### 2.5 — Events

```typescript
// packages/order/domain/events/order-placed.event.ts
import { DomainEvent } from '@OneJs/event-bus'
import type { OrderDto } from '../../application/dtos/order.dto'
import type { Order } from '../entities/order'

export class OrderPlacedEvent extends DomainEvent {
  readonly payload: OrderDto

  constructor(order: Order) {
    super()
    this.payload = order.toDto()
  }
}
```

For cross-context events (e.g. `apps/notifications/` reacts to new orders), define them in `packages/shared/events/` instead — those are integration events, versioned contracts.

### 2.6 — Tests for domain (unit, no mocks)

```typescript
// packages/order/__tests__/domain/order.test.ts
import { describe, it, expect } from 'bun:test'
import { Order } from '../../domain/entities/order'
import { LineItem } from '../../domain/value-objects/line-item'
import { Money } from '../../domain/value-objects/money'

describe('Order entity', () => {
  describe('place', () => {
    it('creates a pending order with computed total', () => {
      // Arrange
      const items = [
        LineItem.create('sku-1', 'Widget', 2, Money.create(10, 'USD')),
        LineItem.create('sku-2', 'Gadget', 1, Money.create(5, 'USD')),
      ]

      // Act
      const order = Order.place('cust-123', items)

      // Assert
      expect(order.total.getValue().amount).toBe(25)
      expect(order.status.isPaid()).toBe(false)
      expect(order.items).toHaveLength(2)
    })

    it('throws when items list is empty', () => {
      expect(() => Order.place('cust-123', [])).toThrow(/at least one line item/)
    })
  })

  describe('pay', () => {
    it('marks order as paid and stamps paidAt', () => {
      const order = Order.place('cust-123', [LineItem.create('sku-1', 'Widget', 1, Money.create(10, 'USD'))])
      const paid = order.pay()
      expect(paid.status.isPaid()).toBe(true)
      expect(paid.paidAt).toBeInstanceOf(Date)
    })

    it('refuses to pay an already-paid order', () => {
      const order = Order.place('cust-123', [LineItem.create('sku-1', 'Widget', 1, Money.create(10, 'USD'))]).pay()
      expect(() => order.pay()).toThrow(/already paid/)
    })
  })
})
```

Run with `bun test packages/order/__tests__/domain/`.

---

## Step 3 — Infrastructure: InMemory repository

The InMemory adapter is **the default** — write it before the Prisma one. Tests use it. Local dev uses it.

```typescript
// packages/order/infrastructure/repositories/in-memory-order.repository.ts
import { Injectable } from '@OneJs/core'
import type { IOrderRepository } from '../../domain/repositories/order.repository.interface'
import type { Order } from '../../domain/entities/order'
import type { OrderId } from '../../domain/value-objects/order-id'

@Injectable()
export class InMemoryOrderRepository implements IOrderRepository {
  private readonly store = new Map<string, Order>()

  async findById(id: OrderId): Promise<Order | null> {
    return this.store.get(id.getValue()) ?? null
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return Array.from(this.store.values()).filter((o) => o.customerId === customerId)
  }

  async save(order: Order): Promise<void> {
    this.store.set(order.getId().getValue(), order)
  }
}
```

That's it. No mock library; this _is_ the test double.

---

## Step 4 — Application layer

The service orchestrates: load aggregates, call domain methods, persist, publish events.

```typescript
// packages/order/application/order.service.ts
import { Inject, Injectable, Logger, OneJsError, ErrorCodes } from '@OneJs/core'
import { EventBus } from '@OneJs/event-bus'
import { Order } from '../domain/entities/order'
import { OrderId } from '../domain/value-objects/order-id'
import type { LineItem } from '../domain/value-objects/line-item'
import { OrderPlacedEvent } from '../domain/events/order-placed.event'
import { OrderPaidEvent } from '../domain/events/order-paid.event'
import { OrderPlacedIntegrationEvent } from '@shared/events'
import type { IOrderRepository } from '../domain/repositories/order.repository.interface'
import { InMemoryOrderRepository } from '../infrastructure/repositories/in-memory-order.repository'
import { OrderErrorTypes, OrderErrorMessages } from '../domain/constants/error-types'
import { OrderLogScopes } from '../domain/constants/log-scopes'

@Injectable()
export class OrderService {
  constructor(
    @Inject(InMemoryOrderRepository) private readonly repo: IOrderRepository,
    @Inject(EventBus) private readonly eventBus: EventBus,
    @Inject(Logger) private readonly logger: Logger,
  ) {}

  async placeOrder(customerId: string, items: LineItem[]): Promise<Order> {
    const order = Order.place(customerId, items)
    await this.repo.save(order)
    await this.eventBus.publish(new OrderPlacedEvent(order))
    await this.eventBus.publish(new OrderPlacedIntegrationEvent(order))
    this.logger.info(OrderLogScopes.SERVICE, `Order ${order.getId().getValue()} placed for ${customerId}`)
    return order
  }

  async payOrder(id: OrderId): Promise<Order> {
    const order = await this.repo.findById(id)
    if (!order)
      throw new OneJsError(OrderErrorTypes.NOT_FOUND, 404, OrderErrorMessages.ORDER_NOT_FOUND, { id: id.getValue() }, ErrorCodes.RESOURCE_NOT_FOUND)

    const paid = order.pay()
    await this.repo.save(paid)
    await this.eventBus.publish(new OrderPaidEvent(paid))
    return paid
  }
}
```

Notice: parameters are VOs (`OrderId`, `LineItem[]`), not primitives. The controller's job is to construct them.

### Unit test (no mocks)

```typescript
// packages/order/__tests__/application/order.service.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'
import { InMemoryEventBus, SilentLogger } from '@OneJs/testing'
import { OrderService } from '../../application/order.service'
import { InMemoryOrderRepository } from '../../infrastructure/repositories/in-memory-order.repository'
import { LineItem } from '../../domain/value-objects/line-item'
import { Money } from '../../domain/value-objects/money'
import { OrderPlacedEvent } from '../../domain/events/order-placed.event'
import { OrderPlacedIntegrationEvent } from '@shared/events'

describe('OrderService', () => {
  let service: OrderService
  let bus: InMemoryEventBus

  beforeEach(() => {
    bus = new InMemoryEventBus()
    service = new OrderService(new InMemoryOrderRepository(), bus as any, new SilentLogger())
  })

  describe('placeOrder', () => {
    it('persists the order and publishes both internal and integration events', async () => {
      const items = [LineItem.create('sku-1', 'Widget', 2, Money.create(10, 'USD'))]
      const order = await service.placeOrder('cust-123', items)

      expect(order.getId().getValue()).toBeDefined()
      expect(bus.getEventsByType(OrderPlacedEvent)).toHaveLength(1)
      expect(bus.getEventsByType(OrderPlacedIntegrationEvent)).toHaveLength(1)
    })
  })
})
```

---

## Step 5 — DTO

```typescript
// packages/order/application/dtos/order.dto.ts
export class OrderDto {
  constructor(
    readonly id: string,
    readonly customerId: string,
    readonly items: Array<{ sku: string; name: string; quantity: number; price: { amount: number; currency: string } }>,
    readonly total: { amount: number; currency: string },
    readonly status: string,
    readonly placedAt: Date,
    readonly paidAt: Date | null,
  ) {}
}

// Input DTO for controller
export class PlaceOrderDto {
  constructor(
    readonly customerId: string,
    readonly items: Array<{ sku: string; name: string; quantity: number; amount: number; currency: string }>,
  ) {}
}
```

---

## Step 6 — Controller

```typescript
// packages/order/infrastructure/controllers/order.controller.ts
import { Inject, Injectable, OneJsError, ErrorCodes } from '@OneJs/core'
import { Controller, Get, Post } from '@OneJs/server'
import { UseAuth, Roles } from '@OneJs/auth'
import { AppRoles } from '@shared/auth'
import type { Context } from 'elysia'
import { OrderService } from '../../application/order.service'
import { OrderId } from '../../domain/value-objects/order-id'
import { LineItem } from '../../domain/value-objects/line-item'
import { Money } from '../../domain/value-objects/money'
import { PlaceOrderDto } from '../../application/dtos/order.dto'
import { OrderErrorTypes, OrderErrorMessages } from '../../domain/constants/error-types'

@Injectable()
@Controller('/orders')
export class OrderController {
  constructor(@Inject(OrderService) private readonly orders: OrderService) {}

  @Get('/:id')
  @UseAuth()
  async get(ctx: Context) {
    const id = OrderId.fromString(ctx.params.id)
    const order = await this.orders.findById(id)
    if (!order)
      throw new OneJsError(OrderErrorTypes.NOT_FOUND, 404, OrderErrorMessages.ORDER_NOT_FOUND, {}, ErrorCodes.RESOURCE_NOT_FOUND)
    return order.toDto()
  }

  @Post('/')
  @UseAuth()
  async place(ctx: Context) {
    const body = ctx.body as Partial<PlaceOrderDto>
    if (!body?.customerId || !Array.isArray(body.items) || body.items.length === 0)
      throw new OneJsError(OrderErrorTypes.VALIDATION_FAILED, 400, 'customerId and items required', {}, ErrorCodes.VALIDATION_FAILED)

    const items = body.items.map((i) => LineItem.create(i.sku, i.name, i.quantity, Money.create(i.amount, i.currency)))
    const order = await this.orders.placeOrder(body.customerId, items)

    ctx.set.status = 201
    return order.toDto()
  }

  @Post('/:id/pay')
  @UseAuth()
  @Roles(AppRoles.ADMIN)
  async pay(ctx: Context) {
    const order = await this.orders.payOrder(OrderId.fromString(ctx.params.id))
    return order.toDto()
  }
}
```

Controller responsibilities:
1. **Construct VOs at the boundary** — never pass `ctx.params.id` straight to a service.
2. **Validate input shape** — throw `OneJsError` early.
3. **Map DTO → domain → service**.
4. **Set status codes** via `ctx.set.status`.

---

## Step 7 — Event handler (optional, cross-context)

If `apps/notifications/` should send an email when an order is placed:

```typescript
// apps/notifications/handlers/order-placed.handler.ts
import { Inject, Injectable } from '@OneJs/core'
import { EventHandler } from '@OneJs/event-bus'
import { OrderPlacedIntegrationEvent } from '@shared/events'
import { NotificationService } from '../application/notification.service'

@Injectable()
export class OrderPlacedHandler {
  constructor(@Inject(NotificationService) private readonly notifs: NotificationService) {}

  @EventHandler(OrderPlacedIntegrationEvent)
  async handle(event: OrderPlacedIntegrationEvent): Promise<void> {
    await this.notifs.notifyOrderPlaced(event.payload)
  }
}
```

Test it with `InMemoryEventBus` from `@OneJs/testing`. See [Testing package — handler example](testing-package.md).

---

## Step 8 — Wire it up

The auto-loader picks up your new files automatically — if `apps/api/index.ts` already uses `AutoLoaderPlugin({ rootDir: import.meta.dir })` and the new package is reachable from there.

For the order context to be available in the API app, ensure it's imported by one of the auto-loaded files (typically the controller is loaded via a side-effect import in the app entry file):

```typescript
// apps/api/index.ts — already exists, no change needed
import { OneJs } from '@OneJs/core'
import { AutoLoaderPlugin } from '@OneJs/core/bootstrap'
import { ServerPlugin, Server } from '@OneJs/server'

const container = await new OneJs()
  .use(new AutoLoaderPlugin({ rootDir: import.meta.dir }))
  // ...
  .start()
```

If your package isn't picked up, add an explicit side-effect import:

```typescript
import '@order/infrastructure/controllers/order.controller'
```

---

## Step 9 — End-to-end test

```typescript
// packages/order/__tests__/e2e/order-api.e2e.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { Elysia } from 'elysia'
// ... bootstrap a minimal kernel + controller, see packages/task/__tests__/e2e for the template

describe('Order API e2e', () => {
  it('POST /orders creates an order and returns 201', async () => {
    const res = await app.handle(new Request('http://localhost/orders', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer <test-token>' },
      body: JSON.stringify({ customerId: 'cust-1', items: [{ sku: 'sku-1', name: 'X', quantity: 1, amount: 10, currency: 'USD' }] }),
    }))
    expect(res.status).toBe(201)
    const body = await res.json() as any
    expect(body.total.amount).toBe(10)
  })
})
```

Use `packages/task/__tests__/e2e/` as a template.

---

## Step 10 — Validate before commit

Mandatory pre-commit trio:

```bash
bun run lint:fix     # auto-fix Biome issues
bun run typecheck    # tsc --noEmit
bun test             # all tests must pass
```

If any of these fail, fix the cause — never `--no-verify`. See [Pre-Commit Workflow](conventions/pre-commit-workflow.md).

---

## Recap — file map you just produced

```
packages/order/
├── domain/
│   ├── constants/
│   │   ├── error-types.ts
│   │   └── log-scopes.ts
│   ├── value-objects/
│   │   ├── order-id.ts
│   │   ├── money.ts
│   │   ├── order-status.ts
│   │   └── line-item.ts
│   ├── entities/
│   │   └── order.ts
│   ├── repositories/
│   │   └── order.repository.interface.ts
│   └── events/
│       ├── order-placed.event.ts
│       ├── order-paid.event.ts
│       └── order-cancelled.event.ts
├── application/
│   ├── order.service.ts
│   └── dtos/
│       └── order.dto.ts
├── infrastructure/
│   ├── repositories/
│   │   └── in-memory-order.repository.ts
│   └── controllers/
│       └── order.controller.ts
└── __tests__/
    ├── domain/order.test.ts
    ├── application/order.service.test.ts
    └── e2e/order-api.e2e.test.ts

packages/shared/events/order-placed-integration.event.ts    (if cross-context)
apps/notifications/handlers/order-placed.handler.ts          (if cross-context)
```

---

## Common mistakes to avoid

| Mistake | Fix |
|---------|-----|
| Inline string literal as error type | Define in `domain/constants/error-types.ts` |
| `service.placeOrder(req.body.customerId, req.body.items)` | Build VOs in controller; service takes VOs |
| `new Order(...)` outside the entity itself | Use the `place()` factory |
| Mutating entity fields | All transitions return a new instance via `with*()` |
| `mock(IOrderRepository)` in unit test | Use `InMemoryOrderRepository` directly |
| Catching exception inside handler and silently logging | Let it propagate or route to dead-letter |
| Empty handler constructor when dependencies needed | Inject the service — see the notification handler bugfix |
| Importing `bcrypt` / `jsonwebtoken` in domain layer | Domain has zero external deps; move to infrastructure |

---

## See also

- [Architecture](architecture.md) — layer rules
- [Core Features](core-features.md) — DI, bootstrap details
- [DDD Principles](conventions/architecture/ddd-principles.md) — the rules in full
- [Complete Example: User Management](conventions/examples/user-management/complete-implementation.md) — real, longer worked example
- [Testing](conventions/patterns/testing.md) — unit/integration/e2e boundaries
