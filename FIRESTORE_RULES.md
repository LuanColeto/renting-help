# Configurar Regras do Firestore

Você está recebendo o erro `Missing or insufficient permissions` porque o Firestore está bloqueando o acesso aos dados.

## Como resolver:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras** (Rules)
5. Cole o código abaixo:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permite leitura e escrita em todos os documentos (apenas para desenvolvimento)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

6. Clique em **Publicar** (Publish)

## IMPORTANTE:

⚠️ **Esta regra permite acesso TOTAL sem autenticação - use apenas para desenvolvimento!**

Para produção, você deve implementar regras de segurança adequadas. Exemplo com autenticação:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /apartments/{apartmentId} {
      // Apenas usuários autenticados podem ler e escrever
      allow read, write: if request.auth != null;
    }
  }
}
```

## Verificar se funcionou:

Após publicar as regras, recarregue sua aplicação. O erro deve desaparecer e você conseguirá adicionar apartamentos.
