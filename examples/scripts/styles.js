/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/*global QUINK */
QUINK = {
    params: {
        toolbar: 'on',
        styles: '../resources/example-styles.css'
    },

    ready: function () {
        'use strict';

        QUINK.configureToolbar({
            groups: [{
                id: 'style',
                active: true,
                hidden: false,
                items: [{
                    "id": "applyStyleFont",
                    "hidden": false,
                    "index": 8,
                    "cssClass": "qk_button_bg_style_font",
                    "command": "showStyleMenu",
                    "commandArgs": "fontStyleRuleFilter"
                }, {
                    "id": "applyStyleStroke",
                    "hidden": false,
                    "index": 9,
                    "cssClass": "qk_button_bg_style_colour",
                    "command": "showStyleMenu",
                    "commandArgs": "strokeStyleRuleFilter"
                }, {
                    "id": "applyStyleBackground",
                    "hidden": false,
                    "index": 10,
                    "cssClass": "qk_button_bg_style_size",
                    "command": "showStyleMenu",
                    "commandArgs": "backgroundStyleRuleFilter"
                }, {
                    "id": "applyStyleMulti",
                    "hidden": false,
                    "index": 11,
                    "cssClass": "qk_button_bg_style_effects",
                    "command": "showStyleMenu",
                    "commandArgs": "multiStyleRuleFilter, true"
                }]
            }],
            defaults: {
                hidden: true
            }
        });

        /**
         * Select all rules that contain either 'font-style' or font-family' and are at class level.
         */
        QUINK.fontStyleRuleFilter = function (rule) {
            return /^\..*(font-style|font-family)/i.test(rule.cssText);
        };

        /**
         * Select rules whose selectors that start with the word 'stroke' and are at the class level.
         */
        QUINK.strokeStyleRuleFilter = function (rule) {
            return /^\.stroke/i.test(rule.selectorText);
        };

        /**
         * Select all rules that contain the word 'background' in their rule body.
         */
        QUINK.backgroundStyleRuleFilter = function (rule) {
            return /^\..*background/i.test(rule.cssText);
        };

        /**
         * Selects the text transformation rules plus italic and bold.
         */
        QUINK.multiStyleRuleFilter = function (rule) {
            return /^\..*text-transform/i.test(rule.cssText) || /\.(italic|bold)/i.test(rule.selectorText);
        };
    }
};
