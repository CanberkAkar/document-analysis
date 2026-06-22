import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Get,
  Query,
  Delete,
  Param,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { RagService } from './rag.service';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

class AskQuestionDto {
  question: string;
}

@ApiTags('RAG (Retrieval-Augmented Generation)')
@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('upload')
  @ApiOperation({
    summary:
      'Yeni bir hukuki doküman (PDF) yükler ve vektör tabanına indeksler.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('Dosya yüklenemedi veya dosya bulunamadı.');
    }

    // Ensure uploads directory exists permanently
    const uploadsDir = path.join(os.tmpdir(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create metadata record synchronously first to obtain UUID
    const docMeta = await this.ragService.createDocumentMeta(file.originalname);

    // Save file physically with the UUID as filename
    const filePath = path.join(uploadsDir, `${docMeta.id}.pdf`);
    fs.writeFileSync(filePath, file.buffer);

    // Start background processing using the saved PDF path
    this.ragService
      .processAndStoreDocument(filePath, docMeta.id)
      .then(() => {
        // Background index successful
      })
      .catch(() => {
        // Logged in service
      });

    return {
      message: 'Dosya başarıyla alındı ve indeksleme kuyruğuna eklendi.',
      filename: file.originalname,
      chunksProcessed: 0,
    };
  }

  @Post('ask')
  @ApiOperation({
    summary:
      'Sisteme yüklenmiş dokümanlar içerisinde (Hybrid/MMR) arama yapar ve AI ile cevap üretir.',
  })
  async askQuestionPost(@Body() dto: AskQuestionDto) {
    if (!dto.question) {
      return { error: 'Soru parametresi (question) zorunludur.' };
    }
    return this.ragService.askQuestion(dto.question);
  }

  @Get('ask')
  @ApiOperation({
    summary:
      'Sisteme yüklenmiş dokümanlar içerisinde (Hybrid/MMR) arama yapar ve AI ile cevap üretir.',
  })
  async askQuestionGet(@Query('question') question: string) {
    if (!question) {
      return { error: 'Soru parametresi (question) zorunludur.' };
    }
    return this.ragService.askQuestion(question);
  }

  @Get('documents')
  @ApiOperation({
    summary: 'Sisteme yüklenmiş dokümanların listesini getirir.',
  })
  async getDocuments() {
    return this.ragService.listDocuments();
  }

  @Get('history')
  @ApiOperation({ summary: 'Sorgu geçmişini listeler.' })
  getHistory() {
    return [];
  }

  @Delete('documents/:id')
  @ApiOperation({
    summary:
      'Yüklenen bir dokümanı ve vektör tabanındaki metin parçalarını siler.',
  })
  async deleteDocument(@Param('id') id: string) {
    return this.ragService.deleteDocument(id);
  }

  @Post('documents/:id/summarize')
  @ApiOperation({
    summary:
      'Yüklenen bir hukuki dokümanın detaylı özetini ve analiz raporunu çıkarır.',
  })
  async summarizeDocument(@Param('id') id: string) {
    return this.ragService.summarizeDocument(id);
  }

  @Post('generate-draft')
  @ApiOperation({
    summary:
      'Belirli değişkenlere göre resmi formatta hukuki belge taslağı hazırlar.',
  })
  async generateDraft(@Body() dto: { templateType: string; variables: any }) {
    return this.ragService.generateDraft(dto.templateType, dto.variables);
  }

  @Get('documents/:id/preview')
  @ApiOperation({ summary: 'PDF dokümanının önizlemesini sunar.' })
  async previewDocument(
    @Param('id') id: string,

    @Res() res: any,
  ) {
    const doc = await this.ragService.getDocument(id);
    if (!doc) {
      throw new NotFoundException('Doküman bulunamadı.');
    }
    const filePath = path.join(os.tmpdir(), 'uploads', `${doc.id}.pdf`);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('PDF dosyası bulunamadı.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    res.setHeader('Content-Type', 'application/pdf');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(doc.filename)}"`,
    );
    const stream = fs.createReadStream(filePath);

    stream.pipe(res);
  }
}
