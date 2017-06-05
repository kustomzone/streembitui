/*

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

import $ from 'jquery';
import ko from "knockout";
import i18next from 'i18next';
import i18nextko from "./bindinghandlers/i18next-ko";
import AppSrvc from 'appsrvc';
import appevents from "appevents";
import apputils from "apputils";
import appsrvc from "appsrvc";
import user from "user";
import accounts from "accounts";
import peercomm from "peercomm";
import bootbox from "makeusabrew/bootbox"; 
import bindings from "./bindinghandlers/bindings";
import WebrtcData from "webrtcdata";
import aboutview from './app/views/about/about.html!text';
import database from "database";
import doorclientnet from './app/doorclientnet';

function MainVM() {

    function validate_page(param) {
        var page = param;
        if (page == "connectpublic") {
            var accountlist = accounts.list;
            if (!accountlist || !accountlist.length) {
                // there is no account exists -> navigate to new account
                page = "createaccount";
            }
        }
        else if (page == "changepassword") {
            if (!appsrvc.username || !appsrvc.account_connected) {
                doorclient.notify.error("First initialize the account by connecting to the City of Osmio P2P network");
                return "initui";
            }

            var curr_account = accounts.get_account(appsrvc.username);
            if (!curr_account) {
                doorclient.notify.error("The account is not initialized. First initialize the account by connecting to the City of Osmio P2P network");
                page = "initui";
            }
        }

        return page;
    }

    var viewModel = {
        route: ko.observable({ page: 'initui' }),

        nav: function (page, params) {
            var navroute = {
                "page": "",
                "params": params
            };

            if (page) {
                navroute.page = validate_page(page);
            }
            else {
                if (AppSrvc.account_connected) {
                    navroute.page = doorclient.view.mainapp || "doorclient-app";
                }
                else {
                    navroute.page = "initui";
                }
            }

            viewModel.route(navroute);
        },

        cmd: function (action) {
            if (action) {
                switch (action) {
                    case 'delete-account':
                        break;
                    default:
                        appevents.cmd(action);
                        break;
                }
            }
        },

        onNavigate: function (page, params) {
            var nav = {
                "page": "",
                "params": params
            };

            if (page) {
                // validate the routes  
                nav.page = validate_page(page);
            }
            else {
                if (AppSrvc.account_connected) {
                    console.log("loading doorclient app");
                    nav.page = doorclient.view.mainapp || "doorclient-app";
                }
                else {
                    nav.page = "initui";
                }
            }

            viewModel.route(nav);
        },

        backupContacts: function () {
            apputils.backup_contacts();
        },

        restoreContacts: function () {
            apputils.restore_contacts(function () {
                console.log("contacts restored")
            });
        },

        backupAccount: function () {
            apputils.backup_account();            
        },

        restoreAccount: function () {
            console.log("cmd: restoreAccount");
            apputils.restore_account(function () {
            });
        },

        about: function () {
            var box = bootbox.dialog({
                title: "About DoorClient",
                message: aboutview,
                buttons: {
                    close: {
                        label: "Close",
                        className: "btn-default",
                        callback: function () {
                        }
                    }
                }
            });

            box.init(function () {
                $(".modal-header").css("padding", "4px 8px 4px 12px");
                $("#lbl_app_version").text(doorclient.globals.version);
            });
        },

        clearDatabase: function () {
            apputils.clear_database();
        },

        checkUpdates: function () {   
            apputils.getversion(function (err, version) {
                doorclient.notify.success("Your DoorClient version v" + doorclient.globals.version + " is up to date, there is no new version available.");

                //if (err || !version) {
                //    return doorclient.notify.error("Error in retrieving version from the repository");
                //}

                //try {
                //    var tverarr = doorclient.globals.version.split(".");
                //    var strver = tverarr.join('');
                //    var numver = parseInt(strver);
                //    var trcvver = version.split('.');
                //    var rcvnum = trcvver.join('');
                //    var rcvver = parseInt(rcvnum);
                //    if (numver >= rcvver) {
                //        doorclient.notify.success("Your DoorClient version v" + doorclient.globals.version + " is up to date, there is no new version available.");
                //    }
                //    else {
                //        doorclient.notify.success("There is a new DoorClient version v" + version + " available for download. Your DoorClient current version is v" + doorclient.globals.version);
                //    }
                //}
                //catch (e) {
                //    doorclient.notify.error_popup("Error in populating version: %j", e);
                //}                
            });         
        },

        offline_contact_request: function () {            
            if (!AppSrvc.account_connected) {
                return doorclient.notify.error("First connect to the City of Osmio P2P network");
            }

            appevents.dispatch("display-view", "offline-contact-request");
        },

        accept_contact_request: function () {
            if (!AppSrvc.account_connected) {
                return doorclient.notify.error("First connect to the City of Osmio P2P network");
            }

            appevents.dispatch("display-view", "accept-contact-request");
        }
    };

    return viewModel;
}

export default function() {
    return new Promise((resolve, reject) => {
        // initialize the locals/languages binding handlers
        var language = i18next.language;
        i18nextko.init(ko, $, (language || "en"));

        // initialize the knockout binding handlers
        bindings.init();

        // initialize the main viewmodel
        var vm = new MainVM();
        appevents.onNavigate(vm.onNavigate);        

        // KO data binding
        ko.applyBindings(vm);

        resolve();
    });       
}



