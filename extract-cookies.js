const puppeteer = require('puppeteer');
const { google } = require('googleapis');

async function extractCookies() {
    const browser = await puppeteer.launch({
        headless: "new", // Usar el nuevo modo headless
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=site-per-process'
        ]
    });

    try {
        console.log('🚀 Iniciando extracción de cookies...');
        const page = await browser.newPage();
        
        // Navegar a la página de asignación
        console.log('📄 Navegando a la página de Univalle...');
        await page.goto('https://proxse26.univalle.edu.co/asignacion/vin_asignacion.php3', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Esperar a que cargue el formulario - probando múltiples selectores
        console.log('⏳ Esperando a que cargue el formulario...');
        
        // Intentar diferentes selectores para el campo de cédula
        let cedulaInput;
        try {
            await page.waitForSelector('input[name="cedula"]', { timeout: 5000 });
            cedulaInput = await page.$('input[name="cedula"]');
        } catch {
            try {
                await page.waitForSelector('input[type="text"]', { timeout: 5000 });
                cedulaInput = await page.$('input[type="text"]');
            } catch {
                // Buscar cualquier input que pueda ser para cédula
                await page.waitForSelector('input', { timeout: 5000 });
                cedulaInput = await page.$('input');
            }
        }

        if (!cedulaInput) {
            throw new Error('No se pudo encontrar el campo de cédula en la página');
        }

        // Llenar el campo de cédula con un valor de prueba
        console.log('✏️ Llenando campo de cédula...');
        await cedulaInput.click();
        await cedulaInput.type('1112966620');

        // Buscar y hacer clic en el botón de imprimir (imagen específica)
        console.log('🖱️ Buscando botón de imprimir...');
        const printButton = await page.$('img[src*="imprimir_.gif"], img[alt*="Imprimir"], input[type="submit"][value*="Imprimir"], button[onclick*="imprimir"]');
        
        if (printButton) {
            console.log('✅ Encontrado botón de imprimir, haciendo clic...');
            await printButton.click();
            await page.waitForTimeout(5000); // Esperar más tiempo a que se procese
        } else {
            console.log('⚠️ No se encontró botón de imprimir, intentando enviar formulario...');
            // Intentar enviar el formulario de otra manera
            try {
                await page.keyboard.press('Enter');
                await page.waitForTimeout(3000);
            } catch (e) {
                console.log('⚠️ No se pudo enviar formulario, continuando con extracción de cookies...');
            }
        }

        // Extraer cookies
        console.log('🍪 Extrayendo cookies...');
        const cookies = await page.cookies();
        
        const phpsessid = cookies.find(cookie => cookie.name === 'PHPSESSID')?.value;
        const asigacad = cookies.find(cookie => cookie.name === 'asigacad')?.value;

        if (!phpsessid || !asigacad) {
            throw new Error('No se pudieron extraer las cookies necesarias');
        }

        console.log('✅ Cookies extraídas exitosamente');
        console.log(`PHPSESSID: ${phpsessid.substring(0, 10)}...`);
        console.log(`asigacad: ${asigacad.substring(0, 10)}...`);

        // Actualizar Google Sheets
        await updateGoogleSheets(phpsessid, asigacad);

        return { phpsessid, asigacad };

    } catch (error) {
        console.error('❌ Error durante la extracción:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function updateGoogleSheets(phpsessid, asigacad) {
    try {
        console.log('📊 Actualizando Google Sheets...');
        
        // Configurar autenticación con service account
        const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccountKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

        // Preparar datos
        const timestamp = new Date().toISOString();
        const values = [[timestamp, phpsessid, asigacad]];

        // Verificar si existe una hoja llamada 'Siac Cookies', si no la crea
        const sheetName = 'Siac Cookies';
        
        try {
            await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A1:C1`
            });
        } catch (error) {
            if (error.code === 400) {
                // La hoja no existe, crearla
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    resource: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: sheetName
                                }
                            }
                        }]
                    }
                });
                
                // Agregar encabezados
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A1:C1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['timestamp', 'PHPSESSID', 'asigacad']]
                    }
                });
            }
        }

        // Actualizar la fila 2 con los nuevos datos (sobrescribir datos anteriores)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A2:C2`,
            valueInputOption: 'RAW',
            resource: { values }
        });

        console.log('✅ Google Sheets actualizado exitosamente');

    } catch (error) {
        console.error('❌ Error actualizando Google Sheets:', error);
        throw error;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    extractCookies()
        .then(cookies => {
            console.log('🎉 Proceso completado exitosamente');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Proceso falló:', error);
            process.exit(1);
        });
}

module.exports = { extractCookies }; 