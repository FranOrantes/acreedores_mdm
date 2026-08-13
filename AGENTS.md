
## Parametrización (obligatorio)

- TODO valor parametrizable (URLs, API keys, métodos de integración, bodies, límites, prefijos, etapas, reglas de validación) vive en el módulo **Configuración** de materiales (tabla `ConfiguracionModulo`, editable por admin en caliente).
- PROHIBIDO hardcodear valores de integración en código nuevo. Se lee vía `configService.get(clave)`.
- Toda integración nueva debe registrar sus claves en `configService.DEFAULTS` con su prueba en `POST /api/materiales/configuracion/probar/:clave`.
