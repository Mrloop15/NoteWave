# Frontend de NoteWave

SPA Vue 3, TypeScript estricto y Vite, con Vue Router, Pinia, Axios e iconos Lucide. Incluye bienvenida, registro, login/logout, verificación, recuperación y panel inicial de cuenta. Notas y PWA todavía pendientes. Ver [cuentas y correo local](../backend/docs/identity.md).

## Organización prevista

- `src/app/`: arranque, router, configuración e instancia HTTP de Axios.
- `src/layouts/` y `src/pages/`: estructuras de navegación y composición de vistas.
- `src/components/ui/`: controles compartidos accesibles.
- `src/features/auth/`, `entries/`, `transcription/` y `account/`: componentes, composables, servicios y tipos por funcionalidad.
- `src/stores/`: estado global compartido mediante Pinia.
- `src/styles/` y `src/assets/`: tokens, estilos generales y recursos.
- `tests/`: pruebas de componentes y comportamiento.

Estos directorios se crearán al incorporar sus primeras implementaciones. Seguir [AGENTS.md](AGENTS.md) y el [plan](../backend/docs/architecture.md).

Las vistas no implementan llamadas HTTP ni grabación directamente. La interfaz inicial será en español; todo acceso a datos privados depende de autorización backend. La PWA inicial sólo cacheará recursos estáticos.

Comandos disponibles dentro de esta carpeta:

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run lint
npm.cmd run format:check
npm.cmd test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

En Linux/macOS usar `npm` y `npx`. Playwright necesita las dependencias y `.env` del backend; inicia los servidores si no están activos. Configuración opcional de proxy en `.env.example`. Ver [guía local](../backend/docs/development.md).
