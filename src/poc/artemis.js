(function () {
    'use strict';
    // VARS ------------------------------------------------------------------------------------------------------------
    var cnst = {
        html: {
            ARTEMIS_DIV_ID:                            'artemis-div',
            ARTEMIS_LINE_ID:                           'artemis-line',
            ARTEMIS_LINE_CSS_CLASS:                    'artemis-line-class',
            ARTEMIS_LINE_ANIMATE_CSS_CLASS:            'animate-artemis-line',
            ARTEMIS_ID_ATTRIBUTE:                      'artemis-id',
            ARTEMIS_SCORE_ATTRIBUTE:                   'artemis-score',
            ARTEMIS_MARKED_CONTROL_CSS_CLASS_PREFIX:   'artemis-mark-'
        },
        keyword: {
            SMALL:          '-small',
            MEDIUM:         '-medium',
            LARGE:          '-large',
            ELEMENT:        '-element',
            BUTTON:         '-button',
            LINK:           '-link',
            INPUT:          '-input',
            CHECKBOX:       '-checkbox',
            LABEL:          '-label',
            IMAGE:          '-image',
            PANEL:          '-panel',
            TOOLBAR:        '-toolbar',
            TAG:            '-tag',
            IDENTITY:       '-identity',
            CLASS:          '-class',
            STYLE:          '-style',
            ATTR_NAME:      '-attr-name',
            ATTR_VALUE:     '-attr-value',
            ATTR_EQUALS:    '-attr-equals',
            WITH_TYPE:      -'with-type',
            TEXT:           '-text',
            AT_THE_TOP:     '-at-the-top',
            AT_THE_BOTTOM:  '-at-the-bottom',
            ON_THE_LEFT:    '-on-the-left',
            ON_THE_RIGHT:   '-on-the-right',
            ON_THE_MIDDLE:  '-on-the-middle',
            RIGHT_OF:       '-right-of',
            LEFT_OF:        '-left-of',
            ABOVE:          '-above',
            BELOW:          '-below',
            NEAR:           '-near',
            INSIDE:         '-inside'
        },
        targetType: {
            ELEMENT:    'ELEMENT',
            BUTTON:     'BUTTON',
            LINK:       'LINK',
            INPUT:      'INPUT',
            CHECKBOX:   'CHECKBOX',
            LABEL:      'LABEL',
            IMAGE:      'IMAGE',
            TOOLBAR:    'TOOLBAR',
            PANEL:      'PANEL',
            ITEM:       'ITEM'
        },
        targetProperty: {
            ELEMENT_TAG:        'ELEMENT_TAG',
            ELEMENT_ATTRIBUTE:  'ELEMENT_ATTRIBUTE',
            CSS_CLASS:          'CSS_CLASS',
            CSS_STYLE:          'CSS_STYLE',
            TEXT:               'TEXT',
            SCREEN_POSITION:    'SCREEN_POSITION',
            SIZE:               'SIZE'
        },
        relationType: {
            REL_LOCATION:       'REL_LOCATION'
        },
        relLocationType: {
            RIGHT_OF:           'RIGHT_OF',
            LEFT_OF:            'LEFT_OF',
            ABOVE:              'ABOVE',
            BELOW:              'BELOW',
            NEAR:               'NEAR',
            INSIDE:             'INSIDE'
        },
        screenPosition: {
            LEFT:   'LEFT',
            RIGHT:  'RIGHT',
            TOP:    'TOP',
            BOTTOM: 'BOTTOM',
            MIDDLE: 'MIDDLE'
        },
        elementSize: {
            S:      'S',
            M:      'M',
            L:      'L'
        }
    };

    var ignoredTags = ['script', 'noscript'];
    var markingInProgress = false;
    var html = {
        console: null,
        window: null,
        document: null,
        head: null,
        body: null,
        bodyRect: null,
        allDomElms: [],
        relevantDomElms: []
    };
    var inputText = '';
    var elements = [];
    var scorers = [];
    // VARS ------------------------------------------------------------------------------------------------------------





    // HELPERS ---------------------------------------------------------------------------------------------------------
    function ___LOG(msg) {
        html.console.log('ARTEMIS ' + msg);
    }
    function ___DBG(msg) {
        ___LOG('DBG ' + msg);
    }
    function ___WRN(msg) {
        ___LOG('WRN ' + msg);
    }
//    function ___ERR(msg) {
//        ___LOG('ERR ' + msg);
//    }
//    function ___START(funcName) {
//        ___DBG(funcName + '() - start');
//    }
//    function ___END(funcName) {
//        ___DBG(funcName + '() - end');
//    }
    function startsWith(str1, str2){
        return _.isString(str1) && !_.isEmpty(str1) && _.isString(str2) && !_.isEmpty(str2) ? str1.indexOf(str2) === 0 : false;
    }
    function endsWith(str1, str2){
        return _.isString(str1) && !_.isEmpty(str1) && _.isString(str2) && !_.isEmpty(str2) ? str1.indexOf(str2, str1.length - str2.length) !== -1 : false;
    }
    function quoteStart(str) {
        return startsWith(str, '"') || startsWith(str, '\'') || startsWith(str, '~');
    }
    function quoteEnd(str) {
        return endsWith(str, '"') || endsWith(str, '\'') || endsWith(str, '~');
    }
    function quoted(str) {
        return startsWith(str, '"') && endsWith(str, '"') || startsWith(str, '\'') && endsWith(str, '\'') || startsWith(str, '~') && endsWith(str, '~');
    }
    function unQuote(str) {
        if (!str) {
            return '';
        }
        if (!quoted(str)) {
            return str;
        }
        return str.slice(1, str.length-1);
    }
    function pascalCase(str) {
        if (!str) {
            return '';
        }
        return str.trim().replace(/_/g, '-').replace(/\-/g, ' ').replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '').replace(/^[a-z]/, function(m){ return m.toUpperCase(); });
    }
    function stringMatchScore(data, string, allowPartialMatch) {
        var score = 0;
        if (!data) {
            return 0;
        }
        var dat = pascalCase(data).toLowerCase();
        var str = pascalCase(string).toLowerCase();
        if (dat.indexOf(str) === -1) {
            return 0;
        }
        if (allowPartialMatch) {
            score = str.length / dat.length;
            if (score < 0.1) {
                score = 0;
            }
        } else if (str.length === dat.length) {
            score = 1;
        }
        return score;
    }
    function stringMatchScores(datas, string, allowPartialMatch) {
        var i;
        var score = 0;
        for (i = 0; i < datas.length; i++) {
            score = Math.max(score, stringMatchScore(datas[i], string, allowPartialMatch));
        }
        return score;
    }
    function getBoundScore(score) {
        return Math.min(Math.max(0, score), 1.0);
    }
    function isElmInsideElm(elm1, elm2) {
        var isInside = false;
        var elmRect1 = elm1.getRect();
        var elmRect2 = elm2.getRect();
        if (elmRect1.width === 0 || elmRect1.height === 0 || elmRect2.width === 0 || elmRect2.height === 0) {
            return isInside;
        }
        if ((elmRect1.left >= elmRect2.left) &&
            (elmRect1.top >= elmRect2.top) &&
            (elmRect1.right <= elmRect2.right) &&
            (elmRect1.bottom <= elmRect2.bottom)){
            isInside = true;
        }
        return isInside;
    }
    function getPartialScore(value, maxValue, reversed) {
        var score = maxValue > 0 ? Math.min(Math.max(0, value / maxValue), 1.0) : 0;
        return reversed ? 1 - score : score;
    }
    function normalizeElmsScores(elmsScores) {
        var maxScore = 0;
        _.forEach(elmsScores, function(elmScore) {
            maxScore = Math.max(maxScore, elmScore.score);
        });
        if (maxScore > 0) {
            _.forEach(elmsScores, function (elmScore) {
                elmScore.score = elmScore.score > 0 ? Math.round(elmScore.score / maxScore * 1000000000) / 1000000000 : 0;
            });
        }
    }
    function goHelp(displayAlert) {
        var msg = 'Artemis'+
            '\n\n---------- Execution ----------\nImmediate: Shift+a | Delayed: Shift+s'+
            '\n\n---------- Ordinal ----------\n1st | 2nd | 3rd\n'+
            '\n\n---------- Target Adjectives ----------\nsmall | medium | large\n<free text>'+
            '\n\n---------- Target Type ----------\nelement | button | link | input | checkbox | label | image | dropdown | item | panel | toolbar'+
            '\n\n---------- Target Properties----------\nwith tag X\nwith class X\nwith style X:Y\nwith attribute X\nwith attribute value X\nwith attribute X equals to Y\nwith type X\nwith identity X\nwith text X\nat the top | at the bottom\non the left | on the right | on the middle'+
            '\n\n---------- Target-to-Target Relations ----------\nleft of | right of | above | below | near | inside <other target phrase>'+
            '\n\n---------- Examples ----------\nelement with tag div and class selected-tab\nsave button at the top\nlarge address input\nimage left of filter label'+
            '\n\n* For multiple non-reserved keywords, surround with single quotes / double quotes / tildes, or separate words by dashes e.g. \'save all\' button, or save-all button.';
        ___DBG(msg);
        if (displayAlert) {
            html.window.alert(msg);
        }
    }
    // HELPERS ---------------------------------------------------------------------------------------------------------





    // INIT ------------------------------------------------------------------------------------------------------------
    function addClassToHtmlDom(cssText) {
		var style;
        style = createHtmlElement('style');
        style.type = 'text/css';
        if (style.styleSheet){
            style.styleSheet.cssText = cssText;
        } else {
            style.appendChild(html.document.createTextNode(cssText));
        }
        html.head.appendChild(style);
    }
    function addJediCssClassesToHtmlDom() {
		var i, colors, cssClasses = [];
        colors = ['#ffffcc', '#ffffb3', '#ffff99', '#ffff80', '#ffff66', '#ffff4d', '#ffff33', '#ffff1a', '#ffff00', '#ffe600', '#ffcc00', '#ffb300', '#ff9900', '#ff8000', '#ff6600', '#ff4d00', '#ff3300', '#ff1a00', '#ff0000', '#e30000', '#cc0000', '#339933'];
        cssClasses.push('@-webkit-keyframes ' + cnst.html.ARTEMIS_LINE_ANIMATE_CSS_CLASS + ' {from {width: 0;} to {width: 100%;} }');
        cssClasses.push('@keyframes ' + cnst.html.ARTEMIS_LINE_ANIMATE_CSS_CLASS + ' {from {width: 0;} to {width: 100%;} }');
        cssClasses.push('.' + cnst.html.ARTEMIS_LINE_CSS_CLASS + ' {display: none; width: 100%; height: 28px; box-sizing: border-box; border: 3px solid #0096d6; border-radius: 14px; padding: 0 0 0 9px; background-color: #393939; color: #ffffff; font-family: Verdana, Geneva, sans-serif; font-weight: bold; animation: ' + cnst.html.ARTEMIS_LINE_ANIMATE_CSS_CLASS + ' 0.25s; -webkit-animation: ' + cnst.html.ARTEMIS_LINE_ANIMATE_CSS_CLASS + ' 0.25s;}');
        for (i = 0; i < colors.length; i++) {
            cssClasses.push('.' + cnst.html.ARTEMIS_MARKED_CONTROL_CSS_CLASS_PREFIX + i + ' {background-color: ' + colors[i] + ' !important; outline: 5px solid ' + colors[i] + ' !important;}');
        }
        _.forEach(cssClasses, function(cssClass) {
            addClassToHtmlDom(cssClass);
        });
    }
    function createHtmlElement(tag) {
        return html.document.createElement(tag);
    }
    function addJediLineToHtmlDom() {
        var elem = createHtmlElement('div');
        elem.id = cnst.html.ARTEMIS_DIV_ID;
        elem.innerHTML = '<input type="text" id="' + cnst.html.ARTEMIS_LINE_ID + '" class="' + cnst.html.ARTEMIS_LINE_CSS_CLASS + ' ' + cnst.html.ARTEMIS_LINE_ANIMATE_CSS_CLASS + '" />';
        html.body.insertBefore(elem, html.body.childNodes[0]);
    }
    function addKeyPressEventListener() {
        html.document.addEventListener('keypress', onMyKeyPress, false);
    }
    function publishJediGoMarkAndJediGoUnMarkFunctions() {
        html.document.artemisGoMark = artemisGoMark;
        html.document.artemisGoUnMark = artemisGoUnMark;
    }
    function init() {
        html.console = console;
        html.window = window;
        html.document = document;
        html.head = html.document.head;
        html.body = html.document.body;
        addJediCssClassesToHtmlDom();
        addJediLineToHtmlDom();
        addKeyPressEventListener();
        publishJediGoMarkAndJediGoUnMarkFunctions();
        createScorers();
    }
    // INIT ------------------------------------------------------------------------------------------------------------





    // ELEMENT ---------------------------------------------------------------------------------------------------------
    function Element(id, domElm) {
        var that = this;
        that.id = id;
        that.domElm = domElm;
        that.score = 0;
        that.isMarked = false;
        that.artemisClassName = '';
        that.rect = null;
        that.getRect = function getRect() {
            if (!that.rect) {
                that.rect = domElm.getBoundingClientRect();
            }
            return that.rect;
        };
    }
    // ELEMENT ---------------------------------------------------------------------------------------------------------





    // PREPARE ---------------------------------------------------------------------------------------------------------
    function getAllDomElms() {
        return html.body.getElementsByTagName('*');
    }
    function isDomElmVisible(e) {
        while (e.nodeName.toLowerCase() !== 'body' && html.window.getComputedStyle(e).display.toLowerCase() !== 'none' && html.window.getComputedStyle(e).visibility.toLowerCase() !== 'hidden') {
            e = e.parentNode;
        }
        return e.nodeName.toLowerCase() === 'body';
    }
    function getRelevantDomElms(allDomElms) {
        var relevantDomElms = [];
        _.forEach(allDomElms, function(domElm) {
            if (!_.contains(ignoredTags, domElm.tagName.toLowerCase()) && (domElm.id !== cnst.html.ARTEMIS_LINE_ID) && (domElm.id !== cnst.html.ARTEMIS_DIV_ID) && isDomElmVisible(domElm)) {
                relevantDomElms.push(domElm);
            }
        });
        return relevantDomElms;
    }
    function getElms(relevantDomElms) {
        var elms, elm, domElm, i;
        elms = [];
        for(i=0; i<relevantDomElms.length; i++) {
            domElm = relevantDomElms[i];
            elm = new Element(i, domElm);
            elms.push(elm);
        }
        return elms;
    }
    function prepareHtmlObjs() {
        html.bodyRect = html.body.getBoundingClientRect();
        html.allDomElms = getAllDomElms();
        html.relevantDomElms = getRelevantDomElms(html.allDomElms);
    }
    // PREPARE ---------------------------------------------------------------------------------------------------------





    // MARK ------------------------------------------------------------------------------------------------------------
    function markElementClass(elm, className) {
        unMarkElementClass(elm);
        elm.artemisClassName = className;
		if (!elm.domElm.className) {
				elm.domElm.className = className;
        } else if (elm.domElm.className && _.isString(elm.domElm.className)) {
            if (endsWith(elm.domElm.className, '"')) {
                elm.domElm.className = elm.domElm.className.slice(0, elm.domElm.className.length - 1);
            }
            elm.domElm.className = elm.domElm.className + ' ' + elm.artemisClassName;
        } else if (elm.domElm.className && !_.isString(elm.domElm.className) && elm.domElm.className.baseVal) {
            elm.domElm.className.baseVal = elm.domElm.className.baseVal + ' ' + elm.artemisClassName;
        }
    }
    function unMarkElementClass(elm) {
        if (!_.isEmpty(elm.artemisClassName)) {
            if (elm.domElm.className && _.isString(elm.domElm.className)) {
                elm.domElm.className = elm.domElm.className.replace(' ' + elm.artemisClassName, '');
				elm.domElm.className = elm.domElm.className.replace(elm.artemisClassName, '');
            } else if (elm.domElm.className && !_.isString(elm.domElm.className) && elm.domElm.className.baseVal) {
                elm.domElm.className.baseVal = elm.domElm.className.baseVal.replace(' ' + elm.artemisClassName, '');
            }
        }
    }
    function markElement(elm, winnerCount) {
        var className = '';
        unMarkElement(elm);
        elm.domElm.setAttribute(cnst.html.ARTEMIS_ID_ATTRIBUTE, elm.id);
        if (elm.score > 0) {
            if (elm.score === 1 &&  winnerCount === 1) {
                className = cnst.html.ARTEMIS_MARKED_CONTROL_CSS_CLASS_PREFIX + '21';
            } else {
                className = cnst.html.ARTEMIS_MARKED_CONTROL_CSS_CLASS_PREFIX + (elm.score * 20 | 0);
            }
            markElementClass(elm, className);
            elm.domElm.setAttribute(cnst.html.ARTEMIS_SCORE_ATTRIBUTE, elm.score);
            elm.isMarked = true;
        } else {
            elm.domElm.removeAttribute(cnst.html.ARTEMIS_SCORE_ATTRIBUTE);
        }
    }
    function unMarkElement(elm) {
        elm.isMarked = false;
        elm.domElm.removeAttribute(cnst.html.ARTEMIS_ID_ATTRIBUTE);
        elm.domElm.removeAttribute(cnst.html.ARTEMIS_SCORE_ATTRIBUTE);
        unMarkElementClass(elm);
    }
    function markElements(elms) {
        //___START('markElements');
        var winners = [];
        _.forEach(elms, function(elm) {
            if (elm.score === 1) {
                ___DBG('winner:' + elm.id);
                winners.push(elm);
            }
        });
        ___DBG('winnerCount:' + winners.length);
        _.forEach(elms, function(elm) {
            markElement(elm, winners.length);
        });
        if (winners.length === 1) {
            _.forEach(elms, function(elm) {
                if ((elm.id !== winners[0].id) && isElmInsideElm(elm, winners[0])) {
                    markElementClass(elm, cnst.html.ARTEMIS_MARKED_CONTROL_CSS_CLASS_PREFIX + '21');
                }
            });
        }
    }
    function unMarkElements(elms) {
        //___START('unMarkElements');
        _.forEach(elms, function(elm) {
            unMarkElement(elm);
        });
    }
    // MARK ------------------------------------------------------------------------------------------------------------





    // SCORERS----------------------------------------------------------------------------------------------------------
    function ElementTagScorer() {
        this.name = cnst.targetProperty.ELEMENT_TAG;
        this.scoreElement = function(elm, params) {
            var score = 0;
            score += stringMatchScore(elm.domElm.tagName.toLowerCase(), params.value, false);
            return score;
        };
    }
    function ElementAttributeScorer() {
        this.name = cnst.targetProperty.ELEMENT_ATTRIBUTE;
        this.scoreElement = function(elm, params) {
            var attributeNames = [], attributeValues = [], attributeValue;
            var ignoredAttributeNames = ['class'];
            if (params.name && !params.value) {
                attributeNames = [];
                _.forEach(elm.domElm.attributes, function(attribute) {
                    attributeNames.push(attribute.nodeName);
                });
                return stringMatchScores(attributeNames, params.name, true);
            } else if (params.value && !params.name) {
                _.forEach(elm.domElm.attributes, function(attribute) {
                    if (!_.contains(ignoredAttributeNames, attribute.nodeName)) {
                        attributeValues.push(attribute.value);
                    }
                });
                return stringMatchScores(attributeValues, params.value, true);
            } else if (params.name && params.value) {
                attributeValue = elm.domElm.getAttribute(params.name);
                if (!attributeValue) {
                    return 0;
                }
                return stringMatchScore(attributeValue, params.value, true);
            } else {
                return 0;
            }
        };
    }
    function CssClassScorer() {
        this.name = cnst.targetProperty.CSS_CLASS;
        this.scoreElement = function(elm, params) {
            var score = 0;
            var classes;
            if (elm.domElm.className && _.isString(elm.domElm.className)) {
                classes = elm.domElm.className.split(' ');
                score = stringMatchScores(classes, params.value, true);
            }
            return score;
        };
    }
    function CssStyleScorer() {
        this.name = cnst.targetProperty.CSS_STYLE;
        this.scoreElement = function(elm, params) {
            var score = 0, keyAndValue, computedStyle;
            computedStyle = html.window.getComputedStyle(elm.domElm);
            keyAndValue = params.value.split(':');
            if (keyAndValue.length === 2 && computedStyle[keyAndValue[0]] && computedStyle[keyAndValue[0]] === keyAndValue[1]) {
                score = 1;
            }
            return score;
        };
    }
    function TextScorer() {
        this.name = cnst.targetProperty.TEXT;
        this.scoreElement = function(elm, params) {
            return stringMatchScores([elm.domElm.text, elm.domElm.value, elm.domElm.innerText, elm.domElm.textContent], params.value, true);
        };
    }
    function ScreenPositionScorer() {
        this.name = cnst.targetProperty.SCREEN_POSITION;
        this.scoreElement = function(elm, params) {
            var score = 0, maxScore = 0;
            var elmRect = elm.getRect();
            if (elmRect.width === 0 || elmRect.height === 0) {
                return 0;
            }
            var type = params.value;
            if (type === cnst.screenPosition.MIDDLE) {
                maxScore = Math.max(maxScore, this.scoreElement(elm, {value: cnst.screenPosition.LEFT}));
                maxScore = Math.max(maxScore, this.scoreElement(elm, {value: cnst.screenPosition.RIGHT}));
                maxScore = Math.max(maxScore, this.scoreElement(elm, {value: cnst.screenPosition.TOP}));
                maxScore = Math.max(maxScore, this.scoreElement(elm, {value: cnst.screenPosition.BOTTOM}));
                score = 1 - maxScore;
                score = score <= 0.6 ? 0 : (score - 0.6) * 2.5;
                return score;
            } else if (type === cnst.screenPosition.LEFT || type === cnst.screenPosition.RIGHT) {
                score = ((elmRect.left + elmRect.right) / 2.0) / html.bodyRect.right;
            } else if (type === cnst.screenPosition.TOP || type === cnst.screenPosition.BOTTOM) {
                score = ((elmRect.top + elmRect.bottom) / 2.0) / html.bodyRect.bottom;
            }
            score = getBoundScore(score);
            if ((type === cnst.screenPosition.LEFT || type === cnst.screenPosition.TOP)) {
                score = 1 - score;
            }
            score = score <= 0.6 ? 0 : (score - 0.6) * 2.5;
            return score;
        };
    }
    function SizeScorer() {
        this.name = cnst.targetProperty.SIZE;
        this.scoreElement = function(elm, params) {
            var score, type, SMALL = 32*32, LARGE = 128*128;
            var elmRect = elm.getRect();
            var size = elmRect.width * elmRect.height;
            if (size === 0) {
                return 0;
            }
            type = params.value;
            if (type === cnst.elementSize.S) {
                if (size < SMALL) {
                    score = 1;
                } else if (size > LARGE) {
                    score = 0;
                } else {
                    score = (size-SMALL) / (LARGE-SMALL);
                    score = 1 - score;
                }
            } else if (type === cnst.elementSize.L) {
                if (size > LARGE) {
                    score = 1;
                } else if (size < SMALL) {
                    score = 0;
                } else {
                    score = (size-SMALL) / (LARGE-SMALL);
                }
            } else if (type === cnst.elementSize.M) {
                if (size < SMALL || size > LARGE) {
                    score = 0;
                } else {
                    score = Math.abs(((LARGE-SMALL) / 2) - size) / ((LARGE-SMALL) / 2);
                }
            } else {
                score = 0;
            }
            return score;
        };
    }
    function RelPositionScorer() {
        this.name = cnst.relationType.REL_LOCATION;
        this.scoreRelation = function(elm1, elm2, params) {
            var score = 0;
            var elmRect1 = elm1.getRect();
            var elmRect2 = elm2.getRect();
            if (elmRect1.width === 0 || elmRect1.height === 0 || elmRect2.width === 0 || elmRect2.height === 0) {
                return 0;
            }
            if (params.value === cnst.relLocationType.RIGHT_OF) {
                if ((elmRect1.left >= elmRect2.right) &&
                    (elmRect1.top < elmRect2.bottom) &&
                    (elmRect1.bottom > elmRect2.top)) {
                    score = getPartialScore(elmRect1.left - elmRect2.right, html.bodyRect.right, true);
                }
            } else if (params.value === cnst.relLocationType.LEFT_OF) {
                if ((elmRect2.left >= elmRect1.right) &&
                    (elmRect2.top < elmRect1.bottom) &&
                    (elmRect2.bottom > elmRect1.top)) {
                    score = getPartialScore(elmRect2.left - elmRect1.right, html.bodyRect.right, true);
                }
            } else if (params.value === cnst.relLocationType.BELOW) {
                if ((elmRect1.top >= elmRect2.bottom) &&
                    (elmRect1.left < elmRect2.right) &&
                    (elmRect1.right > elmRect2.left)) {
                    score = getPartialScore(elmRect1.bottom - elmRect2.top, html.bodyRect.bottom, true);
                }
            } else if (params.value === cnst.relLocationType.ABOVE) {
                if ((elmRect2.top >= elmRect1.bottom) &&
                    (elmRect2.left < elmRect1.right) &&
                    (elmRect2.right > elmRect1.left)) {
                    score = getPartialScore(elmRect2.bottom - elmRect1.top, html.bodyRect.bottom, true);
                }
            } else if (params.value === cnst.relLocationType.NEAR) {
                var deltaX = Math.abs( (elmRect1.left + (elmRect1.right - elmRect1.left)/2) - (elmRect2.left + (elmRect2.right - elmRect2.left)/2) );
                var deltaY = Math.abs( (elmRect1.top + (elmRect1.bottom - elmRect1.top)/2) - (elmRect2.top + (elmRect2.bottom - elmRect2.top)/2) );
                var dist = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
                var maxDist = Math.sqrt(Math.pow(300, 2) + Math.pow(300, 2));
                score = getPartialScore(dist, maxDist, true);
            } else if (params.value === cnst.relLocationType.INSIDE) {
                if ((elmRect1.left >= elmRect2.left) &&
                    (elmRect1.top >= elmRect2.top) &&
                    (elmRect1.right <= elmRect2.right) &&
                    (elmRect1.bottom <= elmRect2.bottom))
                {
                    score = 1;
                }
            }
            return score;
        };
    }
    function createScorers() {
        scorers = [
            new ElementTagScorer(),
            new ElementAttributeScorer(),
            new CssClassScorer(),
            new CssStyleScorer(),
            new TextScorer(),
            new ScreenPositionScorer(),
            new SizeScorer(),
            new RelPositionScorer()
        ];
    }
    function getScorer(type) {
        var scorer = null, found = false;
        _.forEach(scorers, function(sc) {
            if (!found && sc.name === type) {
                scorer = sc;
                found = true;
            }
        });
        if (scorer) {
            //___DBG('Found scorer for type ' + type);
        } else {
            //___WRN('Unable to find scorer for type ' + type);
        }
        return scorer;
    }
    // SCORERS ---------------------------------------------------------------------------------------------------------





    // MODEL -----------------------------------------------------------------------------------------------------------
    function Feature(type, params, weight) {
        var that = this;
        //___DBG('type:' + type + ', params:' + params + ', weight:' + weight);
        that.type = type;
        that.params = params;
        that.weight = weight;
        that.elmsScores = [];
        that.scoreElms = function(elements) {
            var score = 0;
            var scorer;
            //___START('Feature.scoreElms');
            scorer = getScorer(that.type);
            if (scorer) {
                _.forEach(elements, function (elm) {
                    score = scorer.scoreElement(elm, that.params);
                    if (score > 0) {
                        that.elmsScores.push({
                            id: elm.id,
                            score: score
                        });
                        //___DBG('Scorer:' + scorer.name + (params.name ? ', params.name:' + params.name : '') + (params.value ? ', params.value:' + params.value : '') + ', id:' + elm.id + ', score: ' + score);
                    }
                });
                normalizeElmsScores(that.elmsScores);
            }
        };
    }
    function Relation(type, params, weight) {
        var that = this;
        that.type = type;
        that.params = params;
        that.weight = weight;
        that.relTarget = new Target();
        that.scoreRelation = function(elm1, elm2) {
            var score = 0;
            var scorer = getScorer(that.type);
            if (scorer) {
                score = scorer.scoreRelation(elm1, elm2, that.params);
            }
            return score;
        };
    }
    function Target() {
        var that = this;
        //___START('Target');
        that.type = cnst.targetType.ELEMENT;
        that.groups = [];
        that.relations = [];
        that.elmsScores = [];
        that.ordinal = undefined;
        that.setType = function(type) {
            //___START('Target.setType');
            that.type = type;
        };
        that.addOrdinal = function addOrdinal(ordinal) {
            that.ordinal = ordinal;
        };
        that.addFeature = function(type, params, weight, groupName) {
            var gr, grName, feature;
            //___START('Target.addFeature');
            feature = new Feature(type, params, weight);
            grName = groupName || that.groups.length;
            gr = _.find(that.groups, {groupName: grName});
            if (gr) {
                gr.features.push(feature);
            } else {
                that.groups.push({
                    groupName: grName,
                    features: [feature]
                });
            }
            return feature;
        };
        that.addRelation = function(type, params, weight) {
            var relation;
            //___START('Target.addRelation');
            relation = new Relation(type, params, weight);
            that.relations.push(relation);
            return relation;
        };
        that.addScore = function(id, score, weight) {
            //___START('Target.addScore');
            var es = _.find(that.elmsScores, {id: id});
            if (es) {
                es.score += score * weight;
                //___DBG('id:' + es.id + ', tempScore:' + es.score);
            } else {
                that.elmsScores.push({
                    id: id,
                    score: score * weight
                });
                //___DBG('id:' + id + ', tempScore:' + score * weight);
            }
        };
        that.scoreElms = function(elements) {
            var id1, id2, tmpScore, maxScore, es, maxElmScores;
            //___START('Target.scoreElms');
            _.forEach(that.groups, function (group) {
                maxElmScores = [];
                _.forEach(group.features, function (feature) {
                    feature.scoreElms(elements);
                    _.forEach(feature.elmsScores, function (elmScore) {
                        es = _.find(maxElmScores, {id: elmScore.id});
                        if (es) {
                            es.score = Math.max(es.score, elmScore.score * feature.weight);
                        } else {
                            maxElmScores.push({
                                id: elmScore.id,
                                score: elmScore.score * feature.weight
                            });
                        }
                    });
                });
                _.forEach(maxElmScores, function (elmScore) {
                    that.addScore(elmScore.id, elmScore.score, 1);
                });
            });
            _.forEach(that.relations, function (relation) {
                relation.relTarget.scoreElms(elements);
                _.forEach(that.elmsScores, function(target1elmScore) {
                    maxScore = 0;
                    _.forEach(relation.relTarget.elmsScores, function (target2elmScore) {
                        id1 = elements[target1elmScore.id];
                        id2 = elements[target2elmScore.id];
                        if (id1 !== id2) {
                            tmpScore = target2elmScore.score * relation.scoreRelation(id1, id2);
                            maxScore = Math.max(maxScore, tmpScore);
                        }
                    });
                    that.addScore(target1elmScore.id, maxScore, relation.weight);
                });
            });
            normalizeElmsScores(that.elmsScores);

            //ordinal
            if (that.ordinal) {
                var count = 0;
                _.forEach(that.elmsScores, function(elmScore) {
                    if (elmScore.score >= 0.9) {
                        count++;
                        if (count === that.ordinal) {
                            elmScore.score += 1.1;
                        }
                    }
                });
                normalizeElmsScores(that.elmsScores);
            }
        };
    }
    function Model() {
        var that = this;
        that.scoreElements = function scoreElements(elements) {
            //___START('Model.scoreElements');
            if (that.target) {
                that.target.scoreElms(elements);
                _.forEach(that.target.elmsScores, function (elmScore) {
                    elements[elmScore.id].score = elmScore.score;
                });
            }
        };
    }
    // MODEL -----------------------------------------------------------------------------------------------------------





    // CREATOR ---------------------------------------------------------------------------------------------------------
    function ModelCreator(settings) {
        var that = this;
        that.settings = settings;
        that.getStr = function getStr(strs, i) {
            if (i >= 0 && i < strs.length) {
                return strs[i];
            }
            return '';
        };
        that.setTargetType = function setTargetType(target, type) {
            target.setType(type);
        };
        that.addTagFeature = function addTagFeature(target, tag, weight, groupName) {
            return target.addFeature(cnst.targetProperty.ELEMENT_TAG, {value: tag}, weight, groupName);
        };
        that.addClassFeature = function addClassFeature(target, cssClass, weight, groupName) {
            return target.addFeature(cnst.targetProperty.CSS_CLASS, {value: cssClass}, weight, groupName);
        };
        that.addStyleFeature = function addStyleFeature(target, cssStyle, weight, groupName) {
            return target.addFeature(cnst.targetProperty.CSS_STYLE, {value: cssStyle}, weight, groupName);
        };
        that.addAttrFeature = function addAttrFeature(target, name, value, weight, groupName) {
            return target.addFeature(cnst.targetProperty.ELEMENT_ATTRIBUTE, {name: name, value: value}, weight, groupName);
        };
        that.addSizeFeature = function addSizeFeature(target, type, weight, groupName) {
            if (type === cnst.keyword.SMALL) {
                return target.addFeature(cnst.targetProperty.SIZE, {value: cnst.elementSize.S}, weight, groupName);
            } else if (type === cnst.keyword.MEDIUM) {
                return target.addFeature(cnst.targetProperty.SIZE, {value: cnst.elementSize.M}, weight, groupName);
            } else if (type === cnst.keyword.LARGE) {
                return target.addFeature(cnst.targetProperty.SIZE, {value: cnst.elementSize.L}, weight, groupName);
            }
        };
        that.addElementFeatures = function addInputFeatures(target, text, weight) {
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
            }
        };
        that.addIdentityFeatures = function addIdentityFeatures(target, text, weight) {
            that.addAttrFeature(target, 'id', text, weight, 'identity1');
            that.addAttrFeature(target, 'name', text, weight, 'identity1');
            that.addAttrFeature(target, 'ng-model', text, weight, 'identity1');
            that.addAttrFeature(target, 'data-aid', text, weight, 'identity1');
        };
        that.addButtonFeatures = function addButtonFeatures(target, text, weight) {
            that.addTagFeature(target, 'button', weight * 2, 'button1');
            that.addTagFeature(target, 'a', weight * 2, 'button1');
            that.addFreeTextFeatures(target, 'button', weight / 2, 'button2');
            that.addFreeTextFeatures(target, 'btn', weight / 2, 'button2');
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
            }
        };
        that.addLinkFeatures = function addLinkFeatures(target, text, weight) {
            that.addTagFeature(target, 'a', weight * 2, 'button1');
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
            }
        };
        that.addInputFeatures = function addInputFeatures(target, text, weight) {
            var relation;
            that.addTagFeature(target, 'input', weight * 2, 'input1');
            that.addTagFeature(target, 'textarea', weight * 2, 'input1');
            that.addClassFeature(target, 'alm-input-box', weight * 2, 'input1');
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.RIGHT_OF}, weight);
                that.setTargetType(relation.relTarget, cnst.targetType.LABEL);
                that.addLabelFeatures(relation.relTarget, text, weight);
            }
        };
        that.addCheckboxFeatures = function addCheckboxFeatures(target, text, weight) {
            var relation;
            that.addTagFeature(target, 'input', weight * 2, 'checkbox1');
            that.addAttrFeature(target, 'type', 'checkbox', weight * 2, 'checkbox1');
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.LEFT_OF}, weight);
                that.setTargetType(relation.relTarget, cnst.targetType.LABEL);
                that.addLabelFeatures(relation.relTarget, text, weight);
            }
        };
        that.addLabelFeatures = function addLabelFeatures(target, text, weight) {
            that.addTagFeature(target, 'label', weight * 2, 'label1');
            that.addTagFeature(target, 'span', weight * 2, 'label1');
            that.addTagFeature(target, 'a', weight, 'label1');
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
            }
        };
        that.addImageFeatures = function addImageFeatures(target, text, weight) {
            that.addTagFeature(target, 'img', weight * 2, 'image1');
            that.addTagFeature(target, 'svg', weight * 2, 'image1');
            that.addTagFeature(target, 'i', weight / 2, 'image1');
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
            }
        };
        that.addItemFeatures = function addItemFeatures(target, text, weight) {
            that.addTagFeature(target, 'li', weight * 2, 'item1');
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
            }
        };
        that.addToolbarFeatures = function addToolbarFeatures(target, weight) {
            that.addTagFeature(target, 'div', weight * 2);
            that.addIdentityFeatures(target, 'toolbar', weight, 'toolbar1');
            that.addClassFeature(target, 'toolbar', weight, 'toolbar1');
            that.addAttrFeature(target, 'toolbar', null, weight, 'toolbar1');
            that.addAttrFeature(target, null, 'toolbar', weight, 'toolbar1');
            target.addFeature(cnst.targetProperty.SIZE, {value: cnst.elementSize.L}, weight);
        };
        that.addPanelFeatures = function addPanelFeatures(target, text, weight) {
            that.addTagFeature(target, 'div', weight * 2);
            that.addSizeFeature(target, cnst.elementSize.L, weight);
            if (text) {
                that.addFreeTextFeatures(target, text, weight);
            }
        };
        that.addTextFeatures = function addTextFeatures(target, text, weight) {
            target.addFeature(cnst.targetProperty.TEXT, {value: text}, weight);
        };
        that.addFreeTextFeatures = function addFreeTextFeatures(target, text, weight) {
            target.addFeature(cnst.targetProperty.TEXT, {value: text}, weight);
            that.addClassFeature(target, text, weight / 2, 'text1');
            that.addIdentityFeatures(target, text, weight / 2, 'text1');
            that.addAttrFeature(target, text, null, weight / 2, 'text1');
            that.addAttrFeature(target, null, text, weight / 2, 'text1');
        };
        that.addScreenPositionFeatures = function addScreenPositionFeatures(target, type, weight) {
            if (type === cnst.keyword.AT_THE_TOP) {
                target.addFeature(cnst.targetProperty.SCREEN_POSITION, {value: cnst.screenPosition.TOP}, weight);
            } else if (type === cnst.keyword.AT_THE_BOTTOM) {
                target.addFeature(cnst.targetProperty.SCREEN_POSITION, {value: cnst.screenPosition.BOTTOM}, weight);
            } else if (type === cnst.keyword.ON_THE_LEFT) {
                target.addFeature(cnst.targetProperty.SCREEN_POSITION, {value: cnst.screenPosition.LEFT}, weight);
            } else if (type === cnst.keyword.ON_THE_RIGHT) {
                target.addFeature(cnst.targetProperty.SCREEN_POSITION, {value: cnst.screenPosition.RIGHT}, weight);
            } else if (type === cnst.keyword.ON_THE_MIDDLE) {
                target.addFeature(cnst.targetProperty.SCREEN_POSITION, {value: cnst.screenPosition.MIDDLE}, weight);
            }
        };
        that.addOrdinal = function addOrdinal(target, ordinal) {
            target.addOrdinal(ordinal);
        };
        that.addRelativeLocationFeatures = function addRelativeLocationFeatures(target, type, weight) {
            var relation;
            if (type === cnst.keyword.RIGHT_OF) {
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.RIGHT_OF}, weight * 2);
            } else if (type === cnst.keyword.LEFT_OF) {
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.LEFT_OF}, weight * 2);
            } else if (type === cnst.keyword.ABOVE) {
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.ABOVE}, weight * 2);
            } else if (type === cnst.keyword.BELOW) {
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.BELOW}, weight * 2);
            } else if (type === cnst.keyword.NEAR) {
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.NEAR}, weight * 2);
            } else if (type === cnst.keyword.INSIDE) {
                relation = target.addRelation(cnst.relationType.REL_LOCATION, {value: cnst.relLocationType.INSIDE}, weight * 2);
            }
            return relation;
        };
        that.createModel = function createModel(words) {
            var model = new Model();
            var i, ok, target, targetCount, relation, attr, adjectivesPart, str1, str2, freeText, typeSpecified;
            function handleTargetType(target, type) {
                that.setTargetType(target, type);
                typeSpecified = true;
                adjectivesPart = false;
                freeText = '';
            }
            //___START('ModelCreator.createModel');
            //___DBG(words);
            target = new Target();
            model.target = target;
            targetCount = 1;
            adjectivesPart = true;
            freeText = '';
            typeSpecified = false;
            ok = true;
            i = 0;
            do {
                str1 = that.getStr(words, i);
                str2 = that.getStr(words, i + 1);
                if (adjectivesPart && str1 === '1st') {
                    that.addOrdinal(target, 1);
                } else if (adjectivesPart && str1 === '2nd') {
                    that.addOrdinal(target, 2);
                } else if (adjectivesPart && str1 === '3rd') {
                    that.addOrdinal(target, 3);
                } else if (adjectivesPart && str1 === '4th') {
                    that.addOrdinal(target, 4);
                } else if (adjectivesPart && str1 === '5th') {
                    that.addOrdinal(target, 5);
                } else if (adjectivesPart && str1 === '6th') {
                    that.addOrdinal(target, 6);
                } else if (adjectivesPart && str1 === '7th') {
                    that.addOrdinal(target, 7);
                } else if (adjectivesPart && str1 === '8th') {
                    that.addOrdinal(target, 8);
                } else if (adjectivesPart && str1 === '9th') {
                    that.addOrdinal(target, 9);
                } else if (adjectivesPart && str1 === '10th') {
                    that.addOrdinal(target, 10);
                } else if (adjectivesPart && (str1 === cnst.keyword.SMALL || str1 === cnst.keyword.MEDIUM || str1 === cnst.keyword.LARGE)) {
                    that.addSizeFeature(target, str1, 1);
                } else if (str1 === cnst.keyword.ELEMENT) {
                    that.addElementFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.ELEMENT);
                } else if (str1 === cnst.keyword.BUTTON) {
                    that.addButtonFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.BUTTON);
                } else if (str1 === cnst.keyword.LINK) {
                    that.addLinkFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.LINK);
                } else if (str1 === cnst.keyword.INPUT) {
                    that.addInputFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.INPUT);
                } else if (str1 === cnst.keyword.CHECKBOX) {
                    that.addCheckboxFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.CHECKBOX);
                } else if (str1 === cnst.keyword.LABEL) {
                    that.addLabelFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.LABEL);
                } else if (str1 === cnst.keyword.IMAGE) {
                    that.addImageFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.IMAGE);
                } else if (str1 === cnst.keyword.ITEM) {
                    that.addItemFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.ITEM);
                } else if (str1 === cnst.keyword.TOOLBAR) {
                    that.addToolbarFeatures(target, 1);
                    handleTargetType(target, cnst.targetType.TOOLBAR);
                } else if (str1 === cnst.keyword.PANEL) {
                    that.addPanelFeatures(target, freeText, 1);
                    handleTargetType(target, cnst.targetType.PANEL);
                } else if (adjectivesPart && !_.isEmpty(str1)) {
                    if  (!freeText) {
                        freeText = str1;
                    }
                } else if (str1 === cnst.keyword.TAG) {
                    that.addTagFeature(target, str2, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.CLASS) {
                    that.addClassFeature(target, str2, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.STYLE) {
                    that.addStyleFeature(target, str2, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.ATTR_VALUE) {
                    that.addAttrFeature(target, null, str2, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.ATTR_NAME) {
                    attr = that.addAttrFeature(target, str2, null, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.ATTR_EQUALS) {
                    if (attr) {
                        attr.params.value = str2;
                    }
                    i += 1;
                } else if (str1 === cnst.keyword.WITH_TYPE) {
                    that.addAttrFeature(target, 'type', str2, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.IDENTITY) {
                    that.addIdentityFeatures(target, str2, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.TEXT) {
                    that.addTextFeatures(target, str2, 1);
                    i += 1;
                } else if (str1 === cnst.keyword.AT_THE_TOP || str1 === cnst.keyword.AT_THE_BOTTOM || str1 === cnst.keyword.ON_THE_LEFT || str1 === cnst.keyword.ON_THE_RIGHT || str1 === cnst.keyword.ON_THE_MIDDLE) {
                    that.addScreenPositionFeatures(target, str1, 1);
                } else if (str1 === cnst.keyword.RIGHT_OF || str1 === cnst.keyword.LEFT_OF || str1 === cnst.keyword.ABOVE || str1 === cnst.keyword.BELOW || str1 === cnst.keyword.NEAR || str1 === cnst.keyword.INSIDE) {
                    relation = that.addRelativeLocationFeatures(target, str1, 1);
                    targetCount++;
                    if (targetCount === 2) {
                        target = relation.relTarget;
                    } else if (targetCount > 2) {
                        target = model.target;
                    }
                    freeText = '';
                    typeSpecified = false;
                    adjectivesPart = true;
                } else {
                    ___WRN('Cannot understand what is ' + str1);
                }
                i += 1;
                ok = i < words.length;
            } while (ok);
            if (!typeSpecified && target && freeText) {
                that.addFreeTextFeatures(target, freeText, 1);
            }
            return model;
        };
    }
    // CREATOR ---------------------------------------------------------------------------------------------------------





    // PARSER ----------------------------------------------------------------------------------------------------------
    function TextParser(settings) {
        var that = this;
        that.settings = settings;
        that.parseTextToWords = function parseTextToWords(text) {
            var words = [];
            var strs, str, wordLowerCase, i, insideQuotes, txt;
            //___START('TextParser.parseTextToWords');
            //___DBG('Input text is ' + text);
            txt = text;
            txt = txt.replace(/\b(with tag|and tag|or tag)\b/gi, cnst.keyword.TAG);
            txt = txt.replace(/\b(with class|and class|or class)\b/gi, cnst.keyword.CLASS);
            txt = txt.replace(/\b(with style|and style|or style)\b/gi, cnst.keyword.STYLE);
            txt = txt.replace(/\b(with attribute value|and attribute value|or attribute value|with attr value|and attr value|or attr value)\b/gi, cnst.keyword.ATTR_VALUE);
            txt = txt.replace(/\b(with attribute|and attribute|or attribute|with attr|and attr|or attr)\b/gi, cnst.keyword.ATTR_NAME);
            txt = txt.replace(/\b(equals to)\b/gi, cnst.keyword.ATTR_EQUALS);
            txt = txt.replace(/\b(with type|and type|or type)\b/gi, cnst.keyword.WITH_TYPE);
            txt = txt.replace(/\b(with identity|and identity|or identity)\b/gi, cnst.keyword.IDENTITY);
            txt = txt.replace(/\b(with text|and text|or text)\b/gi, cnst.keyword.TEXT);
            txt = txt.replace(/\b(at the top)\b/gi, cnst.keyword.AT_THE_TOP);
            txt = txt.replace(/\b(at the bottom)\b/gi, cnst.keyword.AT_THE_BOTTOM);
            txt = txt.replace(/\b(on the left)\b/gi, cnst.keyword.ON_THE_LEFT);
            txt = txt.replace(/\b(on the right)\b/gi, cnst.keyword.ON_THE_RIGHT);
            txt = txt.replace(/\b(on the middle)\b/gi, cnst.keyword.ON_THE_MIDDLE);
            txt = txt.replace(/\b(right of)\b/gi, cnst.keyword.RIGHT_OF);
            txt = txt.replace(/\b(left of)\b/gi, cnst.keyword.LEFT_OF);
            txt = txt.replace(/\b(the toolbar)\b/gi, cnst.keyword.TOOLBAR);
            strs = txt.split(' ');
            insideQuotes = false;
            for (i = 0; i < strs.length; i++) {
                str = strs[i];
                if (str === '') {
                    continue;
                }
                if (quoted(str)) {
                    words.push(str);
                } else if (quoteStart(str) && !quoteEnd(str)) {
                    words.push(str);
                    insideQuotes = true;
                } else if (quoteEnd(str) && !quoteStart(str)) {
                    words[words.length - 1] += (' ' + str);
                    insideQuotes = false;
                } else if (insideQuotes) {
                    words[words.length - 1] += (' ' + str);
                } else {
                    words.push(str);
                }
            }
            for (i = 0; i < words.length; i++) {
                if (quoted(words[i])) {
                    words[i] = unQuote(words[i]);
                    continue;
                }
                wordLowerCase = words[i].toLowerCase();
                if (wordLowerCase === 'small') { words[i] = cnst.keyword.SMALL; }
                if (wordLowerCase === 'medium') { words[i] = cnst.keyword.MEDIUM; }
                if (wordLowerCase === 'large') { words[i] = cnst.keyword.LARGE; }
                if (wordLowerCase === 'element' || wordLowerCase === 'elm') { words[i] = cnst.keyword.ELEMENT; }
                if (wordLowerCase === 'button' || wordLowerCase === 'btn') { words[i] = cnst.keyword.BUTTON; }
                if (wordLowerCase === 'link' || wordLowerCase === 'lnk' || wordLowerCase === 'dropdown' || wordLowerCase === 'item') { words[i] = cnst.keyword.LINK; }
                if (wordLowerCase === 'input' || wordLowerCase === 'inp') { words[i] = cnst.keyword.INPUT; }
                if (wordLowerCase === 'checkbox' || wordLowerCase === 'chk') { words[i] = cnst.keyword.CHECKBOX; }
                if (wordLowerCase === 'label' || wordLowerCase === 'lbl') { words[i] = cnst.keyword.LABEL; }
                if (wordLowerCase === 'image' || wordLowerCase === 'img') { words[i] = cnst.keyword.IMAGE; }
                if (wordLowerCase === 'panel' || wordLowerCase === 'pnl') { words[i] = cnst.keyword.PANEL; }
                //if (wordLowerCase === 'item') { words[i] = cnst.keyword.ITEM; }
                if (wordLowerCase === 'toolbar') { words[i] = cnst.keyword.TOOLBAR; }
                if (wordLowerCase === 'above') { words[i] = cnst.keyword.ABOVE; }
                if (wordLowerCase === 'below') { words[i] = cnst.keyword.BELOW; }
                if (wordLowerCase === 'near') { words[i] = cnst.keyword.NEAR; }
                if (wordLowerCase === 'inside') { words[i] = cnst.keyword.INSIDE; }
                if (wordLowerCase === 'equals') { words[i] = cnst.keyword.ATTR_EQUALS; }
            }
            return words;
        };
    }
    // PARSER ----------------------------------------------------------------------------------------------------------





    // RUN -------------------------------------------------------------------------------------------------------------
    function shouldRun(e) {
        return shouldRunImmediately(e) || shouldRunDelayed(e);
    }
    function shouldRunImmediately(e) {
        return e.shiftKey && (e.keyCode === 'a'.charCodeAt(0) || e.charCode === 'a'.charCodeAt(0) || e.keyCode === 'A'.charCodeAt(0) || e.charCode === 'A'.charCodeAt(0));
    }
    function shouldRunDelayed(e) {
        return e.shiftKey && (e.keyCode === 's'.charCodeAt(0) || e.charCode === 's'.charCodeAt(0) || e.keyCode === 'S'.charCodeAt(0) || e.charCode === 'S'.charCodeAt(0));
    }
    function getHtmlInteractiveInputLine() {
        return html.document.getElementById(cnst.html.ARTEMIS_LINE_ID);
    }
    function goMark(text) {
        var textParser, words, modelCreator, model;
        ___DBG('goMark() text:' + text);
        markingInProgress = true;
        unMarkElements(elements);
        prepareHtmlObjs();
        elements = getElms(html.relevantDomElms);
        textParser = new TextParser({});
        words = textParser.parseTextToWords(text);
        modelCreator = new ModelCreator({});
        model = modelCreator.createModel(words);
        model.scoreElements(elements);
        markElements(elements);
    }
    function artemisGoMark(text) {
        //___DBG('Executing artemisGoMark() with text ' + text);
        getHtmlInteractiveInputLine().value = text;
        goMark(text);
    }
    function goUnMark() {
        ___DBG('goUnMark()');
        getHtmlInteractiveInputLine().value = '';
        unMarkElements(elements);
        markingInProgress = false;
    }
    function artemisGoUnMark(text) {
        //___DBG('Executing artemisGoUnMark()');
        goUnMark(text);
        return 'ok';
    }
    function onMyKeyPress(e) {
        var interactiveLine, textChanged;
        if (!shouldRun(e)) {
            return true;
        }
        interactiveLine = getHtmlInteractiveInputLine();
        textChanged = interactiveLine.value !== inputText;
        inputText = interactiveLine.value;
        html.window.setTimeout(function() {
            interactiveLine.value = inputText;
        }, 0);
        if (textChanged || !markingInProgress) {
            if (inputText === 'help') {
                goHelp(true);
            } else {
                if (shouldRunImmediately(e)) {
                    goMark(inputText);
                } else {
                    html.window.setTimeout(function() {
                        goMark(inputText);
                    }, 3000);
                }
            }
        } else {
            goUnMark();
        }
        return false;
    }
    // RUN -------------------------------------------------------------------------------------------------------------

    init();

    if (typeof io !== 'undefined') {
        var clearAll = function clearAll() {
            document.artemisGoUnMark();
        };
        var findElm = function findElm(desc) {
            var i, elm;
            document.artemisGoMark(desc);
            for (i = 0; i < elements.length; i++) {
                if (elements[i].score === 1) {
                    elm = elements[i];
                    break;
                }
            }
            return elm;
        };
        var socket = io('http://localhost:3333/');
        socket.emit('client', true);
        socket.on('ide2client', function (msg) {
            var elm;
            if (msg.action === 'clear') {
                clearAll();
            } else if (msg.action === 'find') {
                findElm(msg.target);
            } else if (msg.action === 'do' && msg.command === 'click') {
                elm = findElm(msg.target);
                if (!elm) {
                    return;
                }
                if (typeof angular !== 'undefined') {
					angular.element(elm.domElm).trigger('click');
				} else {
					elm.domElm.click();
				}
			} else if (msg.action === 'do' && (msg.command === 'setText' || msg.command === 'clearText')) {
                elm = findElm(msg.target);
                if (!elm) {
                    return;
                }
                if (typeof angular !== 'undefined') {
					angular.element(elm.domElm).trigger('click');
				} else {
					elm.domElm.click();
				}
                setTimeout(function () {
                    elm = findElm(msg.target);
                    if (!elm) {
                        return;
                    }
                    elm.domElm.value = msg.command === 'setText' ? msg.value : '';
                    if (typeof angular !== 'undefined') {
						angular.element(elm.domElm).trigger('keydown');
						angular.element(elm.domElm).trigger('change');
					} else {
						elm.domElm.keydown();
						elm.domElm.change();
					}
					
                }, 0);
            }
        });
    }

})();