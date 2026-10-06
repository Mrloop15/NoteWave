# Mi cuenta

Disponible desde **Mi cuenta** en el espacio de notas, ruta `/app/account`, para usuarios con correo verificado. Conserva los controles, colores y dropdowns compartidos del editor, con distribución adaptable a móvil.

## Preferencias

- Nombre de hasta 100 caracteres. El correo se muestra como sólo lectura.
- Idioma predeterminado de dictado: español o inglés. Se aplica al abrir un nuevo panel; no altera una grabación en curso. El proveedor sigue siendo simulado.
- Zona horaria IANA o automática del navegador. Afecta las fechas mostradas en las tarjetas; el servidor sigue usando UTC.

Cada modificación real incrementa `profile_version`. Dos pestañas con la misma versión no pueden sobrescribirse: la segunda recibe 409, conserva el borrador y ofrece cargar el perfil guardado previa confirmación. Un fallo de red al recargar conserva el borrador y la sesión. Salir con cambios pendientes requiere confirmar; no se guardan datos privados en almacenamiento del navegador.

## Contraseña

Se exige la contraseña actual y una nueva confirmada, diferente, de al menos 12 caracteres y hasta 72 bytes UTF-8. Cinco intentos por minuto por usuario. La comprobación y el cambio se realizan con bloqueo del usuario en una transacción.

Se rota la sesión actual manteniéndola autenticada, se revocan las demás sesiones de base de datos y se invalidan los enlaces de recuperación pendientes y el token de recordar sesión. Otros dispositivos vuelven al login en su próxima petición. Los campos de contraseña se limpian después de cada intento y al abandonar la vista.

## Instalación y validación

Ejecutar `php artisan migrate` desde backend para añadir las preferencias; los usuarios existentes reciben español, zona automática y versión 1. La migración ya está aplicada en desarrollo local y en la base E2E.

Contrato: [account.openapi.yaml](account.openapi.yaml), integrado en [openapi.yaml](openapi.yaml). Endpoints `GET /api/v1/account/options`, `PATCH /api/v1/account/profile` y `PUT /api/v1/account/password`; mutaciones protegidas con CSRF, Policies y sesión verificada.

Pruebas: `php artisan test`, `npm.cmd test`, `npm.cmd run test:identity` y `npm.cmd run test:e2e` desde sus respectivas carpetas. La concurrencia real se comprueba con `php tests/Integration/entries-concurrency.php profile` sobre la base E2E aislada descrita en [identity.md](identity.md).

Validación del incremento: 36 pruebas backend (282 aserciones), 28 frontend y 10 recorridos de navegador; concurrencia de entradas y perfil en MariaDB, lint, tipos y build. Capturas de cuenta revisadas en escritorio y móvil emulado. MySQL 8.4 y dispositivos móviles reales siguen pendientes.

Próximos bloques: exportación, eliminación de cuenta y PWA limitada a recursos públicos. El cambio de correo no está implementado.
