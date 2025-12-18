const couponRepository = require('../../../../src/modules/coupons/couponRepository');

jest.mock('../../../../src/config/database', () => ({
  coupon: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const prisma = require('../../../../src/config/database');

describe('couponRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should call prisma.coupon.create with correct data', async () => {
      const data = { code: 'DISCOUNT10', value: 10 };
      const createdCoupon = { id: 1, ...data };
      prisma.coupon.create.mockResolvedValue(createdCoupon);

      const result = await couponRepository.create(data);

      expect(prisma.coupon.create).toHaveBeenCalledTimes(1);
      expect(prisma.coupon.create).toHaveBeenCalledWith({ data });
      expect(result).toBe(createdCoupon);
    });
  });

  describe('findByCode', () => {
    it('should call prisma.coupon.findUnique with correct where filter', async () => {
      const code = 'DISCOUNT10';
      const coupon = { id: 1, code };
      prisma.coupon.findUnique.mockResolvedValue(coupon);

      const result = await couponRepository.findByCode(code);

      expect(prisma.coupon.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({ where: { code } });
      expect(result).toBe(coupon);
    });
  });

  describe('findById', () => {
    it('should call prisma.coupon.findUnique with correct where filter', async () => {
      const id = 1;
      const coupon = { id, code: 'DISCOUNT10' };
      prisma.coupon.findUnique.mockResolvedValue(coupon);

      const result = await couponRepository.findById(id);

      expect(prisma.coupon.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.coupon.findUnique).toHaveBeenCalledWith({ where: { id } });
      expect(result).toBe(coupon);
    });
  });

  describe('findAll', () => {
    it('should call prisma.coupon.findMany with correct ordering', async () => {
      const coupons = [
        { id: 2, createdAt: new Date('2024-01-02') },
        { id: 1, createdAt: new Date('2024-01-01') },
      ];
      prisma.coupon.findMany.mockResolvedValue(coupons);

      const result = await couponRepository.findAll();

      expect(prisma.coupon.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.coupon.findMany).toHaveBeenCalledWith({ orderBy: { createdAt: 'desc' } });
      expect(result).toBe(coupons);
    });
  });

  describe('update', () => {
    it('should call prisma.coupon.update with correct where and data', async () => {
      const id = 1;
      const data = { value: 20 };
      const updatedCoupon = { id, code: 'DISCOUNT10', ...data };
      prisma.coupon.update.mockResolvedValue(updatedCoupon);

      const result = await couponRepository.update(id, data);

      expect(prisma.coupon.update).toHaveBeenCalledTimes(1);
      expect(prisma.coupon.update).toHaveBeenCalledWith({ where: { id }, data });
      expect(result).toBe(updatedCoupon);
    });
  });

  describe('delete', () => {
    it('should call prisma.coupon.delete with correct where', async () => {
      const id = 1;
      const deletedCoupon = { id, code: 'DISCOUNT10' };
      prisma.coupon.delete.mockResolvedValue(deletedCoupon);

      const result = await couponRepository.delete(id);

      expect(prisma.coupon.delete).toHaveBeenCalledTimes(1);
      expect(prisma.coupon.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toBe(deletedCoupon);
    });
  });

  describe('incrementUsage', () => {
    it('should call provided transaction client when tx is passed', async () => {
      const id = 1;
      const tx = {
        coupon: {
          update: jest.fn().mockResolvedValue({ id, usageCount: 1 }),
        },
      };

      const result = await couponRepository.incrementUsage(id, tx);

      expect(tx.coupon.update).toHaveBeenCalledTimes(1);
      expect(tx.coupon.update).toHaveBeenCalledWith({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });
      expect(result).toEqual({ id, usageCount: 1 });
    });

    it('should fall back to prisma.coupon.update when tx is not provided', async () => {
      const id = 1;
      prisma.coupon.update.mockResolvedValue({ id, usageCount: 1 });

      const result = await couponRepository.incrementUsage(id);

      expect(prisma.coupon.update).toHaveBeenCalledTimes(1);
      expect(prisma.coupon.update).toHaveBeenCalledWith({
        where: { id },
        data: { usageCount: { increment: 1 } },
      });
      expect(result).toEqual({ id, usageCount: 1 });
    });
  });
});
