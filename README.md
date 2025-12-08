# Gemini PDF RAG Chat

PDF 문서를 업로드하고 Google Gemini AI와 대화하며 문서 내용을 탐색할 수 있는 RAG(Retrieval-Augmented Generation) 애플리케이션입니다.

이 프로젝트는 별도의 백엔드 데이터베이스 없이 브라우저 내에서 PDF 파싱, 임베딩 생성, 벡터 검색을 수행하는 **Client-side RAG** 아키텍처를 따릅니다.

## ✨ 주요 기능 (Features)

* **📄 PDF 문서 업로드 및 파싱**: `pdf.js`를 사용하여 브라우저에서 직접 PDF 텍스트를 추출합니다.
* **🧩 텍스트 청킹 (Chunking)**: 긴 문서를 처리하기 위해 텍스트를 적절한 크기로 분할하고 오버랩을 적용합니다.
* **vector 임베딩 생성**: Google `text-embedding-004` 모델을 사용하여 텍스트 청크를 벡터로 변환합니다.
* **🔍 문맥 검색 (Context Retrieval)**: 코사인 유사도(Cosine Similarity) 알고리즘을 사용하여 사용자 질문과 가장 관련성 높은 문서 내용을 검색합니다.
* **🤖 AI 답변 생성**: 검색된 문맥을 바탕으로 `gemini-2.5-flash` 모델이 정확하고 구체적인 답변을 제공합니다.
* **⚡ Modern UI**: React, Vite, Tailwind CSS를 사용한 빠르고 반응형 디자인을 제공합니다.

## 🛠 기술 스택 (Tech Stack)

* **Framework**: React 19, Vite
* **Language**: TypeScript
* **AI Provider**: Google GenAI SDK (`@google/genai`)
* **Models**:
    * Embedding: `text-embedding-004`
    * Generation: `gemini-2.5-flash`
* **PDF Processing**: PDF.js (Client-side parsing)
* **Styling**: Tailwind CSS, Lucide React (Icons)

## 🚀 시작하기 (Getting Started)

### 사전 요구사항 (Prerequisites)

* Node.js (v18 이상 권장)
* npm 또는 yarn, pnpm
* **Google Gemini API Key** ([Google AI Studio](https://aistudiocdn.com/app/apikey)에서 발급 가능)

### 설치 및 실행 (Installation)

1.  **프로젝트 클론 및 이동**
    ```bash
    git clone <repository-url>
    cd gemini-pdf-rag-chat
    ```

2.  **의존성 설치**
    ```bash
    npm install
    ```

3.  **환경 변수 설정**
    프로젝트 루트 경로에 `.env` 파일을 생성하고 발급받은 API 키를 입력하세요.
    (Vite 환경에서 접근하기 위해 `vite.config.ts`에 설정이 되어 있습니다)

    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **개발 서버 실행**
    ```bash
    npm run dev
    ```

## 📂 프로젝트 구조 (Project Structure)

```text
src/
├── components/
│   ├── ChatInterface.tsx  # 채팅 UI 컴포넌트
│   └── FileUpload.tsx     # PDF 파일 업로드 및 상태 표시 컴포넌트
├── services/
│   ├── geminiService.ts   # Google GenAI API 호출 (임베딩, 채팅)
│   └── ragService.ts      # PDF 파싱, 청킹, 코사인 유사도 검색 로직
├── types.ts               # TypeScript 타입 정의
├── App.tsx                # 메인 애플리케이션 로직
└── main.tsx               # Entry point
