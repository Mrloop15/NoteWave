export const dictationMessages = {
  heading: 'Dictado por voz',
  demo: 'Modo demostración: el audio se procesa en este servidor y se elimina. Recibirás texto de ejemplo, no una transcripción de tu voz. No se envía a un proveedor externo.',
  unavailable: 'El dictado no está disponible. Puedes seguir escribiendo.',
  unsupported:
    'Este navegador no permite grabar aquí. Usa un navegador compatible y una conexión segura.',
  start: 'Grabar dictado',
  stop: 'Detener grabación',
  cancel: 'Descartar dictado',
  send: 'Enviar grabación',
  retry: 'Reintentar envío',
  resume: 'Consultar resultado',
  insert: 'Insertar al final de la descripción',
  inserted: 'Texto insertado en el borrador. Pulsa Guardar para conservarlo.',
  language: 'Idioma del dictado',
  spanish: 'Español',
  english: 'Inglés',
  review: 'Revisa y edita el texto de ejemplo',
  playback: 'Escuchar grabación',
  limit:
    'Máximo 120 segundos por grabación. La escritura manual sigue disponible.',
  permission: 'Esperando permiso del micrófono…',
  recording: 'Grabando',
  stopping: 'Terminando grabación…',
  recorded: 'Grabación lista para enviar.',
  uploading: 'Enviando grabación…',
  queued: 'En cola…',
  processing: 'Procesando audio…',
  permissionError:
    'No pudimos acceder al micrófono. Revisa el permiso y que haya uno conectado.',
  empty: 'No se capturó audio. Inténtalo de nuevo.',
  tooLarge:
    'La grabación superó el límite de tamaño. Graba un fragmento más corto.',
  network: 'No pudimos conectar. Puedes reintentar sin repetir la grabación.',
  timeout:
    'La consulta tardó demasiado. Puedes consultar el resultado de nuevo o descartarlo.',
  failed:
    'No pudimos procesar el audio. Puedes grabar de nuevo o seguir escribiendo.',
  noSpeech: 'No se detectó voz. Prueba otra grabación.',
  full: 'El texto supera los 20.000 caracteres de la descripción. Acorta el resultado antes de insertarlo.',
  cleanup:
    'El borrado remoto no se pudo confirmar. El servidor lo eliminará al vencer; puedes reintentar el descarte.',
} as const
