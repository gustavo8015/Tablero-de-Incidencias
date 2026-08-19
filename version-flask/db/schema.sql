-- ============================================================
-- Tablero de Incidencias de Vehículos Eléctricos
-- Motor: SQLite 3
-- Archivo generado: db/schema.sql
-- ============================================================

DROP TABLE IF EXISTS incidencias;
DROP TABLE IF EXISTS vehiculos;

-- ------------------------------------------------------------
-- Tabla maestra de vehículos eléctricos de la flota
-- ------------------------------------------------------------
CREATE TABLE vehiculos (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    placa        TEXT NOT NULL UNIQUE,
    marca        TEXT NOT NULL,
    modelo       TEXT NOT NULL,
    anio         INTEGER NOT NULL,
    autonomia_km INTEGER NOT NULL
);

-- ------------------------------------------------------------
-- Tabla transaccional de incidencias
-- ------------------------------------------------------------
CREATE TABLE incidencias (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    vehiculo_id  INTEGER NOT NULL,
    tipo         TEXT NOT NULL CHECK (tipo IN (
                     'Batería','Sistema de carga','Frenos','Neumáticos',
                     'Software','Motor eléctrico','Carrocería','Climatización')),
    fecha        TEXT NOT NULL,                       -- formato ISO: YYYY-MM-DD
    ubicacion    TEXT NOT NULL,
    prioridad    TEXT NOT NULL CHECK (prioridad IN ('Alta','Media','Baja')),
    estado       TEXT NOT NULL CHECK (estado IN ('Pendiente','En proceso','Solucionada')),
    descripcion  TEXT,
    reportado_por TEXT,
    creado_en    TEXT NOT NULL DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

CREATE INDEX idx_inc_estado    ON incidencias(estado);
CREATE INDEX idx_inc_prioridad ON incidencias(prioridad);
CREATE INDEX idx_inc_tipo      ON incidencias(tipo);
CREATE INDEX idx_inc_fecha     ON incidencias(fecha);

-- ------------------------------------------------------------
-- Datos semilla: flota
-- ------------------------------------------------------------
INSERT INTO vehiculos (placa, marca, modelo, anio, autonomia_km) VALUES
 ('EVC-101','Renault','Kangoo Z.E.',2022,270),
 ('EVC-102','BYD','e6',2023,400),
 ('EVC-103','Nissan','Leaf',2021,385),
 ('EVC-104','Kia','Niro EV',2023,455),
 ('EVC-105','JAC','iEV7S',2022,300),
 ('EVC-106','Volvo','FL Electric',2024,300),
 ('EVC-107','Tesla','Model 3',2023,510),
 ('EVC-108','Chevrolet','Bolt EUV',2022,397);

-- ------------------------------------------------------------
-- Datos semilla: incidencias (18 registros > mínimo exigido de 5)
-- ------------------------------------------------------------
INSERT INTO incidencias (vehiculo_id, tipo, fecha, ubicacion, prioridad, estado, descripcion, reportado_por) VALUES
 (1,'Batería',          '2026-08-01','Bogotá - Patio Norte',   'Alta', 'Pendiente',  'Caída de SOC del 20% en menos de 40 km de recorrido.',            'Carlos Peña'),
 (2,'Sistema de carga', '2026-08-02','Medellín - Centro',      'Alta', 'En proceso', 'El cargador rápido corta la sesión a los 5 minutos.',              'Laura Mejía'),
 (3,'Frenos',           '2026-08-03','Cali - Sur',             'Media','Solucionada','Ruido en frenado regenerativo; se ajustaron pastillas.',           'Andrés Ruiz'),
 (4,'Neumáticos',       '2026-08-04','Bogotá - Patio Sur',     'Baja', 'Solucionada','Presión baja en llanta trasera derecha; se calibró.',              'Marta Gómez'),
 (5,'Software',         '2026-08-05','Barranquilla - Puerto',  'Media','Pendiente',  'La pantalla de infoentretenimiento se reinicia sola.',             'Julián Ortiz'),
 (6,'Motor eléctrico',  '2026-08-06','Medellín - Norte',       'Alta', 'Pendiente',  'Pérdida de potencia en pendientes y código de falla P0A3F.',       'Laura Mejía'),
 (7,'Climatización',    '2026-08-07','Bogotá - Patio Norte',   'Baja', 'En proceso', 'Aire acondicionado no enfría al máximo.',                          'Carlos Peña'),
 (8,'Carrocería',       '2026-08-08','Cali - Sur',             'Baja', 'Solucionada','Rayón en puerta lateral izquierda; se hizo retoque.',              'Andrés Ruiz'),
 (1,'Sistema de carga', '2026-08-09','Bogotá - Patio Sur',     'Alta', 'En proceso', 'Puerto de carga AC no reconoce el conector Tipo 2.',               'Marta Gómez'),
 (2,'Software',         '2026-08-10','Medellín - Centro',      'Media','Solucionada','Actualización OTA fallida; se reinstaló firmware 4.2.1.',         'Julián Ortiz'),
 (3,'Batería',          '2026-08-11','Barranquilla - Puerto',  'Alta', 'Pendiente',  'Celda con desbalance detectado por el BMS.',                       'Laura Mejía'),
 (4,'Frenos',           '2026-08-12','Bogotá - Patio Norte',   'Media','En proceso', 'Pedal con recorrido largo; pendiente purga del sistema.',          'Carlos Peña'),
 (5,'Neumáticos',       '2026-08-13','Cali - Sur',             'Media','Pendiente',  'Desgaste irregular en el eje delantero.',                          'Andrés Ruiz'),
 (6,'Climatización',    '2026-08-14','Medellín - Norte',       'Baja', 'Solucionada','Filtro de cabina saturado; se reemplazó.',                         'Marta Gómez'),
 (7,'Motor eléctrico',  '2026-08-15','Bogotá - Patio Sur',     'Alta', 'En proceso', 'Vibración anormal del inversor sobre los 80 km/h.',                'Julián Ortiz'),
 (8,'Sistema de carga', '2026-08-16','Barranquilla - Puerto',  'Media','Pendiente',  'Cable de carga con aislamiento dañado.',                           'Laura Mejía'),
 (2,'Carrocería',       '2026-08-17','Medellín - Centro',      'Baja', 'Pendiente',  'Espejo retrovisor derecho flojo.',                                 'Carlos Peña'),
 (7,'Software',         '2026-08-18','Bogotá - Patio Norte',   'Alta', 'Pendiente',  'Falla intermitente del sistema de asistencia al conductor.',       'Andrés Ruiz');
