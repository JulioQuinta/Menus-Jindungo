import { db } from '../lib/localDb';
import { supabase } from '../lib/supabaseClient';

export const cashSessionService = {
    // 1. Obter sessão ativa de caixa
    async getActiveSession(restaurantId) {
        try {
            const sessions = await db.cash_sessions
                .where('restaurant_id')
                .equals(restaurantId)
                .and(session => session.status === 'open')
                .toArray();
            return sessions[0] || null;
        } catch (err) {
            console.error("Erro ao obter sessão ativa:", err);
            return null;
        }
    },

    // 2. Abrir sessão de caixa
    async openSession(restaurantId, openedBy, initialCash, notes = '') {
        try {
            const newSession = {
                id: `CS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                restaurant_id: restaurantId,
                opened_by: openedBy,
                opened_at: new Date().toISOString(),
                closed_at: null,
                initial_cash: parseFloat(initialCash) || 0,
                expected_cash: parseFloat(initialCash) || 0,
                actual_cash: null,
                difference: null,
                status: 'open',
                notes: notes
            };
            await db.cash_sessions.put(newSession);
            return newSession;
        } catch (err) {
            console.error("Erro ao abrir sessão de caixa:", err);
            throw err;
        }
    },

    // 3. Adicionar Sangria ou Suprimento
    async addTransaction(sessionId, type, amount, description) {
        try {
            const newTx = {
                id: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                session_id: sessionId,
                type, // 'sangria' ou 'suprimento'
                amount: parseFloat(amount) || 0,
                description,
                created_at: new Date().toISOString()
            };
            await db.cash_transactions.put(newTx);

            // Atualizar o expected_cash da sessão
            const session = await db.cash_sessions.get(sessionId);
            if (session) {
                let change = parseFloat(amount);
                if (type === 'sangria') change = -change;
                session.expected_cash = (session.expected_cash || 0) + change;
                await db.cash_sessions.put(session);
            }

            return newTx;
        } catch (err) {
            console.error("Erro ao adicionar transação de caixa:", err);
            throw err;
        }
    },

    // 4. Carregar transações da sessão
    async getSessionTransactions(sessionId) {
        try {
            return await db.cash_transactions
                .where('session_id')
                .equals(sessionId)
                .toArray();
        } catch (err) {
            console.error("Erro ao obter transações da sessão:", err);
            return [];
        }
    },

    // 5. Obter resumo financeiro detalhado da sessão (vendas e movimentações)
    async getSessionSummary(sessionId) {
        try {
            const session = await db.cash_sessions.get(sessionId);
            if (!session) return null;

            const txs = await this.getSessionTransactions(sessionId);
            const suprimentos = txs.filter(t => t.type === 'suprimento').reduce((sum, t) => sum + t.amount, 0);
            const sangrias = txs.filter(t => t.type === 'sangria').reduce((sum, t) => sum + t.amount, 0);

            // Tentar obter faturas online via Supabase
            let sessionOrders = [];
            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('restaurant_id', session.restaurant_id)
                    .gte('created_at', session.opened_at);
                
                if (error) throw error;
                sessionOrders = data || [];
            } catch (onlineErr) {
                console.warn("[CashSessionService] Erro ao buscar vendas online. Usando local IndexedDB...", onlineErr);
                // Fallback offline: buscar do Dexie local
                const localOrders = await db.orders
                    .where('restaurant_id')
                    .equals(session.restaurant_id)
                    .toArray();
                
                const openedTime = new Date(session.opened_at).getTime();
                sessionOrders = localOrders.filter(o => new Date(o.created_at).getTime() >= openedTime);
            }

            // Filtrar faturas canceladas
            const activeOrders = sessionOrders.filter(order => 
                order.status !== 'cancelled' && 
                order.status !== 'cancelado' && 
                order.status !== 'rejeitado'
            );

            const cashSales = activeOrders
                .filter(o => {
                    const method = (o.payment_method || '').toLowerCase();
                    return method === 'numerário' || method === 'dinheiro' || method === 'cash';
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);

            const cardSales = activeOrders
                .filter(o => {
                    const method = (o.payment_method || '').toLowerCase();
                    return method === 'multicaixa' || method === 'cartão' || method === 'card';
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);

            const mobileSales = activeOrders
                .filter(o => {
                    const method = (o.payment_method || '').toLowerCase();
                    return method === 'express' || method === 'transferência' || method === 'mobile';
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);

            const totalSales = cashSales + cardSales + mobileSales;
            const expectedCashInDrawer = session.initial_cash + cashSales + suprimentos - sangrias;

            return {
                session,
                transactions: txs,
                suprimentos,
                sangrias,
                ordersCount: activeOrders.length,
                cashSales,
                cardSales,
                mobileSales,
                totalSales,
                expectedCashInDrawer
            };
        } catch (err) {
            console.error("Erro ao gerar resumo da sessão:", err);
            return null;
        }
    },

    // 6. Fechar sessão de caixa
    async closeSession(sessionId, actualCash, notes, expectedCash) {
        try {
            const session = await db.cash_sessions.get(sessionId);
            if (!session) throw new Error("Sessão não localizada");

            const actual = parseFloat(actualCash) || 0;
            const diff = actual - expectedCash;

            session.closed_at = new Date().toISOString();
            session.actual_cash = actual;
            session.expected_cash = expectedCash;
            session.difference = diff;
            session.status = 'closed';
            session.notes = `${session.notes || ''}\nFecho: ${notes}`.trim();

            await db.cash_sessions.put(session);
            return session;
        } catch (err) {
            console.error("Erro ao fechar caixa:", err);
            throw err;
        }
    },

    // 7. Obter todas as sessões anteriores
    async getPreviousSessions(restaurantId) {
        try {
            return await db.cash_sessions
                .where('restaurant_id')
                .equals(restaurantId)
                .and(session => session.status === 'closed')
                .reverse()
                .sortBy('opened_at');
        } catch (err) {
            console.error("Erro ao obter histórico de caixa:", err);
            return [];
        }
    }
};
