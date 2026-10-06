import { Controller, Get } from '@nestjs/common';
import { DbService } from './db.service';

@Controller()
export class HealthController {
  constructor(private readonly db: DbService) {}
  @Get('health')
  async health() {
    await this.db.query('SELECT 1');
    return { ok: true, service: 'research-portal-api' };
  }
}
