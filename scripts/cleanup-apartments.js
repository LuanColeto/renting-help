/**
 * Script para limpar o campo 'interested' dos apartamentos no Firebase
 *
 * Como executar:
 * 1. Certifique-se de que as variáveis de ambiente estão configuradas no .env.local
 * 2. Execute: node scripts/cleanup-apartments.js
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
const app = admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function cleanupApartments() {
  try {
    console.log('🔍 Buscando apartamentos no Firebase...');

    const apartmentsRef = db.collection('apartments');
    const snapshot = await apartmentsRef.get();

    console.log(`📦 Encontrados ${snapshot.size} apartamentos`);

    let updatedCount = 0;
    const batch = db.batch();

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Se o documento tem o campo 'interested', remover
      if ('interested' in data) {
        const docRef = apartmentsRef.doc(doc.id);

        // Remove o campo 'interested'
        batch.update(docRef, {
          interested: admin.firestore.FieldValue.delete()
        });

        updatedCount++;
        console.log(`  ✓ Removendo campo 'interested' do apartamento: ${data.title || doc.id}`);
      }
    });

    if (updatedCount > 0) {
      console.log(`\n💾 Salvando alterações no Firebase...`);
      await batch.commit();
      console.log(`✅ ${updatedCount} apartamento(s) atualizado(s) com sucesso!`);
    } else {
      console.log('✅ Nenhum apartamento precisou ser atualizado.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao limpar apartamentos:', error);
    process.exit(1);
  }
}

// Executar
cleanupApartments();
