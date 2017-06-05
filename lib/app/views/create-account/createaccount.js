
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


'use strict';

(function () {

    define(
        ['knockout', 'i18next', 'appevents', 'user', 'peercomm', 'appsrvc', 'definitions', 'uihandler', 'accounts', 'doorclientnet', './createaccount.html!text'],
        function (ko, i18next, appevents, user, peercomm, appsrvc, defs, uihandler, accounts, doorclientnet, template) {

        function CreateAccountVm(params) {
            this.ispwd_error = ko.observable(false);
            this.isconfpwd_error = ko.observable(false);
            this.isaccount_error = ko.observable(false);
            this.private_key_pwd = ko.observable("");
            this.private_keypwd_conf = ko.observable("");
            this.account = ko.observable("");
            this.pwderrormsg = ko.observable("");
            this.pwdconferrormsg = ko.observable("");
            this.accounterrormsg = ko.observable("");      

            this.ctrlkeyup = function(d, e) {
                if (e.keyCode == 13) {
                    this.create_account();
                }
            }

            this.onPasswordChange = function() {

                this.ispwd_error(false);
                this.pwderrormsg("");

                var val = $.trim(this.private_key_pwd());

                if (!val) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-pwdrequired"));
                    this.ispwd_error(true);
                    return false;
                }

                if (val.length < 8) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-pwdlength"));
                    this.ispwd_error(true);
                    return false;
                }

                if (val.indexOf(' ') > -1) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-nospaceallowed"));
                    this.ispwd_error(true);
                    return false;
                }

                var valid = false;
                for (var i = 0; i < val.length; i++) {
                    var asciicode = val.charCodeAt(i);
                    if (asciicode > 96 && asciicode < 123) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-lowercaseneed"));
                    this.ispwd_error(true);
                    return false;
                }

                valid = false;
                for (var i = 0; i < val.length; i++) {
                    var asciicode = val.charCodeAt(i);
                    if (asciicode > 64 && asciicode < 91) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-uppercaseneed"));
                    this.ispwd_error(true);
                    return false;
                }

                var ck_nums = /\d/;
                if (!ck_nums.test(val)) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-digitneed"));
                    this.ispwd_error(true);
                    return false;
                }

                valid = false;
                for (var i = 0; i < val.length; i++) {
                    var asciicode = val.charCodeAt(i);
                    if ((asciicode > 32 && asciicode < 48) ||
                        (asciicode > 57 && asciicode < 65) ||
                        (asciicode > 90 && asciicode < 97) ||
                        (asciicode > 122 && asciicode < 127)) {
                        valid = true;
                        break;
                    }
                }
                if (!valid) {
                    this.pwderrormsg(i18next.t("errmsg-createaccount-specialcharneed"));
                    this.ispwd_error(true);
                    return false;
                }

                return val;
            }

            this.onPasswordConfirmChange = function() {
                this.pwdconferrormsg("");
                this.isconfpwd_error(false);

                var val = $.trim(this.private_keypwd_conf());
                if (!val) {
                    this.pwdconferrormsg(i18next.t("errmsg-createaccount-pwdconfirm"));
                    this.isconfpwd_error(true);
                    return false;
                }

                var pwd = $.trim(this.private_key_pwd());
                if (pwd != val) {
                    this.pwdconferrormsg(i18next.t("errmsg-createaccount-pwdconfirmmatch"));
                    this.isconfpwd_error(true);
                    return false;
                }

                return true;
            }

            this.validateAccountText = function() {
                var val = $.trim(this.account());

                var ck_account = /^[A-Za-z0-9]{6,20}$/;
                if (!ck_account.test(val)) {
                    this.accounterrormsg(i18next.t("errmsg-createaccount-accountname"));
                    this.isaccount_error(true);
                    return false;
                }
                else {
                    if (accounts.exists(val)) {
                        this.accounterrormsg(i18next.t("errmsg-createaccount-exists"));
                        this.isaccount_error(true);
                        return false;
                    }
                    else {
                        return val;
                    }
                }
            }

            this.onAccountChange = function () {
                this.isaccount_error(false);
                this.accounterrormsg("");

                this.validateAccountText();
            };

            this.publish = function () {
                return new Promise((resolve, reject) => {
                    var public_key = appsrvc.publicKeyBs58;
                    var address = appsrvc.address;
                    var port = appsrvc.port;
                    var transport = appsrvc.transport;
                    var type = appsrvc.usertype;
                    var symcryptkey = appsrvc.connsymmkey;

                    peercomm.publish_user(symcryptkey, appsrvc.pubkeyhash, public_key, transport, address, port, type, function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });

                });
            };

            this.create = function (account, password ) {
                return new Promise((resolve, reject) => {
                    user.create_account(account, password, function (err) {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            };

            this.submit = function () {
                var processed = false;
                var timer = 0;     
                try {
                    var account = this.validateAccountText();
                    if (!account) {
                        return;
                    }

                    var password = this.onPasswordChange();
                    if (!password) return;

                    var valid = this.onPasswordConfirmChange();
                    if (!valid) return;

                    var self = this;                                  

                    appsrvc.account_connected = false;

                    // block the UI
                    uihandler.blockwin();

                    this.create(account, password)
                    .then(() => {
                        return doorclientnet.init()
                    })
                    .then(() => {
                        return self.publish();
                    })
                    .then(() => {
                        // unblock the UI
                        processed = true;
                        uihandler.unblockwin();
                        appsrvc.account_connected = true;
                        appevents.dispatch("account-init", account);                        
                        appevents.navigate("doorclient-app");
                        doorclient.notify.success("The account has been created and published to the DoorClient network.");

                        // register
                        doorclientnet.register_at_ws();
                        //
                    })
                    .catch(function (err) {
                        // unblock the UI
                        processed = true;
                        uihandler.unblockwin();
                        doorclient.notify.error("Error in creating the account: %j", err);
                    });

                    timer = setTimeout(function () {
                        uihandler.unblockwin();
                        if (!processed) {
                            doorclient.notify.error("Error in connecting to DoorClient, timed out");
                        }
                    }, 30000);

                    //
                }
                catch (err) {
                    // unblock the UI
                    uihandler.unblockwin();
                    processed = true;
                    if (timer) {
                        clearTimeout(timer);
                    }
                    doorclient.notify.error("Error in creating the account user: %j", err);
                }
            };
        }

        return {
            viewModel: CreateAccountVm,
            template: template
        };
    });

}());



