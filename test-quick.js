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

            // ¿Hay contenido? (Primero en página principal)
            const mainPageContent = await page.evaluate(() => {
                const bodyText = document.body.innerText.trim();
                return {
                    bodyLength: bodyText.length,
                    inputCount: document.querySelectorAll('input').length,
                    imageCount: document.querySelectorAll('img').length,
                    formCount: document.querySelectorAll('form').length,
                    title: document.title,
                    firstWords: bodyText.substring(0, 100),
                    hasFrameset: !!document.querySelector('frameset'),
                    hasIframes: document.querySelectorAll('iframe').length
                };
            });

            console.log('📊 Análisis de página principal:');
            console.log(JSON.stringify(mainPageContent, null, 2));

            // 🖼️ ANÁLISIS DE FRAMES
            console.log('\n🖼️ Analizando frames...');
            
            // Esperar a que se carguen los frames
            await page.waitForTimeout(3000);
            
            const frames = page.frames();
            console.log(`Total de frames: ${frames.length}`);
            
            let totalInputsInFrames = 0;
            let targetFrame = null;
            
            for (let i = 0; i < frames.length; i++) {
                const frame = frames[i];
                console.log(`\nFrame ${i}: ${frame.url()}`);
                
                try {
                    const frameContent = await frame.evaluate(() => {
                        const inputs = Array.from(document.querySelectorAll('input'));
                        return {
                            title: document.title,
                            inputCount: inputs.length,
                            inputs: inputs.map(input => ({
                                type: input.type,
                                name: input.name,
                                placeholder: input.placeholder,
                                value: input.value
                            })),
                            formCount: document.querySelectorAll('form').length,
                            bodyLength: document.body.innerHTML.length,
                            hasCedulaInput: inputs.some(input => input.name === 'cedula')
                        };
                    });
                    
                    console.log(`  Contenido:`, frameContent);
                    totalInputsInFrames += frameContent.inputCount;
                    
                    if (frameContent.hasCedulaInput) {
                        console.log(`  ✅ ¡Frame con input de cédula encontrado!`);
                        targetFrame = frame;
                    }
                    
                } catch (error) {
                    console.log(`  ❌ Error accediendo al frame: ${error.message}`);
                }
            }

            const hasContent = {
                ...mainPageContent,
                totalFrames: frames.length,
                totalInputsInFrames: totalInputsInFrames,
                hasTargetFrame: !!targetFrame
            };

            // ¿Se puede tomar screenshot?
            try {
                await page.screenshot({ path: 'quick-test.png', fullPage: true });
                console.log('📸 Screenshot guardado: quick-test.png');
            } catch (screenshotError) {
                console.log('❌ No se pudo tomar screenshot:', screenshotError.message);
            }

            if (hasContent.totalInputsInFrames > 0 || hasContent.inputCount > 0) {
                console.log('\n✅ ¡Se encontraron inputs! Analizando ubicación...');
                
                if (hasContent.inputCount > 0) {
                    console.log('📝 Inputs en página principal:');
                    const inputs = await page.evaluate(() => {
                        return Array.from(document.querySelectorAll('input')).map(input => ({
                            type: input.type,
                            name: input.name,
                            id: input.id,
                            placeholder: input.placeholder,
                            visible: window.getComputedStyle(input).display !== 'none'
                        }));
                    });
                    
                    inputs.forEach((input, i) => {
                        console.log(`  ${i + 1}. ${input.type} | name="${input.name}" | id="${input.id}"`);
                    });
                }
                
                if (hasContent.totalInputsInFrames > 0) {
                    console.log(`📝 Se encontraron ${hasContent.totalInputsInFrames} inputs en frames.`);
                    if (hasContent.hasTargetFrame) {
                        console.log('🎯 ¡Frame con input de cédula identificado!');
                    }
                }
                
            } else {
                console.log('\n⚠️ No se encontraron inputs en ningún lugar:');
                console.log('  - Página bloqueó el bot');
                console.log('  - JavaScript no se ejecutó');
                console.log('  - Página redirigió');
                console.log('  - Contenido se carga dinámicamente');
                console.log('  - Frames no se cargaron completamente');
            }

            // 🎯 RECOMENDACIONES ESPECÍFICAS
            console.log('\n🔧 Recomendaciones basadas en el análisis:');
            
            if (hasContent.totalFrames > 1 && hasContent.totalInputsInFrames > 0) {
                console.log('✅ Estrategia: Usar manejo de frames en extract-cookies.js');
                console.log('   El formulario está en frames, no en la página principal');
            }
            
            if (hasContent.hasTargetFrame) {
                console.log('✅ El script debería funcionar con los cambios para frames');
            } else if (hasContent.totalFrames > 0) {
                console.log('⚠️ Hay frames pero no se encontró el input de cédula');
                console.log('   Verificar si el frame target está cargando correctamente');
            } else {
                console.log('❌ No hay frames - verificar si la página cambió de estructura');
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