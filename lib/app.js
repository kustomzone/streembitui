﻿/*

This file is part of DoorClient application. 
DoorClient is an open source project to manage reliable identities. 

DoorClient is a free software: you can redistribute it and/or modify it under the terms of the GNU General Public License 
as published by the Free Software Foundation, either version 3.0 of the License, or (at your option) any later version.

DoorClient is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty 
of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with DoorClient software.  
If not, see http://www.gnu.org/licenses/.
 
-------------------------------------------------------------------------------------------------------------------------
Author: Tibor Zsolt Pardi 
Copyright (C) Authenticity Institute 2017
-------------------------------------------------------------------------------------------------------------------------

*/

'use strict';

import defs from "definitions";

import Resources from './resources';

import Localres from './localization';

import uihandler from "uihandler";

import AppSrvc from 'appsrvc'
import viewreg from './viewreg';
import AppUI from './appui';
import Config from 'appconfig';
import logger from 'applogger';
import Database from 'database';
import Datadir from 'datadir';
import Accounts from 'accounts';
import doorclientnet from 'doorclientnet';
import appevents from "appevents";
import apputils from "apputils";
import settings from "settings";
import contactsutil from "contactsutil";
import peercomm from "peercomm";
import contactlist from "contactlist";
import errhandler from "./errorhandler";
import webrtcfile from "webrtcfile";
import connections from "connections";
import webrtcscreen from "webrtcscreen";


var App = {

    isdatabase: false,

    peermsg_handler: function (payload, info) {
        try {
            peercomm.onPeerMessage(payload, info);
        }
        catch (err) {
            // display the error in the taskbar
            doorclient.notify.error("Peer message handling error: %j", err, true);
        }
    },

    create_event_handlers: function () {
        return new Promise((resolve, reject) => {

            // create an application wide event handler
            appevents.onAppEvent(function (eventcmd, payload, info) {
                switch (eventcmd) {
                    case appevents.TYPES.ONFILEINIT:
                        webrtcfile.receivefile(payload);
                        logger.debug("event: ONFILEINIT");
                        break;
                    case appevents.TYPES.ONCHATOFFER:
                        if (payload && payload.contact) {
                            connections.create_receiver(payload.contact);
                            logger.debug("event: ONCHATOFFER");
                        }                        
                        break;
                    case appevents.TYPES.ONSCREENOFFER:
                        if (payload && payload.contact) {
                            webrtcscreen.receive(payload);
                            logger.debug("event: ONSCREENOFFER");
                        }
                        break;
                    default:
                        break;
                }
            });

            // create the peermsg event handler
            appevents.onPeerMsg(App.peermsg_handler);

            resolve();
        });        
    },

    load: function () {
        try {

            // will throw an exception upon invalid configuration entries
            Config.init();
            logger.create("debug");

            uihandler.init(ko, $);

            Localres()
                .then(() => {
                    uihandler.set_load_info('appload-logger', true);
                    return 
                })
                .then(() => {
                    uihandler.set_load_info('appload-components');
                    return viewreg.load();  
                })
                .then(() => {
                    uihandler.set_load_info('appload-databind');
                    return AppUI();
                })
                .then(() => {
                    logger.debug("Logger is initialized");
                    uihandler.set_load_info('appload-application');

                    // load the application service object that maintains system wide variables
                    return AppSrvc.load(defs.USER_TYPE_HUMAN);
                })
                .then(() => {
                    uihandler.set_load_info('appload-events');
                    return App.create_event_handlers();
                })
                .then(() => {
                    return errhandler.load();
                })                
                .then(() => {
                    uihandler.set_load_info('appload-datadir');
                    return Datadir.makedir();
                })
                .then(() => {
                    uihandler.set_load_info('appload-database');
                    return Database.init();
                })
                .then(() => {
                    App.isdatabase = true;
                    uihandler.set_load_info('appload-settings');
                    return settings.load();
                })
                .then(() => {
                    uihandler.set_load_info('appload-logger', true);
                    return logger.init(settings.loglevel)
                })
                .then(() => {
                    uihandler.set_load_info('appload-accounts');
                    return Accounts.load();
                })
                .then(() => {
                    uihandler.set_load_info('appload-contacts');
                    return contactlist.load();
                })
                .then(() => {
                    uihandler.set_load_info('appload-apputils');
                    return apputils.listen();
                })
                .then(() => {
                    uihandler.set_load_info('appload-contact-handler');
                    return contactsutil.load();
                })
                .then(() => {
                    uihandler.unblockwin();
                    uihandler.on_load_complete();
                    logger.info('Initialization promise chain is completed');
                    uihandler.set_load_info('appload-complete');
                })
                .catch(function (err) {
                    uihandler.unblockwin();
                    uihandler.on_appload_error(err);                    
                    logger.error("App load error. %j", err);
                });

        }
        catch (err) {
            try {
                uihandler.unblockwin();
            }
            catch (e) { }

            try {
                logger.error("Error in initializing DoorClient application: " + err.message);   
            }
            catch (e) { }                   

            if (doorclient.notify.error) {
                doorclient.notify.error("Error in initializing DoorClient application: " + err.message);
            }
            else {
                alert("Error in initalizing App: " + err.message);
            }
        }
    }
}

export default App;


