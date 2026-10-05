# ADR 0002 — Dictado simulado y audio temporal

Fecha: 5 de octubre de 2026. Estado: implementada para desarrollo.

El contrato `SpeechToTextProvider` se ejecuta desde un job y tiene únicamente un adaptador simulado. La interfaz identifica expresamente el texto como ejemplo. No elegir ni contratar un proveedor externo forma parte de este incremento; esa decisión requiere evaluar precisión, formato, costo y tratamiento de datos.

Se incorpora FFmpeg como dependencia operativa para decodificar y medir audio real, también WebM sin metadatos de duración. La validación produce un WAV temporal, acotando salida, duración y tiempo de proceso. El inspector es reemplazable en pruebas de concurrencia, mientras las pruebas funcionales y navegador usan el binario real.

Una fila de usuario bloqueada serializa creación, reserva de segundos e idempotencia. Reservas fallidas o canceladas no se reembolsan; metadatos se conservan 48 horas y contienen hash/clave, no texto ni audio después de limpiar. Un intento por job simulado; reintentos transitorios se implementarán junto con el adaptador externo. Un trabajo atascado se limpia tras cinco minutos; el scheduler también retira resultados vencidos y archivos huérfanos. Un cierre inesperado entre el commit y el envío a cola puede dejar un trabajo que vencerá; no se promete entrega exactamente una vez.

Los controles compartidos `AppDropdown` y `AudioPreview` mantienen el lenguaje visual de NoteWave. El dropdown usa combobox/listbox, foco en el activador y selección explícita con teclado o puntero. No se incorpora una biblioteca de componentes adicional.

Ver [operación y limitaciones](../transcription.md) y [contrato](../transcription.openapi.yaml).
