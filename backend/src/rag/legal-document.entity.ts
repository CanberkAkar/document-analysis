import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum DocumentStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  ERROR = 'error',
}

@Entity('legal_documents')
export class LegalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column({ default: 0 })
  chunksProcessed: number;

  @Column({
    type: 'varchar',
    default: DocumentStatus.PROCESSING,
  })
  status: DocumentStatus;

  @CreateDateColumn()
  uploadedAt: Date;
}
