/**
 * Sistema de Consulta de Marcas Registradas - Módulos
 *
 * Arquitectura modular con 4 pilares:
 * 1. LoadDBModule - Carga de base de datos
 * 2. SearchModule - Búsqueda avanzada
 * 3. VisualizationModule - Visualización de resultados
 * 4. UtilitiesModule - Utilidades y exportación
 */

export { LoadDBModule } from './load-db-module'
export { SearchModule } from './search-module'
export { VisualizationModule } from './visualization-module'
export { UtilitiesModule } from './utilities-module'
