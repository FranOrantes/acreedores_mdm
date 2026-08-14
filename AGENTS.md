# Alcance de trabajo: Módulo de Materiales (Backend)

> Workspace multi-repo: este archivo aplica ÚNICAMENTE al repo `acreedores_mdm` (backend). El repo `acreedores_mdm_frontend` tiene sus propias reglas; no las mezcles.

## Permisos de modificación

- ÚNICAMENTE se permite crear, modificar o eliminar archivos dentro de:
  - `acreedores_mdm/src/routes/materiales/`

## Permisos de exploración

- Se permite leer y explorar cualquier otra carpeta de AMBOS repositorios (configuración, otros módulos, modelos, middlewares, componentes del frontend, etc.) con fines de análisis, entendimiento del código y planificación de cambios futuros en el módulo de materiales.
- La exploración es SOLO LECTURA. Bajo ninguna circunstancia se deben modificar archivos fuera del alcance permitido durante la exploración.

## Restricciones

- NO tocar nada fuera de `acreedores_mdm/src/routes/materiales/` sin aprobación explícita del usuario.
- NO tocar NADA del repo `acreedores_mdm_frontend` desde tareas de backend; sus reglas viven en su propio `AGENTS.md` / `.windsurfrules`.
- Si durante una tarea se detecta que es necesario modificar algo fuera de la carpeta permitida (por ejemplo: registrar una ruta en un archivo central, agregar una dependencia, modificar configuración, etc.), se debe:
  1. Detener el trabajo en ese punto.
  2. Explicar al usuario qué archivo se necesita modificar y por qué.
  3. Esperar aprobación explícita del usuario antes de realizar el cambio.

## Notas

- Este repositorio es el backend; el frontend correspondiente vive en un repo separado (`acreedores_mdm_frontend`) con sus propias reglas.
- Existe bloqueo duro a nivel de herramienta en `.devin/config.json`: las escrituras fuera de `src/routes/materiales/` están denegadas.

## Github
Nunca pongas marca de generated o co-authored-by

## Parametrización (obligatorio)

- TODO valor parametrizable (URLs, API keys, métodos de integración, bodies, límites, prefijos, etapas, reglas de validación) vive en el módulo **Configuración** de materiales (tabla `ConfiguracionModulo`, editable por admin en caliente).
- PROHIBIDO hardcodear valores de integración en código nuevo. Se lee vía `configService.get(clave)`.
- Toda integración nueva debe registrar sus claves en `configService.DEFAULTS` con su prueba en `POST /api/materiales/configuracion/probar/:clave`.

## Documentación del sistema (obligatorio consultarla)

- Antes de crear o debuggear cualquier configuración (tabla, formulario, regla, script, integración, API), LEE `docs/sistema/README.md` — describe cada módulo, cómo se conectan, el sandbox de scripts y recetas paso a paso.
- Réplica ServiceNow del módulo Materiales: `docs/servicenow-mdm-material-alta/` (en la branch MDM_Materiales_IA).
