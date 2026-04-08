# Domain Rules

## No primitives in domain models

Never use primitive types (`string`, `number`, `boolean`, `Date`) directly as Entity properties or constructor parameters. Always wrap them in a Value Object with validation.

```typescript
// WRONG — primitive leaks into the domain
class Task extends EntityBase<TaskId> {
  constructor(
    id: TaskId,
    readonly title: string,       // primitive
    readonly dueDate: Date,       // primitive
    readonly priority: number,    // primitive
  ) { super(id) }
}

// CORRECT — every field is a VO
class Task extends EntityBase<TaskId> {
  constructor(
    id: TaskId,
    readonly title: TaskTitle,
    readonly dueDate: DueDate,
    readonly priority: Priority,
  ) { super(id) }
}
```

## Every Value Object must validate on creation

Use a `private` constructor and a static `create()` factory that validates before instantiating. Throw `OneJsError` on invalid input.

```typescript
@ValueObject()
export class TaskTitle extends ValueObjectBase<string> {
  static readonly MAX_LENGTH = 100

  private constructor(value: string) {
    super(value)
  }

  static create(value: string): TaskTitle {
    if (!value?.trim()) {
      throw new OneJsError('TaskTitle cannot be empty', 400, 'VALIDATION_ERROR')
    }
    if (value.trim().length > TaskTitle.MAX_LENGTH) {
      throw new OneJsError(
        `TaskTitle cannot exceed ${TaskTitle.MAX_LENGTH} characters`,
        400,
        'VALIDATION_ERROR',
      )
    }
    return new TaskTitle(value.trim())
  }
}
```

## No property accessors

Do NOT use JavaScript `get`/`set` property accessors. Use `getValue()` (inherited from `ValueObjectBase`) or explicit named methods.

```typescript
// WRONG
get title(): string { return this._value }

// CORRECT — use getValue() or a named method
getTitle(): string { return this.title.getValue() }
```

## Entity property visibility

- The **ID is always `private readonly`** — expose it only via `getId()` (inherited from `EntityBase`)
- `public readonly` when the property type is a Value Object (immutable by design)
- `private readonly` when the property type is a primitive or internal implementation detail

```typescript
class Task extends EntityBase<TaskId> {
  constructor(
    id: TaskId,                         // private → access via this.getId()
    readonly title: TaskTitle,          // VO → public readonly
    readonly status: TaskStatus,        // VO → public readonly
  ) { super(id) }

  toDto(): TaskDto {
    return new TaskDto(
      this.getId().getValue(),  // CORRECT — never this.id
      this.title.getValue(),
      this.status.getValue(),
    )
  }
}
```

## Common Value Objects to always create

These types must NEVER appear raw in domain constructors or entity fields:

| Primitive | Create VO instead |
|-----------|-------------------|
| `string` (name, title, description) | `TaskTitle`, `UserName`, `Email`, … |
| `string` (ID) | `TaskId`, `UserId`, … extending `EntityId` |
| `number` (money, quantity) | `Money`, `Quantity`, `Priority`, … |
| `boolean` (status flag) | `TaskStatus`, `UserStatus`, … |
| `Date` | `CreatedAt`, `DueDate`, `UpdatedAt`, … |

## When primitives are acceptable

- Inside the VO itself (`ValueObjectBase<string>`)
- In DTOs (`TaskDto`, request/response objects)
- In infrastructure layer (database models, HTTP payloads)
- In test helper variables before passing to `VO.create()`
