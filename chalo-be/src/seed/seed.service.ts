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
      { name: 'Capuchino Lanh', price: 39000 },
      { name: 'Chalo Coffee Dac Biet', price: 39000 },
      { name: 'Chalo Coffee Den Nau', price: 29000 },
      { name: 'Ca Phe Kem Sua Hanh Nhan', price: 39000 },
      { name: 'Ca Phe Kem Sua Dua', price: 39000 },
      { name: 'Ca Cao Sua Dua', price: 44000 },
      { name: 'Ca Phe Kem Muoi', price: 34000 },
      { name: 'Cacao Kem Muoi', price: 39000 },
      { name: 'Ca Phe Bac Xiu', price: 34000 },
      { name: 'Ca Phe Sua Tuoi Caramel', price: 34000 },
      { name: 'Queen Nu Hoang', price: 34000 },
    ],
  },
  {
    category: 'Matcha',
    items: [
      { name: 'Bau Troi Xanh', price: 48000 },
      { name: 'Dai Duong Xanh', price: 48000 },
      { name: 'Thao Nguyen Xanh', price: 48000 },
      { name: 'Hoa Vang Tren Co Xanh', price: 48000 },
      { name: 'Hong Hai Nhi', price: 54000 },
      { name: 'Matcha Latte', price: 39000 },
      { name: 'Matcha Tra Sen', price: 48000 },
    ],
  },
  {
    category: 'Tra Dam Vi - Tra Sua',
    items: [
      { name: 'Tra Sua Chalo Nguyen Vi', price: 34000 },
      { name: 'Tra Sua Chalo Mix Vi', price: 39000 },
      { name: 'Tra Sua Chalo Viet Quat', price: 39000 },
      { name: 'Tra Sua Chalo Chanh Leo Thach Dua', price: 39000 },
      { name: 'Tra Dao Cam Que Nong', price: 39000 },
      { name: 'Tra Dao Ton Ngo Khong', price: 48000 },
      { name: 'Tra Cu Chalo Dam Vi', price: 45000 },
      { name: 'Phuong Hoang', price: 48000 },
      { name: 'Hang Nga', price: 48000 },
      { name: 'Sac Xuan', price: 58000 },
    ],
  },
  {
    category: 'Trai Cay Tuoi',
    items: [
      { name: 'Sinh To Trai Cay Theo Mua', price: 48000 },
      { name: 'Sinh To Sua Chua Mat Ong', price: 55000 },
      { name: 'Sinh To Sau Rieng', price: 69000 },
      { name: 'Nuoc Ep Dua', price: 39000 },
      { name: 'Nuoc Ep Dua Hau', price: 39000 },
      { name: 'Nuoc Ep Cam', price: 39000 },
      { name: 'Nuoc Ep Luu', price: 48000 },
      { name: 'Trang Non', price: 54000 },
    ],
  },
  {
    category: 'Sua Chua',
    items: [
      { name: 'Bay Lac Cung Chalo', price: 48000 },
      { name: 'Chu Cuoi', price: 48000 },
      { name: 'Mo Suong', price: 39000 },
      { name: 'Sua Chua Ca Phe', price: 39000 },
      { name: 'Sua Chua Xoai', price: 39000 },
      { name: 'Sua Chua Viet Quat', price: 39000 },
      { name: 'Sua Chua Dua', price: 39000 },
    ],
  },
  {
    category: 'Do An Vat',
    items: [
      { name: 'Bim Bim', price: 8000, prepTime: 1 },
      { name: 'Hat Huong Duong', price: 15000, prepTime: 1 },
      { name: 'Hat Bi Hat Dua', price: 19000, prepTime: 1 },
      { name: 'Kho Ga Kho Bo Kho Heo', price: 19000, prepTime: 1 },
      { name: 'Snack Bong Ngo My', price: 19000, prepTime: 1 },
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

    await this.resetAllData();
    await this.seedUsers();
    const categories = await this.seedCategoriesFromMenu();
    const products = await this.seedProductsFromMenu(categories);
    const tables = await this.seedTables(25);
    await this.seedOrders(products, tables, 250);
    await this.syncTableCurrentOrders();
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
          name: `Ban ${String(i).padStart(2, '0')}`,
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
            note: i % 9 === 0 && j === 0 ? 'it da' : null,
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
        note: i % 12 === 0 ? 'don test' : null,
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
