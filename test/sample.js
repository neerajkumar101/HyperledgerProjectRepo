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

'use strict';

const AdminConnection = require('composer-admin').AdminConnection;
const BrowserFS = require('browserfs/dist/node/index');
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const BusinessNetworkDefinition = require('composer-common').BusinessNetworkDefinition;
const path = require('path');

require('chai').should();

const bfs_fs = BrowserFS.BFSRequire('fs');
const NS = 'org.acme.mynetwork';

describe('Commodity Trading', () => {

    // let adminConnection;
    let businessNetworkConnection;

    before(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type: 'embedded'
        })
            .then(() => {
                return adminConnection.connect('defaultProfile', 'admin', 'adminpw');
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
            })
            .then((businessNetworkDefinition) => {
                return adminConnection.deploy(businessNetworkDefinition);
            })
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                return businessNetworkConnection.connect('defaultProfile', 'my-network', 'admin', 'adminpw');
            });
    });

    describe('#tradeCommodity', () => {

        it('should be able to trade a commodity', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the traders
            const dan = factory.newResource(NS, 'Trader', 'dan@email.com');
            dan.firstName = 'Dan';
            dan.lastName = 'Selman';

            const simon = factory.newResource(NS, 'Trader', 'simon@email.com');
            simon.firstName = 'Simon';
            simon.lastName = 'Stone';

            // create the commodity
            const commodity = factory.newResource(NS, 'Commodity', 'EMA');
            commodity.description = 'Corn';
            commodity.mainExchange = 'Euronext';
            commodity.quantity = 100;
            commodity.owner = factory.newRelationship(NS, 'Trader', dan.$identifier);

            // create the trade transaction
            const trade = factory.newTransaction(NS, 'Trade');
            trade.newOwner = factory.newRelationship(NS, 'Trader', simon.$identifier);
            trade.commodity = factory.newRelationship(NS, 'Commodity', commodity.$identifier);

            // the owner should of the commodity should be dan
            commodity.owner.$identifier.should.equal(dan.$identifier);

            // create the second commodity
            const commodity2 = factory.newResource(NS, 'Commodity', 'XYZ');
            commodity2.description = 'Soya';
            commodity2.mainExchange = 'Chicago';
            commodity2.quantity = 50;
            commodity2.owner = factory.newRelationship(NS, 'Trader', dan.$identifier);

            // register for events from the business network
            businessNetworkConnection.on('event', (event) => {
                console.log( 'Received event: ' + event.getFullyQualifiedIdentifier() + ' for commodity ' + event.commodity.getIdentifier() );
            });

            // Get the asset registry.
            return businessNetworkConnection.getAssetRegistry(NS + '.Commodity')
                .then((assetRegistry) => {

                    // add the commodities to the asset registry.
                    return assetRegistry.addAll([commodity,commodity2])
                        .then(() => {
                            return businessNetworkConnection.getParticipantRegistry(NS + '.Trader');
                        })
                        .then((participantRegistry) => {
                            // add the traders
                            return participantRegistry.addAll([dan, simon]);
                        })
                        .then(() => {
                            // submit the transaction
                            return businessNetworkConnection.submitTransaction(trade);
                        })
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.Commodity');
                        })
                        .then((assetRegistry) => {
                            // re-get the commodity
                            return assetRegistry.get(commodity.$identifier);
                        })
                        .then((newCommodity) => {
                            // the owner of the commodity should now be simon
                            newCommodity.owner.$identifier.should.equal(simon.$identifier);
                        })
                        .then(() => {
                            // use a query
                            return businessNetworkConnection.query('selectCommoditiesByExchange', {exchange : 'Euronext'});
                        })
                        .then((results) => {
                            // check results
                            results.length.should.equal(1);
                            results[0].getIdentifier().should.equal('EMA');
                        })
                        .then(() => {
                            // use another query
                            return businessNetworkConnection.query('selectCommoditiesByOwner', {owner : 'resource:' + simon.getFullyQualifiedIdentifier()});
                        })
                        .then((results) => {
                            //  check results
                            results.length.should.equal(1);
                            results[0].getIdentifier().should.equal('EMA');
                        })
                        .then(() => {
                            // submit the remove transaction
                            const remove = factory.newTransaction(NS, 'RemoveHighQuantityCommodities');
                            return businessNetworkConnection.submitTransaction(remove);
                        })
                        .then(() => {
                            // use a query
                            return businessNetworkConnection.query('selectCommodities');
                        })
                        .then((results) => {
                            // check results, should only have 1 commodity left
                            results.length.should.equal(1);
                            results[0].getIdentifier().should.equal('XYZ');
                        });
                });
        });
    });
});

describe('MyAsset Trading', () => {
    // let adminConnection;
    let businessNetworkConnection;

    before(() => {
        BrowserFS.initialize(new BrowserFS.FileSystem.InMemory());
        const adminConnection = new AdminConnection({ fs: bfs_fs });
        return adminConnection.createProfile('defaultProfile', {
            type: 'embedded'
        })
            .then(() => {
                return adminConnection.connect('defaultProfile', 'admin', 'adminpw');
            })
            .then(() => {
                return BusinessNetworkDefinition.fromDirectory(path.resolve(__dirname, '..'));
            })
            .then((businessNetworkDefinition) => {
                return adminConnection.deploy(businessNetworkDefinition);
            })
            .then(() => {
                businessNetworkConnection = new BusinessNetworkConnection({ fs: bfs_fs });
                return businessNetworkConnection.connect('defaultProfile', 'my-network', 'admin', 'adminpw');
            });
    });

    describe('#tradeMyAsset', () => {
        it('should be able to trade a myAsset', () => {
            const factory = businessNetworkConnection.getBusinessNetwork().getFactory();

            // create the traders
            const dan = factory.newResource(NS, 'Trader', 'dan@email.com');
            dan.firstName = 'Dan';
            dan.lastName = 'Selman';

            const simon = factory.newResource(NS, 'Trader', 'simon@email.com');
            simon.firstName = 'Simon';
            simon.lastName = 'Stone';

            // create the myAsset
            const myAsset = factory.newResource(NS, 'MyAsset', 'EMA');
            myAsset.description = 'Corn';
            myAsset.motoOfExchange = 'Euronext';
            myAsset.quantity = 100;
            myAsset.owner = factory.newRelationship(NS, 'Trader', dan.$identifier);

            // create the trade transaction
            const trade = factory.newTransaction(NS, 'TradeMyAsset');
            trade.newOwner = factory.newRelationship(NS, 'Trader', simon.$identifier);
            trade.myAsset = factory.newRelationship(NS, 'MyAsset', myAsset.$identifier);

            // the owner should of the myAsset should be dan
            myAsset.owner.$identifier.should.equal(dan.$identifier);

            // create the second myAsset
            const myAsset2 = factory.newResource(NS, 'MyAsset', 'XYZ');
            myAsset2.description = 'Soya';
            myAsset2.motoOfExchange = 'Chicago';
            myAsset2.quantity = 50;
            myAsset2.owner = factory.newRelationship(NS, 'Trader', dan.$identifier);

            // register for events from the business network
            businessNetworkConnection.on('event', (event) => {
                console.log( 'Received event: ' + event.getFullyQualifiedIdentifier() + ' for myAsset ' + event.myAsset.getIdentifier() );
            });

            // Get the asset registry.
            return businessNetworkConnection.getAssetRegistry(NS + '.MyAsset')
                .then((assetRegistry) => {

                    // add the myAssets to the asset registry.
                    return assetRegistry.addAll([myAsset,myAsset2])
                        .then(() => {
                            return businessNetworkConnection.getParticipantRegistry(NS + '.Trader');
                        })
                        .then((participantRegistry) => {
                            // add the traders
                            return participantRegistry.addAll([dan, simon]);
                        })
                        .then(() => {
                            // submit the transaction
                            return businessNetworkConnection.submitTransaction(trade);
                        })
                        .then(() => {
                            return businessNetworkConnection.getAssetRegistry(NS + '.MyAsset');
                        })
                        .then((assetRegistry) => {
                            // re-get the myAsset
                            return assetRegistry.get(myAsset.$identifier);
                        })
                        .then((newMyAsset) => {
                            // the owner of the myAsset should now be simon
                            newMyAsset.owner.$identifier.should.equal(simon.$identifier);
                        })
                        .then(() => {
                            // use a query
                            return businessNetworkConnection.query('selectMyAssetsByMotoOfExchange', {exchange : 'Euronext'});
                        })
                        .then((results) => {
                            // check results
                            results.length.should.equal(1);
                            results[0].getIdentifier().should.equal('EMA');
                        })
                        .then(() => {
                            // use another query
                            return businessNetworkConnection.query('selectMyAssetsByOwner', {owner : 'resource:' + simon.getFullyQualifiedIdentifier()});
                        })
                        .then((results) => {
                            //  check results
                            results.length.should.equal(1);
                            results[0].getIdentifier().should.equal('EMA');
                        })
                        .then(() => {
                            // use a query
                            return businessNetworkConnection.query('selectMyAsset');
                        })
                        .then((results) => {
                            // check results, should only have 1 myAsset left
                            results.length.should.equal(1);
                            results[0].getIdentifier().should.equal('XYZ');
                        });
                });
        });
    });
});