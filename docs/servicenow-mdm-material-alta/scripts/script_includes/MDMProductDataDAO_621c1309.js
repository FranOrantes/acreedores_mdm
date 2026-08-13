// Script Include: MDMProductDataDAO
// sys_id: 621c1309ff9122104130ffffffffff72 | activo: true | updated: 20-05-2025 01:31:02
// description: DAO class for mdm_product_data table

var MDMProductDataDAO = Class.create();
MDMProductDataDAO.prototype = {
    initialize: function() {
        this.TABLE_NAME = 'mdm_product_data';
        this.CONFIG_TYPE = 'config_type';
        this.PRODUCT_CODE = 'product_code';
        this.DATA = 'data';
        this._cacheManager = new LicensingCacheManager();
        this._cacheDataHandler = new CacheDataHandler();
        // Contains the list of columns that are part of cache object.
        this._cacheColumnList = [
            this.PRODUCT_CODE,
            this.DATA
        ];
        this._cacheRefColumnList = [];
        this.logger = new LoggingUtil();
    },

    insertOrUpdateRecord: function(configData) {
        const configType = configData.config_type;
        const productCode = configData.product_code;
        const data = JSON.stringify(configData.data);

        var gr = new GlideRecord(this.TABLE_NAME);
        gr.addQuery(this.PRODUCT_CODE, productCode);
        gr.query();
        if (gr.next()) {
            gr.setValue(this.DATA, data);
            gr.setValue(this.CONFIG_TYPE, configType);
            return gr.update();
        } else {
            gr.initialize();
            gr.setValue(this.DATA, data);
            gr.setValue(this.CONFIG_TYPE, configType);
            gr.setValue(this.PRODUCT_CODE, productCode);
            return gr.insert();
        }
    },

    loadGlobalConfigDataIntoCache: function() {
        let globalConfigDataObj = new Map();
        const gr = new GlideRecord(this.TABLE_NAME);
        gr.query();
        globalConfigDataObj = this._cacheDataHandler.prepareCacheData(gr, globalConfigDataObj, this.CONFIG_TYPE, this._cacheColumnList, this._cacheRefColumnList);
        this._cacheManager.putDataIntoCache(LicensingEngineConstants.LICENSING_CACHE_CATALOG, LicensingEngineConstants.GLOBAL_CONFIG_DATA_CACHE, globalConfigDataObj);
    },

    loadAllDataIntoCache: function() {
        this.loadGlobalConfigDataIntoCache();
    },

    /**
     * Deletes products from mdm_product_table which are not part of the payload
     */
    cleanOrphanMDMProducts: function(productsReceived) {
        var gr = new GlideRecord(this.TABLE_NAME);
        gr.addQuery(this.PRODUCT_CODE, 'NOT IN', productsReceived);
        gr.query();

        while (gr.next()) {
            if (gr.deleteRecord())
                this.logger.logInfo(this.type, "cleanOrphanMDMProducts", "Deleted Record from MDM product data table since " + gr.product_code + " was removed.");
        }
    },

    type: 'MDMProductDataDAO'
};