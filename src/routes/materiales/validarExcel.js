const { Router } = require('express');
const multer = require('multer');
const XLSX = require('xlsx');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// Columnas (1-based, como en Excel) de la hoja DatosBasicos — ver docs/05-proceso-excel.md
const COLS_DATOS = {
  ID_CARGA: 1, BISMT: 2, MATNR: 3, MTART: 4, MBRSH: 5, MATKL: 6, MEINS: 7, GROES: 8,
  NTGEW: 9, GEWEI: 10, TEMPB: 11, TRAGR: 12, SPART: 13, PRDHA: 14, CADKZ: 15, XCHPF: 16,
  EXTWG: 17, MSTAE: 18, MSTAV: 19, MSTDE: 20, MSTDV: 21, MHDRZ: 22, MHDLP: 23, NRFHG: 24,
  MFRNR: 25, IPRKZ: 26, RDMHD: 27, MTPOS_MARA: 28, SLED_BBD: 29, WHSTC: 30, HNDLCODE: 31,
  QGRP: 32, SPRAS: 33, MAKTX: 34, LABOR: 35,
};
// Columnas de UnidadesAlter
const COLS_UNIDADES = {
  ID_CARGA: 1, MEINH: 2, UMREZ: 3, UMREN: 4, EAN11: 5, NUMTP: 6, LAENG: 7,
  BREIT: 8, HOEHE: 9, MEABM: 10, VOLUM: 11, VOLEH: 12, BRGEW: 13, GEWEI: 14,
};

// ── Réplicas de los validadores de jj_MDM_Utils_Client ──────────────────────
const msg = (linea, col, texto) => `Linea ${linea}, Columna ${col}: ${texto}`;
const esVacio = (v) => v === undefined || v === null || String(v).trim() === '';
const esNumero = (v) => !esVacio(v) && !Number.isNaN(Number(v));
const esEntero = (v) => esNumero(v) && Number.isInteger(Number(v));
const esEnteroDigitos = (v, min, max) => esEntero(v) && String(Math.abs(Number(v))).length >= min && String(Math.abs(Number(v))).length <= max;

function leerHoja(wb, nombre) {
  const ws = wb.Sheets[nombre];
  if (!ws) return [];
  // Las primeras 4 filas son encabezados del layout; los datos empiezan en la fila 5
  return XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(4)
    .map((row, i) => ({ row, linea: i + 5 }))
    .filter(({ row }) => row.some((c) => !esVacio(c)));
}

function validarHojaDatosBasicos(filas, errores) {
  const materiales = [];
  for (const { row, linea } of filas) {
    const val = (campo) => row[COLS_DATOS[campo] - 1];
    // Obligatorios (réplica validarVacio)
    for (const campo of ['ID_CARGA', 'MTART', 'MATKL', 'MEINS', 'MAKTX']) {
      if (esVacio(val(campo))) errores.push(msg(linea, campo, 'Valor requerido (vacio)'));
    }
    // Numéricos (réplica validarVacioNumero)
    if (!esVacio(val('NTGEW')) && !esNumero(val('NTGEW'))) errores.push(msg(linea, 'NTGEW', 'Debe ser numerico'));
    // Enteros
    for (const campo of ['MHDRZ', 'MHDLP']) {
      if (!esVacio(val(campo)) && !esEntero(val(campo))) errores.push(msg(linea, campo, 'Debe ser numero entero'));
    }
    // Jerarquía Departamento → Categoría → Subcategoría (PRDHA "dep/cat/sub")
    const prdha = String(val('PRDHA') || '');
    if (!esVacio(prdha) && prdha.split('/').filter(Boolean).length > 3) {
      errores.push(msg(linea, 'PRDHA', 'Jerarquia invalida (max 3 niveles Dep/Cat/Sub)'));
    }
    materiales.push({
      idCarga: String(val('ID_CARGA')),
      nombre: String(val('MAKTX') || ''),
      materialSap: String(val('MATNR') || ''),
      tipoMaterial: String(val('MTART') || ''),
      unidadBase: String(val('MEINS') || ''),
    });
  }
  return materiales;
}

function validarHojaUnidades(filas, errores) {
  const eansVistos = new Map(); // EAN -> linea (réplica validarUnicoEAN)
  const porCarga = {}; // idCarga -> [{ meinh, ean }]
  for (const { row, linea } of filas) {
    const val = (campo) => row[COLS_UNIDADES[campo] - 1];
    const idCarga = String(val('ID_CARGA'));
    if (esVacio(idCarga)) { errores.push(msg(linea, 'ID_CARGA', 'Valor requerido (vacio)')); continue; }
    if (esVacio(val('MEINH'))) errores.push(msg(linea, 'MEINH', 'Valor requerido (vacio)'));
    for (const campo of ['UMREZ', 'UMREN']) {
      if (!esVacio(val(campo)) && !esEntero(val(campo))) errores.push(msg(linea, campo, 'Debe ser numero entero'));
    }
    for (const campo of ['LAENG', 'BREIT', 'HOEHE', 'VOLUM', 'BRGEW']) {
      if (!esVacio(val(campo)) && !esNumero(val(campo))) errores.push(msg(linea, campo, 'Debe ser numerico'));
    }
    // EAN: entero de 3 a 16 dígitos y único (réplica validarVacioNumeroEnteroDigitosDos + validarUnicoEAN)
    const ean = String(val('EAN11') || '').trim();
    if (!esVacio(ean)) {
      if (!/^\d{3,16}$/.test(ean)) {
        errores.push(msg(linea, 'EAN11', 'EAN invalido (entero de 3 a 16 digitos)'));
      } else if (eansVistos.has(ean)) {
        errores.push(msg(linea, 'EAN11', `EAN duplicado (ya usado en linea ${eansVistos.get(ean)})`));
      } else {
        eansVistos.set(ean, linea);
      }
    }
    (porCarga[idCarga] = porCarga[idCarga] || []).push({ meinh: String(val('MEINH') || ''), ean });
  }
  return porCarga;
}

// POST /api/materiales/validar-excel — réplica de jj_MDM_Utils_Client.lecturaExcel (Alta)
// Respuesta espejo del delimitador zzRespUestazz: { resultado, informacion, registros, noRegistros }
router.post('/validar-excel', upload.single('archivo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ resultado: 'Error', informacion: 'No se recibio archivo.', registros: [], noRegistros: 0 });
    }

    // Réplica getExtensio: solo .xlsx
    const nombre = req.file.originalname || '';
    if (!nombre.toLowerCase().endsWith('.xlsx')) {
      return res.json({
        resultado: 'Error',
        informacion: 'NoEsExcel: Error con el archivo. Favor de subir un archivo con extencion ".XLSX"',
        registros: [],
        noRegistros: 0,
      });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const errores = [];

    const filasDatos = leerHoja(wb, 'DatosBasicos');
    if (filasDatos.length === 0) {
      return res.json({
        resultado: 'Error',
        informacion: 'La hoja "DatosBasicos" esta vacia o no existe. Usa el layout oficial.',
        registros: [],
        noRegistros: 0,
      });
    }

    const materiales = validarHojaDatosBasicos(filasDatos, errores);
    const unidadesPorCarga = validarHojaUnidades(leerHoja(wb, 'UnidadesAlter'), errores);

    // Enlazar unidades (EANs) por ID_CARGA: PI = unidad base, EMP/SUB = siguientes
    const registros = materiales.map((m) => {
      const unidades = unidadesPorCarga[m.idCarga] || [];
      const pi = unidades.find((u) => u.meinh === m.unidadBase) || unidades[0] || {};
      const resto = unidades.filter((u) => u !== pi);
      return {
        vs_nombre_completo_del_material: m.nombre,
        vs_unidad_del_producto_id_pi: pi.ean || '',
        vs_unidad_del_producto_id_emp: resto[0]?.ean || '',
        vs_unidad_del_producto_id_sub: resto[1]?.ean || '',
        _idCarga: m.idCarga,
        _materialSap: m.materialSap,
        _tipoMaterial: m.tipoMaterial,
        _unidadBase: m.unidadBase,
      };
    });

    const resultado = errores.length === 0 ? 'Correcto' : 'Error';
    return res.json({
      resultado,
      informacion: errores.length === 0
        ? `Archivo valido. ${registros.length} material(es) listos para capturar archivos.`
        : errores.join('\n'),
      registros,
      noRegistros: registros.length,
    });
  } catch (err) {
    console.error('[Materiales] Error validando Excel:', err);
    return res.status(500).json({ resultado: 'Error', informacion: `Error procesando archivo: ${err.message}`, registros: [], noRegistros: 0 });
  }
});

module.exports = router;
