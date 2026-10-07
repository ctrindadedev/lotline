--liquibase formatted sql

--changeset ctrindadedev:seed-demo-plots context:demo
-- Sample plots around the map's initial view; only with the "demo" context, which docker compose enables.
INSERT INTO plots (id, boundary, price, description, contact) VALUES
  (gen_random_uuid(), ST_GeomFromText('POLYGON((-47.0400 -22.8850, -47.0385 -22.8850, -47.0385 -22.8838, -47.0400 -22.8838, -47.0400 -22.8850))', 4326),
   850000.00, 'Lote residencial plano perto da Chácara da Barra, com água e luz na rua.', 'vendas.barra@example.com'),
  (gen_random_uuid(), ST_GeomFromText('POLYGON((-47.0350 -22.9000, -47.0330 -22.9000, -47.0330 -22.8980, -47.0350 -22.8980, -47.0350 -22.9000))', 4326),
   1500000.00, 'Terreno comercial de esquina, bom para galpão ou loja.', '(19) 99999-0102'),
  (gen_random_uuid(), ST_GeomFromText('POLYGON((-46.9800 -22.8800, -46.9740 -22.8800, -46.9740 -22.8750, -46.9800 -22.8750, -46.9800 -22.8800))', 4326),
   900000.00, 'Chácara em Sousas com nascente e área de mata preservada.', 'chacaras.sousas@example.com'),
  (gen_random_uuid(), ST_GeomFromText('POLYGON((-47.1150 -22.9250, -47.1110 -22.9260, -47.1100 -22.9220, -47.1130 -22.9200, -47.1160 -22.9220, -47.1150 -22.9250))', 4326),
   420000.00, 'Terreno irregular em aclive, vista para a serra.', '(19) 99999-0104'),
  (gen_random_uuid(), ST_GeomFromText('POLYGON((-47.0950 -22.9400, -47.0850 -22.9500, -47.0950 -22.9500, -47.0950 -22.9400))', 4326),
   600000.00, 'Área triangular entre duas ruas, documentação em dia.', 'area.triangular@example.com'),
  (gen_random_uuid(), ST_GeomFromText('POLYGON((-47.0700 -22.9400, -47.0690 -22.9400, -47.0690 -22.9392, -47.0700 -22.9392, -47.0700 -22.9400))', 4326),
   180000.00, 'Lote pequeno em bairro residencial, ideal para a primeira casa.', '(19) 99999-0106');
--rollback DELETE FROM plots WHERE contact IN ('vendas.barra@example.com', '(19) 99999-0102', 'chacaras.sousas@example.com', '(19) 99999-0104', 'area.triangular@example.com', '(19) 99999-0106');
