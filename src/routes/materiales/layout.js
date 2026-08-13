const { Router } = require('express');
const XLSX = require('xlsx');

const router = Router();

// Réplica de jj_MDM_Utils_Client.createExcelFile() — layout de 9 hojas SAP.
// Cada hoja: fila 1 = números de columna, fila 2 = tabla SAP, fila 3 = campo SAP, fila 4 = etiqueta.
const HOJAS = {
  DatosBasicos: {
    tabla: 'MARA',
    campos: ['ID_CARGA', 'BISMT', 'MATNR', 'MTART', 'MBRSH', 'MATKL', 'MEINS', 'GROES', 'NTGEW', 'GEWEI', 'TEMPB', 'TRAGR', 'SPART', 'PRDHA', 'CADKZ', 'XCHPF', 'EXTWG', 'MSTAE', 'MSTAV', 'MSTDE', 'MSTDV', 'MHDRZ', 'MHDLP', 'NRFHG', 'MFRNR', 'IPRKZ', 'RDMHD', 'MTPOS_MARA', 'SLED_BBD', 'WHSTC', 'HNDLCODE', 'QGRP', 'SPRAS', 'MAKTX', 'LABOR'],
    tablas: ['', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MARA', 'MAKT', 'MAKT', 'MARA'],
    etiquetas: ['', 'NºMat Ant.', 'Material', 'TpMat', 'Ramo', 'Gpo.artíc.', 'Unidad', 'Tamaño', 'Neto', 'Unidad', 'Cond-temp', 'GrTransp.', 'Sector', 'Jquía.productos', 'Ind.CAD', 'SujetLote', 'GrpArtExt', 'StatusMat', 'Status', 'Válido de', 'Validez de', 'TmpoHastaCaduc', 'DurTotalConserv', 'SusBonifEs', 'Fabricante', 'Ind.período', 'Regla redondeo', 'GrPosGral', 'FeCad/FeEx', 'Cond.almacenam.', 'Ind.manipul.', 'Gr.ctrl.calidad', 'Idioma', 'Denomin.', 'Labor oficina'],
  },
  UnidadesAlter: {
    tabla: 'MARM',
    campos: ['ID_CARGA', 'MEINH', 'UMREZ', 'UMREN', 'EAN11', 'NUMTP', 'LAENG', 'BREIT', 'HOEHE', 'MEABM', 'VOLUM', 'VOLEH', 'BRGEW', 'GEWEI'],
    etiquetas: ['', 'UM alt.', 'Contador', 'Denominador', 'Código EAN/UPC', 'Tipo EAN', 'Longitud', 'Ancho', 'Altura', 'Unidad', 'Volumen', 'Unidad volumen', 'Peso bruto', 'Unidad de peso'],
  },
  TaxClassif: {
    tabla: 'MLAN',
    campos: ['ID_CARGA', 'TAXM1', 'TAXM2'],
    etiquetas: ['', 'Clasific.fiscal', 'Clasific.fiscal'],
  },
  Planta: {
    tabla: 'MARC',
    campos: ['ID_CARGA', 'WERKS', 'MMSTA', 'MMSTD', 'MAABC', 'EKGRP', 'DISMM', 'DISPO', 'PLIFZ', 'PERKZ', 'DISLS', 'BESKZ', 'SOBSL', 'MINBE', 'BSTMI', 'MABST', 'FHORI', 'LADGR', 'MTVFP', 'KAUTB', 'PRCTR', 'VRMOD', 'VINT1', 'VINT2', 'DISGR', 'QMATV', 'ABCIN', 'SERNP', 'STRGR', 'LGFSB', 'SHZET', 'LOGGR', 'VSPVB', 'SCM_STRA1', 'XCHPF'],
    etiquetas: ['', 'Centro', 'StatusMat', 'Válido de', 'ABC', 'Gr.compras', 'Caract.', 'Plan.nec.', 'PlazoEntr', 'Ind-period', 'Tam.lote', 'ClAprov', 'ClAprovEsp', 'Pto.pedido', 'TamLoteMín', 'StockMáx', 'Cv-horiz.', 'GrupoCarga', 'VerifDisp', 'InPedAut', 'CeBe', 'ModComp', 'CompAtrás', 'CompAdel.', 'GrPlanNec', 'ParamInsp', 'InvCícl', 'Perfil', 'GrupoEstrategs.', 'Alm.Apr.Ex', 'MargenSeg.', 'GrTratLog', 'ASP prop.', 'Estrategia nec.', 'SujetLote Centro'],
  },
  Almacen: {
    tabla: 'MARD',
    campos: ['ID_CARGA', 'WERKS', 'LGORT'],
    etiquetas: ['', 'Centro', 'Almacén'],
  },
  Valoracion: {
    tabla: 'MBEW',
    campos: ['ID_CARGA', 'BWKEY', 'BWTAR', 'VPRSV', 'BKLAS'],
    etiquetas: ['', '', '', '', ''],
  },
  Ventas: {
    tabla: 'MVKE',
    campos: ['ID_CARGA', 'VKORG', 'VTWEG', 'VERSG', 'SKTOF', 'VMSTA', 'VMSTD', 'MTPOS', 'PRODH', 'KTGRM', 'MVGR1', 'MVGR2', 'MVGR4', 'MVGR5', 'PRAT2', 'PRAT6', 'RDPRF', 'MVGR3'],
    etiquetas: ['', 'Org.Ventas', 'Can.distr.', 'Gr.est.mat', 'Dto.p.p.', 'Status', 'Validez de', 'Gr.tp.Pos.', 'JquíaProd', 'Gr.Imp.Mat', 'Gr.mater.1', 'Gr.mater.2', 'Gr.mater.4', 'Gr.mater.5', 'Atr.prod.2', 'Atr.prod.6', 'PerfRedond', 'Gr.mater.3'],
  },
  Caracteristicas: {
    tabla: 'BAPI1003_KEY',
    campos: ['ID_CARGA', 'OBTAB', 'CLASSTYPE', 'CLASSNUM', 'ALLOC', 'ATNAM', 'ATWRT', 'DELETE'],
    tablas: ['', 'BAPI1003_KEY', 'BAPI1003_KEY', 'BAPI1003_KEY', '', 'AUSP', 'AUSP', 'AUSP'],
    etiquetas: ['', 'Nombre de  tabla ', 'N° de clase', 'Categoría de la clase', 'Tipo tabla NUM,Char,Curr', 'Nom. Caract.', 'Val. Caract.', ''],
  },
  Calidad: {
    tabla: 'QMAT',
    campos: ['ID_CARGA', 'ART', 'AKTIV', 'DELE'],
    etiquetas: ['', 'Clase de inspección', 'Activa', 'borrar'],
  },
};

// GET /api/materiales/layout — descarga el layout XLSX (réplica del de ServiceNow)
router.get('/layout', (req, res) => {
  const wb = XLSX.utils.book_new();

  for (const [nombre, def] of Object.entries(HOJAS)) {
    const nums = def.campos.map((_, i) => String(i + 1));
    const tablas = def.tablas || def.campos.map((c) => (c === 'ID_CARGA' ? '' : def.tabla));
    const aoa = [nums, tablas, def.campos, def.etiquetas];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = def.campos.map(() => ({ wch: 14 }));
    XLSX.utils.book_append_sheet(wb, ws, nombre);
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="Layout_MDM_Material_Alta.xlsx"');
  res.send(buffer);
});

module.exports = router;
