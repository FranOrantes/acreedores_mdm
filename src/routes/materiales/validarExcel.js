const { Router } = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const config = require('./configService');
const prisma = require('../../lib/prisma');
const { cargarInclude, runScript, callScriptInclude } = require('../../lib/scriptEngine');
const catalogosSN = require('./data/catalogosSN.json');
const jerarquia = require('./data/jerarquia.json');

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Réplica de jj_MDM_Utils_Client.lecturaExcel (Alta) sobre el layout KEY real:
// hoja "Info - Correcto", datos desde la fila 5 (filas 1-4 = encabezados/tipos).
// Referencia de columnas y reglas: docs/servicenow-mdm-material-alta/05-proceso-excel.md
// ─────────────────────────────────────────────────────────────────────────────

const norm = (s) => String(s ?? '').trim();
// Los validadores base (esVacio/esNumero/esEntero/eanValido/esFecha8) viven en el
// Script Include "MDM_Excel" (módulo Script Includes) — se cargan en cada request.

// buscarMDMoption: la opción existe si labe = valor OR labe termina con el valor
function existeOpcion(claveCatalogo, valor) {
  const lista = catalogosSN[claveCatalogo] || [];
  const v = norm(valor);
  return lista.some((o) => o.labe === v || o.labe.endsWith(v));
}

// Columnas del layout KEY (índice 0-based) con sus reglas.
// req: requerido | tipo: numero|entero|digitos8|ean | ref: catálogo SN | grupo: 'I'|'P' (requerido si el grupo trae valor)
const COLUMNAS = [
  { col: 0, letra: 'A', campo: 'razonSocial' },
  { col: 1, letra: 'B', campo: 'rfc', req: true },
  { col: 2, letra: 'C', campo: 'nombre', req: true },
  { col: 3, letra: 'D', campo: 'pi_ean', req: true, tipo: 'ean', unico: 'PI' },
  { col: 4, letra: 'E', campo: 'pi_longitud_cm', req: true, tipo: 'numero' },
  { col: 5, letra: 'F', campo: 'pi_ancho_cm', req: true, tipo: 'numero' },
  { col: 6, letra: 'G', campo: 'pi_altura_cm', req: true, tipo: 'numero' },
  { col: 7, letra: 'H', campo: 'pi_peso_gr', req: true, tipo: 'numero' },
  // EMP: en SN el bloque activo pasa '00Vacio00' → todo opcional; si se llena, se valida tipo/referencia
  { col: 8, letra: 'I', campo: 'emp_unidad', ref: 'mdm_mt_emp_unidad' },
  { col: 9, letra: 'J', campo: 'emp_ean', tipo: 'ean', unico: 'EMP' },
  { col: 10, letra: 'K', campo: 'emp_piezas', tipo: 'entero' },
  { col: 11, letra: 'L', campo: 'emp_longitud_cm', tipo: 'numero' },
  { col: 12, letra: 'M', campo: 'emp_ancho_cm', tipo: 'numero' },
  { col: 13, letra: 'N', campo: 'emp_altura_cm', tipo: 'numero' },
  { col: 14, letra: 'O', campo: 'emp_peso_gr', tipo: 'numero' },
  // SUB: en SN el bloque pasa eEnGrupoValor real → requerido si P trae valor
  { col: 15, letra: 'P', campo: 'sub_unidad', ref: 'mdm_mt_sub_unidad' },
  { col: 16, letra: 'Q', campo: 'sub_ean', tipo: 'ean', unico: 'SUB', grupo: 'P' },
  { col: 17, letra: 'R', campo: 'sub_piezas', tipo: 'entero', grupo: 'P' },
  { col: 18, letra: 'S', campo: 'sub_longitud_cm', tipo: 'numero', grupo: 'P' },
  { col: 19, letra: 'T', campo: 'sub_ancho_cm', tipo: 'numero', grupo: 'P' },
  { col: 20, letra: 'U', campo: 'sub_altura_cm', tipo: 'numero', grupo: 'P' },
  { col: 21, letra: 'V', campo: 'sub_peso_gr', tipo: 'numero', grupo: 'P' },
  { col: 22, letra: 'W', campo: 'tipo_articulo', req: true, ref: 'mdm_mt_tipo' },
  { col: 23, letra: 'X', campo: 'forma_producto', req: true, ref: 'mdm_mt_formula' },
  { col: 24, letra: 'Y', campo: 'clasificacion_fiscal', req: true, ref: 'mdm_mt_clasificacion_fiscal' },
  { col: 25, letra: 'Z', campo: 'gpo_trat_logistico', req: true, ref: 'mdm_mt_gpo_trat_logistico' },
  { col: 26, letra: 'AA', campo: 'antibiotico', req: true, ref: 'mdm_mt_antibiotico' },
  { col: 27, letra: 'AB', campo: 'division_factura', req: true, ref: 'mdm_fac_div' },
  { col: 28, letra: 'AC', campo: 'anexo_20_sat', req: true },
  { col: 29, letra: 'AD', campo: 'forma_farmaceutica', req: true, ref: 'mdm_mt_formula_farmaceutica' },
  { col: 30, letra: 'AE', campo: 'registro_sanitario' },
  { col: 31, letra: 'AF', campo: 'registro_sanitario_vigencia', tipo: 'digitos8' },
  { col: 32, letra: 'AG', campo: 'prorroga' },
  ...Array.from({ length: 15 }, (_, i) => ({
    col: 33 + i, letra: XLSX.utils.encode_col(33 + i), campo: `principio_activo_${String(i + 1).padStart(2, '0')}`, ref: 'mdm_mt_activo',
  })),
  ...[0, 1, 2].map((i) => ({
    col: 48 + i, letra: XLSX.utils.encode_col(48 + i), campo: `gramaje_tipo_0${i + 1}`, ref: 'mdm_mt_gramaje_tipo',
  })),
  ...[0, 1, 2].map((i) => ({
    col: 51 + i, letra: XLSX.utils.encode_col(51 + i), campo: `gramaje_contenido_0${i + 1}`, tipo: 'numero',
  })),
  { col: 54, letra: 'BC', campo: 'num_piezas_por_unidad', tipo: 'entero' },
  { col: 55, letra: 'BD', campo: 'precio_farmacia', tipo: 'numero' },
  { col: 56, letra: 'BE', campo: 'precio_publico', tipo: 'numero' },
  { col: 57, letra: 'BF', campo: 'precio_lista', tipo: 'numero' },
  { col: 58, letra: 'BG', campo: 'precio_costo', tipo: 'numero' },
  { col: 59, letra: 'BH', campo: 'departamento', req: true, ref: 'mdm_d_dep' },
  { col: 60, letra: 'BI', campo: 'categoria', req: true, ref: 'mdm_d_cat' },
  { col: 61, letra: 'BJ', campo: 'subcategoria', ref: 'mdm_d_sub' },
  { col: 62, letra: 'BK', campo: 'descripcion_mercadologica', req: true },
  { col: 63, letra: 'BL', campo: 'beneficios', req: true },
  { col: 64, letra: 'BM', campo: 'keywords', req: true },
  // BN-CB (65-79): textos opcionales (indicación, contraindicación, leyendas, etc.)
  ...['indicacion_terapeutica', 'contraindicacion', 'leyendas_proteccion', 'prescripcion', 'advertencias',
    'interaccion_medicamentosa', 'reacciones_adversas', 'sobredosificacion', 'propiedad_farmaceutica',
    'dosis', 'via_administracion', 'clave_cnis', 'embarazo', 'lactancia', 'denominacion_generica',
  ].map((campo, i) => ({ col: 65 + i, letra: XLSX.utils.encode_col(65 + i), campo })),
  { col: 80, letra: 'CC', campo: 'linea_proveedor', req: true, ref: 'mdm_mt_linea_del_proveedor' },
  { col: 81, letra: 'CD', campo: 'marca_producto', req: true, ref: 'mdm_mt_marca_del_producto' },
];

// POST /api/materiales/validar-excel — réplica lecturaExcel (Alta)
router.post('/validar-excel', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ resultado: 'Error', informacion: 'No se recibio archivo.', registros: [], noRegistros: 0 });
    }
    const nombre = req.file.originalname || '';
    if (!nombre.toLowerCase().endsWith('.xlsx')) {
      return res.json({
        resultado: 'Error',
        informacion: 'NoEsExcel: Error con el archivo. Favor de subir un archivo con extencion ".XLSX"',
        registros: [],
        noRegistros: 0,
      });
    }

    const [eanMin, eanMax, MDM_Excel, formulario] = await Promise.all([
      config.get('validacion.excel.ean_min_digitos'),
      config.get('validacion.excel.ean_max_digitos'),
      cargarInclude('MDM_Excel'), // validadores desde Script Include
      prisma.formulario.findFirst({ where: { clave: 'mt_alta', modulo: 'materiales', activo: true } }),
    ]);
    // Reglas de columnas dinámicas: las define el builder (campo carga_excel.excelColumnas);
    // si no hay, se usa el set default de ServiceNow (COLUMNAS)
    const columnasActivas = formulario?.definicion?.campos?.carga_excel?.excelColumnas || COLUMNAS;
    const { esVacio, esNumero, esEntero, eanValido, esFecha8 } = MDM_Excel;
    const min = eanMin || 3;
    const max = eanMax || 16;

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    // Buscar la hoja de datos tolerando variantes (espacios, guiones, acentos, mayúsculas).
    // Si no existe "Info - Correcto", se usa la primera hoja con datos.
    const normaliza = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
    const hojaDatos = wb.SheetNames.find((n) => normaliza(n) === 'infocorrecto')
      || wb.SheetNames.find((n) => normaliza(n).startsWith('info'))
      || wb.SheetNames[0];
    const ws = wb.Sheets[hojaDatos];
    if (!ws) {
      return res.json({
        resultado: 'Error',
        informacion: `No se encontro la hoja de datos ("Info - Correcto"). Hojas presentes: ${wb.SheetNames.join(', ')}. Usa el layout oficial de Alta (KEY).`,
        registros: [],
        noRegistros: 0,
      });
    }

    // Datos desde la fila 5 (idx 4) — filas 1-4 son encabezados/tipos
    const filas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(4)
      .map((row, i) => ({ row, linea: i + 5 }))
      .filter(({ row }) => row.some((c) => !esVacio(c)));

    if (filas.length === 0) {
      return res.json({ resultado: 'Error', informacion: `El archivo no tiene registros (hoja "${hojaDatos}", los datos inician en la fila 5).`, registros: [], noRegistros: 0 });
    }

    const errores = [];
    const lineas = []; // desglose por línea (estilo SN: cada fila con sus errores)
    const eansVistos = { PI: new Map(), EMP: new Map(), SUB: new Map() };
    const registros = [];

    for (const { row, linea } of filas) {
      const erroresAntes = errores.length;
      const datos = {};
      for (const spec of columnasActivas) {
        const valor = norm(row[spec.col]);
        datos[spec.campo] = valor;
        const celda = `"${spec.letra}${linea}"`;

        // Condicional por grupo (SUB: requerido si P trae valor)
        const grupoValor = spec.grupo ? norm(row[columnasActivas.find((c) => c.letra === spec.grupo)?.col]) : '';
        const requerido = spec.req || (spec.grupo && !esVacio(grupoValor));

        if (esVacio(valor)) {
          if (requerido) {
            errores.push(spec.grupo
              ? `${celda} Campo vacio, es necesario para columna "${spec.grupo}${linea}".`
              : `${celda} Campo vacio.`);
          }
          continue;
        }
        if (spec.tipo === 'numero' && !esNumero(valor)) errores.push(`${celda} Debe se numero.`);
        if (spec.tipo === 'entero' && !esEntero(valor)) errores.push(`${celda} Debe se un numero entero.`);
        if (spec.tipo === 'digitos8' && !esFecha8(valor)) errores.push(`${celda} Debe ser numero entero de 8 digitos (AñoMesDia).`);
        if (spec.tipo === 'ean') {
          if (!eanValido({ valor, min, max })) {
            errores.push(`${celda} EAN invalido (entero de ${min} a ${max} digitos).`);
          } else {
            const vistos = eansVistos[spec.unico];
            if (vistos.has(valor)) errores.push(`${celda} EAN duplicado (ya usado en la linea ${vistos.get(valor)}).`);
            else vistos.set(valor, linea);
          }
        }
        if (spec.ref && !existeOpcion(spec.ref, valor)) {
          errores.push(`${celda} La opcion NO fue encontrado en el listado.`);
        }

        // Script de validación por columna (estilo SN: validarUnicoEAN, MKT_valida_existencia…)
        // return string = mensaje de error · return false = "Valor invalido" · true/undefined = OK
        if (spec.script) {
          try {
            const { resultado } = await runScript(spec.script, {
              valor, fila: row, datos, linea, celda,
              catalogos: catalogosSN,
              jerarquia,
              prisma,
              fetch,
              callScriptInclude,
            });
            if (typeof resultado === 'string' && resultado) errores.push(`${celda} ${resultado}`);
            else if (resultado === false) errores.push(`${celda} Valor invalido (script).`);
          } catch (err) {
            errores.push(`${celda} Error en script de validación: ${err.message}`);
          }
        }
      }

      // validarDepCatSub: categoría debe pertenecer al departamento, sub a dep+cat
      if (!esVacio(datos.categoria) && jerarquia.catPorDep[datos.departamento]
        && !jerarquia.catPorDep[datos.departamento].includes(datos.categoria)) {
        errores.push(`"BI${linea}" Categoria no pertenece al Departamento.`);
      }
      if (!esVacio(datos.subcategoria)) {
        const subsDeCat = jerarquia.subPorCat[datos.categoria] || [];
        if (subsDeCat.length && !subsDeCat.includes(datos.subcategoria)) {
          errores.push(`"BJ${linea}" Subcategoria no pertenece a la Categoria.`);
        }
      }

      lineas.push({ linea, errores: errores.slice(erroresAntes), nombre: datos.nombre || null });
      registros.push({
        vs_nombre_completo_del_material: datos.nombre,
        vs_unidad_del_producto_id_pi: datos.pi_ean,
        vs_unidad_del_producto_id_emp: datos.emp_ean,
        vs_unidad_del_producto_id_sub: datos.sub_ean,
        _razonSocial: datos.razonSocial,
        _rfc: datos.rfc,
        _datos: datos,
      });
    }

    const resultado = errores.length === 0 ? 'Correcto' : 'Error';
    return res.json({
      resultado,
      informacion: errores.length === 0
        ? `Archivo valido. ${registros.length} material(es) listos para capturar archivos.`
        : errores.join('\n'),
      registros,
      lineas,
      noRegistros: registros.length,
    });
  } catch (err) {
    console.error('[Materiales] Error validando Excel:', err);
    return res.status(500).json({ resultado: 'Error', informacion: `Error procesando archivo: ${err.message}`, registros: [], noRegistros: 0 });
  }
});

// GET /api/materiales/catalogos-opciones?clave=mdm_mt_tipo — opciones de los catálogos SN
router.get('/catalogos-opciones', (req, res) => {
  const { clave } = req.query;
  if (clave) return res.json(catalogosSN[clave] || []);
  res.json(Object.keys(catalogosSN));
});

module.exports = router;
module.exports.COLUMNAS_DEFAULT = COLUMNAS;
