# Akademik ve Teknik Referanslar (References & Citations)

Bu belge, AI Destekli Hukuk Asistanı projesinin geliştirilmesinde yararlanılan akademik literatür, teknik kütüphaneler, tasarım örüntüleri ve resmi dokümantasyon kaynaklarını içermektedir.

---

## 1. Akademik Literatür & Algoritmalar

### 1.1. RAG (Retrieval-Augmented Generation)
*   **Makale:** *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* (Lewis, P. et al., 2020)
*   **Özet:** Harici bir vektör veritabanından veri çekerek dil modelinin (LLM) ürettiği yanıtların doğruluğunu artıran ve halüsinasyonları azaltan temel mimari. Bu projede hukuk belgelerinin analizi için RAG mimarisi temel alınmıştır.
*   **Link:** [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)

### 1.2. MMR (Maximal Marginal Relevance)
*   **Makale:** *The use of MMR in multi-document summarization* (Carbonell, J., & Goldstein, J., 1998)
*   **Özet:** Vektör aramalarında benzerlik (similarity) kriterinin yanı sıra bilgi çeşitliliğini (diversity) de hesaba katarak birbirine çok benzeyen tekrarlı metin parçacıkları yerine konuyu farklı açılardan ele alan dökümanları seçen algoritma. Projede LangChain retriever modülünde `searchType: "mmr"` olarak kullanılmıştır.
*   **Link:** [ACM Digital Library](https://dl.acm.org/doi/10.1145/290941.291025)

---

## 2. Teknik Kütüphaneler & Dokümantasyonlar

### 2.1. LangChain.js
*   **Tanım:** Büyük Dil Modelleri (LLMs) ile uygulama geliştirmeyi kolaylaştıran zincirleme (chaining) kütüphanesi.
*   **Kullanım:** PDF dökümanlarının okunması (`PDFLoader`), metinlerin bölünmesi (`RecursiveCharacterTextSplitter`) ve vektör veri tabanına indekslenmesi süreçlerinde kullanılmıştır.
*   **Dokümantasyon:** [LangChain JS/TS Docs](https://js.langchain.com/docs/)

### 2.2. Qdrant Vektör Veritabanı
*   **Tanım:** Yüksek performanslı, ölçeklenebilir, API odaklı vektör arama ve depolama motoru.
*   **Kullanım:** Hukuk dökümanlarından elde edilen gömmelerin (embeddings) saklanması ve MMR tabanlı anlamsal aramaların gerçekleştirilmesinde kullanılmıştır.
*   **Dokümantasyon:** [Qdrant Documentation](https://qdrant.tech/documentation/)

### 2.3. NestJS (Node.js MVC Framework)
*   **Tanım:** Kurumsal düzeyde, modüler ve TypeScript tabanlı sunucu tarafı uygulamaları geliştirmek için progressive Node.js framework.
*   **Kullanım:** Güvenlik (JWT Auth), veri yönetimi (TypeORM/PostgreSQL) ve RAG API katmanlarının modüler mimari ile oluşturulması için kullanılmıştır.
*   **Dokümantasyon:** [NestJS Documentation](https://docs.nestjs.com/)

### 2.4. Next.js (React Framework)
*   **Tanım:** Sunucu tarafı render etme (SSR), statik site oluşturma ve App Router mimarisi sunan modern React framework'ü.
*   **Kullanım:** Avukat masaüstü (dashboard) arayüzleri, döküman yönetimi ve sohbet panellerinin oluşturulmasında kullanılmıştır.
*   **Dokümantasyon:** [Next.js Documentation](https://nextjs.org/docs)

---

## 3. DevOps & Veri Tabanı Mimarisi

### 3.1. PostgreSQL & TypeORM
*   **Kullanım:** Doküman meta-verilerinin saklanması, kullanıcı rolleri ve ilişkisel veri yönetimi için kullanılmıştır.
*   **Dokümantasyon:** [TypeORM Docs](https://typeorm.io/)

### 3.2. Docker & Containerization
*   **Kullanım:** Geliştirme ve yaygınlaştırma (deployment) ortamlarının standartlaştırılması amacıyla Frontend, Backend, PostgreSQL ve Qdrant servislerinin `docker-compose` ile orkestre edilmesi sağlanmıştır.
*   **Dokümantasyon:** [Docker Compose Docs](https://docs.docker.com/compose/)
