import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LegalDocument } from './legal-document.entity';

jest.mock('@langchain/openai', () => {
  return {
    OpenAIEmbeddings: jest.fn().mockImplementation(() => {
      return {};
    }),
    ChatOpenAI: jest.fn().mockImplementation(() => {
      return {
        invoke: jest.fn().mockResolvedValue({ content: 'Mock response' }),
      };
    }),
  };
});

jest.mock('@langchain/qdrant', () => {
  return {
    QdrantVectorStore: {
      fromExistingCollection: jest.fn().mockResolvedValue({}),
      fromDocuments: jest.fn().mockResolvedValue({}),
    },
  };
});

describe('RagService', () => {
  let service: RagService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RagService,
        {
          provide: getRepositoryToken(LegalDocument),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
