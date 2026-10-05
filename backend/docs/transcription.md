# Dictado y controles de NoteWave

Incremento local del 5 de octubre de 2026. Grabación, reproducción, envío, jobs, revisión editable e inserción explícita en la descripción implementados. **Sólo hay proveedor simulado:** devuelve texto de demostración; no reconoce lo que se dice ni envía audio a servicios externos. No se ha contratado ni configurado una API de voz real.

## Probar

1. Mantener MySQL de XAMPP, backend y frontend activos; aplicar `php artisan migrate` desde backend.
2. Instalar FFmpeg. En Windows se usa `backend/.local/ffmpeg/bin/ffmpeg.exe`; en otros sistemas, `ffmpeg` en PATH. Se admite `FFMPEG_BINARY` con ruta absoluta en `.env`. Se instaló localmente FFmpeg 9.0.2, distribución essentials de Gyan enlazada desde [FFmpeg](https://ffmpeg.org/download.html), sin versionar el binario. Las [descargas de Gyan](https://www.gyan.dev/ffmpeg/builds/) incluyen sumas de comprobación. Otra máquina debe instalarlo antes de ejecutar pruebas de audio.
3. Ejecutar `php artisan queue:work --sleep=1 --tries=1 --timeout=60` y, en otra terminal, `php artisan schedule:work`. No duplicarlos si ya están activos. Reiniciar workers después de cambiar backend. Los procesos iniciados durante esta sesión no son servicios de inicio automático de Windows.
4. Abrir http://127.0.0.1:5173/app con una cuenta verificada. Crear/abrir una nota, elegir idioma y pulsar **Grabar dictado**. Detener, escuchar y enviar. Editar el texto de ejemplo e insertarlo al final de la descripción. Pulsar **Guardar** conserva la nota; recibir/insertar texto nunca guarda automáticamente.

`TRANSCRIPTION_ENABLED=false` desactiva nuevas cargas y procesamiento, conservando la edición manual. `TRANSCRIPTION_DRIVER=simulated` es el único adaptador disponible. Sin configuración explícita, el dictado está desactivado en producción. No habilitar el simulador como si fuera reconocimiento real.

## Comportamiento y límites

- Micrófono solicitado sólo por acción explícita. Se liberan pistas al detener/cancelar/desmontar y también si el permiso llega después del descarte. Ocultar la pestaña detiene la grabación. Se revocan las URLs de audio y se eliminan buffers en memoria. No se persisten audios/resultados en almacenamiento del navegador.
- Formato seleccionado mediante `MediaRecorder.isTypeSupported`: WebM/Opus, MP4 o Ogg según soporte. El servidor decodifica bytes reales con FFmpeg, sin confiar en extensión ni duración del cliente. Admite WAV para pruebas. La selección se basa en la [API MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder).
- Decodificación acotada a 20 segundos de proceso y 121 segundos de salida PCM mono 16 kHz; se rechazan duración inferior a 0,25 s, superior a 120 s, archivo ilegible o silencio digital. El detector de nivel no es reconocimiento de voz: ruido puede superarlo. Argumentos como array, formatos/protocolos restringidos y sin URLs externas. La salida se normaliza a WAV siguiendo las opciones de [FFmpeg](https://ffmpeg.org/ffmpeg.html).
- Tamaño máximo de aplicación: 10 MiB, reducido por límites PHP; `/options` informa el límite efectivo. La configuración local habitual de PHP puede limitarlo a 2 MiB. La captura solicita 64 kbit/s, pero el navegador decide el tamaño real. Proxy/hosting pueden imponer límites menores.
- Un job activo por usuario, 20 minutos reservados por día UTC y cinco cargas/minuto. Se redondea duración hacia arriba a segundos. Cancelación y fallo no reembolsan cuota. El bloqueo de la fila de usuario serializa concurrencia, reserva e idempotencia. No hay presupuesto global ni facturación externa en este simulador.
- UUID de envío y hash de archivo+idioma evitan duplicados durante la retención de metadatos. El frontend reintenta con el mismo archivo y clave cuando falla la conexión. Si abandona durante un envío, descarta el job al recibir su ID; si la respuesta nunca llega, opera la limpieza del servidor.
- Polling con espera creciente (1–4 s), máximo 30 consultas por intento, cancelación al salir y reconsulta manual. Procesamiento agotado a los cinco minutos. Los jobs llevan sólo ID; errores del proveedor se normalizan sin registrar su contenido. Un intento en el simulador; reintentos transitorios del proveedor real aún pendientes.
- El audio normalizado vive en `storage/app/transcriptions/{APP_ENV}`, sin acceso público, y se borra al terminar/cancelar. Resultado hasta 24 horas, eliminado al insertar/descartar o vencer. Metadatos sin texto/audio hasta al menos 48 horas para cuota e idempotencia. La limpieza programada corre cada cinco minutos y elimina huérfanos de más de una hora. La eliminación física depende de que el scheduler y el disco funcionen; ejecutar `php artisan transcriptions:cleanup` permite comprobarla manualmente.

## Estilo y accesibilidad

`frontend/src/components/ui/AppDropdown` comparte tokens de color, bordes, radios y foco con formularios y editor. Menú propio con selección visible, flechas, Inicio/Fin, búsqueda por letras, Enter/Espacio, Escape y Tab. Cierre al pulsar fuera. `AudioPreview` sustituye los controles visuales nativos por reproducir/pausar/detener y progreso con el mismo estilo. Respetan movimiento reducido; no necesitan bibliotecas nuevas.

## Validación y pendientes

- `composer test`: aislamiento, permisos, bytes reales, silencio/duración, cuota, idempotencia, cancelación durante proveedor, fallos y limpieza.
- `php tests/Integration/transcription-concurrency.php`: base `notewave_e2e` exclusiva; dos procesos simultáneos, misma/diferente clave, reserva única y job real en cola de base de datos. Usa un inspector sintético para estas carreras; las pruebas funcionales y navegador sí usan FFmpeg. Validado en MariaDB 10.4.32; MySQL 8.4 pendiente.
- `npm.cmd test`: recursos del micrófono, permiso tardío, respuesta tardía, reintento idempotente, errores y dropdown con teclado/puntero.
- `npm.cmd run test:identity`: Chromium graba un flujo sintético con MediaRecorder real, reproduce, envía a Laravel/FFmpeg, revisa e inserta sin guardar. Capturas en escritorio y viewport móvil. Mailpit debe estar activo para las cuentas de prueba. No usa el micrófono físico.

Falta proveedor real, pruebas con habla consentida y dispositivos físicos iPhone/Android, reintentos y presupuesto del servicio externo, revisión operativa de FFmpeg y despliegue. Este incremento no declara completa la fase de voz del MVP. Contrato: [OpenAPI](transcription.openapi.yaml).

Comprobación local: 30 pruebas backend, 22 frontend y 9 recorridos de navegador aprobados, más las pruebas de concurrencia de entradas/dictado y procesamiento en cola de MariaDB. Lint, formato, tipos, build y Composer correctos. Dropdown, reproductor y revisión móvil inspeccionados mediante capturas.
