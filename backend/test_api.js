require('dotenv').config();

// Testes manuais da PR A
const BASE_URL = 'http://localhost:3000';

async function testarAPI() {
    console.log('=== Testando API Financeira PR A ===\n');

    // Teste 1: Listar categorias
    console.log('1. Listar categorias...');
    try {
        const response = await fetch(`${BASE_URL}/categorias-financeiras`);
        const data = await response.json();
        console.log('✓ Categorias:', data.length);
    } catch (error) {
        console.error('✗ Erro:', error.message);
    }

    // Teste 2: Listar lançamentos
    console.log('\n2. Listar lançamentos...');
    try {
        const response = await fetch(`${BASE_URL}/lancamentos`);
        const data = await response.json();
        console.log('✓ Lançamentos:', data.lancamentos?.length || 0);
    } catch (error) {
        console.error('✗ Erro:', error.message);
    }

    // Teste 3: Criar lançamento avulso
    console.log('\n3. Criar lançamento avulso...');
    try {
        const response = await fetch(`${BASE_URL}/lancamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'saida',
                descricao: 'Teste lançamento manual',
                valor: 100.50,
                vencimento: '2026-10-10',
                categoria_id: 7 // Salários
            })
        });
        const data = await response.json();
        console.log('✓ Lançamento criado:', data.id || data.mensagem);
    } catch (error) {
        console.error('✗ Erro:', error.message);
    }

    // Teste 4: Criar lançamento parcelado
    console.log('\n4. Criar lançamento parcelado...');
    try {
        const response = await fetch(`${BASE_URL}/lancamentos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tipo: 'saida',
                descricao: 'Aluguel parcelado',
                valor: 3000,
                vencimento: '2026-10-01',
                parcelas: 3
            })
        });
        const data = await response.json();
        console.log('✓ Lançamento parcelado criado:', data.length || data.mensagem);
    } catch (error) {
        console.error('✗ Erro:', error.message);
    }

    console.log('\n=== Testes da API concluídos ===');
}

testarAPI();
