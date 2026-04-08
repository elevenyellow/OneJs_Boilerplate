import { describe, expect, it } from 'bun:test'
import { Entity, ValueObject } from '.././decorators'
import { Entity as EntityBase } from '.././entity'
import { ValueObject as ValueObjectBase } from '.././value-object'

@ValueObject()
class UserId extends ValueObjectBase<string> {
  static create(v: string) { return new UserId(v) }
}

@Entity()
class User extends EntityBase<UserId> {
  constructor(id: UserId, readonly name: string) {
    super(id)
  }
  toDto() { return { id: this.getId().getValue(), name: this.name } }
}

describe('EntityBase', () => {
  describe('equals()', () => {
    it('returns true when ids are the same', () => {
      const id = UserId.create('abc')
      expect(new User(id, 'Alice').equals(new User(id, 'Bob'))).toBe(true)
    })

    it('returns false when ids differ', () => {
      const a = new User(UserId.create('1'), 'Alice')
      const b = new User(UserId.create('2'), 'Alice')
      expect(a.equals(b)).toBe(false)
    })
  })

  describe('toDto()', () => {
    it('returns a plain object', () => {
      const user = new User(UserId.create('1'), 'Alice')
      expect(user.toDto()).toEqual({ id: '1', name: 'Alice' })
    })
  })
})

describe('@Entity()', () => {
  it('throws at definition when class does not extend EntityBase', () => {
    expect(() => {
      @Entity()
      class Bad {}
      return Bad
    }).toThrow('@Entity() — Bad must extend EntityBase')
  })

  it('throws at definition when toDto() is missing', () => {
    expect(() => {
      @Entity()
      class NoDto extends EntityBase<UserId> {
        constructor() { super(UserId.create('1')) }
      }
      return NoDto
    }).toThrow('@Entity() — NoDto must implement toDto()')
  })
})

describe('@ValueObject()', () => {
  it('throws at definition when class does not extend ValueObjectBase', () => {
    expect(() => {
      @ValueObject()
      class Bad {}
      return Bad
    }).toThrow('@ValueObject() — Bad must extend ValueObjectBase')
  })
})
