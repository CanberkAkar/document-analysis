import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { LegalDocument } from './legal-document.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LegalDocument])],
  controllers: [RagController],
  providers: [RagService],
})
export class RagModule {}
