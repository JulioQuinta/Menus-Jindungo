-- ====================================================================
-- Nota de Otimização: Coordenadas GPS (Módulo 100% Gratuito)
-- ====================================================================

-- Este ficheiro serve como documentação de arquitetura.
-- Não é necessário executar nenhuma migração ou ALTER TABLE na base de dados!

-- As coordenadas obtidas via geolocalização do navegador (HTML5 Geolocation)
-- e OpenStreetMap (Nominatim) são automaticamente inseridas no campo
-- 'delivery_reference' da tabela 'orders' existente, na forma:
-- "Referência | GPS: -8.83833, 13.2344"

-- No painel do motoboy (MotoboyDashboard.jsx), a aplicação extrai as
-- coordenadas e gera um link direto para a App do Google Maps:
-- https://www.google.com/maps/dir/?api=1&destination=lat,lng
