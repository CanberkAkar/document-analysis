# Yapay Zeka Geliştirme Günlüğü (AI Development Log)

Bu belge, AI Destekli Hukuk Asistanı projesinin yapay zeka (LLM, Embedding, RAG) katmanlarının tasarım kararlarını, prompt tasarımlarını, model tercihlerini ve optimizasyon süreçlerini detaylandırmaktadır.

---

## 1. Mimari Kararlar ve Model Tercihleri

### 1.1. Dil Modeli (LLM) Seçimi
*   **Seçilen Model:** `gpt-4o` (OpenAI)
*   **Gerekçe:** Hukuk belgeleri yüksek dilsel hassasiyet, karmaşık uzun vadeli bağımlılıkları anlama ve terimsel doğruluk gerektirir. `gpt-4o` modeli, Türkçe dil desteğinde ve hukuki mantık yürütme testlerinde en yüksek performansı vermektedir.
*   **Parametreler:**
    *   `temperature: 0` -> Hukuki metin analizlerinde halüsinasyon riskini en aza indirmek ve kararlı/tutarlı cevaplar almak amacıyla en düşük yaratıcılık seviyesi tercih edilmiştir.

### 1.2. Vektör Gömmeleri (Vector Embeddings)
*   **Seçilen Model:** `text-embedding-3-small` veya varsayılan OpenAI Embeddings.
*   **Metin Bölümleme (Text Chunking):**
    *   `chunkSize: 1000` karakter.
    *   `chunkOverlap: 200` karakter.
    *   **Algoritma:** `RecursiveCharacterTextSplitter`. Paragrafları ve anlam bütünlüğünü korumak adına sırasıyla çift satır, tek satır ve boşluk karakterlerine göre dinamik bölme uygulanır.

---

## 2. Prompt Tasarımları (System Instructions)

Tüm promptlar kod kalitesini artırmak ve sürüm kontrolü (version control) sağlamak amacıyla `backend/src/common/prompts/prompts.ts` dosyasında merkezileştirilmiştir.

### 2.1. Soru-Cevap & RAG Promptu
*   **Görevi:** Kullanıcının sorduğu soruları, vektör veritabanından çekilen hukuki bağlam (context) dahilinde yanıtlamak.
*   **Tasarım:**
    ```text
    Sen uzman bir hukuk asistanısın. Aşağıda sağlanan bağlamı kullanarak kullanıcının sorusuna cevap ver.
    Cevaplarında mutlaka hangi bağlama dayandığını belirt. Eğer bağlamda sorunun cevabı yoksa, bilmediğini söyle.
    
    Bağlam (Context):
    {context}
    
    Soru:
    {question}
    ```

### 2.2. Doküman Özetleme ve Analiz Promptu
*   **Görevi:** Yüklenen PDF dokümanını analiz ederek yapılandırılmış bir yönetici özeti, önemli tarihler ve yasal hak/yükümlülükler listesi çıkarmak.
*   **Tasarım:**
    ```text
    Sen profesyonel bir hukuk asistanısın. Aşağıdaki döküman metnini dikkatle analiz et ve Türkçe dilinde ayrıntılı bir rapor hazırla.
    Raporu mutlaka şu başlıklar altında Markdown formatında oluştur:

    # Hukuki Analiz ve Özet Raporu
    
    ## 1. Yönetici Özeti (Executive Summary)
    Dökümanın konusunu, amacını ve genel özetini buraya yaz.

    ## 2. Önemli Tarihler ve Süre Sınırları (Key Dates & Deadlines)
    Metinde geçen tüm tarihleri, teslim sürelerini, fesih ihbar sürelerini veya zaman sınırlarını madde madde listele. Tarih yoksa "Belirtilmemiştir" yaz.

    ## 3. Haklar ve Yükümlülükler (Rights & Obligations)
    Tarafların (örneğin işveren, çalışan, yüklenici vb.) üstlendiği sorumlulukları ve yasal haklarını net ve maddeler halinde yaz.

    ## 4. Risk Analizi ve Öneriler (Risk Assessment)
    Avukatlar için kritik olabilecek belirsizlikleri, cezai şartları veya riskli maddeleri analiz et.

    Döküman İçeriği:
    {documentText}
    ```

### 2.3. Hukuki Taslak Oluşturucu Promptu
*   **Görevi:** Kullanıcının sağladığı değişkenlere (gönderen, alıcı, konu, detaylar) göre yasal formatta dilekçe, ihtarname veya sözleşme taslakları hazırlamak.
*   **Tasarım:**
    ```text
    Sen uzman bir avukat yardımcısısın. Aşağıdaki parametrelere ve şablona uygun olarak yasal standartlarda resmi bir Türkçe {templateType} taslağı hazırla.
    Çıktının formatı resmi yazışma kurallarına uygun, başlıkları net ve imza alanları içerecek şekilde düzenlenmelidir. Markdown formatını kullan.

    İstenen Belge Tipi: {templateType}
    Belge Değişkenleri:
    {variables}
    
    Kurallar:
    1. Kanun maddelerine uygun resmi ve ciddi bir üslup kullan.
    2. Gerekli durumlarda kanun referansı ekle (örneğin ihtarname için Türk Borçlar Kanunu ilgili maddeleri).
    3. Metnin sonuna imza alanları, tarih ve adres kısımları yerleştir.
    ```

---

## 3. Optimizasyonlar ve Güvenlik Deneyimleri

1.  **Vektör Arama Optimizasyonu (MMR):**
    *   Hukuk dökümanları birbirini tekrar eden maddeler içerebildiğinden standart Cosine Similarity yerine **Maximal Marginal Relevance (MMR)** algoritması seçilmiştir. Bu sayede dökümanın farklı sayfalarından en çeşitli ve kapsam dışı kalmayan bilgiler LLM'e bağlam olarak beslenmektedir.
2.  **Güvenlik ve Gizlilik:**
    *   Tüm API istekleri şifreleme middleware'inden (`EncryptionMiddleware`) geçmektedir.
    *   Hukuki verilerin hassasiyeti nedeniyle, üretim ortamında OpenAI API veri saklama (data retention) ve model eğitimi politikalarına dikkat edilmeli, kullanıcı verileri model eğitiminde kullanılmamalıdır.
