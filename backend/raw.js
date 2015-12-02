! function($) {
    "use strict";
    var Fileupload = function(element, options) {
        this.$element = $(element);
        this.type = this.$element.data("uploadtype") || (this.$element.find(".thumbnail").length > 0 ? "image" : "file");
        this.$input = this.$element.find(":file");
        if (this.$input.length === 0) return;
        this.name = this.$input.attr("name") || options.name;
        this.$hidden = this.$element.find(':hidden[name="' + this.name + '"]');
        if (this.$hidden.length === 0) {
            this.$hidden = $('<input type="hidden" />');
            this.$element.prepend(this.$hidden)
        }
        this.$preview = this.$element.find(".fileupload-preview");
        var height = this.$preview.css("height");
        if (this.$preview.css("display") != "inline" && height != "0px" && height != "none") this.$preview.css("line-height", height);
        this.$remove = this.$element.find('[data-dismiss="fileupload"]');
        this.$element.find('[data-trigger="fileupload"]').on("click.fileupload", $.proxy(this.trigger, this));
        this.listen()
    };
    Fileupload.prototype = {
        listen: function() {
            this.$input.on("change.fileupload", $.proxy(this.change, this));
            if (this.$remove) this.$remove.on("click.fileupload", $.proxy(this.clear, this))
        },
        change: function(e, invoked) {
            var file = e.target.files !== undefined ? e.target.files[0] : e.target.value ? {
                name: e.target.value.replace(/^.+\\/, "")
            } : null;
            if (invoked === "clear") return;
            if (!file) {
                this.clear();
                return
            }
            this.$hidden.val("");
            this.$hidden.attr("name", "");
            this.$input.attr("name", this.name);
            if (this.type === "image" && this.$preview.length > 0 && (typeof file.type !== "undefined" ? file.type.match("image.*") : file.name.match("\\.(gif|png|jpe?g)$")) && typeof FileReader !== "undefined") {
                var reader = new FileReader;
                var preview = this.$preview;
                var element = this.$element;
                reader.onload = function(e) {
                    preview.html('<img src="' + e.target.result + '" ' + (preview.css("max-height") != "none" ? 'style="max-height: ' + preview.css("max-height") + ';"' : "") + " />");
                    element.addClass("fileupload-exists").removeClass("fileupload-new")
                };
                reader.readAsDataURL(file)
            } else {
                this.$preview.text(file.name);
                this.$element.addClass("fileupload-exists").removeClass("fileupload-new")
            }
        },
        clear: function(e) {
            this.$hidden.val("");
            this.$hidden.attr("name", this.name);
            this.$input.attr("name", "");
            this.$input.val("");
            this.$preview.html("");
            this.$element.addClass("fileupload-new").removeClass("fileupload-exists");
            if (e) {
                this.$input.trigger("change", ["clear"]);
                e.preventDefault()
            }
        },
        trigger: function(e) {
            this.$input.trigger("click");
            e.preventDefault()
        }
    };
    $.fn.fileupload = function(options) {
        return this.each(function() {
            var $this = $(this),
                data = $this.data("fileupload");
            if (!data) $this.data("fileupload", data = new Fileupload(this, options))
        })
    };
    $.fn.fileupload.Constructor = Fileupload;
    $(function() {
        $("body").on("click.fileupload.data-api", '[data-provides="fileupload"]', function(e) {
            var $this = $(this);
            if ($this.data("fileupload")) return;
            $this.fileupload($this.data());
            var $target = $(e.target).parents("[data-dismiss=fileupload],[data-trigger=fileupload]").first();
            if ($target.length > 0) {
                $target.trigger("click.fileupload");
                e.preventDefault()
            }
        })
    })
}(window.jQuery);
(function(window, document, $) {
    var isInputSupported = "placeholder" in document.createElement("input"),
        isTextareaSupported = "placeholder" in document.createElement("textarea"),
        prototype = $.fn,
        valHooks = $.valHooks,
        hooks, placeholder;
    if (isInputSupported && isTextareaSupported) {
        placeholder = prototype.placeholder = function() {
            return this
        };
        placeholder.input = placeholder.textarea = true
    } else {
        placeholder = prototype.placeholder = function() {
            var $this = this;
            $this.filter((isInputSupported ? "textarea" : ":input") + "[placeholder]").not(".placeholder").bind({
                "focus.placeholder": clearPlaceholder,
                "blur.placeholder": setPlaceholder
            }).data("placeholder-enabled", true).trigger("blur.placeholder");
            return $this
        };
        placeholder.input = isInputSupported;
        placeholder.textarea = isTextareaSupported;
        hooks = {
            get: function(element) {
                var $element = $(element);
                return $element.data("placeholder-enabled") && $element.hasClass("placeholder") ? "" : element.value
            },
            set: function(element, value) {
                var $element = $(element);
                if (!$element.data("placeholder-enabled")) {
                    return element.value = value
                }
                if (value == "") {
                    element.value = value;
                    if (element != document.activeElement) {
                        setPlaceholder.call(element)
                    }
                } else if ($element.hasClass("placeholder")) {
                    clearPlaceholder.call(element, true, value) || (element.value = value)
                } else {
                    element.value = value
                }
                return $element
            }
        };
        isInputSupported || (valHooks.input = hooks);
        isTextareaSupported || (valHooks.textarea = hooks);
        $(function() {
            $(document).delegate("form", "submit.placeholder", function() {
                var $inputs = $(".placeholder", this).each(clearPlaceholder);
                setTimeout(function() {
                    $inputs.each(setPlaceholder)
                }, 10)
            })
        });
        $(window).bind("beforeunload.placeholder", function() {
            $(".placeholder").each(function() {
                this.value = ""
            })
        })
    }

    function args(elem) {
        var newAttrs = {},
            rinlinejQuery = /^jQuery\d+$/;
        $.each(elem.attributes, function(i, attr) {
            if (attr.specified && !rinlinejQuery.test(attr.name)) {
                newAttrs[attr.name] = attr.value
            }
        });
        return newAttrs
    }

    function clearPlaceholder(event, value) {
        var input = this,
            $input = $(input);
        if (input.value == $input.attr("placeholder") && $input.hasClass("placeholder")) {
            if ($input.data("placeholder-password")) {
                $input = $input.hide().next().show().attr("id", $input.removeAttr("id").data("placeholder-id"));
                if (event === true) {
                    return $input[0].value = value
                }
                $input.focus()
            } else {
                input.value = "";
                $input.removeClass("placeholder");
                input == document.activeElement && input.select()
            }
        }
    }

    function setPlaceholder() {
        var $replacement, input = this,
            $input = $(input),
            $origInput = $input,
            id = this.id;
        if (input.value == "") {
            if (input.type == "password") {
                if (!$input.data("placeholder-textinput")) {
                    try {
                        $replacement = $input.clone().attr({
                            type: "text"
                        })
                    } catch (e) {
                        $replacement = $("<input>").attr($.extend(args(this), {
                            type: "text"
                        }))
                    }
                    $replacement.removeAttr("name").data({
                        "placeholder-password": true,
                        "placeholder-id": id
                    }).bind("focus.placeholder", clearPlaceholder);
                    $input.data({
                        "placeholder-textinput": $replacement,
                        "placeholder-id": id
                    }).before($replacement)
                }
                $input = $input.removeAttr("id").hide().prev().attr("id", id).show()
            }
            $input.addClass("placeholder");
            $input[0].value = $input.attr("placeholder")
        } else {
            $input.removeClass("placeholder")
        }
    }
})(this, document, jQuery);
(function($) {
    $.fn.youtubeLink = function(options) {
        var settings = {
            target: "embed"
        };
        if (options) {
            $.extend(settings, options)
        }
        return this.each(function() {
            $(this).bind("click", function(e) {
                var poster = $(this).find("img").first();
                if (poster) {
                    e.preventDefault();
                    var title = $(this).attr("data-title");
                    var video_id = $(this).attr("href").replace("//www.youtube.com/watch?v=", "");
                    var iframe = $("<iframe>").attr({
                        src: "//www.youtube.com/embed/" + video_id + "?rel=0&amp;&autoplay=1",
                        frameborder: 0,
                        allowfullscreen: true
                    });
                    switch (settings.target) {
                        case "embed":
                            iframe.attr({
                                width: poster.attr("width"),
                                height: poster.attr("height")
                            });
                            $(this).html(iframe);
                            break;
                        case "dialog":
                            iframe.attr({
                                width: 620,
                                height: 470
                            });
                            iframe.dialog({
                                width: 640,
                                height: 480,
                                modal: true,
                                title: title,
                                close: function(event, ui) {
                                    iframe.remove()
                                }
                            });
                            iframe.css({
                                width: 620,
                                height: 470
                            });
                            break
                    }
                }
            })
        })
    }
})(jQuery);
(function($) {
    $.fn.rateit = function(p1, p2) {
        var options = {};
        var mode = "init";
        var capitaliseFirstLetter = function(string) {
            return string.charAt(0).toUpperCase() + string.substr(1)
        };
        if (this.length == 0) return this;
        var tp1 = $.type(p1);
        if (tp1 == "object" || p1 === undefined || p1 == null) {
            options = $.extend({}, $.fn.rateit.defaults, p1)
        } else if (tp1 == "string" && p2 === undefined) {
            return this.data("rateit" + capitaliseFirstLetter(p1))
        } else if (tp1 == "string") {
            mode = "setvalue"
        }
        return this.each(function() {
            var item = $(this);
            var itemdata = function(key, value) {
                arguments[0] = "rateit" + capitaliseFirstLetter(key);
                return item.data.apply(item, arguments)
            };
            if (!item.hasClass("rateit")) item.addClass("rateit");
            var ltr = item.css("direction") != "rtl";
            if (mode == "setvalue") {
                if (!itemdata("init")) throw "Can't set value before init";
                if (p1 == "readonly" && !itemdata("readonly")) {
                    item.find(".rateit-range").unbind();
                    itemdata("wired", false)
                }
                if (p1 == "value" && p2 == null) p2 = itemdata("min");
                if (itemdata("backingfld")) {
                    var fld = $(itemdata("backingfld"));
                    if (p1 == "value") fld.val(p2);
                    if (p1 == "min" && fld[0].min) fld[0].min = p2;
                    if (p1 == "max" && fld[0].max) fld[0].max = p2;
                    if (p1 == "step" && fld[0].step) fld[0].step = p2
                }
                itemdata(p1, p2)
            }
            if (!itemdata("init")) {
                itemdata("min", itemdata("min") || options.min);
                itemdata("max", itemdata("max") || options.max);
                itemdata("step", itemdata("step") || options.step);
                itemdata("readonly", itemdata("readonly") !== undefined ? itemdata("readonly") : options.readonly);
                itemdata("resetable", itemdata("resetable") !== undefined ? itemdata("resetable") : options.resetable);
                itemdata("backingfld", itemdata("backingfld") || options.backingfld);
                itemdata("starwidth", itemdata("starwidth") || options.starwidth);
                itemdata("starheight", itemdata("starheight") || options.starheight);
                itemdata("value", itemdata("value") || options.value || options.min);
                itemdata("ispreset", itemdata("ispreset") !== undefined ? itemdata("ispreset") : options.ispreset);
                if (itemdata("backingfld")) {
                    var fld = $(itemdata("backingfld"));
                    itemdata("value", fld.hide().val());
                    itemdata("readonly", fld[0].disabled);
                    if (fld[0].nodeName == "INPUT") {
                        if (fld[0].type == "range" || fld[0].type == "text") {
                            itemdata("min", parseInt(fld.attr("min")) || itemdata("min"));
                            itemdata("max", parseInt(fld.attr("max")) || itemdata("max"));
                            itemdata("step", parseInt(fld.attr("step")) || itemdata("step"))
                        }
                    }
                    if (fld[0].nodeName == "SELECT" && fld[0].options.length > 1) {
                        itemdata("min", Number(fld[0].options[0].value));
                        itemdata("max", Number(fld[0].options[fld[0].length - 1].value));
                        itemdata("step", Number(fld[0].options[1].value) - Number(fld[0].options[0].value))
                    }
                }
                item.append('<div class="rateit-reset"></div><div class="rateit-range"><div class="rateit-selected" style="height:' + itemdata("starheight") + 'px"></div><div class="rateit-hover" style="height:' + itemdata("starheight") + 'px"></div></div>');
                if (!ltr) {
                    item.find(".rateit-reset").css("float", "right");
                    item.find(".rateit-selected").addClass("rateit-selected-rtl");
                    item.find(".rateit-hover").addClass("rateit-hover-rtl")
                }
                itemdata("init", true)
            }
            var range = item.find(".rateit-range");
            range.width(itemdata("starwidth") * itemdata("max")).height(itemdata("starheight"));
            var presetclass = "rateit-preset" + (ltr ? "" : "-rtl");
            if (itemdata("ispreset")) item.find(".rateit-selected").addClass(presetclass);
            else item.find(".rateit-selected").removeClass(presetclass);
            if (itemdata("value") != null) {
                var score = (itemdata("value") - itemdata("min")) * itemdata("starwidth");
                item.find(".rateit-selected").width(score)
            }
            var resetbtn = item.find(".rateit-reset");
            var calcRawScore = function(element, event) {
                var pageX = event.changedTouches ? event.changedTouches[0].pageX : event.pageX;
                var offsetx = pageX - $(element).offset().left;
                if (!ltr) offsetx = range.width() - offsetx;
                if (offsetx > range.width()) offsetx = range.width();
                if (offsetx < 0) offsetx = 0;
                return score = Math.ceil(offsetx / itemdata("starwidth") * (1 / itemdata("step")))
            };
            if (!itemdata("readonly")) {
                if (itemdata("resetable")) {
                    resetbtn.click(function() {
                        itemdata("value", itemdata("min"));
                        range.find(".rateit-hover").hide().width(0);
                        range.find(".rateit-selected").width(0).show();
                        if (itemdata("backingfld")) $(itemdata("backingfld")).val(itemdata("min"));
                        item.trigger("reset")
                    })
                } else {
                    resetbtn.hide()
                }
                if (!itemdata("wired")) {
                    range.bind("touchmove touchend", touchHandler);
                    range.mousemove(function(e) {
                        var score = calcRawScore(this, e);
                        var w = score * itemdata("starwidth") * itemdata("step");
                        var h = range.find(".rateit-hover");
                        if (h.data("width") != w) {
                            range.find(".rateit-selected").hide();
                            h.width(w).show().data("width", w);
                            var data = [score * itemdata("step") + itemdata("min")];
                            item.trigger("hover", data).trigger("over", data)
                        }
                    });
                    range.mouseleave(function(e) {
                        range.find(".rateit-hover").hide().width(0).data("width", "");
                        item.trigger("hover", [null]).trigger("over", [null]);
                        range.find(".rateit-selected").show()
                    });
                    range.mouseup(function(e) {
                        var score = calcRawScore(this, e);
                        var newvalue = score * itemdata("step") + itemdata("min");
                        itemdata("value", newvalue);
                        if (itemdata("backingfld")) {
                            $(itemdata("backingfld")).val(newvalue)
                        }
                        if (itemdata("ispreset")) {
                            range.find(".rateit-selected").removeClass(presetclass);
                            itemdata("ispreset", false)
                        }
                        range.find(".rateit-hover").hide();
                        range.find(".rateit-selected").width(score * itemdata("starwidth") * itemdata("step")).show();
                        item.trigger("hover", [null]).trigger("over", [null]).trigger("rated", [newvalue])
                    });
                    itemdata("wired", true)
                }
                if (itemdata("resetable")) {
                    resetbtn.show()
                }
            } else {
                resetbtn.hide()
            }
        })
    };

    function touchHandler(event) {
        var touches = event.originalEvent.changedTouches,
            first = touches[0],
            type = "";
        switch (event.type) {
            case "touchmove":
                type = "mousemove";
                break;
            case "touchend":
                type = "mouseup";
                break;
            default:
                return
        }
        var simulatedEvent = document.createEvent("MouseEvent");
        simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0, null);
        first.target.dispatchEvent(simulatedEvent);
        event.preventDefault()
    }
    $.fn.rateit.defaults = {
        min: 1,
        max: 5,
        step: 1,
        starwidth: 23,
        starheight: 21,
        readonly: false,
        resetable: false,
        ispreset: false
    };
    $(function() {
        $("div.rateit").rateit()
    })
})(jQuery);
(function() {
    var cardFromNumber, cardFromType, cards, defaultFormat, formatBackCardNumber, formatBackExpiry, formatCardNumber, formatExpiry, formatForwardExpiry, formatForwardSlashAndSpace, hasTextSelected, luhnCheck, reFormatCVC, reFormatCardNumber, reFormatExpiry, reFormatNumeric, restrictCVC, restrictCardNumber, restrictExpiry, restrictNumeric, setCardType, __slice = [].slice,
        __indexOf = [].indexOf || function(item) {
            for (var i = 0, l = this.length; i < l; i++) {
                if (i in this && this[i] === item) return i
            }
            return -1
        };
    $.payment = {};
    $.payment.fn = {};
    $.fn.payment = function() {
        var args, method;
        method = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        return $.payment.fn[method].apply(this, args)
    };
    defaultFormat = /(\d{1,4})/g;
    $.payment.cards = cards = [{
        type: "visaelectron",
        pattern: /^4(026|17500|405|508|844|91[37])/,
        format: defaultFormat,
        length: [16],
        cvcLength: [3],
        luhn: true
    }, {
        type: "maestro",
        pattern: /^(5(018|0[23]|[68])|6(39|7))/,
        format: defaultFormat,
        length: [12, 13, 14, 15, 16, 17, 18, 19],
        cvcLength: [3],
        luhn: true
    }, {
        type: "forbrugsforeningen",
        pattern: /^600/,
        format: defaultFormat,
        length: [16],
        cvcLength: [3],
        luhn: true
    }, {
        type: "dankort",
        pattern: /^5019/,
        format: defaultFormat,
        length: [16],
        cvcLength: [3],
        luhn: true
    }, {
        type: "visa",
        pattern: /^4/,
        format: defaultFormat,
        length: [13, 16],
        cvcLength: [3],
        luhn: true
    }, {
        type: "mastercard",
        pattern: /^(5[0-5]|2[2-7])/,
        format: defaultFormat,
        length: [16],
        cvcLength: [3],
        luhn: true
    }, {
        type: "amex",
        pattern: /^3[47]/,
        format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
        length: [15],
        cvcLength: [3, 4],
        luhn: true
    }, {
        type: "dinersclub",
        pattern: /^3[0689]/,
        format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/,
        length: [14],
        cvcLength: [3],
        luhn: true
    }, {
        type: "discover",
        pattern: /^6([045]|22)/,
        format: defaultFormat,
        length: [16],
        cvcLength: [3],
        luhn: true
    }, {
        type: "unionpay",
        pattern: /^(62|88)/,
        format: defaultFormat,
        length: [16, 17, 18, 19],
        cvcLength: [3],
        luhn: false
    }, {
        type: "jcb",
        pattern: /^35/,
        format: defaultFormat,
        length: [16],
        cvcLength: [3],
        luhn: true
    }];
    cardFromNumber = function(num) {
        var card, _i, _len;
        num = (num + "").replace(/\D/g, "");
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
            card = cards[_i];
            if (card.pattern.test(num)) {
                return card
            }
        }
    };
    cardFromType = function(type) {
        var card, _i, _len;
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
            card = cards[_i];
            if (card.type === type) {
                return card
            }
        }
    };
    luhnCheck = function(num) {
        var digit, digits, odd, sum, _i, _len;
        odd = true;
        sum = 0;
        digits = (num + "").split("").reverse();
        for (_i = 0, _len = digits.length; _i < _len; _i++) {
            digit = digits[_i];
            digit = parseInt(digit, 10);
            if (odd = !odd) {
                digit *= 2
            }
            if (digit > 9) {
                digit -= 9
            }
            sum += digit
        }
        return sum % 10 === 0
    };
    hasTextSelected = function($target) {
        var _ref;
        if ($target.prop("selectionStart") != null && $target.prop("selectionStart") !== $target.prop("selectionEnd")) {
            return true
        }
        if ((typeof document !== "undefined" && document !== null ? (_ref = document.selection) != null ? _ref.createRange : void 0 : void 0) != null) {
            if (document.selection.createRange().text) {
                return true
            }
        }
        return false
    };
    reFormatNumeric = function(e) {
        return setTimeout(function() {
            var $target, value;
            $target = $(e.currentTarget);
            value = $target.val();
            value = value.replace(/\D/g, "");
            return $target.val(value)
        })
    };
    reFormatCardNumber = function(e) {
        return setTimeout(function() {
            var $target, value;
            $target = $(e.currentTarget);
            value = $target.val();
            value = $.payment.formatCardNumber(value);
            return $target.val(value)
        })
    };
    formatCardNumber = function(e) {
        var $target, card, digit, length, re, upperLength, value;
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
            return
        }
        $target = $(e.currentTarget);
        value = $target.val();
        card = cardFromNumber(value + digit);
        length = (value.replace(/\D/g, "") + digit).length;
        upperLength = 16;
        if (card) {
            upperLength = card.length[card.length.length - 1]
        }
        if (length >= upperLength) {
            return
        }
        if ($target.prop("selectionStart") != null && $target.prop("selectionStart") !== value.length) {
            return
        }
        if (card && card.type === "amex") {
            re = /^(\d{4}|\d{4}\s\d{6})$/
        } else {
            re = /(?:^|\s)(\d{4})$/
        }
        if (re.test(value)) {
            e.preventDefault();
            return setTimeout(function() {
                return $target.val(value + " " + digit)
            })
        } else if (re.test(value + digit)) {
            e.preventDefault();
            return setTimeout(function() {
                return $target.val(value + digit + " ")
            })
        }
    };
    formatBackCardNumber = function(e) {
        var $target, value;
        $target = $(e.currentTarget);
        value = $target.val();
        if (e.which !== 8) {
            return
        }
        if ($target.prop("selectionStart") != null && $target.prop("selectionStart") !== value.length) {
            return
        }
        if (/\d\s$/.test(value)) {
            e.preventDefault();
            return setTimeout(function() {
                return $target.val(value.replace(/\d\s$/, ""))
            })
        } else if (/\s\d?$/.test(value)) {
            e.preventDefault();
            return setTimeout(function() {
                return $target.val(value.replace(/\d$/, ""))
            })
        }
    };
    reFormatExpiry = function(e) {
        return setTimeout(function() {
            var $target, value;
            $target = $(e.currentTarget);
            value = $target.val();
            value = $.payment.formatExpiry(value);
            return $target.val(value)
        })
    };
    formatExpiry = function(e) {
        var $target, digit, val;
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
            return
        }
        $target = $(e.currentTarget);
        val = $target.val() + digit;
        if (/^\d$/.test(val) && (val !== "0" && val !== "1")) {
            e.preventDefault();
            return setTimeout(function() {
                return $target.val("0" + val + " / ")
            })
        } else if (/^\d\d$/.test(val)) {
            e.preventDefault();
            return setTimeout(function() {
                return $target.val("" + val + " / ")
            })
        }
    };
    formatForwardExpiry = function(e) {
        var $target, digit, val;
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
            return
        }
        $target = $(e.currentTarget);
        val = $target.val();
        if (/^\d\d$/.test(val)) {
            return $target.val("" + val + " / ")
        }
    };
    formatForwardSlashAndSpace = function(e) {
        var $target, val, which;
        which = String.fromCharCode(e.which);
        if (!(which === "/" || which === " ")) {
            return
        }
        $target = $(e.currentTarget);
        val = $target.val();
        if (/^\d$/.test(val) && val !== "0") {
            return $target.val("0" + val + " / ")
        }
    };
    formatBackExpiry = function(e) {
        var $target, value;
        $target = $(e.currentTarget);
        value = $target.val();
        if (e.which !== 8) {
            return
        }
        if ($target.prop("selectionStart") != null && $target.prop("selectionStart") !== value.length) {
            return
        }
        if (/\d\s\/\s$/.test(value)) {
            e.preventDefault();
            return setTimeout(function() {
                return $target.val(value.replace(/\d\s\/\s$/, ""))
            })
        }
    };
    reFormatCVC = function(e) {
        return setTimeout(function() {
            var $target, value;
            $target = $(e.currentTarget);
            value = $target.val();
            value = value.replace(/\D/g, "").slice(0, 4);
            return $target.val(value)
        })
    };
    restrictNumeric = function(e) {
        var input;
        if (e.metaKey || e.ctrlKey) {
            return true
        }
        if (e.which === 32) {
            return false
        }
        if (e.which === 0) {
            return true
        }
        if (e.which < 33) {
            return true
        }
        input = String.fromCharCode(e.which);
        return !!/[\d\s]/.test(input)
    };
    restrictCardNumber = function(e) {
        var $target, card, digit, value;
        $target = $(e.currentTarget);
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
            return
        }
        if (hasTextSelected($target)) {
            return
        }
        value = ($target.val() + digit).replace(/\D/g, "");
        card = cardFromNumber(value);
        if (card) {
            return value.length <= card.length[card.length.length - 1]
        } else {
            return value.length <= 16
        }
    };
    restrictExpiry = function(e) {
        var $target, digit, value;
        $target = $(e.currentTarget);
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
            return
        }
        if (hasTextSelected($target)) {
            return
        }
        value = $target.val() + digit;
        value = value.replace(/\D/g, "");
        if (value.length > 6) {
            return false
        }
    };
    restrictCVC = function(e) {
        var $target, digit, val;
        $target = $(e.currentTarget);
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
            return
        }
        if (hasTextSelected($target)) {
            return
        }
        val = $target.val() + digit;
        return val.length <= 4
    };
    setCardType = function(e) {
        var $target, allTypes, card, cardType, val;
        $target = $(e.currentTarget);
        val = $target.val();
        cardType = $.payment.cardType(val) || "unknown";
        if (!$target.hasClass(cardType)) {
            allTypes = function() {
                var _i, _len, _results;
                _results = [];
                for (_i = 0, _len = cards.length; _i < _len; _i++) {
                    card = cards[_i];
                    _results.push(card.type)
                }
                return _results
            }();
            $target.removeClass("unknown");
            $target.removeClass(allTypes.join(" "));
            $target.addClass(cardType);
            $target.toggleClass("identified", cardType !== "unknown");
            return $target.trigger("payment.cardType", cardType)
        }
    };
    $.payment.fn.formatCardCVC = function() {
        this.on("keypress", restrictNumeric);
        this.on("keypress", restrictCVC);
        this.on("paste", reFormatCVC);
        this.on("change", reFormatCVC);
        this.on("input", reFormatCVC);
        return this
    };
    $.payment.fn.formatCardExpiry = function() {
        this.on("keypress", restrictNumeric);
        this.on("keypress", restrictExpiry);
        this.on("keypress", formatExpiry);
        this.on("keypress", formatForwardSlashAndSpace);
        this.on("keypress", formatForwardExpiry);
        this.on("keydown", formatBackExpiry);
        this.on("change", reFormatExpiry);
        this.on("input", reFormatExpiry);
        return this
    };
    $.payment.fn.formatCardNumber = function() {
        this.on("keypress", restrictNumeric);
        this.on("keypress", restrictCardNumber);
        this.on("keypress", formatCardNumber);
        this.on("keydown", formatBackCardNumber);
        this.on("keyup", setCardType);
        this.on("paste", reFormatCardNumber);
        this.on("change", reFormatCardNumber);
        this.on("input", reFormatCardNumber);
        this.on("input", setCardType);
        return this
    };
    $.payment.fn.restrictNumeric = function() {
        this.on("keypress", restrictNumeric);
        this.on("paste", reFormatNumeric);
        this.on("change", reFormatNumeric);
        this.on("input", reFormatNumeric);
        return this
    };
    $.payment.fn.cardExpiryVal = function() {
        return $.payment.cardExpiryVal($(this).val())
    };
    $.payment.cardExpiryVal = function(value) {
        var month, prefix, year, _ref;
        value = value.replace(/\s/g, "");
        _ref = value.split("/", 2), month = _ref[0], year = _ref[1];
        if ((year != null ? year.length : void 0) === 2 && /^\d+$/.test(year)) {
            prefix = (new Date).getFullYear();
            prefix = prefix.toString().slice(0, 2);
            year = prefix + year
        }
        month = parseInt(month, 10);
        year = parseInt(year, 10);
        return {
            month: month,
            year: year
        }
    };
    $.payment.validateCardNumber = function(num) {
        var card, _ref;
        num = (num + "").replace(/\s+|-/g, "");
        if (!/^\d+$/.test(num)) {
            return false
        }
        card = cardFromNumber(num);
        if (!card) {
            return false
        }
        return (_ref = num.length, __indexOf.call(card.length, _ref) >= 0) && (card.luhn === false || luhnCheck(num))
    };
    $.payment.validateCardExpiry = function(month, year) {
        var currentTime, expiry, _ref;
        if (typeof month === "object" && "month" in month) {
            _ref = month, month = _ref.month, year = _ref.year
        }
        if (!(month && year)) {
            return false
        }
        month = $.trim(month);
        year = $.trim(year);
        if (!/^\d+$/.test(month)) {
            return false
        }
        if (!/^\d+$/.test(year)) {
            return false
        }
        if (!(1 <= month && month <= 12)) {
            return false
        }
        if (year.length === 2) {
            if (year < 70) {
                year = "20" + year
            } else {
                year = "19" + year
            }
        }
        if (year.length !== 4) {
            return false
        }
        expiry = new Date(year, month);
        currentTime = new Date;
        expiry.setMonth(expiry.getMonth() - 1);
        expiry.setMonth(expiry.getMonth() + 1, 1);
        return expiry > currentTime
    };
    $.payment.validateCardCVC = function(cvc, type) {
        var card, _ref;
        cvc = $.trim(cvc);
        if (!/^\d+$/.test(cvc)) {
            return false
        }
        card = cardFromType(type);
        if (card != null) {
            return _ref = cvc.length, __indexOf.call(card.cvcLength, _ref) >= 0
        } else {
            return cvc.length >= 3 && cvc.length <= 4
        }
    };
    $.payment.cardType = function(num) {
        var _ref;
        if (!num) {
            return null
        }
        return ((_ref = cardFromNumber(num)) != null ? _ref.type : void 0) || null
    };
    $.payment.formatCardNumber = function(num) {
        var card, groups, upperLength, _ref;
        num = num.replace(/\D/g, "");
        card = cardFromNumber(num);
        if (!card) {
            return num
        }
        upperLength = card.length[card.length.length - 1];
        num = num.slice(0, upperLength);
        if (card.format.global) {
            return (_ref = num.match(card.format)) != null ? _ref.join(" ") : void 0
        } else {
            groups = card.format.exec(num);
            if (groups == null) {
                return
            }
            groups.shift();
            groups = $.grep(groups, function(n) {
                return n
            });
            return groups.join(" ")
        }
    };
    $.payment.formatExpiry = function(expiry) {
        var mon, parts, sep, year;
        parts = expiry.match(/^\D*(\d{1,2})(\D+)?(\d{1,4})?/);
        if (!parts) {
            return ""
        }
        mon = parts[1] || "";
        sep = parts[2] || "";
        year = parts[3] || "";
        if (year.length > 0) {
            sep = " / "
        } else if (sep === " /") {
            mon = mon.substring(0, 1);
            sep = ""
        } else if (mon.length === 2 || sep.length > 0) {
            sep = " / "
        } else if (mon.length === 1 && (mon !== "0" && mon !== "1")) {
            mon = "0" + mon;
            sep = " / "
        }
        return mon + sep + year
    }
}).call(this);
(function(a) {
    function b() {
        return {
            empty: !1,
            unusedTokens: [],
            unusedInput: [],
            overflow: -2,
            charsLeftOver: 0,
            nullInput: !1,
            invalidMonth: null,
            invalidFormat: !1,
            userInvalidated: !1,
            iso: !1
        }
    }

    function c(a, b) {
        function c() {
            ib.suppressDeprecationWarnings === !1 && "undefined" != typeof console && console.warn && console.warn("Deprecation warning: " + a)
        }
        var d = !0;
        return i(function() {
            return d && (c(), d = !1), b.apply(this, arguments)
        }, b)
    }

    function d(a, b) {
        return function(c) {
            return l(a.call(this, c), b)
        }
    }

    function e(a, b) {
        return function(c) {
            return this.lang().ordinal(a.call(this, c), b)
        }
    }

    function f() {}

    function g(a) {
        y(a), i(this, a)
    }

    function h(a) {
        var b = r(a),
            c = b.year || 0,
            d = b.quarter || 0,
            e = b.month || 0,
            f = b.week || 0,
            g = b.day || 0,
            h = b.hour || 0,
            i = b.minute || 0,
            j = b.second || 0,
            k = b.millisecond || 0;
        this._milliseconds = +k + 1e3 * j + 6e4 * i + 36e5 * h, this._days = +g + 7 * f, this._months = +e + 3 * d + 12 * c, this._data = {}, this._bubble()
    }

    function i(a, b) {
        for (var c in b) b.hasOwnProperty(c) && (a[c] = b[c]);
        return b.hasOwnProperty("toString") && (a.toString = b.toString), b.hasOwnProperty("valueOf") && (a.valueOf = b.valueOf), a
    }

    function j(a) {
        var b, c = {};
        for (b in a) a.hasOwnProperty(b) && wb.hasOwnProperty(b) && (c[b] = a[b]);
        return c
    }

    function k(a) {
        return 0 > a ? Math.ceil(a) : Math.floor(a)
    }

    function l(a, b, c) {
        for (var d = "" + Math.abs(a), e = a >= 0; d.length < b;) d = "0" + d;
        return (e ? c ? "+" : "" : "-") + d
    }

    function m(a, b, c, d) {
        var e = b._milliseconds,
            f = b._days,
            g = b._months;
        d = null == d ? !0 : d, e && a._d.setTime(+a._d + e * c), f && db(a, "Date", cb(a, "Date") + f * c), g && bb(a, cb(a, "Month") + g * c), d && ib.updateOffset(a, f || g)
    }

    function n(a) {
        return "[object Array]" === Object.prototype.toString.call(a)
    }

    function o(a) {
        return "[object Date]" === Object.prototype.toString.call(a) || a instanceof Date
    }

    function p(a, b, c) {
        var d, e = Math.min(a.length, b.length),
            f = Math.abs(a.length - b.length),
            g = 0;
        for (d = 0; e > d; d++)(c && a[d] !== b[d] || !c && t(a[d]) !== t(b[d])) && g++;
        return g + f
    }

    function q(a) {
        if (a) {
            var b = a.toLowerCase().replace(/(.)s$/, "$1");
            a = Zb[a] || $b[b] || b
        }
        return a
    }

    function r(a) {
        var b, c, d = {};
        for (c in a) a.hasOwnProperty(c) && (b = q(c), b && (d[b] = a[c]));
        return d
    }

    function s(b) {
        var c, d;
        if (0 === b.indexOf("week")) c = 7, d = "day";
        else {
            if (0 !== b.indexOf("month")) return;
            c = 12, d = "month"
        }
        ib[b] = function(e, f) {
            var g, h, i = ib.fn._lang[b],
                j = [];
            if ("number" == typeof e && (f = e, e = a), h = function(a) {
                    var b = ib().utc().set(d, a);
                    return i.call(ib.fn._lang, b, e || "")
                }, null != f) return h(f);
            for (g = 0; c > g; g++) j.push(h(g));
            return j
        }
    }

    function t(a) {
        var b = +a,
            c = 0;
        return 0 !== b && isFinite(b) && (c = b >= 0 ? Math.floor(b) : Math.ceil(b)), c
    }

    function u(a, b) {
        return new Date(Date.UTC(a, b + 1, 0)).getUTCDate()
    }

    function v(a, b, c) {
        return $(ib([a, 11, 31 + b - c]), b, c).week
    }

    function w(a) {
        return x(a) ? 366 : 365
    }

    function x(a) {
        return a % 4 === 0 && a % 100 !== 0 || a % 400 === 0
    }

    function y(a) {
        var b;
        a._a && -2 === a._pf.overflow && (b = a._a[pb] < 0 || a._a[pb] > 11 ? pb : a._a[qb] < 1 || a._a[qb] > u(a._a[ob], a._a[pb]) ? qb : a._a[rb] < 0 || a._a[rb] > 23 ? rb : a._a[sb] < 0 || a._a[sb] > 59 ? sb : a._a[tb] < 0 || a._a[tb] > 59 ? tb : a._a[ub] < 0 || a._a[ub] > 999 ? ub : -1, a._pf._overflowDayOfYear && (ob > b || b > qb) && (b = qb), a._pf.overflow = b)
    }

    function z(a) {
        return null == a._isValid && (a._isValid = !isNaN(a._d.getTime()) && a._pf.overflow < 0 && !a._pf.empty && !a._pf.invalidMonth && !a._pf.nullInput && !a._pf.invalidFormat && !a._pf.userInvalidated, a._strict && (a._isValid = a._isValid && 0 === a._pf.charsLeftOver && 0 === a._pf.unusedTokens.length)), a._isValid
    }

    function A(a) {
        return a ? a.toLowerCase().replace("_", "-") : a
    }

    function B(a, b) {
        return b._isUTC ? ib(a).zone(b._offset || 0) : ib(a).local()
    }

    function C(a, b) {
        return b.abbr = a, vb[a] || (vb[a] = new f), vb[a].set(b), vb[a]
    }

    function D(a) {
        delete vb[a]
    }

    function E(a) {
        var b, c, d, e, f = 0,
            g = function(a) {
                if (!vb[a] && xb) try {
                    require("./lang/" + a)
                } catch (b) {}
                return vb[a]
            };
        if (!a) return ib.fn._lang;
        if (!n(a)) {
            if (c = g(a)) return c;
            a = [a]
        }
        for (; f < a.length;) {
            for (e = A(a[f]).split("-"), b = e.length, d = A(a[f + 1]), d = d ? d.split("-") : null; b > 0;) {
                if (c = g(e.slice(0, b).join("-"))) return c;
                if (d && d.length >= b && p(e, d, !0) >= b - 1) break;
                b--
            }
            f++
        }
        return ib.fn._lang
    }

    function F(a) {
        return a.match(/\[[\s\S]/) ? a.replace(/^\[|\]$/g, "") : a.replace(/\\/g, "")
    }

    function G(a) {
        var b, c, d = a.match(Bb);
        for (b = 0, c = d.length; c > b; b++) d[b] = cc[d[b]] ? cc[d[b]] : F(d[b]);
        return function(e) {
            var f = "";
            for (b = 0; c > b; b++) f += d[b] instanceof Function ? d[b].call(e, a) : d[b];
            return f
        }
    }

    function H(a, b) {
        return a.isValid() ? (b = I(b, a.lang()), _b[b] || (_b[b] = G(b)), _b[b](a)) : a.lang().invalidDate()
    }

    function I(a, b) {
        function c(a) {
            return b.longDateFormat(a) || a
        }
        var d = 5;
        for (Cb.lastIndex = 0; d >= 0 && Cb.test(a);) a = a.replace(Cb, c), Cb.lastIndex = 0, d -= 1;
        return a
    }

    function J(a, b) {
        var c, d = b._strict;
        switch (a) {
            case "Q":
                return Nb;
            case "DDDD":
                return Pb;
            case "YYYY":
            case "GGGG":
            case "gggg":
                return d ? Qb : Fb;
            case "Y":
            case "G":
            case "g":
                return Sb;
            case "YYYYYY":
            case "YYYYY":
            case "GGGGG":
            case "ggggg":
                return d ? Rb : Gb;
            case "S":
                if (d) return Nb;
            case "SS":
                if (d) return Ob;
            case "SSS":
                if (d) return Pb;
            case "DDD":
                return Eb;
            case "MMM":
            case "MMMM":
            case "dd":
            case "ddd":
            case "dddd":
                return Ib;
            case "a":
            case "A":
                return E(b._l)._meridiemParse;
            case "X":
                return Lb;
            case "Z":
            case "ZZ":
                return Jb;
            case "T":
                return Kb;
            case "SSSS":
                return Hb;
            case "MM":
            case "DD":
            case "YY":
            case "GG":
            case "gg":
            case "HH":
            case "hh":
            case "mm":
            case "ss":
            case "ww":
            case "WW":
                return d ? Ob : Db;
            case "M":
            case "D":
            case "d":
            case "H":
            case "h":
            case "m":
            case "s":
            case "w":
            case "W":
            case "e":
            case "E":
                return Db;
            case "Do":
                return Mb;
            default:
                return c = new RegExp(R(Q(a.replace("\\", "")), "i"))
        }
    }

    function K(a) {
        a = a || "";
        var b = a.match(Jb) || [],
            c = b[b.length - 1] || [],
            d = (c + "").match(Xb) || ["-", 0, 0],
            e = +(60 * d[1]) + t(d[2]);
        return "+" === d[0] ? -e : e
    }

    function L(a, b, c) {
        var d, e = c._a;
        switch (a) {
            case "Q":
                null != b && (e[pb] = 3 * (t(b) - 1));
                break;
            case "M":
            case "MM":
                null != b && (e[pb] = t(b) - 1);
                break;
            case "MMM":
            case "MMMM":
                d = E(c._l).monthsParse(b), null != d ? e[pb] = d : c._pf.invalidMonth = b;
                break;
            case "D":
            case "DD":
                null != b && (e[qb] = t(b));
                break;
            case "Do":
                null != b && (e[qb] = t(parseInt(b, 10)));
                break;
            case "DDD":
            case "DDDD":
                null != b && (c._dayOfYear = t(b));
                break;
            case "YY":
                e[ob] = ib.parseTwoDigitYear(b);
                break;
            case "YYYY":
            case "YYYYY":
            case "YYYYYY":
                e[ob] = t(b);
                break;
            case "a":
            case "A":
                c._isPm = E(c._l).isPM(b);
                break;
            case "H":
            case "HH":
            case "h":
            case "hh":
                e[rb] = t(b);
                break;
            case "m":
            case "mm":
                e[sb] = t(b);
                break;
            case "s":
            case "ss":
                e[tb] = t(b);
                break;
            case "S":
            case "SS":
            case "SSS":
            case "SSSS":
                e[ub] = t(1e3 * ("0." + b));
                break;
            case "X":
                c._d = new Date(1e3 * parseFloat(b));
                break;
            case "Z":
            case "ZZ":
                c._useUTC = !0, c._tzm = K(b);
                break;
            case "w":
            case "ww":
            case "W":
            case "WW":
            case "d":
            case "dd":
            case "ddd":
            case "dddd":
            case "e":
            case "E":
                a = a.substr(0, 1);
            case "gg":
            case "gggg":
            case "GG":
            case "GGGG":
            case "GGGGG":
                a = a.substr(0, 2), b && (c._w = c._w || {}, c._w[a] = b)
        }
    }

    function M(a) {
        var b, c, d, e, f, g, h, i, j, k, l = [];
        if (!a._d) {
            for (d = O(a), a._w && null == a._a[qb] && null == a._a[pb] && (f = function(b) {
                    var c = parseInt(b, 10);
                    return b ? b.length < 3 ? c > 68 ? 1900 + c : 2e3 + c : c : null == a._a[ob] ? ib().weekYear() : a._a[ob]
                }, g = a._w, null != g.GG || null != g.W || null != g.E ? h = _(f(g.GG), g.W || 1, g.E, 4, 1) : (i = E(a._l), j = null != g.d ? X(g.d, i) : null != g.e ? parseInt(g.e, 10) + i._week.dow : 0, k = parseInt(g.w, 10) || 1, null != g.d && j < i._week.dow && k++, h = _(f(g.gg), k, j, i._week.doy, i._week.dow)), a._a[ob] = h.year, a._dayOfYear = h.dayOfYear), a._dayOfYear && (e = null == a._a[ob] ? d[ob] : a._a[ob], a._dayOfYear > w(e) && (a._pf._overflowDayOfYear = !0), c = W(e, 0, a._dayOfYear), a._a[pb] = c.getUTCMonth(), a._a[qb] = c.getUTCDate()), b = 0; 3 > b && null == a._a[b]; ++b) a._a[b] = l[b] = d[b];
            for (; 7 > b; b++) a._a[b] = l[b] = null == a._a[b] ? 2 === b ? 1 : 0 : a._a[b];
            l[rb] += t((a._tzm || 0) / 60), l[sb] += t((a._tzm || 0) % 60), a._d = (a._useUTC ? W : V).apply(null, l)
        }
    }

    function N(a) {
        var b;
        a._d || (b = r(a._i), a._a = [b.year, b.month, b.day, b.hour, b.minute, b.second, b.millisecond], M(a))
    }

    function O(a) {
        var b = new Date;
        return a._useUTC ? [b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()] : [b.getFullYear(), b.getMonth(), b.getDate()]
    }

    function P(a) {
        a._a = [], a._pf.empty = !0;
        var b, c, d, e, f, g = E(a._l),
            h = "" + a._i,
            i = h.length,
            j = 0;
        for (d = I(a._f, g).match(Bb) || [], b = 0; b < d.length; b++) e = d[b], c = (h.match(J(e, a)) || [])[0], c && (f = h.substr(0, h.indexOf(c)), f.length > 0 && a._pf.unusedInput.push(f), h = h.slice(h.indexOf(c) + c.length), j += c.length), cc[e] ? (c ? a._pf.empty = !1 : a._pf.unusedTokens.push(e), L(e, c, a)) : a._strict && !c && a._pf.unusedTokens.push(e);
        a._pf.charsLeftOver = i - j, h.length > 0 && a._pf.unusedInput.push(h), a._isPm && a._a[rb] < 12 && (a._a[rb] += 12), a._isPm === !1 && 12 === a._a[rb] && (a._a[rb] = 0), M(a), y(a)
    }

    function Q(a) {
        return a.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function(a, b, c, d, e) {
            return b || c || d || e
        })
    }

    function R(a) {
        return a.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
    }

    function S(a) {
        var c, d, e, f, g;
        if (0 === a._f.length) return a._pf.invalidFormat = !0, void(a._d = new Date(0 / 0));
        for (f = 0; f < a._f.length; f++) g = 0, c = i({}, a), c._pf = b(), c._f = a._f[f], P(c), z(c) && (g += c._pf.charsLeftOver, g += 10 * c._pf.unusedTokens.length, c._pf.score = g, (null == e || e > g) && (e = g, d = c));
        i(a, d || c)
    }

    function T(a) {
        var b, c, d = a._i,
            e = Tb.exec(d);
        if (e) {
            for (a._pf.iso = !0, b = 0, c = Vb.length; c > b; b++)
                if (Vb[b][1].exec(d)) {
                    a._f = Vb[b][0] + (e[6] || " ");
                    break
                }
            for (b = 0, c = Wb.length; c > b; b++)
                if (Wb[b][1].exec(d)) {
                    a._f += Wb[b][0];
                    break
                }
            d.match(Jb) && (a._f += "Z"), P(a)
        } else ib.createFromInputFallback(a)
    }

    function U(b) {
        var c = b._i,
            d = yb.exec(c);
        c === a ? b._d = new Date : d ? b._d = new Date(+d[1]) : "string" == typeof c ? T(b) : n(c) ? (b._a = c.slice(0), M(b)) : o(c) ? b._d = new Date(+c) : "object" == typeof c ? N(b) : "number" == typeof c ? b._d = new Date(c) : ib.createFromInputFallback(b)
    }

    function V(a, b, c, d, e, f, g) {
        var h = new Date(a, b, c, d, e, f, g);
        return 1970 > a && h.setFullYear(a), h
    }

    function W(a) {
        var b = new Date(Date.UTC.apply(null, arguments));
        return 1970 > a && b.setUTCFullYear(a), b
    }

    function X(a, b) {
        if ("string" == typeof a)
            if (isNaN(a)) {
                if (a = b.weekdaysParse(a), "number" != typeof a) return null
            } else a = parseInt(a, 10);
        return a
    }

    function Y(a, b, c, d, e) {
        return e.relativeTime(b || 1, !!c, a, d)
    }

    function Z(a, b, c) {
        var d = nb(Math.abs(a) / 1e3),
            e = nb(d / 60),
            f = nb(e / 60),
            g = nb(f / 24),
            h = nb(g / 365),
            i = 45 > d && ["s", d] || 1 === e && ["m"] || 45 > e && ["mm", e] || 1 === f && ["h"] || 22 > f && ["hh", f] || 1 === g && ["d"] || 25 >= g && ["dd", g] || 45 >= g && ["M"] || 345 > g && ["MM", nb(g / 30)] || 1 === h && ["y"] || ["yy", h];
        return i[2] = b, i[3] = a > 0, i[4] = c, Y.apply({}, i)
    }

    function $(a, b, c) {
        var d, e = c - b,
            f = c - a.day();
        return f > e && (f -= 7), e - 7 > f && (f += 7), d = ib(a).add("d", f), {
            week: Math.ceil(d.dayOfYear() / 7),
            year: d.year()
        }
    }

    function _(a, b, c, d, e) {
        var f, g, h = W(a, 0, 1).getUTCDay();
        return c = null != c ? c : e, f = e - h + (h > d ? 7 : 0) - (e > h ? 7 : 0), g = 7 * (b - 1) + (c - e) + f + 1, {
            year: g > 0 ? a : a - 1,
            dayOfYear: g > 0 ? g : w(a - 1) + g
        }
    }

    function ab(b) {
        var c = b._i,
            d = b._f;
        return null === c || d === a && "" === c ? ib.invalid({
            nullInput: !0
        }) : ("string" == typeof c && (b._i = c = E().preparse(c)), ib.isMoment(c) ? (b = j(c), b._d = new Date(+c._d)) : d ? n(d) ? S(b) : P(b) : U(b), new g(b))
    }

    function bb(a, b) {
        var c;
        return "string" == typeof b && (b = a.lang().monthsParse(b), "number" != typeof b) ? a : (c = Math.min(a.date(), u(a.year(), b)), a._d["set" + (a._isUTC ? "UTC" : "") + "Month"](b, c), a)
    }

    function cb(a, b) {
        return a._d["get" + (a._isUTC ? "UTC" : "") + b]()
    }

    function db(a, b, c) {
        return "Month" === b ? bb(a, c) : a._d["set" + (a._isUTC ? "UTC" : "") + b](c)
    }

    function eb(a, b) {
        return function(c) {
            return null != c ? (db(this, a, c), ib.updateOffset(this, b), this) : cb(this, a)
        }
    }

    function fb(a) {
        ib.duration.fn[a] = function() {
            return this._data[a]
        }
    }

    function gb(a, b) {
        ib.duration.fn["as" + a] = function() {
            return +this / b
        }
    }

    function hb(a) {
        "undefined" == typeof ender && (jb = mb.moment, mb.moment = a ? c("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.", ib) : ib)
    }
    for (var ib, jb, kb, lb = "2.6.0", mb = "undefined" != typeof global ? global : this, nb = Math.round, ob = 0, pb = 1, qb = 2, rb = 3, sb = 4, tb = 5, ub = 6, vb = {}, wb = {
            _isAMomentObject: null,
            _i: null,
            _f: null,
            _l: null,
            _strict: null,
            _isUTC: null,
            _offset: null,
            _pf: null,
            _lang: null
        }, xb = "undefined" != typeof module && module.exports, yb = /^\/?Date\((\-?\d+)/i, zb = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/, Ab = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/, Bb = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g, Cb = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g, Db = /\d\d?/, Eb = /\d{1,3}/, Fb = /\d{1,4}/, Gb = /[+\-]?\d{1,6}/, Hb = /\d+/, Ib = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, Jb = /Z|[\+\-]\d\d:?\d\d/gi, Kb = /T/i, Lb = /[\+\-]?\d+(\.\d{1,3})?/, Mb = /\d{1,2}/, Nb = /\d/, Ob = /\d\d/, Pb = /\d{3}/, Qb = /\d{4}/, Rb = /[+-]?\d{6}/, Sb = /[+-]?\d+/, Tb = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/, Ub = "YYYY-MM-DDTHH:mm:ssZ", Vb = [
            ["YYYYYY-MM-DD", /[+-]\d{6}-\d{2}-\d{2}/],
            ["YYYY-MM-DD", /\d{4}-\d{2}-\d{2}/],
            ["GGGG-[W]WW-E", /\d{4}-W\d{2}-\d/],
            ["GGGG-[W]WW", /\d{4}-W\d{2}/],
            ["YYYY-DDD", /\d{4}-\d{3}/]
        ], Wb = [
            ["HH:mm:ss.SSSS", /(T| )\d\d:\d\d:\d\d\.\d+/],
            ["HH:mm:ss", /(T| )\d\d:\d\d:\d\d/],
            ["HH:mm", /(T| )\d\d:\d\d/],
            ["HH", /(T| )\d\d/]
        ], Xb = /([\+\-]|\d\d)/gi, Yb = ("Date|Hours|Minutes|Seconds|Milliseconds".split("|"), {
            Milliseconds: 1,
            Seconds: 1e3,
            Minutes: 6e4,
            Hours: 36e5,
            Days: 864e5,
            Months: 2592e6,
            Years: 31536e6
        }), Zb = {
            ms: "millisecond",
            s: "second",
            m: "minute",
            h: "hour",
            d: "day",
            D: "date",
            w: "week",
            W: "isoWeek",
            M: "month",
            Q: "quarter",
            y: "year",
            DDD: "dayOfYear",
            e: "weekday",
            E: "isoWeekday",
            gg: "weekYear",
            GG: "isoWeekYear"
        }, $b = {
            dayofyear: "dayOfYear",
            isoweekday: "isoWeekday",
            isoweek: "isoWeek",
            weekyear: "weekYear",
            isoweekyear: "isoWeekYear"
        }, _b = {}, ac = "DDD w W M D d".split(" "), bc = "M D H h m s w W".split(" "), cc = {
            M: function() {
                return this.month() + 1
            },
            MMM: function(a) {
                return this.lang().monthsShort(this, a)
            },
            MMMM: function(a) {
                return this.lang().months(this, a)
            },
            D: function() {
                return this.date()
            },
            DDD: function() {
                return this.dayOfYear()
            },
            d: function() {
                return this.day()
            },
            dd: function(a) {
                return this.lang().weekdaysMin(this, a)
            },
            ddd: function(a) {
                return this.lang().weekdaysShort(this, a)
            },
            dddd: function(a) {
                return this.lang().weekdays(this, a)
            },
            w: function() {
                return this.week()
            },
            W: function() {
                return this.isoWeek()
            },
            YY: function() {
                return l(this.year() % 100, 2)
            },
            YYYY: function() {
                return l(this.year(), 4)
            },
            YYYYY: function() {
                return l(this.year(), 5)
            },
            YYYYYY: function() {
                var a = this.year(),
                    b = a >= 0 ? "+" : "-";
                return b + l(Math.abs(a), 6)
            },
            gg: function() {
                return l(this.weekYear() % 100, 2)
            },
            gggg: function() {
                return l(this.weekYear(), 4)
            },
            ggggg: function() {
                return l(this.weekYear(), 5)
            },
            GG: function() {
                return l(this.isoWeekYear() % 100, 2)
            },
            GGGG: function() {
                return l(this.isoWeekYear(), 4)
            },
            GGGGG: function() {
                return l(this.isoWeekYear(), 5)
            },
            e: function() {
                return this.weekday()
            },
            E: function() {
                return this.isoWeekday()
            },
            a: function() {
                return this.lang().meridiem(this.hours(), this.minutes(), !0)
            },
            A: function() {
                return this.lang().meridiem(this.hours(), this.minutes(), !1)
            },
            H: function() {
                return this.hours()
            },
            h: function() {
                return this.hours() % 12 || 12
            },
            m: function() {
                return this.minutes()
            },
            s: function() {
                return this.seconds()
            },
            S: function() {
                return t(this.milliseconds() / 100)
            },
            SS: function() {
                return l(t(this.milliseconds() / 10), 2)
            },
            SSS: function() {
                return l(this.milliseconds(), 3)
            },
            SSSS: function() {
                return l(this.milliseconds(), 3)
            },
            Z: function() {
                var a = -this.zone(),
                    b = "+";
                return 0 > a && (a = -a, b = "-"), b + l(t(a / 60), 2) + ":" + l(t(a) % 60, 2)
            },
            ZZ: function() {
                var a = -this.zone(),
                    b = "+";
                return 0 > a && (a = -a, b = "-"), b + l(t(a / 60), 2) + l(t(a) % 60, 2)
            },
            z: function() {
                return this.zoneAbbr()
            },
            zz: function() {
                return this.zoneName()
            },
            X: function() {
                return this.unix()
            },
            Q: function() {
                return this.quarter()
            }
        }, dc = ["months", "monthsShort", "weekdays", "weekdaysShort", "weekdaysMin"]; ac.length;) kb = ac.pop(), cc[kb + "o"] = e(cc[kb], kb);
    for (; bc.length;) kb = bc.pop(), cc[kb + kb] = d(cc[kb], 2);
    for (cc.DDDD = d(cc.DDD, 3), i(f.prototype, {
            set: function(a) {
                var b, c;
                for (c in a) b = a[c], "function" == typeof b ? this[c] = b : this["_" + c] = b
            },
            _months: "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
            months: function(a) {
                return this._months[a.month()]
            },
            _monthsShort: "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
            monthsShort: function(a) {
                return this._monthsShort[a.month()]
            },
            monthsParse: function(a) {
                var b, c, d;
                for (this._monthsParse || (this._monthsParse = []), b = 0; 12 > b; b++)
                    if (this._monthsParse[b] || (c = ib.utc([2e3, b]), d = "^" + this.months(c, "") + "|^" + this.monthsShort(c, ""), this._monthsParse[b] = new RegExp(d.replace(".", ""), "i")), this._monthsParse[b].test(a)) return b
            },
            _weekdays: "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
            weekdays: function(a) {
                return this._weekdays[a.day()]
            },
            _weekdaysShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
            weekdaysShort: function(a) {
                return this._weekdaysShort[a.day()]
            },
            _weekdaysMin: "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
            weekdaysMin: function(a) {
                return this._weekdaysMin[a.day()]
            },
            weekdaysParse: function(a) {
                var b, c, d;
                for (this._weekdaysParse || (this._weekdaysParse = []), b = 0; 7 > b; b++)
                    if (this._weekdaysParse[b] || (c = ib([2e3, 1]).day(b), d = "^" + this.weekdays(c, "") + "|^" + this.weekdaysShort(c, "") + "|^" + this.weekdaysMin(c, ""), this._weekdaysParse[b] = new RegExp(d.replace(".", ""), "i")), this._weekdaysParse[b].test(a)) return b
            },
            _longDateFormat: {
                LT: "h:mm A",
                L: "MM/DD/YYYY",
                LL: "MMMM D YYYY",
                LLL: "MMMM D YYYY LT",
                LLLL: "dddd, MMMM D YYYY LT"
            },
            longDateFormat: function(a) {
                var b = this._longDateFormat[a];
                return !b && this._longDateFormat[a.toUpperCase()] && (b = this._longDateFormat[a.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function(a) {
                    return a.slice(1)
                }), this._longDateFormat[a] = b), b
            },
            isPM: function(a) {
                return "p" === (a + "").toLowerCase().charAt(0)
            },
            _meridiemParse: /[ap]\.?m?\.?/i,
            meridiem: function(a, b, c) {
                return a > 11 ? c ? "pm" : "PM" : c ? "am" : "AM"
            },
            _calendar: {
                sameDay: "[Today at] LT",
                nextDay: "[Tomorrow at] LT",
                nextWeek: "dddd [at] LT",
                lastDay: "[Yesterday at] LT",
                lastWeek: "[Last] dddd [at] LT",
                sameElse: "L"
            },
            calendar: function(a, b) {
                var c = this._calendar[a];
                return "function" == typeof c ? c.apply(b) : c
            },
            _relativeTime: {
                future: "in %s",
                past: "%s ago",
                s: "a few seconds",
                m: "a minute",
                mm: "%d minutes",
                h: "an hour",
                hh: "%d hours",
                d: "a day",
                dd: "%d days",
                M: "a month",
                MM: "%d months",
                y: "a year",
                yy: "%d years"
            },
            relativeTime: function(a, b, c, d) {
                var e = this._relativeTime[c];
                return "function" == typeof e ? e(a, b, c, d) : e.replace(/%d/i, a)
            },
            pastFuture: function(a, b) {
                var c = this._relativeTime[a > 0 ? "future" : "past"];
                return "function" == typeof c ? c(b) : c.replace(/%s/i, b)
            },
            ordinal: function(a) {
                return this._ordinal.replace("%d", a)
            },
            _ordinal: "%d",
            preparse: function(a) {
                return a
            },
            postformat: function(a) {
                return a
            },
            week: function(a) {
                return $(a, this._week.dow, this._week.doy).week
            },
            _week: {
                dow: 0,
                doy: 6
            },
            _invalidDate: "Invalid date",
            invalidDate: function() {
                return this._invalidDate
            }
        }), ib = function(c, d, e, f) {
            var g;
            return "boolean" == typeof e && (f = e, e = a), g = {}, g._isAMomentObject = !0, g._i = c, g._f = d, g._l = e, g._strict = f, g._isUTC = !1, g._pf = b(), ab(g)
        }, ib.suppressDeprecationWarnings = !1, ib.createFromInputFallback = c("moment construction falls back to js Date. This is discouraged and will be removed in upcoming major release. Please refer to https://github.com/moment/moment/issues/1407 for more info.", function(a) {
            a._d = new Date(a._i)
        }), ib.utc = function(c, d, e, f) {
            var g;
            return "boolean" == typeof e && (f = e, e = a), g = {}, g._isAMomentObject = !0, g._useUTC = !0, g._isUTC = !0, g._l = e, g._i = c, g._f = d, g._strict = f, g._pf = b(), ab(g).utc()
        }, ib.unix = function(a) {
            return ib(1e3 * a)
        }, ib.duration = function(a, b) {
            var c, d, e, f = a,
                g = null;
            return ib.isDuration(a) ? f = {
                ms: a._milliseconds,
                d: a._days,
                M: a._months
            } : "number" == typeof a ? (f = {}, b ? f[b] = a : f.milliseconds = a) : (g = zb.exec(a)) ? (c = "-" === g[1] ? -1 : 1, f = {
                y: 0,
                d: t(g[qb]) * c,
                h: t(g[rb]) * c,
                m: t(g[sb]) * c,
                s: t(g[tb]) * c,
                ms: t(g[ub]) * c
            }) : (g = Ab.exec(a)) && (c = "-" === g[1] ? -1 : 1, e = function(a) {
                var b = a && parseFloat(a.replace(",", "."));
                return (isNaN(b) ? 0 : b) * c
            }, f = {
                y: e(g[2]),
                M: e(g[3]),
                d: e(g[4]),
                h: e(g[5]),
                m: e(g[6]),
                s: e(g[7]),
                w: e(g[8])
            }), d = new h(f), ib.isDuration(a) && a.hasOwnProperty("_lang") && (d._lang = a._lang), d
        }, ib.version = lb, ib.defaultFormat = Ub, ib.momentProperties = wb, ib.updateOffset = function() {}, ib.lang = function(a, b) {
            var c;
            return a ? (b ? C(A(a), b) : null === b ? (D(a), a = "en") : vb[a] || E(a), c = ib.duration.fn._lang = ib.fn._lang = E(a), c._abbr) : ib.fn._lang._abbr
        }, ib.langData = function(a) {
            return a && a._lang && a._lang._abbr && (a = a._lang._abbr), E(a)
        }, ib.isMoment = function(a) {
            return a instanceof g || null != a && a.hasOwnProperty("_isAMomentObject")
        }, ib.isDuration = function(a) {
            return a instanceof h
        }, kb = dc.length - 1; kb >= 0; --kb) s(dc[kb]);
    ib.normalizeUnits = function(a) {
        return q(a)
    }, ib.invalid = function(a) {
        var b = ib.utc(0 / 0);
        return null != a ? i(b._pf, a) : b._pf.userInvalidated = !0, b
    }, ib.parseZone = function() {
        return ib.apply(null, arguments).parseZone()
    }, ib.parseTwoDigitYear = function(a) {
        return t(a) + (t(a) > 68 ? 1900 : 2e3)
    }, i(ib.fn = g.prototype, {
        clone: function() {
            return ib(this)
        },
        valueOf: function() {
            return +this._d + 6e4 * (this._offset || 0)
        },
        unix: function() {
            return Math.floor(+this / 1e3)
        },
        toString: function() {
            return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")
        },
        toDate: function() {
            return this._offset ? new Date(+this) : this._d
        },
        toISOString: function() {
            var a = ib(this).utc();
            return 0 < a.year() && a.year() <= 9999 ? H(a, "YYYY-MM-DD[T]HH:mm:ss.SSS[Z]") : H(a, "YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")
        },
        toArray: function() {
            var a = this;
            return [a.year(), a.month(), a.date(), a.hours(), a.minutes(), a.seconds(), a.milliseconds()]
        },
        isValid: function() {
            return z(this)
        },
        isDSTShifted: function() {
            return this._a ? this.isValid() && p(this._a, (this._isUTC ? ib.utc(this._a) : ib(this._a)).toArray()) > 0 : !1
        },
        parsingFlags: function() {
            return i({}, this._pf)
        },
        invalidAt: function() {
            return this._pf.overflow
        },
        utc: function() {
            return this.zone(0)
        },
        local: function() {
            return this.zone(0), this._isUTC = !1, this
        },
        format: function(a) {
            var b = H(this, a || ib.defaultFormat);
            return this.lang().postformat(b)
        },
        add: function(a, b) {
            var c;
            return c = "string" == typeof a ? ib.duration(+b, a) : ib.duration(a, b), m(this, c, 1), this
        },
        subtract: function(a, b) {
            var c;
            return c = "string" == typeof a ? ib.duration(+b, a) : ib.duration(a, b), m(this, c, -1), this
        },
        diff: function(a, b, c) {
            var d, e, f = B(a, this),
                g = 6e4 * (this.zone() - f.zone());
            return b = q(b), "year" === b || "month" === b ? (d = 432e5 * (this.daysInMonth() + f.daysInMonth()), e = 12 * (this.year() - f.year()) + (this.month() - f.month()), e += (this - ib(this).startOf("month") - (f - ib(f).startOf("month"))) / d, e -= 6e4 * (this.zone() - ib(this).startOf("month").zone() - (f.zone() - ib(f).startOf("month").zone())) / d, "year" === b && (e /= 12)) : (d = this - f, e = "second" === b ? d / 1e3 : "minute" === b ? d / 6e4 : "hour" === b ? d / 36e5 : "day" === b ? (d - g) / 864e5 : "week" === b ? (d - g) / 6048e5 : d), c ? e : k(e)
        },
        from: function(a, b) {
            return ib.duration(this.diff(a)).lang(this.lang()._abbr).humanize(!b)
        },
        fromNow: function(a) {
            return this.from(ib(), a)
        },
        calendar: function() {
            var a = B(ib(), this).startOf("day"),
                b = this.diff(a, "days", !0),
                c = -6 > b ? "sameElse" : -1 > b ? "lastWeek" : 0 > b ? "lastDay" : 1 > b ? "sameDay" : 2 > b ? "nextDay" : 7 > b ? "nextWeek" : "sameElse";
            return this.format(this.lang().calendar(c, this))
        },
        isLeapYear: function() {
            return x(this.year())
        },
        isDST: function() {
            return this.zone() < this.clone().month(0).zone() || this.zone() < this.clone().month(5).zone()
        },
        day: function(a) {
            var b = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            return null != a ? (a = X(a, this.lang()), this.add({
                d: a - b
            })) : b
        },
        month: eb("Month", !0),
        startOf: function(a) {
            switch (a = q(a)) {
                case "year":
                    this.month(0);
                case "quarter":
                case "month":
                    this.date(1);
                case "week":
                case "isoWeek":
                case "day":
                    this.hours(0);
                case "hour":
                    this.minutes(0);
                case "minute":
                    this.seconds(0);
                case "second":
                    this.milliseconds(0)
            }
            return "week" === a ? this.weekday(0) : "isoWeek" === a && this.isoWeekday(1), "quarter" === a && this.month(3 * Math.floor(this.month() / 3)), this
        },
        endOf: function(a) {
            return a = q(a), this.startOf(a).add("isoWeek" === a ? "week" : a, 1).subtract("ms", 1)
        },
        isAfter: function(a, b) {
            return b = "undefined" != typeof b ? b : "millisecond", +this.clone().startOf(b) > +ib(a).startOf(b)
        },
        isBefore: function(a, b) {
            return b = "undefined" != typeof b ? b : "millisecond", +this.clone().startOf(b) < +ib(a).startOf(b)
        },
        isSame: function(a, b) {
            return b = b || "ms", +this.clone().startOf(b) === +B(a, this).startOf(b)
        },
        min: function(a) {
            return a = ib.apply(null, arguments), this > a ? this : a
        },
        max: function(a) {
            return a = ib.apply(null, arguments), a > this ? this : a
        },
        zone: function(a, b) {
            var c = this._offset || 0;
            return null == a ? this._isUTC ? c : this._d.getTimezoneOffset() : ("string" == typeof a && (a = K(a)), Math.abs(a) < 16 && (a = 60 * a), this._offset = a, this._isUTC = !0, c !== a && (!b || this._changeInProgress ? m(this, ib.duration(c - a, "m"), 1, !1) : this._changeInProgress || (this._changeInProgress = !0, ib.updateOffset(this, !0), this._changeInProgress = null)), this)
        },
        zoneAbbr: function() {
            return this._isUTC ? "UTC" : ""
        },
        zoneName: function() {
            return this._isUTC ? "Coordinated Universal Time" : ""
        },
        parseZone: function() {
            return this._tzm ? this.zone(this._tzm) : "string" == typeof this._i && this.zone(this._i), this
        },
        hasAlignedHourOffset: function(a) {
            return a = a ? ib(a).zone() : 0, (this.zone() - a) % 60 === 0
        },
        daysInMonth: function() {
            return u(this.year(), this.month())
        },
        dayOfYear: function(a) {
            var b = nb((ib(this).startOf("day") - ib(this).startOf("year")) / 864e5) + 1;
            return null == a ? b : this.add("d", a - b)
        },
        quarter: function(a) {
            return null == a ? Math.ceil((this.month() + 1) / 3) : this.month(3 * (a - 1) + this.month() % 3)
        },
        weekYear: function(a) {
            var b = $(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return null == a ? b : this.add("y", a - b)
        },
        isoWeekYear: function(a) {
            var b = $(this, 1, 4).year;
            return null == a ? b : this.add("y", a - b)
        },
        week: function(a) {
            var b = this.lang().week(this);
            return null == a ? b : this.add("d", 7 * (a - b))
        },
        isoWeek: function(a) {
            var b = $(this, 1, 4).week;
            return null == a ? b : this.add("d", 7 * (a - b))
        },
        weekday: function(a) {
            var b = (this.day() + 7 - this.lang()._week.dow) % 7;
            return null == a ? b : this.add("d", a - b)
        },
        isoWeekday: function(a) {
            return null == a ? this.day() || 7 : this.day(this.day() % 7 ? a : a - 7)
        },
        isoWeeksInYear: function() {
            return v(this.year(), 1, 4)
        },
        weeksInYear: function() {
            var a = this._lang._week;
            return v(this.year(), a.dow, a.doy)
        },
        get: function(a) {
            return a = q(a), this[a]()
        },
        set: function(a, b) {
            return a = q(a), "function" == typeof this[a] && this[a](b), this
        },
        lang: function(b) {
            return b === a ? this._lang : (this._lang = E(b), this)
        }
    }), ib.fn.millisecond = ib.fn.milliseconds = eb("Milliseconds", !1), ib.fn.second = ib.fn.seconds = eb("Seconds", !1), ib.fn.minute = ib.fn.minutes = eb("Minutes", !1), ib.fn.hour = ib.fn.hours = eb("Hours", !0), ib.fn.date = eb("Date", !0), ib.fn.dates = c("dates accessor is deprecated. Use date instead.", eb("Date", !0)), ib.fn.year = eb("FullYear", !0), ib.fn.years = c("years accessor is deprecated. Use year instead.", eb("FullYear", !0)), ib.fn.days = ib.fn.day, ib.fn.months = ib.fn.month, ib.fn.weeks = ib.fn.week, ib.fn.isoWeeks = ib.fn.isoWeek, ib.fn.quarters = ib.fn.quarter, ib.fn.toJSON = ib.fn.toISOString, i(ib.duration.fn = h.prototype, {
        _bubble: function() {
            var a, b, c, d, e = this._milliseconds,
                f = this._days,
                g = this._months,
                h = this._data;
            h.milliseconds = e % 1e3, a = k(e / 1e3), h.seconds = a % 60, b = k(a / 60), h.minutes = b % 60, c = k(b / 60), h.hours = c % 24, f += k(c / 24), h.days = f % 30, g += k(f / 30), h.months = g % 12, d = k(g / 12), h.years = d
        },
        weeks: function() {
            return k(this.days() / 7)
        },
        valueOf: function() {
            return this._milliseconds + 864e5 * this._days + this._months % 12 * 2592e6 + 31536e6 * t(this._months / 12)
        },
        humanize: function(a) {
            var b = +this,
                c = Z(b, !a, this.lang());
            return a && (c = this.lang().pastFuture(b, c)), this.lang().postformat(c)
        },
        add: function(a, b) {
            var c = ib.duration(a, b);
            return this._milliseconds += c._milliseconds, this._days += c._days, this._months += c._months, this._bubble(), this
        },
        subtract: function(a, b) {
            var c = ib.duration(a, b);
            return this._milliseconds -= c._milliseconds, this._days -= c._days, this._months -= c._months, this._bubble(), this
        },
        get: function(a) {
            return a = q(a), this[a.toLowerCase() + "s"]()
        },
        as: function(a) {
            return a = q(a), this["as" + a.charAt(0).toUpperCase() + a.slice(1) + "s"]()
        },
        lang: ib.fn.lang,
        toIsoString: function() {
            var a = Math.abs(this.years()),
                b = Math.abs(this.months()),
                c = Math.abs(this.days()),
                d = Math.abs(this.hours()),
                e = Math.abs(this.minutes()),
                f = Math.abs(this.seconds() + this.milliseconds() / 1e3);
            return this.asSeconds() ? (this.asSeconds() < 0 ? "-" : "") + "P" + (a ? a + "Y" : "") + (b ? b + "M" : "") + (c ? c + "D" : "") + (d || e || f ? "T" : "") + (d ? d + "H" : "") + (e ? e + "M" : "") + (f ? f + "S" : "") : "P0D"
        }
    });
    for (kb in Yb) Yb.hasOwnProperty(kb) && (gb(kb, Yb[kb]), fb(kb.toLowerCase()));
    gb("Weeks", 6048e5), ib.duration.fn.asMonths = function() {
        return (+this - 31536e6 * this.years()) / 2592e6 + 12 * this.years()
    }, ib.lang("en", {
        ordinal: function(a) {
            var b = a % 10,
                c = 1 === t(a % 100 / 10) ? "th" : 1 === b ? "st" : 2 === b ? "nd" : 3 === b ? "rd" : "th";
            return a + c
        }
    }), xb ? module.exports = ib : "function" == typeof define && define.amd ? (define("moment", function(a, b, c) {
        return c.config && c.config() && c.config().noGlobal === !0 && (mb.moment = jb), ib
    }), hb(!0)) : hb()
}).call(this);
(function($, undef) {
    var defaults, gId = 0;

    function initDefaults() {
        if (!defaults) {
            defaults = {
                verbose: false,
                queryLimit: {
                    attempt: 5,
                    delay: 250,
                    random: 250
                },
                classes: {
                    Map: google.maps.Map,
                    Marker: google.maps.Marker,
                    InfoWindow: google.maps.InfoWindow,
                    Circle: google.maps.Circle,
                    Rectangle: google.maps.Rectangle,
                    OverlayView: google.maps.OverlayView,
                    StreetViewPanorama: google.maps.StreetViewPanorama,
                    KmlLayer: google.maps.KmlLayer,
                    TrafficLayer: google.maps.TrafficLayer,
                    BicyclingLayer: google.maps.BicyclingLayer,
                    GroundOverlay: google.maps.GroundOverlay,
                    StyledMapType: google.maps.StyledMapType,
                    ImageMapType: google.maps.ImageMapType
                },
                map: {
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    center: [46.578498, 2.457275],
                    zoom: 2
                },
                overlay: {
                    pane: "floatPane",
                    content: "",
                    offset: {
                        x: 0,
                        y: 0
                    }
                },
                geoloc: {
                    getCurrentPosition: {
                        maximumAge: 6e4,
                        timeout: 5e3
                    }
                }
            }
        }
    }

    function globalId(id, simulate) {
        return id !== undef ? id : "gmap3_" + (simulate ? gId + 1 : ++gId)
    }

    function googleVersionMin(version) {
        var toInt = function(v) {
                return parseInt(v, 10)
            },
            gmVersion = google.maps.version.split(".").map(toInt),
            i;
        version = version.split(".").map(toInt);
        for (i = 0; i < version.length; i++) {
            if (gmVersion.hasOwnProperty(i)) {
                if (gmVersion[i] < version[i]) {
                    return false
                }
            } else {
                return false
            }
        }
        return true
    }

    function attachEvents($container, args, sender, id, senders) {
        if (args.todo.events || args.todo.onces) {
            var context = {
                id: id,
                data: args.todo.data,
                tag: args.todo.tag
            };
            if (args.todo.events) {
                $.each(args.todo.events, function(name, f) {
                    var that = $container,
                        fn = f;
                    if ($.isArray(f)) {
                        that = f[0];
                        fn = f[1]
                    }
                    google.maps.event.addListener(sender, name, function(event) {
                        fn.apply(that, [senders ? senders : sender, event, context])
                    })
                })
            }
            if (args.todo.onces) {
                $.each(args.todo.onces, function(name, f) {
                    var that = $container,
                        fn = f;
                    if ($.isArray(f)) {
                        that = f[0];
                        fn = f[1]
                    }
                    google.maps.event.addListenerOnce(sender, name, function(event) {
                        fn.apply(that, [senders ? senders : sender, event, context])
                    })
                })
            }
        }
    }

    function Stack() {
        var st = [];
        this.empty = function() {
            return !st.length
        };
        this.add = function(v) {
            st.push(v)
        };
        this.get = function() {
            return st.length ? st[0] : false
        };
        this.ack = function() {
            st.shift()
        }
    }

    function Task(ctx, onEnd, todo) {
        var session = {},
            that = this,
            current, resolve = {
                latLng: {
                    map: false,
                    marker: false,
                    infowindow: false,
                    circle: false,
                    overlay: false,
                    getlatlng: false,
                    getmaxzoom: false,
                    getelevation: false,
                    streetviewpanorama: false,
                    getaddress: true
                },
                geoloc: {
                    getgeoloc: true
                }
            };
        if (typeof todo === "string") {
            todo = unify(todo)
        }

        function unify(todo) {
            var result = {};
            result[todo] = {};
            return result
        }

        function next() {
            var k;
            for (k in todo) {
                if (k in session) {
                    continue
                }
                return k
            }
        }
        this.run = function() {
            var k, opts;
            while (k = next()) {
                if (typeof ctx[k] === "function") {
                    current = k;
                    opts = $.extend(true, {}, defaults[k] || {}, todo[k].options || {});
                    if (k in resolve.latLng) {
                        if (todo[k].values) {
                            resolveAllLatLng(todo[k].values, ctx, ctx[k], {
                                todo: todo[k],
                                opts: opts,
                                session: session
                            })
                        } else {
                            resolveLatLng(ctx, ctx[k], resolve.latLng[k], {
                                todo: todo[k],
                                opts: opts,
                                session: session
                            })
                        }
                    } else if (k in resolve.geoloc) {
                        geoloc(ctx, ctx[k], {
                            todo: todo[k],
                            opts: opts,
                            session: session
                        })
                    } else {
                        ctx[k].apply(ctx, [{
                            todo: todo[k],
                            opts: opts,
                            session: session
                        }])
                    }
                    return
                } else {
                    session[k] = null
                }
            }
            onEnd.apply(ctx, [todo, session])
        };
        this.ack = function(result) {
            session[current] = result;
            that.run.apply(that, [])
        }
    }

    function getKeys(obj) {
        var k, keys = [];
        for (k in obj) {
            keys.push(k)
        }
        return keys
    }

    function tuple(args, value) {
        var todo = {};
        if (args.todo) {
            for (var k in args.todo) {
                if (k !== "options" && k !== "values") {
                    todo[k] = args.todo[k]
                }
            }
        }
        var i, keys = ["data", "tag", "id", "events", "onces"];
        for (i = 0; i < keys.length; i++) {
            copyKey(todo, keys[i], value, args.todo)
        }
        todo.options = $.extend({}, args.opts || {}, value.options || {});
        return todo
    }

    function copyKey(target, key) {
        for (var i = 2; i < arguments.length; i++) {
            if (key in arguments[i]) {
                target[key] = arguments[i][key];
                return
            }
        }
    }

    function GeocoderCache() {
        var cache = [];
        this.get = function(request) {
            if (cache.length) {
                var i, j, k, item, eq, keys = getKeys(request);
                for (i = 0; i < cache.length; i++) {
                    item = cache[i];
                    eq = keys.length == item.keys.length;
                    for (j = 0; j < keys.length && eq; j++) {
                        k = keys[j];
                        eq = k in item.request;
                        if (eq) {
                            if (typeof request[k] === "object" && "equals" in request[k] && typeof request[k] === "function") {
                                eq = request[k].equals(item.request[k])
                            } else {
                                eq = request[k] === item.request[k]
                            }
                        }
                    }
                    if (eq) {
                        return item.results
                    }
                }
            }
        };
        this.store = function(request, results) {
            cache.push({
                request: request,
                keys: getKeys(request),
                results: results
            })
        }
    }

    function OverlayView(map, opts, latLng, $div) {
        var that = this,
            listeners = [];
        defaults.classes.OverlayView.call(this);
        this.setMap(map);
        this.onAdd = function() {
            var panes = this.getPanes();
            if (opts.pane in panes) {
                $(panes[opts.pane]).append($div)
            }
            $.each("dblclick click mouseover mousemove mouseout mouseup mousedown".split(" "), function(i, name) {
                listeners.push(google.maps.event.addDomListener($div[0], name, function(e) {
                    $.Event(e).stopPropagation();
                    google.maps.event.trigger(that, name, [e]);
                    that.draw()
                }))
            });
            listeners.push(google.maps.event.addDomListener($div[0], "contextmenu", function(e) {
                $.Event(e).stopPropagation();
                google.maps.event.trigger(that, "rightclick", [e]);
                that.draw()
            }))
        };
        this.getPosition = function() {
            return latLng
        };
        this.draw = function() {
            var ps = this.getProjection().fromLatLngToDivPixel(latLng);
            $div.css("left", ps.x + opts.offset.x + "px").css("top", ps.y + opts.offset.y + "px")
        };
        this.onRemove = function() {
            for (var i = 0; i < listeners.length; i++) {
                google.maps.event.removeListener(listeners[i])
            }
            $div.remove()
        };
        this.hide = function() {
            $div.hide()
        };
        this.show = function() {
            $div.show()
        };
        this.toggle = function() {
            if ($div) {
                if ($div.is(":visible")) {
                    this.show()
                } else {
                    this.hide()
                }
            }
        };
        this.toggleDOM = function() {
            if (this.getMap()) {
                this.setMap(null)
            } else {
                this.setMap(map)
            }
        };
        this.getDOMElement = function() {
            return $div[0]
        }
    }

    function newEmptyOverlay(map, radius) {
        function Overlay() {
            this.onAdd = function() {};
            this.onRemove = function() {};
            this.draw = function() {};
            return defaults.classes.OverlayView.apply(this, [])
        }
        Overlay.prototype = defaults.classes.OverlayView.prototype;
        var obj = new Overlay;
        obj.setMap(map);
        return obj
    }

    function InternalClusterer($container, map, raw) {
        var updating = false,
            updated = false,
            redrawing = false,
            ready = false,
            enabled = true,
            that = this,
            events = [],
            store = {},
            ids = {},
            idxs = {},
            markers = [],
            todos = [],
            values = [],
            overlay = newEmptyOverlay(map, raw.radius),
            timer, projection, ffilter, fdisplay, ferror;
        main();

        function prepareMarker(index) {
            if (!markers[index]) {
                delete todos[index].options.map;
                markers[index] = new defaults.classes.Marker(todos[index].options);
                attachEvents($container, {
                    todo: todos[index]
                }, markers[index], todos[index].id)
            }
        }
        this.getById = function(id) {
            if (id in ids) {
                prepareMarker(ids[id]);
                return markers[ids[id]]
            }
            return false
        };
        this.rm = function(id) {
            var index = ids[id];
            if (markers[index]) {
                markers[index].setMap(null)
            }
            delete markers[index];
            markers[index] = false;
            delete todos[index];
            todos[index] = false;
            delete values[index];
            values[index] = false;
            delete ids[id];
            delete idxs[index];
            updated = true
        };
        this.clearById = function(id) {
            if (id in ids) {
                this.rm(id);
                return true
            }
        };
        this.clear = function(last, first, tag) {
            var start, stop, step, index, i, list = [],
                check = ftag(tag);
            if (last) {
                start = todos.length - 1;
                stop = -1;
                step = -1
            } else {
                start = 0;
                stop = todos.length;
                step = 1
            }
            for (index = start; index != stop; index += step) {
                if (todos[index]) {
                    if (!check || check(todos[index].tag)) {
                        list.push(idxs[index]);
                        if (first || last) {
                            break
                        }
                    }
                }
            }
            for (i = 0; i < list.length; i++) {
                this.rm(list[i])
            }
        };
        this.add = function(todo, value) {
            todo.id = globalId(todo.id);
            this.clearById(todo.id);
            ids[todo.id] = markers.length;
            idxs[markers.length] = todo.id;
            markers.push(null);
            todos.push(todo);
            values.push(value);
            updated = true
        };
        this.addMarker = function(marker, todo) {
            todo = todo || {};
            todo.id = globalId(todo.id);
            this.clearById(todo.id);
            if (!todo.options) {
                todo.options = {}
            }
            todo.options.position = marker.getPosition();
            attachEvents($container, {
                todo: todo
            }, marker, todo.id);
            ids[todo.id] = markers.length;
            idxs[markers.length] = todo.id;
            markers.push(marker);
            todos.push(todo);
            values.push(todo.data || {});
            updated = true
        };
        this.todo = function(index) {
            return todos[index]
        };
        this.value = function(index) {
            return values[index]
        };
        this.marker = function(index) {
            if (index in markers) {
                prepareMarker(index);
                return markers[index]
            }
            return false
        };
        this.markerIsSet = function(index) {
            return Boolean(markers[index])
        };
        this.setMarker = function(index, marker) {
            markers[index] = marker
        };
        this.store = function(cluster, obj, shadow) {
            store[cluster.ref] = {
                obj: obj,
                shadow: shadow
            }
        };
        this.free = function() {
            for (var i = 0; i < events.length; i++) {
                google.maps.event.removeListener(events[i])
            }
            events = [];
            $.each(store, function(key) {
                flush(key)
            });
            store = {};
            $.each(todos, function(i) {
                todos[i] = null
            });
            todos = [];
            $.each(markers, function(i) {
                if (markers[i]) {
                    markers[i].setMap(null);
                    delete markers[i]
                }
            });
            markers = [];
            $.each(values, function(i) {
                delete values[i]
            });
            values = [];
            ids = {};
            idxs = {}
        };
        this.filter = function(f) {
            ffilter = f;
            redraw()
        };
        this.enable = function(value) {
            if (enabled != value) {
                enabled = value;
                redraw()
            }
        };
        this.display = function(f) {
            fdisplay = f
        };
        this.error = function(f) {
            ferror = f
        };
        this.beginUpdate = function() {
            updating = true
        };
        this.endUpdate = function() {
            updating = false;
            if (updated) {
                redraw()
            }
        };
        this.autofit = function(bounds) {
            for (var i = 0; i < todos.length; i++) {
                if (todos[i]) {
                    bounds.extend(todos[i].options.position)
                }
            }
        };

        function main() {
            projection = overlay.getProjection();
            if (!projection) {
                setTimeout(function() {
                    main.apply(that, [])
                }, 25);
                return
            }
            ready = true;
            events.push(google.maps.event.addListener(map, "zoom_changed", function() {
                delayRedraw()
            }));
            events.push(google.maps.event.addListener(map, "bounds_changed", function() {
                delayRedraw()
            }));
            redraw()
        }

        function flush(key) {
            if (typeof store[key] === "object") {
                if (typeof store[key].obj.setMap === "function") {
                    store[key].obj.setMap(null)
                }
                if (typeof store[key].obj.remove === "function") {
                    store[key].obj.remove()
                }
                if (typeof store[key].shadow.remove === "function") {
                    store[key].obj.remove()
                }
                if (typeof store[key].shadow.setMap === "function") {
                    store[key].shadow.setMap(null)
                }
                delete store[key].obj;
                delete store[key].shadow
            } else if (markers[key]) {
                markers[key].setMap(null)
            }
            delete store[key]
        }

        function distanceInMeter() {
            var lat1, lat2, lng1, lng2, e, f, g, h;
            if (arguments[0] instanceof google.maps.LatLng) {
                lat1 = arguments[0].lat();
                lng1 = arguments[0].lng();
                if (arguments[1] instanceof google.maps.LatLng) {
                    lat2 = arguments[1].lat();
                    lng2 = arguments[1].lng()
                } else {
                    lat2 = arguments[1];
                    lng2 = arguments[2]
                }
            } else {
                lat1 = arguments[0];
                lng1 = arguments[1];
                if (arguments[2] instanceof google.maps.LatLng) {
                    lat2 = arguments[2].lat();
                    lng2 = arguments[2].lng()
                } else {
                    lat2 = arguments[2];
                    lng2 = arguments[3]
                }
            }
            e = Math.PI * lat1 / 180;
            f = Math.PI * lng1 / 180;
            g = Math.PI * lat2 / 180;
            h = Math.PI * lng2 / 180;
            return 1e3 * 6371 * Math.acos(Math.min(Math.cos(e) * Math.cos(g) * Math.cos(f) * Math.cos(h) + Math.cos(e) * Math.sin(f) * Math.cos(g) * Math.sin(h) + Math.sin(e) * Math.sin(g), 1))
        }

        function extendsMapBounds() {
            var radius = distanceInMeter(map.getCenter(), map.getBounds().getNorthEast()),
                circle = new google.maps.Circle({
                    center: map.getCenter(),
                    radius: 1.25 * radius
                });
            return circle.getBounds()
        }

        function getStoreKeys() {
            var keys = {},
                k;
            for (k in store) {
                keys[k] = true
            }
            return keys
        }

        function delayRedraw() {
            clearTimeout(timer);
            timer = setTimeout(function() {
                redraw()
            }, 25)
        }

        function extendsBounds(latLng) {
            var p = projection.fromLatLngToDivPixel(latLng),
                ne = projection.fromDivPixelToLatLng(new google.maps.Point(p.x + raw.radius, p.y - raw.radius)),
                sw = projection.fromDivPixelToLatLng(new google.maps.Point(p.x - raw.radius, p.y + raw.radius));
            return new google.maps.LatLngBounds(sw, ne)
        }

        function redraw() {
            if (updating || redrawing || !ready) {
                return
            }
            var keys = [],
                used = {},
                zoom = map.getZoom(),
                forceDisabled = "maxZoom" in raw && zoom > raw.maxZoom,
                previousKeys = getStoreKeys(),
                i, j, k, indexes, check = false,
                bounds, cluster, position, previous, lat, lng, loop;
            updated = false;
            if (zoom > 3) {
                bounds = extendsMapBounds();
                check = bounds.getSouthWest().lng() < bounds.getNorthEast().lng()
            }
            for (i = 0; i < todos.length; i++) {
                if (todos[i] && (!check || bounds.contains(todos[i].options.position)) && (!ffilter || ffilter(values[i]))) {
                    keys.push(i)
                }
            }
            while (1) {
                i = 0;
                while (used[i] && i < keys.length) {
                    i++
                }
                if (i == keys.length) {
                    break
                }
                indexes = [];
                if (enabled && !forceDisabled) {
                    loop = 10;
                    do {
                        previous = indexes;
                        indexes = [];
                        loop--;
                        if (previous.length) {
                            position = bounds.getCenter()
                        } else {
                            position = todos[keys[i]].options.position
                        }
                        bounds = extendsBounds(position);
                        for (j = i; j < keys.length; j++) {
                            if (used[j]) {
                                continue
                            }
                            if (bounds.contains(todos[keys[j]].options.position)) {
                                indexes.push(j)
                            }
                        }
                    } while (previous.length < indexes.length && indexes.length > 1 && loop)
                } else {
                    for (j = i; j < keys.length; j++) {
                        if (used[j]) {
                            continue
                        }
                        indexes.push(j);
                        break
                    }
                }
                cluster = {
                    indexes: [],
                    ref: []
                };
                lat = lng = 0;
                for (k = 0; k < indexes.length; k++) {
                    used[indexes[k]] = true;
                    cluster.indexes.push(keys[indexes[k]]);
                    cluster.ref.push(keys[indexes[k]]);
                    lat += todos[keys[indexes[k]]].options.position.lat();
                    lng += todos[keys[indexes[k]]].options.position.lng()
                }
                lat /= indexes.length;
                lng /= indexes.length;
                cluster.latLng = new google.maps.LatLng(lat, lng);
                cluster.ref = cluster.ref.join("-");
                if (cluster.ref in previousKeys) {
                    delete previousKeys[cluster.ref]
                } else {
                    if (indexes.length === 1) {
                        store[cluster.ref] = true
                    }
                    fdisplay(cluster)
                }
            }
            $.each(previousKeys, function(key) {
                flush(key)
            });
            redrawing = false
        }
    }

    function Clusterer(id, internalClusterer) {
        this.id = function() {
            return id
        };
        this.filter = function(f) {
            internalClusterer.filter(f)
        };
        this.enable = function() {
            internalClusterer.enable(true)
        };
        this.disable = function() {
            internalClusterer.enable(false)
        };
        this.add = function(marker, todo, lock) {
            if (!lock) {
                internalClusterer.beginUpdate()
            }
            internalClusterer.addMarker(marker, todo);
            if (!lock) {
                internalClusterer.endUpdate()
            }
        };
        this.getById = function(id) {
            return internalClusterer.getById(id)
        };
        this.clearById = function(id, lock) {
            var result;
            if (!lock) {
                internalClusterer.beginUpdate()
            }
            result = internalClusterer.clearById(id);
            if (!lock) {
                internalClusterer.endUpdate()
            }
            return result
        };
        this.clear = function(last, first, tag, lock) {
            if (!lock) {
                internalClusterer.beginUpdate()
            }
            internalClusterer.clear(last, first, tag);
            if (!lock) {
                internalClusterer.endUpdate()
            }
        }
    }

    function Store() {
        var store = {},
            objects = {};

        function normalize(res) {
            return {
                id: res.id,
                name: res.name,
                object: res.obj,
                tag: res.tag,
                data: res.data
            }
        }
        this.add = function(args, name, obj, sub) {
            var todo = args.todo || {},
                id = globalId(todo.id);
            if (!store[name]) {
                store[name] = []
            }
            if (id in objects) {
                this.clearById(id)
            }
            objects[id] = {
                obj: obj,
                sub: sub,
                name: name,
                id: id,
                tag: todo.tag,
                data: todo.data
            };
            store[name].push(id);
            return id
        };
        this.getById = function(id, sub, full) {
            if (id in objects) {
                if (sub) {
                    return objects[id].sub
                } else if (full) {
                    return normalize(objects[id])
                }
                return objects[id].obj
            }
            return false
        };
        this.get = function(name, last, tag, full) {
            var n, id, check = ftag(tag);
            if (!store[name] || !store[name].length) {
                return null
            }
            n = store[name].length;
            while (n) {
                n--;
                id = store[name][last ? n : store[name].length - n - 1];
                if (id && objects[id]) {
                    if (check && !check(objects[id].tag)) {
                        continue
                    }
                    return full ? normalize(objects[id]) : objects[id].obj
                }
            }
            return null
        };
        this.all = function(name, tag, full) {
            var result = [],
                check = ftag(tag),
                find = function(n) {
                    var i, id;
                    for (i = 0; i < store[n].length; i++) {
                        id = store[n][i];
                        if (id && objects[id]) {
                            if (check && !check(objects[id].tag)) {
                                continue
                            }
                            result.push(full ? normalize(objects[id]) : objects[id].obj)
                        }
                    }
                };
            if (name in store) {
                find(name)
            } else if (name === undef) {
                for (name in store) {
                    find(name)
                }
            }
            return result
        };

        function rm(obj) {
            if (typeof obj.setMap === "function") {
                obj.setMap(null)
            }
            if (typeof obj.remove === "function") {
                obj.remove()
            }
            if (typeof obj.free === "function") {
                obj.free()
            }
            obj = null
        }
        this.rm = function(name, check, pop) {
            var idx, id;
            if (!store[name]) {
                return false
            }
            if (check) {
                if (pop) {
                    for (idx = store[name].length - 1; idx >= 0; idx--) {
                        id = store[name][idx];
                        if (check(objects[id].tag)) {
                            break
                        }
                    }
                } else {
                    for (idx = 0; idx < store[name].length; idx++) {
                        id = store[name][idx];
                        if (check(objects[id].tag)) {
                            break
                        }
                    }
                }
            } else {
                idx = pop ? store[name].length - 1 : 0
            }
            if (!(idx in store[name])) {
                return false
            }
            return this.clearById(store[name][idx], idx)
        };
        this.clearById = function(id, idx) {
            if (id in objects) {
                var i, name = objects[id].name;
                for (i = 0; idx === undef && i < store[name].length; i++) {
                    if (id === store[name][i]) {
                        idx = i
                    }
                }
                rm(objects[id].obj);
                if (objects[id].sub) {
                    rm(objects[id].sub)
                }
                delete objects[id];
                store[name].splice(idx, 1);
                return true
            }
            return false
        };
        this.objGetById = function(id) {
            var result;
            if (store["clusterer"]) {
                for (var idx in store["clusterer"]) {
                    if ((result = objects[store["clusterer"][idx]].obj.getById(id)) !== false) {
                        return result
                    }
                }
            }
            return false
        };
        this.objClearById = function(id) {
            if (store["clusterer"]) {
                for (var idx in store["clusterer"]) {
                    if (objects[store["clusterer"][idx]].obj.clearById(id)) {
                        return true
                    }
                }
            }
            return null
        };
        this.clear = function(list, last, first, tag) {
            var k, i, name, check = ftag(tag);
            if (!list || !list.length) {
                list = [];
                for (k in store) {
                    list.push(k)
                }
            } else {
                list = array(list)
            }
            for (i = 0; i < list.length; i++) {
                name = list[i];
                if (last) {
                    this.rm(name, check, true)
                } else if (first) {
                    this.rm(name, check, false)
                } else {
                    while (this.rm(name, check, false));
                }
            }
        };
        this.objClear = function(list, last, first, tag) {
            if (store["clusterer"] && ($.inArray("marker", list) >= 0 || !list.length)) {
                for (var idx in store["clusterer"]) {
                    objects[store["clusterer"][idx]].obj.clear(last, first, tag)
                }
            }
        }
    }
    var services = {},
        geocoderCache = new GeocoderCache;

    function geocoder() {
        if (!services.geocoder) {
            services.geocoder = new google.maps.Geocoder
        }
        return services.geocoder
    }

    function directionsService() {
        if (!services.directionsService) {
            services.directionsService = new google.maps.DirectionsService
        }
        return services.directionsService
    }

    function elevationService() {
        if (!services.elevationService) {
            services.elevationService = new google.maps.ElevationService
        }
        return services.elevationService
    }

    function maxZoomService() {
        if (!services.maxZoomService) {
            services.maxZoomService = new google.maps.MaxZoomService
        }
        return services.maxZoomService
    }

    function distanceMatrixService() {
        if (!services.distanceMatrixService) {
            services.distanceMatrixService = new google.maps.DistanceMatrixService
        }
        return services.distanceMatrixService
    }

    function error() {
        if (defaults.verbose) {
            var i, err = [];
            if (window.console && typeof console.error === "function") {
                for (i = 0; i < arguments.length; i++) {
                    err.push(arguments[i])
                }
                console.error.apply(console, err)
            } else {
                err = "";
                for (i = 0; i < arguments.length; i++) {
                    err += arguments[i].toString() + " "
                }
                alert(err)
            }
        }
    }

    function numeric(mixed) {
        return (typeof mixed === "number" || typeof mixed === "string") && mixed !== "" && !isNaN(mixed)
    }

    function array(mixed) {
        var k, a = [];
        if (mixed !== undef) {
            if (typeof mixed === "object") {
                if (typeof mixed.length === "number") {
                    a = mixed
                } else {
                    for (k in mixed) {
                        a.push(mixed[k])
                    }
                }
            } else {
                a.push(mixed)
            }
        }
        return a
    }

    function ftag(tag) {
        if (tag) {
            if (typeof tag === "function") {
                return tag
            }
            tag = array(tag);
            return function(val) {
                if (val === undef) {
                    return false
                }
                if (typeof val === "object") {
                    for (var i = 0; i < val.length; i++) {
                        if ($.inArray(val[i], tag) >= 0) {
                            return true
                        }
                    }
                    return false
                }
                return $.inArray(val, tag) >= 0
            }
        }
    }

    function toLatLng(mixed, emptyReturnMixed, noFlat) {
        var empty = emptyReturnMixed ? mixed : null;
        if (!mixed || typeof mixed === "string") {
            return empty
        }
        if (mixed.latLng) {
            return toLatLng(mixed.latLng)
        }
        if (mixed instanceof google.maps.LatLng) {
            return mixed
        } else if (numeric(mixed.lat)) {
            return new google.maps.LatLng(mixed.lat, mixed.lng)
        } else if (!noFlat && $.isArray(mixed)) {
            if (!numeric(mixed[0]) || !numeric(mixed[1])) {
                return empty
            }
            return new google.maps.LatLng(mixed[0], mixed[1])
        }
        return empty
    }

    function toLatLngBounds(mixed) {
        var ne, sw;
        if (!mixed || mixed instanceof google.maps.LatLngBounds) {
            return mixed || null
        }
        if ($.isArray(mixed)) {
            if (mixed.length == 2) {
                ne = toLatLng(mixed[0]);
                sw = toLatLng(mixed[1])
            } else if (mixed.length == 4) {
                ne = toLatLng([mixed[0], mixed[1]]);
                sw = toLatLng([mixed[2], mixed[3]])
            }
        } else {
            if ("ne" in mixed && "sw" in mixed) {
                ne = toLatLng(mixed.ne);
                sw = toLatLng(mixed.sw)
            } else if ("n" in mixed && "e" in mixed && "s" in mixed && "w" in mixed) {
                ne = toLatLng([mixed.n, mixed.e]);
                sw = toLatLng([mixed.s, mixed.w])
            }
        }
        if (ne && sw) {
            return new google.maps.LatLngBounds(sw, ne)
        }
        return null
    }

    function resolveLatLng(ctx, method, runLatLng, args, attempt) {
        var latLng = runLatLng ? toLatLng(args.todo, false, true) : false,
            conf = latLng ? {
                latLng: latLng
            } : args.todo.address ? typeof args.todo.address === "string" ? {
                address: args.todo.address
            } : args.todo.address : false,
            cache = conf ? geocoderCache.get(conf) : false,
            that = this;
        if (conf) {
            attempt = attempt || 0;
            if (cache) {
                args.latLng = cache.results[0].geometry.location;
                args.results = cache.results;
                args.status = cache.status;
                method.apply(ctx, [args])
            } else {
                if (conf.location) {
                    conf.location = toLatLng(conf.location)
                }
                if (conf.bounds) {
                    conf.bounds = toLatLngBounds(conf.bounds)
                }
                geocoder().geocode(conf, function(results, status) {
                    if (status === google.maps.GeocoderStatus.OK) {
                        geocoderCache.store(conf, {
                            results: results,
                            status: status
                        });
                        args.latLng = results[0].geometry.location;
                        args.results = results;
                        args.status = status;
                        method.apply(ctx, [args])
                    } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT && attempt < defaults.queryLimit.attempt) {
                        setTimeout(function() {
                            resolveLatLng.apply(that, [ctx, method, runLatLng, args, attempt + 1])
                        }, defaults.queryLimit.delay + Math.floor(Math.random() * defaults.queryLimit.random))
                    } else {
                        error("geocode failed", status, conf);
                        args.latLng = args.results = false;
                        args.status = status;
                        method.apply(ctx, [args])
                    }
                })
            }
        } else {
            args.latLng = toLatLng(args.todo, false, true);
            method.apply(ctx, [args])
        }
    }

    function resolveAllLatLng(list, ctx, method, args) {
        var that = this,
            i = -1;

        function resolve() {
            do {
                i++
            } while (i < list.length && !("address" in list[i]));
            if (i >= list.length) {
                method.apply(ctx, [args]);
                return
            }
            resolveLatLng(that, function(args) {
                delete args.todo;
                $.extend(list[i], args);
                resolve.apply(that, [])
            }, true, {
                todo: list[i]
            })
        }
        resolve()
    }

    function geoloc(ctx, method, args) {
        var is_echo = false;
        if (navigator && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(pos) {
                if (is_echo) {
                    return
                }
                is_echo = true;
                args.latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                method.apply(ctx, [args])
            }, function() {
                if (is_echo) {
                    return
                }
                is_echo = true;
                args.latLng = false;
                method.apply(ctx, [args])
            }, args.opts.getCurrentPosition)
        } else {
            args.latLng = false;
            method.apply(ctx, [args])
        }
    }

    function Gmap3($this) {
        var that = this,
            stack = new Stack,
            store = new Store,
            map = null,
            task;
        this._plan = function(list) {
            for (var k = 0; k < list.length; k++) {
                stack.add(new Task(that, end, list[k]))
            }
            run()
        };

        function run() {
            if (!task && (task = stack.get())) {
                task.run()
            }
        }

        function end() {
            task = null;
            stack.ack();
            run.call(that)
        }

        function callback(args) {
            if (args.todo.callback) {
                var params = Array.prototype.slice.call(arguments, 1);
                if (typeof args.todo.callback === "function") {
                    args.todo.callback.apply($this, params)
                } else if ($.isArray(args.todo.callback)) {
                    if (typeof args.todo.callback[1] === "function") {
                        args.todo.callback[1].apply(args.todo.callback[0], params)
                    }
                }
            }
        }

        function manageEnd(args, obj, id) {
            if (id) {
                attachEvents($this, args, obj, id)
            }
            callback(args, obj);
            task.ack(obj)
        }

        function newMap(latLng, args) {
            args = args || {};
            if (map) {
                if (args.todo && args.todo.options) {
                    if (args.todo.options.center) {
                        args.todo.options.center = toLatLng(args.todo.options.center)
                    }
                    map.setOptions(args.todo.options)
                }
            } else {
                var opts = args.opts || $.extend(true, {}, defaults.map, args.todo && args.todo.options ? args.todo.options : {});
                opts.center = latLng || toLatLng(opts.center);
                map = new defaults.classes.Map($this.get(0), opts)
            }
        }
        this.map = function(args) {
            newMap(args.latLng, args);
            attachEvents($this, args, map);
            manageEnd(args, map)
        };
        this.destroy = function(args) {
            store.clear();
            $this.empty();
            if (map) {
                map = null
            }
            manageEnd(args, true)
        };
        this.infowindow = function(args) {
            var objs = [],
                multiple = "values" in args.todo;
            if (!multiple) {
                if (args.latLng) {
                    args.opts.position = args.latLng
                }
                args.todo.values = [{
                    options: args.opts
                }]
            }
            $.each(args.todo.values, function(i, value) {
                var id, obj, todo = tuple(args, value);
                todo.options.position = todo.options.position ? toLatLng(todo.options.position) : toLatLng(value.latLng);
                if (!map) {
                    newMap(todo.options.position)
                }
                obj = new defaults.classes.InfoWindow(todo.options);
                if (obj && (todo.open === undef || todo.open)) {
                    if (multiple) {
                        obj.open(map, todo.anchor ? todo.anchor : undef)
                    } else {
                        obj.open(map, todo.anchor ? todo.anchor : args.latLng ? undef : args.session.marker ? args.session.marker : undef)
                    }
                }
                objs.push(obj);
                id = store.add({
                    todo: todo
                }, "infowindow", obj);
                attachEvents($this, {
                    todo: todo
                }, obj, id)
            });
            manageEnd(args, multiple ? objs : objs[0])
        };
        this.circle = function(args) {
            var objs = [],
                multiple = "values" in args.todo;
            if (!multiple) {
                args.opts.center = args.latLng || toLatLng(args.opts.center);
                args.todo.values = [{
                    options: args.opts
                }]
            }
            if (!args.todo.values.length) {
                manageEnd(args, false);
                return
            }
            $.each(args.todo.values, function(i, value) {
                var id, obj, todo = tuple(args, value);
                todo.options.center = todo.options.center ? toLatLng(todo.options.center) : toLatLng(value);
                if (!map) {
                    newMap(todo.options.center)
                }
                todo.options.map = map;
                obj = new defaults.classes.Circle(todo.options);
                objs.push(obj);
                id = store.add({
                    todo: todo
                }, "circle", obj);
                attachEvents($this, {
                    todo: todo
                }, obj, id)
            });
            manageEnd(args, multiple ? objs : objs[0])
        };
        this.overlay = function(args, internal) {
            var objs = [],
                multiple = "values" in args.todo;
            if (!multiple) {
                args.todo.values = [{
                    latLng: args.latLng,
                    options: args.opts
                }]
            }
            if (!args.todo.values.length) {
                manageEnd(args, false);
                return
            }
            if (!OverlayView.__initialised) {
                OverlayView.prototype = new defaults.classes.OverlayView;
                OverlayView.__initialised = true
            }
            $.each(args.todo.values, function(i, value) {
                var id, obj, todo = tuple(args, value),
                    $div = $(document.createElement("div")).css({
                        border: "none",
                        borderWidth: "0px",
                        position: "absolute"
                    });
                $div.append(todo.options.content);
                obj = new OverlayView(map, todo.options, toLatLng(todo) || toLatLng(value), $div);
                objs.push(obj);
                $div = null;
                if (!internal) {
                    id = store.add(args, "overlay", obj);
                    attachEvents($this, {
                        todo: todo
                    }, obj, id)
                }
            });
            if (internal) {
                return objs[0]
            }
            manageEnd(args, multiple ? objs : objs[0])
        };
        this.getaddress = function(args) {
            callback(args, args.results, args.status);
            task.ack()
        };
        this.getlatlng = function(args) {
            callback(args, args.results, args.status);
            task.ack()
        };
        this.getmaxzoom = function(args) {
            maxZoomService().getMaxZoomAtLatLng(args.latLng, function(result) {
                callback(args, result.status === google.maps.MaxZoomStatus.OK ? result.zoom : false, status);
                task.ack()
            })
        };
        this.getelevation = function(args) {
            var i, locations = [],
                f = function(results, status) {
                    callback(args, status === google.maps.ElevationStatus.OK ? results : false, status);
                    task.ack()
                };
            if (args.latLng) {
                locations.push(args.latLng)
            } else {
                locations = array(args.todo.locations || []);
                for (i = 0; i < locations.length; i++) {
                    locations[i] = toLatLng(locations[i])
                }
            }
            if (locations.length) {
                elevationService().getElevationForLocations({
                    locations: locations
                }, f)
            } else {
                if (args.todo.path && args.todo.path.length) {
                    for (i = 0; i < args.todo.path.length; i++) {
                        locations.push(toLatLng(args.todo.path[i]))
                    }
                }
                if (locations.length) {
                    elevationService().getElevationAlongPath({
                        path: locations,
                        samples: args.todo.samples
                    }, f)
                } else {
                    task.ack()
                }
            }
        };
        this.defaults = function(args) {
            $.each(args.todo, function(name, value) {
                if (typeof defaults[name] === "object") {
                    defaults[name] = $.extend({}, defaults[name], value)
                } else {
                    defaults[name] = value
                }
            });
            task.ack(true)
        };
        this.rectangle = function(args) {
            var objs = [],
                multiple = "values" in args.todo;
            if (!multiple) {
                args.todo.values = [{
                    options: args.opts
                }]
            }
            if (!args.todo.values.length) {
                manageEnd(args, false);
                return
            }
            $.each(args.todo.values, function(i, value) {
                var id, obj, todo = tuple(args, value);
                todo.options.bounds = todo.options.bounds ? toLatLngBounds(todo.options.bounds) : toLatLngBounds(value);
                if (!map) {
                    newMap(todo.options.bounds.getCenter())
                }
                todo.options.map = map;
                obj = new defaults.classes.Rectangle(todo.options);
                objs.push(obj);
                id = store.add({
                    todo: todo
                }, "rectangle", obj);
                attachEvents($this, {
                    todo: todo
                }, obj, id)
            });
            manageEnd(args, multiple ? objs : objs[0])
        };

        function poly(args, poly, path) {
            var objs = [],
                multiple = "values" in args.todo;
            if (!multiple) {
                args.todo.values = [{
                    options: args.opts
                }]
            }
            if (!args.todo.values.length) {
                manageEnd(args, false);
                return
            }
            newMap();
            $.each(args.todo.values, function(_, value) {
                var id, i, j, obj, todo = tuple(args, value);
                if (todo.options[path]) {
                    if (todo.options[path][0][0] && $.isArray(todo.options[path][0][0])) {
                        for (i = 0; i < todo.options[path].length; i++) {
                            for (j = 0; j < todo.options[path][i].length; j++) {
                                todo.options[path][i][j] = toLatLng(todo.options[path][i][j])
                            }
                        }
                    } else {
                        for (i = 0; i < todo.options[path].length; i++) {
                            todo.options[path][i] = toLatLng(todo.options[path][i])
                        }
                    }
                }
                todo.options.map = map;
                obj = new google.maps[poly](todo.options);
                objs.push(obj);
                id = store.add({
                    todo: todo
                }, poly.toLowerCase(), obj);
                attachEvents($this, {
                    todo: todo
                }, obj, id)
            });
            manageEnd(args, multiple ? objs : objs[0])
        }
        this.polyline = function(args) {
            poly(args, "Polyline", "path")
        };
        this.polygon = function(args) {
            poly(args, "Polygon", "paths")
        };
        this.trafficlayer = function(args) {
            newMap();
            var obj = store.get("trafficlayer");
            if (!obj) {
                obj = new defaults.classes.TrafficLayer;
                obj.setMap(map);
                store.add(args, "trafficlayer", obj)
            }
            manageEnd(args, obj)
        };
        this.bicyclinglayer = function(args) {
            newMap();
            var obj = store.get("bicyclinglayer");
            if (!obj) {
                obj = new defaults.classes.BicyclingLayer;
                obj.setMap(map);
                store.add(args, "bicyclinglayer", obj)
            }
            manageEnd(args, obj)
        };
        this.groundoverlay = function(args) {
            args.opts.bounds = toLatLngBounds(args.opts.bounds);
            if (args.opts.bounds) {
                newMap(args.opts.bounds.getCenter())
            }
            var id, obj = new defaults.classes.GroundOverlay(args.opts.url, args.opts.bounds, args.opts.opts);
            obj.setMap(map);
            id = store.add(args, "groundoverlay", obj);
            manageEnd(args, obj, id)
        };
        this.streetviewpanorama = function(args) {
            if (!args.opts.opts) {
                args.opts.opts = {}
            }
            if (args.latLng) {
                args.opts.opts.position = args.latLng
            } else if (args.opts.opts.position) {
                args.opts.opts.position = toLatLng(args.opts.opts.position)
            }
            if (args.todo.divId) {
                args.opts.container = document.getElementById(args.todo.divId)
            } else if (args.opts.container) {
                args.opts.container = $(args.opts.container).get(0)
            }
            var id, obj = new defaults.classes.StreetViewPanorama(args.opts.container, args.opts.opts);
            if (obj) {
                map.setStreetView(obj)
            }
            id = store.add(args, "streetviewpanorama", obj);
            manageEnd(args, obj, id)
        };
        this.kmllayer = function(args) {
            var objs = [],
                multiple = "values" in args.todo;
            if (!multiple) {
                args.todo.values = [{
                    options: args.opts
                }]
            }
            if (!args.todo.values.length) {
                manageEnd(args, false);
                return
            }
            $.each(args.todo.values, function(i, value) {
                var id, obj, options, todo = tuple(args, value);
                if (!map) {
                    newMap()
                }
                options = todo.options;
                if (todo.options.opts) {
                    options = todo.options.opts;
                    if (todo.options.url) {
                        options.url = todo.options.url
                    }
                }
                options.map = map;
                if (googleVersionMin("3.10")) {
                    obj = new defaults.classes.KmlLayer(options)
                } else {
                    obj = new defaults.classes.KmlLayer(options.url, options)
                }
                objs.push(obj);
                id = store.add({
                    todo: todo
                }, "kmllayer", obj);
                attachEvents($this, {
                    todo: todo
                }, obj, id)
            });
            manageEnd(args, multiple ? objs : objs[0])
        };
        this.panel = function(args) {
            newMap();
            var id, x = 0,
                y = 0,
                $content, $div = $(document.createElement("div"));
            $div.css({
                position: "absolute",
                zIndex: 1e3,
                visibility: "hidden"
            });
            if (args.opts.content) {
                $content = $(args.opts.content);
                $div.append($content);
                $this.first().prepend($div);
                if (args.opts.left !== undef) {
                    x = args.opts.left
                } else if (args.opts.right !== undef) {
                    x = $this.width() - $content.width() - args.opts.right
                } else if (args.opts.center) {
                    x = ($this.width() - $content.width()) / 2
                }
                if (args.opts.top !== undef) {
                    y = args.opts.top
                } else if (args.opts.bottom !== undef) {
                    y = $this.height() - $content.height() - args.opts.bottom
                } else if (args.opts.middle) {
                    y = ($this.height() - $content.height()) / 2
                }
                $div.css({
                    top: y,
                    left: x,
                    visibility: "visible"
                })
            }
            id = store.add(args, "panel", $div);
            manageEnd(args, $div, id);
            $div = null
        };

        function createClusterer(raw) {
            var internalClusterer = new InternalClusterer($this, map, raw),
                todo = {},
                styles = {},
                thresholds = [],
                isInt = /^[0-9]+$/,
                calculator, k;
            for (k in raw) {
                if (isInt.test(k)) {
                    thresholds.push(1 * k);
                    styles[k] = raw[k];
                    styles[k].width = styles[k].width || 0;
                    styles[k].height = styles[k].height || 0
                } else {
                    todo[k] = raw[k]
                }
            }
            thresholds.sort(function(a, b) {
                return a > b
            });
            if (todo.calculator) {
                calculator = function(indexes) {
                    var data = [];
                    $.each(indexes, function(i, index) {
                        data.push(internalClusterer.value(index))
                    });
                    return todo.calculator.apply($this, [data])
                }
            } else {
                calculator = function(indexes) {
                    return indexes.length
                }
            }
            internalClusterer.error(function() {
                error.apply(that, arguments)
            });
            internalClusterer.display(function(cluster) {
                var i, style, atodo, obj, offset, cnt = calculator(cluster.indexes);
                if (raw.force || cnt > 1) {
                    for (i = 0; i < thresholds.length; i++) {
                        if (thresholds[i] <= cnt) {
                            style = styles[thresholds[i]]
                        }
                    }
                }
                if (style) {
                    offset = style.offset || [-style.width / 2, -style.height / 2];
                    atodo = $.extend({}, todo);
                    atodo.options = $.extend({
                        pane: "overlayLayer",
                        content: style.content ? style.content.replace("CLUSTER_COUNT", cnt) : "",
                        offset: {
                            x: ("x" in offset ? offset.x : offset[0]) || 0,
                            y: ("y" in offset ? offset.y : offset[1]) || 0
                        }
                    }, todo.options || {});
                    obj = that.overlay({
                        todo: atodo,
                        opts: atodo.options,
                        latLng: toLatLng(cluster)
                    }, true);
                    atodo.options.pane = "floatShadow";
                    atodo.options.content = $(document.createElement("div")).width(style.width + "px").height(style.height + "px").css({
                        cursor: "pointer"
                    });
                    shadow = that.overlay({
                        todo: atodo,
                        opts: atodo.options,
                        latLng: toLatLng(cluster)
                    }, true);
                    todo.data = {
                        latLng: toLatLng(cluster),
                        markers: []
                    };
                    $.each(cluster.indexes, function(i, index) {
                        todo.data.markers.push(internalClusterer.value(index));
                        if (internalClusterer.markerIsSet(index)) {
                            internalClusterer.marker(index).setMap(null)
                        }
                    });
                    attachEvents($this, {
                        todo: todo
                    }, shadow, undef, {
                        main: obj,
                        shadow: shadow
                    });
                    internalClusterer.store(cluster, obj, shadow)
                } else {
                    $.each(cluster.indexes, function(i, index) {
                        internalClusterer.marker(index).setMap(map)
                    })
                }
            });
            return internalClusterer
        }
        this.marker = function(args) {
            var multiple = "values" in args.todo,
                init = !map;
            if (!multiple) {
                args.opts.position = args.latLng || toLatLng(args.opts.position);
                args.todo.values = [{
                    options: args.opts
                }]
            }
            if (!args.todo.values.length) {
                manageEnd(args, false);
                return
            }
            if (init) {
                newMap()
            }
            if (args.todo.cluster && !map.getBounds()) {
                google.maps.event.addListenerOnce(map, "bounds_changed", function() {
                    that.marker.apply(that, [args])
                });
                return
            }
            if (args.todo.cluster) {
                var clusterer, internalClusterer;
                if (args.todo.cluster instanceof Clusterer) {
                    clusterer = args.todo.cluster;
                    internalClusterer = store.getById(clusterer.id(), true)
                } else {
                    internalClusterer = createClusterer(args.todo.cluster);
                    clusterer = new Clusterer(globalId(args.todo.id, true), internalClusterer);
                    store.add(args, "clusterer", clusterer, internalClusterer)
                }
                internalClusterer.beginUpdate();
                $.each(args.todo.values, function(i, value) {
                    var todo = tuple(args, value);
                    todo.options.position = todo.options.position ? toLatLng(todo.options.position) : toLatLng(value);
                    todo.options.map = map;
                    if (init) {
                        map.setCenter(todo.options.position);
                        init = false
                    }
                    internalClusterer.add(todo, value)
                });
                internalClusterer.endUpdate();
                manageEnd(args, clusterer)
            } else {
                var objs = [];
                $.each(args.todo.values, function(i, value) {
                    var id, obj, todo = tuple(args, value);
                    todo.options.position = todo.options.position ? toLatLng(todo.options.position) : toLatLng(value);
                    todo.options.map = map;
                    if (init) {
                        map.setCenter(todo.options.position);
                        init = false
                    }
                    obj = new defaults.classes.Marker(todo.options);
                    objs.push(obj);
                    id = store.add({
                        todo: todo
                    }, "marker", obj);
                    attachEvents($this, {
                        todo: todo
                    }, obj, id)
                });
                manageEnd(args, multiple ? objs : objs[0])
            }
        };
        this.getroute = function(args) {
            args.opts.origin = toLatLng(args.opts.origin, true);
            args.opts.destination = toLatLng(args.opts.destination, true);
            directionsService().route(args.opts, function(results, status) {
                callback(args, status == google.maps.DirectionsStatus.OK ? results : false, status);
                task.ack()
            })
        };
        this.directionsrenderer = function(args) {
            args.opts.map = map;
            var id, obj = new google.maps.DirectionsRenderer(args.opts);
            if (args.todo.divId) {
                obj.setPanel(document.getElementById(args.todo.divId))
            } else if (args.todo.container) {
                obj.setPanel($(args.todo.container).get(0))
            }
            id = store.add(args, "directionsrenderer", obj);
            manageEnd(args, obj, id)
        };
        this.getgeoloc = function(args) {
            manageEnd(args, args.latLng)
        };
        this.styledmaptype = function(args) {
            newMap();
            var obj = new defaults.classes.StyledMapType(args.todo.styles, args.opts);
            map.mapTypes.set(args.todo.id, obj);
            manageEnd(args, obj)
        };
        this.imagemaptype = function(args) {
            newMap();
            var obj = new defaults.classes.ImageMapType(args.opts);
            map.mapTypes.set(args.todo.id, obj);
            manageEnd(args, obj)
        };
        this.autofit = function(args) {
            var bounds = new google.maps.LatLngBounds;
            $.each(store.all(), function(i, obj) {
                if (obj.getPosition) {
                    bounds.extend(obj.getPosition())
                } else if (obj.getBounds) {
                    bounds.extend(obj.getBounds().getNorthEast());
                    bounds.extend(obj.getBounds().getSouthWest())
                } else if (obj.getPaths) {
                    obj.getPaths().forEach(function(path) {
                        path.forEach(function(latLng) {
                            bounds.extend(latLng)
                        })
                    })
                } else if (obj.getPath) {
                    obj.getPath().forEach(function(latLng) {
                        bounds.extend(latLng);
                        ""
                    })
                } else if (obj.getCenter) {
                    bounds.extend(obj.getCenter())
                } else if (obj instanceof Clusterer) {
                    obj = store.getById(obj.id(), true);
                    if (obj) {
                        obj.autofit(bounds)
                    }
                }
            });
            if (!bounds.isEmpty() && (!map.getBounds() || !map.getBounds().equals(bounds))) {
                if ("maxZoom" in args.todo) {
                    google.maps.event.addListenerOnce(map, "bounds_changed", function() {
                        if (this.getZoom() > args.todo.maxZoom) {
                            this.setZoom(args.todo.maxZoom)
                        }
                    })
                }
                map.fitBounds(bounds)
            }
            manageEnd(args, true)
        };
        this.clear = function(args) {
            if (typeof args.todo === "string") {
                if (store.clearById(args.todo) || store.objClearById(args.todo)) {
                    manageEnd(args, true);
                    return
                }
                args.todo = {
                    name: args.todo
                }
            }
            if (args.todo.id) {
                $.each(array(args.todo.id), function(i, id) {
                    store.clearById(id) || store.objClearById(id)
                })
            } else {
                store.clear(array(args.todo.name), args.todo.last, args.todo.first, args.todo.tag);
                store.objClear(array(args.todo.name), args.todo.last, args.todo.first, args.todo.tag)
            }
            manageEnd(args, true)
        };
        this.exec = function(args) {
            var that = this;
            $.each(array(args.todo.func), function(i, func) {
                $.each(that.get(args.todo, true, args.todo.hasOwnProperty("full") ? args.todo.full : true), function(j, res) {
                    func.call($this, res)
                })
            });
            manageEnd(args, true)
        };
        this.get = function(args, direct, full) {
            var name, res, todo = direct ? args : args.todo;
            if (!direct) {
                full = todo.full
            }
            if (typeof todo === "string") {
                res = store.getById(todo, false, full) || store.objGetById(todo);
                if (res === false) {
                    name = todo;
                    todo = {}
                }
            } else {
                name = todo.name
            }
            if (name === "map") {
                res = map
            }
            if (!res) {
                res = [];
                if (todo.id) {
                    $.each(array(todo.id), function(i, id) {
                        res.push(store.getById(id, false, full) || store.objGetById(id))
                    });
                    if (!$.isArray(todo.id)) {
                        res = res[0]
                    }
                } else {
                    $.each(name ? array(name) : [undef], function(i, aName) {
                        var result;
                        if (todo.first) {
                            result = store.get(aName, false, todo.tag, full);
                            if (result) res.push(result)
                        } else if (todo.all) {
                            $.each(store.all(aName, todo.tag, full), function(i, result) {
                                res.push(result)
                            })
                        } else {
                            result = store.get(aName, true, todo.tag, full);
                            if (result) res.push(result)
                        }
                    });
                    if (!todo.all && !$.isArray(name)) {
                        res = res[0]
                    }
                }
            }
            res = $.isArray(res) || !todo.all ? res : [res];
            if (direct) {
                return res
            } else {
                manageEnd(args, res)
            }
        };
        this.getdistance = function(args) {
            var i;
            args.opts.origins = array(args.opts.origins);
            for (i = 0; i < args.opts.origins.length; i++) {
                args.opts.origins[i] = toLatLng(args.opts.origins[i], true)
            }
            args.opts.destinations = array(args.opts.destinations);
            for (i = 0; i < args.opts.destinations.length; i++) {
                args.opts.destinations[i] = toLatLng(args.opts.destinations[i], true)
            }
            distanceMatrixService().getDistanceMatrix(args.opts, function(results, status) {
                callback(args, status === google.maps.DistanceMatrixStatus.OK ? results : false, status);
                task.ack()
            })
        };
        this.trigger = function(args) {
            if (typeof args.todo === "string") {
                google.maps.event.trigger(map, args.todo)
            } else {
                var options = [map, args.todo.eventName];
                if (args.todo.var_args) {
                    $.each(args.todo.var_args, function(i, v) {
                        options.push(v)
                    })
                }
                google.maps.event.trigger.apply(google.maps.event, options)
            }
            callback(args);
            task.ack()
        }
    }

    function isDirectGet(obj) {
        var k;
        if (!typeof obj === "object" || !obj.hasOwnProperty("get")) {
            return false
        }
        for (k in obj) {
            if (k !== "get") {
                return false
            }
        }
        return !obj.get.hasOwnProperty("callback")
    }
    $.fn.gmap3 = function() {
        var i, list = [],
            empty = true,
            results = [];
        initDefaults();
        for (i = 0; i < arguments.length; i++) {
            if (arguments[i]) {
                list.push(arguments[i])
            }
        }
        if (!list.length) {
            list.push("map")
        }
        $.each(this, function() {
            var $this = $(this),
                gmap3 = $this.data("gmap3");
            empty = false;
            if (!gmap3) {
                gmap3 = new Gmap3($this);
                $this.data("gmap3", gmap3)
            }
            if (list.length === 1 && (list[0] === "get" || isDirectGet(list[0]))) {
                if (list[0] === "get") {
                    results.push(gmap3.get("map", true))
                } else {
                    results.push(gmap3.get(list[0].get, true, list[0].get.full))
                }
            } else {
                gmap3._plan(list)
            }
        });
        if (results.length) {
            if (results.length === 1) {
                return results[0]
            } else {
                return results
            }
        }
        return this
    }
})(jQuery);
(function($, undefined) {
    function isOverAxis(x, reference, size) {
        return x > reference && x < reference + size
    }

    function isFloating(item) {
        return /left|right/.test(item.css("float")) || /inline|table-cell/.test(item.css("display"))
    }
    $.widget("ui.sortable", $.ui.mouse, {
        version: "1.10.3",
        widgetEventPrefix: "sort",
        ready: false,
        options: {
            appendTo: "parent",
            axis: false,
            connectWith: false,
            containment: false,
            cursor: "auto",
            cursorAt: false,
            dropOnEmpty: true,
            forcePlaceholderSize: false,
            forceHelperSize: false,
            grid: false,
            handle: false,
            helper: "original",
            items: "> *",
            opacity: false,
            placeholder: false,
            revert: false,
            scroll: true,
            scrollSensitivity: 20,
            scrollSpeed: 20,
            scope: "default",
            tolerance: "intersect",
            zIndex: 1e3,
            activate: null,
            beforeStop: null,
            change: null,
            deactivate: null,
            out: null,
            over: null,
            receive: null,
            remove: null,
            sort: null,
            start: null,
            stop: null,
            update: null
        },
        _create: function() {
            var o = this.options;
            this.containerCache = {};
            this.element.addClass("ui-sortable");
            this.refresh();
            this.floating = this.items.length ? o.axis === "x" || isFloating(this.items[0].item) : false;
            this.offset = this.element.offset();
            this._mouseInit();
            this.ready = true
        },
        _destroy: function() {
            this.element.removeClass("ui-sortable ui-sortable-disabled");
            this._mouseDestroy();
            for (var i = this.items.length - 1; i >= 0; i--) {
                this.items[i].item.removeData(this.widgetName + "-item")
            }
            return this
        },
        _setOption: function(key, value) {
            if (key === "disabled") {
                this.options[key] = value;
                this.widget().toggleClass("ui-sortable-disabled", !!value)
            } else {
                $.Widget.prototype._setOption.apply(this, arguments)
            }
        },
        _mouseCapture: function(event, overrideHandle) {
            var currentItem = null,
                validHandle = false,
                that = this;
            if (this.reverting) {
                return false
            }
            if (this.options.disabled || this.options.type === "static") {
                return false
            }
            this._refreshItems(event);
            $(event.target).parents().each(function() {
                if ($.data(this, that.widgetName + "-item") === that) {
                    currentItem = $(this);
                    return false
                }
            });
            if ($.data(event.target, that.widgetName + "-item") === that) {
                currentItem = $(event.target)
            }
            if (!currentItem) {
                return false
            }
            if (this.options.handle && !overrideHandle) {
                $(this.options.handle, currentItem).find("*").addBack().each(function() {
                    if (this === event.target) {
                        validHandle = true
                    }
                });
                if (!validHandle) {
                    return false
                }
            }
            this.currentItem = currentItem;
            this._removeCurrentsFromItems();
            return true
        },
        _mouseStart: function(event, overrideHandle, noActivation) {
            var i, body, o = this.options;
            this.currentContainer = this;
            this.refreshPositions();
            this.helper = this._createHelper(event);
            this._cacheHelperProportions();
            this._cacheMargins();
            this.scrollParent = this.helper.scrollParent();
            this.offset = this.currentItem.offset();
            this.offset = {
                top: this.offset.top - this.margins.top,
                left: this.offset.left - this.margins.left
            };
            $.extend(this.offset, {
                click: {
                    left: event.pageX - this.offset.left,
                    top: event.pageY - this.offset.top
                },
                parent: this._getParentOffset(),
                relative: this._getRelativeOffset()
            });
            this.helper.css("position", "absolute");
            this.cssPosition = this.helper.css("position");
            this.originalPosition = this._generatePosition(event);
            this.originalPageX = event.pageX;
            this.originalPageY = event.pageY;
            o.cursorAt && this._adjustOffsetFromHelper(o.cursorAt);
            this.domPosition = {
                prev: this.currentItem.prev()[0],
                parent: this.currentItem.parent()[0]
            };
            if (this.helper[0] !== this.currentItem[0]) {
                this.currentItem.hide()
            }
            this._createPlaceholder();
            if (o.containment) {
                this._setContainment()
            }
            if (o.cursor && o.cursor !== "auto") {
                body = this.document.find("body");
                this.storedCursor = body.css("cursor");
                body.css("cursor", o.cursor);
                this.storedStylesheet = $("<style>*{ cursor: " + o.cursor + " !important; }</style>").appendTo(body)
            }
            if (o.opacity) {
                if (this.helper.css("opacity")) {
                    this._storedOpacity = this.helper.css("opacity")
                }
                this.helper.css("opacity", o.opacity)
            }
            if (o.zIndex) {
                if (this.helper.css("zIndex")) {
                    this._storedZIndex = this.helper.css("zIndex")
                }
                this.helper.css("zIndex", o.zIndex)
            }
            if (this.scrollParent[0] !== document && this.scrollParent[0].tagName !== "HTML") {
                this.overflowOffset = this.scrollParent.offset()
            }
            this._trigger("start", event, this._uiHash());
            if (!this._preserveHelperProportions) {
                this._cacheHelperProportions()
            }
            if (!noActivation) {
                for (i = this.containers.length - 1; i >= 0; i--) {
                    this.containers[i]._trigger("activate", event, this._uiHash(this))
                }
            }
            if ($.ui.ddmanager) {
                $.ui.ddmanager.current = this
            }
            if ($.ui.ddmanager && !o.dropBehaviour) {
                $.ui.ddmanager.prepareOffsets(this, event)
            }
            this.dragging = true;
            this.helper.addClass("ui-sortable-helper");
            this._mouseDrag(event);
            return true
        },
        _mouseDrag: function(event) {
            var i, item, itemElement, intersection, o = this.options,
                scrolled = false;
            this.position = this._generatePosition(event);
            this.positionAbs = this._convertPositionTo("absolute");
            if (!this.lastPositionAbs) {
                this.lastPositionAbs = this.positionAbs
            }
            if (this.options.scroll) {
                if (this.scrollParent[0] !== document && this.scrollParent[0].tagName !== "HTML") {
                    if (this.overflowOffset.top + this.scrollParent[0].offsetHeight - event.pageY < o.scrollSensitivity) {
                        this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop + o.scrollSpeed
                    } else if (event.pageY - this.overflowOffset.top < o.scrollSensitivity) {
                        this.scrollParent[0].scrollTop = scrolled = this.scrollParent[0].scrollTop - o.scrollSpeed
                    }
                    if (this.overflowOffset.left + this.scrollParent[0].offsetWidth - event.pageX < o.scrollSensitivity) {
                        this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft + o.scrollSpeed
                    } else if (event.pageX - this.overflowOffset.left < o.scrollSensitivity) {
                        this.scrollParent[0].scrollLeft = scrolled = this.scrollParent[0].scrollLeft - o.scrollSpeed
                    }
                } else {
                    if (event.pageY - $(document).scrollTop() < o.scrollSensitivity) {
                        scrolled = $(document).scrollTop($(document).scrollTop() - o.scrollSpeed)
                    } else if ($(window).height() - (event.pageY - $(document).scrollTop()) < o.scrollSensitivity) {
                        scrolled = $(document).scrollTop($(document).scrollTop() + o.scrollSpeed)
                    }
                    if (event.pageX - $(document).scrollLeft() < o.scrollSensitivity) {
                        scrolled = $(document).scrollLeft($(document).scrollLeft() - o.scrollSpeed)
                    } else if ($(window).width() - (event.pageX - $(document).scrollLeft()) < o.scrollSensitivity) {
                        scrolled = $(document).scrollLeft($(document).scrollLeft() + o.scrollSpeed)
                    }
                }
                if (scrolled !== false && $.ui.ddmanager && !o.dropBehaviour) {
                    $.ui.ddmanager.prepareOffsets(this, event)
                }
            }
            this.positionAbs = this._convertPositionTo("absolute");
            if (!this.options.axis || this.options.axis !== "y") {
                this.helper[0].style.left = this.position.left + "px"
            }
            if (!this.options.axis || this.options.axis !== "x") {
                this.helper[0].style.top = this.position.top + "px"
            }
            for (i = this.items.length - 1; i >= 0; i--) {
                item = this.items[i];
                itemElement = item.item[0];
                intersection = this._intersectsWithPointer(item);
                if (!intersection) {
                    continue
                }
                if (item.instance !== this.currentContainer) {
                    continue
                }
                if (itemElement !== this.currentItem[0] && this.placeholder[intersection === 1 ? "next" : "prev"]()[0] !== itemElement && !$.contains(this.placeholder[0], itemElement) && (this.options.type === "semi-dynamic" ? !$.contains(this.element[0], itemElement) : true)) {
                    this.direction = intersection === 1 ? "down" : "up";
                    if (this.options.tolerance === "pointer" || this._intersectsWithSides(item)) {
                        this._rearrange(event, item)
                    } else {
                        break
                    }
                    this._trigger("change", event, this._uiHash());
                    break
                }
            }
            this._contactContainers(event);
            if ($.ui.ddmanager) {
                $.ui.ddmanager.drag(this, event)
            }
            this._trigger("sort", event, this._uiHash());
            this.lastPositionAbs = this.positionAbs;
            return false
        },
        _mouseStop: function(event, noPropagation) {
            if (!event) {
                return
            }
            if ($.ui.ddmanager && !this.options.dropBehaviour) {
                $.ui.ddmanager.drop(this, event)
            }
            if (this.options.revert) {
                var that = this,
                    cur = this.placeholder.offset(),
                    axis = this.options.axis,
                    animation = {};
                if (!axis || axis === "x") {
                    animation.left = cur.left - this.offset.parent.left - this.margins.left + (this.offsetParent[0] === document.body ? 0 : this.offsetParent[0].scrollLeft)
                }
                if (!axis || axis === "y") {
                    animation.top = cur.top - this.offset.parent.top - this.margins.top + (this.offsetParent[0] === document.body ? 0 : this.offsetParent[0].scrollTop)
                }
                this.reverting = true;
                $(this.helper).animate(animation, parseInt(this.options.revert, 10) || 500, function() {
                    that._clear(event)
                })
            } else {
                this._clear(event, noPropagation)
            }
            return false
        },
        cancel: function() {
            if (this.dragging) {
                this._mouseUp({
                    target: null
                });
                if (this.options.helper === "original") {
                    this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")
                } else {
                    this.currentItem.show()
                }
                for (var i = this.containers.length - 1; i >= 0; i--) {
                    this.containers[i]._trigger("deactivate", null, this._uiHash(this));
                    if (this.containers[i].containerCache.over) {
                        this.containers[i]._trigger("out", null, this._uiHash(this));
                        this.containers[i].containerCache.over = 0
                    }
                }
            }
            if (this.placeholder) {
                if (this.placeholder[0].parentNode) {
                    this.placeholder[0].parentNode.removeChild(this.placeholder[0])
                }
                if (this.options.helper !== "original" && this.helper && this.helper[0].parentNode) {
                    this.helper.remove()
                }
                $.extend(this, {
                    helper: null,
                    dragging: false,
                    reverting: false,
                    _noFinalSort: null
                });
                if (this.domPosition.prev) {
                    $(this.domPosition.prev).after(this.currentItem)
                } else {
                    $(this.domPosition.parent).prepend(this.currentItem)
                }
            }
            return this
        },
        serialize: function(o) {
            var items = this._getItemsAsjQuery(o && o.connected),
                str = [];
            o = o || {};
            $(items).each(function() {
                var res = ($(o.item || this).attr(o.attribute || "id") || "").match(o.expression || /(.+)[\-=_](.+)/);
                if (res) {
                    str.push((o.key || res[1] + "[]") + "=" + (o.key && o.expression ? res[1] : res[2]))
                }
            });
            if (!str.length && o.key) {
                str.push(o.key + "=")
            }
            return str.join("&")
        },
        toArray: function(o) {
            var items = this._getItemsAsjQuery(o && o.connected),
                ret = [];
            o = o || {};
            items.each(function() {
                ret.push($(o.item || this).attr(o.attribute || "id") || "")
            });
            return ret
        },
        _intersectsWith: function(item) {
            var x1 = this.positionAbs.left,
                x2 = x1 + this.helperProportions.width,
                y1 = this.positionAbs.top,
                y2 = y1 + this.helperProportions.height,
                l = item.left,
                r = l + item.width,
                t = item.top,
                b = t + item.height,
                dyClick = this.offset.click.top,
                dxClick = this.offset.click.left,
                isOverElementHeight = this.options.axis === "x" || y1 + dyClick > t && y1 + dyClick < b,
                isOverElementWidth = this.options.axis === "y" || x1 + dxClick > l && x1 + dxClick < r,
                isOverElement = isOverElementHeight && isOverElementWidth;
            if (this.options.tolerance === "pointer" || this.options.forcePointerForContainers || this.options.tolerance !== "pointer" && this.helperProportions[this.floating ? "width" : "height"] > item[this.floating ? "width" : "height"]) {
                return isOverElement
            } else {
                return l < x1 + this.helperProportions.width / 2 && x2 - this.helperProportions.width / 2 < r && t < y1 + this.helperProportions.height / 2 && y2 - this.helperProportions.height / 2 < b
            }
        },
        _intersectsWithPointer: function(item) {
            var isOverElementHeight = this.options.axis === "x" || isOverAxis(this.positionAbs.top + this.offset.click.top, item.top, item.height),
                isOverElementWidth = this.options.axis === "y" || isOverAxis(this.positionAbs.left + this.offset.click.left, item.left, item.width),
                isOverElement = isOverElementHeight && isOverElementWidth,
                verticalDirection = this._getDragVerticalDirection(),
                horizontalDirection = this._getDragHorizontalDirection();
            if (!isOverElement) {
                return false
            }
            return this.floating ? horizontalDirection && horizontalDirection === "right" || verticalDirection === "down" ? 2 : 1 : verticalDirection && (verticalDirection === "down" ? 2 : 1)
        },
        _intersectsWithSides: function(item) {
            var isOverBottomHalf = isOverAxis(this.positionAbs.top + this.offset.click.top, item.top + item.height / 2, item.height),
                isOverRightHalf = isOverAxis(this.positionAbs.left + this.offset.click.left, item.left + item.width / 2, item.width),
                verticalDirection = this._getDragVerticalDirection(),
                horizontalDirection = this._getDragHorizontalDirection();
            if (this.floating && horizontalDirection) {
                return horizontalDirection === "right" && isOverRightHalf || horizontalDirection === "left" && !isOverRightHalf
            } else {
                return verticalDirection && (verticalDirection === "down" && isOverBottomHalf || verticalDirection === "up" && !isOverBottomHalf)
            }
        },
        _getDragVerticalDirection: function() {
            var delta = this.positionAbs.top - this.lastPositionAbs.top;
            return delta !== 0 && (delta > 0 ? "down" : "up")
        },
        _getDragHorizontalDirection: function() {
            var delta = this.positionAbs.left - this.lastPositionAbs.left;
            return delta !== 0 && (delta > 0 ? "right" : "left")
        },
        refresh: function(event) {
            this._refreshItems(event);
            this.refreshPositions();
            return this
        },
        _connectWith: function() {
            var options = this.options;
            return options.connectWith.constructor === String ? [options.connectWith] : options.connectWith
        },
        _getItemsAsjQuery: function(connected) {
            var i, j, cur, inst, items = [],
                queries = [],
                connectWith = this._connectWith();
            if (connectWith && connected) {
                for (i = connectWith.length - 1; i >= 0; i--) {
                    cur = $(connectWith[i]);
                    for (j = cur.length - 1; j >= 0; j--) {
                        inst = $.data(cur[j], this.widgetFullName);
                        if (inst && inst !== this && !inst.options.disabled) {
                            queries.push([$.isFunction(inst.options.items) ? inst.options.items.call(inst.element) : $(inst.options.items, inst.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"), inst])
                        }
                    }
                }
            }
            queries.push([$.isFunction(this.options.items) ? this.options.items.call(this.element, null, {
                options: this.options,
                item: this.currentItem
            }) : $(this.options.items, this.element).not(".ui-sortable-helper").not(".ui-sortable-placeholder"), this]);
            for (i = queries.length - 1; i >= 0; i--) {
                queries[i][0].each(function() {
                    items.push(this)
                })
            }
            return $(items)
        },
        _removeCurrentsFromItems: function() {
            var list = this.currentItem.find(":data(" + this.widgetName + "-item)");
            this.items = $.grep(this.items, function(item) {
                for (var j = 0; j < list.length; j++) {
                    if (list[j] === item.item[0]) {
                        return false
                    }
                }
                return true
            })
        },
        _refreshItems: function(event) {
            this.items = [];
            this.containers = [this];
            var i, j, cur, inst, targetData, _queries, item, queriesLength, items = this.items,
                queries = [
                    [$.isFunction(this.options.items) ? this.options.items.call(this.element[0], event, {
                        item: this.currentItem
                    }) : $(this.options.items, this.element), this]
                ],
                connectWith = this._connectWith();
            if (connectWith && this.ready) {
                for (i = connectWith.length - 1; i >= 0; i--) {
                    cur = $(connectWith[i]);
                    for (j = cur.length - 1; j >= 0; j--) {
                        inst = $.data(cur[j], this.widgetFullName);
                        if (inst && inst !== this && !inst.options.disabled) {
                            queries.push([$.isFunction(inst.options.items) ? inst.options.items.call(inst.element[0], event, {
                                item: this.currentItem
                            }) : $(inst.options.items, inst.element), inst]);
                            this.containers.push(inst)
                        }
                    }
                }
            }
            for (i = queries.length - 1; i >= 0; i--) {
                targetData = queries[i][1];
                _queries = queries[i][0];
                for (j = 0, queriesLength = _queries.length; j < queriesLength; j++) {
                    item = $(_queries[j]);
                    item.data(this.widgetName + "-item", targetData);
                    items.push({
                        item: item,
                        instance: targetData,
                        width: 0,
                        height: 0,
                        left: 0,
                        top: 0
                    })
                }
            }
        },
        refreshPositions: function(fast) {
            if (this.offsetParent && this.helper) {
                this.offset.parent = this._getParentOffset()
            }
            var i, item, t, p;
            for (i = this.items.length - 1; i >= 0; i--) {
                item = this.items[i];
                if (item.instance !== this.currentContainer && this.currentContainer && item.item[0] !== this.currentItem[0]) {
                    continue
                }
                t = this.options.toleranceElement ? $(this.options.toleranceElement, item.item) : item.item;
                if (!fast) {
                    item.width = t.outerWidth();
                    item.height = t.outerHeight()
                }
                p = t.offset();
                item.left = p.left;
                item.top = p.top
            }
            if (this.options.custom && this.options.custom.refreshContainers) {
                this.options.custom.refreshContainers.call(this)
            } else {
                for (i = this.containers.length - 1; i >= 0; i--) {
                    p = this.containers[i].element.offset();
                    this.containers[i].containerCache.left = p.left;
                    this.containers[i].containerCache.top = p.top;
                    this.containers[i].containerCache.width = this.containers[i].element.outerWidth();
                    this.containers[i].containerCache.height = this.containers[i].element.outerHeight()
                }
            }
            return this
        },
        _createPlaceholder: function(that) {
            that = that || this;
            var className, o = that.options;
            if (!o.placeholder || o.placeholder.constructor === String) {
                className = o.placeholder;
                o.placeholder = {
                    element: function() {
                        var nodeName = that.currentItem[0].nodeName.toLowerCase(),
                            element = $("<" + nodeName + ">", that.document[0]).addClass(className || that.currentItem[0].className + " ui-sortable-placeholder").removeClass("ui-sortable-helper");
                        if (nodeName === "tr") {
                            that.currentItem.children().each(function() {
                                $("<td>&#160;</td>", that.document[0]).attr("colspan", $(this).attr("colspan") || 1).appendTo(element)
                            })
                        } else if (nodeName === "img") {
                            element.attr("src", that.currentItem.attr("src"))
                        }
                        if (!className) {
                            element.css("visibility", "hidden")
                        }
                        return element
                    },
                    update: function(container, p) {
                        if (className && !o.forcePlaceholderSize) {
                            return
                        }
                        if (!p.height()) {
                            p.height(that.currentItem.innerHeight() - parseInt(that.currentItem.css("paddingTop") || 0, 10) - parseInt(that.currentItem.css("paddingBottom") || 0, 10))
                        }
                        if (!p.width()) {
                            p.width(that.currentItem.innerWidth() - parseInt(that.currentItem.css("paddingLeft") || 0, 10) - parseInt(that.currentItem.css("paddingRight") || 0, 10))
                        }
                    }
                }
            }
            that.placeholder = $(o.placeholder.element.call(that.element, that.currentItem));
            that.currentItem.after(that.placeholder);
            o.placeholder.update(that, that.placeholder)
        },
        _contactContainers: function(event) {
            var i, j, dist, itemWithLeastDistance, posProperty, sizeProperty, base, cur, nearBottom, floating, innermostContainer = null,
                innermostIndex = null;
            for (i = this.containers.length - 1; i >= 0; i--) {
                if ($.contains(this.currentItem[0], this.containers[i].element[0])) {
                    continue
                }
                if (this._intersectsWith(this.containers[i].containerCache)) {
                    if (innermostContainer && $.contains(this.containers[i].element[0], innermostContainer.element[0])) {
                        continue
                    }
                    innermostContainer = this.containers[i];
                    innermostIndex = i
                } else {
                    if (this.containers[i].containerCache.over) {
                        this.containers[i]._trigger("out", event, this._uiHash(this));
                        this.containers[i].containerCache.over = 0
                    }
                }
            }
            if (!innermostContainer) {
                return
            }
            if (this.containers.length === 1) {
                if (!this.containers[innermostIndex].containerCache.over) {
                    this.containers[innermostIndex]._trigger("over", event, this._uiHash(this));
                    this.containers[innermostIndex].containerCache.over = 1
                }
            } else {
                dist = 1e4;
                itemWithLeastDistance = null;
                floating = innermostContainer.floating || isFloating(this.currentItem);
                posProperty = floating ? "left" : "top";
                sizeProperty = floating ? "width" : "height";
                base = this.positionAbs[posProperty] + this.offset.click[posProperty];
                for (j = this.items.length - 1; j >= 0; j--) {
                    if (!$.contains(this.containers[innermostIndex].element[0], this.items[j].item[0])) {
                        continue
                    }
                    if (this.items[j].item[0] === this.currentItem[0]) {
                        continue
                    }
                    if (floating && !isOverAxis(this.positionAbs.top + this.offset.click.top, this.items[j].top, this.items[j].height)) {
                        continue
                    }
                    cur = this.items[j].item.offset()[posProperty];
                    nearBottom = false;
                    if (Math.abs(cur - base) > Math.abs(cur + this.items[j][sizeProperty] - base)) {
                        nearBottom = true;
                        cur += this.items[j][sizeProperty]
                    }
                    if (Math.abs(cur - base) < dist) {
                        dist = Math.abs(cur - base);
                        itemWithLeastDistance = this.items[j];
                        this.direction = nearBottom ? "up" : "down"
                    }
                }
                if (!itemWithLeastDistance && !this.options.dropOnEmpty) {
                    return
                }
                if (this.currentContainer === this.containers[innermostIndex]) {
                    return
                }
                itemWithLeastDistance ? this._rearrange(event, itemWithLeastDistance, null, true) : this._rearrange(event, null, this.containers[innermostIndex].element, true);
                this._trigger("change", event, this._uiHash());
                this.containers[innermostIndex]._trigger("change", event, this._uiHash(this));
                this.currentContainer = this.containers[innermostIndex];
                this.options.placeholder.update(this.currentContainer, this.placeholder);
                this.containers[innermostIndex]._trigger("over", event, this._uiHash(this));
                this.containers[innermostIndex].containerCache.over = 1
            }
        },
        _createHelper: function(event) {
            var o = this.options,
                helper = $.isFunction(o.helper) ? $(o.helper.apply(this.element[0], [event, this.currentItem])) : o.helper === "clone" ? this.currentItem.clone() : this.currentItem;
            if (!helper.parents("body").length) {
                $(o.appendTo !== "parent" ? o.appendTo : this.currentItem[0].parentNode)[0].appendChild(helper[0])
            }
            if (helper[0] === this.currentItem[0]) {
                this._storedCSS = {
                    width: this.currentItem[0].style.width,
                    height: this.currentItem[0].style.height,
                    position: this.currentItem.css("position"),
                    top: this.currentItem.css("top"),
                    left: this.currentItem.css("left")
                }
            }
            if (!helper[0].style.width || o.forceHelperSize) {
                helper.width(this.currentItem.width())
            }
            if (!helper[0].style.height || o.forceHelperSize) {
                helper.height(this.currentItem.height())
            }
            return helper
        },
        _adjustOffsetFromHelper: function(obj) {
            if (typeof obj === "string") {
                obj = obj.split(" ")
            }
            if ($.isArray(obj)) {
                obj = {
                    left: +obj[0],
                    top: +obj[1] || 0
                }
            }
            if ("left" in obj) {
                this.offset.click.left = obj.left + this.margins.left
            }
            if ("right" in obj) {
                this.offset.click.left = this.helperProportions.width - obj.right + this.margins.left
            }
            if ("top" in obj) {
                this.offset.click.top = obj.top + this.margins.top
            }
            if ("bottom" in obj) {
                this.offset.click.top = this.helperProportions.height - obj.bottom + this.margins.top
            }
        },
        _getParentOffset: function() {
            this.offsetParent = this.helper.offsetParent();
            var po = this.offsetParent.offset();
            if (this.cssPosition === "absolute" && this.scrollParent[0] !== document && $.contains(this.scrollParent[0], this.offsetParent[0])) {
                po.left += this.scrollParent.scrollLeft();
                po.top += this.scrollParent.scrollTop()
            }
            if (this.offsetParent[0] === document.body || this.offsetParent[0].tagName && this.offsetParent[0].tagName.toLowerCase() === "html" && $.ui.ie) {
                po = {
                    top: 0,
                    left: 0
                }
            }
            return {
                top: po.top + (parseInt(this.offsetParent.css("borderTopWidth"), 10) || 0),
                left: po.left + (parseInt(this.offsetParent.css("borderLeftWidth"), 10) || 0)
            }
        },
        _getRelativeOffset: function() {
            if (this.cssPosition === "relative") {
                var p = this.currentItem.position();
                return {
                    top: p.top - (parseInt(this.helper.css("top"), 10) || 0) + this.scrollParent.scrollTop(),
                    left: p.left - (parseInt(this.helper.css("left"), 10) || 0) + this.scrollParent.scrollLeft()
                }
            } else {
                return {
                    top: 0,
                    left: 0
                }
            }
        },
        _cacheMargins: function() {
            this.margins = {
                left: parseInt(this.currentItem.css("marginLeft"), 10) || 0,
                top: parseInt(this.currentItem.css("marginTop"), 10) || 0
            }
        },
        _cacheHelperProportions: function() {
            this.helperProportions = {
                width: this.helper.outerWidth(),
                height: this.helper.outerHeight()
            }
        },
        _setContainment: function() {
            var ce, co, over, o = this.options;
            if (o.containment === "parent") {
                o.containment = this.helper[0].parentNode
            }
            if (o.containment === "document" || o.containment === "window") {
                this.containment = [0 - this.offset.relative.left - this.offset.parent.left, 0 - this.offset.relative.top - this.offset.parent.top, $(o.containment === "document" ? document : window).width() - this.helperProportions.width - this.margins.left, ($(o.containment === "document" ? document : window).height() || document.body.parentNode.scrollHeight) - this.helperProportions.height - this.margins.top]
            }
            if (!/^(document|window|parent)$/.test(o.containment)) {
                ce = $(o.containment)[0];
                co = $(o.containment).offset();
                over = $(ce).css("overflow") !== "hidden";
                this.containment = [co.left + (parseInt($(ce).css("borderLeftWidth"), 10) || 0) + (parseInt($(ce).css("paddingLeft"), 10) || 0) - this.margins.left, co.top + (parseInt($(ce).css("borderTopWidth"), 10) || 0) + (parseInt($(ce).css("paddingTop"), 10) || 0) - this.margins.top, co.left + (over ? Math.max(ce.scrollWidth, ce.offsetWidth) : ce.offsetWidth) - (parseInt($(ce).css("borderLeftWidth"), 10) || 0) - (parseInt($(ce).css("paddingRight"), 10) || 0) - this.helperProportions.width - this.margins.left, co.top + (over ? Math.max(ce.scrollHeight, ce.offsetHeight) : ce.offsetHeight) - (parseInt($(ce).css("borderTopWidth"), 10) || 0) - (parseInt($(ce).css("paddingBottom"), 10) || 0) - this.helperProportions.height - this.margins.top]
            }
        },
        _convertPositionTo: function(d, pos) {
            if (!pos) {
                pos = this.position
            }
            var mod = d === "absolute" ? 1 : -1,
                scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent,
                scrollIsRootNode = /(html|body)/i.test(scroll[0].tagName);
            return {
                top: pos.top + this.offset.relative.top * mod + this.offset.parent.top * mod - (this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : scrollIsRootNode ? 0 : scroll.scrollTop()) * mod,
                left: pos.left + this.offset.relative.left * mod + this.offset.parent.left * mod - (this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft()) * mod
            }
        },
        _generatePosition: function(event) {
            var top, left, o = this.options,
                pageX = event.pageX,
                pageY = event.pageY,
                scroll = this.cssPosition === "absolute" && !(this.scrollParent[0] !== document && $.contains(this.scrollParent[0], this.offsetParent[0])) ? this.offsetParent : this.scrollParent,
                scrollIsRootNode = /(html|body)/i.test(scroll[0].tagName);
            if (this.cssPosition === "relative" && !(this.scrollParent[0] !== document && this.scrollParent[0] !== this.offsetParent[0])) {
                this.offset.relative = this._getRelativeOffset()
            }
            if (this.originalPosition) {
                if (this.containment) {
                    if (event.pageX - this.offset.click.left < this.containment[0]) {
                        pageX = this.containment[0] + this.offset.click.left
                    }
                    if (event.pageY - this.offset.click.top < this.containment[1]) {
                        pageY = this.containment[1] + this.offset.click.top
                    }
                    if (event.pageX - this.offset.click.left > this.containment[2]) {
                        pageX = this.containment[2] + this.offset.click.left
                    }
                    if (event.pageY - this.offset.click.top > this.containment[3]) {
                        pageY = this.containment[3] + this.offset.click.top
                    }
                }
                if (o.grid) {
                    top = this.originalPageY + Math.round((pageY - this.originalPageY) / o.grid[1]) * o.grid[1];
                    pageY = this.containment ? top - this.offset.click.top >= this.containment[1] && top - this.offset.click.top <= this.containment[3] ? top : top - this.offset.click.top >= this.containment[1] ? top - o.grid[1] : top + o.grid[1] : top;
                    left = this.originalPageX + Math.round((pageX - this.originalPageX) / o.grid[0]) * o.grid[0];
                    pageX = this.containment ? left - this.offset.click.left >= this.containment[0] && left - this.offset.click.left <= this.containment[2] ? left : left - this.offset.click.left >= this.containment[0] ? left - o.grid[0] : left + o.grid[0] : left
                }
            }
            return {
                top: pageY - this.offset.click.top - this.offset.relative.top - this.offset.parent.top + (this.cssPosition === "fixed" ? -this.scrollParent.scrollTop() : scrollIsRootNode ? 0 : scroll.scrollTop()),
                left: pageX - this.offset.click.left - this.offset.relative.left - this.offset.parent.left + (this.cssPosition === "fixed" ? -this.scrollParent.scrollLeft() : scrollIsRootNode ? 0 : scroll.scrollLeft())
            }
        },
        _rearrange: function(event, i, a, hardRefresh) {
            a ? a[0].appendChild(this.placeholder[0]) : i.item[0].parentNode.insertBefore(this.placeholder[0], this.direction === "down" ? i.item[0] : i.item[0].nextSibling);
            this.counter = this.counter ? ++this.counter : 1;
            var counter = this.counter;
            this._delay(function() {
                if (counter === this.counter) {
                    this.refreshPositions(!hardRefresh)
                }
            })
        },
        _clear: function(event, noPropagation) {
            this.reverting = false;
            var i, delayedTriggers = [];
            if (!this._noFinalSort && this.currentItem.parent().length) {
                this.placeholder.before(this.currentItem)
            }
            this._noFinalSort = null;
            if (this.helper[0] === this.currentItem[0]) {
                for (i in this._storedCSS) {
                    if (this._storedCSS[i] === "auto" || this._storedCSS[i] === "static") {
                        this._storedCSS[i] = ""
                    }
                }
                this.currentItem.css(this._storedCSS).removeClass("ui-sortable-helper")
            } else {
                this.currentItem.show()
            }
            if (this.fromOutside && !noPropagation) {
                delayedTriggers.push(function(event) {
                    this._trigger("receive", event, this._uiHash(this.fromOutside))
                })
            }
            if ((this.fromOutside || this.domPosition.prev !== this.currentItem.prev().not(".ui-sortable-helper")[0] || this.domPosition.parent !== this.currentItem.parent()[0]) && !noPropagation) {
                delayedTriggers.push(function(event) {
                    this._trigger("update", event, this._uiHash())
                })
            }
            if (this !== this.currentContainer) {
                if (!noPropagation) {
                    delayedTriggers.push(function(event) {
                        this._trigger("remove", event, this._uiHash())
                    });
                    delayedTriggers.push(function(c) {
                        return function(event) {
                            c._trigger("receive", event, this._uiHash(this))
                        }
                    }.call(this, this.currentContainer));
                    delayedTriggers.push(function(c) {
                        return function(event) {
                            c._trigger("update", event, this._uiHash(this))
                        }
                    }.call(this, this.currentContainer))
                }
            }
            for (i = this.containers.length - 1; i >= 0; i--) {
                if (!noPropagation) {
                    delayedTriggers.push(function(c) {
                        return function(event) {
                            c._trigger("deactivate", event, this._uiHash(this))
                        }
                    }.call(this, this.containers[i]))
                }
                if (this.containers[i].containerCache.over) {
                    delayedTriggers.push(function(c) {
                        return function(event) {
                            c._trigger("out", event, this._uiHash(this))
                        }
                    }.call(this, this.containers[i]));
                    this.containers[i].containerCache.over = 0
                }
            }
            if (this.storedCursor) {
                this.document.find("body").css("cursor", this.storedCursor);
                this.storedStylesheet.remove()
            }
            if (this._storedOpacity) {
                this.helper.css("opacity", this._storedOpacity)
            }
            if (this._storedZIndex) {
                this.helper.css("zIndex", this._storedZIndex === "auto" ? "" : this._storedZIndex)
            }
            this.dragging = false;
            if (this.cancelHelperRemoval) {
                if (!noPropagation) {
                    this._trigger("beforeStop", event, this._uiHash());
                    for (i = 0; i < delayedTriggers.length; i++) {
                        delayedTriggers[i].call(this, event)
                    }
                    this._trigger("stop", event, this._uiHash())
                }
                this.fromOutside = false;
                return false
            }
            if (!noPropagation) {
                this._trigger("beforeStop", event, this._uiHash())
            }
            this.placeholder[0].parentNode.removeChild(this.placeholder[0]);
            if (this.helper[0] !== this.currentItem[0]) {
                this.helper.remove()
            }
            this.helper = null;
            if (!noPropagation) {
                for (i = 0; i < delayedTriggers.length; i++) {
                    delayedTriggers[i].call(this, event)
                }
                this._trigger("stop", event, this._uiHash())
            }
            this.fromOutside = false;
            return true
        },
        _trigger: function() {
            if ($.Widget.prototype._trigger.apply(this, arguments) === false) {
                this.cancel()
            }
        },
        _uiHash: function(_inst) {
            var inst = _inst || this;
            return {
                helper: inst.helper,
                placeholder: inst.placeholder || $([]),
                position: inst.position,
                originalPosition: inst.originalPosition,
                offset: inst.positionAbs,
                item: inst.currentItem,
                sender: _inst ? _inst.element : null
            }
        }
    })
})(jQuery);
(function(window, document, undefined) {
    (function(factory) {
        "use strict";
        if (typeof define === "function" && define.amd) {
            define(["jquery"], factory)
        } else if (jQuery && !jQuery.fn.qtip) {
            factory(jQuery)
        }
    })(function($) {
        "use strict";
        var TRUE = true,
            FALSE = false,
            NULL = null,
            X = "x",
            Y = "y",
            WIDTH = "width",
            HEIGHT = "height",
            TOP = "top",
            LEFT = "left",
            BOTTOM = "bottom",
            RIGHT = "right",
            CENTER = "center",
            FLIP = "flip",
            FLIPINVERT = "flipinvert",
            SHIFT = "shift",
            QTIP, PROTOTYPE, CORNER, CHECKS, PLUGINS = {},
            NAMESPACE = "qtip",
            ATTR_HAS = "data-hasqtip",
            ATTR_ID = "data-qtip-id",
            WIDGET = ["ui-widget", "ui-tooltip"],
            SELECTOR = "." + NAMESPACE,
            INACTIVE_EVENTS = "click dblclick mousedown mouseup mousemove mouseleave mouseenter".split(" "),
            CLASS_FIXED = NAMESPACE + "-fixed",
            CLASS_DEFAULT = NAMESPACE + "-default",
            CLASS_FOCUS = NAMESPACE + "-focus",
            CLASS_HOVER = NAMESPACE + "-hover",
            CLASS_DISABLED = NAMESPACE + "-disabled",
            replaceSuffix = "_replacedByqTip",
            oldtitle = "oldtitle",
            trackingBound, BROWSER = {
                ie: function() {
                    for (var v = 4, i = document.createElement("div");
                        (i.innerHTML = "<!--[if gt IE " + v + "]><i></i><![endif]-->") && i.getElementsByTagName("i")[0]; v += 1) {}
                    return v > 4 ? v : NaN
                }(),
                iOS: parseFloat(("" + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ""])[1]).replace("undefined", "3_2").replace("_", ".").replace("_", "")) || FALSE
            };

        function QTip(target, options, id, attr) {
            this.id = id;
            this.target = target;
            this.tooltip = NULL;
            this.elements = {
                target: target
            };
            this._id = NAMESPACE + "-" + id;
            this.timers = {
                img: {}
            };
            this.options = options;
            this.plugins = {};
            this.cache = {
                event: {},
                target: $(),
                disabled: FALSE,
                attr: attr,
                onTooltip: FALSE,
                lastClass: ""
            };
            this.rendered = this.destroyed = this.disabled = this.waiting = this.hiddenDuringWait = this.positioning = this.triggering = FALSE
        }
        PROTOTYPE = QTip.prototype;
        PROTOTYPE._when = function(deferreds) {
            return $.when.apply($, deferreds)
        };
        PROTOTYPE.render = function(show) {
            if (this.rendered || this.destroyed) {
                return this
            }
            var self = this,
                options = this.options,
                cache = this.cache,
                elements = this.elements,
                text = options.content.text,
                title = options.content.title,
                button = options.content.button,
                posOptions = options.position,
                namespace = "." + this._id + " ",
                deferreds = [],
                tooltip;
            $.attr(this.target[0], "aria-describedby", this._id);
            cache.posClass = this._createPosClass((this.position = {
                my: posOptions.my,
                at: posOptions.at
            }).my);
            this.tooltip = elements.tooltip = tooltip = $("<div/>", {
                id: this._id,
                "class": [NAMESPACE, CLASS_DEFAULT, options.style.classes, cache.posClass].join(" "),
                width: options.style.width || "",
                height: options.style.height || "",
                tracking: posOptions.target === "mouse" && posOptions.adjust.mouse,
                role: "alert",
                "aria-live": "polite",
                "aria-atomic": FALSE,
                "aria-describedby": this._id + "-content",
                "aria-hidden": TRUE
            }).toggleClass(CLASS_DISABLED, this.disabled).attr(ATTR_ID, this.id).data(NAMESPACE, this).appendTo(posOptions.container).append(elements.content = $("<div />", {
                "class": NAMESPACE + "-content",
                id: this._id + "-content",
                "aria-atomic": TRUE
            }));
            this.rendered = -1;
            this.positioning = TRUE;
            if (title) {
                this._createTitle();
                if (!$.isFunction(title)) {
                    deferreds.push(this._updateTitle(title, FALSE))
                }
            }
            if (button) {
                this._createButton()
            }
            if (!$.isFunction(text)) {
                deferreds.push(this._updateContent(text, FALSE))
            }
            this.rendered = TRUE;
            this._setWidget();
            $.each(PLUGINS, function(name) {
                var instance;
                if (this.initialize === "render" && (instance = this(self))) {
                    self.plugins[name] = instance
                }
            });
            this._unassignEvents();
            this._assignEvents();
            this._when(deferreds).then(function() {
                self._trigger("render");
                self.positioning = FALSE;
                if (!self.hiddenDuringWait && (options.show.ready || show)) {
                    self.toggle(TRUE, cache.event, FALSE)
                }
                self.hiddenDuringWait = FALSE
            });
            QTIP.api[this.id] = this;
            return this
        };
        PROTOTYPE.destroy = function(immediate) {
            if (this.destroyed) {
                return this.target
            }

            function process() {
                if (this.destroyed) {
                    return
                }
                this.destroyed = TRUE;
                var target = this.target,
                    title = target.attr(oldtitle),
                    timer;
                if (this.rendered) {
                    this.tooltip.stop(1, 0).find("*").remove().end().remove()
                }
                $.each(this.plugins, function(name) {
                    this.destroy && this.destroy()
                });
                for (timer in this.timers) {
                    clearTimeout(this.timers[timer])
                }
                target.removeData(NAMESPACE).removeAttr(ATTR_ID).removeAttr(ATTR_HAS).removeAttr("aria-describedby");
                if (this.options.suppress && title) {
                    target.attr("title", title).removeAttr(oldtitle)
                }
                this._unassignEvents();
                this.options = this.elements = this.cache = this.timers = this.plugins = this.mouse = NULL;
                delete QTIP.api[this.id]
            }
            if ((immediate !== TRUE || this.triggering === "hide") && this.rendered) {
                this.tooltip.one("tooltiphidden", $.proxy(process, this));
                !this.triggering && this.hide()
            } else {
                process.call(this)
            }
            return this.target
        };

        function invalidOpt(a) {
            return a === NULL || $.type(a) !== "object"
        }

        function invalidContent(c) {
            return !($.isFunction(c) || c && c.attr || c.length || $.type(c) === "object" && (c.jquery || c.then))
        }

        function sanitizeOptions(opts) {
            var content, text, ajax, once;
            if (invalidOpt(opts)) {
                return FALSE
            }
            if (invalidOpt(opts.metadata)) {
                opts.metadata = {
                    type: opts.metadata
                }
            }
            if ("content" in opts) {
                content = opts.content;
                if (invalidOpt(content) || content.jquery || content.done) {
                    content = opts.content = {
                        text: text = invalidContent(content) ? FALSE : content
                    }
                } else {
                    text = content.text
                }
                if ("ajax" in content) {
                    ajax = content.ajax;
                    once = ajax && ajax.once !== FALSE;
                    delete content.ajax;
                    content.text = function(event, api) {
                        var loading = text || $(this).attr(api.options.content.attr) || "Loading...",
                            deferred = $.ajax($.extend({}, ajax, {
                                context: api
                            })).then(ajax.success, NULL, ajax.error).then(function(content) {
                                if (content && once) {
                                    api.set("content.text", content)
                                }
                                return content
                            }, function(xhr, status, error) {
                                if (api.destroyed || xhr.status === 0) {
                                    return
                                }
                                api.set("content.text", status + ": " + error)
                            });
                        return !once ? (api.set("content.text", loading), deferred) : loading
                    }
                }
                if ("title" in content) {
                    if ($.isPlainObject(content.title)) {
                        content.button = content.title.button;
                        content.title = content.title.text
                    }
                    if (invalidContent(content.title || FALSE)) {
                        content.title = FALSE
                    }
                }
            }
            if ("position" in opts && invalidOpt(opts.position)) {
                opts.position = {
                    my: opts.position,
                    at: opts.position
                }
            }
            if ("show" in opts && invalidOpt(opts.show)) {
                opts.show = opts.show.jquery ? {
                    target: opts.show
                } : opts.show === TRUE ? {
                    ready: TRUE
                } : {
                    event: opts.show
                }
            }
            if ("hide" in opts && invalidOpt(opts.hide)) {
                opts.hide = opts.hide.jquery ? {
                    target: opts.hide
                } : {
                    event: opts.hide
                }
            }
            if ("style" in opts && invalidOpt(opts.style)) {
                opts.style = {
                    classes: opts.style
                }
            }
            $.each(PLUGINS, function() {
                this.sanitize && this.sanitize(opts)
            });
            return opts
        }
        CHECKS = PROTOTYPE.checks = {
            builtin: {
                "^id$": function(obj, o, v, prev) {
                    var id = v === TRUE ? QTIP.nextid : v,
                        new_id = NAMESPACE + "-" + id;
                    if (id !== FALSE && id.length > 0 && !$("#" + new_id).length) {
                        this._id = new_id;
                        if (this.rendered) {
                            this.tooltip[0].id = this._id;
                            this.elements.content[0].id = this._id + "-content";
                            this.elements.title[0].id = this._id + "-title"
                        }
                    } else {
                        obj[o] = prev
                    }
                },
                "^prerender": function(obj, o, v) {
                    v && !this.rendered && this.render(this.options.show.ready)
                },
                "^content.text$": function(obj, o, v) {
                    this._updateContent(v)
                },
                "^content.attr$": function(obj, o, v, prev) {
                    if (this.options.content.text === this.target.attr(prev)) {
                        this._updateContent(this.target.attr(v))
                    }
                },
                "^content.title$": function(obj, o, v) {
                    if (!v) {
                        return this._removeTitle()
                    }
                    v && !this.elements.title && this._createTitle();
                    this._updateTitle(v)
                },
                "^content.button$": function(obj, o, v) {
                    this._updateButton(v)
                },
                "^content.title.(text|button)$": function(obj, o, v) {
                    this.set("content." + o, v)
                },
                "^position.(my|at)$": function(obj, o, v) {
                    "string" === typeof v && (this.position[o] = obj[o] = new CORNER(v, o === "at"))
                },
                "^position.container$": function(obj, o, v) {
                    this.rendered && this.tooltip.appendTo(v)
                },
                "^show.ready$": function(obj, o, v) {
                    v && (!this.rendered && this.render(TRUE) || this.toggle(TRUE))
                },
                "^style.classes$": function(obj, o, v, p) {
                    this.rendered && this.tooltip.removeClass(p).addClass(v)
                },
                "^style.(width|height)": function(obj, o, v) {
                    this.rendered && this.tooltip.css(o, v)
                },
                "^style.widget|content.title": function() {
                    this.rendered && this._setWidget()
                },
                "^style.def": function(obj, o, v) {
                    this.rendered && this.tooltip.toggleClass(CLASS_DEFAULT, !!v)
                },
                "^events.(render|show|move|hide|focus|blur)$": function(obj, o, v) {
                    this.rendered && this.tooltip[($.isFunction(v) ? "" : "un") + "bind"]("tooltip" + o, v)
                },
                "^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)": function() {
                    if (!this.rendered) {
                        return
                    }
                    var posOptions = this.options.position;
                    this.tooltip.attr("tracking", posOptions.target === "mouse" && posOptions.adjust.mouse);
                    this._unassignEvents();
                    this._assignEvents()
                }
            }
        };

        function convertNotation(options, notation) {
            var i = 0,
                obj, option = options,
                levels = notation.split(".");
            while (option = option[levels[i++]]) {
                if (i < levels.length) {
                    obj = option
                }
            }
            return [obj || options, levels.pop()]
        }
        PROTOTYPE.get = function(notation) {
            if (this.destroyed) {
                return this
            }
            var o = convertNotation(this.options, notation.toLowerCase()),
                result = o[0][o[1]];
            return result.precedance ? result.string() : result
        };

        function setCallback(notation, args) {
            var category, rule, match;
            for (category in this.checks) {
                for (rule in this.checks[category]) {
                    if (match = new RegExp(rule, "i").exec(notation)) {
                        args.push(match);
                        if (category === "builtin" || this.plugins[category]) {
                            this.checks[category][rule].apply(this.plugins[category] || this, args)
                        }
                    }
                }
            }
        }
        var rmove = /^position\.(my|at|adjust|target|container|viewport)|style|content|show\.ready/i,
            rrender = /^prerender|show\.ready/i;
        PROTOTYPE.set = function(option, value) {
            if (this.destroyed) {
                return this
            }
            var rendered = this.rendered,
                reposition = FALSE,
                options = this.options,
                checks = this.checks,
                name;
            if ("string" === typeof option) {
                name = option;
                option = {};
                option[name] = value
            } else {
                option = $.extend({}, option)
            }
            $.each(option, function(notation, value) {
                if (rendered && rrender.test(notation)) {
                    delete option[notation];
                    return
                }
                var obj = convertNotation(options, notation.toLowerCase()),
                    previous;
                previous = obj[0][obj[1]];
                obj[0][obj[1]] = value && value.nodeType ? $(value) : value;
                reposition = rmove.test(notation) || reposition;
                option[notation] = [obj[0], obj[1], value, previous]
            });
            sanitizeOptions(options);
            this.positioning = TRUE;
            $.each(option, $.proxy(setCallback, this));
            this.positioning = FALSE;
            if (this.rendered && this.tooltip[0].offsetWidth > 0 && reposition) {
                this.reposition(options.position.target === "mouse" ? NULL : this.cache.event)
            }
            return this
        };
        PROTOTYPE._update = function(content, element, reposition) {
            var self = this,
                cache = this.cache;
            if (!this.rendered || !content) {
                return FALSE
            }
            if ($.isFunction(content)) {
                content = content.call(this.elements.target, cache.event, this) || ""
            }
            if ($.isFunction(content.then)) {
                cache.waiting = TRUE;
                return content.then(function(c) {
                    cache.waiting = FALSE;
                    return self._update(c, element)
                }, NULL, function(e) {
                    return self._update(e, element)
                })
            }
            if (content === FALSE || !content && content !== "") {
                return FALSE
            }
            if (content.jquery && content.length > 0) {
                element.empty().append(content.css({
                    display: "block",
                    visibility: "visible"
                }))
            } else {
                element.html(content)
            }
            return this._waitForContent(element).then(function(images) {
                if (self.rendered && self.tooltip[0].offsetWidth > 0) {
                    self.reposition(cache.event, !images.length)
                }
            })
        };
        PROTOTYPE._waitForContent = function(element) {
            var cache = this.cache;
            cache.waiting = TRUE;
            return ($.fn.imagesLoaded ? element.imagesLoaded() : $.Deferred().resolve([])).done(function() {
                cache.waiting = FALSE
            }).promise()
        };
        PROTOTYPE._updateContent = function(content, reposition) {
            this._update(content, this.elements.content, reposition)
        };
        PROTOTYPE._updateTitle = function(content, reposition) {
            if (this._update(content, this.elements.title, reposition) === FALSE) {
                this._removeTitle(FALSE)
            }
        };
        PROTOTYPE._createTitle = function() {
            var elements = this.elements,
                id = this._id + "-title";
            if (elements.titlebar) {
                this._removeTitle()
            }
            elements.titlebar = $("<div />", {
                "class": NAMESPACE + "-titlebar " + (this.options.style.widget ? createWidgetClass("header") : "")
            }).append(elements.title = $("<div />", {
                id: id,
                "class": NAMESPACE + "-title",
                "aria-atomic": TRUE
            })).insertBefore(elements.content).delegate(".qtip-close", "mousedown keydown mouseup keyup mouseout", function(event) {
                $(this).toggleClass("ui-state-active ui-state-focus", event.type.substr(-4) === "down")
            }).delegate(".qtip-close", "mouseover mouseout", function(event) {
                $(this).toggleClass("ui-state-hover", event.type === "mouseover")
            });
            if (this.options.content.button) {
                this._createButton()
            }
        };
        PROTOTYPE._removeTitle = function(reposition) {
            var elements = this.elements;
            if (elements.title) {
                elements.titlebar.remove();
                elements.titlebar = elements.title = elements.button = NULL;
                if (reposition !== FALSE) {
                    this.reposition()
                }
            }
        };
        PROTOTYPE._createPosClass = function(my) {
            return NAMESPACE + "-pos-" + (my || this.options.position.my).abbrev()
        };
        PROTOTYPE.reposition = function(event, effect) {
            if (!this.rendered || this.positioning || this.destroyed) {
                return this
            }
            this.positioning = TRUE;
            var cache = this.cache,
                tooltip = this.tooltip,
                posOptions = this.options.position,
                target = posOptions.target,
                my = posOptions.my,
                at = posOptions.at,
                viewport = posOptions.viewport,
                container = posOptions.container,
                adjust = posOptions.adjust,
                method = adjust.method.split(" "),
                tooltipWidth = tooltip.outerWidth(FALSE),
                tooltipHeight = tooltip.outerHeight(FALSE),
                targetWidth = 0,
                targetHeight = 0,
                type = tooltip.css("position"),
                position = {
                    left: 0,
                    top: 0
                },
                visible = tooltip[0].offsetWidth > 0,
                isScroll = event && event.type === "scroll",
                win = $(window),
                doc = container[0].ownerDocument,
                mouse = this.mouse,
                pluginCalculations, offset, adjusted, newClass;
            if ($.isArray(target) && target.length === 2) {
                at = {
                    x: LEFT,
                    y: TOP
                };
                position = {
                    left: target[0],
                    top: target[1]
                }
            } else if (target === "mouse") {
                at = {
                    x: LEFT,
                    y: TOP
                };
                if ((!adjust.mouse || this.options.hide.distance) && cache.origin && cache.origin.pageX) {
                    event = cache.origin
                } else if (!event || event && (event.type === "resize" || event.type === "scroll")) {
                    event = cache.event
                } else if (mouse && mouse.pageX) {
                    event = mouse
                }
                if (type !== "static") {
                    position = container.offset()
                }
                if (doc.body.offsetWidth !== (window.innerWidth || doc.documentElement.clientWidth)) {
                    offset = $(document.body).offset()
                }
                position = {
                    left: event.pageX - position.left + (offset && offset.left || 0),
                    top: event.pageY - position.top + (offset && offset.top || 0)
                };
                if (adjust.mouse && isScroll && mouse) {
                    position.left -= (mouse.scrollX || 0) - win.scrollLeft();
                    position.top -= (mouse.scrollY || 0) - win.scrollTop()
                }
            } else {
                if (target === "event") {
                    if (event && event.target && event.type !== "scroll" && event.type !== "resize") {
                        cache.target = $(event.target)
                    } else if (!event.target) {
                        cache.target = this.elements.target
                    }
                } else if (target !== "event") {
                    cache.target = $(target.jquery ? target : this.elements.target)
                }
                target = cache.target;
                target = $(target).eq(0);
                if (target.length === 0) {
                    return this
                } else if (target[0] === document || target[0] === window) {
                    targetWidth = BROWSER.iOS ? window.innerWidth : target.width();
                    targetHeight = BROWSER.iOS ? window.innerHeight : target.height();
                    if (target[0] === window) {
                        position = {
                            top: (viewport || target).scrollTop(),
                            left: (viewport || target).scrollLeft()
                        }
                    }
                } else if (PLUGINS.imagemap && target.is("area")) {
                    pluginCalculations = PLUGINS.imagemap(this, target, at, PLUGINS.viewport ? method : FALSE)
                } else if (PLUGINS.svg && target && target[0].ownerSVGElement) {
                    pluginCalculations = PLUGINS.svg(this, target, at, PLUGINS.viewport ? method : FALSE)
                } else {
                    targetWidth = target.outerWidth(FALSE);
                    targetHeight = target.outerHeight(FALSE);
                    position = target.offset()
                }
                if (pluginCalculations) {
                    targetWidth = pluginCalculations.width;
                    targetHeight = pluginCalculations.height;
                    offset = pluginCalculations.offset;
                    position = pluginCalculations.position
                }
                position = this.reposition.offset(target, position, container);
                if (BROWSER.iOS > 3.1 && BROWSER.iOS < 4.1 || BROWSER.iOS >= 4.3 && BROWSER.iOS < 4.33 || !BROWSER.iOS && type === "fixed") {
                    position.left -= win.scrollLeft();
                    position.top -= win.scrollTop()
                }
                if (!pluginCalculations || pluginCalculations && pluginCalculations.adjustable !== FALSE) {
                    position.left += at.x === RIGHT ? targetWidth : at.x === CENTER ? targetWidth / 2 : 0;
                    position.top += at.y === BOTTOM ? targetHeight : at.y === CENTER ? targetHeight / 2 : 0
                }
            }
            position.left += adjust.x + (my.x === RIGHT ? -tooltipWidth : my.x === CENTER ? -tooltipWidth / 2 : 0);
            position.top += adjust.y + (my.y === BOTTOM ? -tooltipHeight : my.y === CENTER ? -tooltipHeight / 2 : 0);
            if (PLUGINS.viewport) {
                adjusted = position.adjusted = PLUGINS.viewport(this, position, posOptions, targetWidth, targetHeight, tooltipWidth, tooltipHeight);
                if (offset && adjusted.left) {
                    position.left += offset.left
                }
                if (offset && adjusted.top) {
                    position.top += offset.top
                }
                if (adjusted.my) {
                    this.position.my = adjusted.my
                }
            } else {
                position.adjusted = {
                    left: 0,
                    top: 0
                }
            }
            if (cache.posClass !== (newClass = this._createPosClass(this.position.my))) {
                tooltip.removeClass(cache.posClass).addClass(cache.posClass = newClass)
            }
            if (!this._trigger("move", [position, viewport.elem || viewport], event)) {
                return this
            }
            delete position.adjusted;
            if (effect === FALSE || !visible || isNaN(position.left) || isNaN(position.top) || target === "mouse" || !$.isFunction(posOptions.effect)) {
                tooltip.css(position)
            } else if ($.isFunction(posOptions.effect)) {
                posOptions.effect.call(tooltip, this, $.extend({}, position));
                tooltip.queue(function(next) {
                    $(this).css({
                        opacity: "",
                        height: ""
                    });
                    if (BROWSER.ie) {
                        this.style.removeAttribute("filter")
                    }
                    next()
                })
            }
            this.positioning = FALSE;
            return this
        };
        PROTOTYPE.reposition.offset = function(elem, pos, container) {
            if (!container[0]) {
                return pos
            }
            var ownerDocument = $(elem[0].ownerDocument),
                quirks = !!BROWSER.ie && document.compatMode !== "CSS1Compat",
                parent = container[0],
                scrolled, position, parentOffset, overflow;

            function scroll(e, i) {
                pos.left += i * e.scrollLeft();
                pos.top += i * e.scrollTop()
            }
            do {
                if ((position = $.css(parent, "position")) !== "static") {
                    if (position === "fixed") {
                        parentOffset = parent.getBoundingClientRect();
                        scroll(ownerDocument, -1)
                    } else {
                        parentOffset = $(parent).position();
                        parentOffset.left += parseFloat($.css(parent, "borderLeftWidth")) || 0;
                        parentOffset.top += parseFloat($.css(parent, "borderTopWidth")) || 0
                    }
                    pos.left -= parentOffset.left + (parseFloat($.css(parent, "marginLeft")) || 0);
                    pos.top -= parentOffset.top + (parseFloat($.css(parent, "marginTop")) || 0);
                    if (!scrolled && (overflow = $.css(parent, "overflow")) !== "hidden" && overflow !== "visible") {
                        scrolled = $(parent)
                    }
                }
            } while (parent = parent.offsetParent);
            if (scrolled && (scrolled[0] !== ownerDocument[0] || quirks)) {
                scroll(scrolled, 1)
            }
            return pos
        };
        var C = (CORNER = PROTOTYPE.reposition.Corner = function(corner, forceY) {
            corner = ("" + corner).replace(/([A-Z])/, " $1").replace(/middle/gi, CENTER).toLowerCase();
            this.x = (corner.match(/left|right/i) || corner.match(/center/) || ["inherit"])[0].toLowerCase();
            this.y = (corner.match(/top|bottom|center/i) || ["inherit"])[0].toLowerCase();
            this.forceY = !!forceY;
            var f = corner.charAt(0);
            this.precedance = f === "t" || f === "b" ? Y : X
        }).prototype;
        C.invert = function(z, center) {
            this[z] = this[z] === LEFT ? RIGHT : this[z] === RIGHT ? LEFT : center || this[z]
        };
        C.string = function(join) {
            var x = this.x,
                y = this.y;
            var result = x !== y ? x === "center" || y !== "center" && (this.precedance === Y || this.forceY) ? [y, x] : [x, y] : [x];
            return join !== false ? result.join(" ") : result
        };
        C.abbrev = function() {
            var result = this.string(false);
            return result[0].charAt(0) + (result[1] && result[1].charAt(0) || "")
        };
        C.clone = function() {
            return new CORNER(this.string(), this.forceY)
        };
        PROTOTYPE.toggle = function(state, event) {
            var cache = this.cache,
                options = this.options,
                tooltip = this.tooltip;
            if (event) {
                if (/over|enter/.test(event.type) && cache.event && /out|leave/.test(cache.event.type) && options.show.target.add(event.target).length === options.show.target.length && tooltip.has(event.relatedTarget).length) {
                    return this
                }
                cache.event = $.event.fix(event)
            }
            this.waiting && !state && (this.hiddenDuringWait = TRUE);
            if (!this.rendered) {
                return state ? this.render(1) : this
            } else if (this.destroyed || this.disabled) {
                return this
            }
            var type = state ? "show" : "hide",
                opts = this.options[type],
                otherOpts = this.options[!state ? "show" : "hide"],
                posOptions = this.options.position,
                contentOptions = this.options.content,
                width = this.tooltip.css("width"),
                visible = this.tooltip.is(":visible"),
                animate = state || opts.target.length === 1,
                sameTarget = !event || opts.target.length < 2 || cache.target[0] === event.target,
                identicalState, allow, showEvent, delay, after;
            if ((typeof state).search("boolean|number")) {
                state = !visible
            }
            identicalState = !tooltip.is(":animated") && visible === state && sameTarget;
            allow = !identicalState ? !!this._trigger(type, [90]) : NULL;
            if (this.destroyed) {
                return this
            }
            if (allow !== FALSE && state) {
                this.focus(event)
            }
            if (!allow || identicalState) {
                return this
            }
            $.attr(tooltip[0], "aria-hidden", !!!state);
            if (state) {
                this.mouse && (cache.origin = $.event.fix(this.mouse));
                if ($.isFunction(contentOptions.text)) {
                    this._updateContent(contentOptions.text, FALSE)
                }
                if ($.isFunction(contentOptions.title)) {
                    this._updateTitle(contentOptions.title, FALSE)
                }
                if (!trackingBound && posOptions.target === "mouse" && posOptions.adjust.mouse) {
                    $(document).bind("mousemove." + NAMESPACE, this._storeMouse);
                    trackingBound = TRUE
                }
                if (!width) {
                    tooltip.css("width", tooltip.outerWidth(FALSE))
                }
                this.reposition(event, arguments[2]);
                if (!width) {
                    tooltip.css("width", "")
                }
                if (!!opts.solo) {
                    (typeof opts.solo === "string" ? $(opts.solo) : $(SELECTOR, opts.solo)).not(tooltip).not(opts.target).qtip("hide", $.Event("tooltipsolo"))
                }
            } else {
                clearTimeout(this.timers.show);
                delete cache.origin;
                if (trackingBound && !$(SELECTOR + '[tracking="true"]:visible', opts.solo).not(tooltip).length) {
                    $(document).unbind("mousemove." + NAMESPACE);
                    trackingBound = FALSE
                }
                this.blur(event)
            }
            after = $.proxy(function() {
                if (state) {
                    if (BROWSER.ie) {
                        tooltip[0].style.removeAttribute("filter")
                    }
                    tooltip.css("overflow", "");
                    if ("string" === typeof opts.autofocus) {
                        $(this.options.show.autofocus, tooltip).focus()
                    }
                    this.options.show.target.trigger("qtip-" + this.id + "-inactive")
                } else {
                    tooltip.css({
                        display: "",
                        visibility: "",
                        opacity: "",
                        left: "",
                        top: ""
                    })
                }
                this._trigger(state ? "visible" : "hidden")
            }, this);
            if (opts.effect === FALSE || animate === FALSE) {
                tooltip[type]();
                after()
            } else if ($.isFunction(opts.effect)) {
                tooltip.stop(1, 1);
                opts.effect.call(tooltip, this);
                tooltip.queue("fx", function(n) {
                    after();
                    n()
                })
            } else {
                tooltip.fadeTo(90, state ? 1 : 0, after)
            }
            if (state) {
                opts.target.trigger("qtip-" + this.id + "-inactive")
            }
            return this
        };
        PROTOTYPE.show = function(event) {
            return this.toggle(TRUE, event)
        };
        PROTOTYPE.hide = function(event) {
            return this.toggle(FALSE, event)
        };
        PROTOTYPE.focus = function(event) {
            if (!this.rendered || this.destroyed) {
                return this
            }
            var qtips = $(SELECTOR),
                tooltip = this.tooltip,
                curIndex = parseInt(tooltip[0].style.zIndex, 10),
                newIndex = QTIP.zindex + qtips.length,
                focusedElem;
            if (!tooltip.hasClass(CLASS_FOCUS)) {
                if (this._trigger("focus", [newIndex], event)) {
                    if (curIndex !== newIndex) {
                        qtips.each(function() {
                            if (this.style.zIndex > curIndex) {
                                this.style.zIndex = this.style.zIndex - 1
                            }
                        });
                        qtips.filter("." + CLASS_FOCUS).qtip("blur", event)
                    }
                    tooltip.addClass(CLASS_FOCUS)[0].style.zIndex = newIndex
                }
            }
            return this
        };
        PROTOTYPE.blur = function(event) {
            if (!this.rendered || this.destroyed) {
                return this
            }
            this.tooltip.removeClass(CLASS_FOCUS);
            this._trigger("blur", [this.tooltip.css("zIndex")], event);
            return this
        };
        PROTOTYPE.disable = function(state) {
            if (this.destroyed) {
                return this
            }
            if (state === "toggle") {
                state = !(this.rendered ? this.tooltip.hasClass(CLASS_DISABLED) : this.disabled)
            } else if ("boolean" !== typeof state) {
                state = TRUE
            }
            if (this.rendered) {
                this.tooltip.toggleClass(CLASS_DISABLED, state).attr("aria-disabled", state)
            }
            this.disabled = !!state;
            return this
        };
        PROTOTYPE.enable = function() {
            return this.disable(FALSE)
        };
        PROTOTYPE._createButton = function() {
            var self = this,
                elements = this.elements,
                tooltip = elements.tooltip,
                button = this.options.content.button,
                isString = typeof button === "string",
                close = isString ? button : "Close tooltip";
            if (elements.button) {
                elements.button.remove()
            }
            if (button.jquery) {
                elements.button = button
            } else {
                elements.button = $("<a />", {
                    "class": "qtip-close " + (this.options.style.widget ? "" : NAMESPACE + "-icon"),
                    title: close,
                    "aria-label": close
                }).prepend($("<span />", {
                    "class": "ui-icon ui-icon-close",
                    html: "&times;"
                }))
            }
            elements.button.appendTo(elements.titlebar || tooltip).attr("role", "button").click(function(event) {
                if (!tooltip.hasClass(CLASS_DISABLED)) {
                    self.hide(event)
                }
                return FALSE
            })
        };
        PROTOTYPE._updateButton = function(button) {
            if (!this.rendered) {
                return FALSE
            }
            var elem = this.elements.button;
            if (button) {
                this._createButton()
            } else {
                elem.remove()
            }
        };

        function createWidgetClass(cls) {
            return WIDGET.concat("").join(cls ? "-" + cls + " " : " ")
        }
        PROTOTYPE._setWidget = function() {
            var on = this.options.style.widget,
                elements = this.elements,
                tooltip = elements.tooltip,
                disabled = tooltip.hasClass(CLASS_DISABLED);
            tooltip.removeClass(CLASS_DISABLED);
            CLASS_DISABLED = on ? "ui-state-disabled" : "qtip-disabled";
            tooltip.toggleClass(CLASS_DISABLED, disabled);
            tooltip.toggleClass("ui-helper-reset " + createWidgetClass(), on).toggleClass(CLASS_DEFAULT, this.options.style.def && !on);
            if (elements.content) {
                elements.content.toggleClass(createWidgetClass("content"), on)
            }
            if (elements.titlebar) {
                elements.titlebar.toggleClass(createWidgetClass("header"), on)
            }
            if (elements.button) {
                elements.button.toggleClass(NAMESPACE + "-icon", !on)
            }
        };

        function delay(callback, duration) {
            if (duration > 0) {
                return setTimeout($.proxy(callback, this), duration)
            } else {
                callback.call(this)
            }
        }

        function showMethod(event) {
            if (this.tooltip.hasClass(CLASS_DISABLED)) {
                return
            }
            clearTimeout(this.timers.show);
            clearTimeout(this.timers.hide);
            this.timers.show = delay.call(this, function() {
                this.toggle(TRUE, event)
            }, this.options.show.delay)
        }

        function hideMethod(event) {
            if (this.tooltip.hasClass(CLASS_DISABLED) || this.destroyed) {
                return
            }
            var relatedTarget = $(event.relatedTarget),
                ontoTooltip = relatedTarget.closest(SELECTOR)[0] === this.tooltip[0],
                ontoTarget = relatedTarget[0] === this.options.show.target[0];
            clearTimeout(this.timers.show);
            clearTimeout(this.timers.hide);
            if (this !== relatedTarget[0] && (this.options.position.target === "mouse" && ontoTooltip) || this.options.hide.fixed && (/mouse(out|leave|move)/.test(event.type) && (ontoTooltip || ontoTarget))) {
                try {
                    event.preventDefault();
                    event.stopImmediatePropagation()
                } catch (e) {}
                return
            }
            this.timers.hide = delay.call(this, function() {
                this.toggle(FALSE, event)
            }, this.options.hide.delay, this)
        }

        function inactiveMethod(event) {
            if (this.tooltip.hasClass(CLASS_DISABLED) || !this.options.hide.inactive) {
                return
            }
            clearTimeout(this.timers.inactive);
            this.timers.inactive = delay.call(this, function() {
                this.hide(event)
            }, this.options.hide.inactive)
        }

        function repositionMethod(event) {
            if (this.rendered && this.tooltip[0].offsetWidth > 0) {
                this.reposition(event)
            }
        }
        PROTOTYPE._storeMouse = function(event) {
            (this.mouse = $.event.fix(event)).type = "mousemove";
            return this
        };
        PROTOTYPE._bind = function(targets, events, method, suffix, context) {
            if (!targets || !method || !events.length) {
                return
            }
            var ns = "." + this._id + (suffix ? "-" + suffix : "");
            $(targets).bind((events.split ? events : events.join(ns + " ")) + ns, $.proxy(method, context || this));
            return this
        };
        PROTOTYPE._unbind = function(targets, suffix) {
            targets && $(targets).unbind("." + this._id + (suffix ? "-" + suffix : ""));
            return this
        };

        function delegate(selector, events, method) {
            $(document.body).delegate(selector, (events.split ? events : events.join("." + NAMESPACE + " ")) + "." + NAMESPACE, function() {
                var api = QTIP.api[$.attr(this, ATTR_ID)];
                api && !api.disabled && method.apply(api, arguments)
            })
        }
        PROTOTYPE._trigger = function(type, args, event) {
            var callback = $.Event("tooltip" + type);
            callback.originalEvent = event && $.extend({}, event) || this.cache.event || NULL;
            this.triggering = type;
            this.tooltip.trigger(callback, [this].concat(args || []));
            this.triggering = FALSE;
            return !callback.isDefaultPrevented()
        };
        PROTOTYPE._bindEvents = function(showEvents, hideEvents, showTargets, hideTargets, showMethod, hideMethod) {
            var similarTargets = showTargets.filter(hideTargets).add(hideTargets.filter(showTargets)),
                toggleEvents = [];
            if (similarTargets.length) {
                $.each(hideEvents, function(i, type) {
                    var showIndex = $.inArray(type, showEvents);
                    showIndex > -1 && toggleEvents.push(showEvents.splice(showIndex, 1)[0])
                });
                if (toggleEvents.length) {
                    this._bind(similarTargets, toggleEvents, function(event) {
                        var state = this.rendered ? this.tooltip[0].offsetWidth > 0 : false;
                        (state ? hideMethod : showMethod).call(this, event)
                    });
                    showTargets = showTargets.not(similarTargets);
                    hideTargets = hideTargets.not(similarTargets)
                }
            }
            this._bind(showTargets, showEvents, showMethod);
            this._bind(hideTargets, hideEvents, hideMethod)
        };
        PROTOTYPE._assignInitialEvents = function(event) {
            var options = this.options,
                showTarget = options.show.target,
                hideTarget = options.hide.target,
                showEvents = options.show.event ? $.trim("" + options.show.event).split(" ") : [],
                hideEvents = options.hide.event ? $.trim("" + options.hide.event).split(" ") : [];
            this._bind(this.elements.target, ["remove", "removeqtip"], function(event) {
                this.destroy(true)
            }, "destroy");
            if (/mouse(over|enter)/i.test(options.show.event) && !/mouse(out|leave)/i.test(options.hide.event)) {
                hideEvents.push("mouseleave")
            }
            this._bind(showTarget, "mousemove", function(event) {
                this._storeMouse(event);
                this.cache.onTarget = TRUE
            });

            function hoverIntent(event) {
                if (this.disabled || this.destroyed) {
                    return FALSE
                }
                this.cache.event = event && $.event.fix(event);
                this.cache.target = event && $(event.target);
                clearTimeout(this.timers.show);
                this.timers.show = delay.call(this, function() {
                    this.render(typeof event === "object" || options.show.ready)
                }, options.prerender ? 0 : options.show.delay)
            }
            this._bindEvents(showEvents, hideEvents, showTarget, hideTarget, hoverIntent, function() {
                if (!this.timers) {
                    return FALSE
                }
                clearTimeout(this.timers.show)
            });
            if (options.show.ready || options.prerender) {
                hoverIntent.call(this, event)
            }
        };
        PROTOTYPE._assignEvents = function() {
            var self = this,
                options = this.options,
                posOptions = options.position,
                tooltip = this.tooltip,
                showTarget = options.show.target,
                hideTarget = options.hide.target,
                containerTarget = posOptions.container,
                viewportTarget = posOptions.viewport,
                documentTarget = $(document),
                bodyTarget = $(document.body),
                windowTarget = $(window),
                showEvents = options.show.event ? $.trim("" + options.show.event).split(" ") : [],
                hideEvents = options.hide.event ? $.trim("" + options.hide.event).split(" ") : [];
            $.each(options.events, function(name, callback) {
                self._bind(tooltip, name === "toggle" ? ["tooltipshow", "tooltiphide"] : ["tooltip" + name], callback, null, tooltip)
            });
            if (/mouse(out|leave)/i.test(options.hide.event) && options.hide.leave === "window") {
                this._bind(documentTarget, ["mouseout", "blur"], function(event) {
                    if (!/select|option/.test(event.target.nodeName) && !event.relatedTarget) {
                        this.hide(event)
                    }
                })
            }
            if (options.hide.fixed) {
                hideTarget = hideTarget.add(tooltip.addClass(CLASS_FIXED))
            } else if (/mouse(over|enter)/i.test(options.show.event)) {
                this._bind(hideTarget, "mouseleave", function() {
                    clearTimeout(this.timers.show)
                })
            }
            if (("" + options.hide.event).indexOf("unfocus") > -1) {
                this._bind(containerTarget.closest("html"), ["mousedown", "touchstart"], function(event) {
                    var elem = $(event.target),
                        enabled = this.rendered && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0,
                        isAncestor = elem.parents(SELECTOR).filter(this.tooltip[0]).length > 0;
                    if (elem[0] !== this.target[0] && elem[0] !== this.tooltip[0] && !isAncestor && !this.target.has(elem[0]).length && enabled) {
                        this.hide(event)
                    }
                })
            }
            if ("number" === typeof options.hide.inactive) {
                this._bind(showTarget, "qtip-" + this.id + "-inactive", inactiveMethod, "inactive");
                this._bind(hideTarget.add(tooltip), QTIP.inactiveEvents, inactiveMethod)
            }
            this._bindEvents(showEvents, hideEvents, showTarget, hideTarget, showMethod, hideMethod);
            this._bind(showTarget.add(tooltip), "mousemove", function(event) {
                if ("number" === typeof options.hide.distance) {
                    var origin = this.cache.origin || {},
                        limit = this.options.hide.distance,
                        abs = Math.abs;
                    if (abs(event.pageX - origin.pageX) >= limit || abs(event.pageY - origin.pageY) >= limit) {
                        this.hide(event)
                    }
                }
                this._storeMouse(event)
            });
            if (posOptions.target === "mouse") {
                if (posOptions.adjust.mouse) {
                    if (options.hide.event) {
                        this._bind(showTarget, ["mouseenter", "mouseleave"], function(event) {
                            if (!this.cache) {
                                return FALSE
                            }
                            this.cache.onTarget = event.type === "mouseenter"
                        })
                    }
                    this._bind(documentTarget, "mousemove", function(event) {
                        if (this.rendered && this.cache.onTarget && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0) {
                            this.reposition(event)
                        }
                    })
                }
            }
            if (posOptions.adjust.resize || viewportTarget.length) {
                this._bind($.event.special.resize ? viewportTarget : windowTarget, "resize", repositionMethod)
            }
            if (posOptions.adjust.scroll) {
                this._bind(windowTarget.add(posOptions.container), "scroll", repositionMethod)
            }
        };
        PROTOTYPE._unassignEvents = function() {
            var options = this.options,
                showTargets = options.show.target,
                hideTargets = options.hide.target,
                targets = $.grep([this.elements.target[0], this.rendered && this.tooltip[0], options.position.container[0], options.position.viewport[0], options.position.container.closest("html")[0], window, document], function(i) {
                    return typeof i === "object"
                });
            if (showTargets && showTargets.toArray) {
                targets = targets.concat(showTargets.toArray())
            }
            if (hideTargets && hideTargets.toArray) {
                targets = targets.concat(hideTargets.toArray())
            }
            this._unbind(targets)._unbind(targets, "destroy")._unbind(targets, "inactive")
        };
        $(function() {
            delegate(SELECTOR, ["mouseenter", "mouseleave"], function(event) {
                var state = event.type === "mouseenter",
                    tooltip = $(event.currentTarget),
                    target = $(event.relatedTarget || event.target),
                    options = this.options;
                if (state) {
                    this.focus(event);
                    tooltip.hasClass(CLASS_FIXED) && !tooltip.hasClass(CLASS_DISABLED) && clearTimeout(this.timers.hide)
                } else {
                    if (options.position.target === "mouse" && options.position.adjust.mouse && options.hide.event && options.show.target && !target.closest(options.show.target[0]).length) {
                        this.hide(event)
                    }
                }
                tooltip.toggleClass(CLASS_HOVER, state)
            });
            delegate("[" + ATTR_ID + "]", INACTIVE_EVENTS, inactiveMethod)
        });

        function init(elem, id, opts) {
            var obj, posOptions, attr, config, title, docBody = $(document.body),
                newTarget = elem[0] === document ? docBody : elem,
                metadata = elem.metadata ? elem.metadata(opts.metadata) : NULL,
                metadata5 = opts.metadata.type === "html5" && metadata ? metadata[opts.metadata.name] : NULL,
                html5 = elem.data(opts.metadata.name || "qtipopts");
            try {
                html5 = typeof html5 === "string" ? $.parseJSON(html5) : html5
            } catch (e) {}
            config = $.extend(TRUE, {}, QTIP.defaults, opts, typeof html5 === "object" ? sanitizeOptions(html5) : NULL, sanitizeOptions(metadata5 || metadata));
            posOptions = config.position;
            config.id = id;
            if ("boolean" === typeof config.content.text) {
                attr = elem.attr(config.content.attr);
                if (config.content.attr !== FALSE && attr) {
                    config.content.text = attr
                } else {
                    return FALSE
                }
            }
            if (!posOptions.container.length) {
                posOptions.container = docBody
            }
            if (posOptions.target === FALSE) {
                posOptions.target = newTarget
            }
            if (config.show.target === FALSE) {
                config.show.target = newTarget
            }
            if (config.show.solo === TRUE) {
                config.show.solo = posOptions.container.closest("body")
            }
            if (config.hide.target === FALSE) {
                config.hide.target = newTarget
            }
            if (config.position.viewport === TRUE) {
                config.position.viewport = posOptions.container
            }
            posOptions.container = posOptions.container.eq(0);
            posOptions.at = new CORNER(posOptions.at, TRUE);
            posOptions.my = new CORNER(posOptions.my);
            if (elem.data(NAMESPACE)) {
                if (config.overwrite) {
                    elem.qtip("destroy", true)
                } else if (config.overwrite === FALSE) {
                    return FALSE
                }
            }
            elem.attr(ATTR_HAS, id);
            if (config.suppress && (title = elem.attr("title"))) {
                elem.removeAttr("title").attr(oldtitle, title).attr("title", "")
            }
            obj = new QTip(elem, config, id, !!attr);
            elem.data(NAMESPACE, obj);
            return obj
        }
        QTIP = $.fn.qtip = function(options, notation, newValue) {
            var command = ("" + options).toLowerCase(),
                returned = NULL,
                args = $.makeArray(arguments).slice(1),
                event = args[args.length - 1],
                opts = this[0] ? $.data(this[0], NAMESPACE) : NULL;
            if (!arguments.length && opts || command === "api") {
                return opts
            } else if ("string" === typeof options) {
                this.each(function() {
                    var api = $.data(this, NAMESPACE);
                    if (!api) {
                        return TRUE
                    }
                    if (event && event.timeStamp) {
                        api.cache.event = event
                    }
                    if (notation && (command === "option" || command === "options")) {
                        if (newValue !== undefined || $.isPlainObject(notation)) {
                            api.set(notation, newValue)
                        } else {
                            returned = api.get(notation);
                            return FALSE
                        }
                    } else if (api[command]) {
                        api[command].apply(api, args)
                    }
                });
                return returned !== NULL ? returned : this
            } else if ("object" === typeof options || !arguments.length) {
                opts = sanitizeOptions($.extend(TRUE, {}, options));
                return this.each(function(i) {
                    var api, id;
                    id = $.isArray(opts.id) ? opts.id[i] : opts.id;
                    id = !id || id === FALSE || id.length < 1 || QTIP.api[id] ? QTIP.nextid++ : id;
                    api = init($(this), id, opts);
                    if (api === FALSE) {
                        return TRUE
                    } else {
                        QTIP.api[id] = api
                    }
                    $.each(PLUGINS, function() {
                        if (this.initialize === "initialize") {
                            this(api)
                        }
                    });
                    api._assignInitialEvents(event)
                })
            }
        };
        $.qtip = QTip;
        QTIP.api = {};
        $.each({
            attr: function(attr, val) {
                if (this.length) {
                    var self = this[0],
                        title = "title",
                        api = $.data(self, "qtip");
                    if (attr === title && api && "object" === typeof api && api.options.suppress) {
                        if (arguments.length < 2) {
                            return $.attr(self, oldtitle)
                        }
                        if (api && api.options.content.attr === title && api.cache.attr) {
                            api.set("content.text", val)
                        }
                        return this.attr(oldtitle, val)
                    }
                }
                return $.fn["attr" + replaceSuffix].apply(this, arguments)
            },
            clone: function(keepData) {
                var titles = $([]),
                    title = "title",
                    elems = $.fn["clone" + replaceSuffix].apply(this, arguments);
                if (!keepData) {
                    elems.filter("[" + oldtitle + "]").attr("title", function() {
                        return $.attr(this, oldtitle)
                    }).removeAttr(oldtitle)
                }
                return elems
            }
        }, function(name, func) {
            if (!func || $.fn[name + replaceSuffix]) {
                return TRUE
            }
            var old = $.fn[name + replaceSuffix] = $.fn[name];
            $.fn[name] = function() {
                return func.apply(this, arguments) || old.apply(this, arguments)
            }
        });
        if (!$.ui) {
            $["cleanData" + replaceSuffix] = $.cleanData;
            $.cleanData = function(elems) {
                for (var i = 0, elem;
                    (elem = $(elems[i])).length; i++) {
                    if (elem.attr(ATTR_HAS)) {
                        try {
                            elem.triggerHandler("removeqtip")
                        } catch (e) {}
                    }
                }
                $["cleanData" + replaceSuffix].apply(this, arguments)
            }
        }
        QTIP.version = "2.2.1";
        QTIP.nextid = 0;
        QTIP.inactiveEvents = INACTIVE_EVENTS;
        QTIP.zindex = 15e3;
        QTIP.defaults = {
            prerender: FALSE,
            id: FALSE,
            overwrite: TRUE,
            suppress: TRUE,
            content: {
                text: TRUE,
                attr: "title",
                title: FALSE,
                button: FALSE
            },
            position: {
                my: "top left",
                at: "bottom right",
                target: FALSE,
                container: FALSE,
                viewport: FALSE,
                adjust: {
                    x: 0,
                    y: 0,
                    mouse: TRUE,
                    scroll: TRUE,
                    resize: TRUE,
                    method: "flipinvert flipinvert"
                },
                effect: function(api, pos, viewport) {
                    $(this).animate(pos, {
                        duration: 200,
                        queue: FALSE
                    })
                }
            },
            show: {
                target: FALSE,
                event: "mouseenter",
                effect: TRUE,
                delay: 90,
                solo: FALSE,
                ready: FALSE,
                autofocus: FALSE
            },
            hide: {
                target: FALSE,
                event: "mouseleave",
                effect: TRUE,
                delay: 0,
                fixed: FALSE,
                inactive: FALSE,
                leave: "window",
                distance: FALSE
            },
            style: {
                classes: "",
                widget: FALSE,
                width: FALSE,
                height: FALSE,
                def: TRUE
            },
            events: {
                render: NULL,
                move: NULL,
                show: NULL,
                hide: NULL,
                toggle: NULL,
                visible: NULL,
                hidden: NULL,
                focus: NULL,
                blur: NULL
            }
        }
    })
})(window, document);
var getQtipTrigger = function($item) {
    var trigger = {
        show: "mouseenter hover",
        hide: "mouseout"
    };
    switch ($item.data("trigger")) {
        case "focus":
            trigger.show = "focus";
            trigger.hide = "blur";
            break;
        case "click":
            trigger.show = "click";
            trigger.hide = "click";
            break;
        case "hover":
        default:
            trigger.show = "mouseenter hover";
            trigger.hide = "mouseout"
    }
    return trigger
};
var getQtipPosition = function($item) {
    var position = {
        my: "bottom center",
        at: "top center",
        offsetX: 0,
        offsetY: -5
    };
    switch ($item.data("placement")) {
        case "left":
            position.my = "right center";
            position.at = "left center";
            position.offsetX = -5;
            position.offsetY = 0;
            break;
        case "right":
            position.my = "left center";
            position.at = "right center";
            position.offsetX = 5;
            position.offsetY = 0;
            break;
        case "bottom":
            position.my = "top center";
            position.at = "bottom center";
            position.offsetX = 0;
            position.offsetY = 5;
            break;
        case "top":
        default:
            position.my = "bottom center";
            position.at = "top center";
            position.offsetX = 0;
            position.offsetY = -5
    }
    return position
};
var createQtip = function($item, options) {
    var trigger = options !== undefined && options.trigger !== undefined ? options.trigger : getQtipTrigger($item),
        position = options !== undefined && options.position !== undefined ? options.position : getQtipPosition($item),
        content = options !== undefined && options.content !== undefined ? options.content : $item.attr("title");
    $item.qtip({
        show: trigger.show,
        hide: trigger.hide,
        content: content,
        position: {
            adjust: {
                x: position.offsetX,
                y: position.offsetY
            }
        },
        events: {
            show: function(event, api) {
                $item.qtip("option", "position.my", position.my);
                $item.qtip("option", "position.at", position.at)
            }
        }
    })
};
var createQtips = function($items, options) {
    $items.each(function() {
        createQtip($(this), options)
    })
};
createQtips($(".tip"));
window.CollectionHolder = function($, window) {
    var defaultOptions = {
        addItemCallback: function(el) {},
        maxItemCount: null
    };
    var Item = function(element, collectionHolder) {
        this.$element = $(element);
        this.$closeButton = this.$element.find('[rel="remove-item"]');
        this.collectionHolder = collectionHolder;
        this._init();
        return this
    };
    Item.prototype.getElement = function() {
        return this.$element
    };
    Item.prototype._init = function() {
        this.$closeButton.on("click", function clickOnCloseButtonItem(evt) {
            evt.preventDefault();
            var index = this.collectionHolder.items.indexOf(this);
            this.collectionHolder.items.splice(index, 1);
            this.$element.trigger("pre_remove", this);
            this.$element.remove();
            this.collectionHolder.$element.trigger("remove_item")
        }.bind(this))
    };
    var CollectionHolder = function(element, options) {
        this.$element = $(element);
        this.$addButton = this.$element.find(".stage-add");
        this.htmlPrototype = this.$element.data("prototype");
        this.items = [];
        this.options = $.extend(this.options, defaultOptions, options);
        this._init();
        return this
    };
    CollectionHolder.prototype.addItem = function() {
        if (null !== this.options.maxItemCount && this.options.maxItemCount <= this.items.length) {
            return
        }
        var index = this.items.length;
        var html = this.htmlPrototype.replace(/__name__/g, index);
        var element = $("<li />").append($(html));
        var item = new Item(element, this);
        this.items.push(item);
        this.$element.find("li:last-child").before(item.getElement());
        this.options.addItemCallback(item.getElement());
        return this
    };
    CollectionHolder.prototype._init = function() {
        var that = this;
        var children = this.$element.children();
        for (var i = 0, n = children.length; i < n - 1; i++) {
            var item = new Item(children.get(i), this);
            this.items.push(item)
        }
        this.$addButton.on("click", function(evt) {
            evt.preventDefault();
            that.addItem()
        })
    };
    return CollectionHolder
}(jQuery, window, undefined);
window.RideMap = function($, window, undefined) {
    var RideMap = function(canvas, options) {
        this.$canvas = $(canvas);
        options = options || {};
        this.options = {
            latitude: options.latitude || this.$canvas.data("latitude") || 46.739861,
            longitude: options.longitude || this.$canvas.data("longitude") || 2.460938
        };
        this.map = null;
        this.directionsDisplay = new google.maps.DirectionsRenderer({
            suppressMarkers: true
        });
        this.directionsService = new google.maps.DirectionsService;
        this.departure = null;
        this.arrival = null;
        this.stopovers = [];
        this._markers = [];
        this._init()
    };
    RideMap.prototype.setDeparture = function(departure) {
        this.departure = departure;
        return this
    };
    RideMap.prototype.setArrival = function(arrival) {
        this.arrival = arrival;
        return this
    };
    RideMap.prototype.setStopovers = function(stopovers) {
        this.stopovers = stopovers;
        return this
    };
    RideMap.prototype.addStopover = function(stopover) {
        this.stopovers.push(stopover);
        return this
    };
    RideMap.prototype.setPoints = function(points) {};
    RideMap.prototype.getPoints = function() {
        var points = [];
        if (this.departure) {
            points.push(this.departure)
        }
        points.concat(this.stopovers);
        if (this.arrival) {
            points.concat(this.stopovers);
            points.push(this.arrival)
        }
        return points
    };
    RideMap.prototype.refreshView = function() {
        var i, n;
        for (i = 0, n = this._markers.length; i < n; i++) {
            this._markers[i].setMap(null)
        }
        this.directionsDisplay.setMap(null);
        this._computeMarkers();
        if (this.departure && this.arrival) {
            var waypoints = [];
            for (i = 0, n = this.stopovers.length; i < n; i++) {
                waypoints.push({
                    location: new google.maps.LatLng(this.stopovers[i].coordinates.latitude, this.stopovers[i].coordinates.longitude),
                    stopover: true
                })
            }
            var request = {
                origin: new google.maps.LatLng(this.departure.coordinates.latitude, this.departure.coordinates.longitude),
                destination: new google.maps.LatLng(this.arrival.coordinates.latitude, this.arrival.coordinates.longitude),
                waypoints: waypoints,
                travelMode: google.maps.TravelMode.DRIVING
            };
            this.directionsService.route(request, function(result, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    this.directionsDisplay.setMap(this.map);
                    this.directionsDisplay.setDirections(result)
                }
            }.bind(this))
        }
        for (i = 0, n = this._markers.length; i < n; i++) {
            this._markers[i].setMap(this.map)
        }
    };
    RideMap.prototype._init = function() {
        var mapOptions = {
            center: new google.maps.LatLng(this.options.latitude, this.options.longitude),
            zoom: 5,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            streetViewControl: false,
            mapTypeControl: false
        };
        this.map = new google.maps.Map(this.$canvas.get(0), mapOptions)
    };
    RideMap.prototype._computeMarkers = function() {
        var coordinates;
        this._markers.length = 0;
        if (this.departure) {
            coordinates = this.departure.coordinates;
            this._markers.push(this._createMarkerIcon(new google.maps.LatLng(coordinates.latitude, coordinates.longitude), "departure"))
        }
        if (this.arrival) {
            coordinates = this.arrival.coordinates;
            this._markers.push(this._createMarkerIcon(new google.maps.LatLng(coordinates.latitude, coordinates.longitude), "arrival"))
        }
        for (var i = 0, n = this.stopovers.length; i < n; i++) {
            coordinates = this.stopovers[i].coordinates;
            this._markers.push(this._createMarkerIcon(new google.maps.LatLng(coordinates.latitude, coordinates.longitude), "stopover", i + 1))
        }
    };
    RideMap.prototype._createMarkerIcon = function(latlng, name, number) {
        var options = {
            position: latlng
        };
        var icon = this._getMarkerIcon(name, number);
        if (null !== icon) {}
        return new google.maps.Marker(options)
    };
    RideMap.prototype._getMarkerIcon = function(name, number) {
        switch (name) {
            case "departure":
                return "/images/maps/marker-departure.png";
            case "arrival":
                return "/images/maps/marker-arrival.png";
            case "stopover":
                if (typeof number !== undefined) {
                    number = parseInt(number, 10);
                    number = Math.min(9, number);
                    number = Math.max(1, number);
                    return "/images/maps/marker-stopover-" + number + ".png"
                }
                return "/images/maps/marker-stopover.png"
        }
        return null
    };
    return RideMap
}(jQuery, window);
window.Binder = function($, window, undefined) {
    function Binder(data) {
        if (typeof data === "object") {
            this.data = data;
            this.apply()
        } else {
            this.data = {}
        }
    }
    Binder.prototype.get = function(key) {
        if (!key in this.data) {
            return null
        }
        var value = this.data[key];
        if (typeof value === "function") {
            value = value(this)
        }
        return value
    };
    Binder.prototype.set = function(key, value) {
        this.data[key] = value;
        this.apply();
        return this
    };
    Binder.prototype.apply = function(key) {
        var keys = typeof key === "undefined" ? this.data : [key];
        for (var key in keys) {
            var value = this.get(key);
            if (null === value) {
                $('[data-bind="' + key + '"]').text("");
                $('[data-repeat="' + key + '"]').text("")
            } else {
                $('[data-bind="' + key + '"]').text(value);
                $('[data-repeat="' + key + '"]').each(function() {
                    $this = $(this);
                    var prototype = $this.data("prototype");
                    if (!prototype) return;
                    var html = "";
                    if ($.isArray(value)) {
                        var count = value.length;
                        for (var i = 0; i < count; i++) {
                            html += prototype.replace(/__value__/g, value[i])
                        }
                    } else if ($.isNumeric(value)) {
                        var count = parseInt(value);
                        for (var i = 0; i < count; i++) {
                            html += prototype
                        }
                    }
                    $this.html(html)
                })
            }
            if (value instanceof Array && value.length === 0 || !value) {
                $('[data-show="' + key + '"]').hide()
            } else {
                $('[data-show="' + key + '"]').show()
            }
        }
        return this
    };
    return Binder
}(jQuery, window);
$(function() {
    $(document).on("click", ".js-link", function(evt) {
        evt.preventDefault();
        document.location = $(this).attr("data-href")
    });
    $(".wrapped.dropdown").dropdown("toggle");
    $(".text-short").each(function() {
        ShortenText.init($(this))
    });
    $(".place-autocomplete").placeAutocomplete();
    $(".geo-autocomplete").completeLocation();
    (function() {
        var $parentForm = $("#search-form, .search-form"),
            locationSelected = false,
            $locationContainer;
        $(".geo-autocomplete").on("click", function() {
            $locationContainer = $(".pac-container")
        });
        $(".geo-autocomplete").on("keyup", function(e) {
            if (!$locationContainer) {
                return
            }
            if (e.which == 13 && !locationSelected && $locationContainer.filter(":visible").length == 0) {
                $parentForm.submit()
            }
            locationSelected = $locationContainer.find(".pac-item-selected").length !== 0
        })
    })();
    $(".input-number").inputNumber();
    $(".trip-search-form .reverse").on("click", function(e) {
        e.preventDefault();
        var swapName = $("#simple_search_from_name").val();
        var swapLat = $("#simple_search_from_coordinates_latitude").val();
        var swapLon = $("#simple_search_from_coordinates_longitude").val();
        $("#simple_search_from_name").val($("#simple_search_to_name").val());
        $("#simple_search_from_coordinates_latitude").val($("#simple_search_to_coordinates_latitude").val());
        $("#simple_search_from_coordinates_longitude").val($("#simple_search_to_coordinates_longitude").val());
        $("#simple_search_to_name").val(swapName);
        $("#simple_search_to_coordinates_latitude").val(swapLat);
        $("#simple_search_to_coordinates_longitude").val(swapLon)
    });
    bbc.initDatePicker = function($this) {
        var options = {
            selectOtherMonths: true,
            showAnim: "",
            minDate: new Date,
            onSelect: function(dateText, inst) {
                $(this).trigger("onSelect", dateText)
            }
        };
        var minDateAttr = $this.attr("data-datepicker-minDate");
        if (minDateAttr) {
            options.minDate = minDateAttr !== "null" ? minDateAttr : null
        }
        $this.datepicker(options)
    };
    $(".date-picker, .datepicker").each(function() {
        bbc.initDatePicker($(this))
    });
    var confirmDialog = function() {
        return confirm($(this).data("confirm"))
    };
    $("a.js-confirm[data-confirm]").on("click", confirmDialog);
    $("form.js-confirm[data-confirm]").on("submit", confirmDialog);
    $("input[placeholder], textarea[placeholder]").placeholder();
    window.initQtips = function recreateQtips() {
        $(".tip").each(function() {
            createQtip($(this))
        });
        return recreateQtips
    }();
    $(".popup").click(function() {
        var title = $(this).data("popup-title") || "",
            width = $(this).data("popup-width") || 600,
            height = $(this).data("popup-height") || 400,
            left = ($(window).width() - width) / 2,
            top = ($(window).height() - height) / 2,
            url = this.href,
            opts = "status=1" + ",width=" + width + ",height=" + height + ",top=" + top + ",left=" + left;
        window.open(url, title, opts);
        return false
    });
    $(".toggler").live("click", function toggler() {
        $("#" + $(this).data("id")).toggle();
        return false
    });
    $(".confirm").live("click", function confirmCallback() {
        return confirm($(this).data("confirm"))
    });
    $(".js-time-select").each(function() {
        var $this = $(this);
        var $selectList = $this.find("select");
        var $hoursSelect = $selectList.first();
        var $minutesSelect = $selectList.last();
        $hoursSelect.on("change", function() {
            if ("" === $minutesSelect.val()) {
                $minutesSelect.val(0)
            }
        })
    });
    $("a[data-toggle=popover], button[data-toggle=popover], label[data-toggle=popover], img[data-toggle=popover]").popover().click(function(e) {
        e.preventDefault()
    })
});

function googleMapsLoaded() {
    $(document).trigger("googlemaps-loaded")
}

function loadGoogleMapScript() {
    if (googleMapsUrl === undefined) {
        console && console.error("Variable googleMapsUrl is missing")
    }
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.src = googleMapsUrl + "&callback=googleMapsLoaded";
    document.body.appendChild(script)
}
var GoogleMapPromise = $.Deferred();

function ensureGoogleMapLoaded(callback) {
    callback = callback || function() {};
    if (typeof google != "undefined" && typeof google.maps != "undefined") {
        callback();
        GoogleMapPromise.resolve(google);
        return GoogleMapPromise
    }
    $(document).on("googlemaps-loaded", function() {
        callback();
        GoogleMapPromise.resolve(google)
    });
    loadGoogleMapScript();
    return GoogleMapPromise
}(function($) {
    $.fn.completeLocation = function() {
        var $this = $(this);
        $this.on("focus", function() {
            ensureGoogleMapLoaded(function() {
                var options = {
                    preventSubmit: true
                };
                if (typeof googleMapsBoundingBox !== "undefined") {
                    options.bounds = new google.maps.LatLngBounds(new google.maps.LatLng(googleMapsBoundingBox.sw.lat, googleMapsBoundingBox.sw.lon), new google.maps.LatLng(googleMapsBoundingBox.ne.lat, googleMapsBoundingBox.ne.lon))
                }
                $this.googleAutocomplete(options)
            })
        })
    };
    $.fn.showMap = function() {
        var directionsService = new google.maps.DirectionsService;
        var $locationsLi = $("li", this);
        var origin = $locationsLi.first().attr("data-latitude") + ", " + $locationsLi.first().attr("data-longitude");
        var destination = $locationsLi.last().attr("data-latitude") + ", " + $locationsLi.last().attr("data-longitude");
        var waypts = [];
        if (2 < $locationsLi.length) {
            for (var i = 1; i < $locationsLi.length - 1; i++) {
                waypts.push({
                    location: $locationsLi.eq(i).attr("data-latitude") + ", " + $locationsLi.eq(i).attr("data-longitude"),
                    stopover: true
                })
            }
        }
        var avoidHighways = "0" === this.attr("data-highway") ? true : false;
        var myOptions = {
            center: new google.maps.LatLng(48, 8566, 2.3522),
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            streetViewControl: false,
            panControl: true
        };
        var map = new google.maps.Map(this.get(0), myOptions);
        var request = {
            origin: origin,
            destination: destination,
            waypoints: waypts,
            avoidHighways: avoidHighways,
            travelMode: google.maps.TravelMode.DRIVING
        };
        var directionsDisplay = new google.maps.DirectionsRenderer;
        directionsService.route(request, function(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                directionsDisplay.setDirections(result)
            }
        });
        directionsDisplay.setMap(map);
        return map
    }
})(window.jQuery || window.Zepto || window.$);
$(document).ready(function() {
    $(".dropdown-toggle").dropdown();
    $(".dropdown-toggle, .login-toggle").on("click", function(e) {
        $(this).attr("aria-expanded", $(this).attr("aria-expanded") == "true" ? "false" : "true")
    });
    var $quotes = $(".slider ul");
    if ($quotes.length) {
        $quotes.cycle({
            fx: "scrollHorz",
            prev: $(".homepage-extra-press .prev"),
            next: $(".homepage-extra-press .next"),
            timeout: 0
        })
    }
    $("#carousel-axes").carousel({
        interval: 5e3
    });
    $(".play-button").youtubeLink({
        target: "dialog"
    });

    function animateFeedback() {
        var $panel = $(".feedback-container");
        $panel.animate({
            left: parseInt($panel.css("left"), 10) == 0 ? -$panel.outerWidth() : 0
        })
    }

    function positionFeedback() {
        var $panel = $(".feedback-container"),
            $positionPanel = parseInt($panel.css("left"), 10);
        return $positionPanel
    }

    function SuccessFeedback() {
        animateFeedback();
        $('.feedback-form input[name="contact[subject]"]').val("");
        $('.feedback-form textarea[name="contact[message]"]').val("");
        var $success = $(".alert-success.feedback-alert");
        $success.delay(500).fadeIn("slow", 0).delay(3e3).fadeOut("slow", 0)
    }

    function ErrorFeedback(errors) {
        for (var i = 0; i < errors.length; i++) {
            $(".feedback-container ." + errors[i]).fadeIn()
        }
    }
    $(".feedback-container").on("click", function(event) {
        event.stopPropagation()
    });
    $(".feedback-animate").on("click", function() {
        animateFeedback()
    });
    $(".feedback-form .btn-validation").on("click", function() {
        $(".feedback-container .error").fadeOut();
        var url = $(".feedback-form").attr("action");
        var subject = $('.feedback-form input[name="contact[subject]"]').val();
        var message = $('.feedback-form textarea[name="contact[message]"]').val();
        var email = $('.feedback-form input[name="contact[email]"]').val();
        var phone = $('.feedback-form input[name="contact[phone]"]').val();
        var token = $('.feedback-form input[name="contact[_token]"]').val();
        var categoryFilter = $('.feedback-form select[name="contact[categoryFilter]"]').val();
        var category = $('.feedback-form select[name="contact[category]"]').val();
        $.ajax({
            type: "POST",
            url: url,
            data: {
                "contact[subject]": subject,
                "contact[message]": message,
                "contact[email]": email,
                "contact[phone]": phone,
                "contact[_token]": token,
                "contact[categoryFilter]": categoryFilter,
                "contact[category]": category
            }
        }).done(function(data) {
            if (data.result) {
                SuccessFeedback()
            } else {
                ErrorFeedback(data.errors)
            }
        })
    });
    $("html").on("click", function(event) {
        if ($(".feedback-container").length >= 1) {
            var $position = positionFeedback();
            if ($position !== -559) {
                animateFeedback()
            }
        }
    })
});
var bbc = bbc || {};
bbc.seatPassengerBlock = function($block, $modalPlus, $modalMinus, $modalFull, $modalWarningPassengers) {
    "use strict";
    var self = {
            searchNumberInput: null
        },
        that = {};
    that.init = function() {
        self.$form = $block.find("form.input-number-passengers");
        self.xhrUrl = self.$form.attr("action");
        self.searchNumberInput = self.$form.find("input:first");
        $block.find(".plus-minus-container span").click(function() {
            var $this = $(this),
                currentValue = self.searchNumberInput.val(),
                minValue = self.searchNumberInput.attr("data-number-min"),
                maxValue = self.searchNumberInput.attr("data-number-max"),
                isBookingEnabled = self.searchNumberInput.attr("data-booking-enabled"),
                valueToDisplayWarning = self.searchNumberInput.attr("data-value-warning");
            if ($this.hasClass("btn-plus")) {
                if (currentValue >= maxValue) {
                    that.displayTooltip();
                    return
                }
                if (currentValue == valueToDisplayWarning && isBookingEnabled == 0) {
                    that.displayManageModal($modalWarningPassengers)
                } else {
                    that.displayManageModal($modalPlus)
                }
            } else {
                if (currentValue <= 0) {
                    return
                }
                if (currentValue == 1) {
                    that.displayModalFull();
                    return
                }
                that.displayManageModal($modalMinus)
            }
        })
    };
    that.manageSeat = function(count) {
        var searchNumberInputVal = +self.searchNumberInput.val();
        var newValue = searchNumberInputVal + count;
        $.ajax({
            url: self.xhrUrl,
            type: "POST",
            data: {
                count: newValue
            }
        }).done(function() {
            self.searchNumberInput.val(newValue)
        });
        if (count == 1) {}
    };
    that.displayManageModal = function($modal) {
        var $buttons = $modal.find(".modal-footer a"),
            count = $modal.attr("id") == "remove-seat" ? -1 : 1;
        $modal.on("hide", function() {
            $buttons.off("click")
        });
        $buttons.on("click", function() {
            if ($(this).hasClass("btn-validation")) {
                that.manageSeat(count)
            }
        });
        $modal.modal("show")
    };
    that.displayTooltip = function() {
        self.searchNumberInput.tooltip({
            title: self.searchNumberInput.attr("data-message-max"),
            animation: true,
            placement: "top"
        }).tooltip("show");
        setTimeout(function() {
            self.searchNumberInput.tooltip("hide");
            self.searchNumberInput.tooltip("destroy")
        }, 5e3)
    };
    that.displayModalFull = function() {
        var $buttons = $modalFull.find(".modal-footer a");
        $modalFull.on("hide", function() {
            $buttons.off("click")
        });
        $buttons.one("click", function() {
            if (!$(this).hasClass("btn-base")) {
                that.manageSeat(-1)
            }
        });
        $modalFull.modal("show")
    };
    that.init()
};
$(document).ready(function() {
    var $modalPlus = $("#add-seat"),
        $modalMinus = $("#remove-seat"),
        $modalFull = $("#full-seat"),
        $modalWarningPassengers = $("#passengersWarningModalDashboard");
    $(".my-trip").each(function() {
        bbc.seatPassengerBlock($(this), $modalPlus, $modalMinus, $modalFull, $modalWarningPassengers)
    });
    $(".login-toggle").on("click", function(event) {
        event.preventDefault();
        $(".login").toggle();
        return false
    });
    $(document).mousedown(function(e) {
        var canHide = !$(e.target).hasClass("login-toggle");
        var container = $(".login");
        if (canHide && container.has(e.target).length === 0) {
            container.hide()
        }
    });
    var displayTripMap = function() {
        var mapContainer = $(".js-maps"),
            linkToggle = $(".js-display-map[data-position='global']"),
            linkWordingShow = linkToggle.attr("data-origin"),
            linkWordingHide = linkToggle.attr("data-alt"),
            mapLoaded = false,
            startLt = $("head meta[name='departure_latitude']").attr("content"),
            startLg = $("head meta[name='departure_longitude']").attr("content"),
            endLt = $("head meta[name='arrival_latitude']").attr("content"),
            endLg = $("head meta[name='arrival_longitude']").attr("content"),
            departure, arrival, tripMap, global = {
                pos: undefined,
                zoom: undefined
            };
        if (!startLt || !startLg || !endLt || !endLg) {
            return
        }
        $(".js-display-map").on("click", function(event) {
            event.preventDefault();
            var currentLink = $(this),
                position = null,
                zoom = null;
            ensureGoogleMapLoaded(function() {
                departure = new google.maps.LatLng(startLt, startLg);
                arrival = new google.maps.LatLng(endLt, endLg);
                if (currentLink.attr("data-position") == "departure") {
                    position = departure;
                    zoom = 10
                } else if (currentLink.attr("data-position") == "arrival") {
                    position = arrival;
                    zoom = 10
                } else if (currentLink.attr("data-position") == "global") {
                    position = global.pos;
                    zoom = global.zoom
                }
                if (!mapLoaded) {
                    tripMap = mapContainer.find(".RideMap-canvas").showMap();
                    google.maps.event.addListener(tripMap, "center_changed", function() {
                        global.pos = tripMap.getCenter();
                        google.maps.event.clearListeners(tripMap, "center_changed")
                    });
                    google.maps.event.addListener(tripMap, "idle", function() {
                        global.zoom = tripMap.getZoom();
                        if (typeof position != "undefined") {
                            tripMap.setZoom(zoom);
                            tripMap.setCenter(position)
                        }
                        google.maps.event.clearListeners(tripMap, "idle")
                    });
                    mapLoaded = true
                } else {
                    if (currentLink.attr("data-position") != "global" || mapContainer.is(":hidden") && currentLink.attr("data-position") == "global") {
                        tripMap.setZoom(zoom);
                        tripMap.setCenter(position)
                    }
                }
            })
        })
    }();
    var liftOff = function(chronoMsg, expiryText, chronoContainer, chronoBt) {
        chronoMsg.text(expiryText);
        if (chronoContainer.hasClass("passenger-pending")) {
            chronoBt.hide()
        }
    };
    var displayCountdown = function() {
        $(".countdown").each(function() {
            var that = $(this),
                expiryDate = new Date(that.attr("data-date")),
                expiryText = that.attr("data-expiry"),
                chronoMsg = that.parent(),
                chronoContainer = chronoMsg.parent(),
                chronoBt = chronoContainer.find(".btn-base, .btn-validation");
            if (that.attr("data-format")) {
                var myLayout = "{hnn}{hl} {mnn}{ml} {snn}{sl}"
            } else {
                var myLayout = "{dn}{dl} {hnn}{hl} {mnn}{ml} {snn}{sl}"
            }
            that.countdown({
                until: expiryDate,
                compact: true,
                layout: myLayout,
                onExpiry: function() {
                    liftOff(chronoMsg, expiryText, chronoContainer, chronoBt)
                }
            });
            if (new Date > expiryDate) {
                liftOff(chronoMsg, expiryText, chronoContainer, chronoBt)
            }
        })
    }();
    $(".duplicate-publishing .btn-close").on("click", function() {
        $(this).closest(".duplicate-publishing").hide()
    });
    $(".return-publishing .btn-close").on("click", function() {
        $(this).closest(".return-publishing").hide()
    });
    $(".js-minlength, .cancel-passenger, .refuse-passenger").submit(function(ev) {
        var that = $(this),
            selectValue = that.find("select").val(),
            textarea = that.find("textarea"),
            textareaValue = $.trim(textarea.val()),
            alertSelect = that.find(".alert-select"),
            alertTextarea = that.find(".alert-textearea");
        if (selectValue == 0 && (textareaValue == "" || textareaValue.length < 10)) {
            ev.preventDefault();
            alertSelect.show();
            alertTextarea.show();
            textarea.val(textareaValue);
            return false
        }
        if (selectValue == 0) {
            ev.preventDefault();
            alertSelect.show();
            return false
        } else {
            alertSelect.hide()
        }
        if (textareaValue == "" || textareaValue.length < 10) {
            ev.preventDefault();
            alertTextarea.show();
            textarea.val(textareaValue);
            return false
        } else {
            alertTextarea.hide()
        }
        return true
    });
    $('a[href="#cancel-passenger"]').on("click", function() {
        $(".alert-select").hide();
        $(".alert-textearea").hide()
    });
    $('a[href="#refuse-passenger"]').on("click", function() {
        $(".alert-textearea").hide()
    });
    $('a[href="#drvr-noride"]').on("click", function() {
        $(".alert-select").hide();
        $(".alert-textearea").hide();
        $("#psgr-noride").html($(this).attr("data-psgr"))
    });
    var errorConfirm = function() {
        var error = $("#error-code-confirm");
        if (error.length) {
            var modal = $("#errorConfirm");
            modal.find(".error-code-confirm").html(error.html());
            modal.modal()
        }
    }();
    $("a.js-anchor[href*=#]:not([href=#])").on("click", function() {
        if (location.pathname.replace(/^\//, "") == this.pathname.replace(/^\//, "") && location.hostname == this.hostname) {
            var target = $(this.hash);
            target = target.length ? target : $("[name=" + this.hash.slice(1) + "]");
            if (target.length) {
                target.find("textarea").focus();
                $("html,body").animate({
                    scrollTop: target.offset().top
                }, 700);
                return false
            }
        }
    });
    $(".PublishComment-textarea").on("focus", function() {
        $(this).parent().addClass("PublishComment--focus")
    });
    $(".PublishComment-textarea").on("blur", function() {
        $(this).parent().removeClass("PublishComment--focus")
    })
});
var trip_details = function($) {
    function bindManagementButtons() {
        var $return = {
            btn: $(".btn-return-trip"),
            close: $(".return-trip-container .close"),
            container: $(".return-trip-container")
        };
        var $duplicate = {
            btn: $(".btn-duplicate-trip"),
            close: $(".duplicate-trip-container .close"),
            container: $(".duplicate-trip-container")
        };
        var binding = function($block1, $block2) {
            $block1.btn.on("click", function(event) {
                event.preventDefault();
                $block1.btn.toggleClass("active");
                $block2.btn.removeClass("active");
                $block1.container.toggleClass("active");
                $block2.container.removeClass("active")
            });
            $block1.close.on("click", function(event) {
                event.preventDefault();
                $block1.btn.removeClass("active");
                $block1.container.removeClass("active")
            })
        };
        binding($return, $duplicate);
        binding($duplicate, $return)
    }

    function trackingPhone(url, permanentId) {
        $('*[data-target="#telphone"]').on("click", function(event) {
            if ($("#telphone").hasClass("in")) {
                return
            }
            $.post(url, {
                permanent_id: permanentId
            }, function(data) {}, "json")
        })
    }
    return {
        init: function(data) {
            if ($(".trip-management-container").length) {
                bindManagementButtons()
            }
            if (!data["is_driver"]) {
                trackingPhone(data["tracking_phone"]["url"], data["tracking_phone"]["permanent_id"])
            }
        }
    }
}(jQuery);
window.login = function($) {
    function doInit() {
        var btnLoginDisplay = $(".js-login-display"),
            loginContent = $(".login-content");
        btnLoginDisplay.on("click", function(event) {
            event.preventDefault();
            loginContent.removeClass("elem-hide")
        })
    }
    return {
        init: function() {
            doInit()
        }
    }
}(jQuery);
var bbc = bbc || {};
bbc.loginForm = function() {
    "use strict";
    var self = {
            selector: "form#login-form .apply-btn-loader-ajax",
            targetElementSelector: ".site-menu",
            toolbarLoginStatusSelector: "#async_toolbar_logged",
            errorAlertSelector: "#login-failed-alert",
            timeout: 4e3
        },
        that = {};
    self.init = function() {
        $(self.selector).prepend('<img class="img-loader hide" src="/images/ajax-loader-blue.gif" alt="" />');
        $(self.selector).parents("form").on("submit", function(event) {
            var form = $(this);
            var button = $(self.selector);
            if (button.prop("disabled") === false) {
                bbc.buttonLoader.btnDisable(button);
                if (!button.attr("data-loader-locked")) {
                    bbc.buttonLoader.enableLater(button)
                }
            }
            event.preventDefault();
            $.ajax({
                type: form.attr("method"),
                url: form.attr("action"),
                dataType: "json",
                data: form.serialize(),
                async: true,
                timeout: self.timeout,
                success: function(data) {
                    $(self.targetElementSelector).html(data.site_menu);
                    if (self.isLogged()) {
                        $(self.targetElementSelector).addClass("logged")
                    }
                },
                error: function(xhr, textStatus) {
                    if (textStatus != "timeout") {
                        that.displayErrorMessage()
                    }
                },
                complete: function() {
                    bbc.buttonLoader.btnEnable(button)
                }
            });
            return true
        })
    };
    self.isLogged = function() {
        return $(self.toolbarLoginStatusSelector).length > 0
    };
    that.displayErrorMessage = function() {
        $(self.errorAlertSelector).removeClass("hide")
    };
    that.hideErrorMessage = function() {
        $(self.errorAlertSelector).addClass("hide")
    };
    self.init();
    return that
}();
window.contact = function($) {
    function doInit(alert_moderator_label, referer) {
        var $catFilterSelect = $("#contact_categoryFilter");
        var $originalCategorySelect = $("#contact_category");
        var $clonedCategorySelect = $originalCategorySelect.clone();
        $clonedCategorySelect.attr("id", "contact_category_hidden").attr("name", "").hide().appendTo($originalCategorySelect.parent());
        var updateCategorySelect = function() {
            var filter = $(this).val();
            if ("" === filter) {
                $originalCategorySelect.hide();
                return
            }
            $originalCategorySelect.find("> *").remove();
            var $emptySelect = $clonedCategorySelect.find('option[value=""]').clone();
            $emptySelect.appendTo($originalCategorySelect);
            $clonedCategorySelect.find('optgroup[label="' + filter + '"] option').each(function() {
                $(this).clone().appendTo($originalCategorySelect)
            });
            $originalCategorySelect.show()
        }.bind($catFilterSelect);
        $catFilterSelect.on("change", updateCategorySelect);
        updateCategorySelect();
        var catFilterSelection = $catFilterSelect.val();
        if (catFilterSelection) {
            var $el = $('.contact-radio-container .radio[data-input-id="' + catFilterSelection + '"]');
            $el.addClass("selected")
        }
        $(document).on("click", ".contact-radio-container .radio", function(event) {
            event.preventDefault();
            var $el = $(this);
            $catFilterSelect.val($el.attr("data-input-id"));
            $catFilterSelect.trigger("change");
            $el.parent().find(".radio").removeClass("selected");
            $el.addClass("selected")
        });
        var attachmentField = $("#contact_file").parent().parent();

        function ChangeAttachmentFieldVisibility() {
            var showAttachment = $("#contact_category").find("option:selected").data("attachment");
            if (showAttachment) {
                attachmentField.show()
            } else {
                attachmentField.hide()
            }
        }
        ChangeAttachmentFieldVisibility();
        var $faqResultsTagged = $("#faq-results-tagged");
        $(document).on("change", "#contact_category", function() {
            var url = $faqResultsTagged.attr("data-ajax-url");
            var data = {
                filter: $("#contact_categoryFilter").val(),
                context: $("#contact_category").val()
            };
            $faqResultsTagged.addClass("elem-visible");
            $faqResultsTagged.find("ul").slideUp(200);
            if (!data.context || !data.filter) {
                return
            }
            $.ajax({
                url: url,
                data: data
            }).done(function(data) {
                $faqResultsTagged.html(data);
                $faqResultsTagged.find("ul").hide().slideDown(200)
            });
            ChangeAttachmentFieldVisibility()
        });
        var $contactInputs = $(".contact-form").find('input[type="text"], input[type="email"], textarea'),
            $contactForm = $("#contact_form"),
            $contactFormContent = $("#contact-form-content"),
            $btnDisplayContactForm = $(".js-open-contact-form"),
            $btnDisplayContactFields = $("#contact_form .btn-contact-fields");
        $originalCategorySelect.on("change", function() {
            var $el = $(this);
            if (!$contactFormContent.hasClass("elem-visible")) {
                $btnDisplayContactFields.addClass("margin-top margin-bottom elem-visible")
            }
            if ("" !== $el.val()) {
                $contactInputs.removeAttr("disabled")
            } else {
                $contactInputs.attr("disabled", "disabled")
            }
        });
        if ("" === $originalCategorySelect.val()) {
            $contactInputs.attr("disabled", "disabled")
        }
        $(document).on("click", ".js-open-contact-form", function(evt) {
            evt.preventDefault();
            var $that = $(this);
            $that.parent().hide();
            $contactForm.addClass("elem-visible");
            $("html, body").animate({
                scrollTop: $contactForm.offset().top - 30
            }, 200)
        });
        $(document).on("click", "#contact_form .btn-contact-fields", function(evt) {
            evt.preventDefault();
            var $that = $(this);
            $that.removeClass("margin-top margin-bottom elem-visible");
            if ("" != $originalCategorySelect.val()) {
                $contactInputs.removeAttr("disabled")
            }
            $contactFormContent.addClass("elem-visible");
            $("html, body").animate({
                scrollTop: $contactFormContent.offset().top - 15
            }, 200)
        });
        $(document).on("submit", "#form-faq-search", function(evt) {
            if (!window.history.pushState) {
                return
            }
            evt.preventDefault();
            $btnDisplayContactForm.parent().show();
            $contactForm.removeClass("elem-visible");
            $faqResultsTagged.removeClass("elem-visible");
            $btnDisplayContactFields.removeClass("elem-visible");
            $contactFormContent.removeClass("margin-top margin-bottom elem-visible");
            $(".contact-radio-container .radio").removeClass("selected");
            $originalCategorySelect.hide();
            var $el = $(this);
            var data = $el.serialize();
            var url = $el.attr("data-ajax-url");
            var loadingHtml = $("#faq-results-loading-template").html();
            var $faqResults = $("#faq-results");
            $faqResults.html(loadingHtml);
            $.ajax({
                url: url,
                data: data
            }).always(function() {
                window.history.replaceState({}, "", "?" + data)
            }).done(function(data) {
                $faqResults.hide();
                $faqResults.html(data);
                $faqResults.slideDown()
            }).fail(function() {
                $faqResults.html("")
            })
        });
        var url = window.location.href,
            pieces = url.split("#");
        if ("contact-form-title" === pieces[1]) {
            $(".js-open-contact-form").click();
            $(".contact-radio-container button:last").click();
            $("#contact-form-content").addClass("elem-visible");
            $("#contact_category option").each(function(el, index) {
                if ($(this).text() == alert_moderator_label) {
                    $(this).prop("selected", true)
                }
            });
            $("#contact-form-content input, #contact-form-content textarea").prop("disabled", false)
        }
        $("#contact_file").change(function() {
            if (this.files.length === 0) return;
            var allowedTypes = ["gif", "png", "jpg", "jpeg", "pdf"],
                maxFileSize = 1024 * 1e3 * 5,
                fileExt = this.files[0].name.split(".").pop().toLowerCase(),
                fileSize = this.files[0].size;
            if ($.inArray(fileExt, allowedTypes) == -1) {
                alert($(this).data("msg-wrong-file"));
                this.value = "";
                return
            }
            if (fileSize > maxFileSize) {
                alert($(this).data("msg-too-big"));
                this.value = "";
                return
            }
        });
        $("#contact_site").val(referer)
    }
    return {
        init: function(alert_moderator_label, referer) {
            doInit(alert_moderator_label, referer)
        }
    }
}(jQuery);
window.blog = function($) {
    function doInit() {
        var blogHowToTabs = $("#booking-howto-nav a");
        blogHowToTabs.click(function(e) {
            e.preventDefault();
            $(this).tab("show")
        });
        if (blogHowToTabs.length) {
            var driverContent = $("#drvr-content"),
                passengerContent = $("#psgr-content"),
                blogBookingHash = window.location.hash;
            if (blogBookingHash == "#drvr") {
                blogHowToTabs.parent().removeClass("active");
                blogHowToTabs.eq(1).parent().addClass("active");
                passengerContent.removeClass("active");
                driverContent.addClass("active")
            }
        }
    }
    return {
        init: function() {
            doInit()
        }
    }
}(jQuery);
var tspSolver = function() {
    var Geo = function() {
        function degToRad(deg) {
            return deg * Math.PI / 180
        }

        function computeGreatCircleDistance(from, to, earthRadius) {
            if (earthRadius === undefined) {
                earthRadius = 6371
            }
            var fromLatitude = degToRad(from.latitude);
            var fromLongitude = degToRad(from.longitude);
            var toLatitude = degToRad(to.latitude);
            var toLongitude = degToRad(to.longitude);
            var a = Math.pow(Math.sin((toLatitude - fromLatitude) / 2), 2) + Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.pow(Math.sin((toLongitude - fromLongitude) / 2), 2);
            return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        }
        return {
            computeGreatCircleDistance: computeGreatCircleDistance
        }
    }();
    var Coordinates = function(latitude, longitude) {
        return {
            latitude: latitude,
            longitude: longitude
        }
    };
    var Place = function(name, coordinates) {
        function validate() {
            return typeof this.name === "string" && this.name.length > 0 && (typeof this.coordinates.latitude === "string" && this.coordinates.latitude.length > 0 || typeof this.coordinates.latitude === "number") && (typeof this.coordinates.longitude === "string" && this.coordinates.longitude.length > 0 || typeof this.coordinates.longitude === "number")
        }
        return {
            name: name,
            coordinates: coordinates,
            validate: validate
        }
    };

    function computeRouteDistance(from, to, stopovers) {
        var route = stopovers.slice();
        route.unshift(from);
        route.push(to);
        var distance = 0;
        for (var i = 0; i < route.length - 1; i++) {
            distance += Geo.computeGreatCircleDistance(route[i].coordinates, route[i + 1].coordinates)
        }
        return distance
    }

    function permute(arr, n, permutations) {
        if (n === undefined) {
            n = arr.length
        }
        if (permutations === undefined) {
            permutations = []
        }
        if (n === 1) {
            permutations.push(arr.slice())
        } else {
            for (var i = 0; i < n; i++) {
                permute(arr, n - 1, permutations);
                var j = 1;
                if (n % 2 !== 1) {
                    j = i
                }
                var temp = arr[j];
                arr[j] = arr[n - 1];
                arr[n - 1] = temp
            }
        }
        return permutations
    }

    function computeOptimalStopovers(from, to, stopovers) {
        var stopovers = stopovers.slice();
        var permutations = permute(stopovers);
        var optimalPermutation = null;
        var optimalDistance = Infinity;
        for (var permutationIndex in permutations) {
            var permutatedStopovers = permutations[permutationIndex];
            var distance = computeRouteDistance(from, to, permutatedStopovers);
            if (distance < optimalDistance) {
                optimalPermutation = permutatedStopovers;
                optimalDistance = distance
            }
        }
        return optimalPermutation
    }
    return {
        Coordinates: Coordinates,
        Place: Place,
        computeRouteDistance: computeRouteDistance,
        computeOptimalStopovers: computeOptimalStopovers
    }
}();
var publication = function($) {
    var $map1 = $("#map1");
    var $map2 = $("#map2");
    var defaultMaxStages = 6;
    var regularMaxStages = 2;
    var maxStages = defaultMaxStages;
    var originalSuggestions = [];

    function getFromLocation() {
        var name = $("input.from").attr("id").replace(new RegExp("_name$", "gm"), "");
        return getLocation("#" + name)
    }

    function getToLocation() {
        var name = $("input.to").attr("id").replace(new RegExp("_name$", "gm"), "");
        return getLocation("#" + name)
    }

    function getStopoversLocation() {
        var stopoversLocation = [];
        $(".stages-list > li .stage").each(function() {
            var name = $(this).attr("id").replace(new RegExp("_name$", "gm"), "");
            if ($("#" + name + "_name").length > 0) {
                var location = getLocation("#" + name);
                if (location) {
                    stopoversLocation.push({
                        location: location
                    })
                }
            }
        });
        return stopoversLocation
    }

    function getStopoverNamesToRemove() {
        var stopoverNames = [];
        $(".stages-list > li .stage").each(function() {
            var name = $(this).attr("id").replace(new RegExp("_name$", "gm"), "");
            var elem = $("#" + name + "_name");
            if (elem.length > 0) {
                stopoverNames.push(elem.val().toLowerCase())
            }
            if (elem.data("geo-location") && elem.data("geo-location").city.toString() != elem.val()) {
                stopoverNames.push(elem.data("geo-location").city.toString().toLowerCase())
            }
        });
        return stopoverNames
    }

    function getLocation(value) {
        var name = $(value + "_name").val();
        var latitude = $(value + "_coordinates_latitude").val();
        var longitude = $(value + "_coordinates_longitude").val();
        if (latitude && longitude) {
            latitude = parseFloat(latitude);
            longitude = parseFloat(longitude);
            return new google.maps.LatLng(latitude, longitude)
        }
        return name
    }

    function avoidHighways() {
        if ($(".highway-container input").length < 1) {
            return false
        }
        return !$(".highway-container input").is(":checked")
    }

    function updateMap(checkStopovers, forceStopOvers) {
        if (checkStopovers === undefined) {
            checkStopovers = true
        }
        forceStopOvers = forceStopOvers || false;
        if (checkStopovers) {
            stopoverOrderer.checkStopoverOrder(forceStopOvers)
        }
        $map1.gmap3({
            clear: {}
        });
        var from = getFromLocation();
        var to = getToLocation();
        var waypts = getStopoversLocation();
        if (from && to) {
            $map1.gmap3({
                getroute: {
                    options: {
                        origin: from,
                        destination: to,
                        waypoints: waypts,
                        avoidHighways: avoidHighways(),
                        travelMode: google.maps.DirectionsTravelMode.DRIVING
                    },
                    callback: function(results) {
                        if (!results) {
                            return
                        }
                        $map1.gmap3({
                            directionsrenderer: {
                                options: {
                                    directions: results
                                }
                            }
                        })
                    }
                }
            })
        } else if (from) {
            $map1.gmap3({
                marker: {
                    latLng: from
                }
            })
        } else if (to) {
            $map1.gmap3({
                marker: {
                    latLng: to
                }
            })
        }
    }

    function initMap() {
        $map1.gmap3({
            map: {
                options: {
                    center: [$map1.attr("data-latitude"), $map1.attr("data-longitude")],
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    streetViewControl: false,
                    zoom: 5,
                    mapTypeControl: false
                }
            }
        });
        $(".from").on("onPlaceChanged", function(evt, place) {
            updateMap();
            searchSuggestions();
            displayWarning(this, place)
        });
        $(".from").on("geocoded", function(evt, place) {
            updateMap();
            searchSuggestions();
            displayWarning(this, place)
        });
        $(".to").on("onPlaceChanged", function(evt, place) {
            updateMap();
            searchSuggestions();
            displayWarning(this, place)
        });
        $(".to").on("geocoded", function(evt, place) {
            updateMap();
            searchSuggestions();
            displayWarning(this, place)
        });
        $(document).on("onPlaceChanged, geocoded", ".stage", function() {
            displaySuggestions();
            updateMap()
        });
        $(".stage").on("onPlaceChanged", function() {
            displaySuggestions();
            updateMap()
        });
        $(".from").on("place_unset", function(evt, value) {
            if (!value) updateMap()
        });
        $(".to").on("place_unset", function(evt, value) {
            if (!value) updateMap()
        });
        $(document).on("place_unset", ".stage", function(evt, value) {
            displaySuggestions();
            if (!value) {
                updateMap()
            }
        });
        searchSuggestions()
    }

    function displayWarning(input, place) {
        if (typeof place !== "undefined" && place.types) {
            var allowedPlaceTypes = ["street_address", "street_number", "transit_station", "route", "neighborhood", "sublocality", "establishment"];
            var badType = true;
            var alertBlock = $(input).siblings("#alert-" + ($(input).hasClass("from") ? "from" : "to") + "-precision-level");
            for (var key in place.types) {
                if (allowedPlaceTypes.indexOf(place.types[key]) !== -1) {
                    badType = false
                }
            }
            if (badType) {
                alertBlock.removeClass("hide")
            } else if (!alertBlock.hasClass("hide")) {
                alertBlock.addClass("hide")
            }
            if ($(input).hasClass("from")) {
                var googleAutoCompleteDivs = $(".pac-container.hdpi:visible");
                googleAutoCompleteDivs.css("top", $("input.to").offset().top + $("input.to").outerHeight() + "px");
                $("input.to").focus()
            }
        }
    }

    function searchSuggestions() {
        var from = getFromLocation();
        var to = getToLocation();
        var $suggestionsBlock = $(".suggestions");
        var url = $suggestionsBlock.attr("data-url");
        if (!(from instanceof google.maps.LatLng) || !(to instanceof google.maps.LatLng)) {
            return
        }
        var params = ["from=" + from.lat() + "," + from.lng(), "to=" + to.lat() + "," + to.lng()];
        $.ajax({
            method: "GET",
            url: url + "?" + params.join("&")
        }).done(function(data) {
            originalSuggestions = data;
            displaySuggestions()
        })
    }

    function displaySuggestions() {
        var $suggestionsBlock = $(".suggestions");
        var $suggestionsTitle = $suggestionsBlock.find("p");
        var $suggestionsList = $suggestionsBlock.find(".suggestions-list");
        var labelsToRemove = getStopoverNamesToRemove();
        var filteredSuggestions = $.grep(originalSuggestions, function(suggestion) {
            return $.inArray(suggestion.label.toLowerCase(), labelsToRemove) === -1
        });
        $suggestionsList.empty();
        if (0 === filteredSuggestions.length) {
            $suggestionsTitle.hide();
            return
        }
        $suggestionsTitle.show();
        for (var i in filteredSuggestions) {
            var suggestion = filteredSuggestions[i];
            var $item = $("<a />").text(suggestion.label).attr("data-latitude", suggestion.latitude).attr("data-longitude", suggestion.longitude);
            $("<li />").append($item).appendTo($suggestionsList)
        }
    }

    function handleSuggestion() {
        $(document).on("click", ".suggestions .suggestions-list a", function(e) {
            e.preventDefault();
            var $item = $(this);
            var $stopoverItem = getEmptyStopover() || addStopover();
            if (!$stopoverItem) {
                return
            }
            var $inputText = $stopoverItem.find('input[type="text"]');
            var $inputLat = $stopoverItem.find('input[type="hidden"]:eq(0)');
            var $inputLng = $stopoverItem.find('input[type="hidden"]:eq(1)');
            $inputText.val($item.text());
            $inputLat.val($item.attr("data-latitude"));
            $inputLng.val($item.attr("data-longitude"));
            updateMap(true, true);
            $(this).closest("li").remove();
            var $suggestionsBlock = $(".suggestions");
            var $suggestionsTitle = $suggestionsBlock.find("p");
            var $suggestionsList = $suggestionsBlock.find(".suggestions-list");
            if ($suggestionsList.is(":empty")) {
                $suggestionsTitle.hide()
            }
            var $emptyStopover = $('ol.stages-list input[type="text"]').filter("[value=]");
            if ($emptyStopover.length < 1 && $suggestionsList.children().length > 0) {
                addStopover()
            }
        })
    }

    function initMap2() {
        var fromItem = $map2.find("li").first();
        var toItem = $map2.find("li").last();
        var stageItems = $map2.find("li").slice(1, -1);
        var from = [fromItem.attr("data-latitude"), fromItem.attr("data-longitude")];
        var to = [toItem.attr("data-latitude"), toItem.attr("data-longitude")];
        var freeway = "0" === $("#map2").attr("data-freeway") ? false : true;
        var waypts = [];
        for (var i = 0; i < stageItems.size(); i++) {
            var latitude = stageItems[i].getAttribute("data-latitude");
            var longitude = stageItems[i].getAttribute("data-longitude");
            waypts.push({
                location: new google.maps.LatLng(latitude, longitude)
            })
        }
        $map2.gmap3({
            map: {
                options: {
                    center: [$map2.attr("data-latitude"), $map2.attr("data-longitude")],
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    streetViewControl: false,
                    scrollwheel: false,
                    zoomControl: false,
                    mapTypeControl: false,
                    disableDoubleClickZoom: true,
                    zoom: 5
                }
            },
            getroute: {
                options: {
                    origin: from,
                    destination: to,
                    waypoints: waypts,
                    avoidHighways: !freeway,
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                },
                callback: function(results) {
                    if (!results) {
                        return
                    }
                    $(this).gmap3({
                        directionsrenderer: {
                            options: {
                                preserveViewport: false,
                                draggable: false,
                                directions: results
                            }
                        }
                    })
                }
            }
        })
    }

    function enableOrDisableDragAndDrop() {
        if ($(".stages-list .stage").size() > 1) {
            $(".move").removeClass("hide");
            $(".stages-list").sortable("enable")
        } else {
            $(".move").addClass("hide");
            $(".stages-list").sortable("disable")
        }
    }

    function doInit() {
        activeCollectionHandlers();
        itineraryManager.init();
        $(".stages-list").sortable({
            axis: "y",
            handle: ".move",
            disabled: true,
            update: function() {
                updateStopoverIndices();
                updateMap()
            }
        });
        enableOrDisableDragAndDrop()
    }

    function initStep1Navigation() {
        $("input.from").on("onPlaceChanged", function() {
            $("input.to").focus()
        });
        $(".departure-date input.date-picker").on("onSelect", function(e, strDate) {
            $(".return-date input.date-picker").datepicker("option", "minDate", $.datepicker.parseDate($(this).datepicker("option", "dateFormat"), strDate))
        })
    }

    function regularTrip() {
        $(".simple-round-choice").on("click", function() {
            var singleLabel = $(".simple-round-choice").attr("data-origin"),
                singleAltLabel = $(".simple-round-choice").attr("data-alt"),
                legendLabel = $(".legend-green-label").text();
            if (legendLabel !== singleAltLabel) {
                $(".legend-green-label").text(singleAltLabel)
            } else {
                $(".legend-green-label").text(singleLabel)
            }
        })
    }

    function chooseModal() {
        $('input[name="simple-choice"]').on("click", function() {
            $(".simple-choice-label").toggleClass("green-label")
        });
        $('input[name="round-choice"]').on("click", function() {
            $(".round-choice-label").toggleClass("blue-label")
        })
    }

    function activeCollectionHandlers() {
        var $collectionHolder = $("ol.stages-list");
        var $addButton = $collectionHolder.find(".stage-add");
        handleCollectionAddItem($collectionHolder, $addButton);
        handleCollectionRemoveItem()
    }

    function setMaxStages(value) {
        maxStages = +value
    }

    function displayStopoversAddButton(value) {
        if (typeof value === "undefined") {
            value = $("ol.stages-list .stage").size() < maxStages
        }
        $(".stage-add")[value ? "show" : "hide"]()
    }

    function handleCollectionAddItem($collectionHolder, $addButton) {
        displayStopoversAddButton();
        $addButton.on("click", function(e) {
            e.preventDefault();
            addStopover()
        })
    }

    function getEmptyStopover() {
        $inputs = $('ol.stages-list input[type="text"]');
        if (1 === $inputs.length && "" === $inputs.first().val()) {
            return $inputs.first().closest("li")
        }
        var $emptyStopover = $inputs.filter("[value=]");
        if ($emptyStopover.length === 0) {
            return null
        }
        return $emptyStopover.first().closest("li")
    }

    function addStopover() {
        var $collectionHolder = $("ol.stages-list");
        var $addButton = $collectionHolder.find(".stage-add");
        if ($("ol.stages-list .stage").size() >= maxStages) {
            $(".stage-add").hide();
            return
        }
        var prototype = $collectionHolder.attr("data-prototype");
        var newItem = prototype.replace(/__name__/g, $(".stages-list .stage").size());
        var $item = $("<li>" + newItem + "</li>");
        $collectionHolder.find("li:last-child").before($item);
        $item.find(".geo-autocomplete").completeLocation();
        $item.on("onPlaceChanged blur", function() {
            updateMap()
        });
        enableOrDisableDragAndDrop();
        if ($("ol.stages-list .stage").size() >= maxStages) {
            $(".stage-add").hide()
        }
        createQtips($(".tip", $item));
        return $item
    }

    function removeAllStopovers() {
        $(".stages-list .stage").each(function() {
            $(this).closest("li").remove()
        });
        $(".stages-list .stage-add").trigger("click");
        enableOrDisableDragAndDrop();
        displaySuggestions();
        updateMap();
        if ($("ol.stages-list .stage").size() >= maxStages) {
            $(".stage-add").hide()
        } else {
            $(".stage-add").show()
        }
    }

    function handleCollectionRemoveItem() {
        $(".stages-list").on("click", ".close", function(e) {
            e.preventDefault();
            var $item = $(this).closest("li");
            $item.find(".tip").qtip("destroy", true);
            $item.remove();
            updateStopoverIndices();
            enableOrDisableDragAndDrop();
            if ($("ol.stages-list .stage").size() < maxStages) {
                $(".stage-add").show()
            }
            displaySuggestions();
            updateMap()
        })
    }

    function inputNumber() {
        var $totalPriceInput = $("#total-price");
        var minTotalPrice = +$(".total-price-container").data("min-price");
        var minTotalPriceMessage = $(".total-price-container").data("min-price-message");
        var customQtip = function($input, text) {
            createQtip($input, {
                trigger: {
                    show: true
                },
                content: text,
                position: {
                    my: "right center",
                    at: "left center",
                    offsetX: 5,
                    offsetY: 0
                }
            });
            setTimeout(function() {
                $input.qtip("destroy", true);
                createQtip($input)
            }, 5e3)
        };
        var displayMinTotalPriceMessage = function() {
            customQtip($totalPriceInput, minTotalPriceMessage)
        };
        var validCallback = function($input, newValue) {
            var totalPrice = +$totalPriceInput.val();
            var oldValue = +$input.val();
            if (totalPrice < minTotalPrice) {
                return true
            }
            var newTotalPrice = totalPrice - oldValue + newValue;
            if (newTotalPrice >= minTotalPrice) {
                return true
            }
            displayMinTotalPriceMessage();
            return false
        };
        $(".input-price").inputNumber();
        $(".input-price").on("onNumberChanged", 'input[type="text"]', function() {
            var $input = $(this);
            var totalPrice = +$totalPriceInput.val();
            var inputValue = +$input.val();
            if (totalPrice < minTotalPrice) {
                var diff = minTotalPrice - totalPrice;
                var newValue = inputValue + diff;
                $input.val(newValue);
                $input.trigger("onNumberChanged", newValue);
                displayMinTotalPriceMessage()
            }
        });
        $(".seats-total").on("number_changed", 'input[type="text"]', function(event, data) {
            var warningValue = $(this).attr("data-value-warning");
            if (data.newValue >= warningValue && data.previousValue < warningValue) {
                $("#passengersWarningModal").modal()
            }
        })
    }

    function handlePriceChanged() {
        $(".publication-price-container input[data-range]").each(function() {
            setInputColor($(this))
        });
        $(".publication-price-container").on("onNumberChanged", "input[data-range]", function() {
            updateTotalPrice();
            setInputColor($(this))
        })
    }

    function setInputColor($input) {
        var $container = $input.closest(".publication-price-container");
        var rangeData = $input.data("range");
        var currentValue = +$input.val();
        var currentColor;
        var availableColors = [];
        var rangeStr, _i, _len;
        if (!rangeData) {
            return
        }
        var rangeStrList = $input.data("range").split("|");
        for (_i = 0, _len = rangeStrList.length; _i < _len; _i++) {
            rangeStr = rangeStrList[_i].split(":");
            var value = rangeStr[0],
                color = rangeStr[1];
            availableColors.push(color);
            if (currentValue >= value) {
                currentColor = color
            }
        }
        if (currentColor) {
            for (_i = 0, _len = availableColors.length; _i < _len; _i++) {
                var color = availableColors[_i];
                $container.removeClass("price-" + color)
            }
            $container.addClass("price-" + currentColor)
        }
    }

    function updateTotalPrice() {
        var totalPrice = 0;
        $(".price-stages-list input").each(function() {
            var value = +$(this).val();
            if (!isNaN(value)) {
                totalPrice += Math.floor(value)
            }
        });
        $totalPriceInput = $("#total-price");
        $totalPriceInput.val(totalPrice);
        setInputColor($totalPriceInput)
    }

    function handleFrequencyChanged() {
        var isRegularEdit = $("#is_edition").val();
        if ($("#new_publication_step1_frequency_0").length == 0 && !isRegularEdit) {
            return
        }
        $("#new_publication_step1_frequency_0, #new_publication_step1_frequency_1").on("change", function() {
            var isRegular = $(this).val() == "REGULAR";
            toggleDateAndTimeBlock(isRegular);
            setMaxStages(isRegular ? regularMaxStages : defaultMaxStages);
            removeAllStopovers()
        });
        var isRegular = $("#new_publication_step1_frequency_1").is(":checked");
        if (!isRegularEdit) {
            toggleDateAndTimeBlock(isRegular)
        }
        setMaxStages(isRegular || isRegularEdit ? regularMaxStages : defaultMaxStages)
    }

    function toggleDateAndTimeBlock(regular) {
        $("#publication-unique").toggle(!regular);
        $("#publication-regular").toggle(regular)
    }

    function updateRoundTripChanged() {
        if (true === $(".simple-round-container input.trip-mode").is(":checked")) {
            $(".js-return-container").show()
        } else {
            $(".js-return-container").hide()
        }
    }

    function handleRoundTripChanged() {
        $(".simple-round-container input.trip-mode").on("change", updateRoundTripChanged);
        updateRoundTripChanged()
    }

    function handleFreewayChanged() {
        $(".highway-container input").on("change", function() {
            updateMap(false)
        })
    }

    function updateCommentReturn() {
        var hide = $(".same-comments-container input[type=checkbox]").is(":checked");
        if (hide) {
            $("#new_publication_step2_comment_return").val($("#new_publication_step2_comment").val())
        }
        $(".comments-return-container").toggle(!hide)
    }

    function handleCommentReturn() {
        $(".trip-same-comment").on("change", updateCommentReturn);
        $("#new_publication_step2_comment").on("change keyup paste", function() {
            if ($(".same-comments-container input[type=checkbox]").is(":checked")) {
                $("#new_publication_step2_comment_return").val($(this).val())
            }
        });
        updateCommentReturn()
    }

    function toggleMoreInfos() {
        var $moreLink = $(".more-infos");
        $moreLink.on("click", function(event) {
            event.preventDefault();
            var $origin = $(this).attr("data-origin"),
                $alt = $(this).attr("data-alt"),
                $optionDelay = $(".expand-container .step3-manual-choice"),
                $expandContainer = $(this).closest(".expand-container"),
                $expandText = $expandContainer.find(".expand");
            if ($expandText.is(":visible") && !$(this).hasClass("single-use")) {
                $(this).text($origin);
                $expandText.hide();
                $(this).parents(".list-item-caret").removeClass("active")
            } else {
                $(this).text($alt);
                $expandText.show();
                $(this).parents(".list-item-caret").addClass("active")
            }
        })
    }

    function hideOptionnal() {
        var $typeBooking = $('input[type="radio"].hide-optionnal');
        var $optionnalBooking = $(".expand-optionnal");
        $typeBooking.on("click", function() {
            if ($optionnalBooking.is(":visible")) {
                $optionnalBooking.slideUp()
            }
        })
    }

    function hideTotalCoupon() {
        var $totalCoupon = $(".total-coupon-container");
        var $radio = $('input[type="radio"].hide-total');
        $($radio).on("click", function() {
            $totalCoupon.fadeOut()
        })
    }

    function showTotalCoupon() {
        var $totalCoupon = $(".total-coupon-container");
        var $radio = $('input[type="radio"].show-total');
        $($radio).on("click", function() {
            $totalCoupon.fadeIn()
        })
    }

    function uncheckPopin() {
        var $checkbox = $('input[type="checkbox"].uncheck-popin');
        $checkbox.on("click", function checked() {
            if ($checkbox.is(":checked")) {} else {
                $("#total-one-time").modal()
            }
        })
    }

    function totalCheck() {
        var $action = $(".check-total");
        $action.on("click", function() {
            $('input[type="checkbox"].uncheck-popin').attr("checked", true)
        })
    }

    function updateStopoverIndices() {
        var i = 0;
        $(".stages-list li").each(function() {
            $(this).children("input").each(function() {
                var id = $(this).attr("id");
                var name = $(this).attr("name");
                $(this).attr("id", id.replace(/stopovers_\d+_/, "stopovers_" + i + "_"));
                $(this).attr("name", name.replace(/\[stopovers\]\[\d+\]/, "[stopovers][" + i + "]"))
            });
            i++
        })
    }
    return {
        initStep1: function() {
            ensureGoogleMapLoaded(function() {
                handleFrequencyChanged();
                doInit();
                initMap();
                updateMap();
                initStep1Navigation();
                handleRoundTripChanged();
                handleFreewayChanged();
                regularTrip();
                chooseModal();
                handleSuggestion()
            })
        },
        initStep2: function() {
            ensureGoogleMapLoaded(function() {
                doInit();
                updateTotalPrice();
                inputNumber();
                handlePriceChanged();
                handleCommentReturn();
                initMap2()
            })
        },
        initStep3: function() {
            ensureGoogleMapLoaded(function() {
                doInit();
                toggleMoreInfos();
                uncheckPopin();
                hideOptionnal();
                hideTotalCoupon();
                showTotalCoupon();
                totalCheck();
                initMap2();
                new window.ConfirmationMode
            })
        },
        getEmptyStopover: getEmptyStopover,
        addStopover: addStopover,
        updateMap: updateMap,
        getFromLocation: getFromLocation,
        getToLocation: getToLocation,
        getStopoversLocation: getStopoversLocation,
        avoidHighways: avoidHighways,
        updateStopoverIndices: updateStopoverIndices
    }
}(jQuery);
var itineraryManager = {
    $btnAddWeekly: null,
    $btnAddSingle: null,
    init: function() {
        itineraryManager.$btnAddWeekly = $("#btnAddWeekly");
        itineraryManager.$btnAddSingle = $("#btnAddSingle");
        itineraryManager.bindEvents()
    },
    bindEvents: function() {
        itineraryManager.$btnAddSingle.on("click", function() {
            itineraryManager.addTripContainer(1);
            itineraryManager.updateForm();
            return false
        });
        itineraryManager.$btnAddWeekly.on("click", function() {
            itineraryManager.addTripContainer(itineraryManager.countRemaining());
            itineraryManager.showReminderTip("on");
            itineraryManager.updateForm();
            return false
        })
    },
    showReminderTip: function(action) {
        if (action == "on") $(".reminder-weekly").removeClass("hide");
        else $(".reminder-weekly").addClass("hide")
    },
    removeTripContainer: function(containerID) {
        $("#" + containerID).remove()
    },
    addTripContainer: function(count) {
        for (var i = 0; i < count; i++)
            if (count == 1) itineraryManager.cloneTripContainer("more-date");
            else itineraryManager.cloneTripContainer()
    },
    changeButtonText: function(buttonText, buttonID) {
        $("#" + buttonID + " span").text(buttonText)
    },
    toggleButton: function(toggleAction, button) {
        if (toggleAction.toLowerCase() == "hide") $(button).hide();
        else $(button).show()
    },
    updateForm: function() {
        var itemCount = itineraryManager.countTripContainers() - 1;
        if (itemCount >= 5) {
            var text = itineraryManager.$btnAddWeekly.attr("data-text-alt");
            text = text.replace("[count]", itineraryManager.countRemaining);
            itineraryManager.changeButtonText(text, itineraryManager.$btnAddWeekly.attr("id"))
        } else itineraryManager.changeButtonText(itineraryManager.$btnAddWeekly.attr("data-text"), itineraryManager.$btnAddWeekly.attr("id"));
        if (itemCount >= 10) {
            itineraryManager.toggleButton("hide", itineraryManager.$btnAddWeekly);
            itineraryManager.toggleButton("hide", itineraryManager.$btnAddSingle)
        } else {
            itineraryManager.toggleButton("show", itineraryManager.$btnAddWeekly);
            itineraryManager.toggleButton("show", itineraryManager.$btnAddSingle)
        }
        if (itemCount == 0) {
            itineraryManager.showReminderTip("off")
        }
    },
    cloneTripContainer: function(type) {
        $("#container-template").clone().appendTo("#trip-containers");
        var x = $("#container-template")[0];
        var _id = itineraryManager.countTripContainers() - 1;
        $(x).attr("id", "trip" + _id);
        $(x).find("#dep-date").attr("name", "dep-date-trip" + _id);
        $(x).find("#dep-hour").attr("name", "dep-hour-trip" + _id);
        $(x).find("#dep-min").attr("name", "dep-min-trip" + _id);
        $(x).find("#ret-date").attr("name", "ret-date-trip" + _id);
        $(x).find("#ret-hour").attr("name", "ret-hour-trip" + _id);
        $(x).find("#ret-min").attr("name", "ret-min-trip" + _id);
        if (type == "more-date") $(x).addClass("single-date");
        $(x).find("#btn-remove").on("click", function() {
            itineraryManager.removeTripContainer($(this).parent($("li.trip")).parent().attr("id"));
            itineraryManager.updateForm();
            return false
        });
        $(x).removeClass("hide")
    },
    countTripContainers: function() {
        return $(".trip").length
    },
    countRemaining: function() {
        var itemCount = itineraryManager.countTripContainers() - 1;
        var remainingItems = 0;
        var itemCountDivided = itemCount / 5;
        if (itemCountDivided < 1) remainingItems = 5 - itemCount;
        else remainingItems = 10 - itemCount;
        return remainingItems
    }
};
$(".reminder-weekly .close").on("click", function() {
    $(this).parent().addClass("hide")
});
(function(global) {
    "use strict";
    var ConfirmationMode = function() {
        this.mobileEnv = $("body").hasClass("mobile");
        this.editBookedTrip = $("#form-modify-trip").length;
        this.container = $(".publication-booking-form, .edit-trip-mode-block");
        this.radioButtons = $('input[type="radio"]', this.container);
        this.answerDelayExpand = $(".step3-manual-choice", this.container);
        this.answerDelaySelect = $("#publication_booking_answerDelay", this.container);
        this.radioButtonChecked = $('input[type="radio"]:checked', this.container);
        this.containerClassName = this.mobileEnv ? ".card" : ".radio-input-container";
        if (!this.editBookedTrip) {
            this.radioButtonChecked.parents(this.containerClassName).toggleClass("selected")
        }
        if ($("#publication_booking_bookingMode_0").is(":disabled")) {
            this.toggleAnswerDelayExpand()
        } else {
            this.initialize()
        }
    };
    ConfirmationMode.prototype.initialize = function() {
        this.radioButtons.on("change", this.switchOption.bind(this));
        this.answerDelaySelect.on("change", function() {
            if (this.mobileEnv && !this.answerDelaySelect.parents(".selected").length) {
                this.switchOption();
                $("#publication_booking_bookingMode_1").prop("checked", true)
            }
        }.bind(this));
        this.defaultState()
    };
    ConfirmationMode.prototype.defaultState = function() {
        if (!this.mobileEnv && $("#publication_booking_bookingMode_1").is(":checked") || this.editBookedTrip && $("#publication_driver_modify_bookingMode_1").is(":checked")) {
            this.toggleAnswerDelayExpand()
        }
    };
    ConfirmationMode.prototype.toggleAnswerDelayExpand = function() {
        if (!this.mobileEnv) {
            this.answerDelayExpand.toggle()
        }
    };
    ConfirmationMode.prototype.switchOption = function() {
        this.toggleSelectedClass();
        this.toggleAnswerDelayExpand()
    };
    ConfirmationMode.prototype.toggleSelectedClass = function() {
        if (!this.editBookedTrip) {
            this.radioButtons.parents(this.containerClassName).toggleClass("selected")
        }
    };
    global.ConfirmationMode = ConfirmationMode
})(window);
var stopoverOrderer = function() {
    var map = $("#map1");
    var alertSelector = "#alert_stopover_order";
    var sortButtonSelector = "#sort_stopovers";
    var distanceRatio = 1.3;
    var maxStopovers = 6;

    function getPlaceFromElementIdPrefix(idPrefix) {
        var name = $("#" + idPrefix + "_name").val();
        var latitude = $("#" + idPrefix + "_coordinates_latitude").val();
        var longitude = $("#" + idPrefix + "_coordinates_longitude").val();
        return new tspSolver.Place(name, new tspSolver.Coordinates(latitude, longitude))
    }

    function getFromPlace() {
        var idPrefix = $("input.from").attr("id").replace(new RegExp("_name$", "gm"), "");
        return getPlaceFromElementIdPrefix(idPrefix)
    }

    function getToPlace() {
        var idPrefix = $("input.to").attr("id").replace(new RegExp("_name$", "gm"), "");
        return getPlaceFromElementIdPrefix(idPrefix)
    }

    function getStopoverPlaces() {
        var stopovers = [];
        $(".stages-list .stage").each(function() {
            var idPrefix = $(this).attr("id").replace(new RegExp("_name$", "gm"), "");
            var place = getPlaceFromElementIdPrefix(idPrefix);
            if (place && place.validate()) {
                stopovers.push(place)
            }
        });
        return stopovers
    }

    function showStopoverAlert(onClickCallback) {
        $(sortButtonSelector).unbind("click").click(function() {
            onClickCallback();
            $(alertSelector).hide()
        });
        $(alertSelector).show()
    }

    function changeStopovers(places, refreshMap) {
        if (refreshMap === undefined) {
            refreshMap = true
        }
        $(".stages-list .stage").each(function() {
            $(this).closest("li").remove()
        });
        for (var placeIndex in places) {
            var place = places[placeIndex];
            var stopoverItem = publication.getEmptyStopover() || publication.addStopover();
            if (!stopoverItem) {
                break
            }
            stopoverItem.find('input[type="text"]').val(place.name);
            stopoverItem.find('input[type="hidden"]:eq(0)').val(place.coordinates.latitude);
            stopoverItem.find('input[type="hidden"]:eq(1)').val(place.coordinates.longitude)
        }
        publication.updateStopoverIndices();
        if (refreshMap) {
            publication.updateMap(true, true)
        }
    }

    function optimizeWaypoints(forceStopOvers) {
        var from = publication.getFromLocation();
        var to = publication.getToLocation();
        var waypoints = publication.getStopoversLocation();
        var currentStopovers = getStopoverPlaces();
        forceStopOvers = forceStopOvers || false;
        if (!from || !to) {
            return
        }
        map.gmap3({
            getroute: {
                options: {
                    origin: from,
                    destination: to,
                    waypoints: waypoints,
                    optimizeWaypoints: true,
                    avoidHighways: publication.avoidHighways(),
                    travelMode: google.maps.DirectionsTravelMode.DRIVING
                },
                callback: function(results) {
                    if (!results) {
                        return
                    }
                    var waypointOrder = results.routes[0].waypoint_order;
                    if (waypointOrder === undefined || currentStopovers.length !== waypointOrder.length) {
                        return
                    }
                    var alreadyOrdered = true;
                    var orderedStopovers = [];
                    for (var i = 0; i < waypointOrder.length; i++) {
                        if (waypointOrder[i] !== i) {
                            alreadyOrdered = false
                        }
                        orderedStopovers.push(currentStopovers[waypointOrder[i]])
                    }
                    if (alreadyOrdered) {
                        return
                    }
                    if (forceStopOvers) {
                        setTimeout(function() {
                            refreshAfterOptimize(map, orderedStopovers, results)
                        }, 500)
                    } else {
                        showStopoverAlert(function() {
                            refreshAfterOptimize(map, orderedStopovers, results)
                        })
                    }
                }
            }
        })
    }

    function refreshAfterOptimize(map, orderedStopovers, results) {
        changeStopovers(orderedStopovers, false);
        map.gmap3({
            clear: {}
        });
        map.gmap3({
            directionsrenderer: {
                options: {
                    directions: results
                }
            }
        })
    }

    function checkStopoverOrder(forceStopOvers) {
        forceStopOvers = forceStopOvers || false;
        $(alertSelector).hide();
        var from = getFromPlace();
        var to = getToPlace();
        if (!from || !to || !from.validate() || !to.validate()) {
            return
        }
        var currentStopovers = getStopoverPlaces();
        var countStopovers = currentStopovers.length;
        if (countStopovers < 2 || countStopovers > maxStopovers) {
            return
        }
        var optimalStopovers = tspSolver.computeOptimalStopovers(from, to, currentStopovers);
        var currentDistance = tspSolver.computeRouteDistance(from, to, currentStopovers);
        var optimalDistance = tspSolver.computeRouteDistance(from, to, optimalStopovers);
        if (optimalDistance > 0 && currentDistance / optimalDistance >= distanceRatio) {
            if (forceStopOvers) {
                changeStopovers(optimalStopovers)
            } else {
                showStopoverAlert(function() {
                    changeStopovers(optimalStopovers)
                })
            }
        } else if (optimalDistance > 0 && currentDistance / optimalDistance > 1) {
            optimizeWaypoints(forceStopOvers)
        }
    }
    return {
        checkStopoverOrder: checkStopoverOrder
    }
}();
window.funnelPublication = function($, window, undefined) {
    var seatCount = {
        val: function() {
            return $(".js-seatCount-trigger").val()
        },
        set: function(value) {
            $(".seat-placeholder").text(value);
            pricePerPassenger.update();
            var $listSeats = $(".list-seats-available").html("");
            var liPrototype = $listSeats.data("prototype");
            for (var i = seatCount.val() - 1; i >= 0; i--) {
                $listSeats.append(liPrototype)
            }
        },
        update: function() {
            this.set(this.val())
        }
    };
    var price = {
        val: function() {
            return $(".js-price-trigger").val()
        },
        set: function(value, format) {
            $(".js-price-placeholder").text(format.replace("%value%", value));
            pricePerPassenger.update()
        },
        update: function() {
            this.set(this.val(), $(".js-price-trigger").data("price-format"))
        }
    };
    var pricePerPassenger = {
        val: function() {
            return Math.max(1, Math.round(price.val() / seatCount.val()))
        },
        set: function(value, format) {
            $(".js-price-passenger").text(format.replace("%value%", value))
        },
        update: function() {
            this.set(this.val(), $(".js-price-trigger").data("price-format"))
        }
    };
    var time = {
        hours: function() {
            return $("#publication_step1_from_date_time_hour option:selected").text()
        },
        minutes: function() {
            return $("#publication_step1_from_date_time_minute option:selected").text()
        },
        set: function(hours, minutes) {
            if ("" == hours || "" == minutes) {
                $(".hour-container").text("")
            }
            $(".hour-container").text(hours + ":" + minutes)
        },
        update: function() {
            this.set(this.hours(), this.minutes())
        }
    };
    var handleEvents = function() {
        $(".js-seatCount-trigger").on("onNumberChanged", function() {
            seatCount.update()
        });
        $(".js-price-trigger").on("onNumberChanged", function() {
            price.update()
        });
        $("#publication_step1_from_date_time_hour, #publication_step1_from_date_time_minute").on("change", function() {
            time.update()
        })
    };
    return {
        init: function() {
            handleEvents()
        }
    }
}(jQuery, window);
window.funnel = function($, window, undefined) {
    function Price(value, format) {
        this.value = value;
        this.format = format
    }
    Price.prototype.toString = function() {
        return this.format.replace("123", this.value)
    };
    var parameters = {
        departureInput: "#funnel_publication_departurePlace_name",
        arrivalInput: "#funnel_publication_arrivalPlace_name",
        stopoverInputs: '#stopovers-collection li input[type="text"]',
        $departureInput: null,
        $arrivalInput: null,
        $stopoverInputs: null,
        stopoversHolder: null,
        map: null
    };
    var binder;
    var _initParameters = function() {
        binder = new Binder({
            suggestedPrice: null,
            passengerCount: parseInt($("#funnel_publication_seatCount").val(), 10),
            price: null,
            departurePlace: null,
            arrivalPlace: null,
            stopovers: [],
            departureDate: null,
            departureHour: null,
            departureMinute: null,
            departureTime: function(binder) {
                var hour = binder.get("departureHour");
                var min = binder.get("departureMinute");
                if (null === hour || null === min) {
                    return null
                }
                hour = ("0" + hour).slice(-2);
                min = ("0" + min).slice(-2);
                return hour + ":" + min
            },
            isRoundTrip: $("#funnel_publication_roundTrip").is(":checked"),
            departureDateDay: function(binder) {
                if (!binder.get("departureDate")) return null;
                return $.datepicker.formatDate("d", binder.get("departureDate"))
            },
            departureDateMonth: function(binder) {
                if (!binder.get("departureDate")) return null;
                return $.datepicker.formatDate("M", binder.get("departureDate"))
            },
            totalPrice: function(binder) {
                var count = binder.get("passengerCount");
                var price = binder.get("price");
                return price && count ? new Price(count * price.value, window.BLABLACAR_PRICE_FORMAT) : null
            },
            showPreview: function(binder) {
                return binder.get("departurePlace") && binder.get("arrivalPlace") && binder.get("departureDate") && binder.get("price")
            }
        });
        parameters.$departureInput = $(parameters.departureInput);
        parameters.$arrivalInput = $(parameters.arrivalInput);
        parameters.$stopoverInputs = $(parameters.stopoverInputs);
        parameters.stopoversHolder = new CollectionHolder("#stopovers-collection", {
            addItemCallback: function(el) {
                $(el).find(".geo-autocomplete").completeLocation()
            },
            maxItemCount: 7
        });
        parameters.map = $("#ride-map").length > 0 ? new RideMap("#ride-map") : _getNullRideMap()
    };
    var _getNullRideMap = function() {
        var nullRideMap = {};
        var setMethod = function(i, m) {
            if (typeof m == "function") {
                nullRideMap[i] = function() {
                    return nullRideMap
                }
            }
        };
        for (var i in RideMap) {
            setMethod(i, RideMap[i])
        }
        for (var i in RideMap.prototype) {
            setMethod(i, RideMap.prototype[i])
        }
        return nullRideMap
    };
    var _initEventHandler = function() {
        var geocoder = new google.maps.Geocoder;
        parameters.$departureInput.on("place_changed geocoded", function(evt, place) {
            _updateMap();
            _updatePrice();
            displayWarning(this, place)
        });
        parameters.$departureInput.trigger("focus");
        parameters.$arrivalInput.on("place_changed geocoded", function(evt, place) {
            _updateMap();
            _updatePrice();
            displayWarning(this, place)
        });
        $(document).on("place_changed geocoded", parameters.stopoverInputs, function(evt) {
            _updateMap()
        });
        parameters.$departureInput.on("place_unset", function(evt, value) {
            if (!value) _updateMap()
        });
        parameters.$arrivalInput.on("place_unset", function(evt, value) {
            if (!value) _updateMap()
        });
        $(document).on("place_unset", parameters.stopoverInputs, function(evt, value) {
            if (!value) _updateMap()
        });
        $(document).on("remove_item", "#stopovers-collection", function(evt) {
            _updateMap()
        });
        $(".seats-total").on("number_changed", 'input[type="text"]', function(event, data) {
            var warningValue = $(this).attr("data-value-warning");
            if (data.newValue >= warningValue && data.previousValue < warningValue) {
                $("#passengersWarningModal").modal()
            }
        });
        $(".js-seatCount-trigger").on("onNumberChanged", function(evt, count) {
            binder.set("passengerCount", count)
        });
        $(".js-price-trigger").on("onNumberChanged", function(evt, value) {
            binder.set("price", new Price(value, window.BLABLACAR_PRICE_FORMAT))
        });
        $("#funnel_publication_departureDate_date").on("onSelect", function(e, strDate) {
            _updateDate()
        });

        function updateRoundTripMode() {
            var isRoundTrip = $("#funnel_publication_roundTrip").is(":checked");
            var inputs = ["#funnel_publication_returnDate_date", "#funnel_publication_returnDate_time_hour", "#funnel_publication_returnDate_time_minute"];
            binder.set("isRoundTrip", isRoundTrip);
            if (isRoundTrip) {
                $.each(inputs, function(index, value) {
                    $(value).removeAttr("disabled")
                })
            } else {
                $.each(inputs, function(index, value) {
                    $(value).attr("disabled", "disabled")
                })
            }
        }
        updateRoundTripMode();
        $("#funnel_publication_roundTrip").on("change", updateRoundTripMode);
        _updateDate();

        function updateTime() {
            var value, selectedHour = null,
                selectedMinute = null;
            value = $("#funnel_publication_departureDate_time_hour").val();
            if (value) selectedHour = value;
            value = $("#funnel_publication_departureDate_time_minute").val();
            if (value) selectedMinute = value;
            binder.set("departureHour", selectedHour);
            binder.set("departureMinute", selectedMinute)
        }
        updateTime();
        $("#funnel_publication_departureDate_time_hour, #funnel_publication_departureDate_time_minute").on("change", function(e) {
            updateTime()
        })
    };

    function _updateMap() {
        var departurePlace = parameters.$departureInput.data("geo-location");
        var arrivalPlace = parameters.$arrivalInput.data("geo-location");
        var departureText = parameters.$departureInput.val();
        var arrivalText = parameters.$arrivalInput.val();
        if (departurePlace && departureText) {
            binder.set("departurePlace", departureText)
        }
        if (arrivalPlace && arrivalText) {
            binder.set("arrivalPlace", arrivalText)
        }
        parameters.map.setDeparture(departurePlace).setArrival(arrivalPlace);
        var stopovers = [];
        parameters.$stopoverInputs = $(parameters.stopoverInputs);
        parameters.map.setStopovers([]);
        for (var i = 0, n = parameters.$stopoverInputs.length; i < n; i++) {
            var geoLocation = $(parameters.$stopoverInputs.get(i)).data("geo-location");
            if (geoLocation) {
                parameters.map.addStopover(geoLocation);
                stopovers.push(geoLocation.name)
            }
        }
        binder.set("stopovers", stopovers);
        parameters.map.refreshView()
    }

    function displayWarning(input, place) {
        if (typeof place !== "undefined" && place.types) {
            var allowedPlaceTypes = ["street_address", "street_number", "transit_station", "route", "neighborhood", "sublocality"];
            var badType = true;
            var alertBlock = $(input).siblings("#alert-" + ($(input).hasClass("from") ? "from" : "to") + "-precision-level");
            for (var key in place.types) {
                if (allowedPlaceTypes.indexOf(place.types[key]) !== -1) {
                    badType = false
                }
            }
            if (badType) {
                alertBlock.removeClass("hide")
            } else if (!alertBlock.hasClass("hide")) {
                alertBlock.addClass("hide")
            }
            if ($(input).hasClass("from")) {
                var googleAutoCompleteDivs = $(".pac-container.hdpi:visible");
                googleAutoCompleteDivs.css("top", $("input.to").offset().top + $("input.to").outerHeight() + "px");
                $("input.to").focus()
            }
        }
    }

    function _updatePrice() {
        var departure = parameters.$departureInput.data("geo-location");
        var arrival = parameters.$arrivalInput.data("geo-location");
        if (!departure || !arrival) {
            return
        }
        $.ajax({
            url: $("#saving-block").data("url"),
            dataType: "json",
            data: {
                departure: departure.coordinates.toString(),
                arrival: arrival.coordinates.toString()
            },
            success: function(data) {
                if (data.error) {
                    return
                }
                var suggestedPrice = parseInt(data.suggested_price);
                var maxPrice = parseInt(data.max_price);
                var minPrice = parseInt(data.min_price);
                binder.set("price", new Price(suggestedPrice, window.BLABLACAR_PRICE_FORMAT));
                binder.set("suggestedPrice", new Price(suggestedPrice, window.BLABLACAR_PRICE_FORMAT));
                $(".js-price-trigger").val(suggestedPrice);
                $(".js-totalPrice").data("number-max", maxPrice);
                $(".js-totalPrice").data("number-min", minPrice);
                $(".js-totalPrice").data("number-default", suggestedPrice);
                $(".js-totalPrice").inputNumber()
            }
        })
    }

    function _updateDate() {
        var $el = $("#funnel_publication_departureDate_date");
        var strDate = $el.val();
        if (!strDate) {
            return
        }
        var date = $.datepicker.parseDate($el.datepicker("option", "dateFormat"), strDate);
        $("#funnel_publication_returnDate_date").datepicker("option", "minDate", date);
        binder.set("departureDate", new Date(date))
    }
    return {
        init: function() {
            ensureGoogleMapLoaded(function() {
                _initParameters();
                _initEventHandler()
            })
        }
    }
}(jQuery, window);
var Blablacar = Blablacar || {};
(function(Blablacar, $) {
    Blablacar.ProfilePicture = {
        App: {},
        Views: {}
    };
    Blablacar.ProfilePicture.App = {
        start: function(options) {
            this.options = options;
            Blablacar.ProfilePicture.Views.uploadForm.init();
            Blablacar.ProfilePicture.Views.editZone.init();
            Blablacar.ProfilePicture.Views.preview.init()
        }
    };
    Blablacar.ProfilePicture.Views.uploadForm = {
        el: "#profile_picture_upload_form",
        init: function() {
            this.$el = $(this.el);
            this._bindEvents()
        },
        updateImageData: function(data) {
            this.$el.find("#profile_picture_editedPicture").val(data)
        },
        isCanvasSupported: function() {
            var elem = document.createElement("canvas");
            return !!(elem.getContext && elem.getContext("2d"))
        },
        isLegacyIE: function() {
            return $.browser.msie && parseInt($.browser.version) < 10
        },
        _bindEvents: function() {
            if (false === Blablacar.ProfilePicture.App.options.cropping) return;
            if (!this.isCanvasSupported()) return;
            if (this.isLegacyIE()) return;
            this.$el.find('input[type="file"]').on("change", function(evt) {
                Blablacar.ProfilePicture.Views.editZone.removePicture();
                Blablacar.ProfilePicture.Views.preview.refresh();
                if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
                    return
                }
                var file = evt.target.files[0];
                if (!file) return;
                var reader = new FileReader;
                reader.onload = function(evt) {
                    Blablacar.ProfilePicture.Views.editZone.loadPicture(evt.target.result)
                };
                reader.onerror = function(evt) {};
                reader.readAsDataURL(file)
            });
            this.$el.on("click", '[data-dismiss="fileupload"]', function(evt) {
                Blablacar.ProfilePicture.Views.editZone.removePicture();
                Blablacar.ProfilePicture.Views.preview.refresh()
            })
        }
    };
    Blablacar.ProfilePicture.Views.editZone = {
        el: "#profile_picture_edit",
        init: function() {
            this.$el = $(this.el);
            this._bindEvents()
        },
        loadPicture: function(data) {
            var _this = this;
            this.$el.addClass("preview-mode");
            var image = document.createElement("img");
            $(image).one("load", function() {
                _this.$el.find(".edit-zone--image").append(image);
                _this._initDarkroom(image)
            });
            image.src = data;
            $("html,body").animate({
                scrollTop: Blablacar.ProfilePicture.Views.preview.$el.offset().top - 10
            }, 500)
        },
        removePicture: function() {
            this.$el.removeClass("preview-mode");
            this.$el.find(".edit-zone--image").html("");
            if (this.darkroom) this.darkroom = null
        },
        _bindEvents: function() {
            var _this = this;
            _this.$el.find(".js-rotate-left").on("click", function() {
                if (!_this.darkroom) return;
                _this.darkroom.plugins.rotate.rotateLeft()
            });
            _this.$el.find(".js-rotate-right").on("click", function() {
                if (!_this.darkroom) return;
                _this.darkroom.plugins.rotate.rotateRight()
            })
        },
        _initDarkroom: function(imageEl) {
            var _this = this;
            if (imageEl.width > 50 && imageEl.height > 50) {
                var width = Math.min(imageEl.width, 490);
                var height = Math.min(imageEl.height, 490);
                selection = [60, 60, width - 60 * 2, height - 60 * 2]
            }
            this.darkroom = new Darkroom(imageEl, {
                minWidth: 100,
                minHeight: 100,
                maxWidth: 490,
                maxHeight: 490,
                plugins: {
                    crop: {
                        ratio: 1,
                        minHeight: 50
                    },
                    history: false,
                    save: false
                },
                init: function() {
                    var dkrm = this;
                    dkrm.plugins.crop.requireFocus();
                    var updatePreview = function() {
                        var data = _this._getImageData();
                        Blablacar.ProfilePicture.Views.uploadForm.updateImageData(data);
                        Blablacar.ProfilePicture.Views.preview.refresh(data)
                    };
                    var selectCrop = function() {
                        dkrm.plugins.crop.requireFocus();
                        var width = dkrm.canvas.getWidth();
                        var height = dkrm.canvas.getHeight();
                        var margin = 50;
                        if (width < 100 || height < 100) margin = 10;
                        var cropSide = Math.min(width - margin * 2, height - margin * 2);
                        dkrm.plugins.crop.selectZone((width - cropSide) / 2, (height - cropSide) / 2, cropSide, cropSide)
                    };
                    this.addEventListener("image:change", updatePreview);
                    this.addEventListener("crop:update", updatePreview);
                    this.addEventListener("image:change", selectCrop);
                    selectCrop()
                }
            })
        },
        _getImageData: function() {
            var data, dkrm = Blablacar.ProfilePicture.Views.editZone.darkroom;
            if (!dkrm) {
                return
            }
            var cropZone = dkrm.plugins.crop.cropZone;
            if (cropZone && cropZone.width > 1 && cropZone.height > 1) {
                data = dkrm.image.toDataURL({
                    left: cropZone.getLeft(),
                    top: cropZone.getTop(),
                    width: cropZone.getWidth(),
                    height: cropZone.getHeight()
                })
            } else {
                data = dkrm.image.toDataURL()
            }
            return data
        }
    };
    Blablacar.ProfilePicture.Views.preview = {
        el: "#profile_picture_preview",
        init: function() {
            this.$el = $(this.el);
            this.imagePreview = this.$el.find("img").get(0);
            this.initialImageUrl = this.imagePreview.getAttribute("src")
        },
        refresh: function(data) {
            if (!data) {
                this.imagePreview.src = this.initialImageUrl;
                return
            }
            this.imagePreview.src = data
        }
    }
})(Blablacar || {}, jQuery);
var Blablacar = Blablacar || {};
Blablacar.profileRedirect = function($) {
    function doInit() {
        var redirectOption = getUrlParameter("redirect_option") || "",
            $addressForm = $(".profile-form");
        if (redirectOption) {
            var $targetPath = $('<input type="hidden" name="redirect_option"/>').val(redirectOption);
            $addressForm.append($targetPath)
        }

        function getUrlParameter(sParam) {
            var sPageURL = window.location.search.substring(1);
            var sURLVariables = sPageURL.split("?");
            for (var i = 0; i < sURLVariables.length; i++) {
                var sParameterName = sURLVariables[i].split("=");
                if (sParameterName[0] == sParam) {
                    return sParameterName[1]
                }
            }
        }
    }
    return {
        init: function() {
            doInit()
        }
    }
}(jQuery);
var Blablacar = Blablacar || {};
(function(Blablacar, $) {
    Blablacar.AlertForm = {
        init: function() {
            $("body").on("submit", "form#alert_form", function(event) {
                event.preventDefault();
                var form = $(this),
                    button = form.find(".apply-btn-loader-ajax");
                if (button.prop("disabled") === false) {
                    bbc.buttonLoader.btnDisable(button);
                    bbc.buttonLoader.enableLater(button);
                    $.ajax({
                        url: form.data("ajax-url"),
                        data: form.serialize(),
                        type: form.attr("method"),
                        success: function(data) {
                            $(".trip-alert-form-container").replaceWith(data);
                            bbc.initDatePicker($("#alert_beginAt"))
                        },
                        error: function(jqXHR, textStatus, errorThrown) {
                            if (jqXHR.status && jqXHR.status == 409 && jqXHR.responseText) {
                                $(".trip-alert-form-container").replaceWith(jqXHR.responseText);
                                bbc.initDatePicker($("#alert_beginAt"))
                            }
                        },
                        complete: function() {
                            bbc.buttonLoader.btnEnable(button)
                        },
                        statusCode: {
                            201: function onAlertCreated() {
                                var trip_alert_form_container = $(".trip-alert-form-container");
                                trip_alert_form_container.addClass("alert-created");
                                dataLayer.push({
                                    "trip_search_alert.from": trip_alert_form_container.data("tripSearchAlertFrom")
                                });
                                dataLayer.push({
                                    "trip_search_alert.to": trip_alert_form_container.data("tripSearchAlertTo")
                                });
                                dataLayer.push({
                                    event: trip_alert_form_container.data("event")
                                });
                                var modal = $("#trip-alert-create-step2");
                                var buttonFavoriteRoute = modal.find(".btn-2action-2");
                                buttonFavoriteRoute.click(function() {
                                    if (button.prop("disabled") === false) {
                                        bbc.buttonLoader.btnDisable(buttonFavoriteRoute);
                                        bbc.buttonLoader.enableLater(buttonFavoriteRoute);
                                        $.ajax({
                                            url: $(this).attr("href"),
                                            type: "GET",
                                            dataType: "html",
                                            success: function(data, textStatus, jqXHR) {
                                                if (jqXHR.status && jqXHR.status == 201) {
                                                    $(".trip-alert-form-container .trip-alert-msg-success").html(data)
                                                }
                                            },
                                            error: function(jqXHR, textStatus, errorThrown) {
                                                if (jqXHR.status && jqXHR.status == 409 && jqXHR.responseText) {
                                                    $(".trip-alert-form-container .trip-alert-msg-success").html(jqXHR.responseText)
                                                }
                                            },
                                            complete: function() {
                                                bbc.buttonLoader.btnEnable(buttonFavoriteRoute);
                                                modal.modal("hide")
                                            }
                                        })
                                    }
                                    return false
                                });
                                modal.modal()
                            }
                        }
                    })
                }
            })
        }
    }
})(Blablacar || {}, jQuery);
$(function() {
    if (bbc.isTripSearch) return;
    var self = {};
    bbc.slider(function($form) {
        $form.submit()
    });
    $("#simple_search_from_name").on("onPlaceChanged", function focusNext() {
        $("#simple_search_to_name").focus()
    });
    $("#simple_search_to_name").on("onPlaceChanged", function focusNext() {
        if ($("#simple_search_dateBegin")) {
            $("#simple_search_dateBegin").focus()
        }
    });
    bbc.datepicker(function($form) {
        $form.submit()
    });
    Blablacar.AlertForm.init()
});
var bbc = bbc || {};
bbc.favoriteRouteBlock = function($block, $modal) {
    "use strict";
    var self = {};
    self.initSwitchStatus = function() {
        $block.on("click", ".enable-regular-alert, .disable-regular-alert", function(event) {
            var $this = $(this);
            event.preventDefault();
            if ($this.hasClass("active")) {
                return
            }
            if ($this.hasClass("disable-regular-alert")) {
                self.handleModal($this);
                return
            }
            self.switchStatus($this)
        })
    };
    self.switchStatus = function($buttonSwitch) {
        $.post($buttonSwitch.parent().attr("data-url"), {
            status: $buttonSwitch.attr("data-value")
        }).fail(function() {
            window.location.reload(false)
        })
    };
    self.handleModal = function($offButton) {
        var $btns = $modal.find(".btn");
        $modal.on("show", function() {
            $btns.attr("data-dismiss", "modal");
            $btns.filter(":not(.btn-primary)").on("click", function() {
                $offButton.removeClass("active").prev().addClass("active")
            });
            $btns.filter(".btn-primary").on("click", function() {
                self.switchStatus($offButton)
            })
        });
        $modal.on("hide", function() {
            $btns.filter(".btn-primary").removeAttr("data-dismiss");
            $btns.off("click");
            $modal.off("hide");
            $modal.off("show")
        });
        $modal.modal()
    };
    self.initSwitchStatus()
};
bbc.alertBlock = function($block) {
    "use strict";
    var self = {
        changeDateText: $block.find(".alert-date > input:first").val(),
        duplicateText: $block.find(".alert-date-add > input:first").val()
    };
    self.initDatePickers = function() {
        var defaultOptions = {
            selectOtherMonths: true,
            showAnim: "",
            dateFormat: $.datepicker.ISO_8601,
            onSelect: null,
            minDate: $.datepicker.formatDate($.datepicker.ISO_8601, new Date)
        };
        $block.find(".date-picker-alert").each(function() {
            var $this = $(this),
                textValue = $this.val();
            if ($this.parent().hasClass("alert-date-add")) {
                defaultOptions["onSelect"] = function(dateText, instance) {
                    self.duplicate($this, dateText);
                    $this.val(textValue)
                }
            }
            if ($this.parent().hasClass("alert-date")) {
                defaultOptions["onSelect"] = function(dateText, instance) {
                    self.changeDate($this, dateText)
                }
            }
            if ($this.attr("data-currentdate")) {
                defaultOptions["defaultDate"] = $this.attr("data-currentdate")
            }
            $this.datepicker(defaultOptions);
            $this.datepicker($.datepicker.regional[window.BLABLACAR_LOCALE])
        })
    };
    self.initEditDateLink = function() {
        $block.on("click", ".alerts-unique .edit", function(event) {
            event.preventDefault();
            var alertContent = $(this).parent().parent();
            alertContent.find(".alert-date span").hide();
            alertContent.find(".alert-date input").show().datepicker("show")
        })
    };
    self.duplicate = function($inputDatePicker, dateText) {
        $.post($inputDatePicker.attr("data-url"), {
            date: dateText
        }, function(data) {
            if (!data.success) {
                return
            }
            var $refBlock = $inputDatePicker.parents(".main-block").eq(0).parent(),
                $newBlock = $refBlock.clone(),
                $alertDateInput = $newBlock.find(".alert-date > input:first"),
                newAlertBlock;
            $newBlock.find(".links-main-block .delete").attr("href", data.deleteUrl);
            self.resetDatepicker($newBlock.find(".alert-date-add input:first"), data.duplicateUrl);
            self.resetDatepicker($alertDateInput, data.changeDateUrl);
            self.switchDisplayInputDate($alertDateInput, dateText);
            $refBlock.before($newBlock);
            bbc.alertBlock($newBlock);
            $newBlock.effect("pulsate", {
                times: 2
            }, 3e3)
        }, "json").fail(function() {
            window.location.reload(false)
        })
    };
    self.changeDate = function($inputDatePicker, dateText) {
        $.post($inputDatePicker.attr("data-url"), {
            date: dateText
        }, function(data) {
            if (!data.success) {
                return
            }
            self.switchDisplayInputDate($inputDatePicker, dateText)
        }).fail(function() {
            window.location.reload(false)
        })
    };
    self.formatISOToReadable = function(isoDate) {
        var matches = $.datepicker.parseDate($.datepicker.ISO_8601, isoDate);
        return $.datepicker.formatDate("dd MM yy", matches, {
            monthNamesShort: $.datepicker.regional[window.BLABLACAR_LOCALE].monthNamesShort,
            monthNames: $.datepicker.regional[window.BLABLACAR_LOCALE].monthNames
        })
    };
    self.switchDisplayInputDate = function($inputDatePicker, dateText) {
        $inputDatePicker.hide().datepicker("option", "defaultDate", dateText).val(self.changeDateText);
        $inputDatePicker.prev().text(self.formatISOToReadable(dateText)).show()
    };
    self.resetDatepicker = function($inputDatePicker, attrDataUrl) {
        $inputDatePicker.removeAttr("id").removeClass("hasDatepicker").attr("data-url", attrDataUrl)
    };
    self.initDatePickers();
    self.initEditDateLink()
};
$(function() {
    var $switchStatusModal = $("#modal-confirm-regular-alert");
    $(".alerts-regular > li").each(function() {
        bbc.favoriteRouteBlock($(this), $switchStatusModal)
    });
    $(".alerts-unique > li").each(function() {
        bbc.alertBlock($(this))
    })
});
profileCar = function($) {
    var parameters = {};

    function uploadAutoSubmit() {
        $("form.form-upload-auto-submit input[type=file]").bind("change", function() {
            $(this).parents("form").submit()
        })
    }

    function fillChoiceList() {
        var make = $("#profile_car_make").val();
        var url = $("#profile_car_make").data("car-model-url");
        if (make.length > 0) {
            url = url.replace("__MAKE__", make);
            $.getJSON(url, {
                ajax: "true"
            }, function(j) {
                var options = "";
                for (var i = 0; i < j.length; i++) {
                    options += '<option value="' + j[i] + '">' + j[i] + "</option>"
                }
                $("#profile_car_model").html(options)
            })
        } else {
            $("#profile_car_model").html("")
        }
    }

    function selectChanged() {
        if ($(this).val() == $(this).find("option").first().val()) {
            $(this).addClass("default")
        } else {
            $(this).removeClass("default")
        }
    }
    $(function() {
        $(".select-car").on("change", selectChanged);
        $(".select-car").trigger("change")
    });

    function doInit() {
        $("#profile_car_make").on("change", fillChoiceList)
    }

    function doInitPicture() {}
    return {
        init: function() {
            doInit()
        },
        initPicture: function() {
            doInitPicture()
        }
    }
}(jQuery);
$(document).ready(function() {
    initPreferenceFocus();
    initForm();
    $(".phone-certification-modal").each(function() {
        $(this).dialog({
            autoOpen: true,
            dialogClass: "phone-certification-dialog",
            modal: true
        })
    })
});

function activateLi(li) {
    var li_children = li.childNodes;
    for (var i = 0; i < li_children.length; i++) {
        if (li_children[i].nodeName == "INPUT") {
            if (li_children[i].getAttribute("checked") != "checked") {
                li_children[i].setAttribute("checked", "checked");
                li_children[i].checked = true
            }
        } else if (li_children[i].nodeName == "SPAN") {
            if (!li_children[i].className.match("active")) {
                var classString = li_children[i].getAttribute("class");
                classString += " active";
                li_children[i].setAttribute("class", classString)
            }
        }
    }
}

function deactivateLi(li) {
    var li_children = li.childNodes;
    for (var i = 0; i < li_children.length; i++) {
        if (li_children[i].nodeName == "INPUT") {
            if (li_children[i].getAttribute("checked") != null) {
                li_children[i].removeAttribute("checked");
                li_children[i].checked = false
            }
        } else if (li_children[i].nodeName == "SPAN") {
            if (li_children[i].className.match("active")) {
                var classString = li_children[i].getAttribute("class");
                classString = classString.replace(" active", "");
                li_children[i].setAttribute("class", classString)
            }
        }
    }
}
$(function() {
    $(".profile-pref-container ul li").click(function(e) {
        if (e.target.parentNode.className.match("pref-label")) {
            return false
        }
        if (e.target.parentNode.nodeName == "LI") {
            var to_activate_li = e.target.parentNode;
            var ul_children = e.target.parentNode.parentNode.childNodes;
            for (var i = 0; i < ul_children.length; i++) {
                if (ul_children[i] == to_activate_li) {
                    activateLi(ul_children[i])
                } else {
                    deactivateLi(ul_children[i])
                }
            }
        }
    })
});

function initPreferenceFocus() {
    var allInputs = $(".profile-pref-container ul li :input");
    for (var i = 0; i < allInputs.length; i++) {
        if (allInputs[i].checked == true) {
            activateLi(allInputs[i].parentNode)
        }
    }
}

function initForm() {}
var displayVinciAccordion = function() {
    var container = $("#vinci-choices-container"),
        choice1 = $("#badge-vinci-0"),
        choice2 = $("#badge-vinci-1"),
        choice3 = $("#badge-vinci-2"),
        confirmMsg = $("#vinci-account-validation"),
        btnEdit = $("#btnVinciAccountEdit");
    btnEdit.on("click", function(event) {
        event.preventDefault();
        confirmMsg.addClass("hide");
        container.removeClass("hide");
        choice2.addClass("hide");
        choice3.addClass("hide")
    })
}();
myTrip = function($) {
    var calls = new Array;

    function inputNumber() {
        $(".input-number").each(function() {
            var $this = $(this);
            var $plusBtn = $this.find(".btn-plus");
            var $minusBtn = $this.find(".btn-minus");
            var $span = $this.find("p.seats-available > span");
            var updateCounter = function(count) {
                var value = parseInt($span.text());
                var minValue = $this.data("number-min");
                var maxValue = $this.data("number-max");
                value += count;
                if (typeof maxValue !== "undefined" && maxValue !== false) {
                    value = Math.min(value, parseInt(maxValue))
                }
                if (typeof minValue !== "undefined" && minValue !== false) {
                    value = Math.max(value, parseInt(minValue))
                }
                calls.push(value);
                console.log(calls);
                $span.trigger("onNumberChanged", value);
                var url = $this.data("update-url");
                console.log(url);
                $.ajax(url, {
                    type: "PUT",
                    data: {
                        seat: value
                    },
                    statusCode: {
                        404: function() {
                            alert("page not found")
                        }
                    },
                    success: function(data) {
                        $span.html(value);
                        updateSeat(count)
                    }
                })
            };
            var updateSeat = function(count) {
                var $seats = $this.parent().find("ul.list-seats-available");
                if (count > 0) {
                    for (var i = 0; i < count; i++) {
                        $seats.append('<li class="empty"></li>')
                    }
                } else {
                    for (count; count < 0; count++) {
                        $seats.find("li.empty").last().remove()
                    }
                }
            };
            var incr = function() {
                updateCounter(1)
            };
            var decr = function() {
                updateCounter(-1)
            };
            $plusBtn.bind("click", incr);
            $minusBtn.bind("click", decr)
        })
    }

    function handlePriceChanged() {
        $(".price-stages-list input").each(function() {
            $(this).bind("onNumberChanged", updateTotalPrice)
        })
    }

    function updateTotalPrice() {
        var totalPrice = 0;
        $(".price-stages-list input").each(function() {
            totalPrice += parseInt($(this).val());
            $("#total-price").html(totalPrice)
        })
    }
    return {
        init: function() {
            updateTotalPrice();
            inputNumber();
            handlePriceChanged()
        }
    }
}(jQuery);
$(".publish-return").on("click", function showReturnTrip() {
    var id = $(this).attr("data-id");
    var returnID = "return-" + id;
    var duplicateID = "duplicate-" + id;
    $(this).toggleClass("active");
    $(".duplicate-my-trip").removeClass("active");
    $("#" + returnID).toggle();
    $("#" + duplicateID).hide()
});
$(".duplicate-my-trip").on("click", function showDuplicateTrip() {
    var id = $(this).attr("data-id");
    var returnID = "return-" + id;
    var duplicateID = "duplicate-" + id;
    $(this).toggleClass("active");
    $(".publish-return").removeClass("active");
    $("#" + duplicateID).toggle();
    $("#" + returnID).hide()
});
$(".btn-close").on("click", function hideReturnTrip() {
    $(this).parents("li.yellow-box").hide()
});
$(document).ready(function() {
    $("span#phoneCode").html($("option:selected", "select#registration_phoneInformations_country").attr("title"));
    var example = $("option:selected", "select#registration_phoneInformations_country").attr("data-example");
    $("input#registration_phoneInformations_input").attr("placeholder", example);
    $("select#registration_phoneInformations_country").change(function() {
        $("span#phoneCode").html($("option:selected", this).attr("title"));
        var example = $("option:selected", this).attr("data-example");
        $("input#registration_phoneInformations_input").attr("placeholder", example)
    });

    function selectChanged() {
        if ($(this).val() == $(this).find("option").first().val()) {
            $(this).addClass("default")
        } else {
            $(this).removeClass("default")
        }
    }

    function toggleSections() {
        if (!$(this).hasClass("expanded")) {
            var sections = $("#registration-section, #login-section");
            sections.toggleClass("expanded");
            sections.find(".form-register-container").removeClass("initially-collapsed").stop(true, true).animate({
                height: "toggle",
                opacity: "toggle"
            }, 400)
        }
    }
    $(function() {
        var selectRegister = $(".select-register"),
            lastNameAlert = $(".lastname-warning");
        selectRegister.on("change", selectChanged);
        selectRegister.trigger("change");
        $("#login-section .form-register-container").slideUp(0);
        $("#login-section, #registration-section").on("click", toggleSections);
        $("#registration_lastname").on("focusout", function() {
            if ($(this).val().length == 1) {
                lastNameAlert.slideDown();
                $(this).addClass("info")
            } else {
                lastNameAlert.slideUp();
                $(this).removeClass("info")
            }
        })
    })
});
var onPhoneCountryChanged = function($form) {
    var $span = $form.find("span.phone-code:first");
    var $raw = $form.find("input.phone_raw_input:first");
    var $select = $form.find("select.phone_country:first");
    var $option = $select.find("option:selected");
    var title = $option.attr("title");
    var example = $option.attr("data-example");
    $span.html(title);
    $raw.attr("placeholder", example)
};
$(".mobile-phone").each(function() {
    var $form = $(this);
    var $raw = $form.find("input.phone_raw_input:first");
    if ("" === $raw.val()) {
        var $select = $form.find("select.phone_country:first");
        $select.val(BLABLACAR_REGION);
        onPhoneCountryChanged($form)
    }
});
$("body").on("change", "select.phone_country", function(event) {
    event.preventDefault();
    var $select = $(this);
    var $form = $select.parents("form:first");
    onPhoneCountryChanged($form)
});
$(document).ready(function() {
    var recoveryActionDisplay = function() {
        var recoveryForm = $("#recovery-form");
        if (recoveryForm.length) {
            var recoverySelect = $("#recovery-choices"),
                recoveryList = $("#recovery-answers"),
                recoveryListElem = recoveryList.find("li");
            recoverySelect.on("change", function() {
                recoveryListElem.hide();
                var currentIndex = $(this)[0].selectedIndex;
                if (currentIndex > 0) {
                    recoveryListElem.eq(currentIndex - 1).show()
                }
            })
        }
    }();
    $select = $("select.phone_country");
    if ($select.length === 0) {
        return
    }
    var $form = $select.parents("form:first");
    onPhoneCountryChanged($form)
});
var Blablacar = Blablacar || {};
Blablacar.deleteModal = Blablacar.deleteModal || function($) {
    function doInit() {
        $("[data-show-modal]").click(function(e) {
            e.preventDefault();
            var $link = $(this);
            var $modal = $("#" + $link.attr("data-show-modal"));
            if ($link.data("modal-body")) {
                $modal.find(".modal-body > p:first").html($link.data("modal-body"))
            }
            $("div.modal-footer a.btn-primary, div.modal-footer a.btn-validation", $modal).attr("href", $(this).attr("data-url"));
            $("form", $modal).attr("action", $(this).attr("data-url"));
            $modal.modal()
        })
    }
    return {
        init: function() {
            doInit()
        }
    }
}(jQuery);
$(document).ready(function() {
    Blablacar.deleteModal.init()
});
jQuery.fn.resetForm = function() {
    $(this).each(function() {
        this.reset()
    })
};
$(document).ready(function() {
    $(".review-answer-open, .review-answer-close").on("click", function(event) {
        event.preventDefault();
        var id = $(this).data("rating");
        $('.review-answer-open[data-rating="' + id + '"], form[data-rating="' + id + '"]').toggle()
    });
    $(".show-rating").on("click", function() {
        if ($(".driver-behavior-container").is(":hidden")) {
            $(".driver-behavior-container").show()
        }
    });
    $(".hide-rating").on("click", function() {
        $(".driver-behavior-container").hide();
        if ($(".radio-drv-eval:checked").length) {
            $(".radio-drv-eval:checked").removeAttr("checked")
        }
    });
    var drvrEvalCheckbox = $(".drv-evaluation"),
        drvrEvalRadio = $(".radio-drv-eval"),
        drvrEvalOption = $("#rating_role_1");
    if (drvrEvalCheckbox.length) {
        drvrEvalCheckbox.attr("checked", "checked");
        drvrEvalCheckbox.on("click", function toggleDisabled() {
            if (drvrEvalRadio.attr("disabled")) {
                drvrEvalRadio.removeAttr("disabled");
                drvrEvalRadio.parent().removeClass("disabled")
            } else {
                drvrEvalRadio.attr("disabled", "disabled");
                drvrEvalRadio.parent().addClass("disabled")
            }
            if (drvrEvalRadio.attr("checked", true)) {
                drvrEvalRadio.removeAttr("checked")
            }
        })
    }
    if (drvrEvalOption.is(":checked")) {
        $(".driver-behavior-container").show()
    }
});
var bbc = bbc || {};
bbc.buttonLoader = function() {
    "use strict";
    var self = {
            enableBtnTimer: null,
            selector: ".apply-btn-loader"
        },
        that = {};
    self.init = function() {
        var buttons = $(self.selector),
            form = buttons.parents("form");
        buttons.prepend('<img class="img-loader hide" src="/images/ajax-loader-blue.gif" alt="" />');
        form.on("submit", function(event) {
            var button = $(this).find(self.selector);
            if (button.attr("data-disabled") != "disabled") {
                button.attr("data-disabled", "disabled");
                that.btnDisable(button, false);
                if (!button.attr("data-loader-locked")) {
                    that.enableLater(button)
                }
                return true
            } else {
                that.btnDisable(button, true)
            }
            event.preventDefault()
        });
        buttons.on("click", function(event) {
            var displaySpinner = true;
            form.find("input").each(function() {
                if ($(this).attr("required") && !$(this).val().length) {
                    displaySpinner = false;
                    return false
                }
            });
            if (displaySpinner && $(this).attr("data-disabled") != "disabled") {
                $(this).find(".img-loader").removeClass("hide")
            } else {
                $(this).find(".img-loader").addClass("hide")
            }
        })
    };
    that.btnDisable = function(button, disableButton) {
        button.addClass("disabled");
        if (disableButton == true) {
            button.prop("disabled", true)
        }
    };
    that.btnEnable = function(button) {
        button.find(".img-loader").addClass("hide");
        button.removeClass("disabled");
        button.removeAttr("disabled");
        button.removeAttr("data-disabled")
    };
    that.enableLater = function(button) {
        clearTimeout(self.enableBtnTimer);
        self.enableBtnTimer = setTimeout(function() {
            that.btnEnable(button);
            return true
        }, 4e3)
    };
    self.init();
    return that
}();
var bbc = bbc || {};
bbc.commenttypinghelp = function() {
    "use strict";
    var self = {
            textarea: $(".comments-container textarea")
        },
        that = {};
    self.init = function() {
        if (!self.textarea.length) {
            return
        }
        that.commentTypingHelp()
    };
    that.commentTypingHelp = function() {
        var typingTimer, doneTypingInterval = 1e3;
        self.textarea.keyup(function() {
            clearTimeout(typingTimer);
            var $this = $(this),
                comment = $this.val(),
                commentAlert = $this.parents("form").prevAll(".rules-warning");
            typingTimer = setTimeout(function() {
                $.ajax({
                    url: $("#checkCommentUrl").data("url"),
                    type: "POST",
                    data: {
                        comment: comment
                    },
                    success: function(data) {
                        if (data.isValid === "1") {
                            return commentAlert.slideUp(200)
                        }
                        if (false === commentAlert.is(":visible")) {
                            commentAlert.slideDown(200)
                        }
                    },
                    dataType: "json"
                })
            }, doneTypingInterval)
        })
    };
    self.init();
    return that
}();
var Social = {
    offerRide: function(sender, action) {
        SocialAjax.offerRide(sender, action)
    },
    giveRating: function(successHandler, failHandler) {},
    receiveRating: function(successHandler, failHandler) {}
};
var SocialMenu = {
    selector: ".social-lnk a",
    tempStatus: "",
    tempClass: "",
    classEnabled: "dot green",
    classDisabled: "dot gray",
    classLoading: "loading",
    init: function() {
        if ($(SocialMenu.selector).length == 0) return;
        SocialMenu.bindEvents()
    },
    bindEvents: function() {
        $(SocialMenu.selector).on("click", function(e) {
            SocialMenu.store($(this));
            SocialMenu.updateSender($(this), "load");
            Social.offerRide($(this), SocialMenu.getAction($(this)));
            e.stopPropagation();
            e.preventDefault()
        })
    },
    updateSender: function(sender, statusType) {
        if (sender == null || statusType == "") return;
        var btn = $(sender);
        var btnStat = $(sender).attr("data-status");
        btn.removeClass();
        switch (statusType.toLowerCase()) {
            case "enable":
                btn.addClass(SocialMenu.classEnabled);
                btn.attr("data-status", "enabled");
                break;
            case "disable":
                btn.addClass(SocialMenu.classDisabled);
                btn.attr("data-status", "disabled");
                break;
            case "fail":
                SocialMenu.restore(btn);
                break;
            case "load":
                btn.addClass(SocialMenu.classLoading);
                if (btnStat.indexOf("-loading") < 0) {
                    btn.attr("data-status", btnStat + "-loading")
                }
                break
        }
    },
    lnk_ClickedEventHandler: function(sender, retVal) {
        retVal = retVal.toLowerCase();
        if (retVal == null || retVal == "failed") {
            return SocialMenu.updateSender(sender, "fail")
        }
        if (retVal == "enabled") {
            return SocialMenu.updateSender(sender, "enable")
        }
        SocialMenu.updateSender(sender, "disable")
    },
    getAction: function(sender) {
        var status = $(sender).attr("data-status").toLowerCase();
        if (status == null || status == "") {
            status = "enabled"
        }
        if (status.indexOf("enabled") > -1) {
            return "disable"
        } else {
            return "enable"
        }
    },
    store: function(sender) {
        SocialMenu.clearStore();
        SocialMenu.tempStatus = $(sender).attr("data-status");
        SocialMenu.tempClass = $(sender).attr("class")
    },
    restore: function(sender) {
        $(sender).attr("data-status", SocialMenu.tempStatus);
        $(sender).attr("class", SocialMenu.tempClass)
    },
    clearStore: function() {
        SocialMenu.tempStatus = "";
        SocialMenu.tempClass = ""
    }
};
var SocialAjax = {
    offerRide: function(sender, action) {
        if ($(sender).length == 0) return;
        var _url = "";
        switch (action.toLowerCase()) {
            case "enable":
                _url = $(sender).attr("data-url-on");
                break;
            case "disable":
                _url = $(sender).attr("data-url-off");
                break
        }

        function f(response) {
            SocialMenu.lnk_ClickedEventHandler(sender, JSON.parse(response.responseText))
        }
        var call = $.ajax({
            url: _url,
            dataType: "text",
            type: "POST",
            data: {},
            complete: f
        })
    }
};
var bbc = bbc || {};
bbc.regularTrip = function() {
    "use strict";
    var self = {
            dates: {
                simple: {},
                round: {}
            }
        },
        that = {};
    self.addRemoveDateRange = function(action, type, day) {
        var dateStart = new Date(self.widgetDateStart.datepicker("getDate").getTime()),
            dateNext = new Date(dateStart.getTime()),
            dateStartDay = dateStart.getDay(),
            dateStopHack = new Date(self.widgetDateStop.datepicker("getDate").getTime()),
            dateDiff;
        dateStopHack.setDate(dateStopHack.getDate());
        if (dateStartDay <= day) {
            dateDiff = day - dateStartDay
        } else {
            dateDiff = day + 7 - dateStartDay
        }
        dateNext.setDate(dateStart.getDate() + dateDiff);
        while (dateNext <= dateStopHack) {
            self.addRemoveDate(action, type, new Date(dateNext.getTime()));
            dateNext.setDate(dateNext.getDate() + 7)
        }
        var jsToPhpDayMapping = {
            1: 0,
            2: 1,
            3: 2,
            4: 3,
            5: 4,
            6: 5,
            0: 6
        };
        if (type === "simple") {
            $("select.regular-way-in-days option[value=" + jsToPhpDayMapping[day] + "]").attr("selected", action == "add")
        } else if (type === "round") {
            $("select.regular-return-days option[value=" + jsToPhpDayMapping[day] + "]").attr("selected", action == "add")
        }
    };
    self.hasDate = function(typeDate, dateKey) {
        var dates = typeDate === "simple" ? self.dates.simple : self.dates.round;
        return dates[dateKey] ? true : false
    };
    self.getDateKey = function(date) {
        return $.datepicker.formatDate("yymmdd", date)
    };
    self.getReverseDateKey = function(dateKey) {
        return new Date(dateKey.substr(0, 4), parseInt(dateKey.substr(4, 2), 10) - 1, dateKey.substr(6, 2))
    };
    self.addDateToForm = function(collectionId, dateKey) {
        if ($("#" + collectionId + " input[value=" + dateKey + "]").length > 0) {
            return
        }
        var prototype = $("#" + collectionId).data("prototype");
        var newItem = prototype.replace(/__name__/g, dateKey);
        $("#" + collectionId).append(newItem);
        $("#" + collectionId + "_" + dateKey).attr("value", dateKey)
    };
    self.addRemoveDate = function(action, typeTrip, dateTrip) {
        var dateKey = self.getDateKey(dateTrip);
        var regularId = {
            simple: $(".regular-way-in").attr("id"),
            round: $(".regular-return").attr("id")
        };
        if (action === "add") {
            self.dates[typeTrip][dateKey] = dateTrip;
            self.addDateToForm(regularId[typeTrip], dateKey)
        } else {
            delete self.dates[typeTrip][dateKey];
            $("#" + regularId[typeTrip] + " input[value=" + dateKey + "]").remove()
        }
    };
    self.load = function() {
        self.widgetDays = {
            simple: $(".simple button"),
            round: $(".round button")
        };
        self.widgetCalendar = $("#regular-calendar");
        self.widgetChooseDate = $("#chooseDate");
        self.widgetDateStart = $("input.start-schedule:first");
        self.widgetDateStop = $("input.stop-schedule:first");
        self.widgetRoundTrip = $("input.simple-round-choice:first");
        self.widgetCalendarAll = $("#all-calendars");
        self.widgetAllModal = $("#seeAll");
        self.isEdition = $("#is_edition").val() == 1;
        self.isBackFromNextStep = $("#is_back").val() == 1;
        self.hasErrors = $("#has_errors").val() == 1;
        self.displayDaysAndDates()
    };
    self.selectDay = function($button) {
        $button.addClass("selected-day").addClass("active")
    };
    self.preSelectDays = function() {
        if (!self.isEdition && !self.hasErrors && !self.isBackFromNextStep) {
            if (true == self.widgetRoundTrip.is(":checked")) {
                if ($(".simple button[class*=selected-day]").length == 0) {
                    $(".simple button[data-day-range=5]").click()
                }
                if ($(".round button[class*=selected-day]").length == 0) {
                    $(".round button[data-day-range=0]").click()
                }
            } else {
                self.uncheckDays("simple")
            }
        }
    };
    self.uncheckDays = function(type) {
        $.each(self.dates[type], function(k, v) {
            self.addRemoveDate("remove", type, self.getReverseDateKey(k))
        });
        $.each(self.widgetDays[type], function() {
            if ($(this).hasClass("active")) {
                $(this).removeClass("selected-day").removeClass("active")
            }
        });
        if (type == "simple") {
            $("select.regular-way-in-days option:selected").attr("selected", false)
        } else {
            $("select.regular-return-days option:selected").attr("selected", false)
        }
        self.widgetCalendar.datepicker("refresh")
    };
    self.displayDaysAndDates = function() {
        var phpToJsDayMapping = {
            0: 1,
            1: 2,
            2: 3,
            3: 4,
            4: 5,
            5: 6,
            6: 0
        };
        $(".regular-way-in-days option:selected").each(function() {
            self.selectDay($(".simple button[data-day-range=" + phpToJsDayMapping[$(this).val()] + "]"))
        });
        $(".regular-return-days option:selected").each(function() {
            self.selectDay($(".round button[data-day-range=" + phpToJsDayMapping[$(this).val()] + "]"))
        });
        $(".regular-way-in input").each(function() {
            var date = self.getReverseDateKey($(this).val());
            self.addRemoveDate("add", "simple", date)
        });
        $(".regular-return input").each(function() {
            var date = self.getReverseDateKey($(this).val());
            self.addRemoveDate("add", "round", date)
        })
    };
    self.beforeShowDay = function(date) {
        var dateCalendarKey = self.getDateKey(date),
            dateCalendarClass = "";
        if (self.hasDate("simple", dateCalendarKey)) {
            dateCalendarClass += "simple-date-selected"
        }
        if (self.hasDate("round", dateCalendarKey)) {
            dateCalendarClass += " round-date-selected"
        }
        return [true, dateCalendarClass]
    };
    self.updateDay = function(type, $dayButton) {
        var day = parseInt($dayButton.attr("data-day-range"), 10);
        self.addRemoveDateRange(false === $dayButton.hasClass("selected-day") ? "remove" : "add", type, day)
    };
    self.toggleDay = function($button, type) {
        $button.toggleClass("selected-day");
        self.updateDay(type, $button);
        self.widgetCalendar.datepicker("refresh")
    };
    self.updateDays = function() {
        $.each(self.widgetDays["simple"], function() {
            self.updateDay("simple", $(this))
        });
        $.each(self.widgetDays["round"], function() {
            self.updateDay("round", $(this))
        })
    };
    self.arrayToObject = function(array) {
        for (var object = {}, i = 0; i < array.length; i++) {
            object[array[i]] = array[i]
        }
        return object
    };
    self.dateSqlToJs = function(date) {
        return new Date(parseInt(date.substr(0, 4), 10), parseInt(date.substr(5, 2), 10) - 1, parseInt(date.substr(8, 2), 10))
    };
    self.updateDateStart = function() {
        var dateStart = self.widgetDateStart.datepicker("getDate");
        self.widgetCalendar.datepicker("option", "minDate", dateStart);
        self.widgetCalendar.datepicker("option", "setDate", dateStart);
        self.widgetCalendarAll.datepicker("option", "minDate", dateStart);
        if (self.dateStartPrevious < dateStart) {
            while (self.dateStartPrevious < dateStart) {
                self.addRemoveDate("remove", "simple", self.dateStartPrevious);
                self.addRemoveDate("remove", "round", self.dateStartPrevious);
                self.dateStartPrevious.setDate(self.dateStartPrevious.getDate() + 1)
            }
        } else {
            self.dateStartPrevious = new Date(dateStart.getTime())
        }
        self.updateDays();
        self.widgetCalendar.datepicker("refresh")
    };
    self.updateDateStop = function() {
        var dateStop = self.widgetDateStop.datepicker("getDate");
        self.widgetCalendar.datepicker("option", "maxDate", dateStop);
        self.widgetCalendarAll.datepicker("option", "maxDate", dateStop);
        if (self.dateStopPrevious > dateStop) {
            while (self.dateStopPrevious > dateStop) {
                self.addRemoveDate("remove", "simple", self.dateStopPrevious);
                self.addRemoveDate("remove", "round", self.dateStopPrevious);
                self.dateStopPrevious.setDate(self.dateStopPrevious.getDate() - 1)
            }
        } else {
            self.dateStopPrevious = new Date(dateStop.getTime())
        }
        self.updateDays();
        self.widgetCalendar.datepicker("refresh")
    };
    self.checkDateMax = function() {
        $(".stop-schedule").datepicker({
            onClose: function() {
                var inputDate = $(this),
                    dateDeb = new Date($(".start-schedule").datepicker("getDate")),
                    dateEnd = new Date(inputDate.datepicker("getDate")),
                    dateMax = new Date(dateDeb);
                dateMax = new Date(dateMax.setMonth(dateMax.getMonth() + parseInt($(this).attr("data-date-max-end"))));
                if (dateEnd > dateMax) {
                    inputDate.val($.datepicker.formatDate($.datepicker._defaults.dateFormat, dateMax));
                    inputDate.tooltip({
                        title: inputDate.attr("data-date-too-far"),
                        animation: true,
                        trigger: "manual",
                        placement: "top"
                    }).tooltip("show");
                    var TooltipTimer = setTimeout(function hideTooltip() {
                        inputDate.tooltip("destroy")
                    }, 1e4)
                }
                self.updateDateStop()
            }
        })
    };
    that.init = function() {
        self.load();
        var optionsCalendar = {
            selectOtherMonths: true,
            showAnim: "",
            dateFormat: self.widgetCalendar.attr("data-date-format"),
            firstDay: "1"
        };
        self.widgetDateStart.datepicker(optionsCalendar);
        self.widgetDateStart.datepicker("setDate", self.widgetDateStart.val());
        self.widgetDateStart.datepicker("option", "onSelect", self.updateDateStart);
        self.widgetDateStart.on("change", self.updateDateStart);
        self.widgetDateStop.datepicker(optionsCalendar);
        self.widgetDateStop.datepicker("setDate", self.widgetDateStop.val());
        self.widgetDateStop.datepicker("option", "onSelect", self.updateDateStop);
        self.widgetDateStop.on("change", self.updateDateStop);
        if (self.widgetDateStart.length) {
            self.dateStartPrevious = new Date(self.widgetDateStart.datepicker("getDate").getTime());
            self.dateStopPrevious = new Date(self.widgetDateStop.datepicker("getDate").getTime())
        }
        self.widgetCalendar.datepicker(jQuery.extend({}, optionsCalendar, {
            defaultDate: self.widgetDateStart.datepicker("getDate"),
            minDate: self.widgetDateStart.datepicker("getDate"),
            maxDate: self.widgetDateStop.datepicker("getDate"),
            beforeShowDay: self.beforeShowDay,
            onSelect: function() {
                var dayCalendar = self.getDateKey(self.widgetCalendar.datepicker("getDate"));
                self.widgetChooseDate.attr("data-day", dayCalendar);
                if (self.widgetDays["round"].is(":visible")) {
                    self.widgetChooseDate.modal("show");
                    if (self.hasDate("simple", dayCalendar)) {
                        $("input[name=simple-choice]").attr("checked", "checked");
                        $(".simple-choice-label").addClass("green-label")
                    }
                    if (self.hasDate("round", dayCalendar)) {
                        $("input[name=round-choice]").attr("checked", "checked");
                        $(".round-choice-label").addClass("blue-label")
                    }
                } else {
                    var dayCalendarSimple = self.getReverseDateKey(self.widgetChooseDate.attr("data-day"));
                    if (self.hasDate("simple", self.widgetChooseDate.attr("data-day"))) {
                        self.addRemoveDate("remove", "simple", dayCalendarSimple)
                    } else {
                        self.addRemoveDate("add", "simple", dayCalendarSimple)
                    }
                }
            }
        }));
        $(".see-all-dashboard").on("click", function() {
            var $link = $(this);
            var $article = $link.parents("article");
            var $calendars = $article.find(".all-calendars-dashboard");
            if (!$calendars.hasClass("hasDatepicker")) {
                var dateStartDashboard = $article.find(".startDateCal").val();
                var dateStopDashboard = $article.find(".endDateCal").val();
                var newDateStart = self.dateSqlToJs(dateStartDashboard);
                var newDateStop = self.dateSqlToJs(dateStopDashboard);
                var dateSimpleDashboard = $article.find(".dateSimpleDashboard").val().split(",");
                var dateRoundDashboard = $article.find(".dateRoundDashboard").val().split(",");
                $calendars.hide();
                self.dates.simple = self.arrayToObject(dateSimpleDashboard);
                self.dates.round = self.arrayToObject(dateRoundDashboard);
                $calendars.datepicker(jQuery.extend({}, optionsCalendar, {
                    defaultDate: newDateStart,
                    minDate: newDateStart,
                    maxDate: newDateStop,
                    numberOfMonths: [2, 3],
                    beforeShowDay: self.beforeShowDay
                }))
            }
            $link.text($calendars.is(":visible") ? $link.data("origin") : $link.data("alt"));
            $calendars.slideToggle()
        });
        $('a[href="#seeAll"]').on("click", function() {
            self.widgetAllModal.modal("show");
            self.widgetCalendarAll.datepicker(jQuery.extend({}, optionsCalendar, {
                numberOfMonths: [2, 3],
                beforeShowDay: self.beforeShowDay,
                minDate: self.widgetDateStart.datepicker("getDate"),
                maxDate: self.widgetDateStop.datepicker("getDate")
            }));
            self.widgetCalendarAll.datepicker("refresh")
        });
        self.widgetRoundTrip.on("change", function() {
            self.preSelectDays();
            if (false == self.widgetRoundTrip.is(":checked")) {
                self.uncheckDays("round")
            }
        });
        self.widgetDays["simple"].click(function() {
            self.toggleDay($(this), "simple")
        });
        self.widgetDays["round"].click(function() {
            self.toggleDay($(this), "round")
        });
        self.preSelectDays();
        self.widgetChooseDate.find("button.btn-validation").click(function() {
            var dayModal = self.getReverseDateKey(self.widgetChooseDate.attr("data-day")),
                checkBoxSimple = self.widgetChooseDate.find("input[name=simple-choice]"),
                checkBoxRound = self.widgetChooseDate.find("input[name=round-choice]");
            var simpleAction = checkBoxSimple.is(":checked") ? "add" : "remove";
            self.addRemoveDate(simpleAction, "simple", dayModal);
            var roundAction = checkBoxRound.is(":checked") ? "add" : "remove";
            self.addRemoveDate(roundAction, "round", dayModal);
            self.beforeShowDay(dayModal);
            self.widgetCalendar.datepicker("refresh");
            checkBoxSimple.attr("checked", false);
            $(".simple-choice-label").removeClass("green-label");
            checkBoxRound.attr("checked", false);
            $(".round-choice-label").removeClass("blue-label")
        })
    };
    self.checkDateMax();
    return that
}();
var showmore = function() {
    $(document).on("click", ".showmore-link", function(event) {
        event.preventDefault();
        var that = $(this),
            smContainer = that.parent(),
            smEllipsis = smContainer.find(".showmore-ellipsis"),
            smRest = smContainer.find(".showmore-rest"),
            smRestLink = smContainer.find(".showrest-link"),
            classActive = "deployed",
            delay = that.attr("data-delay") != undefined ? parseInt(that.attr("data-delay")) : 1e3;
        if (smContainer.hasClass(classActive)) {
            smContainer.removeClass(classActive);
            smEllipsis.show();
            smRest.hide(delay);
            smRestLink.hide();
            that.text(that.attr("data-label-show"))
        } else {
            smContainer.addClass(classActive);
            smEllipsis.hide();
            smRest.show(delay);
            smRestLink.slideDown();
            that.text(that.attr("data-label-hide"))
        }
    })
};
(function(globale) {
    "use strict";
    var OneClickUI = function(el) {
        if (!el.length) {
            return
        }
        var self = this;
        self.container = el;
        self.switcher = $(".Button--link", self.container);
        self.saveCard = $('.payment-card-saving input[type="checkbox"]', self.container);
        self.replaceCardAlert = $(".card-saving-alert", self.container);
        self.title = $("h3, h4", self.container);
        self.toggleTitle = function() {
            var currentTitle = this.title.text();
            var newTitle = this.title.attr("data-oneclick");
            this.title.text(newTitle).attr("data-oneclick", currentTitle)
        };
        self.switcher.on("click", function() {
            var currentForm = $(this).data("oneclick");
            $('[class^="form_"].hide, [class*=" form_"].hide', self.container).removeClass("hide");
            $(currentForm).addClass("hide");
            self.toggleTitle()
        });
        self.saveCard.on("change", function() {
            if (self.saveCard.is(":checked")) {
                self.replaceCardAlert.removeClass("hide")
            } else {
                self.replaceCardAlert.addClass("hide")
            }
        })
    };
    globale.OneClickUI = OneClickUI
})(window);
window.payment = function($, window, undefined) {
    var validation = {};
    validation.cvv = function($cvv) {
        if (false == $.payment.validateCardCVC($cvv.val())) {
            $cvv.addClass("error-field");
            return false
        }
        $cvv.removeClass("error-field");
        return true
    };
    validation.cardNumber = function($cardNumber) {
        if (false == $.payment.validateCardNumber($cardNumber.val())) {
            $cardNumber.addClass("error-field");
            return false
        }
        $cardNumber.removeClass("error-field");
        return true
    };
    validation.expiry = function($expiryMonth, $expiryYear) {
        if (false == $.payment.validateCardExpiry($expiryMonth.val(), $expiryYear.val())) {
            $expiryYear.addClass("error-field");
            $expiryMonth.addClass("error-field");
            return false
        }
        $expiryYear.removeClass("error-field");
        $expiryMonth.removeClass("error-field");
        return true
    };
    return {
        activateClientValidation: function() {
            var $form = $("#blablacar-payment-form"),
                $cardNumber = $form.find("input.cc-number"),
                $cvv = $form.find("input.cc-cvc"),
                $expiryMonth = $form.find("select.cc-exp-month"),
                $expiryYear = $form.find("select.cc-exp-year"),
                $cardType = $form.find("input.cc-type"),
                $cardHolder = $("input[data-encrypted-name=holderName]");
            $cardNumber.payment("formatCardNumber").on("change", function(e) {
                validation.cardNumber($(this))
            });
            $cvv.payment("formatCardCVC").on("change", function(e) {
                validation.cvv($(this))
            });
            $form.find('button[type="submit"][data-client-side="true"]').on("click", function(e) {
                var isValid = 1;
                isValid &= validation.expiry($expiryMonth, $expiryYear);
                isValid &= validation.cardNumber($cardNumber);
                var cardType = $.payment.cardType($cardNumber.val());
                $cardType.val(cardType);
                if (cardType != "maestro") {
                    isValid &= validation.cvv($cvv.filter(":visible"))
                }
                if ($cardHolder.val() == "") {
                    $cardHolder.val("default")
                }
                if (!isValid) {
                    e.preventDefault();
                    $(this).find(".img-loader").addClass("hide")
                }
            });
            $form.find('button[type="submit"][data-card-wallet="true"]').on("click", function(e) {
                var isValid = 1;
                isValid &= validation.cvv($cvv.filter(":visible"));
                if (!isValid) {
                    e.preventDefault();
                    $(this).find(".img-loader").addClass("hide")
                }
            })
        }
    }
}(jQuery, window);
var updateValidationDelay = function() {
    var delaySelect = $("#driver-confirmation");
    if (delaySelect.length) {
        var delayListVal = delaySelect.find("option"),
            delayInput = $("#payment_intention_expires");
        delaySelect.on("change", function() {
            var option = delayListVal.eq(this.selectedIndex);
            delayInput.val(option.val())
        })
    }
}();
$('.cards-container a[data-toggle="collapse"]').click(function(e) {
    e.preventDefault()
});
$(function() {
    new window.OneClickUI($(".js-oneclickui"))
});
window.postpayment = function($, window, undefined) {
    return {
        init: function() {
            $(function hideText() {
                var $elem = $(".postpayment-container .comment-trip");
                var $limit = 200;
                var $str = $elem.html();
                var $strtemp = $str.substr(0, $limit);
                $str = $strtemp + '<div class="hide hidden-text">' + $str.substr($limit, $str.length) + "</div>";
                $elem.html($str)
            });
            $(".show-hidden-text").bind("click", function() {
                var origin = this.getAttribute("data-origin");
                var alt = this.getAttribute("data-alt");
                if ($(".hidden-text").is(":visible")) {
                    $(".show-hidden-text").html(origin)
                } else {
                    $(".show-hidden-text").html(alt)
                }
                $(".comment-trip .hidden-text").slideToggle()
            })
        }
    }
}(jQuery, window);
$("a.sample-creditcard").bind("click", function(event) {
    event.preventDefault();
    var $this = $(this),
        provider = $this.attr("data-provider"),
        label = $this.attr("data-label");
    var prefix = "payment";
    if ($("#purchase_package_intention_solutions_" + provider).length) {
        prefix = "purchase_package"
    }
    $("#" + prefix + "_intention_solutions_" + provider + "_" + label + "_number").attr("value", $this.attr("data-number"));
    $("#" + prefix + "_intention_solutions_" + provider + "_" + label + "_cvv").attr("value", $this.attr("data-cvv"));
    $("#" + prefix + "_intention_solutions_" + provider + "_" + label + "_expiration_date_month").val($this.attr("data-expiration-month"));
    $("#" + prefix + "_intention_solutions_" + provider + "_" + label + "_expiration_date_year").val($this.attr("data-expiration-year"));
    var holderName = $("#" + prefix + "_intention_solutions_" + provider + "_" + label + "_holderName");
    if ($this.attr("data-holder") && holderName) {
        holderName.val($this.attr("data-holder"))
    }
});
$(".step-warning").popover();
var isMobile = {
    Android: function() {
        var androidDetection = navigator.userAgent.match(/Android/i);
        if (androidDetection) {
            var androidMobile = navigator.userAgent.match(/Mobile Safari/i);
            if (androidMobile) {
                return true
            }
        }
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i)
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPod/i)
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i)
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i)
    },
    any: function() {
        return isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows()
    }
};
var bbc = bbc || {};
bbc.charCounter = function() {
    "use strict";
    var self = {
        selector: ".apply-char-counter",
        attribute: "limit"
    };
    self.recount = function(textarea, displayCounter, maxChar) {
        var enteredText = textarea.val();
        var numberOfLineBreaks = (enteredText.match(/\n/g) || []).length;
        var characterCount = enteredText.length + numberOfLineBreaks;
        if (characterCount > maxChar) {
            characterCount = maxChar;
            textarea.val(textarea.val().substring(0, maxChar - numberOfLineBreaks))
        }
        displayCounter.text(maxChar - characterCount + "/" + maxChar)
    };
    self.init = function() {
        $(self.selector).each(function() {
            var that = $(this),
                textarea = that.find("textarea"),
                limit = $(this).data(self.attribute) ? $(this).data(self.attribute) : 200,
                maxChar, displayCounter;
            textarea.after('<span class="display-char-counter"></span>');
            displayCounter = that.find(".display-char-counter");
            if (!textarea.attr("maxlength")) {
                textarea.attr("maxlength", limit)
            }
            maxChar = textarea.attr("maxlength");
            self.recount(textarea, displayCounter, maxChar);
            textarea.on("keyup", function(event) {
                self.recount(textarea, displayCounter, maxChar)
            })
        })
    };
    self.init()
}();
var bbc = bbc || {};
bbc.datepicker = function(onSelectHandler) {
    $(".date-picker-heatmap").each(function renderDatePickerHeatmap() {
        var $this = $(this);
        var dataListName = $(this).data("list");
        var $dataList = $("#" + dataListName);
        var dataList = {};
        var classes = {};
        if ($dataList) {
            $dataList.find("option").each(function() {
                dataList[$(this).text()] = {
                    value: this.value,
                    "class": this.className
                };
                classes[this.className] = 1
            })
        }
        var timer;
        var legendTimeout = function() {
            clearTimeout(timer);
            timer = setTimeout(function() {
                addLegend($dataList.attr("data-legend"), $("#ui-datepicker-div .ui-datepicker-calendar"))
            }, 30)
        };
        var addLegend = function(legend, calendar) {
            var out = "";
            var parts;
            legend = legend.split("|");
            for (var i = 0, l = legend.length; i < l; i++) {
                parts = legend[i].split(":");
                out += '<span><b class="' + parts.shift() + '"></b> ' + parts.join(":") + "</span>"
            }
            calendar.after('<div class="ui-datepicker-legend">' + out + "</div>")
        };
        var options = {
            selectOtherMonths: true,
            showAnim: "",
            minDate: new Date,
            beforeShowDay: function showDataList(date) {
                var formattedDate = $.datepicker.formatDate($.datepicker._defaults.dateFormat, date);
                if (dataList.hasOwnProperty(formattedDate)) {
                    if (dataList[formattedDate].value == 1) {
                        var key = "data-label-trip-count"
                    } else {
                        var key = "data-label-trips-count"
                    }
                    return [true, dataList[formattedDate]["class"], dataList[formattedDate].value + " " + $(this).attr(key)]
                } else if (date >= new Date) {
                    return [true, "data-label-notrip", $(this).attr("data-label-notrip")]
                }
                return [false, "", ""]
            },
            beforeShow: function() {
                legendTimeout()
            },
            onChangeMonthYear: function() {
                legendTimeout()
            },
            onSelect: function() {
                onSelectHandler($(this).parents("form"))
            }
        };
        if ($this.attr("data-datepicker-minDate")) {
            options.minDate = $this.attr("data-datepicker-minDate")
        }
        $this.datepicker(options)
    })
};
var bbc = bbc || {};
bbc.slider = function(onStopHandler) {
    var sliderHoursFilter = $("#hours-filter-slider");
    if (sliderHoursFilter.length > 0) {
        var selectHourBegin = $("#hb"),
            selectHourEnd = $("#he"),
            hourBeginAvailable = selectHourBegin.find("option:not(:disabled)").first().val(),
            hourEndAvailable = selectHourEnd.find("option:not(:disabled)").last().val(),
            selectedHourBegin = selectHourBegin.find("option:selected"),
            selectedHourEnd = selectHourEnd.find("option:selected"),
            currentHourBegin = selectedHourBegin.val(),
            currentHourEnd = selectedHourEnd.val(),
            displayHourBegin = $("#hb-display"),
            displayHourEnd = $("#he-display");
        if (selectedHourBegin.length > 0) {
            displayHourBegin.text(currentHourBegin + "h")
        }
        if (selectedHourEnd.length > 0) {
            displayHourEnd.text(currentHourEnd + "h")
        }
        sliderHoursFilter.slider({
            range: true,
            min: 0,
            max: 24,
            values: [currentHourBegin, currentHourEnd],
            slide: function(event, ui) {
                var hourBeginUpdate = ui.values[0],
                    hourEndUpdate = ui.values[1];
                if (hourBeginAvailable > hourBeginUpdate || hourEndAvailable < hourEndUpdate || hourBeginUpdate == hourEndUpdate) {
                    event.preventDefault()
                } else {
                    selectHourBegin.val(hourBeginUpdate);
                    selectHourEnd.val(hourEndUpdate);
                    displayHourBegin.text(hourBeginUpdate + "h");
                    displayHourEnd.text(hourEndUpdate + "h")
                }
            },
            stop: function(event, ui) {
                if (currentHourBegin != ui.values[0] || currentHourEnd != ui.values[1]) {
                    onStopHandler($(this).parents("form"))
                }
            }
        });
        sliderHoursFilter.find(".ui-slider-handle").last().addClass("handle-last")
    }
};
$(function() {
    var bannerTemplate = $("#cookie-banner-template").html(),
        cookieName = "_cookies_v2";
    if (!bannerTemplate) {
        return
    }
    if (Cookie.get(cookieName)) {
        return
    }
    var banner = $("<div>").html(bannerTemplate);
    banner.on("click", ".js-close", function() {
        Cookie.set(cookieName, "1", {
            expires: +new Date + Cookie.DAY * 365
        });
        banner.hide()
    });
    banner.insertAfter($("#skip-link"))
});
$(function() {
    var $select = $("select#iban_countryCode"),
        $input = $("input#paypal_account_email");
    var bankDetails = {
        enable: function(name) {
            $(name).removeClass("hide")
        },
        disable: function(name) {
            var element = $(name);
            element.addClass("hide");
            element.find("input").each(function() {
                $(this).val("")
            })
        },
        toggleFields: function(countryCode) {
            var codes = ["GB", "IE"];
            if (codes.indexOf(countryCode) >= 0) {
                bankDetails.enable(".sortCode");
                bankDetails.disable(".iban")
            } else {
                bankDetails.disable(".sortCode");
                bankDetails.enable(".iban")
            }
        },
        updateEmail: function(name, newEmail) {
            if (name == null || newEmail == null) {
                return
            }
            var element = $(name),
                str = element.html(),
                translation = str.replace(/"(.*)"/, '"' + newEmail + '"');
            element.html(translation)
        },
        submitForm: function(name) {
            var form = $(name);
            form.submit()
        }
    };
    $select.change(function() {
        bankDetails.toggleFields($(this).val())
    });
    bankDetails.toggleFields($select.val());
    $("[data-validate]").click(function() {
        bankDetails.submitForm($(this).data("validate"))
    });
    $("[data-update-email]").change(function() {
        bankDetails.updateEmail($(this).data("update-email"), $(this).val())
    })
});
var Blablacar = Blablacar || {};
(function(Blablacar, $, moment) {
    Blablacar.TagManager = Blablacar.TagManager || {};
    Blablacar.TagManager.TripSearch = {
        counter: 0,
        pushXhrData: function(xhrData) {
            this.counter++;
            var searchInstance = xhrData.search;
            var tripResults = xhrData.results;
            var data = dataLayer[0];
            var fromName = searchInstance.fn;
            var toName = searchInstance.tn;
            var xhrDataLayer = xhrData.data_layer;
            data.current_route = "blablacar_trip_search";
            data.event = "trip_search";
            data.unixtime = moment().format("X");
            data.search_from = fromName;
            data.search_to = toName;
            data.search_page = searchInstance.page;
            data.search_counter = this.counter;
            if (typeof xhrDataLayer.viewer_grade !== "undefined") {
                data.viewer_grade = xhrDataLayer.viewer_grade
            }
            if (typeof xhrDataLayer.psgr_newbie_flag !== "undefined") {
                data.psgr_newbie_flag = xhrDataLayer.psgr_newbie_flag
            }
            if (searchInstance.db) {
                var date = moment(searchInstance.db, window.datepickerDateFormat);
                data.search_date = date.format("DDMMYYYY");
                data.search_date_format = date.format("YYYY-MM-DD");
                data.search_date_unixtime = date.format("X")
            }
            for (var i = 0; i < tripResults.length; i++) {
                if (i >= 3) {
                    break
                }
                var result = tripResults[i];
                data["trip_id_" + (i + 1)] = result
            }
            data.is_featured = xhrData.has_top_trips || false;
            window.dataLayer.push(data)
        }
    }
})(Blablacar, window.jQuery || window.Zepto, moment);
var Blablacar = Blablacar || {};
(function(Blablacar, $, History) {
    Blablacar.Search = {
        App: {},
        Router: {},
        Views: {}
    };
    Blablacar.Search.App = {
        start: function(options) {
            options = options || {};
            Blablacar.Search.Views.layout.init();
            Blablacar.Search.Views.form.init();
            Blablacar.Search.Views.alert.init();
            Blablacar.Search.Views.results.init();
            Blablacar.Search.Views.facets.init();
            Blablacar.Search.Router.init(options.xhrUrl)
        }
    };
    Blablacar.Search.Router = {
        init: function(xhrUrl) {
            var self = this;
            this.xhrUrl = xhrUrl;
            this._cacheResults = [];
            History.Adapter.bind(window, "statechange", function() {
                var State = History.getState();
                if (!State || !State.url) return;
                var query = [],
                    params = self._parseUrl(State.url);
                for (var param in params) {
                    query.push(param + "=" + encodeURIComponent(params[param]))
                }
                self._refreshPage(query.join("&"))
            });
            if (!History.getHash() || History.getHash().indexOf("?") === -1) {
                Blablacar.Search.Views.layout.stopLoading();
                Blablacar.Search.Views.results.setDirections()
            }
        },
        navigate: function(href) {
            var query = [],
                params = this._parseUrl(href);
            for (var param in params) {
                query.push(param + "=" + params[param])
            }
            History.pushState(null, null, "?" + query.join("&"), false);
            Blablacar.Search.Router._searchCookieSaving()
        },
        _searchCookieSaving: function() {
            bbcSetCookie("search_url", window.location.href, 30 * 60, "/", "", "secure")
        },
        _parseUrl: function(href) {
            var url = $.url(href);
            return url.param()
        },
        _refreshPage: function(query) {
            Blablacar.Search.Views.layout.startLoading();
            Blablacar.Search.Views.layout.scrollTop();
            var fetchingResults = this._fetchResults(query);
            $.when(fetchingResults).done(function(data) {
                Blablacar.Search.Views.results.render(data.html.results);
                Blablacar.Search.Views.facets.render(data.html.facets);
                Blablacar.Search.Views.form.bindModel(data.search);
                Blablacar.Search.Views.alert.bindModel(data.search);
                Blablacar.Search.Views.layout.setTitle(data.title);
                Blablacar.Search.Views.results.setDirections()
            }).always(function() {
                Blablacar.Search.Views.layout.stopLoading();
                Blablacar.Search.Views.layout.setTitle()
            }).fail(function() {})
        },
        _fetchResults: function(query) {
            var defer = $.Deferred();
            var cacheKey = query;
            if (this._cacheResults[cacheKey]) {
                defer.resolve(this._cacheResults[cacheKey]);
                return defer.promise()
            }
            var self = this;
            $.ajax({
                url: this.xhrUrl + "?" + query,
                cache: false
            }).done(function(data) {
                Blablacar.TagManager.TripSearch.pushXhrData(data);
                defer.resolve(data)
            }).fail(function(data) {
                defer.reject(data)
            });
            return defer.promise()
        }
    };
    Blablacar.Search.Views.layout = {
        el: "#search-layout",
        init: function() {
            this.$el = $(this.el);
            this.title = window.document.title
        },
        startLoading: function() {
            this.$el.addClass("js-loading")
        },
        stopLoading: function() {
            this.$el.removeClass("js-loading first-loading");
            initQtips()
        },
        scrollTop: function() {
            $("html,body").animate({
                scrollTop: this.$el.offset().top
            }, 500)
        },
        setTitle: function(newTitle) {
            this.title = newTitle || this.title;
            window.document.title = this.title
        }
    };
    Blablacar.Search.Views.alert = {
        el: "#search-alert",
        init: function() {
            this.$el = $(this.el);
            var self = this;
            $.when(bbcLoginDeferred.promise()).done(function(data) {
                if (!data.email) return;
                self.$el.find("#alert_email").val(data.email).attr("readonly", "readonly").addClass("readonly")
            });
            Blablacar.AlertForm.init()
        },
        bindModel: function(model) {
            var self = this;
            this.$el.find("#alert_beginAt").val(model.db);
            this.$el.find("#alert_departureLabel").val(model.fn);
            this.$el.find("#alert_arrivalLabel").val(model.tn);
            this.$el.find("p.size14 > span").text(model.fn + " - " + model.tn);
            var setCoords = function(modelCoords, latId, longId) {
                var coords = modelCoords && modelCoords.split("|") || ["", ""];
                self.$el.find(latId).val(coords[0]);
                self.$el.find(longId).val(coords[1])
            };
            setCoords(model.fc, "#alert_departureCoordinates_latitude", "#alert_departureCoordinates_longitude");
            setCoords(model.tc, "#alert_arrivalCoordinates_latitude", "#alert_arrivalCoordinates_longitude")
        }
    };
    Blablacar.Search.Views.results = {
        el: "#search-results",
        init: function() {
            this.$el = $(this.el);
            this._initUi();
            this.$el.on("click", ".pagination-container a", this._onPaginationClick);
            this.$el.on("click", ".trip-search-sort a.trip-search-sort-link", this._onSortClick)
        },
        render: function(html) {
            this.$el.html(html);
            this._initUi()
        },
        _initUi: function() {
            $(".order-date, .order-price").each(function() {
                createQtip($(this))
            });
            this.$el.find("#alert_beginAt").datepicker({
                minDate: 0
            })
        },
        _onPaginationClick: function(evt) {
            evt.preventDefault();
            var $el = $(this);
            var $parent = $el.closest("li");
            if ($parent.hasClass("active") || $parent.hasClass("disabled")) return;
            var href = $el.attr("href");
            Blablacar.Search.Router.navigate(href)
        },
        _onSortClick: function(evt) {
            evt.preventDefault();
            var $el = $(this);
            var $parent = $el.closest("li");
            var isActive = $parent.hasClass("active");
            $parent.closest("ul").find("li").removeClass("active");
            var href = $el.attr("href");
            Blablacar.Search.Router.navigate(href)
        },
        setDirections: function() {
            var promise = ensureGoogleMapLoaded();
            var $el = $(this.el);
            promise.then(function(google) {
                var display = $el.find(".js-trip-search-title-distance-duration");
                var unitSystem = google.maps.UnitSystem.METRIC;
                if ("mi" == display.data("distance-unit")) {
                    unitSystem = google.maps.UnitSystem.IMPERIAL
                }
                var origin = display.data("from");
                var destination = display.data("to");
                if ("" == origin || "" == destination || undefined == origin || undefined == destination) {
                    return
                }
                var request = {
                    origin: origin.replace("|", ", "),
                    destination: destination.replace("|", ", "),
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: unitSystem
                };
                var directionsService = new google.maps.DirectionsService;
                directionsService.route(request, function(result, status) {
                    if (status == google.maps.DirectionsStatus.OK) {
                        var directionsDisplay = new google.maps.DirectionsRenderer;
                        directionsDisplay.setDirections(result);
                        var distance = Math.round(directionsDisplay.directions.routes[0].legs[0].distance.value / 1e3);
                        if (google.maps.UnitSystem.IMPERIAL == unitSystem) {
                            distance = Math.round(distance * .621371192)
                        }
                        var duration = new Date(0);
                        duration.setSeconds(directionsDisplay.directions.routes[0].legs[0].duration.value);
                        display.text(display.data("text").replace("%distance%", distance).replace("%duration_hours%", duration.getUTCHours() + (duration.getUTCDate() - 1) * 24).replace("%duration_minutes%", duration.getUTCMinutes()).replace("%duration_seconds%", duration.getSeconds()))
                    }
                })
            })
        }
    };
    Blablacar.Search.Views.facets = {
        el: "#search-facets",
        init: function() {
            this.$el = $(this.el);
            this.$el.on("click", "a.js-facet", this._onFacetClick);
            this._initUi()
        },
        render: function(html) {
            this.$el.html(html);
            this._initUi();
            this.$el.find(".megatip").on("mouseover", function() {
                $(this).popover("show")
            })
        },
        _initUi: function() {
            bbc.slider(function($form) {
                Blablacar.Search.Router.navigate("?" + $form.serialize())
            });
            bbc.datepicker(function($form) {
                Blablacar.Search.Router.navigate("?" + $form.serialize())
            })
        },
        _onFacetClick: function(evt) {
            evt.preventDefault();
            var $el = $(this);
            var $radio = $el.find(".ui-radio");
            if ($radio.length) {
                $radio.closest("ul").find(".ui-radio-checked").removeClass("ui-radio-checked").addClass("ui-radio");
                $radio.removeClass("ui-radio").addClass("ui-radio-checked")
            }
            var $checkbox = $el.find(".ui-checkbox, .ui-checkbox-checked");
            if ($checkbox.length) {
                $checkbox.toggleClass("ui-checkbox").toggleClass("ui-checkbox-checked")
            }
            var href = $el.attr("href");
            Blablacar.Search.Router.navigate(href)
        }
    };
    Blablacar.Search.Views.form = {
        el: "#search-form",
        init: function() {
            this.$el = $(this.el);
            this.$el.find(".reverse").on("click", this._onReverseClick);
            this.$el.on("submit", this._onSubmit);
            resubmit = false
        },
        bindModel: function(model) {
            this.$el.find("input").each(function() {
                var $input = $(this);
                var name = $input.attr("name");
                if (typeof model[name] !== "undefined") $input.val(model[name])
            })
        },
        _onReverseClick: function(evt) {
            evt.preventDefault();
            var prefix = "search_";
            var fields = ["name", "coordinates", "country_code"];
            if ($("input[name=fn]").val() != "" && $("input[name=fn]").first().prop("defaultValue") != $("input[name=fn]").first().val()) {
                $("input[name=fn]").first().trigger("blur")
            }
            if ($("input[name=tn]").val() != "" && $("input[name=tn]").first().prop("defaultValue") != $("input[name=tn]").first().val()) {
                $("input[name=tn]").first().trigger("blur")
            }
            for (var i in fields) {
                var field = fields[i];
                var $from = $("#" + prefix + "from" + "_" + field);
                var $to = $("#" + prefix + "to" + "_" + field);
                var tmp = $from.val();
                $from.val($to.val());
                $to.val(tmp)
            }
        },
        _onSubmit: function(evt) {
            var valid = true;
            if ($("input[name=fn]").val() != "" && $("input[name=fn]").first().prop("defaultValue") != $("input[name=fn]").first().val()) {
                $(this).find("input[name=fn]").first().trigger("blur");
                valid = false
            }
            if ($("input[name=tn]").val() != "" && $("input[name=tn]").first().prop("defaultValue") != $("input[name=tn]").first().val()) {
                $(this).find("input[name=tn]").first().trigger("blur");
                valid = false
            }
            if (!valid) {
                if (resubmit === true) {
                    resubmit = false
                } else {
                    resubmit = true;
                    evt.preventDefault();
                    setTimeout(function() {
                        this.submit()
                    }.bind(this), 400)
                }
            }
        }
    }
})(Blablacar || {}, jQuery, History);
var Blablacar = Blablacar || {};
(function(Blablacar, $) {
    var selector = "a.js-oauth-connect[data-provider]";
    var cookieName = "_popup";
    var providers = {
        facebook: {
            width: 500,
            height: 300
        },
        vkontakte: {
            width: 670,
            height: 385
        }
    };
    $(document).on("click", selector, function(evt) {
        var $this;
        var link;
        var popupWindow;
        var polling;
        var provider;
        var height, width;
        if (!window.addEventListener || !window.postMessage) {
            return
        }
        if (!window.location.origin) {
            window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ":" + window.location.port : "")
        }
        evt.preventDefault();
        $this = $(this);
        provider = $this.data("provider");
        if (!providers[provider]) {
            return
        }
        height = providers[provider].height || 500;
        width = providers[provider].width || 500;
        Cookie.set(cookieName, 1, {
            path: "/"
        });
        link = $this.attr("href");
        popupWindow = window.open(link, "Connection", ["menubar=" + "no", "scrollbars=" + "no", "top=" + Math.floor(window.screenY + (window.outerHeight - height) / 2.5), "left=" + Math.floor(window.screenX + (window.outerWidth - width) / 2), "width=" + width, "height=" + height].join(", "));
        popupWindow.focus();
        polling = setInterval(function() {
            if (!popupWindow || popupWindow.closed) {
                Cookie.remove(cookieName, {
                    path: "/"
                });
                clearInterval(polling)
            }
        }, 50);
        window.addEventListener("message", function(event) {
            if (event.origin !== window.location.origin) {
                return
            }
            Cookie.remove(cookieName, {
                path: "/"
            });
            popupWindow.closed || popupWindow.close();
            window.location = event.data ? event.data : link
        }, false)
    })
})(Blablacar || {}, jQuery);
$(document).ready(function() {
    $("#skip-link a").on("click", function() {
        if (document.location.hash) {
            window.location.replace(document.location + $(this).attr("href"))
        }
    });
    if (document.location.hash) {
        var myAnchor = document.location.hash;
        $(myAnchor).attr("tabindex", -1).on("blur focusout", function() {
            $(this).removeAttr("tabindex")
        }).focus()
    }
    $(window).on("hashchange", function() {
        var hash = "#" + window.location.hash.replace(/^#/, "");
        if (hash != "#") {
            $(hash).attr("tabindex", -1).on("blur focusout", function() {
                $(this).removeAttr("tabindex")
            }).focus()
        }
    })
});
$(document).ready(function() {
    $(".js-alert-close").on("click", function(event) {
        event.preventDefault();
        $(this).parent().hide()
    })
});
var Blablacar = Blablacar || {};
Blablacar.warningModerator = function($) {
    var $body = $("body"),
        $modal = $("#alertModeratorModal"),
        $title = $modal.find(".modal-header h3"),
        $subTitle = $modal.find(".modal-body h3"),
        $itemList = $modal.find(".alert-moderator-list"),
        $otherTxtArea = $modal.find(".other-reason"),
        $btnBack = $modal.find(".moderator-back"),
        $btnSubmit = $modal.find(".moderator-submit"),
        fixturesData = null,
        getWarningUrl, saveWarningUrl;

    function showAlert(msg, type) {
        $(".alert").remove();
        type = type == "success" ? "alert-success" : "alert-error";
        $('.container[role="main"]').prepend('<div class="alert ' + type + '">' + '<a class="close" data-dismiss="alert" href="#">&times;</a>' + '<span class="flash-message-content">' + msg + "</span>" + "</div>");
        $(".alert").show()
    }

    function getType() {
        return $modal.attr("data-type") || ""
    }

    function showModal() {
        var type = getType(),
            getUrl = getWarningUrl.replace("__type__", type),
            $ul = $('<ul class="no-margin no-padding">');
        $btnSubmit.hide();
        $btnSubmit.addClass("disabled");
        $subTitle.html("");
        $.ajax({
            url: getUrl,
            data: {},
            type: "GET",
            beforeSend: function(event) {
                $loader = $modal.find(".loading").clone();
                $itemList.html($loader.show())
            },
            success: function(data) {
                fixturesData = data;
                var nrCategories = fixturesData.categories.length;
                $title.html(fixturesData.title);
                $subTitle.html(fixturesData.intro);
                for (var i = 0; i < nrCategories; i++) {
                    var el = fixturesData.categories[i],
                        $li = $("<li>");
                    if (i < nrCategories - 1) {
                        $li.attr("category-id", i);
                        if (el["reasons"].length > 1) {
                            $li.attr("has-reasons", "1")
                        } else {
                            $li.attr("has-reasons", "0");
                            $li.attr("reason-id", el["reasons"][0].id)
                        }
                    } else {
                        $li.attr("category-id", "text");
                        $li.attr("reason-id", el["reasons"][0].id)
                    }
                    $li.html(el["name"]);
                    $ul.append($li)
                }
                $itemList.html($ul);
                $otherTxtArea.attr("placeholder", fixturesData.placeholder_other);
                $btnSubmit.html(fixturesData.button_ok)
            },
            error: function(event) {
                showAlert("Error", "error")
            }
        })
    }

    function renderReasons(itemId) {
        var type = getType(),
            $div = $("<div>");
        $otherTxtArea.hide();
        $otherTxtArea.val("");
        $btnSubmit.addClass("disabled");
        $btnBack.html(fixturesData.button_back);
        $btnSubmit.html(fixturesData.button_ok);
        $btnBack.show();
        $btnSubmit.show();
        var category = fixturesData.categories[itemId];
        $subTitle.html("<strong>" + category["name"] + "</strong>");
        var reasons = category["reasons"];
        for (var i in reasons) {
            var $label = $('<label class="reason">');
            $label.html('<input type="radio" name="reason" value="' + reasons[i]["id"] + '"/>' + reasons[i]["text"]);
            $div.append($label)
        }
        $itemList.html($div.html())
    }

    function sendWarningReasonToModerator(reasonId) {
        var postData = {
            type: $modal.attr("data-type"),
            entity_id: $modal.attr("data-entity"),
            reason_id: reasonId
        };
        $modal.hide();
        $.ajax({
            url: saveWarningUrl,
            data: postData,
            type: "POST",
            success: function(data) {
                $modal.find(".close").click();
                showAlert(data.title + " " + data.content, "success");
                $body.scrollTop(0)
            },
            error: function(event) {
                hideModal();
                showAlert("Error", "error")
            }
        })
    }

    function sendWarningTextToModerator(reasonId) {
        $modal.hide();
        $.ajax({
            url: saveWarningUrl,
            data: {
                type: $modal.attr("data-type"),
                entity_id: $modal.attr("data-entity"),
                reason_id: reasonId,
                other_message: $otherTxtArea.val()
            },
            type: "POST",
            success: function(data) {
                $modal.find(".close").click();
                showAlert(data.title + " " + data.content, "success");
                $body.scrollTop(0)
            },
            error: function(event) {
                $modal.find(".close").click();
                showAlert("Error", "error")
            }
        })
    }

    function hideModal() {
        $title.html("");
        $subTitle.html("");
        $itemList.html("");
        $modal.removeAttr("data-type");
        $modal.removeAttr("data-entity");
        $otherTxtArea.hide();
        $otherTxtArea.attr("placeholder", "");
        $otherTxtArea.val("");
        $btnBack.hide();
        $btnSubmit.hide()
    }

    function doInit(config) {
        getWarningUrl = config.getWarningUrl || "";
        saveWarningUrl = config.saveWarningUrl || "";
        $("body").on("click", ".alert-flag", function(e) {
            var type = $(e.target).attr("data-type"),
                entity = $(e.target).attr("data-entity");
            $modal.attr("data-type", type);
            $modal.attr("data-entity", entity)
        });
        $modal.on("show", function(e) {
            showModal($(this).attr("data-type"))
        });
        $modal.on("hide", function(e) {
            hideModal()
        });
        $body.on("click", ".alert-moderator-list li", function(e) {
            if ($(e.target).attr("has-reasons") == "1") {
                renderReasons($(e.target).attr("category-id"))
            } else if ($(e.target).attr("category-id") == "text") {
                $otherTxtArea.show().focus();
                $btnSubmit.show()
            } else {
                sendWarningReasonToModerator($(e.target).attr("reason-id"))
            }
        });
        $body.on("focusout, keyup", ".other-reason", function(e) {
            var toggleSwitch = $(e.target).val().length <= 9 ? true : false;
            $btnSubmit.toggleClass("disabled", toggleSwitch)
        });
        $body.on("click", ".moderator-submit", function(e) {
            if (!$(e.target).hasClass("disabled")) {
                if ($(".other-reason:visible").length && $otherTxtArea.val().length > 9) {
                    var reasonId = $itemList.find('li[category-id="text"]').attr("reason-id");
                    reasonId ? sendWarningTextToModerator(reasonId) : e.preventDefault()
                } else {
                    var reasonId = $itemList.find('input[type="radio"]:checked').val();
                    reasonId ? sendWarningReasonToModerator(reasonId) : e.preventDefault()
                }
            }
        });
        $body.on("click", ".moderator-back", function(e) {
            $(e.target).hide();
            showModal()
        });
        $body.on("click", "label.reason", function(e) {
            $btnSubmit.removeClass("disabled")
        })
    }
    return {
        init: function(config) {
            doInit(config)
        }
    }
}(jQuery);
var Blablacar = Blablacar || {};
Blablacar.IDCheck = function($) {
    var idCheckFormContent = $("#id-check-form-content").find(">form>div"),
        idCheckButton = $("#id-check-form").find(".btn-validation"),
        idCheckFormWait = $("#verify-id-wait"),
        profileVerificationPageUrl = "",
        verifyIDStatusUrl = "",
        verifyIDIndexUrl = "",
        verifyIDStatusIntervalId, verifyIDStatusIntervalTime = 1e3,
        verifyIDStatusFinishCount = 60,
        reverseCount = 2;

    function doInit(config) {
        verifyIDStatusUrl = config.verifyIDStatusUrl || "";
        verifyIDIndexUrl = config.verifyIDIndexUrl || "";
        profileVerificationPageUrl = config.profileVerificationPageUrl || "";
        $("body").on("submit", "#id-check-form", function(e) {
            e.preventDefault();
            toggleButton();
            $.ajax({
                type: $(this).attr("method"),
                url: $(this).attr("action"),
                data: $(this).serialize(),
                dataType: "json"
            }).done(function(data) {
                if (typeof data.message !== "undefined") {
                    verifyIDStatusIntervalId = window.setInterval(checkValidationStatus, verifyIDStatusIntervalTime)
                }
            }).fail(function(jqXHR) {
                var parsedData = JSON.parse(jqXHR.responseText);
                idCheckFormContent.html(parsedData.form);
                toggleButton()
            })
        })
    }

    function checkValidationStatus() {
        $.ajax({
            type: $(this).attr("method"),
            url: verifyIDStatusUrl,
            dataType: "json",
            data: {
                finishCount: verifyIDStatusFinishCount
            },
            timeout: verifyIDStatusIntervalTime
        }).done(function(data) {
            if (typeof data.message !== "undefined") {
                if (data.isValid !== null) {
                    clearInterval(verifyIDStatusIntervalId);
                    if (data.isValid) {
                        window.location = profileVerificationPageUrl
                    } else {
                        window.location = verifyIDIndexUrl
                    }
                }
                if (reverseCount > 0) {
                    reverseCount--
                }
                if (reverseCount === 0) {
                    idCheckFormWait.removeClass("display-none")
                }
                if (verifyIDStatusFinishCount > 0) {
                    verifyIDStatusFinishCount--
                }
                if (verifyIDStatusFinishCount === 0) {
                    clearInterval(verifyIDStatusIntervalId);
                    window.location = profileVerificationPageUrl
                }
            }
        }).fail(function() {
            clearInterval(verifyIDStatusIntervalId);
            window.location = profileVerificationPageUrl
        })
    }

    function toggleButton() {
        if (idCheckButton.hasClass("disabled")) {
            idCheckButton.removeClass("disabled");
            idCheckButton.removeAttr("disabled");
            idCheckButton.find(".img-loader").addClass("hide")
        } else {
            idCheckButton.addClass("disabled");
            idCheckButton.attr("disabled", "disabled");
            idCheckButton.find(".img-loader").removeClass("hide")
        }
    }
    return {
        init: function(config) {
            doInit(config)
        }
    }
}(jQuery);
var Blablacar = Blablacar || {};
Blablacar.emailDomain = function($) {
    var verifyUrl = "",
        translationMessage = "",
        translationMessageWithSuggestion = "",
        tipContainerClass = ".invalid-email-tip-container",
        suggestedLink = tipContainerClass + " a",
        $inputEmail = null;

    function validateEmailDomain() {
        var inputVal = $inputEmail.val(),
            arondIndex = inputVal.indexOf("@"),
            tipContent = null,
            suggestedDomain = null,
            domain = null;
        if (arondIndex != -1) {
            domain = inputVal.slice(arondIndex + 1);
            if (domain) {
                $.ajax({
                    type: "GET",
                    url: verifyUrl + "?domain=" + domain
                }).done(function(data) {
                    if (data.id && data.correct_domain) {
                        tipContent = translationMessageWithSuggestion.replace(":email", data.correct_domain);
                        suggestedDomain = data.correct_domain;
                        showTip(tipContent, suggestedDomain)
                    } else {
                        removeTip()
                    }
                })
            }
        }
    }

    function showTip(content, suggestedDomain) {
        var containerMarkup = '<div class="alert no-icon rules-warning clearfix"><i class="bbc-icon2-exclamation-mark orange size26 pull-left no-margin-left margin-half-right" aria-hidden="true"></i><p class="overflow-hidden"> </p></div>',
            $tipContainer = $(containerMarkup).addClass(tipContainerClass.slice(1)).attr("data-suggested-domain", suggestedDomain),
            tipWidth = $inputEmail.outerWidth();
        removeTip();
        $tipContainer.css("width", tipWidth + "px").find("p").html(content);
        $inputEmail.addClass("info");
        if ($inputEmail.prop("id") == "profile_general_email") {
            var $afterItem = $inputEmail.parent().find("i");
            $tipContainer.addClass("pull-left");
            if ($afterItem.length == 1) {
                $afterItem.after($tipContainer)
            }
        }
        $inputEmail.after($tipContainer)
    }

    function removeTip() {
        $(tipContainerClass).remove();
        $inputEmail.removeClass("info")
    }

    function correctEmailDomain() {
        var inputVal = $inputEmail.val(),
            arondIndex = inputVal.indexOf("@"),
            emailPrefix = null,
            suggestedDomain = null;
        if (arondIndex != -1) {
            emailPrefix = inputVal.slice(0, arondIndex + 1);
            suggestedDomain = $(tipContainerClass).attr("data-suggested-domain");
            $inputEmail.val(emailPrefix + suggestedDomain);
            removeTip()
        }
    }

    function doInit(config) {
        verifyUrl = config.verifyUrl || "";
        translationMessage = config.translationMessage || "", translationMessageWithSuggestion = config.translationMessageWithSuggestion || "", $inputEmail = $(config.inputEmail) || null;
        $("body").on("change", config.inputEmail, validateEmailDomain);
        $("body").on("click", suggestedLink, correctEmailDomain)
    }
    return {
        init: function(config) {
            doInit(config)
        }
    }
}(jQuery);