const puppeteer = require('puppeteer');

// Función auxiliar para esperas (compatible con todas las versiones de Puppeteer)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testFrameWait() {
    console.log('🧪 Iniciando test de espera de frames...');
    
    const browser = await puppeteer.launch({
        headless: false, // Visible para debugging
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });

        console.log('📄 Navegando a la página contenedora...');
        await page.goto('https://proxse26.univalle.edu.co/asignacion/vin_asignacion.php3', {
            waitUntil: 'networkidle2'
        });

        // Test 1: Método anterior (puede fallar por race condition)
        console.log('\n🔍 TEST 1: Método anterior (buscar frames inmediatamente)');
        const framesImmediate = page.frames();
        console.log(`📋 Frames encontrados inmediatamente: ${framesImmediate.length}`);
        
        let immediateTargetFrame = null;
        for (const frame of framesImmediate) {
            const frameUrl = frame.url();
            console.log(`   🖼️ Frame inmediato: ${frameUrl}`);
            
            if (frameUrl.includes('vin_docente.php3')) {
                immediateTargetFrame = frame;
                console.log(`✅ Frame objetivo encontrado inmediatamente`);
                break;
            }
        }
        
        if (!immediateTargetFrame) {
            console.log(`❌ Frame objetivo NO encontrado inmediatamente (problema de race condition)`);
        }

        // Test 2: Método mejorado (waitForFrame)
        console.log('\n⏳ TEST 2: Método mejorado (waitForFrame)');
        
        let waitTargetFrame = null;
        
        try {
            console.log('⏳ Esperando activamente que aparezca el frame del formulario...');
            waitTargetFrame = await page.waitForFrame(
                frame => frame.url().includes('vin_docente.php3'),
                { timeout: 15000 }
            );
            console.log(`✅ Frame objetivo encontrado con waitForFrame: ${waitTargetFrame.url()}`);
        } catch (waitError) {
            console.log(`❌ Error esperando frame: ${waitError.message}`);
        }

        // Test 3: Verificar contenido del frame
        if (waitTargetFrame) {
            console.log('\n🔍 TEST 3: Analizando contenido del frame encontrado');
            
            try {
                                 // Esperar a que el frame esté completamente cargado
                 await delay(3000);
                
                const frameContent = await waitTargetFrame.evaluate(() => {
                    const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                        type: input.type,
                        name: input.name,
                        id: input.id,
                        placeholder: input.placeholder,
                        visible: window.getComputedStyle(input).display !== 'none'
                    }));
                    
                    return {
                        title: document.title,
                        url: window.location.href,
                        inputCount: inputs.length,
                        inputs: inputs,
                        hasForm: document.querySelectorAll('form').length > 0,
                        bodyText: document.body.innerText.substring(0, 200)
                    };
                });
                
                console.log('📋 Contenido del frame:', JSON.stringify(frameContent, null, 2));
                
                // Test 4: Buscar campo de cédula
                console.log('\n🔍 TEST 4: Buscando campo de cédula en el frame');
                
                const CEDULA_SELECTORS = [
                    'input[name="cedula"]',
                    'input[type="text"]',
                    'input[placeholder*="cedula" i]',
                    'input[placeholder*="documento" i]',
                    'input.cedula',
                    'input#cedula',
                    'form input[type="text"]:first-of-type',
                    'form input:first-of-type'
                ];
                
                let cedulaFound = false;
                
                for (const selector of CEDULA_SELECTORS) {
                    try {
                        console.log(`   🔍 Probando selector: ${selector}`);
                        await waitTargetFrame.waitForSelector(selector, { timeout: 2000, visible: true });
                        const element = await waitTargetFrame.$(selector);
                        if (element) {
                            console.log(`✅ Campo de cédula encontrado con: ${selector}`);
                            cedulaFound = true;
                            break;
                        }
                    } catch (e) {
                        console.log(`   ❌ Selector ${selector} falló`);
                    }
                }
                
                if (cedulaFound) {
                    console.log('🎉 ¡Test EXITOSO! El frame y el campo de cédula fueron encontrados correctamente');
                } else {
                    console.log('⚠️ Frame encontrado pero campo de cédula no detectado');
                }
                
            } catch (frameError) {
                console.log(`❌ Error analizando contenido del frame: ${frameError.message}`);
            }
        }

        // Resumen final
        console.log('\n📊 RESUMEN DEL TEST:');
        console.log(`   Frames inmediatos: ${framesImmediate.length}`);
        console.log(`   Frame objetivo (inmediato): ${immediateTargetFrame ? '✅ Encontrado' : '❌ No encontrado'}`);
        console.log(`   Frame objetivo (waitForFrame): ${waitTargetFrame ? '✅ Encontrado' : '❌ No encontrado'}`);
        
        if (waitTargetFrame && !immediateTargetFrame) {
            console.log('🎯 CONFIRMADO: Race condition solucionada con waitForFrame');
        } else if (waitTargetFrame && immediateTargetFrame) {
            console.log('ℹ️ Ambos métodos funcionaron (frame cargó rápidamente)');
        } else {
            console.log('❌ Problema persistente - revisar configuración de la página');
        }

    } catch (error) {
        console.error('❌ Error durante el test:', error.message);
    } finally {
        console.log('\n🔚 Cerrando navegador...');
        await browser.close();
    }
}

// Ejecutar test
testFrameWait()
    .then(() => {
        console.log('🏁 Test completado');
        process.exit(0);
    })
    .catch(error => {
        console.error('💥 Test falló:', error);
        process.exit(1);
    }); 