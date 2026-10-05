# Desarrollo local

## Entorno comprobado

Node 24, PHP 8.2 y Composer. Base local: **MariaDB 10.4.32 de XAMPP**, escuchando en 127.0.0.1:3306. Laravel usa su controlador mysql. Esto no equivale a una validación de MySQL 8.4, que sigue siendo el objetivo previsto de despliegue.

Se creó una base exclusiva `notewave` y el usuario `notewave_app`, con permisos únicamente sobre esa base. Su contraseña aleatoria está en `backend/.env`, excluido de Git. No se usa root como usuario de la aplicación.

Las tres migraciones iniciales (usuarios/sesiones, caché y jobs) están aplicadas. No volver a crear el usuario ni sobrescribir .env. No se modificaron bases de otros proyectos.

## Arrancar

1. Mantener encendido el servicio MySQL de XAMPP.
2. En backend ejecutar `composer dev`.
3. En frontend ejecutar `npm.cmd run dev`.
4. Abrir http://127.0.0.1:5173.

En una máquina nueva: `composer install` en backend y `npm ci` en frontend. Crear .env desde .env.example sólo si no existe; configurar base/usuario propios, ejecutar `php artisan key:generate` una vez y `php artisan migrate`. No regenerar la clave ni sobrescribir configuración de una instalación existente.

El proxy envía /api, /health, /sanctum y rutas de cuenta al backend en el puerto 8000. Mantener el mismo hostname durante la sesión. Las futuras vistas de cuenta deben evitar colisiones con rutas backend: por ejemplo /auth/login para la vista y POST /login para Fortify.

## Alternativa Docker

La configuración opcional está en backend/infra/compose.yaml. No es necesaria para usar XAMPP. Para usarla, copiar backend/infra/.env.example a backend/infra/.env y elegir DB_PASSWORD y MYSQL_ROOT_PASSWORD. Desde backend ejecutar:

```powershell
docker compose --env-file infra/.env -f infra/compose.yaml up -d
```

Este MySQL 8.4 usa el puerto 3307, la base notewave y el usuario notewave. Ajustar DB_PORT=3307, DB_USERNAME=notewave y la contraseña elegida en backend/.env. Son datos independientes de XAMPP. Después ejecutar migraciones. Mailpit expone SMTP 1025 y su interfaz 8025. Esta alternativa aún no está validada localmente.

## Comprobaciones

En backend: `composer validate --strict`, `composer lint`, `composer test` y `php artisan migrate:status`. En frontend: `npm.cmd run lint`, `npm.cmd run format:check`, `npm.cmd test` y `npm.cmd run build`.

Para navegador: `npx.cmd playwright install chromium` y `npm.cmd run test:e2e` en frontend. Playwright inicia ambos servidores si no están activos; cubre conexión vía proxy, navegación y reintentos en Chromium de escritorio y móvil emulado. No sustituye pruebas en Safari/iPhone ni Android reales. En Linux/macOS usar npm y npx sin .cmd.

Las pruebas de salud no consultan la base. Las pruebas de identidad usan SQLite en memoria; los recorridos completos de cuentas usan MariaDB en la base separada notewave_e2e. Ver [cuentas, correo local y pruebas](identity.md).

No hay CI activa: su configuración se conserva en docs/ci/github-actions.example.yml. El correo de identidad requiere Mailpit y un worker de cola; consulta [las instrucciones](identity.md). Scheduler pendiente de los módulos que lo necesiten.

## Producción

Todavía no hay despliegue. No usar Vite ni artisan serve en producción. Servir frontend/dist y enviar rutas backend a backend/public antes del fallback SPA. Actualizar PHP, revisar Laravel, validar MySQL 8.4 y configurar HTTPS, secretos, correo, workers y respaldos según el plan.
