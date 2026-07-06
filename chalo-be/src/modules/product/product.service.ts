import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateProductStatusDto } from './dto/update-product.dto';
import { CategoryService } from '../category/category.service';
import { ProductStatus } from '../../common/enums/product-status.enum';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    private readonly categoryService: CategoryService,
  ) {}

  private buildDto(product: Product) {
    return {
      id: product.id,
      categoryId: product.categoryId,
      categoryName: product.category?.name ?? null,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      price: product.price,
      status: product.status,
      isActive: product.isActive,
      sortOrder: product.sortOrder,
      prepTime: product.prepTime,
      createdAt: product.createdAt,
    };
  }

  async list() {
    const products = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.isActive = true')
      .andWhere('p.status = :status', { status: ProductStatus.AVAILABLE })
      .orderBy('p.sortOrder', 'ASC')
      .addOrderBy('p.createdAt', 'ASC')
      .getMany();
    return products.map((p) => this.buildDto(p));
  }

  async page(query: {
    pageNo?: number;
    pageSize?: number;
    name?: string;
    categoryId?: string;
    status?: string;
    isActive?: boolean;
  }) {
    const { pageNo = 1, pageSize = 10, name, categoryId, status, isActive } = query;
    const skip = (pageNo - 1) * pageSize;

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c');

    if (name) qb.andWhere('p.name ILIKE :name', { name: `%${name}%` });
    if (categoryId) qb.andWhere('p.categoryId = :categoryId', { categoryId });
    if (status) qb.andWhere('p.status = :status', { status });
    if (isActive !== undefined) qb.andWhere('p.isActive = :isActive', { isActive });

    qb.orderBy('p.createdAt', 'DESC').skip(skip).take(pageSize);
    const [products, total] = await qb.getManyAndCount();
    return { list: products.map((p) => this.buildDto(p)), total };
  }

  async detail(id: string) {
    const product = await this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.id = :id', { id })
      .getOne();
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    return this.buildDto(product);
  }

  async simpleList(categoryId?: string) {
    const qb = this.productRepo
      .createQueryBuilder('p')
      .select(['p.id', 'p.name', 'p.price']);
    if (categoryId) qb.where('p.categoryId = :categoryId', { categoryId });
    return qb.getMany();
  }

  async create(dto: CreateProductDto) {
    await this.categoryService.detail(dto.categoryId);
    const product = this.productRepo.create(dto);
    const saved = await this.productRepo.save(product);
    return this.detail(saved.id);
  }

  async update(dto: UpdateProductDto) {
    await this.detail(dto.id);
    await this.categoryService.detail(dto.categoryId);
    await this.productRepo.update(dto.id, {
      name: dto.name,
      categoryId: dto.categoryId,
      description: dto.description,
      imageUrl: dto.imageUrl,
      price: dto.price,
      prepTime: dto.prepTime,
      sortOrder: dto.sortOrder,
      status: dto.status,
      isActive: dto.isActive,
    });
    return this.detail(dto.id);
  }

  async updateStatus(dto: UpdateProductStatusDto) {
    await this.detail(dto.id);
    await this.productRepo.update(dto.id, { status: dto.status });
    return this.detail(dto.id);
  }

  async delete(id: string) {
    const product = await this.productRepo.findOneBy({ id });
    if (!product) throw new NotFoundException('Sản phẩm không tồn tại');
    const orderCount = await this.orderItemRepo.count({ where: { productId: id } });
    if (orderCount > 0) {
      throw new BadRequestException('Không thể xóa sản phẩm đã có trong đơn hàng');
    }
    await this.productRepo.remove(product);
    return null;
  }
}
