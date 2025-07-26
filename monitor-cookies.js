const { extractCookies } = require('./extract-cookies.js');

// Función auxiliar para esperas
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function monitorCookies() {
    console.log('🔍 Monitor de Cookies Univalle - Análisis Detallado');
    console.log('====================================================');
    
    const startTime = new Date();
    let attempts = 0;
    let successCount = 0;
    let cookies = {
        phpsessid: null,
        asigacad: null,
        history: []
    };

    try {
        // Intentar extracción múltiple para análisis
        for (let i = 1; i <= 3; i++) {
            attempts++;
            console.log(`\n🧪 Intento ${i}/3 - ${new Date().toLocaleTimeString()}`);
            
            try {
                const result = await extractCookies();
                
                if (result.phpsessid || result.asigacad) {
                    successCount++;
                    cookies.history.push({
                        attempt: i,
                        timestamp: new Date().toISOString(),
                        phpsessid: result.phpsessid,
                        asigacad: result.asigacad,
                        success: true
                    });
                    
                    if (result.phpsessid) cookies.phpsessid = result.phpsessid;
                    if (result.asigacad) cookies.asigacad = result.asigacad;
                    
                    console.log(`✅ Intento ${i} exitoso`);
                } else {
                    cookies.history.push({
                        attempt: i,
                        timestamp: new Date().toISOString(),
                        error: 'No cookies found',
                        success: false
                    });
                    console.log(`❌ Intento ${i} falló - No se encontraron cookies`);
                }
                
            } catch (error) {
                cookies.history.push({
                    attempt: i,
                    timestamp: new Date().toISOString(),
                    error: error.message,
                    success: false
                });
                console.log(`❌ Intento ${i} error:`, error.message);
            }
            
            if (i < 3) {
                console.log('⏳ Esperando 10 segundos antes del siguiente intento...');
                await delay(10000);
            }
        }

        // Generar reporte final
        const endTime = new Date();
        const duration = Math.round((endTime - startTime) / 1000);
        
        console.log('\n📊 REPORTE FINAL DE MONITOREO');
        console.log('===============================');
        console.log(`⏱️  Duración total: ${duration} segundos`);
        console.log(`🎯 Intentos: ${attempts}`);
        console.log(`✅ Exitosos: ${successCount}`);
        console.log(`📈 Tasa de éxito: ${((successCount/attempts) * 100).toFixed(1)}%`);
        
        console.log('\n🍪 ESTADO DE COOKIES:');
        console.log(`   PHPSESSID: ${cookies.phpsessid ? '✅ Encontrada' : '❌ No encontrada'}`);
        console.log(`   asigacad:  ${cookies.asigacad ? '✅ Encontrada' : '❌ No encontrada'}`);
        
        if (cookies.phpsessid) {
            console.log(`   PHPSESSID: ${cookies.phpsessid.substring(0, 16)}...`);
        }
        if (cookies.asigacad) {
            console.log(`   asigacad: ${cookies.asigacad.substring(0, 16)}...`);
        }

        console.log('\n📋 HISTORIAL DETALLADO:');
        cookies.history.forEach(entry => {
            const status = entry.success ? '✅' : '❌';
            const time = new Date(entry.timestamp).toLocaleTimeString();
            console.log(`   ${status} Intento ${entry.attempt} (${time})`);
            if (entry.phpsessid) console.log(`      PHPSESSID: ${entry.phpsessid.substring(0, 12)}...`);
            if (entry.asigacad) console.log(`      asigacad: ${entry.asigacad.substring(0, 12)}...`);
            if (entry.error) console.log(`      Error: ${entry.error}`);
        });

        console.log('\n💡 RECOMENDACIONES:');
        if (cookies.phpsessid && cookies.asigacad) {
            console.log('   🎉 ¡Sistema funcionando perfectamente!');
            console.log('   📊 Ambas cookies se extraen correctamente');
        } else if (cookies.asigacad && !cookies.phpsessid) {
            console.log('   ⚠️ Solo se obtiene asigacad');
            console.log('   🔍 PHPSESSID puede requerir pasos adicionales');
            console.log('   💡 Considera navegar a página de resultados');
        } else if (!cookies.asigacad && !cookies.phpsessid) {
            console.log('   ❌ No se obtienen cookies');
            console.log('   🔧 Revisar formulario y navegación');
            console.log('   🌐 Verificar si la página cambió');
        }

        console.log('\n🚀 PRÓXIMOS PASOS:');
        console.log('   1. Ejecutar: npm run extract (para uso normal)');
        console.log('   2. Ejecutar: npm run test-frames (para debug)');
        console.log('   3. GitHub Actions se ejecuta automáticamente cada 8h');

        // Retornar resumen para uso programático
        return {
            success: successCount > 0,
            attempts,
            successCount,
            successRate: (successCount/attempts) * 100,
            cookies,
            duration
        };

    } catch (error) {
        console.error('💥 Error crítico en monitoreo:', error);
        throw error;
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    monitorCookies()
        .then(result => {
            console.log(`\n🏁 Monitoreo completado - Éxito: ${result.success}`);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Fallo en monitoreo:', error);
            process.exit(1);
        });
}

module.exports = { monitorCookies }; 