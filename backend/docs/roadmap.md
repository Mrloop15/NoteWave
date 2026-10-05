# Hoja de ruta de NoteWave

## Estado inicial — 4 de octubre de 2026

- [x] Adoptar el plan como referencia de arquitectura del proyecto.
- [x] Separar `frontend/` y `backend/` en el repositorio.
- [x] Incorporar instrucciones comunes en `AGENTS.md`.
- [x] Conservar el documento original en `docs/architecture.md`.
- [x] Inicializar Vue y Laravel con dependencias y lockfiles separados.
- [x] Integrar bienvenida, proxy y endpoints de salud.
- [x] Configurar formato, lint, tipos y pruebas; conservar CI como plantilla opcional.
- [x] Documentar comandos locales y matriz de versiones.
- [x] Conectar MariaDB de XAMPP, crear base/usuario dedicados y aplicar migraciones.
- [ ] Validar compatibilidad y concurrencia en MySQL 8.4.
- [ ] Ejecutar CI en GitHub y preparar staging.

Estado: base ejecutable y base de datos local configuradas. Fase 1 pendiente de MySQL 8.4 y staging. Registro, contenido y voz siguen pendientes. La raíz contiene sólo frontend y backend; documentación e infraestructura están dentro del backend. Ver [guía local](development.md).

## Incrementos de implementación

1. **Base ejecutable:** verificar herramientas locales y soporte de versiones; registrar la matriz PHP/Laravel/Node/MySQL; inicializar Vue y Laravel; configurar MySQL, variables de ejemplo, proxy local, calidad y CI. Salida: instalación y build reproducibles con pasos comprobados.
2. **Identidad:** registro, verificación, sesión, recuperación y cierre de sesión mediante Fortify/Sanctum. Salida: recorridos y protección de sesión probados.
3. **Contenido:** modelo note/task, CRUD privado, búsqueda, paginación, control de versión y editor adaptable. Salida: dos usuarios aislados y actividades con finalización explícita.
4. **Dictado:** prototipo en navegadores móviles; contrato de proveedor, jobs, cuotas, limpieza y revisión del texto. Salida: dictado probado y fallos recuperables sin impedir escritura manual.
5. **Cuenta y calidad:** perfil, exportación, eliminación, PWA limitada al shell, accesibilidad, privacidad y pruebas de carga. Salida: criterios pertinentes del plan verificados.
6. **Operación y lanzamiento:** staging, backups, monitoreo, runbooks y despliegue. Salida: restauración ensayada y recorrido completo validado.

El detalle de fases y criterios está en las secciones 16 y 17 del [plan](architecture.md). Esta lista registra progreso; no declara implementadas las funcionalidades descritas.

## Decisiones aún abiertas

- Versiones concretas y herramientas locales disponibles.
- Presupuesto y volumen de usuarios.
- Proveedor de voz, modelo, región y tratamiento de datos.
- Hosting con workers y procesamiento de audio.
- Límites y retenciones definitivos.
- Identidad visual y validación del editor.

Crear los contratos OpenAPI, ADR, documentación operativa y configuración de infraestructura conforme se implementen, con contenido verificable.
