# Backend de NoteWave

API Laravel 12 con Fortify y Sanctum: registro, sesiones, verificación, recuperación y usuario actual. Base local MariaDB y migraciones de usuarios, sesiones, caché y colas. Incluye notas y actividades privadas con versiones, búsqueda y filtros; el dictado cuenta con un [flujo simulado](docs/transcription.md), pendiente de proveedor real. Ver [contenido](docs/entries.md). Ver [cuentas y correo local](docs/identity.md).

## Organización prevista

- `app/Actions/`: operaciones de Identity, Entries, Transcription, Privacy y Operations.
- `app/Contracts/` y `app/Services/`: contratos y adaptadores, incluido `SpeechToTextProvider`.
- `app/Http/Controllers/`, `Requests/` y `Resources/`: coordinación HTTP, validación y respuestas.
- `app/Models/` y `app/Policies/`: persistencia y autorización.
- `app/Jobs/`: transcripción, exportación y limpieza.
- `database/migrations/` y `routes/`: esquema y rutas.
- `tests/`: pruebas unitarias, funcionales y de integración.

Estos directorios se crearán con Laravel y las primeras implementaciones. Seguir [AGENTS.md](AGENTS.md) y el [plan](docs/architecture.md).

Usar sesiones y colas en base de datos inicialmente, con worker y scheduler. Mantener el audio en almacenamiento temporal privado y utilizar un proveedor simulado durante el desarrollo inicial. Toda consulta de contenido se limita al propietario autenticado.

Comandos disponibles dentro de esta carpeta:

```powershell
composer install
composer dev
composer validate --strict
composer lint
composer test
```

En una instalación nueva, crear `.env` desde `.env.example` y ejecutar `php artisan key:generate` antes de iniciar. `composer format` aplica Pint. Consultar [guía local](docs/development.md) para configurar la base antes de ejecutar `php artisan migrate`.

`GET /health/live` y `GET /api/v1/health` comprueban que Laravel responde; no verifican la base ni servicios externos. Se creó una base `notewave` exclusiva en MariaDB de XAMPP, con usuario propio y las tres migraciones iniciales aplicadas. No se modificaron bases de otros proyectos.
