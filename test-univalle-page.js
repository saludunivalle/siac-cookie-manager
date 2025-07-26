const puppeteer = require('puppeteer');

async function testUnivallePage() {
    console.log('🧪 Probando la página de Univalle...');
    
    const browser = await puppeteer.launch({
        headless: false, // Mostrar navegador para debug
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();
        
        console.log('📄 Navegando a la página...');
        await page.goto('https://proxse26.univalle.edu.co/asignacion/vin_asignacion.php3', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        console.log('📸 Tomando screenshot para diagnóstico...');
        await page.screenshot({ path: 'univalle-page-debug.png', fullPage: true });

        console.log('🔍 Buscando elementos en la página...');
        
        // Evaluar el HTML para ver qué elementos existen
        const pageInfo = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
                type: input.type,
                name: input.name,
                id: input.id,
                placeholder: input.placeholder,
                outerHTML: input.outerHTML.substring(0, 100)
            }));
            
            const images = Array.from(document.querySelectorAll('img')).map(img => ({
                src: img.src,
                alt: img.alt,
                outerHTML: img.outerHTML.substring(0, 100)
            }));
            
            const forms = Array.from(document.querySelectorAll('form')).map(form => ({
                action: form.action,
                method: form.method,
                outerHTML: form.outerHTML.substring(0, 200)
            }));

            return {
                title: document.title,
                url: window.location.href,
                inputs,
                images,
                forms,
                bodyText: document.body.innerText.substring(0, 500)
            };
        });

        console.log('📊 Información de la página:');
        console.log('Título:', pageInfo.title);
        console.log('URL:', pageInfo.url);
        console.log('\n📝 Inputs encontrados:');
        pageInfo.inputs.forEach((input, i) => {
            console.log(`  ${i + 1}. Tipo: ${input.type}, Name: ${input.name}, ID: ${input.id}`);
        });
        
        console.log('\n🖼️ Imágenes encontradas:');
        pageInfo.images.forEach((img, i) => {
            console.log(`  ${i + 1}. Src: ${img.src}, Alt: ${img.alt}`);
        });
        
        console.log('\n📋 Formularios encontrados:');
        pageInfo.forms.forEach((form, i) => {
            console.log(`  ${i + 1}. Action: ${form.action}, Method: ${form.method}`);
        });

        // Probar si podemos encontrar el campo de cédula
        let cedulaFound = false;
        try {
            const cedulaInput = await page.$('input[name="cedula"], input[type="text"]');
            if (cedulaInput) {
                console.log('\n✅ Campo de cédula encontrado!');
                await cedulaInput.type('1112966620');
                cedulaFound = true;
            }
        } catch (e) {
            console.log('\n❌ No se pudo encontrar campo de cédula');
        }

        // Probar si podemos encontrar el botón de imprimir
        let printButtonFound = false;
        try {
            const printButton = await page.$('img[src*="imprimir_.gif"], img[alt*="Imprimir"]');
            if (printButton) {
                console.log('✅ Botón de imprimir encontrado!');
                printButtonFound = true;
            }
        } catch (e) {
            console.log('❌ No se pudo encontrar botón de imprimir');
        }

        // Extraer cookies actuales
        const cookies = await page.cookies();
        console.log('\n🍪 Cookies actuales:');
        cookies.forEach(cookie => {
            console.log(`  ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
        });

        if (cedulaFound && printButtonFound) {
            console.log('\n🎉 ¡La página parece funcional! Intentando hacer clic en imprimir...');
            try {
                const printButton = await page.$('img[src*="imprimir_.gif"], img[alt*="Imprimir"]');
                await printButton.click();
                await page.waitForTimeout(3000);
                
                const newCookies = await page.cookies();
                console.log('\n🍪 Cookies después del clic:');
                newCookies.forEach(cookie => {
                    console.log(`  ${cookie.name}: ${cookie.value.substring(0, 20)}...`);
                });
            } catch (e) {
                console.log('❌ Error al hacer clic:', e.message);
            }
        }

        console.log('\n📸 Screenshot guardado como: univalle-page-debug.png');
        console.log('🔍 Revisa el screenshot para ver cómo se ve la página');

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
    } finally {
        await browser.close();
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    testUnivallePage()
        .then(() => {
            console.log('🏁 Prueba completada');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Prueba falló:', error);
            process.exit(1);
        });
}

module.exports = { testUnivallePage }; 