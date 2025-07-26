const { extractCookies } = require('./extract-cookies');

async function testExtraction() {
    try {
        console.log('🧪 Ejecutando prueba de extracción de cookies...');
        
        // Verificar variables de entorno
        if (!process.env.GOOGLE_SHEETS_ID) {
            console.log('⚠️ GOOGLE_SHEETS_ID no está configurado - solo se probarán las cookies');
        }
        
        if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
            console.log('⚠️ GOOGLE_SERVICE_ACCOUNT_KEY no está configurado - solo se probarán las cookies');
        }

        const cookies = await extractCookies();
        
        console.log('✅ Prueba exitosa');
        console.log('📊 Resultados:');
        console.log(`   PHPSESSID: ${cookies.phpsessid.length} caracteres`);
        console.log(`   asigacad: ${cookies.asigacad.length} caracteres`);
        
    } catch (error) {
        console.error('❌ Error en la prueba:', error);
        process.exit(1);
    }
}

testExtraction(); 