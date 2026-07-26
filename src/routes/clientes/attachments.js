const { Router } = require('express');
const axios = require('axios');

const router = Router();

const SERVICENOW_BASE_URL = process.env.SERVICENOW_BASE_URL || '';
const SERVICENOW_USER = process.env.SERVICENOW_USER || '';
const SERVICENOW_PASSWORD = process.env.SERVICENOW_PASSWORD || '';

/**
 * GET /api/clientes/attachments/:sysId/file
 * Proxy to download/view a file from ServiceNow Attachment API.
 * Streams the file directly to the client without loading it fully in memory.
 */
router.get('/:sysId/file', async (req, res) => {
  const { sysId } = req.params;
  const download = req.query.download === 'true';

  try {
    // TODO: Replace with actual ServiceNow attachment URL pattern
    const url = `${SERVICENOW_BASE_URL}/api/now/attachment/${sysId}/file`;

    const response = await axios.get(url, {
      auth: {
        username: SERVICENOW_USER,
        password: SERVICENOW_PASSWORD,
      },
      responseType: 'stream',
    });

    // Forward content headers from ServiceNow
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const contentLength = response.headers['content-length'];
    const fileName = response.headers['content-disposition']
      ? response.headers['content-disposition']
      : null;

    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    if (download || fileName) {
      // Force download
      res.setHeader('Content-Disposition', fileName || `attachment; filename="${sysId}"`);
    } else {
      // Inline display (for PDFs, images in browser)
      res.setHeader('Content-Disposition', 'inline');
    }

    // Stream the file to the client
    response.data.pipe(res);
  } catch (err) {
    console.error('[Clientes/Attachments] Error proxying file:', err.message);
    if (err.response?.status === 404) {
      return res.status(404).json({ error: 'Archivo no encontrado en ServiceNow' });
    }
    res.status(500).json({ error: 'Error al obtener archivo de ServiceNow' });
  }
});

/**
 * GET /api/clientes/attachments/:sysId/meta
 * Get attachment metadata from ServiceNow (optional, if needed separately)
 */
router.get('/:sysId/meta', async (req, res) => {
  const { sysId } = req.params;

  try {
    // TODO: Replace with actual ServiceNow endpoint
    const url = `${SERVICENOW_BASE_URL}/api/now/attachment/${sysId}`;

    const response = await axios.get(url, {
      auth: {
        username: SERVICENOW_USER,
        password: SERVICENOW_PASSWORD,
      },
      headers: { 'Accept': 'application/json' },
    });

    res.json(response.data.result);
  } catch (err) {
    console.error('[Clientes/Attachments] Error fetching metadata:', err.message);
    res.status(500).json({ error: 'Error al obtener metadata del archivo' });
  }
});

module.exports = router;
