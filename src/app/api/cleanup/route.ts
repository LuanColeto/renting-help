import { NextResponse } from 'next/server';
import { collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Endpoint temporário para limpar o campo 'interested' dos apartamentos
 *
 * Para executar, acesse: http://localhost:3000/api/cleanup
 *
 * IMPORTANTE: Remova este arquivo após executar!
 */
export async function GET() {
  try {
    console.log('🔍 Buscando apartamentos no Firebase...');

    const apartmentsRef = collection(db, 'apartments');
    const snapshot = await getDocs(apartmentsRef);

    console.log(`📦 Encontrados ${snapshot.size} apartamentos`);

    let updatedCount = 0;
    const updates: Promise<void>[] = [];

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();

      // Se o documento tem o campo 'interested', remover
      if ('interested' in data) {
        const docRef = doc(db, 'apartments', docSnapshot.id);

        updates.push(
          updateDoc(docRef, {
            interested: deleteField()
          })
        );

        updatedCount++;
        console.log(`  ✓ Removendo campo 'interested' do apartamento: ${data.title || docSnapshot.id}`);
      }
    });

    if (updates.length > 0) {
      console.log(`\n💾 Salvando alterações no Firebase...`);
      await Promise.all(updates);
      console.log(`✅ ${updatedCount} apartamento(s) atualizado(s) com sucesso!`);

      return NextResponse.json({
        success: true,
        message: `${updatedCount} apartamento(s) atualizado(s) com sucesso!`,
        updated: updatedCount,
      });
    } else {
      console.log('✅ Nenhum apartamento precisou ser atualizado.');

      return NextResponse.json({
        success: true,
        message: 'Nenhum apartamento precisou ser atualizado.',
        updated: 0,
      });
    }
  } catch (error) {
    console.error('❌ Erro ao limpar apartamentos:', error);

    return NextResponse.json({
      success: false,
      error: 'Erro ao limpar apartamentos',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
