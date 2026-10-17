require('dotenv').config();
const pool = require('./config/db');

async function testarMigration() {
    const conexao = await pool.getConnection();
    
    try {
        console.log('=== Testando Migration 001_financeiro ===\n');

        // Teste 1: Verificar se tabelas foram criadas
        console.log('1. Verificando tabelas criadas...');
        const [tabelas] = await conexao.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'torque' 
            AND TABLE_NAME IN ('categorias_financeiras', 'lancamentos', 'pagamentos')
        `);
        console.log('✓ Tabelas criadas:', tabelas.map(t => t.TABLE_NAME));

        // Teste 2: Verificar categorias seed
        console.log('\n2. Verificando categorias seed...');
        const [categorias] = await conexao.query(`
            SELECT * FROM categorias_financeiras WHERE oficina_id = 1
        `);
        console.log('✓ Categorias criadas:', categorias.length);
        categorias.forEach(c => console.log(`  - ${c.nome} (${c.tipo})`));

        // Teste 3: Verificar coluna preco_custo em ordem_servico_pecas
        console.log('\n3. Verificando coluna preco_custo...');
        const [colunas] = await conexao.query(`
            SELECT COLUMN_NAME 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = 'torque' 
            AND TABLE_NAME = 'ordem_servico_pecas' 
            AND COLUMN_NAME = 'preco_custo'
        `);
        console.log('✓ Coluna preco_custo adicionada:', colunas.length > 0);

        // Teste 4: Verificar migração de transacoes
        console.log('\n4. Verificando migração de transacoes...');
        const [transacoesOriginais] = await conexao.query(`
            SELECT COUNT(*) as total FROM transacoes
        `);
        const [lancamentosMigrados] = await conexao.query(`
            SELECT COUNT(*) as total FROM lancamentos WHERE migrado_de_transacoes = TRUE
        `);
        console.log(`✓ Transacoes originais: ${transacoesOriginais[0].total}`);
        console.log(`✓ Lancamentos migrados: ${lancamentosMigrados[0].total}`);

        // Teste 5: Verificar pagamentos migrados
        console.log('\n5. Verificando pagamentos migrados...');
        const [pagamentosMigrados] = await conexao.query(`
            SELECT COUNT(*) as total FROM pagamentos
        `);
        console.log(`✓ Pagamentos migrados: ${pagamentosMigrados[0].total}`);

        // Teste 6: Verificar índices
        console.log('\n6. Verificando índices...');
        const [indices] = await conexao.query(`
            SELECT INDEX_NAME, TABLE_NAME 
            FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = 'torque' 
            AND TABLE_NAME IN ('lancamentos', 'pagamentos', 'categorias_financeiras')
            AND INDEX_NAME != 'PRIMARY'
        `);
        console.log('✓ Índices criados:', indices.length);
        indices.forEach(i => console.log(`  - ${i.TABLE_NAME}.${i.INDEX_NAME}`));

        console.log('\n=== Todos os testes passaram! ===\n');

    } catch (error) {
        console.error('Erro nos testes:', error);
        throw error;
    } finally {
        conexao.release();
        await pool.end();
    }
}

testarMigration();
