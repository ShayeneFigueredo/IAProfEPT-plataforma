/**
 * Migration 11: Tabela de Controle de Consentimento Livre e Esclarecido (TCLE)
 * Plataforma IAprofEPT — PPGEM / UFJF
 * 
 * Atende aos requisitos:
 * - Registro de usuario_id, versao_termo, timestamp ISO e IP anonimizado
 * - Conformidade estrita com o Comitê de Ética em Pesquisa (CEP/UFJF) e Resolução CNS 510/2016
 * - Critério de Aceite: Nenhum usuário criado no banco sem o consentimento registrado (Garantia por Constraint Trigger no PostgreSQL)
 * 
 * @param {import('knex').Knex} knex
 */
export async function up(knex) {
  // 1. Criação da Tabela 'consentimentos_tcle'
  await knex.schema.createTable('consentimentos_tcle', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));

    // Relacionamento com usuarios: CASCADE na exclusão da conta
    table.uuid('usuario_id')
      .notNullable()
      .references('id')
      .inTable('usuarios')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');

    // Versão do termo aceito (ex: '1.0')
    table.string('versao_termo', 20).notNullable().defaultTo('1.0');

    // Flag afirmativa do consentimento
    table.boolean('aceito').notNullable().defaultTo(true);

    // IP de conexão anonimizado em conformidade com LGPD e CNS 510/2016 (ex: '192.168.1.0/24')
    table.string('ip_anonimizado', 64).notNullable();

    // Metadados do agente e dispositivo
    table.text('user_agent').nullable();
    table.jsonb('dispositivo_meta').nullable().defaultTo('{}');

    // Auditoria temporal
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    // Índices de alta performance para auditoria e rastreabilidade
    table.index(['usuario_id'], 'idx_consentimento_usuario');
    table.index(['versao_termo'], 'idx_consentimento_versao');
    table.index(['created_at'], 'idx_consentimento_created_at');
    table.index(['usuario_id', 'aceito'], 'idx_consentimento_usuario_aceito');
  });

  // 2. Trigger para atualização de updated_at
  await knex.raw(`
    CREATE TRIGGER trg_consentimentos_tcle_updated_at 
    BEFORE UPDATE ON consentimentos_tcle 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  `);

  // 3. Backfill retroativo de consentimentos para usuários preexistentes (se houver)
  await knex.raw(`
    INSERT INTO consentimentos_tcle (usuario_id, versao_termo, aceito, ip_anonimizado, user_agent, created_at, updated_at)
    SELECT 
      u.id, 
      COALESCE(pd.termo_etico_versao, '1.0'), 
      TRUE, 
      '127.0.0.0/24', 
      'Migration-Backfill/1.0', 
      COALESCE(pd.data_aceite_termo, u.created_at),
      NOW()
    FROM usuarios u
    LEFT JOIN perfis_docentes pd ON pd.usuario_id = u.id
    WHERE NOT EXISTS (
      SELECT 1 FROM consentimentos_tcle ct WHERE ct.usuario_id = u.id
    );
  `);

  // 4. Constraint Trigger em nível de Banco de Dados:
  // Critério de Aceite: Nenhum usuário criado no banco sem o consentimento registrado!
  await knex.raw(`
    CREATE OR REPLACE FUNCTION check_usuario_consentimento_tcle()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM consentimentos_tcle WHERE usuario_id = NEW.id AND aceito = TRUE
      ) THEN
        RAISE EXCEPTION 'Violacao de Conformidade Etica (CEP/UFJF - CNS 510/2016): Nenhum usuario pode ser persistido no banco sem o devido registro de consentimento livre e esclarecido (TCLE).'
          USING ERRCODE = 'check_violation';
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_garantir_consentimento_tcle ON usuarios;
    CREATE CONSTRAINT TRIGGER trg_garantir_consentimento_tcle
    AFTER INSERT ON usuarios
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION check_usuario_consentimento_tcle();
  `);
}

/**
 * @param {import('knex').Knex} knex
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS trg_garantir_consentimento_tcle ON usuarios;');
  await knex.raw('DROP FUNCTION IF EXISTS check_usuario_consentimento_tcle();');
  await knex.raw('DROP TRIGGER IF EXISTS trg_consentimentos_tcle_updated_at ON consentimentos_tcle;');
  await knex.schema.dropTableIfExists('consentimentos_tcle');
}
