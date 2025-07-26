# 🚨 SOLUCIÓN INMEDIATA A TUS ERRORES

## ✅ Checklist Rápido (5 minutos)

### 1. GitHub Actions - Error package.json

**Problema**: `npm error path package.json ENOENT`

**Solución**:
- [ ] Ve a tu repositorio en GitHub
- [ ] Verifica que exista el archivo `package.json`
- [ ] Si no existe, súbelo desde tu carpeta local
- [ ] Verifica que exista `.github/workflows/extract-cookies.yml`

### 2. Google Apps Script - Error "No se encontró la hoja"

**Problema**: `No se encontró la hoja "cookies"`

**Solución**:
- [ ] Abre tu Google Sheet "Asignaciones_Academicas"
- [ ] Verifica que existe la hoja "Siac Cookies" (pestaña abajo)
- [ ] Si no existe, crea una hoja nueva llamada **exactamente** "Siac Cookies"
- [ ] En A1: `timestamp`, B1: `PHPSESSID`, C1: `asigacad`

### 3. Google Apps Script - Actualizar código

**Acción requerida**:
- [ ] Abre Google Apps Script (tu proyecto)
- [ ] Borra TODO el contenido de `searchState.gs`
- [ ] Copia TODO el contenido del archivo `gas-searchState.gs` de este proyecto
- [ ] Pégalo en tu `searchState.gs` de Google Apps Script
- [ ] Cambia `const SHEET_ID = 'TU_GOOGLE_SHEET_ID_AQUÍ';` por tu ID real
- [ ] Guarda

### 4. Configurar Sheet ID

**Obtener ID**:
Tu URL es algo como:
```
https://docs.google.com/spreadsheets/d/ABC123XYZ789/edit
```
El ID es: `ABC123XYZ789`

**Usar ID en dos lugares**:
- [ ] GitHub Secrets: `GOOGLE_SHEETS_ID` = `ABC123XYZ789`
- [ ] Google Apps Script: `const SHEET_ID = 'ABC123XYZ789';`

## 🧪 Probar que funciona

### En Google Apps Script:
1. Ejecuta la función `testCookies()`
2. Si ves "✅ Prueba exitosa" → está configurado
3. Si ves error → revisa SHEET_ID y nombre de hoja

### En GitHub:
1. Ve a Actions → Run workflow
2. Si se ejecuta sin errores → está funcionando
3. Si hay errores → revisa que package.json esté subido

## 📋 Archivos que deben estar en GitHub:

```
siac-cookie-manager/
├── package.json ←── ¡IMPORTANTE!
├── extract-cookies.js
├── .github/workflows/extract-cookies.yml ←── ¡IMPORTANTE!
├── gas-searchState.gs (para referencia)
└── otros archivos de documentación
```


## ⚡ Orden de ejecución rápida:

1. **Subir archivos faltantes a GitHub**
2. **Crear hoja "Siac Cookies" en Google Sheets**  
3. **Actualizar código en Google Apps Script**
4. **Probar testCookies() en Google Apps Script**
5. **Ejecutar GitHub Action manualmente**

¡En 5 minutos deberías tener todo funcionando! 🚀 