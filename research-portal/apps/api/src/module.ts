import { Module } from '@nestjs/common';
import { DbService } from './db.service';
import { AuthController, SessionGuard } from './auth';
import { ParticipantController } from './participant';
import { ResearcherController } from './researcher';
import { ImportService } from './imports';
import { HealthController } from './status';

@Module({
  controllers: [AuthController, ParticipantController, ResearcherController, HealthController],
  providers: [DbService, SessionGuard, ImportService]
})
export class AppModule {}
