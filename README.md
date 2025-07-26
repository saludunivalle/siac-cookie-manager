# Univalle Docente Cookie Manager

## Descripción
Sistema híbrido que automatiza la extracción de cookies (PHPSESSID y asigacad) de la plataforma Univalle cada 24 horas para mantener funcionando el sistema de búsqueda de docentes en Google Apps Script.

## Arquitectura

```
GitHub Actions (cada 24h) → Puppeteer extrae cookies → Google Sheets → Google Apps Script lee cookies
```

## Componentes

1. **GitHub Action**: Se ejecuta automáticamente cada 24 horas
2. **Puppeteer Script**: Navega la página de Univalle y extrae cookies
3. **Google Sheets**: Almacena las cookies de forma segura
4. **Google Apps Script**: Lee las cookies y ejecuta el scraping de datos

## Configuración

### 1. GitHub Secrets
Necesitas configurar estos secrets en tu repositorio:

- `GOOGLE_SHEETS_ID`: ID de tu Google Sheet
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Clave JSON del service account de Google

### 2. Google Sheets
Crear una hoja con las siguientes columnas:
- A1: `timestamp`
- B1: `PHPSESSID` 
- C1: `asigacad`

### 3. Google Apps Script
Modificar el archivo `searchState.gs` para leer cookies desde Google Sheets.

## Uso

1. El sistema se ejecuta automáticamente cada 24 horas
2. Las cookies se actualizan en Google Sheets
3. Tu aplicación de Google Apps Script las consume automáticamente

## Ventajas

- ✅ Completamente gratuito
- ✅ Automatización real (sin intervención manual)
- ✅ Confiable y estable
- ✅ Mantiene tu código actual con mínimos cambios
- ✅ Cookies siempre actualizadas 