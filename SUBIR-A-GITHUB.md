# Cómo publicar el tablero en GitHub Pages

**Tu repositorio ya está creado:** <https://github.com/gustavo8015/Tablero-de-Incidencias>
Ahora mismo está **vacío**. Solo faltan dos cosas: subir los archivos y activar Pages.

---

## Paso 1 — Subir los archivos

1. Descomprime el ZIP. Vas a ver una carpeta llamada `tablero-incidencias-ev`. **Ábrela.**
2. Entra a <https://github.com/gustavo8015/Tablero-de-Incidencias>
3. Pulsa el enlace azul **“uploading an existing file”**
   (está en el texto del centro de la página, en la sección *…or upload an existing file*).
4. Vuelve a la carpeta descomprimida, selecciona **todo lo que está DENTRO** de ella
   con `Ctrl + A` y arrástralo a la ventana de GitHub. Debes subir:

   ```
   index.html          ← el más importante, va en la raíz
   README.md
   EXPLICACION.md
   SUBIR-A-GITHUB.md
   capturas/           (carpeta)
   version-flask/      (carpeta)
   ```

   > ⚠️ **No arrastres la carpeta `tablero-incidencias-ev` completa.** Si lo haces,
   > `index.html` queda dentro de una subcarpeta y GitHub Pages no lo encontrará.

5. Espera a que terminen de subir (las imágenes tardan unos segundos).
6. Abajo, en *Commit changes*, escribe: `Prototipo de tablero de incidencias`
7. Pulsa el botón verde **Commit changes**.

**Verifica:** al recargar la página del repositorio debes ver `index.html` listado en la
raíz, junto con las carpetas `capturas` y `version-flask`.

---

## Paso 2 — Activar GitHub Pages

1. En tu repositorio, pestaña **Settings** (arriba, con el ícono de engranaje).
2. Menú lateral izquierdo → **Pages**.
3. En **Source** elige **Deploy from a branch**.
4. En **Branch** selecciona **`main`** y la carpeta **`/ (root)`**.
5. Pulsa **Save**.

---

## Paso 3 — Tu link

Espera entre **1 y 3 minutos**, recarga Settings → Pages y verás el recuadro verde con:

```
https://gustavo8015.github.io/Tablero-de-Incidencias/
```

**Ese es el link que debes entregar.** Ábrelo y confirma que se ven las 18 incidencias,
los cuatro indicadores y los tres gráficos.

---

## Si algo falla

| Problema | Causa y solución |
|---|---|
| **404 al abrir el link** | Lo más común: esperaste poco. Dale 3 minutos. Si sigue, revisa que `index.html` esté en la **raíz** del repositorio y no dentro de una subcarpeta. |
| **No aparece la opción Pages** | El repositorio debe ser **Public**. En Settings → General → abajo del todo → *Change repository visibility*. |
| **Se ve el texto `{{ t }}` y sin colores** | Estás abriendo `version-flask/templates/index.html`. Ese archivo es una plantilla de Python. El correcto es el `index.html` de la raíz. |
| **La rama no se llama `main`** | Si en Branch solo aparece `master`, selecciónala igual: funciona idéntico. |

---

## Sobre las dos versiones

**GitHub Pages solo sirve archivos estáticos: no puede ejecutar Python ni SQLite.**
Por eso el `index.html` de la raíz lleva los 18 registros embebidos y emula los mismos
endpoints de la API. Se ve y se comporta igual que el original.

La versión con **base de datos real** está en la carpeta `version-flask/` del mismo
repositorio. Es la que ejecutas en tu computador (doble clic en `INICIAR.bat`) para
mostrar la evidencia de conexión a SQLite que pide el entregable.
