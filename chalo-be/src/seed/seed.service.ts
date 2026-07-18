import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../modules/user/entities/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { BCRYPT_SALT_ROUNDS } from '../common/constants';
import { Category } from '../modules/category/entities/category.entity';
import { Product } from '../modules/product/entities/product.entity';
import { ProductStatus } from '../common/enums/product-status.enum';
import { Table } from '../modules/table/entities/table.entity';
import { TableStatus } from '../common/enums/table-status.enum';
import { Order } from '../modules/order/entities/order.entity';
import { OrderItem } from '../modules/order/entities/order-item.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

type MenuPreset = {
  category: string;
  items: Array<{ name: string; price: number; prepTime?: number }>;
};

const MENU_PRESETS: MenuPreset[] = [
  {
    category: 'Coffee',
    items: [
      { name: 'Cold Drip', price: 39000 },
      { name: 'Capuchino Lạnh', price: 39000 },
      { name: 'CHALO Coffee Đặc Biệt', price: 39000 },
      { name: 'CHALO Coffee Đen/Nâu', price: 29000 },
      { name: 'Cà Phê Kem Sữa Hạnh Nhân', price: 39000 },
      { name: 'Cà Phê Kem Sữa Dừa', price: 39000 },
      { name: 'Cà Phê Kem Muối', price: 34000 },
      { name: 'Cà Phê Bạc Xỉu', price: 34000 },
      { name: 'Cà Phê Sữa Tươi Caramel', price: 39000 },
      { name: 'Ca Cao Sữa Dừa (Nóng/Đá)', price: 44000 },
      { name: 'Cacao Kem Muối (Nóng/Đá)', price: 39000 },
    ],
  },
  {
    category: 'Trà Đậm Vị - Trà Sữa',
    items: [
      { name: 'Trà Sữa Chalo Nguyên Vị', price: 34000 },
      { name: 'Trà Sữa Chalo Mix Vị (Xoài, Đào)', price: 39000 },
      { name: 'Trà Sữa Chalo Việt Quất', price: 39000 },
      { name: 'Trà Sữa Chalo Chanh Leo Thạch Dừa', price: 39000 },
      { name: 'Trà Đào Cam Quế Nóng', price: 39000 },
      { name: 'Trà Đào Tôn Ngộ Không', price: 48000 },
      { name: 'Phượng Hoàng', price: 48000 },
      { name: 'Hằng Nga', price: 48000 },
      { name: 'Trà Sen Matcha', price: 48000 },
      { name: 'Trà Sen Quế Hoa', price: 48000 },
      { name: 'Sắc Xuân (Trà Nóng)', price: 58000 },
      { name: 'Trà Cúc CHALO Đậm Vị (Trà Nóng)', price: 45000 },
    ],
  },
  {
    category: 'Matcha',
    items: [
      { name: 'Bầu Trời Xanh', price: 48000 },
      { name: 'Đại Dương Xanh', price: 48000 },
      { name: 'Thảo Nguyên Xanh', price: 48000 },
      { name: 'Hoa Vàng Trên Cỏ Xanh', price: 48000 },
      { name: 'Hồng Hài Nhi', price: 54000 },
      { name: 'Matcha Latte', price: 39000 },
    ],
  },
  {
    category: 'Sinh Tố',
    items: [
      { name: 'Sinh Tố Dâu Tây, Mãng Cầu, Xoài, Bơ', price: 48000 },
      { name: 'Sinh Tố Sữa Chua Ca Cao Mật Ong', price: 55000 },
      { name: 'Sinh Tố Sữa Chua', price: 48000 },
      { name: 'Sinh Tố Sầu Riêng', price: 69000 },
      { name: 'Trăng Non', price: 54000 },
    ],
  },
  {
    category: 'Nước Ép',
    items: [
      { name: 'Nước Ép Dứa', price: 39000 },
      { name: 'Nước Ép Dưa Hấu', price: 39000 },
      { name: 'Nước Ép Cam', price: 39000 },
    ],
  },
  {
    category: 'Sữa Chua',
    items: [
      { name: 'Bay Lắc Cùng Chalo', price: 48000 },
      { name: 'Chú Cuội', price: 48000 },
      { name: 'Mờ Sương', price: 39000 },
      { name: 'Sữa Chua Cà Phê', price: 39000 },
      { name: 'Sữa Chua Xoài', price: 39000 },
      { name: 'Sữa Chua Việt Quất', price: 39000 },
      { name: 'Sữa Chua Dâu', price: 39000 },
    ],
  },
  {
    category: 'Đồ Ăn Vặt',
    items: [
      { name: 'Bim Bim', price: 8000, prepTime: 1 },
      { name: 'Hạt Hướng Dương', price: 15000, prepTime: 1 },
      { name: 'Hạt Bí, Hạt Dưa', price: 19000, prepTime: 1 },
      { name: 'Khô Gà, Khô Bò, Khô Heo', price: 19000, prepTime: 1 },
      { name: 'Snack Bỏng Ngô Mỹ', price: 22000, prepTime: 1 },
    ],
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_ON_STARTUP !== 'true') {
      this.logger.log('Skipping database seed: SEED_ON_STARTUP is not true');
      return;
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      await this.seedEssentials();
      return;
    }

    // Dev/demo: reset toàn bộ + tạo dữ liệu giả (đơn hàng) để test giao diện.
    await this.resetAllData();
    await this.seedUsers();
    const categories = await this.seedCategoriesFromMenu();
    const products = await this.seedProductsFromMenu(categories);
    const tables = await this.seedTables(25);
    await this.seedOrders(products, tables, 250);
    await this.syncTableCurrentOrders();
  }

  /**
   * Seed cho PRODUCTION: chỉ tạo dữ liệu nền tối thiểu — tài khoản đăng nhập,
   * menu (danh mục + món) và bàn. KHÔNG tạo đơn hàng, KHÔNG xoá dữ liệu.
   * Idempotent: nếu DB đã có dữ liệu thì bỏ qua (an toàn kể cả khi lỡ để cờ bật).
   */
  private async seedEssentials() {
    const existingUsers = await this.userRepo.count();
    const existingProducts = await this.productRepo.count();
    if (existingUsers > 0 || existingProducts > 0) {
      this.logger.log(
        'Skipping seed: dữ liệu đã tồn tại (seed production idempotent, không reset)',
      );
      return;
    }

    await this.seedUsers();
    const categories = await this.seedCategoriesFromMenu();
    await this.seedProductsFromMenu(categories);
    await this.seedTables(30);
    this.logger.log(
      'Seed production hoàn tất: tài khoản + menu + bàn (không có đơn hàng). ' +
        'Nhớ đổi mật khẩu mặc định và đặt SEED_ON_STARTUP=false.',
    );
  }

  private async resetAllData() {
    await this.dataSource.query(
      'TRUNCATE TABLE "checkout_sessions", "order_items", "orders", "products", "categories", "tables", "users" RESTART IDENTITY CASCADE',
    );
    this.logger.warn('Reset old data: users/categories/products/tables/orders');
  }

  private async seedUsers() {
    const adminHash = await bcrypt.hash('admin', BCRYPT_SALT_ROUNDS);
    const staffHash = await bcrypt.hash('staff', BCRYPT_SALT_ROUNDS);

    await this.userRepo.save([
      this.userRepo.create({
        username: 'admin',
        password: adminHash,
        fullName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
      }),
      this.userRepo.create({
        username: 'staff',
        password: staffHash,
        fullName: 'Staff',
        role: UserRole.MODERATOR,
        isActive: true,
      }),
    ]);

    this.logger.log('Seeded accounts: admin/admin and staff/staff');
  }

  private async seedCategoriesFromMenu(): Promise<Category[]> {
    const categories = MENU_PRESETS.map((preset, index) =>
      this.categoryRepo.create({
        name: preset.category,
        description: `Menu ${preset.category}`,
        imageUrl: null,
        sortOrder: index + 1,
        isActive: true,
      }),
    );
    const saved = await this.categoryRepo.save(categories);
    this.logger.log(`Seeded ${saved.length} menu categories`);
    return saved;
  }

  private async seedProductsFromMenu(categories: Category[]): Promise<Product[]> {
    const categoryByName = new Map(categories.map((c) => [c.name, c]));
    const products: Product[] = [];
    let sortIndex = 1;

    for (const preset of MENU_PRESETS) {
      const category = categoryByName.get(preset.category);
      if (!category) continue;

      for (const item of preset.items) {
        products.push(
          this.productRepo.create({
            categoryId: category.id,
            name: item.name,
            description: `${preset.category} - ${item.name}`,
            imageUrl: null,
            price: item.price,
            prepTime: item.prepTime ?? 3,
            status: ProductStatus.AVAILABLE,
            isActive: true,
            sortOrder: sortIndex++,
          }),
        );
      }
    }

    const saved = await this.productRepo.save(products);
    this.logger.log(`Seeded ${saved.length} menu products`);
    return saved;
  }

  private async seedTables(count: number): Promise<Table[]> {
    const tables: Table[] = [];
    for (let i = 1; i <= count; i++) {
      tables.push(
        this.tableRepo.create({
          name: `Bàn ${String(i).padStart(2, '0')}`,
          area: null,
          status: TableStatus.AVAILABLE,
          qrToken: uuidv4(),
        }),
      );
    }
    const saved = await this.tableRepo.save(tables);
    this.logger.log(`Seeded ${saved.length} numbered tables`);
    return saved;
  }

  private async seedOrders(products: Product[], tables: Table[], targetOrders: number) {
    const openStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ];
    const allStatuses: OrderStatus[] = [
      ...openStatuses,
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
    ];

    for (let i = 0; i < targetOrders; i++) {
      const table = tables[i % tables.length];
      const itemCount = 1 + (i % 4);
      const items: OrderItem[] = [];
      let totalAmount = 0;

      for (let j = 0; j < itemCount; j++) {
        const product = products[(i * 5 + j * 7) % products.length];
        const quantity = 1 + ((i + j) % 3);
        const subtotal = product.price * quantity;
        totalAmount += subtotal;

        items.push(
          this.orderItemRepo.create({
            productId: product.id,
            productName: product.name,
            productImageUrl: product.imageUrl,
            price: product.price,
            quantity,
            subtotal,
            note: i % 9 === 0 && j === 0 ? 'ít đá' : null,
          }),
        );
      }

      const status = allStatuses[i % allStatuses.length];
      const order = this.orderRepo.create({
        tableId: table.id,
        tableToken: table.qrToken,
        status,
        paidStatus:
          status !== OrderStatus.CANCELLED &&
          status === OrderStatus.COMPLETED &&
          i % 3 === 0,
        totalAmount,
        estimatedWaitMinutes: 2 + (i % 12),
        note: i % 12 === 0 ? 'đơn test' : null,
        paymentRequested:
          status !== OrderStatus.CANCELLED &&
          status !== OrderStatus.PENDING &&
          i % 4 === 0,
        items,
      });
      await this.orderRepo.save(order);
    }

    this.logger.log(`Seeded ${targetOrders} fake orders`);
  }

  private async syncTableCurrentOrders() {
    const tables = await this.tableRepo.find();

    for (const table of tables) {
      const latestActive = await this.orderRepo
        .createQueryBuilder('o')
        .where('o.tableId = :tableId', { tableId: table.id })
        .andWhere('o.status != :cancelledStatus', { cancelledStatus: OrderStatus.CANCELLED })
        .andWhere('(o.paidStatus = :isUnpaid OR o.status != :completedStatus)', {
          isUnpaid: false,
          completedStatus: OrderStatus.COMPLETED,
        })
        .orderBy('o.createdAt', 'DESC')
        .getOne();
      table.status = latestActive ? TableStatus.OCCUPIED : TableStatus.AVAILABLE;
    }

    await this.tableRepo.save(tables);
    this.logger.log('Synced table states from active orders');
  }
}
