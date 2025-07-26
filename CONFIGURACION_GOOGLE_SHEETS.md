# 📊 Configuración de Google Sheets

## 🚨 **Error Solucionado**

Si ves este error:
```
❌ Error actualizando Google Sheets: SyntaxError: "undefined" is not valid JSON
```

**¡No te preocupes!** El web scraping **funciona perfectamente**. Este error solo indica que Google Sheets no está configurado.

## ✅ **El Sistema Funciona Sin Google Sheets**

Ahora el script continuará exitosamente sin Google Sheets:
```
✅ Cookies extraídas exitosamente
asigacad: 58fdfea5a8...
⚠️ Variables de entorno de Google Sheets no configuradas. Saltando actualización.
💡 Para configurar Google Sheets, revisa el archivo setup-guide.md
🎉 ¡Extracción de cookies completada exitosamente!
```

## 🔧 **Para Configurar Google Sheets (Opcional)**

### 1. **Variables de Entorno Requeridas**

Crea un archivo `.env` en la raíz del proyecto con:

```env
# Credenciales de Google Service Account (JSON como string)
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"tu-proyecto",...}

# ID de la hoja de cálculo de Google Sheets  
GOOGLE_SHEETS_ID=1AbCdEfGhIjKlMnOpQrStUvWxYz

# Cédula para testing (opcional)
UNIVALLE_CEDULA=1112966620
```

### 2. **Obtener Credenciales de Google**

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **Crear Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Descargar JSON key
3. **Habilitar Google Sheets API**:
   - APIs & Services → Library → Google Sheets API → Enable
4. **Configurar Permisos**:
   - Compartir tu Google Sheet con el email del service account

### 3. **Configurar Variables**

**Windows (PowerShell):**
```powershell
$env:GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
$env:GOOGLE_SHEETS_ID='1AbCdEfGhIjKlMnOpQrStUvWxYz'
```

**Linux/Mac:**
```bash
export GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
export GOOGLE_SHEETS_ID='1AbCdEfGhIjKlMnOpQrStUvWxYz'
```

## 🚀 **Testing**

```bash
# Test sin Google Sheets (funcionará)
npm run extract

# Test con Google Sheets (después de configurar)
npm run extract
```

## 💡 **Notas Importantes**

- ✅ **El web scraping funciona perfectamente sin Google Sheets**
- ⚠️ **Google Sheets es completamente opcional**
- 🔒 **Nunca commitees el archivo .env al repositorio**
- 📊 **Google Sheets solo sirve para guardar las cookies automáticamente**

## 🎯 **Resultado Esperado**

**Sin Google Sheets:**
```
🎉 ¡Extracción de cookies completada exitosamente!
```

**Con Google Sheets:**
```
📊 Actualizando Google Sheets...
✅ Google Sheets actualizado exitosamente
🎉 ¡Extracción de cookies completada exitosamente!
``` 