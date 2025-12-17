const prisma = require('../../config/database');

const orderRepository = {
    findManyByUser: async (userId) => {
        return await prisma.order.findMany({
            where: { userId },
            include: { items: true, payment: true, coupon: true },
            orderBy: { createdAt: 'desc' }
        });
    },

    createOrderTransaction: async (userId, items, totalValue, subtotal, discount, couponId) => {
        return await prisma.$transaction(async (tx) => {
            // 1. Decrementar Estoque
            for (const item of items) {
                try {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });

                    const p = await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true, name: true } });
                    if (p.stock < 0) throw new Error(`Sem estoque para ${p.name}`);

                } catch (e) {
                    // Se for o nosso throw acima, propaga. Se for do prisma, encapsula.
                    throw new Error(e.message.includes('Sem estoque') ? e.message : `Falha ao atualizar estoque do produto ${item.productId}`);
                }
            }

            // 2. Incrementar Uso do Cupom
            if (couponId) {
                await tx.coupon.update({
                    where: { id: couponId },
                    data: { usageCount: { increment: 1 } }
                });
            }

            // 3. Criar Order
            const order = await tx.order.create({
                data: {
                    userId,
                    totalValue,
                    subtotal,
                    discount,
                    couponId,
                    status: 'PENDING',
                    items: {
                        create: items.map(i => ({
                            productId: i.productId,
                            quantity: i.quantity,
                            price: i.price
                        }))
                    }
                }
            });

            // 4. Criar Payment Stub
            await tx.payment.create({
                data: {
                    orderId: order.id,
                    status: 'AWAITING_CONFIRMATION'
                }
            });

            return order;
        });
    }
};

module.exports = orderRepository;
