import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly requestCounts = new Map<string, number>();
  private totalDurationMilliseconds = 0;

  recordHttpRequest(method: string, statusCode: number, durationMilliseconds: number): void {
    const key = `${method.toUpperCase()}|${statusCode}`;
    this.requestCounts.set(key, (this.requestCounts.get(key) ?? 0) + 1);
    this.totalDurationMilliseconds += durationMilliseconds;
  }

  renderPrometheus(): string {
    const rows = [
      '# HELP chalo_http_requests_total Total completed HTTP requests.',
      '# TYPE chalo_http_requests_total counter',
      ...[...this.requestCounts.entries()].map(([key, count]) => {
        const [method, status] = key.split('|');
        return `chalo_http_requests_total{method="${method}",status="${status}"} ${count}`;
      }),
      '# HELP chalo_http_request_duration_milliseconds_total Sum of completed HTTP request durations.',
      '# TYPE chalo_http_request_duration_milliseconds_total counter',
      `chalo_http_request_duration_milliseconds_total ${this.totalDurationMilliseconds}`,
    ];
    return `${rows.join('\n')}\n`;
  }
}
