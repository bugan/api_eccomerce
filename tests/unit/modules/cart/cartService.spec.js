const CART_TTL = 30 * 24 * 60 * 60;

const redisMock = {
  get: jest.fn(),
  set: jest.fn()
};
jest.mock('../../../../../src/config/redis', () => redisMock);

const prismaMock = {
  product: {
    findUnique: jest.fn()
  }
};
jest.mock('../../../../../src/config/database', () => prismaMock);

const couponServiceMock = {
  validateCoupon: jest.fn()
};
jest.mock('../../../../../src/modules/coupons/couponService', () => couponServiceMock);

const cartService = require('../../../../../src/modules/cart/cartService');
const AppError = require('../../../../../src/utils/AppError');

const buildCartKey = (tenantId, userId) => `cart:${tenantId}:${userId}`;

describe('cartService', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  beforeEach(() => {
    redisMock.get.mockReset();
    redisMock.set.mockReset();
    prismaMock.product.findUnique.mockReset();
    couponServiceMock.validateCoupon.mockReset();

    redisMock.get.mockResolvedValue(null);
    redisMock.set.mockResolvedValue('OK');
  });

  describe('getCart', () => {
    it('T4.1 - getCart com chave inexistente no Redis deve retornar objeto padrão', async () => {
      // Arrange
      redisMock.get.mockResolvedValueOnce(null);

      // Act
      const cart = await cartService.getCart(userId, tenantId);

      // Assert
      expect(redisMock.get).toHaveBeenCalledWith(buildCartKey(tenantId, userId));
      expect(cart).toEqual({
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        couponCode: null
      });
    });
  });

  describe('addItem', () => {
    it('T4.6 - addItem quando product não existe deve lançar AppError 404 RESOURCE_NOT_FOUND', async () => {
      // Arrange
      prismaMock.product.findUnique.mockResolvedValueOnce(null);

      // Act
      const promise = cartService.addItem(userId, { productId: 'missing', quantity: 1 }, tenantId);

      // Assert
      await expect(promise).rejects.toBeInstanceOf(AppError);
      await expect(promise).rejects.toMatchObject({
        message: 'Produto não encontrado',
        statusCode: 404,
        code: 'RESOURCE_NOT_FOUND'
      });
      expect(redisMock.set).not.toHaveBeenCalled();
    });

    it('T4.7 - addItem quando stock < quantity inicial deve lançar AppError 409 OUT_OF_STOCK', async () => {
      // Arrange
      const product = { id: 'prod-1', name: 'Produto', price: 50, stock: 1 };
      prismaMock.product.findUnique.mockResolvedValueOnce(product);

      // Act
      const promise = cartService.addItem(userId, { productId: 'prod-1', quantity: 2 }, tenantId);

      // Assert
      await expect(promise).rejects.toMatchObject({
        message: 'Estoque insuficiente',
        statusCode: 409,
        code: 'OUT_OF_STOCK'
      });
      expect(redisMock.set).not.toHaveBeenCalled();
    });

    it('T4.8.1 - addItem quando item já existe no carrinho incrementa quantity e respeita estoque', async () => {
      // Arrange
      const product = { id: 'prod-1', name: 'Produto', price: 10, stock: 5 };
      prismaMock.product.findUnique.mockResolvedValueOnce(product);
      const storedCart = {
        items: [{ productId: 'prod-1', name: 'Produto', price: 10, quantity: 1 }],
        subtotal: 10,
        discount: 0,
        total: 10,
        couponCode: null
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(storedCart));

      // Act
      const cart = await cartService.addItem(userId, { productId: 'prod-1', quantity: 2 }, tenantId);

      // Assert
      expect(cart.items[0].quantity).toBe(3);
      expect(cart.subtotal).toBe(30);
      expect(cart.discount).toBe(0);
      expect(cart.total).toBe(30);
      expect(redisMock.set).toHaveBeenCalledWith(buildCartKey(tenantId, userId), expect.any(String), { EX: CART_TTL });
      const savedCart = JSON.parse(redisMock.set.mock.calls[0][1]);
      expect(savedCart.items[0].quantity).toBe(3);
    });

    it('T4.8.2 - addItem quando nova quantity excede stock deve lançar AppError 409', async () => {
      // Arrange
      const product = { id: 'prod-1', name: 'Produto', price: 10, stock: 5 };
      prismaMock.product.findUnique.mockResolvedValueOnce(product);
      const storedCart = {
        items: [{ productId: 'prod-1', name: 'Produto', price: 10, quantity: 4 }],
        subtotal: 40,
        discount: 0,
        total: 40,
        couponCode: null
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(storedCart));

      // Act
      const promise = cartService.addItem(userId, { productId: 'prod-1', quantity: 2 }, tenantId);

      // Assert
      await expect(promise).rejects.toMatchObject({
        message: 'Estoque insuficiente para a quantidade total',
        statusCode: 409,
        code: 'OUT_OF_STOCK'
      });
      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });

  describe('removeItem', () => {
    it('T4.9 - removeItem removendo item existente recalcule subtotal/total e persiste', async () => {
      // Arrange
      const storedCart = {
        items: [
          { productId: 'prod-1', price: 30, quantity: 1 },
          { productId: 'prod-2', price: 20, quantity: 2 }
        ],
        couponCode: null,
        subtotal: 0,
        discount: 0,
        total: 0
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(storedCart));

      // Act
      const cart = await cartService.removeItem(userId, 'prod-2', tenantId);

      // Assert
      expect(cart.items).toEqual([{ productId: 'prod-1', price: 30, quantity: 1 }]);
      expect(cart.subtotal).toBe(30);
      expect(cart.discount).toBe(0);
      expect(cart.total).toBe(30);
      expect(redisMock.set).toHaveBeenCalledWith(buildCartKey(tenantId, userId), expect.any(String), { EX: CART_TTL });
      expect(couponServiceMock.validateCoupon).not.toHaveBeenCalled();
    });

    it('T4.10 - removeItem com productId inexistente mantém items mas ainda assim chama saveCart', async () => {
      // Arrange
      const storedCart = {
        items: [
          { productId: 'prod-1', price: 30, quantity: 1 },
          { productId: 'prod-2', price: 15, quantity: 3 }
        ],
        couponCode: null,
        subtotal: 0,
        discount: 0,
        total: 0
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(storedCart));

      // Act
      const cart = await cartService.removeItem(userId, 'unknown', tenantId);

      // Assert
      expect(cart.items).toEqual(storedCart.items);
      expect(cart.subtotal).toBe(75);
      expect(cart.total).toBe(75);
      expect(redisMock.set).toHaveBeenCalledWith(buildCartKey(tenantId, userId), expect.any(String), { EX: CART_TTL });
    });
  });

  describe('applyCoupon', () => {
    it('T4.11 - applyCoupon com carrinho vazio deve lançar AppError 400 INVALID_PAYLOAD', async () => {
      // Arrange
      const storedCart = {
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        couponCode: null
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(storedCart));

      // Act
      const promise = cartService.applyCoupon(userId, 'PROMO', tenantId);

      // Assert
      await expect(promise).rejects.toMatchObject({
        message: 'Carrinho vazio',
        statusCode: 400,
        code: 'INVALID_PAYLOAD'
      });
      expect(couponServiceMock.validateCoupon).not.toHaveBeenCalled();
      expect(redisMock.set).not.toHaveBeenCalled();
    });

    it('T4.12 - applyCoupon com itens no carrinho calcula subtotal, chama validateCoupon e persiste', async () => {
      // Arrange
      const storedCart = {
        items: [
          { productId: 'prod-1', price: 50, quantity: 1 },
          { productId: 'prod-2', price: 25, quantity: 2 }
        ],
        couponCode: null,
        subtotal: 0,
        discount: 0,
        total: 0
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(storedCart));
      couponServiceMock.validateCoupon.mockResolvedValueOnce({ discountValue: 15 });

      // Act
      const cart = await cartService.applyCoupon(userId, 'PROMO15', tenantId);

      // Assert
      expect(couponServiceMock.validateCoupon).toHaveBeenCalledWith('PROMO15', 100);
      expect(cart.couponCode).toBe('PROMO15');
      expect(cart.discount).toBe(15);
      expect(cart.subtotal).toBe(100);
      expect(cart.total).toBe(85);
      expect(redisMock.set).toHaveBeenCalledWith(buildCartKey(tenantId, userId), expect.any(String), { EX: CART_TTL });
      const savedCart = JSON.parse(redisMock.set.mock.calls[0][1]);
      expect(savedCart).toEqual(cart);
    });
  });

  describe('removeCoupon', () => {
    it('T4.13 - removeCoupon limpa couponCode, zera desconto e recalcula total', async () => {
      // Arrange
      const storedCart = {
        items: [
          { productId: 'prod-1', price: 30, quantity: 1 },
          { productId: 'prod-2', price: 20, quantity: 2 }
        ],
        couponCode: 'PROMO',
        subtotal: 70,
        discount: 10,
        total: 60
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(storedCart));
      couponServiceMock.validateCoupon.mockResolvedValueOnce({ discountValue: 10 });

      // Act
      const cart = await cartService.removeCoupon(userId, tenantId);

      // Assert
      expect(cart.couponCode).toBeNull();
      expect(cart.discount).toBe(0);
      expect(cart.subtotal).toBe(70);
      expect(cart.total).toBe(70);
      expect(couponServiceMock.validateCoupon).not.toHaveBeenCalled();
      expect(redisMock.set).toHaveBeenCalledWith(buildCartKey(tenantId, userId), expect.any(String), { EX: CART_TTL });
    });
  });

  describe('saveCart (via efeitos observáveis)', () => {
    it('T4.2 - saveCart sem couponCode recalcula subtotal/total e chama Redis.set com TTL', async () => {
      // Arrange
      const key = buildCartKey(tenantId, userId);
      const cart = {
        items: [
          { productId: 'prod-1', price: 40, quantity: 1 },
          { productId: 'prod-2', price: 10, quantity: 2 }
        ],
        couponCode: null,
        subtotal: 0,
        discount: 0,
        total: 0
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));

      // Act
      const result = await cartService.removeItem(userId, 'prod-x', tenantId);

      // Assert
      expect(result.subtotal).toBe(60);
      expect(result.discount).toBe(0);
      expect(result.total).toBe(60);
      expect(redisMock.set).toHaveBeenCalledWith(key, expect.any(String), { EX: CART_TTL });
    });

    it('T4.3 - saveCart com couponCode válido atualiza discount e total', async () => {
      // Arrange
      const key = buildCartKey(tenantId, userId);
      const cart = {
        items: [
          { productId: 'prod-1', price: 20, quantity: 1 },
          { productId: 'prod-2', price: 15, quantity: 1 }
        ],
        couponCode: 'PROMO',
        subtotal: 0,
        discount: 0,
        total: 0
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));
      couponServiceMock.validateCoupon.mockResolvedValueOnce({ discountValue: 5 });

      // Act
      const result = await cartService.removeItem(userId, 'none', tenantId);

      // Assert
      expect(couponServiceMock.validateCoupon).toHaveBeenCalledWith('PROMO', 35);
      expect(result.subtotal).toBe(35);
      expect(result.discount).toBe(5);
      expect(result.total).toBe(30);
      expect(redisMock.set).toHaveBeenCalledWith(key, expect.any(String), { EX: CART_TTL });
    });

    it('T4.4 - saveCart com couponCode inválido remove cupom, zera desconto e adiciona mensagem', async () => {
      // Arrange
      const key = buildCartKey(tenantId, userId);
      const cart = {
        items: [
          { productId: 'prod-1', price: 20, quantity: 1 },
          { productId: 'prod-2', price: 15, quantity: 1 }
        ],
        couponCode: 'PROMO',
        subtotal: 0,
        discount: 0,
        total: 0
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));
      couponServiceMock.validateCoupon.mockRejectedValueOnce(new Error('Cupom inválido'));

      // Act
      const result = await cartService.removeItem(userId, 'none', tenantId);

      // Assert
      expect(result.couponCode).toBeNull();
      expect(result.discount).toBe(0);
      expect(result.message).toBe('Cupom removido: Cupom inválido');
      expect(result.subtotal).toBe(35);
      expect(result.total).toBe(35);
      expect(redisMock.set).toHaveBeenCalledWith(key, expect.any(String), { EX: CART_TTL });
    });

    it('T4.5 - saveCart garante que total nunca fica negativo', async () => {
      // Arrange
      const key = buildCartKey(tenantId, userId);
      const cart = {
        items: [{ productId: 'prod-1', price: 30, quantity: 1 }],
        couponCode: 'PROMO',
        subtotal: 0,
        discount: 0,
        total: 0
      };
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cart));
      couponServiceMock.validateCoupon.mockResolvedValueOnce({ discountValue: 100 });

      // Act
      const result = await cartService.removeItem(userId, 'unknown', tenantId);

      // Assert
      expect(result.subtotal).toBe(30);
      expect(result.discount).toBe(100);
      expect(result.total).toBe(0);
      expect(redisMock.set).toHaveBeenCalledWith(key, expect.any(String), { EX: CART_TTL });
    });
  });
});
