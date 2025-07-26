# 🚀 Inicio Rápido - 15 minutos

## Resumen de la Solución
- **GitHub Actions** extrae cookies cada 24 horas automáticamente
- **Google Sheets** almacena las cookies de forma segura
- **Tu Google Apps Script** lee las cookies actualizadas

## Pasos Mínimos

### 1. Crear Service Account (5 min)
1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea proyecto → IAM & Admin → Service Accounts → Create
3. Nombre: "univalle-cookies" → Role: Editor → Create Key (JSON)
4. Guarda el archivo JSON

### 2. Crear Google Sheet (2 min)
1. Nuevo Sheet → Nombre: "Univalle Cookies"
2. A1: `timestamp`, B1: `PHPSESSID`, C1: `asigacad`
3. Compartir con el email del service account (permisos editor)
4. Copiar ID del Sheet (de la URL)

### 3. Crear Repositorio GitHub (3 min)
1. Nuevo repo → Subir estos archivos
2. Settings → Secrets → Actions → Agregar:
   - `GOOGLE_SHEETS_ID`: Tu Sheet ID
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Contenido completo del JSON

### 4. Actualizar Google Apps Script (2 min)
1. Abrir tu proyecto de Google Apps Script
2. Reemplazar TODO el contenido de `searchState.gs` con el código de `gas-searchState.gs`
3. Cambiar `const SHEET_ID = 'TU_GOOGLE_SHEET_ID_AQUÍ';` por tu ID real
4. Guardar el proyecto

### 5. Probar (3 min)
1. GitHub → Actions → "Extract Univalle Cookies" → Run workflow
2. Verificar que aparezcan cookies en tu Sheet
3. Ejecutar función en Google Apps Script

## ✅ ¡Listo!
Ahora se actualizará automáticamente cada día a las 6:00 PM (Colombia).

## 🧹 Opcional: Limpiar Archivos

Revisa `FILES_TO_DELETE.md` para eliminar archivos innecesarios del proyecto.

---

## 💡 Tips y Solución de Problemas

### Error de Dependencies Lock File
- Si ves error sobre `package-lock.json`, es normal 
- El proyecto usa `npm install` en lugar de `npm ci` para evitar este problema

### Verificar que Todo Funciona
1. **GitHub Actions**: Ve a tu repo → Actions → última ejecución debe ser ✅
2. **Google Sheets**: Debe tener datos en fila 2 con timestamp reciente  
3. **Google Apps Script**: Ejecuta función `testCookies()` para verificar

**🆘 Problemas**: Revisar `setup-guide.md` para solución detallada de problemas. 