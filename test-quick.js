const puppeteer = require('puppeteer');

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
            await page.waitForTimeout(5000);

            // ¿Hay contenido?
            const hasContent = await page.evaluate(() => {
                const bodyText = document.body.innerText.trim();
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
            console.log(JSON.stringify(hasContent, null, 2));

            // ¿Se puede tomar screenshot?
            try {
                await page.screenshot({ path: 'quick-test.png', fullPage: true });
                console.log('📸 Screenshot guardado: quick-test.png');
            } catch (screenshotError) {
                console.log('❌ No se pudo tomar screenshot:', screenshotError.message);
            }

            if (hasContent.inputCount > 0) {
                console.log('✅ ¡Se encontraron inputs! La página parece funcional.');
                
                // Mostrar detalles de inputs
                const inputs = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('input')).map(input => ({
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        placeholder: input.placeholder,
                        visible: window.getComputedStyle(input).display !== 'none'
                    }));
                });
                
                console.log('📝 Inputs encontrados:');
                inputs.forEach((input, i) => {
                    console.log(`  ${i + 1}. ${input.type} | name="${input.name}" | id="${input.id}" | visible=${input.visible}`);
                });
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