# Guía de Configuración - Univalle Cookie Manager

## Paso 1: Crear Service Account de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Ve a **IAM & Admin > Service Accounts**
4. Haz clic en **Create Service Account**
5. Dale un nombre como "univalle-cookie-manager"
6. En **Grant this service account access to project**, selecciona **Editor**
7. Haz clic en **Create Key** > **JSON**
8. Descarga el archivo JSON (lo necesitarás para GitHub Secrets)

## Paso 2: Configurar Google Sheets Existente

1. Abre tu Google Sheet "Asignaciones_Academicas"
2. Crea una nueva hoja llamada **exactamente** "Siac Cookies"
3. En la hoja "Siac Cookies", agrega los encabezados:
   - A1: `timestamp`
   - B1: `PHPSESSID`
   - C1: `asigacad`
4. Copia el ID de la hoja (ver guía detallada en `COMO_CONFIGURAR_SHEET_ID.md`)
5. Comparte la hoja con el email del service account (con permisos de editor)

## Paso 3: Configurar GitHub Repository

1. Crea un nuevo repositorio en GitHub
2. Sube todos los archivos de este proyecto
3. Ve a **Settings > Secrets and variables > Actions**
4. Agrega estos secrets:

### GOOGLE_SHEETS_ID
- Value: El ID de tu Google Sheet (extraído de la URL)

### GOOGLE_SERVICE_ACCOUNT_KEY
- Value: Todo el contenido del archivo JSON del service account

```json
{
  "type": "service_account",
  "project_id": "tu-proyecto",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "...",
  "client_id": "...",
  ...
}
```

## Paso 4: Modificar Google Apps Script

1. Abre tu proyecto de Google Apps Script
2. Reemplaza el contenido de `searchState.gs` con el código modificado (ver archivo `gas-searchState.gs`)
3. Agrega el ID de tu Google Sheet en la variable `SHEET_ID`

## Paso 5: Probar el Sistema

### Prueba manual de GitHub Action
1. Ve a tu repositorio en GitHub
2. Haz clic en **Actions**
3. Selecciona "Extract Univalle Cookies"
4. Haz clic en **Run workflow**

### Verificar Google Sheets
1. Revisa que las cookies se actualicen en tu hoja
2. La fila 2 debería tener: timestamp, PHPSESSID, asigacad

### Probar Google Apps Script
1. Ejecuta la función `extraerDatosDocenteUnivalle` en tu GAS
2. Verifica que use las cookies actualizadas

## Programación Automática

El sistema está configurado para ejecutarse **todos los días a las 2:00 AM UTC** (6:00 PM hora de Colombia).

Si necesitas cambiar el horario, modifica la línea `cron` en `.github/workflows/extract-cookies.yml`:

```yaml
schedule:
  - cron: '0 2 * * *'  # Minuto Hora Día Mes DiaSemana
```

## Solución de Problemas

### Error: "No se pudieron extraer las cookies"
- La página de Univalle puede haber cambiado
- Revisa el log de GitHub Actions para ver detalles
- Puede que necesites ajustar los selectores en `extract-cookies.js`

### Error: "Permission denied" en Google Sheets
- Verifica que el service account tenga permisos en la hoja
- Asegúrate de que el SHEET_ID sea correcto

### GitHub Action no se ejecuta
- Verifica que los secrets estén configurados correctamente
- Revisa la sección Actions en tu repositorio para ver errores

## Costos

- **GitHub Actions**: 2,000 minutos gratis/mes (este proyecto usa ~2 minutos/día)
- **Google Sheets**: Gratuito
- **Google Cloud**: Nivel gratuito incluye las llamadas necesarias

**Total: $0/mes** 🎉 