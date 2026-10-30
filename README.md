# Planificador y kardex de materiales educativos

## Autor y propósito

Autor: [escriba su nombre o identificador académico autorizado].  
Actividad: organizar un pedido ficticio y controlar las existencias de materiales educativos.

## Ejecutar

Conserve juntos `index.html`, `styles.css`, `app.js`, `kardex.html`, `kardex.js` y `personalizacion.css`. Abra `index.html` en Chrome o Edge. No necesita instalar paquetes.

## Integración y responsabilidades

- `index.html` conserva el planificador S7 y enlaza la sección S9 mediante el marco `kardex-frame`, que carga `kardex.html`. Se usa un marco porque el navegador no incluye fragmentos HTML externos directamente al abrir archivos locales.
- `kardex.html` contiene la sección de materiales, movimientos, búsqueda, historial y exportación. Carga `kardex.js` y `personalizacion.css`.
- `kardex.js` mantiene una sola colección de materiales y otra de movimientos, valida las operaciones y persiste el kardex.
- `personalizacion.css` amplía `styles.css` con la etiqueta personalizada y una paleta violeta RGB legible.
- `app.js` conserva el cálculo y la validación del planificador, y ajusta la altura del marco del kardex.

La carpeta recibida contenía sólo los cuatro archivos del planificador; no incluía fragmentos S9 ni altas/listados de S8. Por eso se integró el kardex solicitado sin reemplazar el planificador ni inventar una segunda implementación S8. Cada material tiene un ID estable (`MAT-...`); las acciones de selección, edición y movimientos usan ese ID, no la posición del elemento en pantalla.

## Reglas y almacenamiento

El planificador conserva su presupuesto monetario de S/ 150.00, valida con las mismas reglas en Comprobar y Confirmar, y muestra total y saldo de dinero. El kardex calcula por separado las existencias físicas como entradas menos salidas. Las salidas no pueden exceder el saldo; los materiales con movimientos se pueden inactivar, pero no eliminar, y su historial se conserva. Sólo se elimina un material sin movimientos y después de aceptar la confirmación.

El kardex inicia con los materiales ficticios `MAT-001 · Cuaderno` y `MAT-002 · Lápices de colores`. Sus datos se guardan en `localStorage`, limitado a este navegador y origen; no hay una base compartida ni sincronización entre equipos. El botón CSV descarga una copia de movimientos con cantidades e IDs para abrir en Excel; editar el archivo no actualiza la aplicación.

## Personalización

La etiqueta personalizada dice «KARDEX · CONTROL DE EXISTENCIAS» y usa 1.15 rem, peso 800 y violeta `rgb(107, 33, 168)` con texto blanco. La paleta de `personalizacion.css` mantiene contraste para texto, estados y controles.

Autor y justificación personal de la etiqueta/paleta: [complete con su elección y motivo].

## Pruebas realizadas en la vista local

Para comprobar el límite del planificador se usaron 10 unidades a S/ 15.00 (igual al presupuesto) y luego S/ 15.01 (excede por S/ 0.10).

- Planificador: pedido vacío rechazado; pedido válido al límite aceptado; pedido que excede rechazado por Comprobar y Confirmar; la ficha anterior se conserva; Limpiar borra ficha y entradas.
- Kardex: entrada 10 y salida 3 dejan existencia 7; salida 8 se rechaza conservando saldo e historial.
- Kardex: cantidad cero rechazada; el código también valida negativos y decimales con `Number.isSafeInteger`.
- Kardex: búsqueda sin coincidencia descarta la selección previa; búsqueda vacía muestra la lista sin cambiar datos.
- Kardex: cambiar el nombre del segundo material por ID no alteró el nombre ni el historial del primero.
- Kardex: inactivar un material con movimientos conserva existencia 7 y los dos registros de historial; deshabilita movimientos nuevos.
- Kardex: tras recargar, se recuperaron materiales y movimientos desde `localStorage`.
- CSV: la interfaz confirmó la exportación de los dos movimientos. La carpeta de descarga no fue accesible para inspeccionar el contenido del archivo en esta verificación; confirme el CSV descargado antes de reportarlo como probado.
- Pendiente de comprobación manual: cancelar la confirmación de eliminación de un material sin movimientos y verificar que siga presente. La acción usa la confirmación cancelable del navegador.

La publicación en GitHub Pages no se ha realizado: requiere un repositorio propio y acceso a la cuenta GitHub del estudiante. Complete los enlaces y datos personales después de publicar.

## Aporte y ayuda recibida

[Describa sus cambios, errores encontrados, correcciones y ayuda recibida de personas o IA.]

## GitHub Pages y entrega

Suba los archivos extraídos a la raíz de su repositorio individual en GitHub. Para publicar, abra Settings > Pages > Deploy from a branch, elija `main` y `/(root)`, y guarde. Use la URL que muestre GitHub; compruebe el planificador y el kardex publicados. El repositorio y la cuenta deben ser suyos: no incluya contraseñas, datos reales de alumnos ni informes personales. GitHub Pages es un despliegue web; el CSV sigue siendo una copia, no una sincronización.

Repositorio: [enlace de su repositorio]  
Sitio publicado: [URL que GitHub muestre]

Entregue en MAXEDRA el PDF solicitado por el curso, con explicación, personalización, capturas, resultados de las pruebas y aportes. No incluya código, ZIP, Word ni imágenes sueltas si la consigna sólo admite el PDF.
