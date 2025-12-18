const CART_TTL = 30 * 24 * 60 * 60;

const redisMock = {
  get: jest.fn(),
  set: jest.fn(),
};
jest.mock('../../../../../src/config/redis', () => redisMock);

const couponServiceMock = {
  validateCoupon: jest.fn(),
};
jest.mock('../../../../../src/modules/coupons/couponService', () => couponServiceMock);

const cartService = require('../../../../../src/modules/cart/cartService');

const buildCartKey = (tenantId, userId) => `cart:${tenantId}:${userId}`;

/**
 * Testes focados nos efeitos observáveis da função interna saveCart,
 * exercitando-a indiretamente via removeItem (que sempre chama saveCart).
 */
describe('cartService - saveCart (comportamento de cálculo e persistência)', () => {
  const tenantId = 'tenant-savecart';
  const userId = 'user-savecart';

  beforeEach(() => {
    jest.clearAllMocks();
    redisMock.get.mockResolvedValue(null);
    redisMock.set.mockResolvedValue('OK');
  });

  it('T4.2 - sem couponCode: recalcula subtotal, zera discount e define total = subtotal, persistindo com TTL', async () => {
    const cart = {
      items: [
        { productId: 'p1', price: 10, quantity: 2 }, // 20
        { productId: 'p2', price: 5, quantity: 4 },  // 20
      ],
      couponCode: null,
      subtotal: 0,
      discount: 999,
      total: 999,
    };

    redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));

    const result = await cartService.removeItem(userId, 'does-not-matter', tenantId);

    expect(result.subtotal).toBe(40);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(40);
    expect(couponServiceMock.validateCoupon).not.toHaveBeenCalled();
    expect(redisMock.set).toHaveBeenCalledWith(
      buildCartKey(tenantId, userId),
      expect.any(String),
      { EX: CART_TTL }
    );
  });

  it('T4.3 - com couponCode válido: chama validateCoupon(code, subtotal) e atualiza discount e total', async () => {
    const cart = {
      items: [
        { productId: 'p1', price: 20, quantity: 1 }, // 20
        { productId: 'p2', price: 15, quantity: 1 }, // 15
      ],
      couponCode: 'PROMO10',
      subtotal: 0,
      discount: 0,
      total: 0,
    };
    redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));
    couponServiceMock.validateCoupon.mockResolvedValueOnce({ discountValue: 5 });

    const result = await cartService.removeItem(userId, 'keep-all', tenantId);

    expect(couponServiceMock.validateCoupon).toHaveBeenCalledWith('PROMO10', 35);
    expect(result.subtotal).toBe(35);
    expect(result.discount).toBe(5);
    expect(result.total).toBe(30);
    expect(redisMock.set).toHaveBeenCalledWith(
      buildCartKey(tenantId, userId),
      expect.any(String),
      { EX: CART_TTL }
    );
  });

  it("T4.4 - couponService.validateCoupon rejeita: remove cupom, zera desconto, define message e recalc total", async () => {
    const cart = {
      items: [
        { productId: 'p1', price: 10, quantity: 1 },
        { productId: 'p2', price: 5, quantity: 2 },
      ],
      couponCode: 'INVALID',
      subtotal: 0,
      discount: 50,
      total: 0,
    };
    redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));
    couponServiceMock.validateCoupon.mockRejectedValueOnce(new Error('Cupom inválido'));

    const result = await cartService.removeItem(userId, 'none', tenantId);

    expect(result.subtotal).toBe(20);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(20);
    expect(result.couponCode).toBeNull();
    expect(result.message).toBe('Cupom removido: Cupom inválido');
    expect(redisMock.set).toHaveBeenCalledWith(
      buildCartKey(tenantId, userId),
      expect.any(String),
      { EX: CART_TTL }
    );
  });

  it('T4.5 - garante que total nunca fica negativo (total = max(subtotal - discount, 0))', async () => {
    const cart = {
      items: [{ productId: 'p1', price: 30, quantity: 1 }], // subtotal 30
      couponCode: 'BIG',
      subtotal: 0,
      discount: 0,
      total: 0,
    };
    redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));
    couponServiceMock.validateCoupon.mockResolvedValueOnce({ discountValue: 100 });

    const result = await cartService.removeItem(userId, 'none', tenantId);

    expect(result.subtotal).toBe(30);
    expect(result.discount).toBe(100);
    expect(result.total).toBe(0);
    expect(redisMock.set).toHaveBeenCalledWith(
      buildCartKey(tenantId, userId),
      expect.any(String),
      { EX: CART_TTL }
    );
  });
});
