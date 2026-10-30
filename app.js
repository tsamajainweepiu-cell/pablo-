"use strict";
// DATOS Y REGLAS: estas funciones no usan document ni cambian la pantalla.
const limites={presupuestoCentimos:15000,maxCantidad:30,maxPrecio:50};
function calcularTotal(pedido){
return pedido.cantidad*Math.round(pedido.precio*100);
}
function validarPedido(pedido){
if(pedido.material.length<3)return "Escriba un material de al menos 3 caracteres.";
if(!Number.isInteger(pedido.cantidad)||pedido.cantidad<1||pedido.cantidad>limites.maxCantidad)return "Cantidad: entero entre 1 y 30.";
if(!Number.isFinite(pedido.precio)||pedido.precio<=0||pedido.precio>limites.maxPrecio||Math.abs(pedido.precio*100-Math.round(pedido.precio*100))>0.000001)return "Precio: de 0.01 a 50 soles, con hasta dos decimales.";
const total=calcularTotal(pedido);
if(total>limites.presupuestoCentimos)return "El total supera el presupuesto de "+(limites.presupuestoCentimos/100).toFixed(2)+" soles.";
return "";
}
// PANTALLA: leer entradas y mostrar resultados.
const $=id=>document.getElementById(id);
function leerPedido(){return {material:$("material").value.trim(),cantidad:Number($("cantidad").value),precio:Number($("precio").value)};}
function soles(centimos){return "S/ "+(centimos/100).toFixed(2);}
$("comprobar").addEventListener("click",()=>{
const pedido=leerPedido();
const error=validarPedido(pedido);
if(error){mostrarError(error,false,pedido);return;}
mostrarMensaje("Pedido válido. Pulse Confirmar simulación para mostrar total y saldo.","exito");
});
$("formulario").addEventListener("submit",evento=>{
evento.preventDefault();const pedido=leerPedido();const error=validarPedido(pedido);
if(error){mostrarError(error,true,pedido);return;}
const total=calcularTotal(pedido);
$("ficha").textContent=pedido.material+" · "+pedido.cantidad+" unidades\nTotal: "+soles(total)+"\nSaldo: "+soles(limites.presupuestoCentimos-total);
$("ficha").hidden=false;$("vacio").hidden=true;mostrarMensaje("Simulación confirmada. La ficha muestra el pedido recién confirmado. No se realizó ninguna compra.","exito");
});
$("limpiar").addEventListener("click",()=>{$("formulario").reset();$("ficha").hidden=true;$("vacio").hidden=false;mostrarMensaje("","");$("material").focus();});
// PRESENTACIÓN DE RESULTADOS: ya preparada; conserve estas funciones.
function mostrarMensaje(texto,tipo){
  const mensaje=$("mensaje");
  mensaje.textContent=texto;
  mensaje.className=tipo;
  if(tipo==="error")mensaje.focus();
}
function mostrarError(error,confirmacion,pedido){
  const titulo=confirmacion?"ERROR: No se pudo confirmar el pedido.":"ERROR: Pedido no válido.";
  const estado=$("ficha").hidden?"No hay ningún pedido confirmado.":"La ficha de abajo es el último pedido válido. Se conserva sin cambios.";
  const total=calcularTotal(pedido);
  // Mostrar importes sólo cuando ya existe un cálculo válido y excede el presupuesto.
  let detalle="";
  if(Number.isFinite(total)&&total>limites.presupuestoCentimos){
    detalle="\nTotal intentado: "+soles(total)+"\nPresupuesto: "+soles(limites.presupuestoCentimos)+"\nExceso: "+soles(total-limites.presupuestoCentimos);
  }
  mostrarMensaje(titulo+"\n"+error+detalle+"\n"+estado+"\nCorrija los datos e inténtelo nuevamente.","error");
}
window.addEventListener("message",evento=>{
  const marco=$("kardex-frame");
  if(evento.source!==marco.contentWindow||!evento.data||evento.data.tipo!=="et505-kardex-altura")return;
  if(Number.isInteger(evento.data.altura)&&evento.data.altura>=300&&evento.data.altura<=10000){
    marco.style.height=evento.data.altura+"px";
  }
});
$("kardex-frame").addEventListener("load",()=>{
  $("kardex-frame").contentWindow.postMessage({tipo:"et505-kardex-solicitar-altura"},"*");
});
