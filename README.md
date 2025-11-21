# Renting Help

Uma aplicação moderna em Next.js para gerenciar apartamentos que você está considerando alugar. Organize suas visitas, compare preços e mantenha o controle de todos os imóveis em um só lugar.

## Funcionalidades

- ✅ Cadastro de apartamentos com informações completas
- ✅ Cálculo automático do valor total (aluguel + condomínio + IPTU + seguro fiança)
- ✅ Sistema de status para organizar o processo:
  - Em dúvida
  - Visitado
  - Interessado
  - Descartado
- ✅ Edição e exclusão de apartamentos
- ✅ Interface moderna e responsiva
- ✅ Sincronização em tempo real com Firebase

## Tecnologias

- **Next.js 15** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Firebase Firestore** - Banco de dados
- **Lucide React** - Ícones

## Como usar

1. Instale as dependências:
```bash
npm install
```

2. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

3. Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## Estrutura do Projeto

```
src/
├── app/
│   └── page.tsx          # Página principal
├── hooks/
│   └── useApartments.ts  # Hook para gerenciar apartamentos
├── lib/
│   └── firebase.ts       # Configuração do Firebase
└── types/
    └── apartment.ts      # Tipos TypeScript
```

## Campos do Apartamento

- **Título**: Nome/identificação do apartamento
- **Endereço**: Localização completa
- **Aluguel**: Valor mensal do aluguel
- **Condomínio**: Taxa condominial
- **IPTU**: Imposto predial
- **Seguro Fiança**: Valor do seguro (opcional)
- **Status**: Estado atual do processo
- **Observações**: Notas adicionais (opcional)

O sistema calcula automaticamente o **valor total** somando todos os custos mensais.

## Deploy

A aplicação está configurada para deploy fácil na Vercel. Conecte seu repositório GitHub e faça o deploy com um clique.
