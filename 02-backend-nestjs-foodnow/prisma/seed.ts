/**
 * Demo seed data for local development — realistic Vietnamese restaurant/menu
 * content, sample users per role, and orders spanning every OrderStatus so
 * the frontend has something to render besides empty states. Not scraped
 * from real businesses; street names are generic Hà Nội locality references.
 *
 * Run: npm run db:seed  (or `npx prisma db seed`)
 */
import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  DeliveryStatus,
  DriverEarningStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionStatus,
  PaymentTransactionType,
  RestaurantStatus,
  Role,
  UserStatus,
} from '../src/generated/prisma/enums';
import { generateOrderCode } from '../src/features/orders/utils/order-code.util';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_PASSWORD = 'Password@123';
const PASSWORD_HASH_ROUNDS = 10;

type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
type OpeningHours = Record<DayOfWeek, { open: string; close: string } | null>;

const DAILY_7_22: OpeningHours = {
  mon: { open: '07:00', close: '22:00' },
  tue: { open: '07:00', close: '22:00' },
  wed: { open: '07:00', close: '22:00' },
  thu: { open: '07:00', close: '22:00' },
  fri: { open: '07:00', close: '22:00' },
  sat: { open: '07:00', close: '22:00' },
  sun: { open: '07:00', close: '22:00' },
};
const CLOSED_TUESDAY: OpeningHours = { ...DAILY_7_22, tue: null };

// ─── Cleanup ────────────────────────────────────────────────────────────

async function wipe() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      driver_earnings, promotion_usages, promotions, payment_transactions, payments,
      reviews, driver_locations, deliveries, order_status_history, order_item_options,
      order_items, orders, cart_items, carts, menu_item_options, menu_item_option_groups,
      menu_items, categories, restaurants, addresses, users
    RESTART IDENTITY CASCADE
  `);
}

// ─── Users & addresses ──────────────────────────────────────────────────

async function createUser(dto: { email: string; phone: string; fullName: string; role: Role }) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, PASSWORD_HASH_ROUNDS);
  return prisma.user.create({
    data: {
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      role: dto.role,
      fullName: dto.fullName,
      status: UserStatus.ACTIVE,
    },
  });
}

async function createAddress(dto: {
  userId: string;
  label: string;
  streetAddress: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}): Promise<string> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO addresses (id, user_id, label, street_address, location, is_default, created_at, updated_at)
    VALUES (
      gen_random_uuid(), ${dto.userId}, ${dto.label}, ${dto.streetAddress},
      ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography,
      ${dto.isDefault}, now(), now()
    )
    RETURNING id
  `;
  return rows[0].id;
}

// ─── Restaurants & menu ─────────────────────────────────────────────────

async function createRestaurant(dto: {
  ownerId: string;
  name: string;
  description: string;
  imageUrl?: string;
  lat: number;
  lng: number;
  openingHours: OpeningHours;
}): Promise<string> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO restaurants (id, owner_id, name, description, image_url, location, opening_hours, status, avg_rating, version, created_at, updated_at)
    VALUES (
      gen_random_uuid(), ${dto.ownerId}, ${dto.name}, ${dto.description}, ${dto.imageUrl ?? null},
      ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography,
      ${JSON.stringify(dto.openingHours)}::jsonb,
      ${RestaurantStatus.ACTIVE}, 0, 0, now(), now()
    )
    RETURNING id
  `;
  return rows[0].id;
}

type MenuOptionSpec = { name: string; extraPrice: string };
type MenuOptionGroupSpec = {
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: MenuOptionSpec[];
};
type MenuItemSpec = { name: string; price: string; optionGroups?: MenuOptionGroupSpec[] };
type CategorySpec = { name: string; items: MenuItemSpec[] };

type SeededMenuItem = { id: string; basePrice: string; options: Map<string, MenuOptionSpec> };

async function seedMenu(restaurantId: string, categories: CategorySpec[]): Promise<Map<string, SeededMenuItem>> {
  const menu = new Map<string, SeededMenuItem>();

  for (const [index, cat] of categories.entries()) {
    const category = await prisma.category.create({
      data: { restaurantId, name: cat.name, sortOrder: index },
    });

    for (const item of cat.items) {
      const menuItem = await prisma.menuItem.create({
        data: { restaurantId, categoryId: category.id, name: item.name, basePrice: item.price },
      });

      const options = new Map<string, MenuOptionSpec>();
      for (const group of item.optionGroups ?? []) {
        const optionGroup = await prisma.menuItemOptionGroup.create({
          data: {
            menuItemId: menuItem.id,
            name: group.name,
            isRequired: group.isRequired,
            minSelect: group.minSelect,
            maxSelect: group.maxSelect,
          },
        });
        for (const opt of group.options) {
          await prisma.menuItemOption.create({
            data: { optionGroupId: optionGroup.id, name: opt.name, extraPrice: opt.extraPrice },
          });
          options.set(opt.name, opt);
        }
      }

      menu.set(item.name, { id: menuItem.id, basePrice: item.price, options });
    }
  }

  return menu;
}

// ─── Orders ─────────────────────────────────────────────────────────────

const PROGRESSION: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
];

const STATUS_NOTES: Record<OrderStatus, string> = {
  PENDING: 'Đơn hàng được đặt',
  CONFIRMED: 'Nhà hàng đã xác nhận đơn',
  PREPARING: 'Nhà hàng đang chuẩn bị món',
  READY_FOR_PICKUP: 'Món đã sẵn sàng, chờ tài xế lấy hàng',
  ON_THE_WAY: 'Tài xế đang giao hàng',
  DELIVERED: 'Đơn hàng đã giao thành công',
  CANCELLED: 'Khách hàng huỷ đơn',
};

function buildStatusHistory(
  target: OrderStatus,
  actors: { customerId: string; vendorId: string; driverId?: string },
) {
  if (target === OrderStatus.CANCELLED) {
    return [
      { status: OrderStatus.PENDING, changedBy: actors.customerId, note: STATUS_NOTES.PENDING },
      { status: OrderStatus.CANCELLED, changedBy: actors.customerId, note: STATUS_NOTES.CANCELLED },
    ];
  }
  const idx = PROGRESSION.indexOf(target);
  return PROGRESSION.slice(0, idx + 1).map((status) => ({
    status,
    changedBy:
      status === OrderStatus.PENDING
        ? actors.customerId
        : status === OrderStatus.CONFIRMED ||
            status === OrderStatus.PREPARING ||
            status === OrderStatus.READY_FOR_PICKUP
          ? actors.vendorId
          : (actors.driverId ?? actors.vendorId),
    note: STATUS_NOTES[status],
  }));
}

type OrderLineSpec = { itemName: string; quantity: number; optionNames?: string[]; note?: string };

async function createOrder(params: {
  customerId: string;
  vendorId: string;
  restaurantId: string;
  restaurantLat: number;
  restaurantLng: number;
  deliveryAddressId: string;
  menu: Map<string, SeededMenuItem>;
  lines: OrderLineSpec[];
  status: OrderStatus;
  method: PaymentMethod;
  driverId?: string;
  deliveryFee: number;
  placedAt: Date;
}) {
  const itemsData = params.lines.map((line) => {
    const menuItem = params.menu.get(line.itemName);
    if (!menuItem) throw new Error(`Unknown menu item in seed data: ${line.itemName}`);
    const chosen = (line.optionNames ?? []).map((name) => {
      const opt = menuItem.options.get(name);
      if (!opt) throw new Error(`Unknown option in seed data: ${name} (${line.itemName})`);
      return opt;
    });
    const unitPrice = Number(menuItem.basePrice) + chosen.reduce((sum, o) => sum + Number(o.extraPrice), 0);
    const lineSubtotal = unitPrice * line.quantity;
    return {
      menuItemId: menuItem.id,
      itemNameSnapshot: line.itemName,
      itemPriceSnapshot: menuItem.basePrice,
      quantity: line.quantity,
      subtotal: lineSubtotal.toFixed(2),
      note: line.note,
      options: {
        create: chosen.map((opt) => ({ optionNameSnapshot: opt.name, optionPriceSnapshot: opt.extraPrice })),
      },
    };
  });

  const subtotal = itemsData.reduce((sum, i) => sum + Number(i.subtotal), 0);
  const totalAmount = subtotal + params.deliveryFee;

  const history = buildStatusHistory(params.status, {
    customerId: params.customerId,
    vendorId: params.vendorId,
    driverId: params.driverId,
  });

  const order = await prisma.order.create({
    data: {
      orderCode: generateOrderCode(params.placedAt),
      customerId: params.customerId,
      restaurantId: params.restaurantId,
      driverId: params.driverId ?? null,
      deliveryAddressId: params.deliveryAddressId,
      status: params.status,
      subtotal: subtotal.toFixed(2),
      deliveryFee: params.deliveryFee.toFixed(2),
      discountAmount: '0.00',
      totalAmount: totalAmount.toFixed(2),
      version: history.length - 1,
      placedAt: params.placedAt,
      items: { create: itemsData },
      statusHistory: { create: history },
    },
  });

  // ── Delivery + driver location + earning ──
  let deliveryId: string | undefined;
  const deliveryStatusByOrder: Partial<Record<OrderStatus, DeliveryStatus>> = {
    READY_FOR_PICKUP: DeliveryStatus.ASSIGNED,
    ON_THE_WAY: DeliveryStatus.PICKED_UP,
    DELIVERED: DeliveryStatus.DELIVERED,
  };
  if (params.driverId && deliveryStatusByOrder[params.status]) {
    const deliveryStatus = deliveryStatusByOrder[params.status]!;
    const pickupTime = deliveryStatus === DeliveryStatus.ASSIGNED ? null : new Date(params.placedAt.getTime() + 15 * 60_000);
    const deliveryTime = deliveryStatus === DeliveryStatus.DELIVERED ? new Date(params.placedAt.getTime() + 40 * 60_000) : null;

    const delivery = await prisma.delivery.create({
      data: {
        orderId: order.id,
        driverId: params.driverId,
        status: deliveryStatus,
        estimatedDistanceKm: (1.5 + Math.random() * 4).toFixed(2),
        pickupTime,
        deliveryTime,
      },
    });
    deliveryId = delivery.id;

    await prisma.$executeRaw`
      INSERT INTO driver_locations (id, driver_id, order_id, location, recorded_at)
      VALUES (
        gen_random_uuid(), ${params.driverId}, ${delivery.id},
        ST_SetSRID(ST_MakePoint(${params.restaurantLng + 0.003}, ${params.restaurantLat + 0.003}), 4326)::geography,
        now()
      )
    `;

    if (deliveryStatus === DeliveryStatus.DELIVERED) {
      await prisma.driverEarning.create({
        data: {
          driverId: params.driverId,
          deliveryId: delivery.id,
          amount: (params.deliveryFee * 0.8).toFixed(2),
          status: DriverEarningStatus.PAID,
          paidAt: deliveryTime ?? new Date(),
        },
      });
    }
  }

  // ── Payment ──
  if (params.status !== OrderStatus.CANCELLED) {
    let paymentStatus: PaymentStatus;
    if (params.method === PaymentMethod.CASH) {
      paymentStatus = params.status === OrderStatus.DELIVERED ? PaymentStatus.PAID : PaymentStatus.PENDING;
    } else {
      paymentStatus = PaymentStatus.PAID;
    }

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: totalAmount.toFixed(2),
        method: params.method,
        status: paymentStatus,
        transactions:
          paymentStatus === PaymentStatus.PENDING
            ? undefined
            : {
                create: [
                  {
                    idempotencyKey: randomUUID(),
                    type: PaymentTransactionType.CHARGE,
                    status: PaymentTransactionStatus.SUCCESS,
                    providerTransactionId: `demo_${randomUUID().slice(0, 8)}`,
                  },
                ],
              },
      },
    });
  }

  return { orderId: order.id, deliveryId };
}

// ─── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log('Wiping existing demo data...');
  await wipe();

  console.log('Creating users...');
  const admin = await createUser({ email: 'admin@foodnow.vn', phone: '0900000001', fullName: 'Quản Trị Viên', role: Role.ADMIN });

  const vendorSpecs = [
    { email: 'vendor.photruyenthong@foodnow.vn', phone: '0900000101', fullName: 'Nguyễn Văn Thành' },
    { email: 'vendor.bunchacohien@foodnow.vn', phone: '0900000102', fullName: 'Trần Thị Hiền' },
    { email: 'vendor.comtamutsau@foodnow.vn', phone: '0900000103', fullName: 'Lê Văn Sáu' },
    { email: 'vendor.moctra@foodnow.vn', phone: '0900000104', fullName: 'Phạm Thị Mộc' },
    { email: 'vendor.bellavita@foodnow.vn', phone: '0900000105', fullName: 'Đỗ Minh Quân' },
    { email: 'vendor.garanphoco@foodnow.vn', phone: '0900000106', fullName: 'Vũ Thị Lan' },
  ];
  const vendors = await Promise.all(vendorSpecs.map((v) => createUser({ ...v, role: Role.VENDOR })));

  const driverSpecs = [
    { email: 'driver.hung@foodnow.vn', phone: '0900000201', fullName: 'Bùi Văn Hùng' },
    { email: 'driver.nam@foodnow.vn', phone: '0900000202', fullName: 'Ngô Văn Nam' },
    { email: 'driver.thang@foodnow.vn', phone: '0900000203', fullName: 'Đặng Văn Thắng' },
    { email: 'driver.tuan@foodnow.vn', phone: '0900000204', fullName: 'Hoàng Anh Tuấn' },
  ];
  const [driver1, driver2, driver3, driver4] = await Promise.all(
    driverSpecs.map((d) => createUser({ ...d, role: Role.DRIVER })),
  );

  const customerSpecs = [
    { email: 'customer.mai@foodnow.vn', phone: '0900000301', fullName: 'Nguyễn Thị Mai' },
    { email: 'customer.linh@foodnow.vn', phone: '0900000302', fullName: 'Trần Thu Linh' },
    { email: 'customer.duc@foodnow.vn', phone: '0900000303', fullName: 'Phạm Anh Đức' },
    { email: 'customer.hoa@foodnow.vn', phone: '0900000304', fullName: 'Lê Thị Hoa' },
    { email: 'customer.khanh@foodnow.vn', phone: '0900000305', fullName: 'Vũ Gia Khánh' },
  ];
  const [cust1, cust2, cust3, cust4, cust5] = await Promise.all(
    customerSpecs.map((c) => createUser({ ...c, role: Role.CUSTOMER })),
  );

  console.log('Creating addresses...');
  const addr1 = await createAddress({ userId: cust1.id, label: 'Nhà riêng', streetAddress: '12 Hàng Bạc, Hoàn Kiếm, Hà Nội', lat: 21.0245, lng: 105.8412, isDefault: true });
  const addr2 = await createAddress({ userId: cust2.id, label: 'Nhà riêng', streetAddress: '45 Phố Huế, Hai Bà Trưng, Hà Nội', lat: 21.018, lng: 105.85, isDefault: true });
  const addr3 = await createAddress({ userId: cust3.id, label: 'Nhà riêng', streetAddress: '78 Tôn Đức Thắng, Đống Đa, Hà Nội', lat: 21.0122, lng: 105.832, isDefault: true });
  const addr4 = await createAddress({ userId: cust4.id, label: 'Công ty', streetAddress: '23 Cầu Giấy, Cầu Giấy, Hà Nội', lat: 21.0322, lng: 105.795, isDefault: true });
  const addr5 = await createAddress({ userId: cust5.id, label: 'Nhà riêng', streetAddress: '56 Kim Mã, Ba Đình, Hà Nội', lat: 21.0333, lng: 105.818, isDefault: true });

  console.log('Creating restaurants + menus...');

  const rPho = { lat: 21.0293, lng: 105.8517 };
  const rBunCha = { lat: 21.0091, lng: 105.8562 };
  const rComTam = { lat: 21.0136, lng: 105.8296 };
  const rTraSua = { lat: 21.0325, lng: 105.792 };
  const rPizza = { lat: 21.0356, lng: 105.8175 };
  const rGaRan = { lat: 21.0662, lng: 105.8231 };

  const restaurant1Id = await createRestaurant({
    ownerId: vendors[0].id,
    name: 'Phở Bò Gia Truyền Hà Thành',
    description: 'Phở bò truyền thống ninh xương 8 tiếng, nước dùng trong và đậm vị.',
    imageUrl: 'https://picsum.photos/seed/foodnow-pho-bo/640/480',
    ...rPho,
    openingHours: DAILY_7_22,
  });
  const menu1 = await seedMenu(restaurant1Id, [
    {
      name: 'Phở',
      items: [
        { name: 'Phở Bò Tái', price: '55000.00' },
        { name: 'Phở Bò Chín', price: '55000.00' },
        {
          name: 'Phở Bò Đặc Biệt',
          price: '75000.00',
          optionGroups: [
            {
              name: 'Thêm topping',
              isRequired: false,
              minSelect: 0,
              maxSelect: 3,
              options: [
                { name: 'Trứng chần', extraPrice: '10000.00' },
                { name: 'Quẩy', extraPrice: '8000.00' },
                { name: 'Thêm thịt bò', extraPrice: '20000.00' },
              ],
            },
          ],
        },
        { name: 'Phở Gà', price: '50000.00' },
      ],
    },
    { name: 'Khai vị', items: [{ name: 'Nem Rán (4 chiếc)', price: '40000.00' }, { name: 'Chả Cốm', price: '45000.00' }] },
    { name: 'Đồ uống', items: [{ name: 'Trà Đá', price: '5000.00' }, { name: 'Nước Cam Ép', price: '25000.00' }] },
  ]);

  const restaurant2Id = await createRestaurant({
    ownerId: vendors[1].id,
    name: 'Bún Chả Cô Hiền',
    description: 'Bún chả than hoa thơm lừng, nước chấm pha chuẩn vị Hà Nội.',
    imageUrl: 'https://picsum.photos/seed/foodnow-bun-cha/640/480',
    ...rBunCha,
    openingHours: DAILY_7_22,
  });
  const menu2 = await seedMenu(restaurant2Id, [
    {
      name: 'Bún chả',
      items: [
        { name: 'Bún Chả Truyền Thống', price: '45000.00' },
        { name: 'Bún Chả Chả Cốm', price: '50000.00' },
        { name: 'Bún Nem Rán', price: '40000.00' },
      ],
    },
    {
      name: 'Nem',
      items: [
        {
          name: 'Nem Cua Bể (2 chiếc)',
          price: '35000.00',
          optionGroups: [
            {
              name: 'Thêm nem',
              isRequired: false,
              minSelect: 0,
              maxSelect: 5,
              options: [{ name: 'Thêm 1 chiếc nem', extraPrice: '8000.00' }],
            },
          ],
        },
      ],
    },
    { name: 'Đồ uống', items: [{ name: 'Trà Chanh', price: '15000.00' }, { name: 'Nước Mơ', price: '15000.00' }] },
  ]);

  const restaurant3Id = await createRestaurant({
    ownerId: vendors[2].id,
    name: 'Cơm Tấm Sườn Bì Út Sáu',
    description: 'Cơm tấm kiểu Sài Gòn, sườn nướng than hoa, bì giòn, chả trứng hấp.',
    imageUrl: 'https://picsum.photos/seed/foodnow-com-tam/640/480',
    ...rComTam,
    openingHours: DAILY_7_22,
  });
  const menu3 = await seedMenu(restaurant3Id, [
    {
      name: 'Cơm tấm',
      items: [
        {
          name: 'Cơm Tấm Sườn Bì Chả',
          price: '55000.00',
          optionGroups: [
            {
              name: 'Độ cay',
              isRequired: true,
              minSelect: 1,
              maxSelect: 1,
              options: [
                { name: 'Không cay', extraPrice: '0.00' },
                { name: 'Cay vừa', extraPrice: '0.00' },
                { name: 'Cay nhiều', extraPrice: '0.00' },
              ],
            },
          ],
        },
        { name: 'Cơm Tấm Sườn Nướng', price: '45000.00' },
        { name: 'Cơm Tấm Gà Nướng', price: '48000.00' },
      ],
    },
    { name: 'Món thêm', items: [{ name: 'Canh Chua', price: '20000.00' }, { name: 'Trứng Ốp La', price: '10000.00' }] },
    { name: 'Đồ uống', items: [{ name: 'Trà Đá', price: '5000.00' }] },
  ]);

  const restaurant4Id = await createRestaurant({
    ownerId: vendors[3].id,
    name: 'Trà Sữa & Café Mộc Trà',
    imageUrl: 'https://picsum.photos/seed/foodnow-tra-sua/640/480',
    description: 'Trà sữa tự pha, trân châu nấu mỗi ngày, cà phê rang mộc.',
    ...rTraSua,
    openingHours: DAILY_7_22,
  });
  const menu4 = await seedMenu(restaurant4Id, [
    {
      name: 'Trà sữa',
      items: [
        {
          name: 'Trà Sữa Trân Châu Đường Đen',
          price: '45000.00',
          optionGroups: [
            {
              name: 'Size',
              isRequired: true,
              minSelect: 1,
              maxSelect: 1,
              options: [
                { name: 'Size M', extraPrice: '0.00' },
                { name: 'Size L', extraPrice: '8000.00' },
              ],
            },
            {
              name: 'Topping',
              isRequired: false,
              minSelect: 0,
              maxSelect: 3,
              options: [
                { name: 'Trân châu đen', extraPrice: '8000.00' },
                { name: 'Trân châu trắng', extraPrice: '8000.00' },
                { name: 'Thạch dừa', extraPrice: '8000.00' },
                { name: 'Pudding trứng', extraPrice: '10000.00' },
              ],
            },
          ],
        },
        { name: 'Trà Sữa Matcha', price: '42000.00' },
      ],
    },
    {
      name: 'Cà phê',
      items: [
        { name: 'Cà Phê Sữa Đá', price: '29000.00' },
        { name: 'Cà Phê Đen Đá', price: '25000.00' },
        { name: 'Bạc Xỉu', price: '32000.00' },
      ],
    },
  ]);

  const restaurant5Id = await createRestaurant({
    ownerId: vendors[4].id,
    name: 'Pizza & Pasta Bella Vita',
    description: 'Pizza đế mỏng nướng lò củi, mì Ý sốt nhà làm.',
    imageUrl: 'https://picsum.photos/seed/foodnow-pizza/640/480',
    ...rPizza,
    openingHours: CLOSED_TUESDAY,
  });
  const menu5 = await seedMenu(restaurant5Id, [
    {
      name: 'Pizza',
      items: [
        {
          name: 'Pizza Hải Sản Sốt Cà Chua',
          price: '159000.00',
          optionGroups: [
            {
              name: 'Size',
              isRequired: true,
              minSelect: 1,
              maxSelect: 1,
              options: [
                { name: 'Size M', extraPrice: '0.00' },
                { name: 'Size L', extraPrice: '50000.00' },
              ],
            },
          ],
        },
        { name: 'Pizza Bò Phô Mai', price: '149000.00' },
      ],
    },
    { name: 'Mì Ý', items: [{ name: 'Mì Ý Sốt Bò Bằm', price: '89000.00' }, { name: 'Mì Ý Sốt Kem Nấm', price: '85000.00' }] },
    { name: 'Đồ uống', items: [{ name: 'Salad Caesar', price: '65000.00' }, { name: 'Nước Ngọt Lon', price: '15000.00' }] },
  ]);

  const restaurant6Id = await createRestaurant({
    ownerId: vendors[5].id,
    name: 'Gà Rán Phố Cổ',
    description: 'Gà rán giòn tan, ướp gia vị kiểu phố cổ, phục vụ nhanh.',
    imageUrl: 'https://picsum.photos/seed/foodnow-ga-ran/640/480',
    ...rGaRan,
    openingHours: DAILY_7_22,
  });
  const menu6 = await seedMenu(restaurant6Id, [
    {
      name: 'Gà rán',
      items: [
        { name: 'Gà Rán Giòn Cay (2 miếng)', price: '59000.00' },
        {
          name: 'Combo Gà Rán + Khoai Tây + Nước',
          price: '89000.00',
          optionGroups: [
            {
              name: 'Chọn nước',
              isRequired: true,
              minSelect: 1,
              maxSelect: 1,
              options: [
                { name: 'Coca-Cola', extraPrice: '0.00' },
                { name: 'Pepsi', extraPrice: '0.00' },
                { name: 'Trà Đào', extraPrice: '5000.00' },
              ],
            },
          ],
        },
      ],
    },
    { name: 'Burger', items: [{ name: 'Burger Bò Phô Mai', price: '49000.00' }, { name: 'Burger Gà Giòn', price: '45000.00' }] },
    { name: 'Đồ uống', items: [{ name: 'Khoai Tây Chiên', price: '25000.00' }, { name: 'Nước Ngọt Lon', price: '15000.00' }] },
  ]);

  console.log('Creating orders, deliveries, payments, reviews...');
  const now = Date.now();
  const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

  const o1 = await createOrder({
    customerId: cust1.id, vendorId: vendors[0].id, restaurantId: restaurant1Id, restaurantLat: rPho.lat, restaurantLng: rPho.lng,
    deliveryAddressId: addr1, menu: menu1,
    lines: [{ itemName: 'Phở Bò Đặc Biệt', quantity: 1, optionNames: ['Trứng chần'] }, { itemName: 'Trà Đá', quantity: 1 }],
    status: OrderStatus.DELIVERED, method: PaymentMethod.CASH, driverId: driver1.id, deliveryFee: 15000, placedAt: daysAgo(5),
  });
  const o2 = await createOrder({
    customerId: cust1.id, vendorId: vendors[3].id, restaurantId: restaurant4Id, restaurantLat: rTraSua.lat, restaurantLng: rTraSua.lng,
    deliveryAddressId: addr1, menu: menu4,
    lines: [{ itemName: 'Trà Sữa Trân Châu Đường Đen', quantity: 2, optionNames: ['Size L', 'Trân châu đen'], note: 'Ít đá' }],
    status: OrderStatus.DELIVERED, method: PaymentMethod.WALLET, driverId: driver2.id, deliveryFee: 18000, placedAt: daysAgo(3),
  });
  const o3 = await createOrder({
    customerId: cust2.id, vendorId: vendors[1].id, restaurantId: restaurant2Id, restaurantLat: rBunCha.lat, restaurantLng: rBunCha.lng,
    deliveryAddressId: addr2, menu: menu2,
    lines: [{ itemName: 'Bún Chả Truyền Thống', quantity: 2 }, { itemName: 'Nem Cua Bể (2 chiếc)', quantity: 1, optionNames: ['Thêm 1 chiếc nem'] }],
    status: OrderStatus.DELIVERED, method: PaymentMethod.CARD, driverId: driver1.id, deliveryFee: 16000, placedAt: daysAgo(4),
  });
  const o4 = await createOrder({
    customerId: cust2.id, vendorId: vendors[4].id, restaurantId: restaurant5Id, restaurantLat: rPizza.lat, restaurantLng: rPizza.lng,
    deliveryAddressId: addr2, menu: menu5,
    lines: [{ itemName: 'Pizza Hải Sản Sốt Cà Chua', quantity: 1, optionNames: ['Size L'] }, { itemName: 'Nước Ngọt Lon', quantity: 2 }],
    status: OrderStatus.ON_THE_WAY, method: PaymentMethod.CARD, driverId: driver3.id, deliveryFee: 20000, placedAt: new Date(now - 25 * 60_000),
  });
  const o5 = await createOrder({
    customerId: cust3.id, vendorId: vendors[2].id, restaurantId: restaurant3Id, restaurantLat: rComTam.lat, restaurantLng: rComTam.lng,
    deliveryAddressId: addr3, menu: menu3,
    lines: [{ itemName: 'Cơm Tấm Sườn Bì Chả', quantity: 1, optionNames: ['Cay vừa'] }, { itemName: 'Canh Chua', quantity: 1 }],
    status: OrderStatus.DELIVERED, method: PaymentMethod.CASH, driverId: driver2.id, deliveryFee: 15000, placedAt: daysAgo(6),
  });
  await createOrder({
    customerId: cust3.id, vendorId: vendors[5].id, restaurantId: restaurant6Id, restaurantLat: rGaRan.lat, restaurantLng: rGaRan.lng,
    deliveryAddressId: addr3, menu: menu6,
    lines: [{ itemName: 'Combo Gà Rán + Khoai Tây + Nước', quantity: 1, optionNames: ['Trà Đào'] }],
    status: OrderStatus.PREPARING, method: PaymentMethod.CARD, deliveryFee: 22000, placedAt: new Date(now - 10 * 60_000),
  });
  await createOrder({
    customerId: cust4.id, vendorId: vendors[0].id, restaurantId: restaurant1Id, restaurantLat: rPho.lat, restaurantLng: rPho.lng,
    deliveryAddressId: addr4, menu: menu1,
    lines: [{ itemName: 'Phở Gà', quantity: 1 }],
    status: OrderStatus.CONFIRMED, method: PaymentMethod.CASH, deliveryFee: 15000, placedAt: new Date(now - 6 * 60_000),
  });
  await createOrder({
    customerId: cust4.id, vendorId: vendors[3].id, restaurantId: restaurant4Id, restaurantLat: rTraSua.lat, restaurantLng: rTraSua.lng,
    deliveryAddressId: addr4, menu: menu4,
    lines: [{ itemName: 'Bạc Xỉu', quantity: 1 }, { itemName: 'Trà Sữa Matcha', quantity: 1 }],
    status: OrderStatus.PENDING, method: PaymentMethod.CASH, deliveryFee: 15000, placedAt: new Date(now - 2 * 60_000),
  });
  const o9 = await createOrder({
    customerId: cust5.id, vendorId: vendors[4].id, restaurantId: restaurant5Id, restaurantLat: rPizza.lat, restaurantLng: rPizza.lng,
    deliveryAddressId: addr5, menu: menu5,
    lines: [{ itemName: 'Mì Ý Sốt Bò Bằm', quantity: 1 }, { itemName: 'Salad Caesar', quantity: 1 }],
    status: OrderStatus.DELIVERED, method: PaymentMethod.WALLET, driverId: driver4.id, deliveryFee: 17000, placedAt: daysAgo(2),
  });
  await createOrder({
    customerId: cust5.id, vendorId: vendors[1].id, restaurantId: restaurant2Id, restaurantLat: rBunCha.lat, restaurantLng: rBunCha.lng,
    deliveryAddressId: addr5, menu: menu2,
    lines: [{ itemName: 'Bún Nem Rán', quantity: 1 }],
    status: OrderStatus.CANCELLED, method: PaymentMethod.CASH, deliveryFee: 16000, placedAt: daysAgo(1),
  });
  await createOrder({
    customerId: cust1.id, vendorId: vendors[5].id, restaurantId: restaurant6Id, restaurantLat: rGaRan.lat, restaurantLng: rGaRan.lng,
    deliveryAddressId: addr1, menu: menu6,
    lines: [{ itemName: 'Gà Rán Giòn Cay (2 miếng)', quantity: 1 }, { itemName: 'Burger Bò Phô Mai', quantity: 1 }],
    status: OrderStatus.READY_FOR_PICKUP, method: PaymentMethod.CARD, driverId: driver3.id, deliveryFee: 19000, placedAt: new Date(now - 12 * 60_000),
  });

  console.log('Creating reviews...');
  await prisma.review.create({
    data: { orderId: o1.orderId, customerId: cust1.id, restaurantId: restaurant1Id, driverId: driver1.id, rating: 5, comment: 'Phở ngon, nước dùng đậm đà, giao hàng nhanh!' },
  });
  await prisma.review.create({
    data: { orderId: o2.orderId, customerId: cust1.id, restaurantId: restaurant4Id, driverId: driver2.id, rating: 4, comment: 'Trà sữa ngon nhưng hơi ngọt so với khẩu vị của mình.' },
  });
  await prisma.review.create({
    data: { orderId: o3.orderId, customerId: cust2.id, restaurantId: restaurant2Id, driverId: driver1.id, rating: 5, comment: 'Bún chả xuất sắc, đúng vị Hà Nội xưa!' },
  });
  await prisma.review.create({
    data: { orderId: o5.orderId, customerId: cust3.id, restaurantId: restaurant3Id, driverId: driver2.id, rating: 3, comment: 'Cơm ổn nhưng giao hơi chậm so với dự kiến.' },
  });
  await prisma.review.create({
    data: { orderId: o9.orderId, customerId: cust5.id, restaurantId: restaurant5Id, driverId: driver4.id, rating: 5, comment: 'Pizza đế mỏng giòn, giao rất nhanh, sẽ đặt lại!' },
  });

  console.log('Recomputing restaurant ratings...');
  for (const restaurantId of [restaurant1Id, restaurant2Id, restaurant3Id, restaurant4Id, restaurant5Id, restaurant6Id]) {
    const agg = await prisma.review.aggregate({ where: { restaurantId }, _avg: { rating: true } });
    if (agg._avg.rating !== null) {
      await prisma.restaurant.update({ where: { id: restaurantId }, data: { avgRating: agg._avg.rating.toFixed(2) } });
    }
  }

  console.log('\nDone. Demo login credentials (password for everyone: %s):', DEMO_PASSWORD);
  console.log('  Admin:    %s', admin.email);
  console.log('  Vendors:  %s', vendorSpecs.map((v) => v.email).join(', '));
  console.log('  Drivers:  %s', driverSpecs.map((d) => d.email).join(', '));
  console.log('  Customers:%s', customerSpecs.map((c) => c.email).join(', '));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
