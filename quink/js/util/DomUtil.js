/**
 * Copyright (c), 2013-2014 IMD - International Institute for Management Development, Switzerland.
 *
 * See the file license.txt for copying permission.
 */

/*global Node */
define([
    'jquery',
    'util/Env'
], function ($, Env) {
    'use strict';

    /**
     * Tag name versus array of elements of that type. Intended to reduce the amount of DOM
     * element creation.
     */
    var elements = {},

    /**
     * Names of css classes used to identify internal Quink artifacts (e.g. toolbar).
     */
    quinkCssClasses = [
        'qk_state_bar',
        'qk_popup',
        'qk_toolbar_container',
        'qk_plugin_close_button',
        'qk_caret',
        'qk_mask'
    ];

    function popEl(tag) {
        var ar = elements[tag.toLowerCase()];
        return ar && ar.length > 0 ? ar.pop() : document.createElement(tag);
    }

    function pushEl(el) {
        var tag = el.tagName.toLowerCase(),
            ar = elements[tag];
        if (ar) {
            ar.push(el);
        } else {
            elements[tag] = [el];
        }
    }

    /**
     * SVG nodes don't appear to follow many (any?) of the usual element conventions.
     */
    function nodeHasQuinkClass(node) {
        var classList = node.tagName.toLowerCase() !== 'svg' && node.classList,
            result = false,
            i, length;
        if (classList) {
            for (i = 0, length = quinkCssClasses.length; i < length; i++) {
                if (classList.contains(quinkCssClasses[i])) {
                    result = true;
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Does the node or any parent of that node have a Quink class.
     */
    function isWithinQuinkClass(node) {
        var result = false,
            n;
        for (n = node; n && n.nodeType !== Node.DOCUMENT_NODE; n = n.parentNode) {
            if (nodeHasQuinkClass(n)) {
                result = true;
                break;
            }
        }
        return result;
    }

    function isQuinkLibArtifact(node) {
        return node.tagName === 'SCRIPT' &&
            (node.hasAttribute('data-requirecontext') || node.hasAttribute('data-requiremodule'));
    }

    function isQuinkArtifact(node) {
        return node && node.nodeType === 1 && (isWithinQuinkClass(node) || isQuinkLibArtifact(node));
    }

    function isTransient(node) {
        return typeof node.hasAttribute === 'function' && node.hasAttribute('data-qk-transient');
    }

    /**
     * Is the node inside a part of the DOM that isn't to do with Quink's implementation?
     */
    function isWithinDocument(node) {
        return !isQuinkArtifact(node) && !isTransient(node);
    }

    /**
     * A version of Array.some that works cross browser for node lists.
     */
    function nlSome(nodeList, func) {
        var result = false,
            i, length;
        if (!nodeList || typeof func !== 'function') {
            throw new TypeError();
        }
        for (i = 0, length = nodeList.length; i < length; i++) {
            if (func(nodeList[i])) {
                result = true;
                break;
            }
        }
        return result;
    }

    /**
     * Find all elements in the page that have attributes of the form:
     *  data-qk-ref=<attrName>
     * and action them.
     * Example would be:
     *      <iframe data-qk-ref="src" src="foo/bar"></iframe>
     * which would be converted into
     *      <iframe src="quink/relative/src/to/foo/bar"></iframe>
     * data-qk-ref can have multiple attribute names that are space separated.
     */
    function makeQuinkRelative(rootEl) {
        var elements = rootEl.querySelectorAll('[data-qk-ref]'),
            names, i, length, el,
            setElementAttr = function (attrName) {
                var value = el.getAttribute(attrName);
                el.setAttribute(attrName, Env.makeQuinkRelative(value));
            };
        for (i = 0, length = elements.length; i < length; i++) {
            el = elements[i];
            names = el.getAttribute('data-qk-ref').split(' ');
            names.forEach(setElementAttr);
        }
    }

    /**
     * On iOS the virtual keyboard which occupies different amounts of
     * screen real estate depending on the device orientation. The keyboard will be active if
     * there is an active element in the document (i.e. something has focus).
     * isNavScroll means that the calculation is being done when deciding whether to scroll as a result
     * of a navigation operation in which case the returned value takes into account the virtual keyboard.
     * If this isn't for nav scroll then the height doesn't allow for a virtual keyboard and takes
     * any document scroll into account.
     * On Android Chrome the window height changes when the keyboard slides in which is why the test
     * is now for iOS and not for a touch device.
     */
    function getMaxVisibleHeight(isNavScroll) {
        var win = $(window),
            height = win.height(),
            factor;
        if (Env.isIos() && !!document.activeElement && isNavScroll) {
            factor = height > win.width() ? 0.60 : 0.35;
            height *= factor;
        }
        return height;
    }

    /**
     * Returns the top and bottom coordinates for the visible part of the editable in page coordinates.
     */
    function getVisibleBounds(editable, isNavScroll) {
        var el = $(editable),
            visTop = $(document).scrollTop(),
            visBottom = visTop + getMaxVisibleHeight(isNavScroll),
            top = Math.floor(Math.max(el.offset().top, visTop)),
            bottom = Math.ceil(Math.min(el.offset().top + el.outerHeight(), visBottom));
        return {
            top: top,
            bottom: bottom
        };
    }

    /**
     * Returns the top and bottom coordinates for the visible part of the editable in client coordinates.
     */
    function getVisibleClientBounds(el, isNavScroll) {
        var doc = $(document),
            docScrollTop = doc.scrollTop(),
            elTop = el.offset().top,
            top = Math.floor(Math.max(0, elTop - docScrollTop)),
            bottom = Math.ceil(Math.min(getMaxVisibleHeight(isNavScroll), elTop + el.innerHeight() - docScrollTop));
        return {
            top: top,
            bottom: bottom
        };
    }

    return {
        popEl: popEl,
        pushEl: pushEl,
        isWithinDocument: isWithinDocument,
        nlSome: nlSome,
        makeQuinkRelative: makeQuinkRelative,
        getVisibleBounds: getVisibleBounds,
        getVisibleClientBounds: getVisibleClientBounds
    };
});
