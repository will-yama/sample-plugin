jQuery.noConflict();

(function($, PLUGIN_ID) {
    'use strict';

    // Get plug-in configuration settings
    var CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);
    if (!CONFIG) {
        return false;
    }

    var events = [
        'app.record.create.change.' + CONFIG.beforeExchange,
        'app.record.edit.change.' + CONFIG.beforeExchange,
        'app.record.create.change.' + CONFIG.date,
        'app.record.edit.change.' + CONFIG.date
    ];

    kintone.events.on(events, function(event) {
        var record = event.record;
        var dtVal = record[CONFIG.date].value;
        var bfrExchangeVal = record[CONFIG.beforeExchange].value;
        var dtisFuture = moment(dtVal).isAfter(moment());
        // validate date field and exchanged filed
        if ((!dtVal || dtisFuture) && !bfrExchangeVal) {
            record[CONFIG.date].error = 'The date value is invalid';
            record[CONFIG.beforeExchange].error = 'The exchanged value is empty';
            return event;
        } else if (!dtVal || dtisFuture) {
            record[CONFIG.date].error = 'The date value is invalid';
            record[CONFIG.beforeExchange].error = null;
            return event;
        } else if (!bfrExchangeVal) {
            record[CONFIG.beforeExchange].error = 'The exchanged value is empty';
            record[CONFIG.date].error = null;
            return event;
        }

        var requestURL = 'http://www.apilayer.net/api/historical';
        requestURL += '?date=' + dtVal;
        kintone.plugin.app.proxy(PLUGIN_ID, requestURL, 'GET', {}, {}).then(function(resp) {
            if (!JSON.parse(resp[0]).success) {
                return Promise.reject(new Error(JSON.parse(resp[0]).error.info));
            }
            var rate = bfrExchangeVal * JSON.parse(resp[0]).quotes['USD' + CONFIG.currencies];
            record[CONFIG.beforeExchange].error = null;
            record[CONFIG.date].error = null;
            record[CONFIG.afterExchange].value = rate;
            var setRecord = {record};
            kintone.app.record.set(setRecord);
        }).catch(function(err) {
            console.log(err);
            alert('error');
        });

    });

})(jQuery, kintone.$PLUGIN_ID);
