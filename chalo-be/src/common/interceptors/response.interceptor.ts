import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, unknown> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Route @Sse() phát ra Observable<MessageEvent>: interceptor .map() sẽ bọc TỪNG
    // item thành {code,message,data:{type,data}}, đẩy `type` xuống một tầng. NestJS
    // SseStream cần `type` ở top-level để ghi dòng `event: <tên>`; mất nó thì trình
    // duyệt nhận mọi sự kiện dưới dạng "message" ẩn danh và FE (addEventListener theo
    // tên) không bao giờ nghe được. Nhận diện SSE theo đúng metadata NestJS tự dùng
    // và trả stream nguyên bản.
    if (Reflect.getMetadata(SSE_METADATA, context.getHandler())) {
      return next.handle();
    }

    const httpCtx = context.switchToHttp();
    const response = httpCtx.getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        // NestJS đã set statusCode (mặc định 201 cho POST, 200 cho GET/PUT/DELETE,
        // hoặc giá trị từ @HttpCode()). Đọc lại thay vì tự ý quyết định.
        const code = response.statusCode || 200;
        return {
          code,
          message: 'success',
          data: data ?? null,
        };
      }),
    );
  }
}
