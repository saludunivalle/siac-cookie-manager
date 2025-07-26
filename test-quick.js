const puppeteer = require('puppeteer');

// Función auxiliar para esperas (compatible con todas las versiones de Puppeteer)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function quickTest() {
    console.log('🧪 Test rápido: ¿Se puede acceder a la página?');
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: false, // Ver qué pasa
            devtools: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });

        const page = await browser.newPage();
        
        // Anti-detección básica
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        await page.evaluateOnNewDocument(() => {
            delete navigator.webdriver;
        });

        // Interceptar todo
        page.on('console', msg => console.log('🖥️ [BROWSER]:', msg.text()));
        page.on('pageerror', error => console.log('❌ [PAGE ERROR]:', error.message));
        page.on('response', response => {
            if (response.url().includes('univalle')) {
                console.log(`📡 [RESPONSE]: ${response.url()} → ${response.status()}`);
            }
        });

        console.log('🌐 Navegando a Univalle...');
        
        try {
            const response = await page.goto('https://proxse26.univalle.edu.co/asignacion/vin_asignacion.php3', {
                waitUntil: 'domcontentloaded',
                timeout: 30000
            });

            console.log(`✅ Status: ${response.status()}`);
            console.log(`📄 URL final: ${page.url()}`);

            // Esperar a que cargue
            await delay(5000);

            // 🖼️ ANALIZAR FRAMES
            console.log('🔍 Analizando estructura de frames...');
            const frames = page.frames();
            console.log(`📋 Total frames encontrados: ${frames.length}`);
            
            let targetFrame = page.mainFrame();
            const frameInfo = [];
            
            for (const frame of frames) {
                const frameUrl = frame.url();
                console.log(`   🖼️ Frame: ${frameUrl}`);
                frameInfo.push(frameUrl);
                
                if (frameUrl.includes('vin_docente.php3') || frameUrl.includes('asignacion')) {
                    console.log(`✅ Frame objetivo encontrado: ${frameUrl}`);
                    targetFrame = frame;
                }
            }

            // Analizar contenido del frame objetivo
            const hasContent = await targetFrame.evaluate(() => {
                const bodyText = document.body ? document.body.innerText.trim() : '';
                const hasInputs = document.querySelectorAll('input').length > 0;
                const hasImages = document.querySelectorAll('img').length > 0;
                const hasForms = document.querySelectorAll('form').length > 0;
                
                return {
                    bodyLength: bodyText.length,
                    inputCount: document.querySelectorAll('input').length,
                    imageCount: document.querySelectorAll('img').length,
                    formCount: document.querySelectorAll('form').length,
                    title: document.title,
                    firstWords: bodyText.substring(0, 100)
                };
            });

            console.log('📊 Análisis de contenido:');
            console.log(JSON.stringify({
                ...hasContent,
                frameCount: frames.length,
                framesFound: frameInfo,
                activeFrame: targetFrame.url()
            }, null, 2));

            // ¿Se puede tomar screenshot?
            try {
                await page.screenshot({ path: 'quick-test.png', fullPage: true });
                console.log('📸 Screenshot guardado: quick-test.png');
            } catch (screenshotError) {
                console.log('❌ No se pudo tomar screenshot:', screenshotError.message);
            }

            if (hasContent.inputCount > 0) {
                console.log('✅ ¡Se encontraron inputs en el frame! La página parece funcional.');
                
                // Mostrar detalles de inputs del frame objetivo
                const inputs = await targetFrame.evaluate(() => {
                    return Array.from(document.querySelectorAll('input')).map(input => ({
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        placeholder: input.placeholder,
                        visible: window.getComputedStyle(input).display !== 'none'
                    }));
                });
                
                console.log('📝 Inputs encontrados en el frame objetivo:');
                inputs.forEach((input, i) => {
                    console.log(`  ${i + 1}. ${input.type} | name="${input.name}" | id="${input.id}" | visible=${input.visible}`);
                });

                // Test específico para campo de cédula
                const cedulaInput = inputs.find(input => 
                    input.name === 'cedula' || 
                    input.type === 'text' ||
                    (input.placeholder && input.placeholder.toLowerCase().includes('cedula'))
                );
                
                if (cedulaInput) {
                    console.log('🎯 ¡Campo de cédula identificado!:', cedulaInput);
                } else {
                    console.log('⚠️ No se identificó el campo de cédula específicamente');
                }
            } else {
                console.log('⚠️ No se encontraron inputs. Posibles causas:');
                console.log('  - Página bloqueó el bot');
                console.log('  - JavaScript no se ejecutó');
                console.log('  - Página redirigió');
                console.log('  - Contenido se carga dinámicamente');
            }

            // Mantener abierto para inspección
            console.log('\n🔍 Navegador abierto para inspección manual.');
            console.log('⚠️ Revisa la página y presiona Enter para continuar...');
            
            // En Node.js para esperar input
            process.stdin.once('data', () => {
                browser.close();
            });

        } catch (navError) {
            console.log('❌ Error de navegación:', navError.message);
            
            // Intentar screenshot del error
            try {
                await page.screenshot({ path: 'error-page.png' });
                console.log('📸 Screenshot de error guardado: error-page.png');
            } catch (e) {
                console.log('❌ No se pudo tomar screenshot de error');
            }
        }

    } catch (error) {
        console.error('💥 Error fatal:', error.message);
    }
}

if (require.main === module) {
    quickTest().catch(console.error);
}

module.exports = { quickTest }; 