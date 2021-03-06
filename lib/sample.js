/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Track the trade of a commodity from one trader to another
 * @param {org.acme.mynetwork.Trade} trade - the trade to be processed
 * @transaction
 */
function tradeCommodity(trade) {
    
    // set the new owner of the commodity
    trade.commodity.owner = trade.newOwner;
    return getAssetRegistry('org.acme.mynetwork.Commodity')
        .then(function (assetRegistry) {

            // emit a notification that a trade has occurred
            var tradeNotification = getFactory().newEvent('org.acme.mynetwork', 'TradeNotification');
            tradeNotification.commodity = trade.commodity;
            emit(tradeNotification);

            // persist the state of the commodity
            return assetRegistry.update(trade.commodity);
        });
}
/**
 * Track the trade of a myAsset from one trader to another
 * @param {org.acme.mynetwork.TradeMyAsset} tradeMyAsset - the trade to be processed
 * @transaction
 */
function tradeMyAsset(tradeMyAsset) {
    
    // set the new owner of the myAsset
    tradeMyAsset.myAsset.owner = tradeMyAsset.newOwner;
    return getAssetRegistry('org.acme.mynetwork.MyAsset')
        .then(function (assetRegistry) {

            // emit a notification that a tradeMyAsset has occurred
            var tradeMyAssetNotification = getFactory().newEvent('org.acme.mynetwork', 'TradeMyAssetNotification');
            tradeMyAssetNotification.myAsset = tradeMyAsset.myAsset;
            emit(tradeMyAssetNotification);

            // persist the state of the myAsset
            return assetRegistry.update(tradeMyAsset.myAsset);
        });
}
/**
 * Remove all high volume commodities
 * @param {org.acme.mynetwork.RemoveHighQuantityCommodities} remove - the remove to be processed
 * @transaction
 */
function removeHighQuantityCommodities(remove) {

    return getAssetRegistry('org.acme.mynetwork.Commodity')
        .then(function (assetRegistry) {
            return query('selectCommoditiesWithHighQuantity')
                .then(function (results) {

                    var promises = [];

                    for (var n = 0; n < results.length; n++) {
                        var trade = results[n];

                        // emit a notification that a trade was removed
                        var removeNotification = getFactory().newEvent('org.acme.mynetwork', 'RemoveNotification');
                        removeNotification.commodity = trade;
                        emit(removeNotification);

                        // remove the commodity
                        promises.push(assetRegistry.remove(trade));
                    }

                    // we have to return all the promises
                    return Promise.all(promises);
                });
        });
}
/**
 * Remove all high volume myAssets
 * @param {org.acme.mynetwork.RemoveHighQuantityMyAssets} removeMyAssets - the removeMyAssets to be processed 
 * @transaction
 */
function removeHighQuantityMyAssets(removeMyAssets) {
    console.log("just stepped into the removeHighQuantityMyAssets(removeMyAssets) ");
    return getAssetRegistry('org.acme.mynetwork.MyAsset')
        .then(function (assetRegistry) {
            return query('selectMyAssetsWithHighQuantity')
                .then(function (results) {

                    var promises = [];

                    for (var n = 0; n < results.length; n++) {
                        var tradeMyAsset = results[n];

                        // emit a notification that a tradeMyAsset was removed
                        var removeNotificationMyAsset = getFactory().newEvent('org.acme.mynetwork', 'RemoveNotificationMyAsset');
                        console.log("before doing: removeNotificationMyAsset.myAsset = tradeMyAsset;");
                        removeNotificationMyAsset.myAsset = tradeMyAsset;
                        console.log("afetr doing this removeNotificationMyAsset.myAsset = tradeMyAsset;");
                        emit(removeNotificationMyAsset);

                        // remove the myAsset
                        //this remove() is a method of assetRegistry
                        promises.push(assetRegistry.remove(tradeMyAsset));
                    }

                    // we have to return all the promises
                    return Promise.all(promises);
                });
        });
}