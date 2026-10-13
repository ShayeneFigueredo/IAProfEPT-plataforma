/**
 * Migration 2: Usuários e Perfis Docentes com Constraints de Unicidade e Deleção em Cascata
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Tabela usuarios
  await knex.schema.createTable('usuarios', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('nome', 255).notNullable();
    // Constraint de unicidade estrita no e-mail
    table.string('email', 255).notNullable().unique();
    table.string('senha_hash', 255).notNullable();
    table.string('role', 50).notNullable().defaultTo('docente_rfepct');
    table.string('status', 30).notNullable().defaultTo('ativo');
    table.timestamp('ultimo_login_em', { useTz: true }).nullable();
    table.integer('tentativas_login_falhas').notNullable().defaultTo(0);
    table.timestamp('bloqueado_ate', { useTz: true }).nullable();

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Índices
    table.index(['role'], 'idx_usuarios_role');
    table.index(['status'], 'idx_usuarios_status');
  });

  // 2. Tabela perfis_docentes
  await knex.schema.createTable('perfis_docentes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    
    // Relacionamento com usuarios: 1 para 1 com CASCADE
    table.uuid('usuario_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Relacionamento com instituicoes_rfepct: SET NULL preserva perfil do professor
    table.uuid('instituicao_id')
      .nullable()
      .references('id')
      .inTable('instituicoes_rfepct')
      .onDelete('SET NULL')
      .onUpdate('CASCADE');

    table.specificType('uf', 'char(2)').notNullable().index();
    table.string('matricula_siape', 30).nullable();
    table.string('area_atuacao', 150).notNullable().defaultTo('Matemática');
    table.jsonb('cursos_tecnicos').notNullable().defaultTo('[]');

    // Registro de Consentimento Livre e Esclarecido (TCLE)
    table.boolean('termo_etico_aceito').notNullable().defaultTo(true);
    table.string('termo_etico_versao', 20).notNullable().defaultTo('1.0');
    table.timestamp('data_aceite_termo', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.string('ip_aceite_termo', 64).nullable();

    // Auditoria
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // Constraint de unicidade condicional para matricula_siape (quando preenchida, não pode repetir)
  await knex.raw(`
    CREATE UNIQUE INDEX uq_perfis_matricula_siape 
    ON perfis_docentes (matricula_siape) 
    WHERE matricula_siape IS NOT NULL AND matricula_siape <> '';
  `);

  // Triggers de updated_at
  await knex.raw(`
    CREATE TRIGGER trg_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER trg_perfis_docentes_updated_at 
    BEFORE UPDATE ON perfis_docentes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_perfis_docentes_updated_at ON perfis_docentes;');
  await knex.raw('DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;');
  await knex.raw('DROP INDEX IF EXISTS uq_perfis_matricula_siape;');
  await knex.schema.dropTableIfExists('perfis_docentes');
  await knex.schema.dropTableIfExists('usuarios');
}
