const puppeteer = require('puppeteer');
const { google } = require('googleapis');

// Configuración robusta
const CONFIG = {
    URL: 'https://proxse26.univalle.edu.co/asignacion/vin_asignacion.php3',
    CEDULA_TEST: '1112966620',
    TIMEOUT_LONG: 30000,
    TIMEOUT_SHORT: 10000,
    RETRY_ATTEMPTS: 3,
    WAIT_BETWEEN_RETRIES: 3000
};

// Múltiples selectores posibles
const CEDULA_SELECTORS = [
    'input[name="cedula"]',
    'input[type="text"]',
    'input[placeholder*="cedula" i]',
    'input[placeholder*="documento" i]',
    'input.cedula',
    'input#cedula',
    'form input[type="text"]:first-of-type',
    'form input:first-of-type',
    'input'
];

const SUBMIT_SELECTORS = [
    'img[src*="imprimir_.gif"]',
    'img[alt*="Imprimir" i]',
    'input[type="submit"][value*="Imprimir" i]',
    'input[type="submit"]',
    'button[type="submit"]',
    'form button',
    'input[type="button"]'
];

async function extractCookies() {
    console.log('🚀 Iniciando extracción de cookies...');
    
    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-blink-features=AutomationControlled',
            '--disable-extensions'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // 🎭 ANTI-DETECCIÓN: Simular navegador real
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        // Eliminar indicadores de automatización
        await page.evaluateOnNewDocument(() => {
            // Eliminar webdriver property
            delete navigator.webdriver;
            
            // Simular plugins
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            
            // Simular languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['es-ES', 'es', 'en'],
            });
        });
        
        // Logs para debugging
        page.on('console', msg => console.log('🖥️ Browser:', msg.text()));
        page.on('pageerror', error => console.log('❌ Page Error:', error.message));
        
        // 🌐 NAVEGACIÓN CON REINTENTOS
        let navigationSuccess = false;
        for (let attempt = 1; attempt <= CONFIG.RETRY_ATTEMPTS; attempt++) {
            try {
                console.log(`📄 Intento ${attempt}: Navegando a la página...`);
                
                const response = await page.goto(CONFIG.URL, {
                    waitUntil: ['networkidle2', 'domcontentloaded'],
                    timeout: CONFIG.TIMEOUT_LONG
                });

                console.log(`✅ Respuesta: ${response.status()}`);
                
                if (response.status() === 200) {
                    // Esperar JavaScript adicional
                    await page.waitForTimeout(5000);
                    navigationSuccess = true;
                    break;
                }
            } catch (error) {
                console.log(`⚠️ Intento ${attempt} falló:`, error.message);
                if (attempt < CONFIG.RETRY_ATTEMPTS) {
                    await page.waitForTimeout(CONFIG.WAIT_BETWEEN_RETRIES);
                }
            }
        }

        if (!navigationSuccess) {
            throw new Error('No se pudo cargar la página después de varios intentos');
        }

        // 🔍 ANÁLISIS DE FRAMES
        console.log('🔍 Analizando estructura de frames...');
        
        // Esperar a que se carguen todos los frames
        await page.waitForTimeout(3000);
        
        const frames = page.frames();
        console.log(`🖼️ Total de frames encontrados: ${frames.length}`);
        
        // Analizar cada frame
        let targetFrame = null;
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            console.log(`📄 Frame ${i}: ${frame.url()}`);
            
            try {
                // Analizar contenido del frame
                const frameInfo = await frame.evaluate(() => {
                    const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        placeholder: input.placeholder
                    }));
                    
                    return {
                        title: document.title,
                        url: window.location.href,
                        inputCount: inputs.length,
                        inputs: inputs,
                        bodyLength: document.body.innerHTML.length,
                        hasCedulaInput: inputs.some(input => input.name === 'cedula')
                    };
                });
                
                console.log(`📊 Frame ${i} info:`, JSON.stringify(frameInfo, null, 2));
                
                // Si encontramos el frame con el input de cédula
                if (frameInfo.hasCedulaInput && frame.url().includes('vin_docente.php3')) {
                    console.log(`✅ Frame objetivo encontrado: ${frame.url()}`);
                    targetFrame = frame;
                    break;
                }
            } catch (error) {
                console.log(`⚠️ Error analizando frame ${i}:`, error.message);
            }
        }

        if (!targetFrame) {
            console.log('❌ No se encontró frame con formulario, intentando acceso directo...');
            // Estrategia alternativa: ir directamente al frame
            await page.goto('https://proxse26.univalle.edu.co/asignacion/vin_docente.php3', {
                waitUntil: 'networkidle2',
                timeout: CONFIG.TIMEOUT_LONG
            });
            targetFrame = page.mainFrame();
        }

        // 📝 BUSCAR Y LLENAR FORMULARIO EN EL FRAME CORRECTO
        console.log('🔍 Trabajando con el frame objetivo...');
        let cedulaInput = null;
        
        for (const selector of CEDULA_SELECTORS) {
            try {
                await targetFrame.waitForSelector(selector, { timeout: 3000, visible: true });
                cedulaInput = await targetFrame.$(selector);
                if (cedulaInput) {
                    console.log(`✅ Campo de cédula encontrado en frame con: ${selector}`);
                    break;
                }
            } catch (e) {
                console.log(`   ❌ Selector ${selector} falló en frame`);
                continue;
            }
        }

        if (!cedulaInput) {
            // Mostrar todos los inputs disponibles en el frame
            const allInputs = await targetFrame.evaluate(() => {
                return Array.from(document.querySelectorAll('input, textarea')).map(el => ({
                    tag: el.tagName,
                    type: el.type,
                    name: el.name,
                    id: el.id,
                    className: el.className
                }));
            });
            console.log('📋 Todos los inputs disponibles en frame:', allInputs);
            throw new Error('No se encontró campo de cédula en el frame');
        }

        // ✏️ LLENAR CÉDULA CON SIMULACIÓN HUMANA
        console.log('✏️ Llenando campo de cédula en frame...');
        await cedulaInput.click({ clickCount: 3 }); // Seleccionar todo
        await page.waitForTimeout(500); // Pausa humana
        await cedulaInput.type(CONFIG.CEDULA_TEST, { delay: 100 }); // Tipeo lento

        // 🖱️ BUSCAR BOTÓN DE ENVÍO EN EL FRAME
        console.log('🖱️ Buscando botón de imprimir en frame...');
        let submitButton = null;
        
        for (const selector of SUBMIT_SELECTORS) {
            try {
                submitButton = await targetFrame.$(selector);
                if (submitButton) {
                    console.log(`✅ Botón encontrado en frame con: ${selector}`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }

        if (submitButton) {
            console.log('🖱️ Haciendo clic en el botón del frame...');
            try {
                // Para frames, usamos click directo y esperamos
                await submitButton.click();
                await page.waitForTimeout(5000); // Esperar procesamiento
            } catch (clickError) {
                console.log('⚠️ Error en clic, continuando...');
                await page.waitForTimeout(3000);
            }
        } else {
            console.log('⚠️ Botón no encontrado en frame, intentando Enter...');
            await targetFrame.keyboard.press('Enter');
            await page.waitForTimeout(5000);
        }

        // 🍪 EXTRAER COOKIES
        console.log('🍪 Extrayendo cookies...');
        const cookies = await page.cookies();
        
        console.log(`📋 Total cookies encontradas: ${cookies.length}`);
        cookies.forEach(cookie => {
            console.log(`   ${cookie.name}: ${cookie.value.substring(0, 15)}...`);
        });
        
        const phpsessid = cookies.find(cookie => cookie.name === 'PHPSESSID')?.value;
        const asigacad = cookies.find(cookie => cookie.name === 'asigacad')?.value;

        if (!phpsessid && !asigacad) {
            console.log('⚠️ No se encontraron cookies específicas, pero extracción continuó');
            console.log('📋 Cookies disponibles:', cookies.map(c => c.name));
            
            // Buscar cookies similares
            const similarCookies = cookies.filter(cookie => 
                cookie.name.toLowerCase().includes('sess') || 
                cookie.name.toLowerCase().includes('asig') ||
                cookie.name.toLowerCase().includes('php')
            );
            
            if (similarCookies.length > 0) {
                console.log('🔍 Cookies similares encontradas:', similarCookies.map(c => c.name));
            }
        }

        const result = { phpsessid, asigacad };
        
        if (phpsessid || asigacad) {
            console.log('✅ Cookies extraídas exitosamente');
            if (phpsessid) console.log(`PHPSESSID: ${phpsessid.substring(0, 10)}...`);
            if (asigacad) console.log(`asigacad: ${asigacad.substring(0, 10)}...`);
            
            // Actualizar Google Sheets
            await updateGoogleSheets(phpsessid, asigacad);
        } else {
            console.log('⚠️ Cookies objetivo no encontradas, pero proceso completado');
        }

        return result;

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