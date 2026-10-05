# Notas y actividades

Implementado el 5 de octubre de 2026: lista privada, creación, edición, eliminación, búsqueda por título/descripción, filtros y paginación. Las actividades admiten completar y volver a pendiente; una nota nunca tiene fecha de finalización. El tipo se elige al crear y no cambia después.

## Uso local

Con MySQL de XAMPP activo, ejecutar `php artisan migrate` en backend. Iniciar backend y frontend según [desarrollo local](development.md), entrar en http://127.0.0.1:5173/app con una cuenta verificada y crear una nota o actividad. No hay guardado automático: pulsar **Guardar**. La descripción es texto plano (máximo 20.000 caracteres) y el título admite 200.

El editor conserva borradores en memoria ante errores de conexión o conflictos y confirma antes de descartarlos. Ante 409, **Cargar versión guardada** permite revisar la edición más reciente después de confirmar el descarte. Si el contenido fue eliminado, se puede guardar el borrador como copia nueva. Recargar o cerrar el navegador puede perder el borrador; no hay almacenamiento privado offline. Cerrar sesión o perderla limpia contenido y cancela solicitudes pendientes.

## Contrato y persistencia

- API principal en [OpenAPI](openapi.yaml), con [contrato de contenido](entries.openapi.yaml).
- Cada operación requiere sesión verificada, consulta limitada al propietario y Policy. IDs ajenos y ausentes devuelven 404. Mutaciones protegidas con CSRF. Respuestas privadas sin caché.
- Listado de 20 elementos por página (máximo 50), ordenado por última edición e ID descendentes. Búsqueda literal con parámetros SQL; `%` y `_` no funcionan como comodines. Sensibilidad a mayúsculas y acentos depende de la collation de la base. La paginación no representa una instantánea frente a cambios simultáneos.
- ULID público; propietario asignado sólo en servidor. `version` comienza en 1. Editar, completar y eliminar bloquean la fila durante una transacción y exigen la versión actual. Un cambio real incrementa la versión; repetir el estado actual con versión vigente no la incrementa. Una versión antigua siempre devuelve 409.
- `completed_at` y fechas de creación/edición se entregan en UTC; interfaz en zona horaria del navegador. Restricción CHECK en MariaDB/MySQL para notas sin finalización. Borrado de cuenta elimina entradas por clave foránea.
- El índice de propietario/fecha apoya la lista; la búsqueda por subcadena no es full-text. No se ha medido rendimiento con grandes volúmenes.

## Validación

`composer test`: permisos entre dos cuentas en todas las operaciones, validación, texto sin interpretar, versiones, eliminación, filtros, búsqueda literal y paginación. Usa SQLite en memoria.

`npm.cmd test` en frontend: conflictos, descarte explícito, fallos de red, copia de contenido eliminado y respuestas tardías después de limpiar la sesión.

`npm.cmd run test:identity`: además de cuentas, recorre crear/editar/eliminar, persistencia tras recarga, filtros/búsqueda, completar, conflicto entre pestañas, desconexión, descarte y diseño móvil con la base `notewave_e2e` y Mailpit. Guarda capturas de contenido ficticio en `frontend/test-results/`, excluido de Git.

Con `.env.e2e` preparado según [cuentas](identity.md) y sus migraciones aplicadas:

```powershell
php tests/Integration/entries-concurrency.php
```

La prueba lanza dos procesos PHP contra la misma versión: espera 200/409 y versión final 2; verifica también la restricción CHECK. Crea y limpia su propia cuenta ficticia. Validada en MariaDB 10.4.32 local; MySQL 8.4 continúa pendiente.

Resultado local de este incremento: 20 pruebas backend (155 aserciones), 15 pruebas frontend y 9 recorridos de navegador aprobados, además de la prueba de concurrencia. Formato, lint, tipos, build y validación de Composer aprobados. Capturas revisadas en escritorio y móvil.

Dictado revisable con proveedor simulado implementado; ver [guía](transcription.md). Perfil, exportación/eliminación de cuenta, PWA y despliegue siguen pendientes.
