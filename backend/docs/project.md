# NoteWave

Aplicación de notas y actividades privadas con escritura y dictado revisable.

## Organización acordada

La raíz contiene únicamente dos carpetas:

```text
NoteWave/
  frontend/       Aplicación Vue, README, AGENTS.md y configuración propia
  backend/        Aplicación Laravel, README, AGENTS.md, docs/ e infra/
```

Cada aplicación conserva sus dependencias y lockfile. La documentación compartida está en esta carpeta.

## Estado

Vue y Laravel ejecutables, bienvenida adaptable, proxy, salud, registro, login/logout, verificación de correo y recuperación de contraseña. Base local notewave en MariaDB de XAMPP, con usuario dedicado y cinco migraciones aplicadas; pruebas de identidad en base separada. Notas y actividades privadas implementadas con editor, búsqueda, filtros y versiones. Dictado simulado y controles visuales compartidos implementados; reconocimiento real y PWA pendientes. Ver [dictado](transcription.md). Ver [contenido](entries.md).

Ejecutar `composer dev` en backend y `npm.cmd run dev` en frontend. Abrir http://127.0.0.1:5173.

- [Guía local](development.md).
- [Cuentas y correo local](identity.md).
- [Arquitectura](architecture.md).
- [Hoja de ruta](roadmap.md).
- [Contrato API](openapi.yaml).
- [Versiones](adr/0001-development-foundation.md).
- [Instrucciones backend](../AGENTS.md) y [frontend](../../frontend/AGENTS.md).

## Git y GitHub

Repositorio: [Mrloop15/NoteWave](https://github.com/Mrloop15/NoteWave). Remoto `origin` configurado con `https://github.com/Mrloop15/NoteWave.git` y rama principal `main`. El remoto estaba vacío al conectar este proyecto. Guardar avances mediante commits descriptivos y push; comprobar cambios remotos antes de integrar y nunca sobrescribir historia con un push forzado.

La carpeta .github es opcional: GitHub la usa, entre otras cosas, para automatizar pruebas mediante Actions. No es necesaria para guardar commits ni para ejecutar NoteWave. Se conserva la configuración como [plantilla](ci/github-actions.example.yml), inactiva en esta ubicación. Para activarla en un futuro monorepo habría que colocarla en .github/workflows en la raíz del repositorio; para dos repositorios separados habría que dividirla y adaptar rutas.

Git utiliza el directorio oculto .git para su historial; no es una carpeta de código adicional. La raíz conserva únicamente frontend y backend como carpetas de proyecto. Los .gitignore de ambos proyectos excluyen dependencias, archivos locales y secretos.
