"""
Tablero de Incidencias de Vehículos Eléctricos
----------------------------------------------
Backend Flask + SQLite.

Ejecución:
    pip install -r requirements.txt
    python app.py
    -> http://127.0.0.1:5000
"""
import os
import sqlite3
from datetime import date

from flask import Flask, g, jsonify, render_template, request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "db", "incidencias.db")
SCHEMA_PATH = os.path.join(BASE_DIR, "db", "schema.sql")

TIPOS = ['Batería', 'Sistema de carga', 'Frenos', 'Neumáticos',
         'Software', 'Motor eléctrico', 'Carrocería', 'Climatización']
PRIORIDADES = ['Alta', 'Media', 'Baja']
ESTADOS = ['Pendiente', 'En proceso', 'Solucionada']

app = Flask(__name__)


# ------------------------------------------------------------------
# Conexión a la base de datos
# ------------------------------------------------------------------
def get_db():
    """Devuelve la conexión SQLite asociada al contexto de la petición."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Crea la base de datos a partir de db/schema.sql si aún no existe."""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if os.path.exists(DB_PATH):
        return False
    with sqlite3.connect(DB_PATH) as con, open(SCHEMA_PATH, encoding="utf-8") as f:
        con.executescript(f.read())
    return True


# ------------------------------------------------------------------
# Consultas
# ------------------------------------------------------------------
SELECT_BASE = """
SELECT i.id, i.tipo, i.fecha, i.ubicacion, i.prioridad, i.estado,
       i.descripcion, i.reportado_por,
       v.placa, v.marca, v.modelo
FROM incidencias i
JOIN vehiculos v ON v.id = i.vehiculo_id
"""


def consultar_incidencias(estado=None, prioridad=None, tipo=None, buscar=None):
    """Consulta con filtros dinámicos usando consultas parametrizadas."""
    sql = SELECT_BASE
    condiciones, params = [], []

    if estado:
        condiciones.append("i.estado = ?")
        params.append(estado)
    if prioridad:
        condiciones.append("i.prioridad = ?")
        params.append(prioridad)
    if tipo:
        condiciones.append("i.tipo = ?")
        params.append(tipo)
    if buscar:
        condiciones.append("(v.placa LIKE ? OR i.ubicacion LIKE ? OR i.descripcion LIKE ?)")
        like = f"%{buscar}%"
        params += [like, like, like]

    if condiciones:
        sql += " WHERE " + " AND ".join(condiciones)
    sql += " ORDER BY CASE i.prioridad WHEN 'Alta' THEN 1 WHEN 'Media' THEN 2 ELSE 3 END, i.fecha DESC"

    return [dict(r) for r in get_db().execute(sql, params).fetchall()]


def agrupar(campo):
    sql = f"SELECT {campo} AS etiqueta, COUNT(*) AS total FROM incidencias GROUP BY {campo} ORDER BY total DESC"
    return [dict(r) for r in get_db().execute(sql).fetchall()]


# ------------------------------------------------------------------
# Rutas
# ------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html",
                           tipos=TIPOS, prioridades=PRIORIDADES,
                           estados=ESTADOS, hoy=date.today().isoformat())


@app.route("/api/incidencias", methods=["GET"])
def api_listar():
    datos = consultar_incidencias(
        estado=request.args.get("estado") or None,
        prioridad=request.args.get("prioridad") or None,
        tipo=request.args.get("tipo") or None,
        buscar=request.args.get("q") or None,
    )
    return jsonify({"total": len(datos), "incidencias": datos})


@app.route("/api/incidencias", methods=["POST"])
def api_crear():
    d = request.get_json(silent=True) or {}
    requeridos = ["placa", "tipo", "fecha", "ubicacion", "prioridad", "estado"]
    faltantes = [c for c in requeridos if not d.get(c)]
    if faltantes:
        return jsonify({"error": "Campos obligatorios faltantes", "campos": faltantes}), 400
    if d["tipo"] not in TIPOS or d["prioridad"] not in PRIORIDADES or d["estado"] not in ESTADOS:
        return jsonify({"error": "Valor no permitido en tipo, prioridad o estado"}), 400

    db = get_db()
    veh = db.execute("SELECT id FROM vehiculos WHERE placa = ?", (d["placa"].strip().upper(),)).fetchone()
    if veh is None:
        return jsonify({"error": f"La placa {d['placa']} no existe en la flota"}), 404

    cur = db.execute(
        """INSERT INTO incidencias (vehiculo_id, tipo, fecha, ubicacion, prioridad,
                                    estado, descripcion, reportado_por)
           VALUES (?,?,?,?,?,?,?,?)""",
        (veh["id"], d["tipo"], d["fecha"], d["ubicacion"].strip(), d["prioridad"],
         d["estado"], (d.get("descripcion") or "").strip(), (d.get("reportado_por") or "").strip()),
    )
    db.commit()
    return jsonify({"mensaje": "Incidencia registrada", "id": cur.lastrowid}), 201


@app.route("/api/incidencias/<int:inc_id>", methods=["PUT"])
def api_actualizar(inc_id):
    """Actualiza el estado y/o la prioridad de una incidencia existente."""
    d = request.get_json(silent=True) or {}
    campos, params = [], []
    if d.get("estado") in ESTADOS:
        campos.append("estado = ?")
        params.append(d["estado"])
    if d.get("prioridad") in PRIORIDADES:
        campos.append("prioridad = ?")
        params.append(d["prioridad"])
    if not campos:
        return jsonify({"error": "Nada que actualizar"}), 400

    params.append(inc_id)
    db = get_db()
    cur = db.execute(f"UPDATE incidencias SET {', '.join(campos)} WHERE id = ?", params)
    db.commit()
    if cur.rowcount == 0:
        return jsonify({"error": "Incidencia no encontrada"}), 404
    return jsonify({"mensaje": "Incidencia actualizada", "id": inc_id})


@app.route("/api/incidencias/<int:inc_id>", methods=["DELETE"])
def api_eliminar(inc_id):
    db = get_db()
    cur = db.execute("DELETE FROM incidencias WHERE id = ?", (inc_id,))
    db.commit()
    if cur.rowcount == 0:
        return jsonify({"error": "Incidencia no encontrada"}), 404
    return jsonify({"mensaje": "Incidencia eliminada", "id": inc_id})


@app.route("/api/metricas")
def api_metricas():
    db = get_db()
    fila = db.execute("""
        SELECT COUNT(*)                                                   AS total,
               SUM(CASE WHEN estado = 'Pendiente'   THEN 1 ELSE 0 END)    AS pendientes,
               SUM(CASE WHEN estado = 'En proceso'  THEN 1 ELSE 0 END)    AS en_proceso,
               SUM(CASE WHEN estado = 'Solucionada' THEN 1 ELSE 0 END)    AS solucionadas,
               SUM(CASE WHEN prioridad = 'Alta'     THEN 1 ELSE 0 END)    AS alta_prioridad
        FROM incidencias
    """).fetchone()
    m = {k: (fila[k] or 0) for k in fila.keys()}
    m["porcentaje_solucion"] = round(m["solucionadas"] * 100 / m["total"], 1) if m["total"] else 0
    return jsonify(m)


@app.route("/api/estadisticas")
def api_estadisticas():
    return jsonify({
        "por_tipo": agrupar("tipo"),
        "por_estado": agrupar("estado"),
        "por_prioridad": agrupar("prioridad"),
        "por_ubicacion": agrupar("ubicacion"),
    })


@app.route("/api/vehiculos")
def api_vehiculos():
    filas = get_db().execute("SELECT * FROM vehiculos ORDER BY placa").fetchall()
    return jsonify([dict(f) for f in filas])


@app.route("/api/salud")
def api_salud():
    """Evidencia de conexión: verifica que la BD responde y reporta su ruta."""
    try:
        db = get_db()
        n_inc = db.execute("SELECT COUNT(*) FROM incidencias").fetchone()[0]
        n_veh = db.execute("SELECT COUNT(*) FROM vehiculos").fetchone()[0]
        version = db.execute("SELECT sqlite_version()").fetchone()[0]
        return jsonify({
            "conexion": "OK", "motor": "SQLite " + version,
            "archivo_bd": DB_PATH,
            "tamano_bytes": os.path.getsize(DB_PATH),
            "registros": {"vehiculos": n_veh, "incidencias": n_inc},
        })
    except Exception as e:  # pragma: no cover
        return jsonify({"conexion": "ERROR", "detalle": str(e)}), 500


if __name__ == "__main__":
    creada = init_db()
    print(("Base de datos creada en " if creada else "Base de datos existente en ") + DB_PATH)
    app.run(host="127.0.0.1", port=5000, debug=True)
