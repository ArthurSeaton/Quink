/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

define([
    'Underscore',
    'jquery',
    'util/FocusTracker',
    'util/PubSub',
    'keyhandler/InsertKeyHandler',
    'keyhandler/CommandKeyHandler',
    'text!resources/keymap.json'
], function (_, $, FocusTracker, PubSub, InsertKeyHandler, CommandKeyHandler, keymapJson) {
    'use strict';

    var KeyHandlerMgr = function () {
        var onStopKeyHandler = this.onStopKeyHandler.bind(this),
            onStartKeyHandler = this.onStartKeyHandler.bind(this);
        this.insertKeyHandler = null;
        this.commandKeyHandler = null;
        this.keyHandler = null;
        PubSub.subscribe('plugin.open', onStopKeyHandler);
        PubSub.subscribe('plugin.saved', onStartKeyHandler);
        PubSub.subscribe('plugin.exited', onStartKeyHandler);
        PubSub.subscribe('info.open', onStopKeyHandler);
        PubSub.subscribe('info.closed', onStartKeyHandler);
    };

    KeyHandlerMgr.prototype.init = function (selector) {
        this.editable = $(selector);
        this.insertKeyHandler = new InsertKeyHandler(selector, this);
        this.commandKeyHandler = new CommandKeyHandler(selector, this);
        this.keyHandler = this.insertKeyHandler;
        this.keyHandler.start();
    };

    KeyHandlerMgr.prototype.switchMode = function () {
        this.keyHandler =
            this.keyHandler === this.insertKeyHandler ? this.commandKeyHandler : this.insertKeyHandler;
        this.keyHandler.start();
        PubSub.publish('keyhandler.mode.command', this.isCommandMode());
    };

    KeyHandlerMgr.prototype.isCommandMode = function () {
        return this.keyHandler === this.commandKeyHandler;
    };

    KeyHandlerMgr.prototype.onStopKeyHandler = function () {
        this.keyHandler.stop();
    };

    KeyHandlerMgr.prototype.onStartKeyHandler = function () {
        this.keyHandler.start();
    };

    var insertKeyBindings;

    /**
     * If this publication arrives before the key maps are initialised, save the keybindings
     * and process them when the maps have downloaded.
     */
    function onInsertKeybindings(keyBindings) {
        var map = CommandKeyHandler.prototype.INSERT_MAP;
        if (map) {
            keyBindings.forEach(function (key) {
                map[key] = 'insert.' + key;
            });
        } else {
            insertKeyBindings = keyBindings;
        }
    }

    /**
     * Loads the downloaded keymaps into the command key handler.
     * Publishes the mode switch key and adds it to the COMMAND_MAP to ensure that the key used
     * to enter command mode is also used to leave command mode.
     */
    function onDownloadKeyMap(data) {
        var msk;
        $.each(data, function (mapName, map) {
            if (mapName === 'mode-switch-key') {
                msk = map;
            } else {
                CommandKeyHandler.prototype[mapName] = map;
            }
        });
        CommandKeyHandler.prototype.COMMAND_MAP[msk] = 'exit';
        InsertKeyHandler.prototype.MODE_SWITCH_KEY_CODE = parseInt(msk, 10);
        if (insertKeyBindings) {
            onInsertKeybindings(insertKeyBindings);
            insertKeyBindings = null;
        }
        CommandKeyHandler.prototype.map = CommandKeyHandler.prototype.COMMAND_MAP;
    }

    function initSubscriptions() {
        PubSub.subscribe('plugin.insert.keybindings', onInsertKeybindings);
    }

    var managers = [];

    function getActiveMgr() {
        var editable = FocusTracker.getCurrentEditable();
        return _.find(managers, function (mgr) {
            return mgr.editable[0] === editable;
        });
    }

    /**
     * Determines whether the current editable is in command mode.
     */
    function isEditableInCommandMode() {
        var mgr = getActiveMgr();
        return mgr ? mgr.isCommandMode() : false;
    }

    function create(selector) {
        $(selector).each(function () {
            var mgr = new KeyHandlerMgr();
            mgr.init(this);
            managers.push(mgr);
        });
    }

    function init(selector) {
        initSubscriptions();
        create(selector);
        onDownloadKeyMap(JSON.parse(keymapJson));
    }

    return {
        init: init,
        isEditableInCommandMode: isEditableInCommandMode
    };
});
