import { Controller, Header, Param, Sse, MessageEvent } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Observable, map } from 'rxjs';
import { SseService } from './sse.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('SSE')
@ApiBearerAuth('JWT-auth')
@Controller('order')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Sse('events')
  @Header('Cache-Control', 'no-cache')
  @Header('X-Accel-Buffering', 'no')
  @ApiOperation({
    summary: 'SSE stream — nhân viên nhận sự kiện real-time',
    description: [
      'Sự kiện phát: `new_order`, `payment_request`, `order_status_changed`, `order_prep_progress`.',
      'Browser EventSource không gửi header → truyền token qua query param `?token=<accessToken>`.',
    ].join('\n'),
  })
  @ApiQuery({ name: 'token', required: false, description: 'Access token (dùng thay cho Bearer header khi dùng EventSource)' })
  @ApiOkResponse({
    description: 'SSE stream opened',
    schema: { example: { code: 200, message: 'success', data: 'text/event-stream' } },
  })
  events(): Observable<MessageEvent> {
    return this.sseService.stream().pipe(
      map((event) => ({
        type: event.type,
        data: event.data,
      })),
    );
  }

  @Sse('events/by-table/:token')
  @Public()
  @SkipThrottle()
  @Header('Cache-Control', 'no-cache')
  @Header('X-Accel-Buffering', 'no')
  @ApiOperation({
    summary: 'SSE stream công khai cho khách — chỉ sự kiện của bàn theo qrToken',
    description:
      'Sự kiện phát: `order_status_changed`, `payment_completed`, `new_order` (lọc theo tableToken).',
  })
  @ApiOkResponse({
    description: 'SSE stream opened',
    schema: { example: { code: 200, message: 'success', data: 'text/event-stream' } },
  })
  eventsByTable(@Param('token') token: string): Observable<MessageEvent> {
    return this.sseService.streamForTable(token).pipe(
      map((event) => ({
        type: event.type,
        data: event.data,
      })),
    );
  }
}
