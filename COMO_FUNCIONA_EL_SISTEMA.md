# 🔄 Cómo Funciona el Sistema de Cookies Automático

## 🤖 **Las Cookies se Extraen AUTOMÁTICAMENTE**

**❓ Pregunta**: "¿Debo poner las cookies manualmente en el Google Sheet?"
**✅ Respuesta**: **NO**. Todo es 100% automático.

## 📋 **Flujo Paso a Paso**

### 1. **GitHub Actions Se Ejecuta** (Cada 24 horas)
```
⏰ 6:00 PM Colombia (todos los días)
└── 🚀 Inicia extract-cookies.js
```

### 2. **Puppeteer Navega a Univalle**
```
🌐 https://proxse26.univalle.edu.co/asignacion/vin_asignacion.php3
└── 🔍 Busca input de cédula
└── ✏️ Escribe "1112966620"
└── 🖱️ Busca imagen: <img src="icons/imprimir_.gif">
└── 🖱️ Hace clic en el botón imprimir
```

### 3. **Extrae Cookies Automáticamente**
```
🍪 PHPSESSID=d4ba672a5680a1e157bc7061a3cc7acd
🍪 asigacad=a192c27c863f567e08621c454d43f034
```

### 4. **Almacena en Google Sheets**
```
📊 "Asignaciones_Academicas" → Hoja "Siac Cookies"
├── A2: 2025-01-26T18:00:00.000Z (timestamp)
├── B2: d4ba672a5680a1e157bc7061a3cc7acd (PHPSESSID)
└── C2: a192c27c863f567e08621c454d43f034 (asigacad)
```

### 5. **Google Apps Script Lee Cookies**
```
📱 Usuario busca docente
└── 🔍 searchState.gs ejecuta getCookiesFromSheet()
└── 📊 Lee última fila de "Siac Cookies"
└── 🌐 Usa cookies para hacer request a Univalle
└── ✅ Retorna datos del docente
```

## 🔧 **Por Qué Falló Antes**

### ❌ **Error Original**:
```javascript
// Buscaba esto (no existe en la página):
await page.waitForSelector('input[name="cedula"]')
```

### ✅ **Corrección Aplicada**:
```javascript
// Ahora busca múltiples opciones:
await page.waitForSelector('input[name="cedula"], input[type="text"], input')

// Y busca el botón específico que mencionaste:
await page.$('img[src*="imprimir_.gif"], img[alt*="Imprimir"]')
```

## 🧪 **Cómo Probar que Funciona**

### Prueba Local (en tu máquina):
```bash
npm run test-page
```
Esto:
- Abrirá un navegador visible
- Navegará a la página de Univalle
- Te mostrará qué elementos encuentra
- Tomará un screenshot para diagnóstico

### Prueba en GitHub Actions:
1. Ve a tu repositorio → Actions
2. Click "Extract Univalle Cookies" 
3. Click "Run workflow"

## 🎯 **Verificación de Éxito**

### ✅ **En GitHub Actions**:
- Log debe mostrar: "✅ Cookies extraídas exitosamente"
- Sin errores de TimeoutError

### ✅ **En Google Sheets**:
- Hoja "Siac Cookies" tiene datos en fila 2
- Timestamp es reciente (últimas 24 horas)

### ✅ **En Google Apps Script**:
- Ejecutar `testCookies()` retorna "✅ Prueba exitosa"
- Tu función original funciona sin errores

## 🔄 **Automatización Completa**

Una vez configurado correctamente:

1. **NUNCA** necesitas actualizar cookies manualmente
2. **NUNCA** necesitas ejecutar scripts manualmente
3. **TODO** sucede automáticamente cada 24 horas
4. Tu aplicación **SIEMPRE** tendrá cookies frescas

## 🆘 **Si Todavía Hay Errores**

1. **Ejecuta**: `npm run test-page` 
2. **Revisa**: `univalle-page-debug.png`
3. **Verifica**: Qué elementos encuentra en la página
4. **Reporta**: Los elementos encontrados vs esperados

El sistema está diseñado para ser **100% automático** - tu único trabajo es la configuración inicial. 🚀 