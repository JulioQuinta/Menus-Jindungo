import { supabase } from '../lib/supabaseClient';
import { SECTORS, getSectorDetails } from './sectorConfig';
import { localDbService } from '../lib/localDb';

export const DEMO_DATA_BY_SECTOR = {
    [SECTORS.PHARMACY]: [
        {
            name: '💊 Medicamentos Sujeitos a Receita',
            description: 'Fármacos sob controlo e prescrição médica',
            illustration: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80',
            items: [
                { name: 'Paracetamol 500mg (Caixa 20 Comp.)', active_ingredient: 'Paracetamol', description: 'Analgésico e antipirético. Tomar 1 comprimido de 8 em 8 horas.', price: 1500, barcode: '5601234567890', expiry_date: '2027-12-31', batch_number: 'LT-2024-001', dosage: '500mg', requires_prescription: false, health_iva_exemption: true },
                { name: 'Amoxicilina 500mg (Caixa 16 Comp.)', active_ingredient: 'Amoxicilina', description: 'Antibiótico de largo espectro sob receita médica.', price: 3800, barcode: '5601234567891', expiry_date: '2026-10-31', batch_number: 'LT-2024-002', dosage: '500mg', requires_prescription: true, health_iva_exemption: true },
                { name: 'Ibuprofeno 400mg (Caixa 20 Comp.)', active_ingredient: 'Ibuprofeno', description: 'Anti-inflamatório não esteroide para dores severas.', price: 2200, barcode: '5601234567892', expiry_date: '2027-08-15', batch_number: 'LT-2024-003', dosage: '400mg', requires_prescription: false, health_iva_exemption: true },
                { name: 'Omeprazol 20mg (Caixa 14 Cáp.)', active_ingredient: 'Omeprazol', description: 'Protetor gástrico para azia e refluxo gastroesofágico.', price: 2900, barcode: '5601234567893', expiry_date: '2027-05-20', batch_number: 'LT-2024-004', dosage: '20mg', requires_prescription: true, health_iva_exemption: true }
            ]
        },
        {
            name: '🧪 Medicamentos Sem Receita (MNSR)',
            description: 'Alívio rápido para sintomas comuns',
            illustration: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=600&q=80',
            items: [
                { name: 'Ben-u-ron 500mg', active_ingredient: 'Paracetamol', description: 'Comprimidos para alívio rápido de febre e dores de cabeça.', price: 1200, barcode: '5601234567894', expiry_date: '2027-11-30', batch_number: 'LT-2024-005', dosage: '500mg', requires_prescription: false, health_iva_exemption: true },
                { name: 'Gripecol Cápsulas Antigripal', active_ingredient: 'Paracetamol + Fenilefrina', description: 'Descongestionante nasal e alívio de sintomas de constipação.', price: 2500, barcode: '5601234567895', expiry_date: '2026-09-30', batch_number: 'LT-2024-006', dosage: 'Cápsulas', requires_prescription: false, health_iva_exemption: true },
                { name: 'Pastilhas Strepsils Mel e Limão', active_ingredient: 'Amilmetacresol + Álcool 2,4-diclorobenzílico', description: 'Alívio imediato para dor e irritação de garganta.', price: 1800, barcode: '5601234567896', expiry_date: '2027-04-10', batch_number: 'LT-2024-007', dosage: 'Pastilhas', requires_prescription: false, health_iva_exemption: true }
            ]
        },
        {
            name: '🧴 Xaropes & Vias Respiratórias',
            description: 'Tratamento da tosse e expetoração',
            illustration: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=600&q=80',
            items: [
                { name: 'Xarope Bisolvon 200ml', description: 'Mucolítico para tosse com expetoração.', price: 3200, barcode: '5601234567897', expiry_date: '2027-01-15', batch_number: 'LT-2024-008', dosage: '200ml' },
                { name: 'Xarope Broncoliber Infantil 100ml', description: 'Tratamento suave para tosse seca e alérgica em crianças.', price: 3500, barcode: '5601234567898', expiry_date: '2026-12-01', batch_number: 'LT-2024-009', dosage: '100ml' },
                { name: 'Gotas Aero-Om 100ml', description: 'Tratamento de cólicas e gases infantis.', price: 2800, barcode: '5601234567899', expiry_date: '2027-03-31', batch_number: 'LT-2024-010', dosage: '100ml' }
            ]
        },
        {
            name: '🩹 Primeiros Socorros & Curativos',
            description: 'Material asséptico e socorros imediatos',
            illustration: 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?w=600&q=80',
            items: [
                { name: 'Compressas Esterilizadas 10x10 (Embalagem 5un)', description: 'Compressas de gaze de algodão purificado.', price: 800, barcode: '5601234567900', expiry_date: '2029-12-31', batch_number: 'LT-2024-011', dosage: '10x10cm' },
                { name: 'Álcool Etílico 70% 500ml', description: 'Desinfetante antissético para pele e feridas.', price: 1400, barcode: '5601234567901', expiry_date: '2028-06-30', batch_number: 'LT-2024-012', dosage: '500ml' },
                { name: 'Betadine Solução Cutânea 100ml', description: 'Antissético de iodopovidona para desinfeção.', price: 2600, barcode: '5601234567902', expiry_date: '2027-07-31', batch_number: 'LT-2024-013', dosage: '100ml' },
                { name: 'Pensos Rápidos Sortidos (Caixa 20un)', description: 'Pensos impermeáveis para pequenas feridas.', price: 950, barcode: '5601234567903', expiry_date: '2029-01-01', batch_number: 'LT-2024-014', dosage: '20 un' }
            ]
        },
        {
            name: '🍊 Vitaminas & Suplementos',
            description: 'Reforço do sistema imunitário e vitalidade',
            illustration: 'https://images.unsplash.com/photo-1550572017-edf792891f13?w=600&q=80',
            items: [
                { name: 'Vitamina C 1000mg Efervescente (20 Comp.)', description: 'Reforço imunológico sabor a laranja.', price: 3400, barcode: '5601234567904', expiry_date: '2027-09-30', batch_number: 'LT-2024-015', dosage: '1000mg' },
                { name: 'Multivitamínico Supradyn Protovit 30 Comp.', description: 'Complexo de vitaminas e minerais de toma diária.', price: 6500, barcode: '5601234567905', expiry_date: '2027-02-28', batch_number: 'LT-2024-016', dosage: '30 Comp.' },
                { name: 'Magne B6 (Caixa 60 Comprimidos)', description: 'Suplemento de magnésio para fadiga e cãibras.', price: 4200, barcode: '5601234567906', expiry_date: '2027-06-30', batch_number: 'LT-2024-017', dosage: '60 Comp.' }
            ]
        },
        {
            name: '👶 Puericultura & Bebé',
            description: 'Alimentação e higiene infantil',
            illustration: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&q=80',
            items: [
                { name: 'Leite Aptamil 1 800g', description: 'Fórmula infantil de início para lactentes.', price: 11500, barcode: '5601234567907', expiry_date: '2026-11-30', batch_number: 'LT-2024-018', dosage: '800g' },
                { name: 'Fraldas Dodot Activity Tamanho 3 (40un)', description: 'Máxima absorção e conforto diurno e noturno.', price: 8900, barcode: '5601234567908', expiry_date: '2029-12-31', batch_number: 'LT-2024-019', dosage: 'Tam 3' },
                { name: 'Toalhetes Pampers Sensitive (Pacote 56un)', description: 'Sem perfume para pele sensível do bebé.', price: 1900, barcode: '5601234567909', expiry_date: '2028-04-30', batch_number: 'LT-2024-020', dosage: '56 un' }
            ]
        },
        {
            name: '🧴 Dermocosmética & Cuidados',
            description: 'Hidratação e proteção solar avançada',
            illustration: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80',
            items: [
                { name: 'Creme Hidratante CeraVe 177ml', description: 'Creme hidratante com ceramidas essenciais.', price: 7800, barcode: '5601234567910', expiry_date: '2027-10-31', batch_number: 'LT-2024-021', dosage: '177ml' },
                { name: 'Protetor Solar Anthelios FPS50+ 50ml', description: 'Proteção solar toque seco de alta eficácia.', price: 9900, barcode: '5601234567911', expiry_date: '2027-05-31', batch_number: 'LT-2024-022', dosage: 'FPS50+' },
                { name: 'Pasta Dentes Sensodyne Alívio Rápido 75ml', description: 'Creme dental para sensibilidade dentária.', price: 2100, barcode: '5601234567912', expiry_date: '2028-02-28', batch_number: 'LT-2024-023', dosage: '75ml' }
            ]
        },
        {
            name: '🩺 Dispositivos Médicos & Medição',
            description: 'Aparelhos de diagnóstico doméstico',
            illustration: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=600&q=80',
            items: [
                { name: 'Tensionómetro Digital de Braço Omron', description: 'Medidor de pressão arterial automático certificado.', price: 28500, barcode: '5601234567913', expiry_date: '2030-12-31', batch_number: 'LT-2024-024', dosage: 'Unidade' },
                { name: 'Termómetro Digital Infravermelhos Sem Contacto', description: 'Medição rápida em 1 segundo com ecrã LCD.', price: 12500, barcode: '5601234567914', expiry_date: '2030-12-31', batch_number: 'LT-2024-025', dosage: 'Unidade' },
                { name: 'Oxímetro de Pulso Digital Fingertip', description: 'Mede saturação de oxigénio SpO2 e pulsação.', price: 9500, barcode: '5601234567915', expiry_date: '2030-12-31', batch_number: 'LT-2024-026', dosage: 'Unidade' }
            ]
        }
    ],

    [SECTORS.BAKERY]: [
        {
            name: '🍞 Pães & Carcaças Frescas',
            description: 'Saídos do forno a toda a hora',
            illustration: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
            items: [
                { name: 'Pão Cacetinho / Carcaça (Unidade)', description: 'Pão crocante por fora e macio por dentro.', price: 100, barcode: '560200000001' },
                { name: 'Pão de Forma Artesanal 500g', description: 'Fatiado ideal para torradas e sandes.', price: 1200, barcode: '560200000002' },
                { name: 'Pão de Deus com Coco', description: 'Massa fofa coberta com pasta doce de coco.', price: 500, barcode: '560200000003' },
                { name: 'Pão com Chouriço Caseiro', description: 'Massa de pão recheada com chouriço assado.', price: 800, barcode: '560200000004' }
            ]
        },
        {
            name: '🥐 Croissants & Folhados',
            description: 'Folhado estaladiço com manteiga pura',
            illustration: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80',
            items: [
                { name: 'Croissant Francês Simples', description: 'Massa folhada com manteiga de fabrico próprio.', price: 400, barcode: '560200000005' },
                { name: 'Croissant Recheado com Chocolate', description: 'Recheado com creme de avelã e chocolate.', price: 650, barcode: '560200000006' },
                { name: 'Folhado de Salsicha e Queijo', description: 'Lanche folhado salgado quente.', price: 700, barcode: '560200000007' }
            ]
        },
        {
            name: '🧁 Pastéis & Doces Tradicionais',
            description: 'Especialidades de pastelaria fina',
            illustration: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=600&q=80',
            items: [
                { name: 'Pastel de Nata Crocante', description: 'Creme de ovos com canela em polvilho.', price: 350, barcode: '560200000008' },
                { name: 'Bola de Berlim com Creme de Ovos', description: 'Frita no momento com açúcar polvilhado.', price: 500, barcode: '560200000009' },
                { name: 'Queijada de Sintra', description: 'Doce tradicional de queijo fresco e canela.', price: 450, barcode: '560200000010' },
                { name: 'Torta de Laranja Fofinha (Fatia)', description: 'Massa húmida e alaranjada.', price: 600, barcode: '560200000011' }
            ]
        },
        {
            name: '🎂 Bolos de Aniversário & Encomendas',
            description: 'Bolos inteiros para celebrações',
            illustration: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80',
            items: [
                { name: 'Bolo Red Velvet (Inteiro 1.5kg)', description: 'Bolo aveludado vermelho com creme mascarpone.', price: 14500, barcode: '560200000012' },
                { name: 'Bolo Brigadeiro de Chocolate 1kg', description: 'Coberto com granulado fino de chocolate belga.', price: 12000, barcode: '560200000013' }
            ]
        },
        {
            name: '☕ Bebidas Quentes & Cafetaria',
            description: 'Cafés e infusões para acompanhar',
            illustration: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&q=80',
            items: [
                { name: 'Café Expresso Delta', description: 'Café curto enérgico e cremoso.', price: 200, barcode: '560200000014' },
                { name: 'Galão Quente em Copo Alto', description: 'Café com bastante leite quente vaporizado.', price: 450, barcode: '560200000015' },
                { name: 'Chá de Limão & Mel', description: 'Infusão reconfortante.', price: 350, barcode: '560200000016' }
            ]
        }
    ],

    [SECTORS.SUPERMARKET]: [
        {
            name: '🌾 Mercearia & Grãos',
            description: 'Alimentos essenciais de cesta básica',
            illustration: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80',
            items: [
                { name: 'Arroz Bom Sucesso Agulha 1kg', description: 'Arroz de grão longo tipo 1.', price: 1200, barcode: '560300000001' },
                { name: 'Fuba de Milho Amarelo 1kg', description: 'Fuba fina ideal para funge tradicional.', price: 800, barcode: '560300000002' },
                { name: 'Óleo Alimentar 1L', description: 'Óleo vegetal refinado para fritura e cozinha.', price: 1500, barcode: '560300000003' },
                { name: 'Açúcar Castanho de Cana 1kg', description: 'Açúcar não refinado de alta qualidade.', price: 1100, barcode: '560300000004' }
            ]
        },
        {
            name: '🥩 Talho & Carnes Frescas',
            description: 'Cortes selecionados e inspecionados',
            illustration: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=600&q=80',
            items: [
                { name: 'Carne de Novilho p/ Estufar (1kg)', description: 'Carne macia de vaca cortada em cubos.', price: 6500, barcode: '560300000005' },
                { name: 'Frango Inteiro Limpo (kg)', description: 'Frango fresco sem miudezas.', price: 2800, barcode: '560300000006' },
                { name: 'Entrecosto de Porco Temperado (kg)', description: 'Ideal para grelhar na brasa.', price: 4200, barcode: '560300000007' }
            ]
        },
        {
            name: '🥛 Lacticínios & Refrigerados',
            description: 'Leites, queijos e manteigas',
            illustration: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80',
            items: [
                { name: 'Leite Meio Gordo Mimosa 1L', description: 'UHT rico em cálcio e vitaminas.', price: 950, barcode: '560300000008' },
                { name: 'Queijo Flamengo Fatiado 200g', description: 'Queijo suave em fatias práticas.', price: 1800, barcode: '560300000009' },
                { name: 'Manteiga com Sal 250g', description: 'Manteiga cremosa para barrar no pão.', price: 1600, barcode: '560300000010' }
            ]
        },
        {
            name: '🧼 Limpeza & Higiene do Lar',
            description: 'Detergentes e desinfetantes',
            illustration: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&q=80',
            items: [
                { name: 'Detergente em Pó OMO 1kg', description: 'Lava roupa com perfume duradouro.', price: 2100, barcode: '560300000011' },
                { name: 'Lixívia Neoblanc 2L', description: 'Desinfetante e branqueador de superfícies.', price: 1300, barcode: '560300000012' },
                { name: 'Papel Higiénico Folha Dupla (Pacote 4un)', description: 'Suave e absorvente.', price: 1100, barcode: '560300000013' }
            ]
        }
    ],

    [SECTORS.RETAIL]: [
        {
            name: '👕 Vestuário & Moda Masculina/Feminina',
            description: 'Coleção casual e executiva',
            illustration: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
            items: [
                { name: 'T-Shirt Algodão Premium (Preto/Branco)', description: '100% algodão penteado de toque suave.', price: 4500, barcode: '560400000001' },
                { name: 'Calças Jeans Slim Fit Dark Denim', description: 'Corte moderno com elasticidade confortável.', price: 12500, barcode: '560400000002' },
                { name: 'Camisa Social de Linho Manga Comprida', description: 'Elegante para eventos e reuniões de trabalho.', price: 16800, barcode: '560400000003' }
            ]
        },
        {
            name: '👟 Calçado & Acessórios',
            description: 'Sapatilhas, cintos e carteiras',
            illustration: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&q=80',
            items: [
                { name: 'Sapatilhas Desportivas Urban White', description: 'Sola amortecida e acabamento respirável.', price: 24900, barcode: '560400000004' },
                { name: 'Cinto de Couro Legítimo Castanho', description: 'Fivela de aço inoxidável antialérgica.', price: 6500, barcode: '560400000005' },
                { name: 'Carteira de Couro com Proteção RFID', description: 'Bloqueio de leitura por aproximação de cartões.', price: 8900, barcode: '560400000006' }
            ]
        },
        {
            name: '📱 Eletrónica & Gadgets',
            description: 'Acessórios de tecnologia móvel',
            illustration: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
            items: [
                { name: 'Cabo Carregador USB-C Carga Rápida 2m', description: 'Trançado em nylon ultra resistente.', price: 3500, barcode: '560400000007' },
                { name: 'Fones Bluetooth TWS com Cancelamento Ruído', description: 'Bateria para 24h de reprodução contínua.', price: 18500, barcode: '560400000008' },
                { name: 'Carregador Portátil Powerbank 10.000mAh', description: 'Dupla saída USB com indicador de LED.', price: 9800, barcode: '560400000009' }
            ]
        }
    ],

    [SECTORS.AUTOMOTIVE]: [
        {
            name: '🛢️ Óleos & Lubrificantes',
            description: 'Fluidos e lubrificantes de motor',
            illustration: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&q=80',
            items: [
                { name: 'Óleo Sintético 5W30 Castrol 4L', description: 'Lubrificante de alta performance para motores a gasolina/diesel.', price: 22000, barcode: '560500000001' },
                { name: 'Líquido de Travões DOT4 500ml', description: 'Alta resistência a elevadas temperaturas de travagem.', price: 3500, barcode: '560500000002' },
                { name: 'Líquido Anticongelante Radiador 5L', description: 'Proteção contra corrosão e sobreaquecimento.', price: 6800, barcode: '560500000003' }
            ]
        },
        {
            name: '🚗 Peças de Manutenção & Suspensão',
            description: 'Componentes mecânicos de substituição',
            illustration: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&q=80',
            items: [
                { name: 'Filtro de Óleo Bosch Universal', description: 'Filtragem de resíduos do motor.', price: 4500, barcode: '560500000004' },
                { name: 'Jogo de Pastilhas de Travão Dianteiras', description: 'Composto cerâmico de travagem silenciosa.', price: 14500, barcode: '560500000005' },
                { name: 'Vela de Ignição Iridium NGK (Jogo 4un)', description: 'Melhor arranque e consumo de combustível eficiente.', price: 12000, barcode: '560500000006' }
            ]
        },
        {
            name: '⚙️ Serviços & Mão de Obra Oficina',
            description: 'Serviços técnicos de oficina mecânica',
            illustration: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&q=80',
            items: [
                { name: 'Mudança de Óleo e Filtros (Mão de Obra)', description: 'Substituição completa com verificação de níveis.', price: 5000, barcode: '560500000007' },
                { name: 'Alinhamento de Direção & Calibragem 4 Rodas', description: 'Ajuste computadorizado de convergência.', price: 8500, barcode: '560500000008' },
                { name: 'Diagnóstico Eletrónico Computadorizado OBD2', description: 'Leitura e reset de códigos de erro de centralina.', price: 7000, barcode: '560500000009' }
            ]
        }
    ],

    [SECTORS.BEAUTY_SPA]: [
        {
            name: '✂️ Serviços de Cabelo & Barba',
            description: 'Cortes, alinhamentos e coloração',
            illustration: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80',
            items: [
                { name: 'Corte de Cabelo Masculino + Barba VIP', description: 'Corte tesoura/máquina com toalha quente e pomada.', price: 4500, barcode: '560600000001' },
                { name: 'Escova Progressiva / Definitiva', description: 'Alisamento e nutrição capilar intensiva.', price: 18000, barcode: '560600000002' },
                { name: 'Coloração & Madeixas Balayage', description: 'Tonalização profissional de tom.', price: 25000, barcode: '560600000003' }
            ]
        },
        {
            name: '💅 Manicure & Estética de Unhas',
            description: 'Cuidado e embelezamento de mãos e pés',
            illustration: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80',
            items: [
                { name: 'Verniz Gel / Gelinho em Unha Natural', description: 'Secagem UV com duração de 3 a 4 semanas.', price: 5500, barcode: '560600000004' },
                { name: 'Pedicure Completa Spa com Esfoliação', description: 'Hidratação profunda e remoção de calosidades.', price: 6500, barcode: '560600000005' }
            ]
        },
        {
            name: '🧴 Cosméticos & Shampoos Profissionais',
            description: 'Produtos de manutenção em casa',
            illustration: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80',
            items: [
                { name: 'Champô Profissional Sem Sulfatos 500ml', description: 'Para manutenção de alisamentos e cor.', price: 8500, barcode: '560600000006' },
                { name: 'Óleo de Barba Hidratante Argan 50ml', description: 'Amacia a barba e perfuma delicadamente.', price: 4200, barcode: '560600000007' }
            ]
        }
    ],

    [SECTORS.HEALTH_MEDICAL]: [
        {
            name: '🩺 Consultas Médicas Especializadas',
            description: 'Atendimento clínico com médicos certificados',
            illustration: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&q=80',
            items: [
                { name: 'Consulta de Medicina Geral & Familiar', description: 'Avaliação clínica completa e check-up.', price: 12000, barcode: '560700000001' },
                { name: 'Consulta de Pediatria', description: 'Acompanhamento do desenvolvimento infantil.', price: 15000, barcode: '560700000002' },
                { name: 'Consulta de Medicina Dentária / Odontologia', description: 'Avaliação da saúde oral e diagnóstico.', price: 14000, barcode: '560700000003' }
            ]
        },
        {
            name: '🔬 Análises & Exames de Diagnóstico',
            description: 'Exames laboratoriais e imagem',
            illustration: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600&q=80',
            items: [
                { name: 'Análise de Sangue - Hemograma Completo', description: 'Exame sanguíneo quantitativo e qualitativo.', price: 4500, barcode: '560700000004' },
                { name: 'Ecografia Abdominal Total', description: 'Exame de ultrassom de órgãos abdominais.', price: 18000, barcode: '560700000005' },
                { name: 'Eletrocardiograma (ECG) com Relatório', description: 'Avaliação da atividade elétrica cardíaca.', price: 8500, barcode: '560700000006' }
            ]
        }
    ],

    [SECTORS.SERVICES]: [
        {
            name: '💼 Serviços Profissionais & Consultoria',
            description: 'Prestação de serviços técnicos e consultorias',
            illustration: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80',
            items: [
                { name: 'Hora de Consultoria Técnica Especializada', description: 'Diagnóstico e parecer profissional.', price: 15000, barcode: '560800000001' },
                { name: 'Elaboração de Relatório Técnico de Projeto', description: 'Documentação técnica formal com assinatura digital.', price: 45000, barcode: '560800000002' },
                { name: 'Manutenção Preventiva Mensal (Contrato)', description: 'Serviço contínuo de suporte e assistência.', price: 35000, barcode: '560800000003' }
            ]
        }
    ],

    [SECTORS.RESTAURANT]: [
        {
            name: '☕ Pequeno-Almoço',
            description: 'Para começar bem o dia',
            illustration: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&q=80',
            items: [
                { name: 'Menu Matabicho', description: 'Café, torrada e sumo natural', price: 2500 },
                { name: 'Ovos Mexidos com Bacon', description: 'Acompanha pão torrado', price: 3000 }
            ]
        },
        {
            name: '🌮 Entradas',
            description: 'Pequenas maravilhas para abrir o apetite',
            illustration: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&q=80',
            items: [
                { name: 'Chamuças de Carne', description: 'Porção de 3 unidades bem recheadas', price: 1500 },
                { name: 'Tábua de Queijos e Enchidos', description: 'Seleção premium para partilhar', price: 8500 },
                { name: 'Pão de Alho', description: 'Com queijo derretido', price: 1200 }
            ]
        },
        {
            name: '🥘 Pratos de Carne',
            description: 'As melhores carnes na grelha e no tacho',
            illustration: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80',
            items: [
                { name: 'Bife à Casa Jindungo', description: 'Bife da vazia com molho secreto e batatas', price: 9500 },
                { name: 'Mufete Tradicional', description: 'Peixe assado com feijão de óleo de palma e mandioca', price: 7500 },
                { name: 'Frango Assado à Brasa', description: 'Acompanhado com arroz e salada mista', price: 6000 }
            ]
        },
        {
            name: '🐟 Pratos de Peixe',
            description: 'Frescos direto do mar',
            illustration: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&q=80',
            items: [
                { name: 'Bacalhau com Natas', description: 'O clássico irresistível', price: 8500 },
                { name: 'Peixe Cacusso Frito', description: 'Com funge e molho caseiro', price: 5500 }
            ]
        },
        {
            name: '🍰 Sobremesas',
            description: 'O momento doce da refeição',
            illustration: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&q=80',
            items: [
                { name: 'Mousse de Maracujá', description: 'Feita com fruta fresca', price: 2000 },
                { name: 'Pudim Caseiro', description: 'A receita secreta da Avó', price: 2500 }
            ]
        },
        {
            name: '🥤 Bebidas & Sumos',
            description: 'Para acompanhar a sua refeição',
            illustration: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&q=80',
            items: [
                { name: 'Refrigerante em Lata', description: 'Bebidas gasosas diversas', price: 1000 },
                { name: 'Água Mineral 500ml', description: 'Fresco e purificada', price: 500 },
                { name: 'Sumo Natural de Laranja', description: 'Feito no momento', price: 2000 }
            ]
        }
    ]
};

export const populateDemoData = async (restaurantId, sectorIdOverride = null) => {
    if (!restaurantId) return { success: false, message: 'ID do Estabelecimento é obrigatório' };

    const delay = ms => new Promise(res => setTimeout(res, ms));

    try {
        let activeSector = sectorIdOverride;

        // Se o sectorIdOverride não for passado, procurar na tabela de estabelecimentos
        if (!activeSector) {
            try {
                const { data: restData } = await supabase
                    .from('restaurants')
                    .select('business_sector')
                    .eq('id', restaurantId)
                    .maybeSingle();
                if (restData?.business_sector) {
                    activeSector = restData.business_sector;
                }
            } catch (e) {
                console.warn("Could not fetch business_sector from Supabase:", e);
            }
        }

        const sectorDetails = getSectorDetails(activeSector);
        const demoCategories = DEMO_DATA_BY_SECTOR[activeSector] || DEMO_DATA_BY_SECTOR[SECTORS.RESTAURANT];

        let insertedCategoriesCount = 0;
        let insertedItemsCount = 0;

        for (let i = 0; i < demoCategories.length; i++) {
            const cat = demoCategories[i];
            let catData = null;

            // 1. Tentar Inserir Categoria no Supabase
            try {
                const { data: catDataArray, error: catError } = await supabase
                    .from('categories')
                    .insert([{
                        restaurant_id: restaurantId,
                        label: cat.name,
                        sort_order: i,
                        subcategories: []
                    }])
                    .select();

                if (Array.isArray(catDataArray) && catDataArray.length > 0) {
                    catData = catDataArray[0];
                } else if (!catError) {
                    const { data: existing } = await supabase
                        .from('categories')
                        .select('*')
                        .eq('restaurant_id', restaurantId)
                        .eq('label', cat.name)
                        .maybeSingle();
                    catData = existing;
                }
            } catch (err) {
                console.warn("Supabase category insert exception:", err);
            }

            // Fallback para IndexedDB local se o Supabase falhar ou estiver offline / RLS
            if (!catData) {
                const localCatId = `demo-cat-${Date.now()}-${i}`;
                catData = { id: localCatId, label: cat.name, sort_order: i, restaurant_id: restaurantId };
                try {
                    await localDbService.saveCategories([{ 
                        id: localCatId, 
                        restaurant_id: restaurantId, 
                        label: cat.name, 
                        sort_order: i 
                    }]);
                } catch (e) {
                    console.warn("LocalDB category save fallback exception:", e);
                }
            }

            insertedCategoriesCount++;
            await delay(50);

            // 2. Inserir Produtos dessa categoria
            if (catData && cat.items && cat.items.length > 0) {
                const defaultImg = cat.illustration || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&q=80';

                const fullItemsToInsert = cat.items.map((item, index) => ({
                    category_id: catData.id,
                    restaurant_id: restaurantId,
                    name: item.name,
                    desc_text: item.description,
                    price: item.price,
                    available: true,
                    position: index,
                    img_url: defaultImg,
                    barcode: item.barcode || null,
                    expiry_date: item.expiry_date || null,
                    batch_number: item.batch_number || null,
                    dosage: item.dosage || null
                }));

                const baseItemsToInsert = cat.items.map((item, index) => ({
                    category_id: catData.id,
                    restaurant_id: restaurantId,
                    name: item.name,
                    desc_text: item.description,
                    price: item.price,
                    available: true,
                    position: index,
                    img_url: defaultImg
                }));

                let itemInsertedSuccess = false;

                // Tentar payload completo no Supabase
                try {
                    const { data: insertedData, error: itemError } = await supabase
                        .from('menu_items')
                        .insert(fullItemsToInsert)
                        .select();
                    if (!itemError && insertedData) {
                        itemInsertedSuccess = true;
                        localDbService.saveMenuItems(insertedData).catch(err => console.warn(err));
                    }
                } catch (e) {
                    console.warn("Full items insert exception:", e);
                }

                // Tentar payload base se o completo falhar
                if (!itemInsertedSuccess) {
                    try {
                        const { data: baseData, error: baseError } = await supabase
                            .from('menu_items')
                            .insert(baseItemsToInsert)
                            .select();
                        if (!baseError && baseData) {
                            itemInsertedSuccess = true;
                            localDbService.saveMenuItems(baseData).catch(err => console.warn(err));
                        }
                    } catch (e) {
                        console.warn("Base items insert exception:", e);
                    }
                }

                // Fallback para IndexedDB local se Supabase falhar
                if (!itemInsertedSuccess) {
                    const localItemsList = cat.items.map((item, index) => ({
                        id: `demo-item-${Date.now()}-${i}-${index}`,
                        category_id: catData.id,
                        restaurant_id: restaurantId,
                        name: item.name,
                        desc_text: item.description,
                        price: item.price,
                        available: true,
                        position: index,
                        img_url: defaultImg,
                        barcode: item.barcode || null,
                        expiry_date: item.expiry_date || null,
                        batch_number: item.batch_number || null,
                        dosage: item.dosage || null
                    }));
                    await localDbService.saveMenuItems(localItemsList).catch(err => console.warn(err));
                }

                insertedItemsCount += cat.items.length;
                await delay(50);
            }
        }

        return { 
            success: true, 
            message: `Catálogo de Demonstração de ${sectorDetails.name} carregado com sucesso! ${insertedCategoriesCount} Categorias e ${insertedItemsCount} Artigos.` 
        };

    } catch (error) {
        console.error("Erro Fatal no Populate Demo:", error);
        return { success: false, message: error.message || 'Erro desconhecido ao carregar dados' };
    }
};
