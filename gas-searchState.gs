// CONFIGURACIÓN: Reemplaza con el ID de tu Google Sheet
const SHEET_ID = 'TU_GOOGLE_SHEET_ID_AQUÍ'; // Ejemplo: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'

function extraerDatosDocenteUnivalle(cedula = "1112966620", idPeriod = 48) {
  // Obtener cookies actualizadas desde Google Sheets
  const cookies = getCookiesFromSheet();
  
  if (!cookies.PHPSESSID || !cookies.asigacad) {
    throw new Error('No se pudieron obtener cookies actualizadas desde Google Sheets');
  }

  var url = `https://proxse26.univalle.edu.co/asignacion/vin_inicio_impresion.php3?cedula=${cedula}&periodo=${idPeriod}`;
  var cookieString = `PHPSESSID=${cookies.PHPSESSID}; asigacad=${cookies.asigacad}; _ga_HJ5WTZNCZS=GS1.1.1734332858.1.1.1734333088.59.0.0`;

  var options = {
    method: "get",
    headers: {
      "Cookie": cookieString
    }
  };

  try {
    var response = UrlFetchApp.fetch(url, options);
    var html = response.getContentText("ISO-8859-1");

    // El resto del código permanece igual...
    return procesarHTML(html, idPeriod);
    
  } catch (error) {
    Logger.log(`Error al extraer datos para periodo ${idPeriod}: ${error.toString()}`);
    
    // Si hay error, intentar actualizar cookies y reintentar una vez
    if (error.toString().includes('401') || error.toString().includes('403')) {
      Logger.log('Posible problema de cookies, verificando actualización...');
      // Aquí podrías implementar lógica adicional si es necesario
    }
    
    throw error;
  }
}

/**
 * Obtiene las cookies más recientes desde Google Sheets
 */
function getCookiesFromSheet() {
  try {
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Siac Cookies');
    
    if (!sheet) {
      throw new Error('No se encontró la hoja "Siac Cookies" en el Google Sheet');
    }

    // Obtener la última fila con datos (fila 2, ya que fila 1 son encabezados)
    const range = sheet.getRange('A2:C2');
    const values = range.getValues();
    
    if (!values || !values[0] || !values[0][1] || !values[0][2]) {
      throw new Error('No se encontraron cookies válidas en Google Sheets');
    }

    const [timestamp, phpsessid, asigacad] = values[0];
    
    // Verificar que las cookies no sean muy antiguas (más de 25 horas)
    const cookieTime = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now - cookieTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 25) {
      Logger.log(`⚠️ Las cookies tienen ${hoursDiff.toFixed(1)} horas de antigüedad`);
    }

    Logger.log(`✅ Cookies obtenidas: PHPSESSID=${phpsessid.substring(0, 10)}..., asigacad=${asigacad.substring(0, 10)}...`);
    
    return {
      PHPSESSID: phpsessid,
      asigacad: asigacad,
      timestamp: timestamp
    };

  } catch (error) {
    Logger.log(`❌ Error al obtener cookies desde Google Sheets: ${error.toString()}`);
    throw new Error(`Error al obtener cookies: ${error.toString()}`);
  }
}

/**
 * Procesa el HTML extraído (código original sin cambios)
 */
function procesarHTML(html, idPeriod) {
  // Función para decodificar entidades HTML comunes
  function decodeEntities(text) {
    var entities = {
      '&aacute;': 'á', '&Aacute;': 'Á',
      '&eacute;': 'é', '&Eacute;': 'É',
      '&iacute;': 'í', '&Iacute;': 'Í',
      '&oacute;': 'ó', '&Oacute;': 'Ó',
      '&uacute;': 'ú', '&Uacute;': 'Ú',
      '&ntilde;': 'ñ', '&Ntilde;': 'Ñ',
      '&amp;': '&', '&quot;': '"',
      '&lt;': '<', '&gt;': '>',
      '&nbsp;': ' '
    };
    return text.replace(/&[a-zA-Z]+;/g, function(match) {
      return entities[match] || match;
    });
  }

  function removeAccents(str) {
    if (!str) return str;
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function extractCells(rowHtml) {
    var cellMatches = rowHtml.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi);
    if (!cellMatches) return [];
    return cellMatches.map(function(cellHtml) {
      cellHtml = cellHtml.replace(/<\/?t[dh][^>]*>/gi, '');
      cellHtml = cellHtml.replace(/<[^>]+>/g, '');
      cellHtml = cellHtml.replace(/\s*\n\s*/g, ' ').trim();
      cellHtml = decodeEntities(cellHtml);
      cellHtml = removeAccents(cellHtml);
      return cellHtml;
    });
  }

  var tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
  if (!tableMatches || tableMatches.length === 0) {
    Logger.log("No se encontró ninguna tabla.");
    return [];
  }

  var informacionPersonal = {};
  var actividadesDocencia = {
    pregrado: [],
    postgrado: [],
    direccionTesis: []
  };

  var contadorDocencia = 0;

  tableMatches.map(function(tableHtml) {
    var rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
    if (!rowMatches || rowMatches.length < 1) {
      return;
    }

    var headers = extractCells(rowMatches[0]);
    var headersNorm = headers.map(h => h.toUpperCase());

    if (headersNorm.some(h => h.includes("CEDULA")) && headersNorm.some(h => h.includes("APELLIDO"))) {
      if (rowMatches.length >= 2) {
        var values = extractCells(rowMatches[1]);
        headers.forEach(function(header, i) {
          informacionPersonal[header] = values[i] || "";
        });
      }
      return;
    }

    var esTablaAsignaturas = headersNorm.includes("CODIGO") && headersNorm.includes("NOMBRE DE ASIGNATURA");
    if (esTablaAsignaturas) {
      var tipo = (contadorDocencia === 0) ? "pregrado" : "postgrado";
      contadorDocencia++;

      for (var ri = 1; ri < rowMatches.length; ri++) {
        var row = rowMatches[ri];
        var cells = extractCells(row);
        var allEmpty = cells.every(c => c === "");
        if (allEmpty) continue;

        var obj = {};
        headers.forEach(function(header, ci) {
          obj[header] = cells[ci] || "";
        });
        actividadesDocencia[tipo].push(obj);
      }
      return;
    }

    var esTablaTesis = headersNorm.includes("ESTUDIANTE") && headersNorm.includes("TITULO DE LA TESIS");
    if (esTablaTesis) {
      for (var ri2 = 1; ri2 < rowMatches.length; ri2++) {
        var row = rowMatches[ri2];
        var cells = extractCells(row);
        var allEmpty = cells.every(c => c === "");
        if (allEmpty) continue;

        var obj = {};
        headers.forEach(function(header, ci) {
          obj[header] = cells[ci] || "";
        });
        actividadesDocencia.direccionTesis.push(obj);
      }
      return;
    }
  });

  var salida = [
    {
      periodo: idPeriod,
      informacionPersonal: informacionPersonal,
      actividadesDocencia: actividadesDocencia
    }
  ];

  Logger.log(JSON.stringify(salida, null, 2));
  return salida;
}

/**
 * Función de prueba para verificar que las cookies se obtienen correctamente
 */
function testCookies() {
  try {
    const cookies = getCookiesFromSheet();
    Logger.log('✅ Prueba exitosa');
    Logger.log(`Timestamp: ${cookies.timestamp}`);
    Logger.log(`PHPSESSID: ${cookies.PHPSESSID.substring(0, 10)}...`);
    Logger.log(`asigacad: ${cookies.asigacad.substring(0, 10)}...`);
  } catch (error) {
    Logger.log('❌ Error en prueba: ' + error.toString());
  }
} 