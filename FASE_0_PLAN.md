# FASE 0 - PROTOTIPO FUNCIONAL VALIDABLE
**Duración:** 8 semanas | **Presupuesto:** $5.000.000 CLP + IVA | **Objetivo:** Demo estratégica sin presión para validación cliente

---

## ALCANCE FASE 0

### ✅ INCLUIDO
1. **Landing/Dashboard Principal**
   - Interfaz profesional en Next.js + v0
   - Resumen de marcas cargadas
   - Indicadores visuales (estado BD, comparaciones)
   - Acceso a módulos

2. **Login Visual + Roles Básicos**
   - Pantalla de autenticación
   - Roles simulados: Admin, Analista, Auditor
   - Destinado a demostración, no producción

3. **Módulo de Consulta de Marcas**
   - Base de datos de prueba (~5K-20K registros)
   - Búsqueda: Nombre, Solicitante, Registro, Niza, Viena, Estado
   - Tabla de resultados profesional
   - Vista de detalle

4. **Carga de Datos Demo**
   - 1 archivo CSV limpio
   - ~5K-20K registros
   - Estructura preparada para escalamiento futuro

5. **Comparador Visual de Logos - DEMO**
   - Subir logo
   - Comparación contra galería pequeña (~500-2K imágenes)
   - Top coincidencias con similitud %
   - Vista lado a lado

6. **Panel de Resultados**
   - Logo similar, nombre marca, Niza, Viena, score
   - Botón "ver detalle"

7. **Historial Simple**
   - Fecha, Usuario, Imagen, Resultado, Acción

8. **Exportación Simple**
   - CSV, PDF imprimible desde navegador

---

## ❌ NO INCLUIDO (Fase 1+)
- 350.000 imágenes procesadas
- Carga mensual automática 5.000 imágenes
- Integración real INAPI
- Auditoría legal avanzada
- IA registrabilidad
- Producción multiusuario robusta
- Worker masivo embeddings

---

## PRESUPUESTO DISTRIBUIDO

| Ítem | Monto | % |
|------|-------|-----|
| Diseño UI/UX + estructura Next.js | $1.200.000 | 24% |
| Dashboard y navegación | $600.000 | 12% |
| Módulo consulta de marcas | $900.000 | 18% |
| Carga de datos demo | $600.000 | 12% |
| Comparador visual demo | $1.100.000 | 22% |
| Historial, exportación, QA | $600.000 | 12% |
| **TOTAL** | **$5.000.000** | **100%** |

---

## SPRINT PLAN DETALLADO (8 Semanas)

### **SEMANA 1-2: Fundación & Landing**
- Setup proyecto v0/Next.js en Vercel (CI/CD, repos, estructura)
- Diseño profesional landing page
- Componentes base (botones, cards, tablas, inputs)
- Navegación principal y rutas
- Diseño responsivo (mobile-first)
- **Entregable:** Landing visible, navegable, llamadas a acción

### **SEMANA 3-4: Dashboard & Autenticación**
- Sistema de login visual (mock auth, sin Supabase aún)
- 3 roles con diferentes permisos UI
- Dashboard principal con KPIs/indicadores
- Menú de navegación entre módulos
- Bienvenida personalizada por rol
- Responsive design completamente testado
- **Entregable:** Login funcional, dashboard navegable por todos los roles

### **SEMANA 5-6: Módulo de Consulta de Marcas**
- Crear dataset limpio (5k-20k registros CSV)
- Cargar datos iniciales a Supabase
- Interfaz de búsqueda multifiltro (nombre, registro, Niza, Viena, estado)
- Tabla con paginación y ordenamiento
- Página de detalle de marca (con información completa)
- Búsqueda en tiempo real con debouncing
- Validar UX con diferentes tipos de búsqueda
- **Entregable:** Módulo de consulta completamente funcional

### **SEMANA 7-8: Comparador Visual & Cierre**
- Integrar librería de perceptual hash para similitud
- Página de upload de logo (drag-drop)
- Galería demo de logos (~500-2k imágenes descargadas)
- Motor de comparación que busca similitudes
- Mostrar top 5 coincidencias con score de similitud %
- Vista lado a lado (logo input vs top resultado)
- Historial de búsquedas (tabla simple con fecha/usuario/imagen)
- Exportación CSV de resultados
- Opción de imprimir reporte
- Testing completo (usabilidad, bugs, performance)
- Deploy a Vercel
- Documentación de usuario (guía de demo)
- **Entregable:** Sistema completo funcional, listo para demostración

---

## HITOS INTERMEDIOS (Para validación)

- **Final Semana 2:** Landing pública lista (podría mostrar al cliente)
- **Final Semana 4:** Acceso con login (primeras demostraciones internas)
- **Final Semana 6:** Consulta de marcas funcional (demo parcial con cliente)
- **Final Semana 8:** Sistema completo (demo final + presentación de Fase 1)

---

## VALOR ESTRATÉGICO

✅ Demostrable visualmente (URL pública)  
✅ Flujo real usuario (login → dashboard → consulta → comparador → resultados)  
✅ Valida concepto sin invertir demasiado presupuesto  
✅ Deja base escalable (arquitectura preparada)  
✅ Convence al cliente (interacción real)  
✅ Prepara para Fase 1 ($15M-$20M)  
✅ Sin presión de timeline (8 semanas = ritmo sostenible)

---

## STACK TECNOLÓGICO

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend:** Vercel Functions, API Routes
- **BD:** Supabase PostgreSQL (tabla: marcas, comparaciones, historial)
- **Hosting:** Vercel (gratuito + escalable)
- **Autenticación:** Mock user session (Fase 1: Supabase Auth real)
- **Imagen:** Perceptual hash (librería dhash, no IA custom)
- **Storage:** Vercel Blob para logos de demostración

---

## DOCUMENTACIÓN ENTREGADA

1. **README técnico:** Setup, deployment, estructura proyecto
2. **Documentación API:** Routes disponibles, parámetros
3. **Guía de usuario:** Cómo usar cada módulo
4. **Plan de Fase 1:** Roadmap claro (escalamiento a 350K imágenes)
5. **Dataset demo:** CSV limpio + 500-2K logos de ejemplo

---

## CRITERIOS DE ÉXITO FASE 0

- ✅ Landing profesional (inspira confianza)
- ✅ Login funcional con 3 roles visibles
- ✅ Búsqueda de marcas retorna resultados en <1s
- ✅ Comparador de logos funciona (muestra similitudes)
- ✅ Historial guardado por usuario
- ✅ Exportación a CSV sin errores
- ✅ Responsive en mobile/tablet/desktop
- ✅ Sin errores críticos en demo
- ✅ Código limpio y documentado (escalable)
- ✅ Cliente autoriza presupuesto Fase 1

---

## SIGUIENTE: FASE 1 (Post Fase 0)
**MVP Productivo** — $15M-$20M + IVA (8-10 semanas)
- Sistema robusto multiusuario
- Integración real API INAPI
- Carga automática mensual (5K imágenes)
- Auditoría legal avanzada
- IA mejorada (embedding models)
- Producción lista

---

## SIGUIENTE: FASE 2 (Post Fase 1)
**Escalamiento** — $35M-$60M + IVA (12-16 semanas)
- 350.000 imágenes procesadas
- IA de registrabilidad
- Análisis jurídico automatizado
- Productor de reportes jurídicos
- Integración con OMPI (Viena)

