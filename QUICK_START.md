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
1. Reemplazar código de `searchState.gs` con `gas-searchState.gs`
2. Cambiar `SHEET_ID` por tu ID real
3. Guardar

### 5. Probar (3 min)
1. GitHub → Actions → "Extract Univalle Cookies" → Run workflow
2. Verificar que aparezcan cookies en tu Sheet
3. Ejecutar función en Google Apps Script

## ✅ ¡Listo!
Ahora se actualizará automáticamente cada día a las 6:00 PM (Colombia).

---

**💡 Tip**: Si necesitas cambiar el horario, edita el `cron` en `.github/workflows/extract-cookies.yml`

**🆘 Problemas**: Revisar el archivo `setup-guide.md` para solución detallada de problemas. 