// Script Include: CIMDMetadataHelper
// sys_id: a1b2c3d4e5f6789012345678901239ab | activo: true | updated: 21-01-2026 03:01:41
// description: Helper class for fetching CIMD metadata and creating oauth_entity_cimd records

var CIMDMetadataHelper = Class.create();
CIMDMetadataHelper.prototype = {
    
    initialize: function() {
    },
	
	validateClientIdUniqueness: function(current) {
		var result = { 
			success: true 
		};
		
		var gr = new GlideRecord('oauth_entity');
		gr.addQuery('type', 'client');
		gr.addQuery('client_id', current.client_id);
		gr.addQuery('sys_id', '!=', current.sys_id);
		gr.query();
		
		if (gr.hasNext()) {
			result.success = false;
			result.error_msg = gs.getMessage('An OAuth entity with this Client ID already exists');
		}
		
		return result;
	},

	validateRedirectUrlForLocalhost: function(current) {
		var result = { success: true };
		
		var status = current.getValue('status') || '';
		if (status !== 'manual') {
			return result;
		}
		
		var redirectUrl = current.getValue('redirect_url') || '';
		var localhostAllowed = global.JSUtil.getBooleanValue(current, 'localhost_redirection_allowed');
		
		if (!redirectUrl || localhostAllowed) {
			return result;
		}
		
		var uris = redirectUrl.split(',');
		for (var i = 0; i < uris.length; i++) {
			var uri = uris[i].trim().toLowerCase();
			if (uri && (uri.indexOf('localhost') >= 0 || uri.indexOf('127.0.0.1') >= 0 || uri.indexOf('::1') >= 0)) {
				result.success = false;
				result.error_msg = gs.getMessage('Redirect URL cannot use localhost unless localhost redirection is allowed');
				return result;
			}
		}
		
		return result;
	},

    fetchCIMDMetadata: function(metadataUrl) {
        var result = {
            success: false
        };
        
        if (!metadataUrl || metadataUrl.trim() === '') {
            result.error_msg = gs.getMessage("Metadata URL is required");
            return result;
        }
        
        try {
            var cimdClient = new sn_auth.GlideCIMDOAuthClient();
            var response = cimdClient.getCIMDClientMetadata(metadataUrl);
            
            var statusCode = response.getResponseCode();
            var responseBody = response.getBody();
            
            if (statusCode == 200) {
                var jsonResponse = JSON.parse(responseBody);
                
                if (jsonResponse.status === "success" && jsonResponse.metadata) {
                    result.metadata = jsonResponse.metadata;
                    result.success = true;
                } else {
                    result.error_msg = gs.getMessage("Unexpected response format from CIMD metadata service");
                }
            } else {
                try {
                    var errorResponse = JSON.parse(responseBody);
                    result.error_msg = errorResponse.message || gs.getMessage("Failed to fetch CIMD metadata");
                } catch (parseError) {
                    result.error_msg = gs.getMessage("Failed to fetch CIMD metadata");
                }
            }
            
        } catch (e) {
            result.error_msg = gs.getMessage("Error fetching CIMD metadata: {0}", e.message);
        }
        
        return result;
    },
    
    createCIMDEntity: function(inputJson) {
        var result = {
            success: false
        };
        
        if (!inputJson || inputJson.trim() === '') {
            result.error_msg = gs.getMessage("Input JSON is required");
            return result;
        }
        
        try {
            var parsedInput = JSON.parse(inputJson);
            
            if (!parsedInput.client_id) {
                result.error_msg = gs.getMessage("client_id is required");
                return result;
            }
            
            if (!parsedInput.status || (parsedInput.status !== 'live' && parsedInput.status !== 'manual')) {
                result.error_msg = gs.getMessage("status must be 'live' or 'manual'");
                return result;
            }
            
            if (parsedInput.name) {
                var gr = new GlideRecordSecure('oauth_entity');
                gr.addQuery('name', parsedInput.name);
                gr.query();
                if (gr.next()) {
                    result.error_msg = gs.getMessage("An OAuth entity with name '{0}' already exists", parsedInput.name);
                    return result;
                }
            }
            
            var cimdClient = new sn_auth.GlideCIMDOAuthClient();
            var response = cimdClient.registerCIMDClient(inputJson);
            var statusCode = response.getResponseCode();
            var responseBody = response.getBody();
            
            if (statusCode == 201) {
                var jsonResponse = JSON.parse(responseBody);
                if (jsonResponse.cimd_entity_sys_id) {
                    result.sys_id = jsonResponse.cimd_entity_sys_id;
                }
                result.success = true;
            } else {
                try {
                    var errorResponse = JSON.parse(responseBody);
                    result.error_msg = errorResponse.message || gs.getMessage("Failed to create CIMD entity");
                } catch (parseError) {
                    result.error_msg = gs.getMessage("Failed to create CIMD entity");
                }
            }
            
        } catch (e) {
            result.error_msg = gs.getMessage("Error creating CIMD entity: {0}", e.message);
        }
        
        return result;
    },
    
    updateCIMDEntity: function(inputJson) {
        var result = {
            success: false,
            error_msg: null
        };
        
        if (!inputJson || inputJson.trim() === '') {
            result.error_msg = gs.getMessage("Input JSON is required");
            return result;
        }
        
        try {
            var parsedInput = JSON.parse(inputJson);
            
            if (!parsedInput.client_id) {
                result.error_msg = gs.getMessage("client_id is required");
                return result;
            }
            
            if (!parsedInput.sys_id) {
                result.error_msg = gs.getMessage("sys_id is required for update");
                return result;
            }

            if (parsedInput.name) {
                var gr = new GlideRecordSecure('oauth_entity');
                gr.addQuery('name', parsedInput.name);
                gr.addQuery('sys_id', '!=', parsedInput.sys_id);
                gr.query();
                if (gr.next()) {
                    result.error_msg = gs.getMessage("An OAuth entity with name '{0}' already exists", parsedInput.name);
                    return result;
                }
            }
            
            var cimdClient = new sn_auth.GlideCIMDOAuthClient();
            var response = cimdClient.updateCIMDClient(inputJson);
            var statusCode = response.getResponseCode();
            var responseBody = response.getBody();
            
            if (statusCode == 200) {
                var jsonResponse = JSON.parse(responseBody);
                result.success = true;
            } else {
                try {
                    var errorResponse = JSON.parse(responseBody);
                    result.error_msg = errorResponse.message || gs.getMessage("Failed to update CIMD entity");
                } catch (parseError) {
                    result.error_msg = gs.getMessage("Failed to update CIMD entity");
                }
            }
            
        } catch (e) {
            result.error_msg = gs.getMessage("Error updating CIMD entity: {0}", e.message);
        }
        
        return result;
    },
    
    type: 'CIMDMetadataHelper'
};