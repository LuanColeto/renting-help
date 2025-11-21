# Renting Help 🏠

Aplicação web moderna para gerenciar sua busca por apartamentos para alugar de forma simples e organizada.

## 🚀 Funcionalidades

- ✅ **Cadastro de Apartamentos**: Adicione apartamentos manualmente ou através de scraping de URLs
- 📊 **Filtros Avançados**: Filtre por bairro, faixa de preço, status de visita
- 📅 **Agendamento de Visitas**: Organize suas visitas em um calendário semanal
- 🏷️ **Gerenciamento de Status**: Marque apartamentos como visitados ou descartados
- 📸 **Galeria de Imagens**: Visualize fotos dos apartamentos
- 💰 **Cálculo Automático**: Veja o custo total mensal incluindo todas as taxas
- 🎨 **Interface Moderna**: Design clean e responsivo com animações suaves
- ⚡ **Skeleton Loading**: Feedback visual durante carregamento de dados
- 📱 **Mobile First**: Interface totalmente otimizada para dispositivos móveis

## 🛠️ Tecnologias

- **Framework**: [Next.js 16](https://nextjs.org/) com App Router e Turbopack
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS 4
- **Banco de Dados**: Firebase Firestore
- **UI Components**:
  - [Lucide React](https://lucide.dev/) - Ícones
  - [MUI Material](https://mui.com/) - Slider de faixa de preço
  - [React DatePicker](https://reactdatepicker.com/) - Seletor de datas
  - [Sonner](https://sonner.emilkowal.ski/) - Notificações toast
- **Web Scraping**: Puppeteer

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Firebase com projeto configurado

## ⚙️ Configuração

1. Clone o repositório:
```bash
git clone <repository-url>
cd renting-help
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação em [http://localhost:3000](http://localhost:3000)

## 🏗️ Build para Produção

```bash
npm run build
npm start
```

## 📁 Estrutura do Projeto

```
renting-help/
├── src/
│   ├── app/
│   │   ├── api/          # API Routes (scraping, cleanup)
│   │   ├── visits/       # Página de visitas
│   │   ├── page.tsx      # Página principal
│   │   ├── layout.tsx    # Layout raiz
│   │   └── globals.css   # Estilos globais
│   ├── hooks/           # Custom hooks
│   │   ├── useApartments.ts
│   │   └── useVisits.ts
│   ├── lib/             # Configurações e utilitários
│   │   └── firebase.ts
│   └── types/           # Definições TypeScript
│       ├── apartment.ts
│       └── visit.ts
├── scripts/             # Scripts utilitários
└── public/             # Arquivos estáticos
```

## 🎯 Como Usar

### Adicionar Apartamento

1. Clique em "Novo apartamento"
2. Cole a URL do anúncio para scraping automático, ou
3. Preencha os dados manualmente
4. Clique em "Cadastrar"

### Filtrar Apartamentos

- Use os filtros laterais para selecionar bairros
- Ajuste a faixa de preço com o slider
- Use as abas para filtrar por status (Todos, Visitados, Não visitados, Descartados)

### Agendar Visita

1. Clique em "Agendar Visita" no card do apartamento
2. Selecione data e horário
3. Adicione observações (opcional)
4. Confirme o agendamento

### Visualizar Visitas

- Clique no botão "Visitas" no topo
- Navegue pelo calendário semanal
- Veja todas as visitas agendadas organizadas por dia

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter

## 📝 Licença

Este projeto é de uso pessoal.

---

Desenvolvido com ❤️ usando Next.js e Firebase
