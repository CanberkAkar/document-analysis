import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpenAIEmbeddings, ChatOpenAI } from '@langchain/openai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { LegalDocument, DocumentStatus } from './legal-document.entity';
import { PROMPTS } from '../common/prompts/prompts';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private vectorStore: QdrantVectorStore;
  private embeddings: OpenAIEmbeddings;
  private llm: ChatOpenAI;

  constructor(
    @InjectRepository(LegalDocument)
    private readonly documentRepository: Repository<LegalDocument>,
  ) {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build', // Canlıda mutlaka .env'den gelmeli
    });

    this.llm = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY || 'dummy_key_for_build',
      modelName: 'gpt-4o',
      temperature: 0,
    });

    void this.initializeVectorStore();
  }

  private async initializeVectorStore() {
    try {
      this.vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        {
          url: process.env.QDRANT_URL || 'http://localhost:6333',
          collectionName: 'legal_documents',
        },
      );
      this.logger.log('Qdrant Vector Store initialized successfully');
    } catch {
      this.logger.warn(
        'Qdrant collection might not exist yet or connection failed. It will be created upon first insertion.',
      );
      // Fallback for creating it during first document insertion
    }
  }

  /**
   * Doküman meta verisini PostgreSQL'de senkron olarak oluşturur.
   */
  async createDocumentMeta(filename: string): Promise<LegalDocument> {
    const docMeta = this.documentRepository.create({
      filename,
      status: DocumentStatus.PROCESSING,
      chunksProcessed: 0,
    });
    return this.documentRepository.save(docMeta);
  }

  /**
   * PDF dosyasını yükler, parçalara (chunks) ayırır ve vektör veritabanına kaydeder.
   */
  async processAndStoreDocument(
    filePath: string,
    docId: string,

    metadata: any = {},
  ) {
    this.logger.log(
      `Processing document in background: ${filePath} (${docId})`,
    );

    const savedDoc = await this.documentRepository.findOne({
      where: { id: docId },
    });
    if (!savedDoc) {
      throw new Error(`Document metadata not found for ID: ${docId}`);
    }

    try {
      // 1. Dokümanı Yükleme (PDF Parsing)
      const loader = new PDFLoader(filePath, { splitPages: false });
      const rawDocs = await loader.load();

      if (!rawDocs || rawDocs.length === 0) {
        throw new Error('PDF dosyasından metin okunamadı.');
      }

      // 2. Metin Bölütleme (Semantic Chunking - Recursive)
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await textSplitter.splitDocuments(rawDocs);

      // Metadata zenginleştirme
      const enrichedDocs = docs.map(
        (doc) =>
          new Document({
            pageContent: doc.pageContent,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            metadata: {
              ...doc.metadata,
              ...metadata,
              documentId: savedDoc.id,
              source: savedDoc.filename,
              processedAt: new Date().toISOString(),
            },
          }),
      );

      // 3. Vector DB'ye Yazma
      this.logger.log(`Storing ${enrichedDocs.length} chunks into Qdrant...`);

      // Eğer collection yoksa fromDocuments ile otomatik oluşturulur

      this.vectorStore = await QdrantVectorStore.fromDocuments(
        enrichedDocs as Document<Record<string, any>>[],
        this.embeddings,
        {
          url: process.env.QDRANT_URL || 'http://localhost:6333',
          collectionName: 'legal_documents',
        },
      );

      this.logger.log(`Successfully stored ${enrichedDocs.length} chunks.`);

      // 4. Update status to READY
      savedDoc.chunksProcessed = enrichedDocs.length;
      savedDoc.status = DocumentStatus.READY;
      await this.documentRepository.save(savedDoc);

      return {
        success: true,
        chunksProcessed: enrichedDocs.length,
        id: savedDoc.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error processing document: ${errorMessage}`,
        errorStack,
      );
      savedDoc.status = DocumentStatus.ERROR;
      await this.documentRepository.save(savedDoc);
      throw error;
    }
  }

  /**
   * Yüklenen tüm dokümanları veritabanından listeler.
   */
  async listDocuments(): Promise<LegalDocument[]> {
    return this.documentRepository.find({
      order: { uploadedAt: 'DESC' },
    });
  }

  /**
   * Tek bir doküman kaydını getirir.
   */
  async getDocument(id: string): Promise<LegalDocument | null> {
    return this.documentRepository.findOne({ where: { id } });
  }

  /**
   * Dokümanı veritabanından siler, diskteki PDF'ini kaldırır ve Qdrant üzerindeki karşılık gelen metin parçalarını kaldırır.
   */
  async deleteDocument(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Deleting document: ${id}`);

    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new Error('Doküman bulunamadı.');
    }

    // Delete physical file from disk
    const filePath = path.join(os.tmpdir(), 'uploads', `${id}.pdf`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Deleted physical file: ${filePath}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not delete physical file: ${msg}`);
    }

    // Attempt to delete chunks from Qdrant vector store
    try {
      if (this.vectorStore?.client) {
        await this.vectorStore.client.delete('legal_documents', {
          filter: {
            must: [
              {
                key: 'metadata.documentId',
                match: {
                  value: id,
                },
              },
            ],
          },
        });
        this.logger.log(
          `Successfully deleted vector chunks from Qdrant for documentId: ${id}`,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Could not delete vector chunks from Qdrant: ${msg}`);
    }

    await this.documentRepository.delete(id);
    this.logger.log(
      `Successfully deleted document metadata from PostgreSQL for id: ${id}`,
    );

    return { success: true, message: 'Doküman başarıyla silindi.' };
  }

  /**
   * Hybrid Search veya Semantic Search kullanarak sorulara cevap verir (Q&A)
   */
  async askQuestion(question: string) {
    this.logger.log(`Answering question: ${question}`);

    if (!this.vectorStore) {
      throw new Error(
        'Vector store is not initialized. Please upload a document first.',
      );
    }

    // Arama Algoritması: Qdrant üzerinde Semantic Search (İleride Sparse/BM25 Hybrid eklenebilir)
    const retriever = this.vectorStore.asRetriever({
      k: 4, // En alakalı 4 dokümanı getir
      // searchType: "similarity" | "mmr"
      searchType: 'mmr', // Maximum Marginal Relevance ile daha çeşitli sonuçlar getirir
      searchKwargs: {
        fetchK: 10,
      },
    });

    const retrievedDocs = await retriever.invoke(question);

    // Prompt oluşturma ve Generation
    const context = retrievedDocs.map((doc) => doc.pageContent).join('\n\n');

    const prompt = PROMPTS.RAG_QA.replace('{context}', context).replace(
      '{question}',
      question,
    );

    const response = await this.llm.invoke(prompt);

    // TODO: Self-RAG reflection eklenecek

    return {
      answer: response.content,
      citations: retrievedDocs.map((doc) => {
        const source = (doc.metadata?.source as string) || 'Bilinmeyen Kaynak';
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const page = (doc.metadata?.loc?.pageNumber as string) || 'Bilinmiyor';
        return {
          source,
          page,
          preview: doc.pageContent.substring(0, 100) + '...',
        };
      }),
    };
  }

  /**
   * PDF dosyasını okuyarak yapılandırılmış hukuki özet raporu üretir.
   */
  async summarizeDocument(id: string) {
    this.logger.log(`Summarizing document: ${id}`);
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new Error('Doküman bulunamadı.');
    }
    const filePath = path.join(os.tmpdir(), 'uploads', `${id}.pdf`);
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF dosyası bulunamadı.');
    }

    const loader = new PDFLoader(filePath, { splitPages: false });
    const rawDocs = await loader.load();
    if (!rawDocs || rawDocs.length === 0) {
      throw new Error('PDF dosyasından metin okunamadı.');
    }

    const fullText = rawDocs.map((d) => d.pageContent).join('\n');
    const prompt = PROMPTS.SUMMARIZE.replace('{documentText}', fullText);

    const response = await this.llm.invoke(prompt);
    return {
      summary: response.content,
    };
  }

  /**
   * Değişkenlere göre resmi formatta hukuki belge taslağı hazırlar.
   */
  async generateDraft(templateType: string, variables: any) {
    this.logger.log(`Generating draft for template: ${templateType}`);
    const promptTemplate = PROMPTS.GENERATE_DRAFT;
    const varsString = Object.entries(variables as Record<string, any>)
      .map(([key, val]) => `${key}: ${String(val)}`)
      .join('\n');

    const prompt = promptTemplate
      .replace(/{templateType}/g, templateType)
      .replace('{variables}', varsString);

    const response = await this.llm.invoke(prompt);
    return {
      draft: response.content,
    };
  }
}
