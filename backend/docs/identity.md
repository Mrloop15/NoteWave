# Cuentas y sesiones

Implementado: registro, login/logout, verificación y reenvío de correo, recuperación de contraseña y consulta del usuario actual. La interfaz está en español y el correo se captura localmente; no se ha contratado un servicio de envío externo.

## Probar manualmente

Mantener activos MySQL de XAMPP y los servidores habituales (backend `composer dev`, frontend `npm.cmd run dev`). Además, en dos terminales desde backend:

```powershell
powershell -File scripts/start-mailpit.ps1
php artisan queue:work --sleep=1 --tries=2 --timeout=60
```

Si ya están activos no iniciar copias adicionales. Abrir [NoteWave](http://127.0.0.1:5173), crear una cuenta y consultar [la bandeja local](http://127.0.0.1:8025). Abrir el enlace de verificación en el mismo navegador. El panel de cuenta sólo se abre tras verificar el correo; permite crear y organizar [notas y actividades](entries.md).

Mailpit v1.31.4 está instalado sólo en `backend/.local/mailpit/`, excluido de Git. En otra máquina descargar el binario Windows amd64 de las [publicaciones oficiales](https://github.com/axllent/mailpit/releases) siguiendo la [guía de instalación](https://mailpit.axllent.org/docs/install/), y extraerlo en esa ubicación. El script lo restringe a localhost. Alternativamente usar el servicio Mailpit de `infra/compose.yaml`.

Las notificaciones se encolan en la base de datos. Si el worker está detenido, quedarán pendientes hasta iniciarlo. Reiniciar el worker después de cambios de código mediante `php artisan queue:restart` y volver a arrancarlo. El payload de recuperación se cifra para evitar que el token quede legible en la cola.

## Decisiones

- Fortify 1.40 y Sanctum 4.3, usando cookies y CSRF según las guías de [Fortify](https://laravel.com/framework/docs/12.x/fortify) y [Sanctum](https://laravel.com/framework/docs/12.x/sanctum). Vistas de Fortify desactivadas; las vistas Vue viven bajo `/auth/` para no colisionar con las rutas POST.
- Credenciales y datos del usuario sólo en memoria del frontend. Sin tokens en almacenamiento del navegador. Cookie de sesión HttpOnly; XSRF-TOKEN legible para Axios. En producción configurar HTTPS y SESSION_SECURE_COOKIE=true.
- El email se recorta y normaliza a minúsculas. Contraseñas de al menos 12 caracteres y máximo 72 bytes por el límite de bcrypt; se permiten frases y gestores de contraseñas.
- Registro y recuperación limitados a 5 solicitudes/minuto por IP y ruta. Login: 5/minuto por email+IP y 30/minuto por IP. Verificación: 6/minuto por usuario. Claves de limitación de login usan hash del email.
- Recuperación devuelve el mismo mensaje para correo conocido, desconocido o temporalmente limitado por el broker. El token vence a los 60 minutos y se consume una sola vez; restablecer revoca las sesiones guardadas y rota remember_token. Se requiere iniciar sesión de nuevo.
- Verificación con firma relativa (no depende del hostname), vencimiento de 60 minutos y comprobación de usuario/email. El frontend sólo sigue rutas de verificación con formato permitido y retira el enlace de la URL al completarlo. El alias `signed` de esta aplicación valida firmas relativas; futuros enlaces firmados deben mantener esa convención.
- `/api/v1/me` acepta sesiones sin verificar para mostrar el estado de la cuenta. Los endpoints de contenido aplican también `verified` y Policies. Las rutas Vue no son una barrera de autorización.
- Logout limpia el store y comunica el cierre a otras pestañas mediante BroadcastChannel, sin transmitir información de usuario. Las respuestas backend no se cachean. No se crean ni aceptan personal access tokens.

## Pruebas

`composer test` usa SQLite en memoria, forzado en phpunit.xml, y no migra la base de desarrollo. Cubre validación, normalización, aislamiento de usuario, firmas inválidas/vencidas, verificación, límites, reset de un solo uso, expiración y revocación de sesiones.

Las pruebas de navegador de identidad usan una base MariaDB independiente `notewave_e2e`, usuario del mismo nombre y cookies distintas. La configuración privada está en `.env.e2e`. En otra máquina crear esa base/usuario con permisos limitados, copiar `.env.e2e.example` a `.env.e2e`, completar DB_PASSWORD y ejecutar `php artisan key:generate --env=e2e`.

Con Mailpit activo, ejecutar desde frontend:

```powershell
npm.cmd test
npm.cmd run test:identity
```

Playwright inicia backend en 8001 y frontend en 5174, aplica migraciones a la base E2E y envía correos de prueba exclusivamente a Mailpit. Rechaza configuración ausente, base incorrecta y caché de configuración activa. Deja cuentas ficticias en la base E2E; no toca usuarios de desarrollo. No se guardan trazas con contraseñas/enlaces de recuperación. Las pruebas de bienvenida siguen en `npm.cmd run test:e2e`.

Todavía pendientes: validación en MySQL 8.4, proveedor de correo de producción, cambios de perfil/contraseña desde la cuenta, exportación/eliminación y el módulo de voz.
