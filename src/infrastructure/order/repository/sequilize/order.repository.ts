import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";

export default class OrderRepository implements OrderRepositoryInterface {

  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );

  }

  async update(entity: Order): Promise<void> {

    await OrderModel.findOne({
      where: { id: entity.id },
      include: ["items"],
      rejectOnEmpty: true,
    }).then(async (order) => {

      order.items.forEach(async (item, index) => {
        await OrderItemModel.update(
          {
            name: entity.items[index].name,
            price: entity.items[index].price,
            quantity: entity.items[index].quantity,
          },
          {
            where: {
              id: item.id,
            },
          }
        );
      });

      await OrderModel.update({
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total(),
      },
        {
          where: {
            id: entity.id,
          }
        }
      );
    })
  }

  async find(id: string): Promise<Order> {

    let orderModel;

    try {
      orderModel = await OrderModel.findOne({
        where: { id: id },
        include: ["items"],
        rejectOnEmpty: true,
      });


    } catch (error) {
      throw new Error("Order not found");
    }

    const items = orderModel.items.map((item) => {
      return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity)
    });

    const order = new Order(orderModel.id, orderModel.customer_id, items);

    return order;
  };

  async findAll(): Promise<Order[]> {

    const ordersModel = await OrderModel.findAll({
      include: ["items"],
    })

    const orders = ordersModel.map(order => {
      const items = order.items.map(item => {
        return new OrderItem(item.id, item.name, item.price, item.product_id, item.quantity)
      });
      return new Order(order.id, order.customer_id, items)
    });
    return orders;
  }
}