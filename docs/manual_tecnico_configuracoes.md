# Manual Técnico de Configurações e Integrações

## 1. Configuração do Backend (Supabase)
A plataforma depende inteiramente do Supabase. Abaixo estão as tabelas críticas:

- **restaurants:** Armazena dados do restaurante, plano, `theme_config` e `delivery_config`.
- **menu_items:** Pratos, preços, stock e imagens.
- **categories:** Organização do menu.
- **orders:** Registo de pedidos (Crucial para o KDS).
- **coupons:** Sistema de descontos.
- **loyalty_configs:** Regras do cartão fidelidade.

### 1.1 Políticas de Segurança (RLS)
Todas as tabelas possuem **Row Level Security** ativo:
- `SELECT` público para o menu digital.
- `ALL` (Insert/Update/Delete) apenas para o `owner_id` autenticado.

## 2. Variáveis de Ambiente (.env)
Para ligar a aplicação ao servidor, são necessários os seguintes campos no ficheiro `.env` ou nas configurações do Netlify:
- `VITE_SUPABASE_URL`: O endpoint do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: A chave pública para acesso à base de dados.

## 3. Publicação (Netlify)
A aplicação está configurada para **Continuous Deployment**:
1. Cada `push` para a branch `main` do GitHub ativa um build automático.
2. Comando de Build: `npm run build`.
3. Diretório de Publicação: `dist`.

## 4. Resolução de Problemas (Debug)

### 4.1 Pedidos não aparecem na cozinha
- **Causa:** Ligação Realtime interrompida.
- **Solução:** Verificar se a tabela `orders` tem a replicação ativa no painel do Supabase (Database -> Replication).

### 4.2 Mapa não carrega
- **Causa:** Falta de internet ou bloqueio de domínio.
- **Solução:** A aplicação usa o OpenStreetMap. Verifique se o domínio `tile.openstreetmap.org` não está bloqueado na rede do restaurante.

### 4.3 Erro de "API Key missing"
- **Causa:** Variáveis de ambiente não configuradas no Netlify.
- **Solução:** Ir a Netlify -> Site Settings -> Environment Variables e adicionar as chaves do Supabase.

## 5. Integração WhatsApp
O sistema gera links dinâmicos usando o formato:
`https://wa.me/[numero]?text=[mensagem_codificada]`
A mensagem é construída no componente `CheckoutModal.jsx` para clientes e `KitchenBoard.jsx` para notificações de estado.
