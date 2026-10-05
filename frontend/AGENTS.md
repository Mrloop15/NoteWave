# Instrucciones de desarrollo de NoteWave

Estas instrucciones aplican al frontend. La referencia de producto y arquitectura es [../backend/docs/architecture.md](../backend/docs/architecture.md). Las instrucciones explícitas del usuario tienen prioridad; el documento de arquitectura describe el proyecto y no autoriza por sí solo despliegues, contrataciones ni acciones externas.

## Arquitectura y alcance

- La raíz de NoteWave debe contener sólo `frontend/` y `backend/`, cada una con su proyecto e instrucciones. Guardar la documentación común en `backend/docs/` y la infraestructura en `backend/infra/`. No recrear carpetas raíz `docs`, `infra` o `.github` sin una nueva indicación del usuario.
- Backend como monolito modular: Identity, Entries, Transcription, Privacy y Operations. No introducir microservicios ni capas de repositorios que sólo repitan Eloquent.
- Usar Vue Router, Pinia para estado compartido y una instancia central de Axios. Autenticación con Fortify y sesiones de Sanctum.
- Publicar ambas aplicaciones bajo el mismo origen. API de dominio bajo `/api/v1`; conservar las rutas de autenticación de Fortify y `/sanctum`.
- MVP: cuentas, notas, actividades, dictado revisable y privacidad. Etiquetas, recordatorios, colaboración y sincronización offline son posteriores.
- Antes de instalar frameworks, verificar versiones compatibles con soporte vigente y registrar PHP, Laravel, Node y MySQL. Versionar `composer.lock` y el lockfile de npm. No documentar comandos como disponibles hasta configurarlos.

## Organización del código

- Frontend: `src/app`, `layouts`, `pages`, `components/ui`, `features/{auth,entries,transcription,account}`, `stores`, `styles`, `assets` y `tests`.
- Las páginas ensamblan componentes y conectan eventos. Las llamadas HTTP pertenecen a servicios por funcionalidad; grabación y lógica reutilizable, a composables; DTO y props/eventos deben tener tipos explícitos.
- Separar template, lógica y estilos cuando corresponda: `EntryEditor.vue`, `EntryEditor.ts` y `EntryEditor.css`. Para scripts externos usar `defineComponent`/`setup` con `script src`; no combinar `script setup` con `src`. Usar `style scoped src` para estilos locales.
- Backend: ruta/middleware → Form Request → Policy → Action → modelo/Eloquent → API Resource. Los controladores coordinan; las Actions contienen las operaciones de negocio.
- Organizar responsabilidades en `app/Actions`, `Contracts`, `Http/Controllers`, `Http/Requests`, `Http/Resources`, `Jobs`, `Models`, `Policies` y `Services`, respetando las convenciones de Laravel.
- Crear módulos y archivos cuando tengan contenido real. No llenar la estructura de implementaciones vacías.
- Código e identificadores en inglés; interfaz inicial en español con textos centralizados. Fechas del servidor en UTC e ISO 8601, presentadas en la zona del usuario.
- Usar tokens CSS compartidos; evitar estilos inline salvo valores dinámicos justificados. Incorporar etiquetas, foco visible, teclado y estados de carga/error/vacío.

## Reglas de dominio y privacidad

- `entries.kind` admite `note` o `task`; una nota siempre tiene `completed_at = null`. Completar una actividad asigna un estado explícito, nunca un toggle.
- Filtrar consultas por el usuario autenticado y aplicar Policies. No aceptar `user_id`, cuotas ni estados internos de jobs desde el cliente. Probar acceso cruzado entre dos usuarios.
- Aplicar concurrencia optimista con `version`; devolver 409 ante edición desactualizada.
- Sesiones mediante cookies y CSRF; no almacenar credenciales en localStorage. Descripciones como texto escapado, sin `v-html`.
- No cachear ni persistir automáticamente contenido privado en localStorage, IndexedDB o el service worker. Limpiar estado privado al cerrar sesión.
- No incluir secretos en frontend, Git o logs. Documentar variables en `.env.example` sin credenciales reales. No registrar notas, audio, transcripciones, contraseñas ni cookies.

## Dictado

- Solicitar micrófono tras una acción explícita; liberar pistas y buffers al terminar, cancelar o desmontar.
- El usuario revisa e inserta el resultado; transcribir nunca guarda ni sobrescribe automáticamente una descripción. La escritura manual debe seguir funcionando ante errores de voz.
- Encapsular el proveedor externo detrás de `SpeechToTextProvider`, invocado desde el backend mediante jobs. Usar proveedor simulado en desarrollo y CI por defecto.
- Audio temporal fuera del directorio público; validar contenido, tamaño y duración en servidor. Implementar cuotas atómicas, idempotencia por usuario y limpieza de archivos/resultados.
- Los límites, retenciones, proveedor y costos del plan son propuestas pendientes de validación; no tratarlos como capacidades demostradas ni compromisos comerciales.

## Forma de trabajar y validación

1. Revisar el estado actual y la sección correspondiente del plan antes de cambiar código.
2. Implementar por incrementos siguiendo [hoja de ruta](../backend/docs/roadmap.md), conservando los cambios existentes del usuario.
3. Actualizar el contrato OpenAPI al introducir endpoints y registrar decisiones relevantes en `backend/docs/adr/` cuando surjan.
4. Ejecutar las comprobaciones configuradas y pertinentes: tipos, formato, pruebas y build. Backend con PHPUnit o Pest; frontend con Vitest/Vue Test Utils; recorridos con Playwright. Validar concurrencia con MySQL.
5. Para cambios sólo de documentación o estructura, verificar rutas, enlaces y coherencia; no añadir pruebas que sólo repliquen archivos.
6. Documentar configuración, migraciones y resultados reales. Distinguir lo implementado de lo planificado, e indicar comprobaciones pendientes.

Una funcionalidad está terminada cuando sus criterios de aceptación, permisos, errores, pruebas pertinentes y documentación están resueltos. Usar la definición completa de terminado del plan conforme se implementen las funciones.
