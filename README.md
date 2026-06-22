# AI Destekli Hukuk Asistanı (AI Document Analysis)

Bu proje, hukuk dökümanlarının (sözleşmeler, dilekçeler, yönetmelikler vb.) yüklenip yapay zeka yardımıyla analiz edilmesi, yönetici özetleri, hak/yükümlülük analizleri ve süre takipleri çıkarılması ile bu belgeler üzerinde atıflı soru-cevap yapılması (RAG - Retrieval-Augmented Generation) için geliştirilmiş modern bir web uygulamasıdır.

---

## 🚀 Teknolojik Altyapı (Tech Stack)

### **Frontend**
*   **Framework:** [Next.js 16 (App Router)](https://nextjs.org)
*   **Dil:** TypeScript
*   **Tasarım & Stil:** Vanilla CSS & TailwindCSS (Arayüz bileşenleri için)

### **Backend**
*   **Framework:** [NestJS](https://nestjs.com) (Modular, MVC architecture)
*   **Veritabanı:** PostgreSQL (İlişkisel veriler, kullanıcılar ve doküman meta-verileri için)
*   **ORM:** TypeORM
*   **Logging:** NestJS Pino

### **Yapay Zeka & RAG (Retrieval-Augmented Generation)**
*   **LLM Modeli:** OpenAI `gpt-4o` (Temperature: 0)
*   **Vektör Veritabanı:** [Qdrant](https://qdrant.tech) (Vektör gömmeleri ve anlamsal arama)
*   **Vektör Gömmeleri (Embeddings):** OpenAI `text-embedding-3-small`
*   **Arama Algoritması:** Maximal Marginal Relevance (MMR) ile veri çeşitliliği odaklı bağlam (context) üretimi
*   **Orkestrasyon:** LangChain.js

---

## 📂 Proje Yapısı (Directory Structure)

*   `frontend/` - Next.js kullanıcı arayüzü kodları
*   `backend/` - NestJS API ve RAG mantık kodları
*   `documents/` - Test amaçlı yüklenen örnek hukuk belgeleri ve PDF'ler
*   `docker-compose.yml` - Tüm servisleri tek komutla çalıştırmayı sağlayan Docker konfigürasyonu
*   `AI_DEVELOPMENT_LOG.md` - Yapay zeka tasarımı, prompt yapıları ve MMR optimizasyonu notları
*   `REFERENCES.md` - Projede kullanılan akademik kaynaklar ve kütüphaneler

---

## 🛠️ Kurulum ve Çalıştırma

### **1. Docker ile Hızlı Başlangıç (Önerilen)**

Tüm servisleri (Frontend, Backend, PostgreSQL, Qdrant) tek bir komutla derlemek ve ayağa kaldırmak için projenin kök dizininde şu komutu çalıştırabilirsiniz:

```bash
docker compose up --build -d
```

Servisler ayağa kalktıktan sonra:
*   **Frontend (Arayüz):** `http://localhost:3001` adresinden erişilebilir.
*   **Backend (API):** `http://localhost:3000` adresinden çalışır.
*   **Swagger API Dokümantasyonu:** `http://localhost:3000/api/docs` adresinden incelenebilir.

---

### **2. Yerel Geliştirme (Local Development)**

Servisleri yerel olarak çalıştırmak isterseniz:

#### **Ön Hazırlık**
1.  Kök dizindeki `.env.example` dosyasını `.env` olarak kopyalayın:
    ```bash
    cp .env.example .env
    ```
2.  `.env` dosyası içerisindeki `OPENAI_API_KEY` alanına kendi OpenAI API anahtarınızı girin.

#### **Backend Kurulumu**
```bash
cd backend
npm install
npm run start:dev
```

#### **Frontend Kurulumu**
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🔒 Güvenlik

*   **Veri İletişimi:** Frontend ile Backend arasındaki tüm API istekleri `EncryptionMiddleware` kullanılarak AES-256-CBC & SHA-256 algoritmalarıyla şifreli olarak taşınmaktadır.
*   **Yetkilendirme:** API uç noktaları JWT (JSON Web Token) tabanlı koruma altındadır.
*   **Veri Gizliliği:** Kullanıcıların yüklediği PDF dosyaları güvenli bir şekilde ayrıştırılıp vektörleştirilir ve RAG sorguları esnasında sadece gerekli metin parçacıkları LLM'e bağlam olarak gönderilir.
