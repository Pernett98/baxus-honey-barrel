export class Money {
  private readonly amount: number
  private readonly currency: string = "USD"

  constructor(amount: number, currency: string = "USD") {
    if (isNaN(amount)) {
      throw new Error("Invalid amount provided")
    }
    this.amount = amount
    this.currency = currency
  }

  static fromString(value: string): Money {
    // Remove currency symbols and commas
    const cleanValue = value.replace(/[^0-9.-]/g, "")
    const amount = parseFloat(cleanValue)
    if (isNaN(amount)) {
      throw new Error("Invalid money string provided")
    }
    return new Money(amount)
  }

  format(): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: this.currency
    }).format(this.amount)
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot add money with different currencies")
    }
    return new Money(this.amount + other.amount, this.currency)
  }

  subtract(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error("Cannot subtract money with different currencies")
    }
    return new Money(this.amount - other.amount, this.currency)
  }

  multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency)
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error("Cannot divide by zero")
    }
    return new Money(this.amount / divisor, this.currency)
  }

  calculatePercentage(other: Money): number {
    if (this.amount === 0) {
      return 0
    }
    return ((other.amount - this.amount) / this.amount) * 100
  }

  isGreaterThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error("Cannot compare money with different currencies")
    }
    return this.amount > other.amount
  }

  isLessThan(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error("Cannot compare money with different currencies")
    }
    return this.amount < other.amount
  }

  equals(other: Money): boolean {
    if (this.currency !== other.currency) {
      throw new Error("Cannot compare money with different currencies")
    }
    return this.amount === other.amount
  }

  getAmount(): number {
    return this.amount
  }

  getCurrency(): string {
    return this.currency
  }

  toString(): string {
    return this.format()
  }
}
