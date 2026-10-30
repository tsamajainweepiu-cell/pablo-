"use strict";

(() => {
  const CLAVE = "et505.planificador.kardex.v1";
  const $ = id => document.getElementById(id);
  const controles = $("kardex-controles");
  const mensaje = $("kardex-mensaje");
  const estadoInicial = {
    version: 1,
    materiales: [
      { id: "MAT-001", nombre: "Cuaderno", activo: true },
      { id: "MAT-002", nombre: "Lápices de colores", activo: true }
    ],
    movimientos: []
  };
  let datos = null;
  let materialSeleccionadoId = null;
  let consultaActual = "";

  function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "kardex-mensaje" + (tipo ? " " + tipo : "");
    enviarAltura();
  }

  function enviarAltura() {
    if (window.parent === window) return;
    window.requestAnimationFrame(() => {
      const altura = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      window.parent.postMessage({ tipo: "et505-kardex-altura", altura }, "*");
    });
  }

  function validarDatos(estado) {
    if (!estado || estado.version !== 1 || !Array.isArray(estado.materiales) || !Array.isArray(estado.movimientos)) return false;
    const materiales = new Map();
    for (const material of estado.materiales) {
      if (!material || typeof material.id !== "string" || !material.id || typeof material.nombre !== "string" ||
          material.nombre.trim().length < 3 || typeof material.activo !== "boolean" || materiales.has(material.id)) return false;
      materiales.set(material.id, material);
    }
    const idsMovimiento = new Set();
    const saldos = new Map();
    for (const movimiento of estado.movimientos) {
      if (!movimiento || typeof movimiento.id !== "string" || !movimiento.id || idsMovimiento.has(movimiento.id) ||
          !materiales.has(movimiento.materialId) || !["entrada", "salida"].includes(movimiento.tipo) ||
          !Number.isSafeInteger(movimiento.cantidad) || movimiento.cantidad <= 0 ||
          typeof movimiento.fecha !== "string" || !Number.isFinite(Date.parse(movimiento.fecha))) return false;
      idsMovimiento.add(movimiento.id);
      const delta = movimiento.tipo === "entrada" ? movimiento.cantidad : -movimiento.cantidad;
      const saldo = (saldos.get(movimiento.materialId) || 0) + delta;
      if (!Number.isSafeInteger(saldo) || saldo < 0) return false;
      saldos.set(movimiento.materialId, saldo);
    }
    return true;
  }

  function saldoMaterial(materialId, movimientos = datos.movimientos) {
    return movimientos.reduce((saldo, movimiento) => {
      if (movimiento.materialId !== materialId) return saldo;
      return saldo + (movimiento.tipo === "entrada" ? movimiento.cantidad : -movimiento.cantidad);
    }, 0);
  }

  function cantidadMovimientos(materialId, movimientos = datos.movimientos) {
    return movimientos.filter(movimiento => movimiento.materialId === materialId).length;
  }

  function materialPorId(id) {
    return datos.materiales.find(material => material.id === id) || null;
  }

  function escaparConsulta(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  }

  function crearElemento(etiqueta, texto, clase) {
    const elemento = document.createElement(etiqueta);
    if (texto !== undefined) elemento.textContent = texto;
    if (clase) elemento.className = clase;
    return elemento;
  }

  function renderizarMateriales() {
    const lista = $("kardex-materiales");
    lista.replaceChildren();
    const consulta = escaparConsulta(consultaActual.trim());
    const resultados = datos.materiales.filter(material => {
      if (!consulta) return true;
      return escaparConsulta(material.nombre).includes(consulta) || escaparConsulta(material.id).includes(consulta);
    });

    $("kardex-resultados-texto").textContent = consulta
      ? resultados.length + (resultados.length === 1 ? " resultado." : " resultados.")
      : "Búsqueda vacía: se muestran todos los materiales; no se modificaron datos.";
    if (resultados.length === 0) {
      lista.append(crearElemento("li", "No hay coincidencias. La selección anterior se ha descartado."));
      return;
    }

    for (const material of resultados) {
      const boton = crearElemento("button");
      boton.type = "button";
      boton.setAttribute("aria-pressed", String(material.id === materialSeleccionadoId));
      boton.append(document.createTextNode(material.id + " · " + material.nombre + " · Existencia: " + saldoMaterial(material.id)));
      if (!material.activo) boton.append(crearElemento("span", "Inactivo", "inactivo"));
      boton.addEventListener("click", () => seleccionarMaterial(material.id));
      const item = crearElemento("li");
      item.append(boton);
      lista.append(item);
    }
  }

  function renderizarSeleccion() {
    const material = materialPorId(materialSeleccionadoId);
    const nombre = $("kardex-nombre-editado");
    const guardarNombre = $("kardex-guardar-nombre");
    const inactivar = $("kardex-inactivar");
    const eliminar = $("kardex-eliminar");
    const registrar = $("kardex-registrar");
    const historial = $("kardex-historial");

    historial.replaceChildren();
    if (!material) {
      $("kardex-seleccion").textContent = "Seleccione un material de la lista.";
      $("kardex-saldo").textContent = "Seleccione un material para consultar su saldo.";
      $("kardex-ayuda-acciones").textContent = "Elija un material para habilitar sus acciones.";
      guardarNombre.disabled = true;
      inactivar.disabled = true;
      eliminar.disabled = true;
      registrar.disabled = true;
      return;
    }

    const movimientos = datos.movimientos.filter(movimiento => movimiento.materialId === material.id);
    const saldo = saldoMaterial(material.id);
    $("kardex-seleccion").textContent = material.id + " · " + material.nombre + (material.activo ? " · Activo" : " · Inactivo");
    $("kardex-saldo").textContent = "Existencia física: " + saldo + " unidades";
    guardarNombre.disabled = false;
    inactivar.disabled = !material.activo;
    eliminar.disabled = movimientos.length > 0;
    registrar.disabled = !material.activo;
    $("kardex-ayuda-acciones").textContent = movimientos.length
      ? "Tiene " + movimientos.length + " movimiento(s): puede inactivarlo y conservar el historial, pero no eliminarlo."
      : "Sin movimientos: puede eliminarlo previa confirmación.";

    movimientos.slice().reverse().forEach(movimiento => {
      const fila = document.createElement("tr");
      fila.append(
        crearElemento("td", movimiento.tipo === "entrada" ? "Entrada" : "Salida"),
        crearElemento("td", String(movimiento.cantidad)),
        crearElemento("td", new Date(movimiento.fecha).toLocaleString("es-PE"))
      );
      historial.append(fila);
    });
    if (movimientos.length === 0) {
      const fila = document.createElement("tr");
      const celda = crearElemento("td", "Sin movimientos registrados.");
      celda.colSpan = 3;
      fila.append(celda);
      historial.append(fila);
    }
  }

  function renderizar() {
    if (!datos) return;
    renderizarMateriales();
    renderizarSeleccion();
    enviarAltura();
  }

  function seleccionarMaterial(id) {
    materialSeleccionadoId = id;
    const material = materialPorId(id);
    $("kardex-nombre-editado").value = material ? material.nombre : "";
    renderizar();
  }

  function guardarCambio(cambio) {
    const siguiente = JSON.parse(JSON.stringify(datos));
    try {
      cambio(siguiente);
      localStorage.setItem(CLAVE, JSON.stringify(siguiente));
      datos = siguiente;
      renderizar();
      return true;
    } catch (error) {
      mostrarMensaje("No se guardaron los cambios. Revise el almacenamiento local del navegador e inténtelo de nuevo. Detalle: " + error.message, "error");
      return false;
    }
  }

  function cargarDatos() {
    try {
      const guardado = localStorage.getItem(CLAVE);
      if (guardado === null) {
        datos = estadoInicial;
        try {
          localStorage.setItem(CLAVE, JSON.stringify(datos));
          mostrarMensaje("Kardex iniciado con dos materiales ficticios. Los datos se guardan en este navegador y origen.", "exito");
        } catch (error) {
          mostrarMensaje("No se pudo guardar el kardex en localStorage. Los cambios no se habilitarán hasta que el almacenamiento esté disponible. Detalle: " + error.message, "error");
          controles.disabled = true;
          return;
        }
      } else {
        const estado = JSON.parse(guardado);
        if (!validarDatos(estado)) throw new Error("Los datos guardados no tienen una estructura válida; no se sobrescribieron.");
        datos = estado;
        mostrarMensaje("Datos del kardex recuperados del almacenamiento local.", "exito");
      }
    } catch (error) {
      datos = null;
      controles.disabled = true;
      mostrarMensaje("No se pudo cargar el kardex. Los datos guardados se conservaron. Detalle: " + error.message, "error");
    }
  }

  function crearIdMaterial() {
    let id;
    do {
      id = "MAT-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    } while (datos.materiales.some(material => material.id === id));
    return id;
  }

  function crearIdMovimiento() {
    return "MOV-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();
  }

  $("kardex-alta").addEventListener("submit", evento => {
    evento.preventDefault();
    const nombre = $("kardex-nuevo-nombre").value.trim();
    if (nombre.length < 3) {
      mostrarMensaje("Escriba un nombre de material de al menos 3 caracteres.", "error");
      return;
    }
    const id = crearIdMaterial();
    if (guardarCambio(siguiente => siguiente.materiales.push({ id, nombre, activo: true }))) {
      $("kardex-alta").reset();
      materialSeleccionadoId = id;
      $("kardex-nombre-editado").value = nombre;
      consultaActual = "";
      $("kardex-consulta").value = "";
      renderizar();
      mostrarMensaje("Material " + id + " agregado y guardado.", "exito");
    }
  });

  $("kardex-consulta").addEventListener("input", evento => {
    consultaActual = evento.target.value;
    materialSeleccionadoId = null;
    $("kardex-nombre-editado").value = "";
    renderizar();
  });

  $("kardex-busqueda").addEventListener("submit", evento => {
    evento.preventDefault();
    consultaActual = $("kardex-consulta").value;
    materialSeleccionadoId = null;
    $("kardex-nombre-editado").value = "";
    renderizar();
    mostrarMensaje(consultaActual.trim() ? "Búsqueda aplicada. Seleccione un resultado para operar por su ID." : "Búsqueda vacía: no se modificó ningún dato.", "exito");
  });

  $("kardex-edicion").addEventListener("submit", evento => {
    evento.preventDefault();
    const id = materialSeleccionadoId;
    const nuevoNombre = $("kardex-nombre-editado").value.trim();
    if (!id || !materialPorId(id)) {
      mostrarMensaje("Seleccione un material; el cambio se aplica por su ID estable.", "error");
      return;
    }
    if (nuevoNombre.length < 3) {
      mostrarMensaje("El nombre debe tener al menos 3 caracteres.", "error");
      return;
    }
    if (guardarCambio(siguiente => {
      const material = siguiente.materiales.find(item => item.id === id);
      if (!material) throw new Error("El material seleccionado ya no existe.");
      material.nombre = nuevoNombre;
    })) mostrarMensaje("Nombre actualizado para " + id + ".", "exito");
  });

  $("kardex-inactivar").addEventListener("click", () => {
    const id = materialSeleccionadoId;
    if (!id) return;
    if (guardarCambio(siguiente => {
      const material = siguiente.materiales.find(item => item.id === id);
      if (!material) throw new Error("El material seleccionado ya no existe.");
      material.activo = false;
    })) mostrarMensaje("Material inactivado. Su historial se conserva.", "exito");
  });

  $("kardex-eliminar").addEventListener("click", () => {
    const id = materialSeleccionadoId;
    const material = id ? materialPorId(id) : null;
    if (!material) return;
    if (cantidadMovimientos(id) > 0) {
      mostrarMensaje("No se puede eliminar un material que tiene movimientos. Inactívelo para conservar su historial.", "error");
      return;
    }
    if (!window.confirm("¿Eliminar " + material.id + " · " + material.nombre + "? Esta acción no se puede deshacer.")) {
      mostrarMensaje("Eliminación cancelada; no se modificaron los datos.", "exito");
      return;
    }
    if (guardarCambio(siguiente => {
      if (siguiente.movimientos.some(movimiento => movimiento.materialId === id)) {
        throw new Error("El material tiene movimientos y no puede eliminarse.");
      }
      siguiente.materiales = siguiente.materiales.filter(item => item.id !== id);
    })) {
      materialSeleccionadoId = null;
      $("kardex-nombre-editado").value = "";
      renderizar();
      mostrarMensaje("Material eliminado.", "exito");
    }
  });

  $("kardex-movimiento").addEventListener("submit", evento => {
    evento.preventDefault();
    const id = materialSeleccionadoId;
    const material = id ? materialPorId(id) : null;
    const tipo = $("kardex-tipo").value;
    const cantidad = Number($("kardex-cantidad").value);
    if (!material) {
      mostrarMensaje("Seleccione un material antes de registrar movimientos.", "error");
      return;
    }
    if (!material.activo) {
      mostrarMensaje("El material está inactivo; no se pueden registrar movimientos nuevos.", "error");
      return;
    }
    if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
      mostrarMensaje("La cantidad debe ser un entero positivo mayor que cero.", "error");
      return;
    }
    const saldo = saldoMaterial(id);
    if (tipo === "salida" && cantidad > saldo) {
      mostrarMensaje("Salida rechazada: la existencia es " + saldo + " y se solicitaron " + cantidad + ". No se alteró el historial.", "error");
      return;
    }
    if (tipo === "entrada" && !Number.isSafeInteger(saldo + cantidad)) {
      mostrarMensaje("La cantidad excede el máximo entero seguro admitido.", "error");
      return;
    }
    if (!["entrada", "salida"].includes(tipo)) {
      mostrarMensaje("Seleccione entrada o salida.", "error");
      return;
    }
    const movimiento = { id: crearIdMovimiento(), materialId: id, tipo, cantidad, fecha: new Date().toISOString() };
    if (guardarCambio(siguiente => siguiente.movimientos.push(movimiento))) {
      $("kardex-movimiento").reset();
      renderizar();
      mostrarMensaje((tipo === "entrada" ? "Entrada" : "Salida") + " de " + cantidad + " unidad(es) guardada. Existencia: " + saldoMaterial(id) + ".", "exito");
    }
  });

  function campoCsv(valor) {
    return '"' + String(valor).replace(/"/g, '""') + '"';
  }

  $("kardex-exportar").addEventListener("click", () => {
    const encabezados = ["id_movimiento", "id_material", "nombre_material", "tipo", "cantidad", "fecha"];
    const filas = datos.movimientos.map(movimiento => {
      const material = materialPorId(movimiento.materialId);
      return [movimiento.id, movimiento.materialId, material ? material.nombre : "", movimiento.tipo, movimiento.cantidad, movimiento.fecha];
    });
    const csv = "\uFEFF" + [encabezados, ...filas].map(fila => fila.map(campoCsv).join(";")).join("\r\n");
    try {
      const archivo = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = "kardex-movimientos-" + new Date().toISOString().slice(0, 10) + ".csv";
      document.body.append(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      mostrarMensaje("CSV exportado con " + filas.length + " movimiento(s). Es una copia y no sincroniza con Excel.", "exito");
    } catch (error) {
      mostrarMensaje("No se pudo exportar el CSV. Detalle: " + error.message, "error");
    }
  });

  cargarDatos();
  renderizar();
  window.addEventListener("message", evento => {
    if (evento.source === window.parent && evento.data && evento.data.tipo === "et505-kardex-solicitar-altura") {
      enviarAltura();
    }
  });
  window.addEventListener("load", enviarAltura);
})();
