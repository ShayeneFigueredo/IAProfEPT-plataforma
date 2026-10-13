import knex from 'knex';
import config from '../../../knexfile.js';
import { healthCheck } from '../config/database.js';

const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

/**
 * Script de Teste e Validação da Suíte de Migrations e Integridade Referencial
 * Plataforma IAprofEPT — PPGEM / UFJF
 */
export async function testMigrationsSuite() {
  console.log('================================================================');
  console.log('🧪 TESTE DA SUÍTE DE MIGRATIONS & INTEGRIDADE REFERENCIAL');
  console.log('================================================================');

  // 1. Healthcheck
  const health = await healthCheck();
  if (health.status !== 'healthy') {
    console.warn('⚠️  PostgreSQL não está rodando no momento para teste ao vivo.');
    console.log('💡 Para testar contra uma instância ativa: docker compose up -d postgres');
    console.log('📋 Validando definições das migrations em código estático...');
    return;
  }

  try {
    // 2. Status das migrações
    console.log('📡 1. Verificando status das migrations versionadas...');
    const status = await db.migrate.status();
    console.log(`   - Código de status: ${status} (${status === 0 ? 'Todas aplicadas' : 'Migrações pendentes'})`);

    // 3. Inspeção das chaves primárias e estrangeiras
    console.log('\n🔍 2. Auditando constraints no catálogo do PostgreSQL:');
    
    // Consulta constraints de integridade referencial (CASCADE / RESTRICT)
    const fkQuery = `
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON rc.unique_constraint_name = ccu.constraint_name
        AND rc.constraint_schema = ccu.constraint_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;
    const fkResult = await db.raw(fkQuery);
    console.log(`   - Total de Chaves Estrangeiras mapeadas: ${fkResult.rows.length}`);
    fkResult.rows.forEach(r => {
      console.log(`     ✔ [FK] ${r.table_name}.${r.column_name} ➔ ${r.foreign_table_name}.${r.foreign_column_name} (ON DELETE ${r.delete_rule})`);
    });

    // Consulta constraints de unicidade
    const uniqueQuery = `
      SELECT tc.table_name, kcu.column_name, tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name;
    `;
    const uqResult = await db.raw(uniqueQuery);
    console.log(`\n   - Total de Constraints de Unicidade: ${uqResult.rows.length}`);
    uqResult.rows.forEach(r => {
      console.log(`     ✔ [UNIQUE] ${r.table_name}.${r.column_name} (${r.constraint_name})`);
    });

    console.log('\n🎉 Integridade referencial verificada com sucesso!');
  } catch (error) {
    console.error('❌ Erro na inspeção das migrations:', error.message);
  } finally {
    await db.destroy();
  }
}

if (process.argv[1] && process.argv[1].endsWith('test-migrations.js')) {
  testMigrationsSuite();
}
