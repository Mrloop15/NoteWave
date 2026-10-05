# ADR 0001 — Base de desarrollo separada

Fecha: 4 de octubre de 2026. Estado: aceptada para desarrollo inicial.

Aplicaciones independientes con lockfiles separados. Vue consume rutas relativas mediante proxy a Laravel. La primera integración comprueba liveness sin base de datos; no representa disponibilidad de dependencias.

| Componente | Selección / comprobación |
| --- | --- |
| Node / npm local | 24.21.0 / 11.19.0 |
| Vue | 3.5.43 |
| TypeScript | 5.9.3, estricto |
| Vite | 7.3.6 |
| PHP local | 8.2.12, entorno de desarrollo existente |
| Composer local | 2.8.2 |
| Laravel | 12.69.3 |
| Base local | MariaDB 10.4.32 de XAMPP, puerto 3306; conexión y migraciones verificadas |
| MySQL objetivo | 8.4, configurado en Compose y plantilla de CI; pendiente de validar |

Los lockfiles contienen todas las versiones exactas instaladas.

Laravel 12 permite empezar con PHP 8.2 sin cambiar XAMPP global. Según la [política oficial](https://laravel.com/framework/docs/12.x/releases), recibe correcciones de seguridad hasta el 24 de febrero de 2027; terminó su periodo de correcciones generales. Elección temporal: actualizar PHP y evaluar Laravel 13 antes de producción. PHP 8.2.12 no es un parche actualizado y no se propone para producción.

Node 24 cumple los requisitos de las guías de [Vite](https://vite.dev/guide/) y [Vue](https://vuejs.org/guide/quick-start.html). Se mantiene TypeScript 5.9 y Vite 7 para este incremento. ESLint 10 es compatible con los plugins instalados. Vitest 4.1.11 sustituye la selección inicial 3.x tras auditar dependencias. Se usa `@lucide/vue`, sucesor del paquete de iconos deprecado.

## Consecuencias

- La integración y presentación pueden verificarse sin MySQL.
- El proxy local no sustituye la configuración de despliegue.
- Las sesiones reales requerirán Fortify/Sanctum y pruebas CSRF.
- Compose sigue pendiente de validación. CI está archivada como plantilla; no existe una carpeta .github activa.
- Se creó la base local notewave y un usuario dedicado en XAMPP. Se comprobó escritura/lectura con rollback. No se modificó PHP global ni se alteraron bases ajenas.
- Por indicación posterior del usuario, la raíz contiene sólo frontend y backend; documentación e infraestructura viven dentro del backend. Cada proyecto tiene sus instrucciones y archivos de configuración.
