# 🚨 INSTRUCCIONES IMPORTANTES

## ❓ ¿Qué hacer con `gas-searchState.gs`?

**⚠️ IMPORTANTE**: El archivo `gas-searchState.gs` **NO se sube a GitHub**. 

### Pasos correctos:

1. **Abre tu proyecto de Google Apps Script** (donde tienes `searchState.gs`)
2. **Reemplaza TODO el contenido** de tu `searchState.gs` con el código de `gas-searchState.gs`
3. **Cambia esta línea**:
   ```javascript
   const SHEET_ID = 'TU_GOOGLE_SHEET_ID_AQUÍ';
   ```
   Por el ID real de tu Google Sheet "Asignaciones_Academicas"

4. **Guarda el proyecto** en Google Apps Script

## 🔧 Configuración de Google Sheets

### Tu configuración actual:
- **Google Sheet**: "Asignaciones_Academicas" 
- **Hoja**: "Siac Cookies"

### Estructura requerida en la hoja "Siac Cookies":
```
A1: timestamp    B1: PHPSESSID    C1: asigacad
A2: (datos)      B2: (datos)      C2: (datos)
```

## 📂 Estructura GitHub vs Google Apps Script

### En GitHub (siac-cookie-manager):
```
├── README.md
├── package.json                    ← Necesario para GitHub Actions
├── extract-cookies.js              ← Extrae cookies
├── .github/workflows/extract-cookies.yml ← Automatización
└── gas-searchState.gs              ← SOLO para copiar contenido
```

### En Google Apps Script:
```
├── searchState.gs                  ← Aquí pegas el código de gas-searchState.gs
└── FindDocentByDocument.html       ← Tu HTML existente
```

## ✅ Lista de Verificación

### GitHub Repository:
- [ ] Archivo `package.json` existe
- [ ] Secrets configurados (GOOGLE_SHEETS_ID, GOOGLE_SERVICE_ACCOUNT_KEY)
- [ ] GitHub Action se ejecuta sin errores

### Google Sheets:
- [ ] Sheet ID correcto en los secrets
- [ ] Hoja "Siac Cookies" existe
- [ ] Encabezados correctos en A1, B1, C1

### Google Apps Script:
- [ ] `searchState.gs` actualizado con código de `gas-searchState.gs`
- [ ] `SHEET_ID` configurado con ID real
- [ ] Función `testCookies()` ejecuta sin errores

## 🆘 Si tienes errores:

1. **"No se encontró package.json"** → Sube todos los archivos a GitHub
2. **"No se encontró la hoja Siac Cookies"** → Verifica nombre de hoja y SHEET_ID
3. **"Error al obtener cookies"** → Ejecuta `testCookies()` en Google Apps Script para diagnosticar 