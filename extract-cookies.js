const puppeteer = require('puppeteer');
const { google } = require('googleapis');

// Función auxiliar para esperas (compatible con todas las versiones de Puppeteer)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Configuración robusta
const CONFIG = {
    URL: 'https://proxse26.univalle.edu.co/asignacion/vin_asignacion.php3',
    CEDULA_TEST: '1112966620',
    PASSWORD_TEST: '', // Se configurará desde variables de entorno
    TIMEOUT_LONG: 30000,
    TIMEOUT_SHORT: 10000,
    RETRY_ATTEMPTS: 3,
    WAIT_BETWEEN_RETRIES: 3000
};

// Múltiples selectores posibles para cédula
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

// Selectores para campo de contraseña
const PASSWORD_SELECTORS = [
    'input[name="password"]',
    'input[name="clave"]',
    'input[name="pass"]',
    'input[type="password"]',
    'input[placeholder*="contraseña" i]',
    'input[placeholder*="password" i]',
    'input[placeholder*="clave" i]',
    'form input[type="password"]'
];

const SUBMIT_SELECTORS = [
    'img[src*="imprimir_.gif"]',
    'img[alt*="Imprimir" i]',
    'input[type="submit"][value*="Imprimir" i]',
    'input[type="submit"]',
    'button[type="submit"]',
    'form button',
    'input[type="button"]',
    'input[type="image"]'
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
                     // Esperar JavaScript adicional y frames
                     await delay(8000);
                     navigationSuccess = true;
                     break;
                 }
             } catch (error) {
                 console.log(`⚠️ Intento ${attempt} falló:`, error.message);
                 if (attempt < CONFIG.RETRY_ATTEMPTS) {
                     await delay(CONFIG.WAIT_BETWEEN_RETRIES);
                 }
             }
         }

         if (!navigationSuccess) {
             throw new Error('No se pudo cargar la página después de varios intentos');
         }

         // 🖼️ DETECTAR Y MANEJAR FRAMES CON ESPERA ACTIVA
         console.log('⏳ Esperando que aparezca el frame del formulario...');
         
         let targetFrame = null;
         
         try {
             // Esperar activamente hasta que aparezca el frame específico (solución anti-race condition)
             targetFrame = await page.waitForFrame(
                 frame => frame.url().includes('vin_docente.php3'), 
                 { timeout: 15000 } // Esperamos hasta 15 segundos
             );
             console.log(`✅ Frame objetivo encontrado y listo: ${targetFrame.url()}`);
         } catch (waitError) {
             console.log('⚠️ Frame específico no encontrado, analizando frames disponibles...');
             
             // Fallback: buscar en frames existentes
             const frames = page.frames();
             console.log(`📋 Total frames encontrados: ${frames.length}`);
             
             for (const frame of frames) {
                 const frameUrl = frame.url();
                 console.log(`   🖼️ Frame: ${frameUrl}`);
                 
                 if (frameUrl.includes('vin_docente.php3') || frameUrl.includes('asignacion')) {
                     console.log(`✅ Frame objetivo encontrado en fallback: ${frameUrl}`);
                     targetFrame = frame;
                     break;
                 }
             }
             
             // Si aún no encuentra el frame, usar el frame principal
             if (!targetFrame) {
                 console.log('⚠️ Usando frame principal como último recurso');
                 targetFrame = page.mainFrame();
             }
         }
         
         console.log(`🎯 Trabajando en frame: ${targetFrame.url()}`)

                 // 🔍 ANÁLISIS DEL FRAME OBJETIVO
         console.log('🔍 Analizando contenido del frame...');
         
         const frameInfo = await targetFrame.evaluate(() => {
             const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                 type: input.type,
                 name: input.name,
                 id: input.id,
                 placeholder: input.placeholder,
                 visible: window.getComputedStyle(input).display !== 'none'
             }));
             
             const forms = Array.from(document.querySelectorAll('form')).map(form => ({
                 action: form.action,
                 method: form.method,
                 inputCount: form.querySelectorAll('input').length
             }));
             
                                  // Buscar también imágenes/botones
                     const images = Array.from(document.querySelectorAll('img')).map(img => ({
                         src: img.src,
                         alt: img.alt,
                         onclick: img.onclick?.toString().substring(0, 50)
                     }));
                     
                     const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], input[type="image"]')).map(btn => ({
                         type: btn.type,
                         value: btn.value,
                         onclick: btn.onclick?.toString().substring(0, 50)
                     }));
                     
                     return {
                         title: document.title,
                         url: window.location.href,
                         inputs: inputs,
                         forms: forms,
                         images: images,
                         buttons: buttons,
                         bodyText: document.body.innerText.substring(0, 200)
                     };
         });

         console.log('📋 Frame analizado:', JSON.stringify(frameInfo, null, 2));

                 // 📝 BUSCAR CAMPO DE CÉDULA EN EL FRAME (con espera robusta)
         console.log('🔍 Buscando campo de cédula en el frame...');
         
         // Primero esperar a que el frame esté completamente cargado
         await targetFrame.waitForLoadState?.('domcontentloaded').catch(() => {});
         await delay(2000); // Pausa adicional para asegurar carga completa
         
         let cedulaSelector = null;
         
         for (const selector of CEDULA_SELECTORS) {
             try {
                 console.log(`   🔍 Probando selector: ${selector}`);
                 await targetFrame.waitForSelector(selector, { timeout: 5000, visible: true });
                 const element = await targetFrame.$(selector);
                 if (element) {
                     // Verificar que el elemento sea realmente interactuable
                     const isVisible = await targetFrame.evaluate((sel) => {
                         const el = document.querySelector(sel);
                         if (!el) return false;
                         const style = window.getComputedStyle(el);
                         return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
                     }, selector);
                     
                     if (isVisible) {
                         console.log(`✅ Campo de cédula encontrado y visible con: ${selector}`);
                         cedulaSelector = selector;
                         break;
                     }
                 }
             } catch (e) {
                 console.log(`   ❌ Selector ${selector} falló: ${e.message}`);
                 continue;
             }
         }

         if (!cedulaSelector) {
             // Si no encuentra input, mostrar todos los disponibles para debugging
             console.log('❌ No se encontró campo de cédula con ningún selector');
             console.log(`🎯 Frame actual: ${targetFrame.url()}`);
             
             const allInputs = await targetFrame.evaluate(() => {
                 return Array.from(document.querySelectorAll('input, textarea')).map(el => ({
                     tag: el.tagName,
                     type: el.type,
                     name: el.name,
                     id: el.id,
                     className: el.className,
                     placeholder: el.placeholder,
                     visible: window.getComputedStyle(el).display !== 'none'
                 }));
             });
             console.log('📋 Todos los inputs disponibles en frame:', JSON.stringify(allInputs, null, 2));
             
             // Información adicional para debugging
             const frameContent = await targetFrame.evaluate(() => {
                 return {
                     title: document.title,
                     url: window.location.href,
                     bodyHTML: document.body.innerHTML.substring(0, 500),
                     hasForm: document.querySelectorAll('form').length > 0
                 };
             });
             console.log('📋 Contenido del frame:', JSON.stringify(frameContent, null, 2));
             
             throw new Error(`No se encontró campo de cédula con ningún selector en frame: ${targetFrame.url()}`);
         }

                 // ✏️ LLENAR CÉDULA EN EL FRAME
         console.log('✏️ Llenando campo de cédula en el frame...');
         await targetFrame.type(cedulaSelector, CONFIG.CEDULA_TEST, { delay: 100 });
         await delay(1000); // Pausa para procesar
         
         // 🔐 BUSCAR Y LLENAR CAMPO DE CONTRASEÑA
         console.log('🔐 Buscando campo de contraseña...');
         let passwordSelector = null;
         
         for (const selector of PASSWORD_SELECTORS) {
             try {
                 console.log(`   🔍 Probando selector de contraseña: ${selector}`);
                 await targetFrame.waitForSelector(selector, { timeout: 3000, visible: true });
                 const element = await targetFrame.$(selector);
                 if (element) {
                     const isVisible = await targetFrame.evaluate((sel) => {
                         const el = document.querySelector(sel);
                         if (!el) return false;
                         const style = window.getComputedStyle(el);
                         return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetHeight > 0;
                     }, selector);
                     
                     if (isVisible) {
                         console.log(`✅ Campo de contraseña encontrado con: ${selector}`);
                         passwordSelector = selector;
                         break;
                     }
                 }
             } catch (e) {
                 console.log(`   ❌ Selector de contraseña ${selector} falló: ${e.message}`);
                 continue;
             }
         }
         
         if (passwordSelector) {
             // Usar contraseña de variable de entorno o valor por defecto
             const password = process.env.UNIVALLE_PASSWORD || CONFIG.PASSWORD_TEST || '';
             if (password) {
                 console.log('✏️ Llenando campo de contraseña...');
                 await targetFrame.type(passwordSelector, password, { delay: 100 });
                 await delay(1000);
             } else {
                 console.log('⚠️ No se encontró contraseña en variables de entorno (UNIVALLE_PASSWORD)');
                 console.log('💡 Para obtener PHPSESSID, configura la contraseña en las variables de entorno');
             }
         } else {
             console.log('❌ No se encontró campo de contraseña');
             console.log('🔍 Esto puede explicar por qué no se genera PHPSESSID');
         }

         // 🖨️ BUSCAR Y HACER CLICK EN IMAGEN DE IMPRIMIR EN TODOS LOS FRAMES
         console.log('🖨️ Buscando imagen de imprimir en todos los frames...');
         
         try {
             // Selectores específicos para la imagen de imprimir
             const PRINT_IMAGE_SELECTORS = [
                 'img[src*="imprimir_.gif"]',
                 'img[alt*="Imprimir" i]',
                 'img[src*="imprimir"]',
                 'input[type="image"][src*="imprimir"]',
                 'img[title*="Imprimir" i]',
                 'a img[src*="imprimir"]'
             ];
             
             let printImageFound = false;
             const allFrames = page.frames();
             console.log(`🔍 Buscando imagen en ${allFrames.length} frames disponibles...`);
             
             // Buscar en todos los frames, no solo en el frame de cédula
             for (const frame of allFrames) {
                 const frameUrl = frame.url();
                 console.log(`   🖼️ Analizando frame: ${frameUrl}`);
                 
                 for (const selector of PRINT_IMAGE_SELECTORS) {
                     try {
                         console.log(`     🔍 Probando selector: ${selector}`);
                         await frame.waitForSelector(selector, { timeout: 2000, visible: true });
                         const element = await frame.$(selector);
                         if (element) {
                             console.log(`✅ ¡Imagen de imprimir encontrada en frame ${frameUrl}!`);
                             console.log(`✅ Selector exitoso: ${selector}`);
                             
                             // Hacer click específicamente en la imagen de imprimir
                             console.log('🖨️ Haciendo click en imagen de imprimir...');
                             await frame.click(selector);
                             printImageFound = true;
                             
                             // Esperar navegación específica para PHPSESSID
                             console.log('⏳ Esperando respuesta del servidor para generar PHPSESSID...');
                             try {
                                 await page.waitForNavigation({ 
                                     waitUntil: 'networkidle2', 
                                     timeout: 15000 
                                 });
                                 console.log('✅ Navegación completada - PHPSESSID debería estar disponible');
                             } catch (navError) {
                                 console.log('⚠️ Sin navegación visible, pero procesando respuesta...');
                                 // Esperar tiempo para que el servidor procese la solicitud
                                 await delay(5000);
                             }
                             
                             break;
                         }
                     } catch (e) {
                         // No mostrar cada fallo individual para no saturar logs
                         continue;
                     }
                 }
                 
                 if (printImageFound) {
                     break; // Salir del bucle de frames si ya encontramos la imagen
                 }
             }
             
             if (!printImageFound) {
                 console.log('⚠️ No se encontró imagen de imprimir específica');
                 console.log('🔄 Intentando métodos alternativos...');
                 
                 // Fallback: buscar botones de envío generales
                 let buttonClicked = false;
                 for (const selector of SUBMIT_SELECTORS) {
                     try {
                         const element = await targetFrame.$(selector);
                         if (element) {
                             console.log(`🔘 Haciendo click en botón alternativo: ${selector}`);
                             await targetFrame.click(selector);
                             buttonClicked = true;
                             
                             // Esperar respuesta
                             await delay(3000);
                             break;
                         }
                     } catch (e) {
                         continue;
                     }
                 }
                 
                 if (!buttonClicked) {
                     // Último recurso: envío de formulario
                     console.log('📋 Último recurso: enviando formulario directamente...');
                     await targetFrame.evaluate((cedulaSelector) => {
                         const cedulaInput = document.querySelector(cedulaSelector);
                         if (cedulaInput && cedulaInput.form) {
                             cedulaInput.form.submit();
                         }
                     }, cedulaSelector);
                 }
             }
             
         } catch (submitError) {
             console.log('❌ Error al enviar formulario:', submitError.message);
             throw new Error(`No se pudo enviar el formulario: ${submitError.message}`);
         }
             
         // Esperar procesamiento adicional para PHPSESSID
         await delay(8000);

        // 🍪 EXTRAER COOKIES
        console.log('🍪 Extrayendo cookies...');
        const cookies = await page.cookies();
        
        console.log(`📋 Total cookies encontradas: ${cookies.length}`);
        cookies.forEach(cookie => {
            console.log(`   ${cookie.name}: ${cookie.value.substring(0, 15)}...`);
        });
        
        const phpsessid = cookies.find(cookie => cookie.name === 'PHPSESSID')?.value;
        const asigacad = cookies.find(cookie => cookie.name === 'asigacad')?.value;

        // Logging detallado de cookies encontradas
        console.log('🔍 Análisis detallado de cookies:');
        console.log(`   PHPSESSID: ${phpsessid ? '✅ Encontrada' : '❌ No encontrada'}`);
        console.log(`   asigacad: ${asigacad ? '✅ Encontrada' : '❌ No encontrada'}`);

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
            
            console.log('🎉 ¡Extracción de cookies completada exitosamente!');
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
        
        // Verificar si las credenciales están configuradas
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_SHEETS_ID) {
            console.log('⚠️ Variables de entorno de Google Sheets no configuradas. Saltando actualización.');
            console.log('💡 Variables requeridas: GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEETS_ID');
            console.log('💡 Para configurar Google Sheets, revisa el archivo setup-guide.md');
            return;
        }
        
        // Configurar autenticación con service account
        const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccountKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

        // Preparar datos (manejar valores null/undefined)
        const timestamp = new Date().toISOString();
        const values = [[
            timestamp, 
            phpsessid || '', // Vacío si no existe
            asigacad || ''   // Vacío si no existe
        ]];

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