import { describe, expect, it } from 'bun:test'
import { Entity as EntityBase } from '.././entity'
import { ValueObject as ValueObjectBase } from '.././value-object'
import { Entity, ValueObject } from '.././decorators'

describe('@ValueObject() decorator', () => {
  it('accepts a class that extends ValueObjectBase', () => {
    expect(() => {
      @ValueObject()
      class Price extends ValueObjectBase<number> {
        constructor(v: number) { super(v) }
      }
      return Price
    }).not.toThrow()
  })

  it('throws when the class does not extend ValueObjectBase', () => {
    expect(() => {
      @ValueObject()
      class NotAVO {
        constructor(public value: number) {}
      }
      return NotAVO
    }).toThrow('@ValueObject()')
  })
})

describe('@Entity() decorator', () => {
  it('accepts a class that extends EntityBase and implements toDto()', () => {
    expect(() => {
      @Entity()
      class Order extends EntityBase<ValueObjectBase<string>> {
        toDto() { return { id: this.getId().getValue() } }
      }
      return Order
    }).not.toThrow()
  })

  it('throws when the class does not extend EntityBase', () => {
    expect(() => {
      @Entity()
      class FakeEntity {
        toDto() { return {} }
      }
      return FakeEntity
    }).toThrow('@Entity()')
  })

  it('throws when the class does not implement toDto()', () => {
    expect(() => {
      @Entity()
      class NoDto extends EntityBase<ValueObjectBase<string>> {}
      return NoDto
    }).toThrow('toDto()')
  })
})
