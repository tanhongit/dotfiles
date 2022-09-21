var prefs = (function (gobject2, gtk4, gio2, glib2) {
    'use strict';

    const logger = (prefix) => (content) => log(`[extensions-sync] [${prefix}] ${content}`);
    const settingsFlagsToEnumList = (flags) => flags
        .toString(2)
        .split('')
        .reverse()
        .map((state) => parseInt(state, 10))
        .map((state, index) => {
        if (state === 1) {
            return index;
        }
    })
        .filter((value) => value !== undefined);

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    var ExtensionType;
    (function (ExtensionType) {
        ExtensionType[ExtensionType["SYSTEM"] = 1] = "SYSTEM";
        ExtensionType[ExtensionType["PER_USER"] = 2] = "PER_USER";
    })(ExtensionType || (ExtensionType = {}));
    var ExtensionState;
    (function (ExtensionState) {
        ExtensionState[ExtensionState["ENABLED"] = 1] = "ENABLED";
        ExtensionState[ExtensionState["DISABLED"] = 2] = "DISABLED";
        ExtensionState[ExtensionState["ERROR"] = 3] = "ERROR";
        ExtensionState[ExtensionState["OUT_OF_DATE"] = 4] = "OUT_OF_DATE";
        ExtensionState[ExtensionState["DOWNLOADING"] = 5] = "DOWNLOADING";
        ExtensionState[ExtensionState["INITIALIZED"] = 6] = "INITIALIZED";
        // Used as an error state for operations on unknown extensions,
        // should never be in a real extensionMeta object.
        ExtensionState[ExtensionState["UNINSTALLED"] = 99] = "UNINSTALLED";
    })(ExtensionState || (ExtensionState = {}));
    const getCurrentExtension = () => imports.misc.extensionUtils.getCurrentExtension();
    const getCurrentExtensionSettings = () => imports.misc.extensionUtils.getSettings();

    const PrefsTab = gobject2.registerClass({}, class PrefsTab extends gtk4.Box {
        _init(params) {
            const { title } = params, args = __rest(params, ["title"]);
            this.title = title;
            this.extension = getCurrentExtension();
            this.settings = getCurrentExtensionSettings();
            super._init(args);
        }
        attach(tab) {
            tab.append_page(this, new gtk4.Label({
                label: this.title,
            }));
            tab.get_page(this).tabExpand = true;
        }
    });

    const OtherPrefs = gobject2.registerClass({}, class OtherPrefs extends PrefsTab {
        _init() {
            super._init({
                title: 'Other Settings',
                orientation: gtk4.Orientation.VERTICAL,
                marginTop: 24,
                marginBottom: 24,
                marginStart: 12,
                marginEnd: 12,
            });
            this.createShowTrayIconSetting();
            this.createShowNotificationsSetting();
        }
        createShowTrayIconSetting() {
            const showTrayIcon = this.settings.get_boolean('show-tray-icon');
            this.createSetting('Show Tray Icon', 'Controls the visibility of the tray icon.', showTrayIcon, (state) => {
                this.settings.set_boolean('show-tray-icon', state);
            });
        }
        createShowNotificationsSetting() {
            const showNotifications = this.settings.get_boolean('show-notifications');
            this.createSetting('Show Notifications', 'Controls the visibility of the notifications.', showNotifications, (state) => {
                this.settings.set_boolean('show-notifications', state);
            });
        }
        createSetting(label, description, initialSwitchValue, onStateSet) {
            const row = new gtk4.ListBoxRow({
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.FILL,
                widthRequest: 100,
                activatable: true,
            });
            const rowContainer = new gtk4.Box({
                marginTop: 24,
                marginBottom: 24,
                marginStart: 15,
                marginEnd: 15,
                widthRequest: 100,
                orientation: gtk4.Orientation.HORIZONTAL,
            });
            const rowLabelContainer = new gtk4.Box({
                orientation: gtk4.Orientation.VERTICAL,
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.FILL,
                hexpand: true,
                vexpand: true,
            });
            rowLabelContainer.append(new gtk4.Label({
                label,
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
            }));
            rowLabelContainer.append(new gtk4.Label({
                label: description,
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
                cssClasses: ['dim-label', 'setting-description'],
            }));
            const rowSwitch = new gtk4.Switch({
                halign: gtk4.Align.END,
                valign: gtk4.Align.CENTER,
                active: initialSwitchValue,
            });
            rowSwitch.connect('state-set', (_, state) => {
                onStateSet(state);
            });
            rowContainer.append(rowLabelContainer);
            rowContainer.append(rowSwitch);
            row.set_child(rowContainer);
            this.append(row);
        }
    });

    var SyncOperationStatus;
    (function (SyncOperationStatus) {
        SyncOperationStatus[SyncOperationStatus["SUCCESS"] = 0] = "SUCCESS";
        SyncOperationStatus[SyncOperationStatus["FAIL"] = 1] = "FAIL";
    })(SyncOperationStatus || (SyncOperationStatus = {}));
    var SyncEvent;
    (function (SyncEvent) {
        SyncEvent["SAVE"] = "SAVE";
        SyncEvent["SAVE_FINISHED"] = "SAVE_FINISHED";
        SyncEvent["READ"] = "READ";
        SyncEvent["READ_FINISHED"] = "READ_FINISHED";
    })(SyncEvent || (SyncEvent = {}));
    var SyncProviderType;
    (function (SyncProviderType) {
        SyncProviderType[SyncProviderType["GITHUB"] = 0] = "GITHUB";
        SyncProviderType[SyncProviderType["GITLAB"] = 1] = "GITLAB";
        SyncProviderType[SyncProviderType["LOCAL"] = 2] = "LOCAL";
    })(SyncProviderType || (SyncProviderType = {}));

    const ProviderPrefs = gobject2.registerClass({}, class ProviderPrefs extends PrefsTab {
        _init() {
            super._init({
                title: 'Provider',
                orientation: gtk4.Orientation.VERTICAL,
                marginTop: 24,
                marginBottom: 24,
                marginStart: 12,
                marginEnd: 12,
            });
            const providerSelectionContainer = new gtk4.Box({
                marginTop: 24,
                marginBottom: 24,
                marginStart: 15,
                marginEnd: 15,
                orientation: gtk4.Orientation.VERTICAL,
            });
            providerSelectionContainer.append(new gtk4.Label({
                label: 'Provider',
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
                marginBottom: 12,
            }));
            const providerSelectionCombo = new gtk4.ComboBoxText({
                marginBottom: 12,
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.FILL,
            });
            providerSelectionCombo.insert(0, 'Github', 'Github');
            providerSelectionCombo.insert(1, 'Gitlab', 'Gitlab');
            providerSelectionCombo.insert(2, 'Local', 'Local');
            const activeProvider = this.settings.get_enum('provider');
            providerSelectionCombo.set_active(activeProvider);
            providerSelectionCombo.connect('changed', () => {
                const newProvider = providerSelectionCombo.get_active();
                this.githubSettings.hide();
                this.gitlabSettings.hide();
                this.localSettings.hide();
                if (newProvider === SyncProviderType.GITHUB) {
                    this.githubSettings.show();
                }
                else if (newProvider === SyncProviderType.GITLAB) {
                    this.gitlabSettings.show();
                }
                else if (newProvider === SyncProviderType.LOCAL) {
                    this.localSettings.show();
                }
                this.settings.set_enum('provider', newProvider);
            });
            providerSelectionContainer.append(providerSelectionCombo);
            this.append(providerSelectionContainer);
            this.githubSettings = this.createRemoteSettings('Gist Id', 'github-gist-id', 'github-user-token', activeProvider === 0);
            this.append(this.githubSettings);
            this.gitlabSettings = this.createRemoteSettings('Snippet Id', 'gitlab-snippet-id', 'gitlab-user-token', activeProvider === 1);
            this.append(this.gitlabSettings);
            this.localSettings = this.createLocalSettings(activeProvider === 2);
            this.append(this.localSettings);
        }
        createRemoteSettings(locationText, locationSettingKey, userTokenSettingKey, show) {
            const container = new gtk4.Box({
                orientation: gtk4.Orientation.VERTICAL,
                marginBottom: 10,
                marginStart: 15,
                marginEnd: 15,
            });
            const locationContainer = new gtk4.Box({
                orientation: gtk4.Orientation.VERTICAL,
            });
            locationContainer.append(new gtk4.Label({
                label: locationText,
                marginBottom: 6,
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
            }));
            const locationEntry = new gtk4.Entry({
                marginBottom: 24,
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.BASELINE,
            });
            locationEntry.set_text(this.settings.get_string(locationSettingKey));
            locationEntry.connect('changed', () => {
                this.settings.set_string(locationSettingKey, locationEntry.get_text());
            });
            locationContainer.append(locationEntry);
            container.append(locationContainer);
            const userTokenContainer = new gtk4.Box({
                orientation: gtk4.Orientation.VERTICAL,
            });
            userTokenContainer.append(new gtk4.Label({
                label: 'User Token',
                marginBottom: 6,
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
            }));
            const userTokenEntry = new gtk4.Entry({
                marginBottom: 24,
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.BASELINE,
            });
            userTokenEntry.set_text(this.settings.get_string(userTokenSettingKey));
            userTokenEntry.connect('changed', () => {
                this.settings.set_string(userTokenSettingKey, userTokenEntry.get_text());
            });
            userTokenContainer.append(userTokenEntry);
            container.append(userTokenContainer);
            if (show === false) {
                container.hide();
            }
            return container;
        }
        createLocalSettings(show) {
            const container = new gtk4.Box({
                orientation: gtk4.Orientation.VERTICAL,
                marginBottom: 10,
                marginStart: 15,
                marginEnd: 15,
            });
            const locationContainer = new gtk4.Box({
                orientation: gtk4.Orientation.VERTICAL,
            });
            locationContainer.append(new gtk4.Label({
                label: 'Backup File',
                marginBottom: 6,
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
            }));
            const backupFileUri = this.settings.get_string('backup-file-location');
            let buttonLabel = 'Select backup file location';
            if (backupFileUri) {
                const backupFile = gio2.File.new_for_uri(backupFileUri);
                if (backupFile.query_exists(null)) {
                    buttonLabel = backupFile.get_uri();
                }
            }
            const locationButton = new gtk4.Button({
                marginBottom: 24,
                halign: gtk4.Align.FILL,
                label: buttonLabel,
                valign: gtk4.Align.BASELINE,
            });
            locationButton.connect('clicked', () => {
                const dialog = new gtk4.FileChooserDialog({
                    title: 'Select backup file location',
                });
                dialog.set_action(gtk4.FileChooserAction.SAVE);
                dialog.set_select_multiple(false);
                dialog.set_current_folder(gio2.File.new_for_path(glib2.get_user_config_dir()));
                // Add the buttons and its return values
                dialog.add_button('Cancel', gtk4.ResponseType.CANCEL);
                dialog.add_button('OK', gtk4.ResponseType.OK);
                const filter = new gtk4.FileFilter();
                filter.add_pattern('*.json');
                dialog.set_filter(filter);
                dialog.set_transient_for(this.get_root());
                dialog.connect('response', (_, response) => {
                    if (response === gtk4.ResponseType.OK) {
                        const backupFile = dialog.get_file();
                        if (backupFile) {
                            if (!backupFile.query_exists(null)) {
                                backupFile.create(gio2.FileCreateFlags.PRIVATE, null);
                            }
                            locationButton.label = backupFile.get_uri();
                            this.settings.set_string('backup-file-location', backupFile.get_uri());
                        }
                    }
                    dialog.destroy();
                });
                dialog.show();
            });
            locationContainer.append(locationButton);
            container.append(locationContainer);
            if (show === false) {
                container.hide();
            }
            return container;
        }
    });

    var parser = {};

    var node2json = {};

    var util$4 = {};

    (function (exports) {
    const nameStartChar = ':A-Za-z_\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
    const nameChar = nameStartChar + '\\-.\\d\\u00B7\\u0300-\\u036F\\u203F-\\u2040';
    const nameRegexp = '[' + nameStartChar + '][' + nameChar + ']*';
    const regexName = new RegExp('^' + nameRegexp + '$');
    const getAllMatches = function(string, regex) {
      const matches = [];
      let match = regex.exec(string);
      while (match) {
        const allmatches = [];
        allmatches.startIndex = regex.lastIndex - match[0].length;
        const len = match.length;
        for (let index = 0; index < len; index++) {
          allmatches.push(match[index]);
        }
        matches.push(allmatches);
        match = regex.exec(string);
      }
      return matches;
    };
    const isName = function(string) {
      const match = regexName.exec(string);
      return !(match === null || typeof match === 'undefined');
    };
    exports.isExist = function(v) {
      return typeof v !== 'undefined';
    };
    exports.isEmptyObject = function(obj) {
      return Object.keys(obj).length === 0;
    };
    exports.merge = function(target, a, arrayMode) {
      if (a) {
        const keys = Object.keys(a);
        const len = keys.length;
        for (let i = 0; i < len; i++) {
          if (arrayMode === 'strict') {
            target[keys[i]] = [ a[keys[i]] ];
          } else {
            target[keys[i]] = a[keys[i]];
          }
        }
      }
    };
    exports.getValue = function(v) {
      if (exports.isExist(v)) {
        return v;
      } else {
        return '';
      }
    };
    exports.buildOptions = function(options, defaultOptions, props) {
      let newOptions = {};
      if (!options) {
        return defaultOptions;
      }
      for (let i = 0; i < props.length; i++) {
        if (options[props[i]] !== undefined) {
          newOptions[props[i]] = options[props[i]];
        } else {
          newOptions[props[i]] = defaultOptions[props[i]];
        }
      }
      return newOptions;
    };
    exports.isTagNameInArrayMode = function (tagName, arrayMode, parentTagName) {
      if (arrayMode === false) {
        return false;
      } else if (arrayMode instanceof RegExp) {
        return arrayMode.test(tagName);
      } else if (typeof arrayMode === 'function') {
        return !!arrayMode(tagName, parentTagName);
      }
      return arrayMode === "strict";
    };
    exports.isName = isName;
    exports.getAllMatches = getAllMatches;
    exports.nameRegexp = nameRegexp;
    }(util$4));

    const util$3 = util$4;
    const convertToJson = function(node, options, parentTagName) {
      const jObj = {};
      if (!options.alwaysCreateTextNode && (!node.child || util$3.isEmptyObject(node.child)) && (!node.attrsMap || util$3.isEmptyObject(node.attrsMap))) {
        return util$3.isExist(node.val) ? node.val : '';
      }
      if (util$3.isExist(node.val) && !(typeof node.val === 'string' && (node.val === '' || node.val === options.cdataPositionChar))) {
        const asArray = util$3.isTagNameInArrayMode(node.tagname, options.arrayMode, parentTagName);
        jObj[options.textNodeName] = asArray ? [node.val] : node.val;
      }
      util$3.merge(jObj, node.attrsMap, options.arrayMode);
      const keys = Object.keys(node.child);
      for (let index = 0; index < keys.length; index++) {
        const tagName = keys[index];
        if (node.child[tagName] && node.child[tagName].length > 1) {
          jObj[tagName] = [];
          for (let tag in node.child[tagName]) {
            if (node.child[tagName].hasOwnProperty(tag)) {
              jObj[tagName].push(convertToJson(node.child[tagName][tag], options, tagName));
            }
          }
        } else {
          const result = convertToJson(node.child[tagName][0], options, tagName);
          const asArray = (options.arrayMode === true && typeof result === 'object') || util$3.isTagNameInArrayMode(tagName, options.arrayMode, parentTagName);
          jObj[tagName] = asArray ? [result] : result;
        }
      }
      return jObj;
    };
    node2json.convertToJson = convertToJson;

    var xmlstr2xmlnode = {};

    var xmlNode$1 = function(tagname, parent, val) {
      this.tagname = tagname;
      this.parent = parent;
      this.child = {};
      this.attrsMap = {};
      this.val = val;
      this.addChild = function(child) {
        if (Array.isArray(this.child[child.tagname])) {
          this.child[child.tagname].push(child);
        } else {
          this.child[child.tagname] = [child];
        }
      };
    };

    const hexRegex = /^[-+]?0x[a-fA-F0-9]+$/;
    const numRegex = /^([\-\+])?(0*)(\.[0-9]+([eE]\-?[0-9]+)?|[0-9]+(\.[0-9]+([eE]\-?[0-9]+)?)?)$/;
    const consider = {
        hex :  true,
        leadingZeros: true,
        decimalPoint: "\.",
    };
    function toNumber$1(str, options = {}){
        options = Object.assign({}, consider, options );
        if(!str || typeof str !== "string" ) return str;
        let trimmedStr  = str.trim();
        if(options.skipLike !== undefined && options.skipLike.test(trimmedStr)) return str;
        else if (options.hex && hexRegex.test(trimmedStr)) {
            return Number.parseInt(trimmedStr, 16);
        }else {
            const match = numRegex.exec(trimmedStr);
            if(match){
                match[1];
                const leadingZeros = match[2];
                const num = match[3];
                match[4] || match[6];
                if(leadingZeros.length === 1 && num[0] === ".") return Number(str);
                else if(!options.leadingZeros && leadingZeros.length > 0) return str;
                else return Number(trimmedStr);
            }else {
                return str;
            }
        }
    }
    var strnum = toNumber$1;

    const util$2 = util$4;
    const buildOptions$3 = util$4.buildOptions;
    const xmlNode = xmlNode$1;
    const toNumber = strnum;
    '<((!\\[CDATA\\[([\\s\\S]*?)(]]>))|((NAME:)?(NAME))([^>]*)>|((\\/)(NAME)\\s*>))([^<]*)'
      .replace(/NAME/g, util$2.nameRegexp);
    if (!Number.parseInt && window.parseInt) {
      Number.parseInt = window.parseInt;
    }
    if (!Number.parseFloat && window.parseFloat) {
      Number.parseFloat = window.parseFloat;
    }
    const defaultOptions$2 = {
      attributeNamePrefix: '@_',
      attrNodeName: false,
      textNodeName: '#text',
      ignoreAttributes: true,
      ignoreNameSpace: false,
      allowBooleanAttributes: false,
      parseNodeValue: true,
      parseAttributeValue: false,
      arrayMode: false,
      trimValues: true,
      cdataTagName: false,
      cdataPositionChar: '\\c',
      numParseOptions: {
        hex: true,
        leadingZeros: true
      },
      tagValueProcessor: function(a, tagName) {
        return a;
      },
      attrValueProcessor: function(a, attrName) {
        return a;
      },
      stopNodes: [],
      alwaysCreateTextNode: false
    };
    xmlstr2xmlnode.defaultOptions = defaultOptions$2;
    const props$2 = [
      'attributeNamePrefix',
      'attrNodeName',
      'textNodeName',
      'ignoreAttributes',
      'ignoreNameSpace',
      'allowBooleanAttributes',
      'parseNodeValue',
      'parseAttributeValue',
      'arrayMode',
      'trimValues',
      'cdataTagName',
      'cdataPositionChar',
      'tagValueProcessor',
      'attrValueProcessor',
      'parseTrueNumberOnly',
      'numParseOptions',
      'stopNodes',
      'alwaysCreateTextNode'
    ];
    xmlstr2xmlnode.props = props$2;
    function processTagValue(tagName, val, options) {
      if (val) {
        if (options.trimValues) {
          val = val.trim();
        }
        val = options.tagValueProcessor(val, tagName);
        val = parseValue(val, options.parseNodeValue, options.numParseOptions);
      }
      return val;
    }
    function resolveNameSpace(tagname, options) {
      if (options.ignoreNameSpace) {
        const tags = tagname.split(':');
        const prefix = tagname.charAt(0) === '/' ? '/' : '';
        if (tags[0] === 'xmlns') {
          return '';
        }
        if (tags.length === 2) {
          tagname = prefix + tags[1];
        }
      }
      return tagname;
    }
    function parseValue(val, shouldParse, options) {
      if (shouldParse && typeof val === 'string') {
        const newval = val.trim();
        if(newval === 'true' ) return true;
        else if(newval === 'false' ) return false;
        else return toNumber(val, options);
      } else {
        if (util$2.isExist(val)) {
          return val;
        } else {
          return '';
        }
      }
    }
    const attrsRegx = new RegExp('([^\\s=]+)\\s*(=\\s*([\'"])(.*?)\\3)?', 'g');
    function buildAttributesMap(attrStr, options) {
      if (!options.ignoreAttributes && typeof attrStr === 'string') {
        attrStr = attrStr.replace(/\r?\n/g, ' ');
        const matches = util$2.getAllMatches(attrStr, attrsRegx);
        const len = matches.length;
        const attrs = {};
        for (let i = 0; i < len; i++) {
          const attrName = resolveNameSpace(matches[i][1], options);
          if (attrName.length) {
            if (matches[i][4] !== undefined) {
              if (options.trimValues) {
                matches[i][4] = matches[i][4].trim();
              }
              matches[i][4] = options.attrValueProcessor(matches[i][4], attrName);
              attrs[options.attributeNamePrefix + attrName] = parseValue(
                matches[i][4],
                options.parseAttributeValue,
                options.numParseOptions
              );
            } else if (options.allowBooleanAttributes) {
              attrs[options.attributeNamePrefix + attrName] = true;
            }
          }
        }
        if (!Object.keys(attrs).length) {
          return;
        }
        if (options.attrNodeName) {
          const attrCollection = {};
          attrCollection[options.attrNodeName] = attrs;
          return attrCollection;
        }
        return attrs;
      }
    }
    const getTraversalObj = function(xmlData, options) {
      xmlData = xmlData.replace(/\r\n?/g, "\n");
      options = buildOptions$3(options, defaultOptions$2, props$2);
      const xmlObj = new xmlNode('!xml');
      let currentNode = xmlObj;
      let textData = "";
      for(let i=0; i< xmlData.length; i++){
        const ch = xmlData[i];
        if(ch === '<'){
          if( xmlData[i+1] === '/') {
            const closeIndex = findClosingIndex(xmlData, ">", i, "Closing Tag is not closed.");
            let tagName = xmlData.substring(i+2,closeIndex).trim();
            if(options.ignoreNameSpace){
              const colonIndex = tagName.indexOf(":");
              if(colonIndex !== -1){
                tagName = tagName.substr(colonIndex+1);
              }
            }
            if(currentNode){
              if(currentNode.val){
                currentNode.val = util$2.getValue(currentNode.val) + '' + processTagValue(tagName, textData , options);
              }else {
                currentNode.val = processTagValue(tagName, textData , options);
              }
            }
            if (options.stopNodes.length && options.stopNodes.includes(currentNode.tagname)) {
              currentNode.child = [];
              if (currentNode.attrsMap == undefined) { currentNode.attrsMap = {};}
              currentNode.val = xmlData.substr(currentNode.startIndex + 1, i - currentNode.startIndex - 1);
            }
            currentNode = currentNode.parent;
            textData = "";
            i = closeIndex;
          } else if( xmlData[i+1] === '?') {
            i = findClosingIndex(xmlData, "?>", i, "Pi Tag is not closed.");
          } else if(xmlData.substr(i + 1, 3) === '!--') {
            i = findClosingIndex(xmlData, "-->", i, "Comment is not closed.");
          } else if( xmlData.substr(i + 1, 2) === '!D') {
            const closeIndex = findClosingIndex(xmlData, ">", i, "DOCTYPE is not closed.");
            const tagExp = xmlData.substring(i, closeIndex);
            if(tagExp.indexOf("[") >= 0){
              i = xmlData.indexOf("]>", i) + 1;
            }else {
              i = closeIndex;
            }
          }else if(xmlData.substr(i + 1, 2) === '![') {
            const closeIndex = findClosingIndex(xmlData, "]]>", i, "CDATA is not closed.") - 2;
            const tagExp = xmlData.substring(i + 9,closeIndex);
            if(textData){
              currentNode.val = util$2.getValue(currentNode.val) + '' + processTagValue(currentNode.tagname, textData , options);
              textData = "";
            }
            if (options.cdataTagName) {
              const childNode = new xmlNode(options.cdataTagName, currentNode, tagExp);
              currentNode.addChild(childNode);
              currentNode.val = util$2.getValue(currentNode.val) + options.cdataPositionChar;
              if (tagExp) {
                childNode.val = tagExp;
              }
            } else {
              currentNode.val = (currentNode.val || '') + (tagExp || '');
            }
            i = closeIndex + 2;
          }else {
            const result = closingIndexForOpeningTag(xmlData, i+1);
            let tagExp = result.data;
            const closeIndex = result.index;
            const separatorIndex = tagExp.indexOf(" ");
            let tagName = tagExp;
            let shouldBuildAttributesMap = true;
            if(separatorIndex !== -1){
              tagName = tagExp.substr(0, separatorIndex).replace(/\s\s*$/, '');
              tagExp = tagExp.substr(separatorIndex + 1);
            }
            if(options.ignoreNameSpace){
              const colonIndex = tagName.indexOf(":");
              if(colonIndex !== -1){
                tagName = tagName.substr(colonIndex+1);
                shouldBuildAttributesMap = tagName !== result.data.substr(colonIndex + 1);
              }
            }
            if (currentNode && textData) {
              if(currentNode.tagname !== '!xml'){
                currentNode.val = util$2.getValue(currentNode.val) + '' + processTagValue( currentNode.tagname, textData, options);
              }
            }
            if(tagExp.length > 0 && tagExp.lastIndexOf("/") === tagExp.length - 1){
              if(tagName[tagName.length - 1] === "/"){
                tagName = tagName.substr(0, tagName.length - 1);
                tagExp = tagName;
              }else {
                tagExp = tagExp.substr(0, tagExp.length - 1);
              }
              const childNode = new xmlNode(tagName, currentNode, '');
              if(tagName !== tagExp){
                childNode.attrsMap = buildAttributesMap(tagExp, options);
              }
              currentNode.addChild(childNode);
            }else {
              const childNode = new xmlNode( tagName, currentNode );
              if (options.stopNodes.length && options.stopNodes.includes(childNode.tagname)) {
                childNode.startIndex=closeIndex;
              }
              if(tagName !== tagExp && shouldBuildAttributesMap){
                childNode.attrsMap = buildAttributesMap(tagExp, options);
              }
              currentNode.addChild(childNode);
              currentNode = childNode;
            }
            textData = "";
            i = closeIndex;
          }
        }else {
          textData += xmlData[i];
        }
      }
      return xmlObj;
    };
    function closingIndexForOpeningTag(data, i){
      let attrBoundary;
      let tagExp = "";
      for (let index = i; index < data.length; index++) {
        let ch = data[index];
        if (attrBoundary) {
            if (ch === attrBoundary) attrBoundary = "";
        } else if (ch === '"' || ch === "'") {
            attrBoundary = ch;
        } else if (ch === '>') {
            return {
              data: tagExp,
              index: index
            }
        } else if (ch === '\t') {
          ch = " ";
        }
        tagExp += ch;
      }
    }
    function findClosingIndex(xmlData, str, i, errMsg){
      const closingIndex = xmlData.indexOf(str, i);
      if(closingIndex === -1){
        throw new Error(errMsg)
      }else {
        return closingIndex + str.length - 1;
      }
    }
    xmlstr2xmlnode.getTraversalObj = getTraversalObj;

    var validator = {};

    const util$1 = util$4;
    const defaultOptions$1 = {
      allowBooleanAttributes: false,
    };
    const props$1 = ['allowBooleanAttributes'];
    validator.validate = function (xmlData, options) {
      options = util$1.buildOptions(options, defaultOptions$1, props$1);
      const tags = [];
      let tagFound = false;
      let reachedRoot = false;
      if (xmlData[0] === '\ufeff') {
        xmlData = xmlData.substr(1);
      }
      for (let i = 0; i < xmlData.length; i++) {
        if (xmlData[i] === '<' && xmlData[i+1] === '?') {
          i+=2;
          i = readPI(xmlData,i);
          if (i.err) return i;
        }else if (xmlData[i] === '<') {
          let tagStartPos = i;
          i++;
          if (xmlData[i] === '!') {
            i = readCommentAndCDATA(xmlData, i);
            continue;
          } else {
            let closingTag = false;
            if (xmlData[i] === '/') {
              closingTag = true;
              i++;
            }
            let tagName = '';
            for (; i < xmlData.length &&
              xmlData[i] !== '>' &&
              xmlData[i] !== ' ' &&
              xmlData[i] !== '\t' &&
              xmlData[i] !== '\n' &&
              xmlData[i] !== '\r'; i++
            ) {
              tagName += xmlData[i];
            }
            tagName = tagName.trim();
            if (tagName[tagName.length - 1] === '/') {
              tagName = tagName.substring(0, tagName.length - 1);
              i--;
            }
            if (!validateTagName(tagName)) {
              let msg;
              if (tagName.trim().length === 0) {
                msg = "Invalid space after '<'.";
              } else {
                msg = "Tag '"+tagName+"' is an invalid name.";
              }
              return getErrorObject('InvalidTag', msg, getLineNumberForPosition(xmlData, i));
            }
            const result = readAttributeStr(xmlData, i);
            if (result === false) {
              return getErrorObject('InvalidAttr', "Attributes for '"+tagName+"' have open quote.", getLineNumberForPosition(xmlData, i));
            }
            let attrStr = result.value;
            i = result.index;
            if (attrStr[attrStr.length - 1] === '/') {
              const attrStrStart = i - attrStr.length;
              attrStr = attrStr.substring(0, attrStr.length - 1);
              const isValid = validateAttributeString(attrStr, options);
              if (isValid === true) {
                tagFound = true;
              } else {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, attrStrStart + isValid.err.line));
              }
            } else if (closingTag) {
              if (!result.tagClosed) {
                return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' doesn't have proper closing.", getLineNumberForPosition(xmlData, i));
              } else if (attrStr.trim().length > 0) {
                return getErrorObject('InvalidTag', "Closing tag '"+tagName+"' can't have attributes or invalid starting.", getLineNumberForPosition(xmlData, tagStartPos));
              } else {
                const otg = tags.pop();
                if (tagName !== otg.tagName) {
                  let openPos = getLineNumberForPosition(xmlData, otg.tagStartPos);
                  return getErrorObject('InvalidTag',
                    "Expected closing tag '"+otg.tagName+"' (opened in line "+openPos.line+", col "+openPos.col+") instead of closing tag '"+tagName+"'.",
                    getLineNumberForPosition(xmlData, tagStartPos));
                }
                if (tags.length == 0) {
                  reachedRoot = true;
                }
              }
            } else {
              const isValid = validateAttributeString(attrStr, options);
              if (isValid !== true) {
                return getErrorObject(isValid.err.code, isValid.err.msg, getLineNumberForPosition(xmlData, i - attrStr.length + isValid.err.line));
              }
              if (reachedRoot === true) {
                return getErrorObject('InvalidXml', 'Multiple possible root nodes found.', getLineNumberForPosition(xmlData, i));
              } else {
                tags.push({tagName, tagStartPos});
              }
              tagFound = true;
            }
            for (i++; i < xmlData.length; i++) {
              if (xmlData[i] === '<') {
                if (xmlData[i + 1] === '!') {
                  i++;
                  i = readCommentAndCDATA(xmlData, i);
                  continue;
                } else if (xmlData[i+1] === '?') {
                  i = readPI(xmlData, ++i);
                  if (i.err) return i;
                } else {
                  break;
                }
              } else if (xmlData[i] === '&') {
                const afterAmp = validateAmpersand(xmlData, i);
                if (afterAmp == -1)
                  return getErrorObject('InvalidChar', "char '&' is not expected.", getLineNumberForPosition(xmlData, i));
                i = afterAmp;
              }
            }
            if (xmlData[i] === '<') {
              i--;
            }
          }
        } else {
          if (xmlData[i] === ' ' || xmlData[i] === '\t' || xmlData[i] === '\n' || xmlData[i] === '\r') {
            continue;
          }
          return getErrorObject('InvalidChar', "char '"+xmlData[i]+"' is not expected.", getLineNumberForPosition(xmlData, i));
        }
      }
      if (!tagFound) {
        return getErrorObject('InvalidXml', 'Start tag expected.', 1);
      }else if (tags.length == 1) {
          return getErrorObject('InvalidTag', "Unclosed tag '"+tags[0].tagName+"'.", getLineNumberForPosition(xmlData, tags[0].tagStartPos));
      }else if (tags.length > 0) {
          return getErrorObject('InvalidXml', "Invalid '"+
              JSON.stringify(tags.map(t => t.tagName), null, 4).replace(/\r?\n/g, '')+
              "' found.", {line: 1, col: 1});
      }
      return true;
    };
    function readPI(xmlData, i) {
      const start = i;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] == '?' || xmlData[i] == ' ') {
          const tagname = xmlData.substr(start, i - start);
          if (i > 5 && tagname === 'xml') {
            return getErrorObject('InvalidXml', 'XML declaration allowed only at the start of the document.', getLineNumberForPosition(xmlData, i));
          } else if (xmlData[i] == '?' && xmlData[i + 1] == '>') {
            i++;
            break;
          } else {
            continue;
          }
        }
      }
      return i;
    }
    function readCommentAndCDATA(xmlData, i) {
      if (xmlData.length > i + 5 && xmlData[i + 1] === '-' && xmlData[i + 2] === '-') {
        for (i += 3; i < xmlData.length; i++) {
          if (xmlData[i] === '-' && xmlData[i + 1] === '-' && xmlData[i + 2] === '>') {
            i += 2;
            break;
          }
        }
      } else if (
        xmlData.length > i + 8 &&
        xmlData[i + 1] === 'D' &&
        xmlData[i + 2] === 'O' &&
        xmlData[i + 3] === 'C' &&
        xmlData[i + 4] === 'T' &&
        xmlData[i + 5] === 'Y' &&
        xmlData[i + 6] === 'P' &&
        xmlData[i + 7] === 'E'
      ) {
        let angleBracketsCount = 1;
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === '<') {
            angleBracketsCount++;
          } else if (xmlData[i] === '>') {
            angleBracketsCount--;
            if (angleBracketsCount === 0) {
              break;
            }
          }
        }
      } else if (
        xmlData.length > i + 9 &&
        xmlData[i + 1] === '[' &&
        xmlData[i + 2] === 'C' &&
        xmlData[i + 3] === 'D' &&
        xmlData[i + 4] === 'A' &&
        xmlData[i + 5] === 'T' &&
        xmlData[i + 6] === 'A' &&
        xmlData[i + 7] === '['
      ) {
        for (i += 8; i < xmlData.length; i++) {
          if (xmlData[i] === ']' && xmlData[i + 1] === ']' && xmlData[i + 2] === '>') {
            i += 2;
            break;
          }
        }
      }
      return i;
    }
    const doubleQuote = '"';
    const singleQuote = "'";
    function readAttributeStr(xmlData, i) {
      let attrStr = '';
      let startChar = '';
      let tagClosed = false;
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === doubleQuote || xmlData[i] === singleQuote) {
          if (startChar === '') {
            startChar = xmlData[i];
          } else if (startChar !== xmlData[i]) ; else {
            startChar = '';
          }
        } else if (xmlData[i] === '>') {
          if (startChar === '') {
            tagClosed = true;
            break;
          }
        }
        attrStr += xmlData[i];
      }
      if (startChar !== '') {
        return false;
      }
      return {
        value: attrStr,
        index: i,
        tagClosed: tagClosed
      };
    }
    const validAttrStrRegxp = new RegExp('(\\s*)([^\\s=]+)(\\s*=)?(\\s*([\'"])(([\\s\\S])*?)\\5)?', 'g');
    function validateAttributeString(attrStr, options) {
      const matches = util$1.getAllMatches(attrStr, validAttrStrRegxp);
      const attrNames = {};
      for (let i = 0; i < matches.length; i++) {
        if (matches[i][1].length === 0) {
          return getErrorObject('InvalidAttr', "Attribute '"+matches[i][2]+"' has no space in starting.", getPositionFromMatch(matches[i]))
        } else if (matches[i][3] === undefined && !options.allowBooleanAttributes) {
          return getErrorObject('InvalidAttr', "boolean attribute '"+matches[i][2]+"' is not allowed.", getPositionFromMatch(matches[i]));
        }
        const attrName = matches[i][2];
        if (!validateAttrName(attrName)) {
          return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is an invalid name.", getPositionFromMatch(matches[i]));
        }
        if (!attrNames.hasOwnProperty(attrName)) {
          attrNames[attrName] = 1;
        } else {
          return getErrorObject('InvalidAttr', "Attribute '"+attrName+"' is repeated.", getPositionFromMatch(matches[i]));
        }
      }
      return true;
    }
    function validateNumberAmpersand(xmlData, i) {
      let re = /\d/;
      if (xmlData[i] === 'x') {
        i++;
        re = /[\da-fA-F]/;
      }
      for (; i < xmlData.length; i++) {
        if (xmlData[i] === ';')
          return i;
        if (!xmlData[i].match(re))
          break;
      }
      return -1;
    }
    function validateAmpersand(xmlData, i) {
      i++;
      if (xmlData[i] === ';')
        return -1;
      if (xmlData[i] === '#') {
        i++;
        return validateNumberAmpersand(xmlData, i);
      }
      let count = 0;
      for (; i < xmlData.length; i++, count++) {
        if (xmlData[i].match(/\w/) && count < 20)
          continue;
        if (xmlData[i] === ';')
          break;
        return -1;
      }
      return i;
    }
    function getErrorObject(code, message, lineNumber) {
      return {
        err: {
          code: code,
          msg: message,
          line: lineNumber.line || lineNumber,
          col: lineNumber.col,
        },
      };
    }
    function validateAttrName(attrName) {
      return util$1.isName(attrName);
    }
    function validateTagName(tagname) {
      return util$1.isName(tagname) ;
    }
    function getLineNumberForPosition(xmlData, index) {
      const lines = xmlData.substring(0, index).split(/\r?\n/);
      return {
        line: lines.length,
        col: lines[lines.length - 1].length + 1
      };
    }
    function getPositionFromMatch(match) {
      return match.startIndex + match[1].length;
    }

    var nimndata = {};

    const char = function(a) {
      return String.fromCharCode(a);
    };
    const chars = {
      nilChar: char(176),
      missingChar: char(201),
      nilPremitive: char(175),
      missingPremitive: char(200),
      emptyChar: char(178),
      emptyValue: char(177),
      boundryChar: char(179),
      objStart: char(198),
      arrStart: char(204),
      arrayEnd: char(185),
    };
    const charsArr = [
      chars.nilChar,
      chars.nilPremitive,
      chars.missingChar,
      chars.missingPremitive,
      chars.boundryChar,
      chars.emptyChar,
      chars.emptyValue,
      chars.arrayEnd,
      chars.objStart,
      chars.arrStart,
    ];
    const _e = function(node, e_schema, options) {
      if (typeof e_schema === 'string') {
        if (node && node[0] && node[0].val !== undefined) {
          return getValue(node[0].val);
        } else {
          return getValue(node);
        }
      } else {
        const hasValidData = hasData(node);
        if (hasValidData === true) {
          let str = '';
          if (Array.isArray(e_schema)) {
            str += chars.arrStart;
            const itemSchema = e_schema[0];
            const arr_len = node.length;
            if (typeof itemSchema === 'string') {
              for (let arr_i = 0; arr_i < arr_len; arr_i++) {
                const r = getValue(node[arr_i].val);
                str = processValue(str, r);
              }
            } else {
              for (let arr_i = 0; arr_i < arr_len; arr_i++) {
                const r = _e(node[arr_i], itemSchema, options);
                str = processValue(str, r);
              }
            }
            str += chars.arrayEnd;
          } else {
            str += chars.objStart;
            const keys = Object.keys(e_schema);
            if (Array.isArray(node)) {
              node = node[0];
            }
            for (let i in keys) {
              const key = keys[i];
              let r;
              if (!options.ignoreAttributes && node.attrsMap && node.attrsMap[key]) {
                r = _e(node.attrsMap[key], e_schema[key], options);
              } else if (key === options.textNodeName) {
                r = _e(node.val, e_schema[key], options);
              } else {
                r = _e(node.child[key], e_schema[key], options);
              }
              str = processValue(str, r);
            }
          }
          return str;
        } else {
          return hasValidData;
        }
      }
    };
    const getValue = function(a ) {
      switch (a) {
        case undefined:
          return chars.missingPremitive;
        case null:
          return chars.nilPremitive;
        case '':
          return chars.emptyValue;
        default:
          return a;
      }
    };
    const processValue = function(str, r) {
      if (!isAppChar(r[0]) && !isAppChar(str[str.length - 1])) {
        str += chars.boundryChar;
      }
      return str + r;
    };
    const isAppChar = function(ch) {
      return charsArr.indexOf(ch) !== -1;
    };
    function hasData(jObj) {
      if (jObj === undefined) {
        return chars.missingChar;
      } else if (jObj === null) {
        return chars.nilChar;
      } else if (
        jObj.child &&
        Object.keys(jObj.child).length === 0 &&
        (!jObj.attrsMap || Object.keys(jObj.attrsMap).length === 0)
      ) {
        return chars.emptyChar;
      } else {
        return true;
      }
    }
    const x2j$1 = xmlstr2xmlnode;
    const buildOptions$2 = util$4.buildOptions;
    const convert2nimn = function(node, e_schema, options) {
      options = buildOptions$2(options, x2j$1.defaultOptions, x2j$1.props);
      return _e(node, e_schema, options);
    };
    nimndata.convert2nimn = convert2nimn;

    var node2json_str = {};

    const util = util$4;
    const buildOptions$1 = util$4.buildOptions;
    const x2j = xmlstr2xmlnode;
    const convertToJsonString = function(node, options) {
      options = buildOptions$1(options, x2j.defaultOptions, x2j.props);
      options.indentBy = options.indentBy || '';
      return _cToJsonStr(node, options);
    };
    const _cToJsonStr = function(node, options, level) {
      let jObj = '{';
      const keys = Object.keys(node.child);
      for (let index = 0; index < keys.length; index++) {
        const tagname = keys[index];
        if (node.child[tagname] && node.child[tagname].length > 1) {
          jObj += '"' + tagname + '" : [ ';
          for (let tag in node.child[tagname]) {
            jObj += _cToJsonStr(node.child[tagname][tag], options) + ' , ';
          }
          jObj = jObj.substr(0, jObj.length - 1) + ' ] ';
        } else {
          jObj += '"' + tagname + '" : ' + _cToJsonStr(node.child[tagname][0], options) + ' ,';
        }
      }
      util.merge(jObj, node.attrsMap);
      if (util.isEmptyObject(jObj)) {
        return util.isExist(node.val) ? node.val : '';
      } else {
        if (util.isExist(node.val)) {
          if (!(typeof node.val === 'string' && (node.val === '' || node.val === options.cdataPositionChar))) {
            jObj += '"' + options.textNodeName + '" : ' + stringval(node.val);
          }
        }
      }
      if (jObj[jObj.length - 1] === ',') {
        jObj = jObj.substr(0, jObj.length - 2);
      }
      return jObj + '}';
    };
    function stringval(v) {
      if (v === true || v === false || !isNaN(v)) {
        return v;
      } else {
        return '"' + v + '"';
      }
    }
    node2json_str.convertToJsonString = convertToJsonString;

    const buildOptions = util$4.buildOptions;
    const defaultOptions = {
      attributeNamePrefix: '@_',
      attrNodeName: false,
      textNodeName: '#text',
      ignoreAttributes: true,
      cdataTagName: false,
      cdataPositionChar: '\\c',
      format: false,
      indentBy: '  ',
      supressEmptyNode: false,
      tagValueProcessor: function(a) {
        return a;
      },
      attrValueProcessor: function(a) {
        return a;
      },
    };
    const props = [
      'attributeNamePrefix',
      'attrNodeName',
      'textNodeName',
      'ignoreAttributes',
      'cdataTagName',
      'cdataPositionChar',
      'format',
      'indentBy',
      'supressEmptyNode',
      'tagValueProcessor',
      'attrValueProcessor',
      'rootNodeName',
    ];
    function Parser(options) {
      this.options = buildOptions(options, defaultOptions, props);
      if (this.options.ignoreAttributes || this.options.attrNodeName) {
        this.isAttribute = function() {
          return false;
        };
      } else {
        this.attrPrefixLen = this.options.attributeNamePrefix.length;
        this.isAttribute = isAttribute;
      }
      if (this.options.cdataTagName) {
        this.isCDATA = isCDATA;
      } else {
        this.isCDATA = function() {
          return false;
        };
      }
      this.replaceCDATAstr = replaceCDATAstr;
      this.replaceCDATAarr = replaceCDATAarr;
      if (this.options.format) {
        this.indentate = indentate;
        this.tagEndChar = '>\n';
        this.newLine = '\n';
      } else {
        this.indentate = function() {
          return '';
        };
        this.tagEndChar = '>';
        this.newLine = '';
      }
      if (this.options.supressEmptyNode) {
        this.buildTextNode = buildEmptyTextNode;
        this.buildObjNode = buildEmptyObjNode;
      } else {
        this.buildTextNode = buildTextValNode;
        this.buildObjNode = buildObjectNode;
      }
      this.buildTextValNode = buildTextValNode;
      this.buildObjectNode = buildObjectNode;
    }
    Parser.prototype.parse = function(jObj) {
      if(Array.isArray(jObj) && this.options.rootNodeName && this.options.rootNodeName.length > 1){
        jObj = {
          [this.options.rootNodeName] : jObj
        };
      }
      return this.j2x(jObj, 0).val;
    };
    Parser.prototype.j2x = function(jObj, level) {
      let attrStr = '';
      let val = '';
      const keys = Object.keys(jObj);
      const len = keys.length;
      for (let i = 0; i < len; i++) {
        const key = keys[i];
        if (typeof jObj[key] === 'undefined') ; else if (jObj[key] === null) {
          val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
        } else if (jObj[key] instanceof Date) {
          val += this.buildTextNode(jObj[key], key, '', level);
        } else if (typeof jObj[key] !== 'object') {
          const attr = this.isAttribute(key);
          if (attr) {
            attrStr += ' ' + attr + '="' + this.options.attrValueProcessor('' + jObj[key]) + '"';
          } else if (this.isCDATA(key)) {
            if (jObj[this.options.textNodeName]) {
              val += this.replaceCDATAstr(jObj[this.options.textNodeName], jObj[key]);
            } else {
              val += this.replaceCDATAstr('', jObj[key]);
            }
          } else {
            if (key === this.options.textNodeName) {
              if (jObj[this.options.cdataTagName]) ; else {
                val += this.options.tagValueProcessor('' + jObj[key]);
              }
            } else {
              val += this.buildTextNode(jObj[key], key, '', level);
            }
          }
        } else if (Array.isArray(jObj[key])) {
          if (this.isCDATA(key)) {
            val += this.indentate(level);
            if (jObj[this.options.textNodeName]) {
              val += this.replaceCDATAarr(jObj[this.options.textNodeName], jObj[key]);
            } else {
              val += this.replaceCDATAarr('', jObj[key]);
            }
          } else {
            const arrLen = jObj[key].length;
            for (let j = 0; j < arrLen; j++) {
              const item = jObj[key][j];
              if (typeof item === 'undefined') ; else if (item === null) {
                val += this.indentate(level) + '<' + key + '/' + this.tagEndChar;
              } else if (typeof item === 'object') {
                const result = this.j2x(item, level + 1);
                val += this.buildObjNode(result.val, key, result.attrStr, level);
              } else {
                val += this.buildTextNode(item, key, '', level);
              }
            }
          }
        } else {
          if (this.options.attrNodeName && key === this.options.attrNodeName) {
            const Ks = Object.keys(jObj[key]);
            const L = Ks.length;
            for (let j = 0; j < L; j++) {
              attrStr += ' ' + Ks[j] + '="' + this.options.attrValueProcessor('' + jObj[key][Ks[j]]) + '"';
            }
          } else {
            const result = this.j2x(jObj[key], level + 1);
            val += this.buildObjNode(result.val, key, result.attrStr, level);
          }
        }
      }
      return {attrStr: attrStr, val: val};
    };
    function replaceCDATAstr(str, cdata) {
      str = this.options.tagValueProcessor('' + str);
      if (this.options.cdataPositionChar === '' || str === '') {
        return str + '<![CDATA[' + cdata + ']]' + this.tagEndChar;
      } else {
        return str.replace(this.options.cdataPositionChar, '<![CDATA[' + cdata + ']]' + this.tagEndChar);
      }
    }
    function replaceCDATAarr(str, cdata) {
      str = this.options.tagValueProcessor('' + str);
      if (this.options.cdataPositionChar === '' || str === '') {
        return str + '<![CDATA[' + cdata.join(']]><![CDATA[') + ']]' + this.tagEndChar;
      } else {
        for (let v in cdata) {
          str = str.replace(this.options.cdataPositionChar, '<![CDATA[' + cdata[v] + ']]>');
        }
        return str + this.newLine;
      }
    }
    function buildObjectNode(val, key, attrStr, level) {
      if (attrStr && !val.includes('<')) {
        return (
          this.indentate(level) +
          '<' +
          key +
          attrStr +
          '>' +
          val +
          '</' +
          key +
          this.tagEndChar
        );
      } else {
        return (
          this.indentate(level) +
          '<' +
          key +
          attrStr +
          this.tagEndChar +
          val +
          this.indentate(level) +
          '</' +
          key +
          this.tagEndChar
        );
      }
    }
    function buildEmptyObjNode(val, key, attrStr, level) {
      if (val !== '') {
        return this.buildObjectNode(val, key, attrStr, level);
      } else {
        return this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar;
      }
    }
    function buildTextValNode(val, key, attrStr, level) {
      return (
        this.indentate(level) +
        '<' +
        key +
        attrStr +
        '>' +
        this.options.tagValueProcessor(val) +
        '</' +
        key +
        this.tagEndChar
      );
    }
    function buildEmptyTextNode(val, key, attrStr, level) {
      if (val !== '') {
        return this.buildTextValNode(val, key, attrStr, level);
      } else {
        return this.indentate(level) + '<' + key + attrStr + '/' + this.tagEndChar;
      }
    }
    function indentate(level) {
      return this.options.indentBy.repeat(level);
    }
    function isAttribute(name ) {
      if (name.startsWith(this.options.attributeNamePrefix)) {
        return name.substr(this.attrPrefixLen);
      } else {
        return false;
      }
    }
    function isCDATA(name) {
      return name === this.options.cdataTagName;
    }
    var json2xml = Parser;

    (function (exports) {
    const nodeToJson = node2json;
    const xmlToNodeobj = xmlstr2xmlnode;
    const x2xmlnode = xmlstr2xmlnode;
    const buildOptions = util$4.buildOptions;
    const validator$1 = validator;
    exports.parse = function(xmlData, givenOptions = {}, validationOption) {
      if( validationOption){
        if(validationOption === true) validationOption = {};
        const result = validator$1.validate(xmlData, validationOption);
        if (result !== true) {
          throw Error( result.err.msg)
        }
      }
      if(givenOptions.parseTrueNumberOnly
        && givenOptions.parseNodeValue !== false
        && !givenOptions.numParseOptions){
          givenOptions.numParseOptions = {
            leadingZeros: false,
          };
      }
      let options = buildOptions(givenOptions, x2xmlnode.defaultOptions, x2xmlnode.props);
      const traversableObj = xmlToNodeobj.getTraversalObj(xmlData, options);
      return nodeToJson.convertToJson(traversableObj, options);
    };
    exports.convertTonimn = nimndata.convert2nimn;
    exports.getTraversalObj = xmlToNodeobj.getTraversalObj;
    exports.convertToJson = nodeToJson.convertToJson;
    exports.convertToJsonString = node2json_str.convertToJsonString;
    exports.validate = validator$1.validate;
    exports.j2xParser = json2xml;
    exports.parseToNimn = function(xmlData, schema, options) {
      return exports.convertTonimn(exports.getTraversalObj(xmlData, options), schema, options);
    };
    }(parser));

    var DataOperationStatus;
    (function (DataOperationStatus) {
        DataOperationStatus[DataOperationStatus["SUCCESS"] = 0] = "SUCCESS";
        DataOperationStatus[DataOperationStatus["FAIL"] = 1] = "FAIL";
    })(DataOperationStatus || (DataOperationStatus = {}));
    var DataProviderType;
    (function (DataProviderType) {
        DataProviderType[DataProviderType["EXTENSIONS"] = 0] = "EXTENSIONS";
        DataProviderType[DataProviderType["KEYBINDINGS"] = 1] = "KEYBINDINGS";
        DataProviderType[DataProviderType["TWEAKS"] = 2] = "TWEAKS";
    })(DataProviderType || (DataProviderType = {}));

    const SyncedDataPrefs = gobject2.registerClass({}, class SyncedDataPrefs extends PrefsTab {
        _init() {
            super._init({
                title: 'Synced Data',
                orientation: gtk4.Orientation.VERTICAL,
                marginTop: 24,
                marginBottom: 24,
                marginStart: 12,
                marginEnd: 12,
            });
            this.createSettingRows('Extensions', 'Syncs all extensions and their configurations.', DataProviderType.EXTENSIONS);
            this.createSettingRows('Keybindings', 'Syncs all gnome shell and gtk keybindings.', DataProviderType.KEYBINDINGS);
            this.createSettingRows('Tweaks', 'Syncs gnome settings changed from tweak tool.', DataProviderType.TWEAKS);
        }
        createSettingRows(label, description, dataProviderType) {
            const providerFlag = this.settings.get_flags('data-providers');
            const providerTypes = settingsFlagsToEnumList(providerFlag);
            const row = new gtk4.ListBoxRow({
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.FILL,
                widthRequest: 100,
                activatable: true,
            });
            const rowContainer = new gtk4.Box({
                marginTop: 24,
                marginBottom: 24,
                marginStart: 15,
                marginEnd: 15,
                widthRequest: 100,
                orientation: gtk4.Orientation.HORIZONTAL,
            });
            const rowLabelContainer = new gtk4.Box({
                orientation: gtk4.Orientation.VERTICAL,
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.FILL,
                hexpand: true,
                vexpand: true,
            });
            rowLabelContainer.append(new gtk4.Label({
                label,
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
            }));
            rowLabelContainer.append(new gtk4.Label({
                label: description,
                halign: gtk4.Align.START,
                valign: gtk4.Align.FILL,
                cssClasses: ['dim-label', 'setting-description'],
            }));
            const rowSwitch = new gtk4.Switch({
                halign: gtk4.Align.END,
                valign: gtk4.Align.CENTER,
                active: providerTypes.find((providerType) => providerType === dataProviderType) !== undefined,
            });
            rowSwitch.connect('state-set', (_, state) => {
                let lastProviderFlag = this.settings.get_flags('data-providers');
                if (state === true) {
                    lastProviderFlag += Math.pow(2, dataProviderType);
                }
                else {
                    lastProviderFlag -= Math.pow(2, dataProviderType);
                }
                this.settings.set_flags('data-providers', lastProviderFlag);
            });
            rowContainer.append(rowLabelContainer);
            rowContainer.append(rowSwitch);
            row.set_child(rowContainer);
            this.append(row);
        }
    });

    const debug = logger('prefs');
    const Preferences = gobject2.registerClass({}, class Preferences extends gtk4.Box {
        _init() {
            super._init({
                orientation: gtk4.Orientation.VERTICAL,
                spacing: 10,
                baselinePosition: gtk4.BaselinePosition.BOTTOM,
            });
            this.createNotebook();
        }
        createNotebook() {
            const notebook = new gtk4.Notebook({
                hexpand: true,
                vexpand: true,
            });
            const providerPrefs = new ProviderPrefs();
            providerPrefs.attach(notebook);
            const syncedDataSettings = new SyncedDataPrefs();
            syncedDataSettings.attach(notebook);
            const otherSettings = new OtherPrefs();
            otherSettings.attach(notebook);
            this.append(notebook);
        }
    });
    const init = () => debug('prefs initialized');
    const buildPrefsWidget = () => new Preferences();
    var prefs = { init, buildPrefsWidget };

    return prefs;

})(imports.gi.GObject, imports.gi.Gtk, imports.gi.Gio, imports.gi.GLib);
var init = prefs.init;
var buildPrefsWidget = prefs.buildPrefsWidget;
