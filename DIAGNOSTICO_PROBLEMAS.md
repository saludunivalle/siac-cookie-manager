# 🔍 Guía Completa de Diagnóstico de Problemas

## 🚨 **Problemas Comunes y Soluciones**

### 1. Error: `Waiting for selector failed: Waiting failed: 5000ms exceeded`

**💡 Causa**: La página de Univalle no carga completamente o bloquea bots.

**🔧 Soluciones**:

#### Paso 1: Test Local
```bash
npm run test-quick
```
Esto te dirá inmediatamente si:
- ✅ La página carga correctamente
- ✅ Hay inputs en la página
- ❌ La página está bloqueando el acceso
- ❌ Hay problemas de red

#### Paso 2: Si la página NO carga localmente
- 🌐 Problema de red/DNS
- 🚫 Tu IP está bloqueada
- 📡 Página caída temporalmente

#### Paso 3: Si la página SÍ carga localmente pero falla en GitHub
- 🤖 GitHub Actions IP bloqueada
- 🔒 Detección de bot más estricta en servidores
- ⏰ Problema de timing/timeouts

### 2. Error: `No se encontraron cookies PHPSESSID o asigacad`

**💡 Causa**: El bot no activa la generación de cookies.

**🔧 Soluciones**:
1. Verificar que el formulario se envíe correctamente
2. Asegurar que la cédula de prueba sea válida
3. Comprobar si cambió el flujo de la página

### 3. Error: `GOOGLE_SHEET_ID no está configurado`

**💡 Causa**: Variables de entorno mal configuradas.

**🔧 Solución**:
1. GitHub → Settings → Secrets → Actions
2. Verificar `GOOGLE_SHEETS_ID` y `GOOGLE_SERVICE_ACCOUNT_KEY`
3. Asegurar que el Sheet ID sea correcto

## 🛠️ **Herramientas de Diagnóstico**

### 🧪 Test Rápido (`npm run test-quick`)
**Cuándo usar**: Cuando GitHub Actions falla con timeout
**Qué hace**:
- Abre navegador visible
- Muestra DevTools para inspección
- Analiza contenido de la página
- Mantiene navegador abierto para revisión manual

**Interpretación de resultados**:
```json
{
  "bodyLength": 1500,     // > 100 = página cargó
  "inputCount": 3,        // > 0 = hay formulario
  "imageCount": 15,       // > 0 = recursos cargaron
  "formCount": 1,         // > 0 = hay formulario funcional
  "title": "Asignación"   // título esperado
}
```

### 📊 Test Completo (`npm run test-page`)
**Cuándo usar**: Para análisis exhaustivo
**Qué hace**:
- Análisis detallado de elementos HTML
- Screenshots automáticos
- Logs completos de red y errores

### 🐛 GitHub Actions Debug
**Cuándo usar**: Cuando el test local funciona pero GitHub falla
**Cómo activar**:
1. GitHub → Actions → "Extract Univalle Cookies"
2. "Run workflow" → ✅ Activar modo debug
3. Revisar artifacts descargables con logs

## 📋 **Checklist de Diagnóstico**

### ✅ **Verificaciones Básicas**
- [ ] Google Sheets existe y tiene hoja "Siac Cookies"
- [ ] Secrets de GitHub configurados correctamente
- [ ] Service Account tiene permisos en Google Sheets
- [ ] ID del Sheet es correcto en ambos lugares

### 🌐 **Verificaciones de Red**
- [ ] `npm run test-quick` funciona localmente
- [ ] Página carga en navegador normal
- [ ] No hay bloqueos de IP

### 🤖 **Verificaciones de Bot**
- [ ] User Agent simula navegador real
- [ ] Anti-detección activada
- [ ] Timeouts suficientes para JavaScript

### 📊 **Verificaciones de Contenido**
- [ ] Inputs encontrados en la página
- [ ] Botón de imprimir existe
- [ ] Formulario es funcional

## 🆘 **Escalación de Problemas**

### Nivel 1: Test Local
```bash
npm run test-quick
```
- Si falla: Problema de red/acceso
- Si funciona: Continuar a Nivel 2

### Nivel 2: GitHub Actions Debug
1. Activar modo debug en GitHub Actions
2. Revisar logs detallados
3. Descargar artifacts con screenshots

### Nivel 3: Ajustes Avanzados
Si todo lo anterior falla, considerar:

1. **Cambiar User Agent**:
   ```javascript
   // En extract-cookies.js, línea ~45
   await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36');
   ```

2. **Usar Proxy/VPN**:
   - Configurar proxy en args de Puppeteer
   - Rotar IPs si están bloqueadas

3. **Cambiar Timing**:
   ```javascript
   // Aumentar timeouts
   TIMEOUT_LONG: 60000,  // 60 segundos
   WAIT_BETWEEN_RETRIES: 10000  // 10 segundos
   ```

4. **Probar Horarios Diferentes**:
   - Cambiar cron en GitHub Actions
   - Evitar horas pico de la universidad

## 📞 **Casos Especiales**

### 🔄 **Si la página cambió de estructura**
1. Ejecutar `npm run test-quick`
2. Inspeccionar elementos manualmente
3. Actualizar selectores en `CEDULA_SELECTORS` y `SUBMIT_SELECTORS`

### 🛡️ **Si hay nuevo anti-bot**
1. Revisar console de DevTools en test local
2. Buscar mensajes de bloqueo
3. Ajustar estrategias anti-detección

### 📱 **Si requiere interacción humana**
1. Verificar si añadieron CAPTCHA
2. Comprobar si requiere login
3. Evaluar soluciones alternativas

## ✅ **Indicadores de Éxito**

Sabes que todo funciona cuando:
1. `npm run test-quick` muestra inputs
2. GitHub Actions completa sin errores
3. Google Sheets se actualiza automáticamente
4. `testCookies()` en GAS funciona
5. Tu aplicación obtiene datos de docentes

## ⚡ **Solución Rápida para Emergencias**

Si necesitas cookies URGENTEMENTE:
1. Navega manualmente a la página
2. Abre DevTools → Application → Cookies
3. Copia PHPSESSID y asigacad
4. Ponlos temporalmente en Google Sheets
5. Configura la automatización después 