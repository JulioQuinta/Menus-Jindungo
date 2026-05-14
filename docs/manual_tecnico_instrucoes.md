# Manual Técnico de Instruções - Menús Jindungo

## 1. Visão Geral
O Menús Jindungo é uma plataforma SaaS (Software as a Service) para gestão de menus digitais e pedidos em tempo real. A aplicação foi desenhada para ser rápida, personalizável e funcionar perfeitamente em dispositivos móveis (PWA).

## 2. Stack Tecnológica
- **Frontend:** React.js com Vite.
- **Linguagem:** JavaScript (JSX).
- **Estilização:** Vanilla CSS e TailwindCSS (em componentes específicos).
- **Backend/Database:** Supabase (PostgreSQL + Realtime).
- **Iconografia:** Lucide React.
- **Mapas:** Leaflet / OpenStreetMap (Gratuito).

## 3. Estrutura de Pastas
- `/src/components`: Componentes reutilizáveis (KDS, Mapas, Modais).
- `/src/pages`: Páginas principais (AdminDashboard, PublicMenu, Explorar).
- `/src/services`: Lógica de comunicação com a base de dados (orderService, couponService).
- `/src/utils`: Funções utilitárias (cálculo de distância, formatação de moeda).
- `/src/context`: Gestão de estado global (Carrinho, Autenticação).

## 4. Lógicas Principais

### 4.1 Sistema de Personalização Dinâmica
Localizado em `src/components/StyleControls.jsx`. Permite que o restaurante altere cores e fontes em tempo real. Os dados são guardados na coluna `theme_config` da tabela `restaurants` em formato JSON.

### 4.2 Fluxo de Pedidos (Realtime)
1. O cliente faz o pedido no `PublicMenu.jsx`.
2. O pedido é inserido na tabela `orders`.
3. O componente `KitchenBoard.jsx` (KDS) deteta a inserção via **Supabase Realtime** e emite um alerta sonoro.

### 4.3 Cálculo de Entrega por Distância
Utiliza a fórmula de Haversine (`src/utils/geoUtils.js`) para calcular a distância em linha reta entre as coordenadas GPS do restaurante e as coordenadas marcadas pelo cliente no `MapPicker.jsx`.

## 5. Manutenção de Código
- **Linting:** O projeto utiliza ESLint para garantir a qualidade do código.
- **Build:** Realizado via `npm run build` gerando ficheiros estáticos na pasta `/dist`.
