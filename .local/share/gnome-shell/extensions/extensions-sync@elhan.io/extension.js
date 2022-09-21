var init = (function (gio2, glib2, soup3, meta10, st1) {
    'use strict';

    const logger = (prefix) => (content) => log(`[extensions-sync] [${prefix}] ${content}`);
    const execute = async (command) => {
        const process = new gio2.Subprocess({
            argv: ['bash', '-c', command],
            flags: gio2.SubprocessFlags.STDOUT_PIPE,
        });
        process.init(null);
        return new Promise((resolve, reject) => {
            process.communicate_utf8_async(null, null, (_, result) => {
                const [, stdout, stderr] = process.communicate_utf8_finish(result);
                if (stderr) {
                    reject(stderr);
                }
                else if (stdout) {
                    resolve(stdout.trim());
                }
                else {
                    resolve('');
                }
            });
        });
    };
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

    const debug$a = logger('github');
    class Github {
        constructor(gistId, userToken) {
            this.gistId = gistId;
            this.userToken = userToken;
            this.session = new soup3.Session();
        }
        async save(syncData) {
            const files = Object.keys(syncData).reduce((acc, key) => {
                return Object.assign(Object.assign({}, acc), { [key]: {
                        content: JSON.stringify(syncData[key]),
                    } });
            }, {});
            const message = soup3.Message.new('PATCH', `${Github.GIST_API_URL}/${this.gistId}`);
            message.request_headers.append('User-Agent', 'Mozilla/5.0');
            message.request_headers.append('Authorization', `token ${this.userToken}`);
            const requestBody = JSON.stringify({
                description: 'Extensions Sync',
                files,
            });
            message.set_request_body_from_bytes('application/json', new glib2.Bytes(imports.byteArray.fromString(requestBody)));
            await this.session.send_and_read_async(message, glib2.PRIORITY_DEFAULT, null);
            const { statusCode } = message;
            const phrase = soup3.status_get_phrase(statusCode);
            if (statusCode !== soup3.Status.OK) {
                throw new Error(`failed to save data to ${this.getName()}. Server status: ${phrase}`);
            }
            return SyncOperationStatus.SUCCESS;
        }
        async read() {
            const message = soup3.Message.new('GET', `${Github.GIST_API_URL}/${this.gistId}`);
            message.request_headers.append('User-Agent', 'Mozilla/5.0');
            message.request_headers.append('Authorization', `token ${this.userToken}`);
            const bytes = await this.session.send_and_read_async(message, glib2.PRIORITY_DEFAULT, null);
            const { statusCode } = message;
            const phrase = soup3.status_get_phrase(statusCode);
            if (statusCode !== soup3.Status.OK) {
                throw new Error(`failed to read data from ${this.getName()}. Server status: ${phrase}`);
            }
            const data = bytes.get_data();
            if (data === null) {
                throw new Error(`failed to read data from ${this.getName()}. Empty response`);
            }
            const json = imports.byteArray.toString(data);
            const body = JSON.parse(json);
            const syncData = Object.keys(body.files).reduce((acc, key) => {
                try {
                    return Object.assign(Object.assign({}, acc), { [key]: JSON.parse(body.files[key].content) });
                }
                catch (_a) {
                    debug$a(`failed to parse ${key} file. skipping it...`);
                    return acc;
                }
            }, { extensions: {}, keybindings: {}, tweaks: {} });
            return syncData;
        }
        getName() {
            return 'Github';
        }
    }
    Github.GIST_API_URL = 'https://api.github.com/gists';

    class Gitlab {
        constructor(snippetId, userToken) {
            this.snippetId = snippetId;
            this.userToken = userToken;
            this.session = new soup3.Session();
        }
        async save(syncData) {
            const message = soup3.Message.new('PUT', `${Gitlab.SNIPPETS_API_URL}/${this.snippetId}`);
            message.request_headers.append('User-Agent', 'Mozilla/5.0');
            message.request_headers.append('PRIVATE-TOKEN', `${this.userToken}`);
            const requestBody = JSON.stringify({
                title: 'Extensions Sync',
                content: JSON.stringify(syncData),
            });
            message.set_request_body_from_bytes('application/json', new glib2.Bytes(imports.byteArray.fromString(requestBody)));
            await this.session.send_and_read_async(message, glib2.PRIORITY_DEFAULT, null);
            const { statusCode } = message;
            const phrase = soup3.status_get_phrase(statusCode);
            if (statusCode !== soup3.Status.OK) {
                throw new Error(`failed to save data to ${this.getName()}. Server status: ${phrase}`);
            }
            return SyncOperationStatus.SUCCESS;
        }
        async read() {
            const message = soup3.Message.new('GET', `${Gitlab.SNIPPETS_API_URL}/${this.snippetId}/raw`);
            message.request_headers.append('User-Agent', 'Mozilla/5.0');
            message.request_headers.append('PRIVATE-TOKEN', `${this.userToken}`);
            const bytes = await this.session.send_and_read_async(message, glib2.PRIORITY_DEFAULT, null);
            const { statusCode } = message;
            const phrase = soup3.status_get_phrase(statusCode);
            if (statusCode !== soup3.Status.OK) {
                throw new Error(`failed to read data from ${this.getName()}. Server status: ${phrase}`);
            }
            const data = bytes.get_data();
            if (data === null) {
                throw new Error(`failed to read data from ${this.getName()}. Empty response`);
            }
            const json = imports.byteArray.toString(data);
            const syncData = JSON.parse(json);
            return syncData;
        }
        getName() {
            return 'Gitlab';
        }
    }
    Gitlab.SNIPPETS_API_URL = 'https://gitlab.com/api/v4/snippets';

    const debug$9 = logger('shell');
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
    const canRestartShell = () => {
        return !meta10.is_wayland_compositor();
    };
    const restartShell = (text) => {
        if (!meta10.is_wayland_compositor()) {
            meta10.restart(text);
        }
    };
    const notify = (text) => {
        const settings = getCurrentExtensionSettings();
        const showNotifications = settings.get_boolean('show-notifications');
        if (showNotifications) {
            imports.ui.main.notify(text);
        }
        else {
            debug$9(`Notifications are hidden. Logging the content instead. Content: ${text}`);
        }
    };
    const writeDconfData = async (schemaPath, data) => {
        if (!schemaPath || !data) {
            return;
        }
        const [file, ioStream] = gio2.file_new_tmp(null);
        file.replace_contents(imports.byteArray.fromString(data), null, false, gio2.FileCreateFlags.REPLACE_DESTINATION, null);
        try {
            await execute(`dconf load ${schemaPath} < ${file.get_path()}`);
            debug$9(`loaded settings for ${schemaPath}`);
        }
        catch (ex) {
            debug$9(`cannot load settings for ${schemaPath}`);
        }
        file.delete(null);
        ioStream.close_async(glib2.PRIORITY_DEFAULT, null);
    };
    const readDconfData = async (schemaPath) => {
        return execute(`dconf dump ${schemaPath}`);
    };
    const loadInterfaceXML = (iface) => {
        const uri = `file:///${getCurrentExtension().path}/dbus/${iface}.xml`;
        const file = gio2.File.new_for_uri(uri);
        try {
            const [, bytes] = file.load_contents(null);
            return imports.byteArray.toString(bytes);
        }
        catch (e) {
            log(`Failed to load D-Bus interface ${iface}`);
        }
        return null;
    };

    class Local {
        constructor(backupFileLocation) {
            this.backupFileLocation = backupFileLocation;
        }
        async save(syncData) {
            if (!this.backupFileLocation) {
                throw new Error('Please select a backup file location from preferences');
            }
            const backupFile = gio2.File.new_for_uri(this.backupFileLocation);
            if (!backupFile.query_exists(null)) {
                throw new Error(`Failed to backup settings. ${this.backupFileLocation} does not exist`);
            }
            backupFile.replace_contents(imports.byteArray.fromString(JSON.stringify(syncData)), null, false, gio2.FileCreateFlags.REPLACE_DESTINATION, null);
            return SyncOperationStatus.SUCCESS;
        }
        async read() {
            const backupFile = gio2.File.new_for_uri(this.backupFileLocation);
            if (!backupFile.query_exists(null)) {
                throw new Error(`Failed to read settings from backup. ${this.backupFileLocation} does not exist`);
            }
            const [status, syncDataBytes] = backupFile.load_contents(null);
            if (!syncDataBytes.length || !status) {
                throw new Error(`Failed to read settings from backup. ${this.backupFileLocation} is corrupted`);
            }
            try {
                return JSON.parse(imports.byteArray.toString(syncDataBytes));
            }
            catch (err) {
                throw new Error(`${this.backupFileLocation} is not a json file`);
            }
        }
        getName() {
            return 'Local';
        }
    }

    const debug$8 = logger('api');
    class Api {
        constructor(eventEmitter, data) {
            this.data = data;
            this.settings = getCurrentExtensionSettings();
            this.provider = this.createProvider();
            this.eventEmitter = eventEmitter;
            this.eventEmitter.on(SyncEvent.SAVE, this.save.bind(this));
            this.eventEmitter.on(SyncEvent.READ, this.read.bind(this));
            this.settings.connect('changed', this.updateProvider.bind(this));
        }
        async save() {
            debug$8('got save request, saving settings...');
            try {
                const status = await this.provider.save(Object.assign({}, (await this.data.getSyncData())));
                if (status === SyncOperationStatus.FAIL) {
                    throw new Error('Could not save');
                }
                debug$8(`saved settings to ${this.provider.getName()} successfully`);
                this.eventEmitter.emit(SyncEvent.SAVE_FINISHED, status);
                notify(_(`Settings successfully saved to ${this.provider.getName()}`));
            }
            catch (ex) {
                this.eventEmitter.emit(SyncEvent.SAVE_FINISHED, undefined, ex);
                notify(_(`Error occured while saving settings to ${this.provider.getName()}. Please check the logs.`));
                debug$8(`error occured during save. -> ${ex}`);
            }
        }
        async read() {
            debug$8('got read request, reading settings...');
            try {
                const result = await this.provider.read();
                debug$8(`read settings from ${this.provider.getName()} successfully`);
                this.eventEmitter.emit(SyncEvent.READ_FINISHED, result);
            }
            catch (ex) {
                this.eventEmitter.emit(SyncEvent.READ_FINISHED, undefined, ex);
                notify(_(`Error occured while reading settings from ${this.provider.getName()}. Please check the logs.`));
                debug$8(`error occured during read. -> ${ex}`);
            }
        }
        createProvider() {
            const providerType = this.settings.get_enum('provider');
            debug$8(`changing provider to ${SyncProviderType[providerType]}`);
            switch (providerType) {
                case SyncProviderType.GITHUB:
                    return this.createGithubProvider();
                case SyncProviderType.GITLAB:
                    return this.createGitlabProvider();
                case SyncProviderType.LOCAL:
                    return this.createLocalProvider();
                default:
                    return this.createGithubProvider();
            }
        }
        updateProvider() {
            this.provider = this.createProvider();
        }
        createGithubProvider() {
            const gistId = this.settings.get_string('github-gist-id');
            const userToken = this.settings.get_string('github-user-token');
            return new Github(gistId, userToken);
        }
        createGitlabProvider() {
            const snippetId = this.settings.get_string('gitlab-snippet-id');
            const userToken = this.settings.get_string('gitlab-user-token');
            return new Gitlab(snippetId, userToken);
        }
        createLocalProvider() {
            const backupFileLocation = this.settings.get_string('backup-file-location');
            return new Local(backupFileLocation);
        }
    }

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

    const debug$7 = logger('extension-utils');
    const readSchemaAsJson = (schemaPath) => {
        const [, contents] = glib2.file_get_contents(schemaPath);
        return parser.parse(imports.byteArray.toString(contents), { ignoreAttributes: false });
    };
    const getExtensionManager = () => imports.ui.main.extensionManager;
    const getExtensionById = (extensionId) => getExtensionManager().lookup(extensionId);
    const getExtensionSchemas = async (extensionId) => {
        const extension = getExtensionById(extensionId);
        let stdout;
        try {
            stdout = await execute(`find -L ${extension.path} -iname "*.xml" -exec grep -l "schemalist" {} +`);
        }
        catch (ex) {
            debug$7(`error occurred while getting extension schemas: ${ex}`);
            return {};
        }
        if (!stdout) {
            return {};
        }
        const schemaFiles = stdout.split('\n');
        const foundSchemas = schemaFiles
            .map((schemaFile) => readSchemaAsJson(schemaFile))
            .reduce((schemaJsonAcc, schemaJson) => {
            if (!schemaJson || !schemaJson.schemalist || !schemaJson.schemalist.schema) {
                return schemaJsonAcc;
            }
            const schema = schemaJson.schemalist.schema;
            if (Array.isArray(schema)) {
                const multipleSchemaObj = schema.reduce((acc, schemaObj) => {
                    if (schemaObj['@_path']) {
                        return Object.assign(Object.assign({}, acc), { [schemaObj['@_path']]: {} });
                    }
                    return acc;
                }, {});
                return Object.assign(Object.assign({}, multipleSchemaObj), schemaJsonAcc);
            }
            else if (schema['@_path']) {
                return Object.assign(Object.assign({}, schemaJsonAcc), { [schema['@_path']]: {} });
            }
            return schemaJsonAcc;
        }, {});
        return foundSchemas;
    };
    const getExtensionIds = () => getExtensionManager()
        .getUuids()
        .filter((uuid) => getExtensionById(uuid).type === ExtensionType.PER_USER && uuid !== getCurrentExtension().metadata.uuid);
    const getAllExtensions = () => {
        const extensionIds = getExtensionIds();
        const extensions = extensionIds
            .map((id) => {
            const extension = getExtensionById(id);
            if (extension.type === ExtensionType.PER_USER) {
                return extension;
            }
            return undefined;
        })
            .filter((item) => item !== undefined);
        return extensions;
    };
    const getExtensionConfigData = async (extensionId) => {
        const schemas = await getExtensionSchemas(extensionId);
        return Object.keys(schemas).reduce(async (acc, schema) => {
            try {
                return Object.assign(Object.assign({}, (await acc)), { [schema]: await readDconfData(schema) });
            }
            catch (ex) {
                debug$7(`cannot dump settings for ${extensionId}:${schema}`);
            }
            return acc;
        }, Promise.resolve({}));
    };
    const getAllExtensionConfigData = async () => {
        const extensions = getAllExtensions();
        return extensions.reduce(async (extensionAcc, extension) => {
            return Object.assign(Object.assign({}, (await extensionAcc)), { [extension.metadata.uuid]: await getExtensionConfigData(extension.metadata.uuid) });
        }, Promise.resolve({}));
    };
    const removeExtension = (extensionId) => {
        imports.ui.extensionDownloader.uninstallExtension(extensionId);
        debug$7(`removed extension ${extensionId}`);
    };
    const extractExtensionArchive = async (bytes, dir) => {
        if (!dir.query_exists(null)) {
            dir.make_directory_with_parents(null);
        }
        const [file, stream] = gio2.File.new_tmp('XXXXXX.shell-extension.zip');
        await stream.output_stream.write_bytes_async(bytes, glib2.PRIORITY_DEFAULT, null);
        stream.close_async(glib2.PRIORITY_DEFAULT, null);
        const unzip = gio2.Subprocess.new(['unzip', '-uod', dir.get_path(), '--', file.get_path()], gio2.SubprocessFlags.NONE);
        await unzip.wait_check_async(null);
    };
    const installExtension = async (extensionId) => {
        const params = { shell_version: imports.misc.config.PACKAGE_VERSION };
        const message = soup3.Message.new_from_encoded_form('GET', `https://extensions.gnome.org/download-extension/${extensionId}.shell-extension.zip`, soup3.form_encode_hash(params));
        const dir = gio2.File.new_for_path(glib2.build_filenamev([glib2.get_user_data_dir(), 'gnome-shell', 'extensions', extensionId]));
        try {
            const bytes = await new soup3.Session().send_and_read_async(message, glib2.PRIORITY_DEFAULT, null);
            const { statusCode } = message;
            const phrase = soup3.status_get_phrase(statusCode);
            if (statusCode !== soup3.Status.OK)
                throw new Error(`Unexpected response: ${phrase}`);
            await extractExtensionArchive(bytes, dir);
            const extension = getExtensionManager().createExtensionObject(extensionId, dir, ExtensionType.PER_USER);
            getExtensionManager().loadExtension(extension);
            if (!getExtensionManager().enableExtension(extensionId)) {
                throw new Error(`Cannot enable ${extensionId}`);
            }
        }
        catch (e) {
            debug$7(`error occurred during installation of ${extensionId}. Error: ${e}`);
        }
    };

    const debug$6 = logger('extension-provider');
    class ExtensionsDataProvider {
        async getData() {
            return getAllExtensionConfigData();
        }
        async useData(extensionData) {
            const downloadedExtensions = Object.keys(extensionData);
            const localExtensions = getExtensionIds();
            localExtensions.forEach((extensionId) => downloadedExtensions.indexOf(extensionId) < 0 && removeExtension(extensionId));
            debug$6(`downloading extensions: ${downloadedExtensions}`);
            await Promise.all(downloadedExtensions.map((extensionId) => {
                return Object.keys(extensionData[extensionId]).map((schemaPath) => {
                    return writeDconfData(schemaPath, extensionData[extensionId][schemaPath]);
                });
            }));
            await Promise.all(downloadedExtensions.map(async (extensionId) => localExtensions.indexOf(extensionId) < 0 && installExtension(extensionId)));
        }
        getName() {
            return 'extensions';
        }
    }

    const debug$5 = logger('keybindings-data-provider');
    const keyBindingsSchemaList = [
        '/org/gnome/mutter/keybindings/',
        '/org/gnome/mutter/wayland/keybindings/',
        '/org/gnome/shell/keybindings/',
        '/org/gnome/desktop/wm/keybindings/',
        '/org/gnome/settings-daemon/plugins/media-keys/',
    ];
    class KeyBindingsDataProvider {
        async getData() {
            return keyBindingsSchemaList.reduce(async (acc, schema) => {
                try {
                    return Object.assign(Object.assign({}, (await acc)), { [schema]: await readDconfData(schema) });
                }
                catch (ex) {
                    debug$5(`cannot dump settings for ${schema}`);
                }
                return acc;
            }, Promise.resolve({}));
        }
        async useData(keyBindingsData) {
            await Promise.all(Object.keys(keyBindingsData).map((schemaPath) => {
                return writeDconfData(schemaPath, keyBindingsData[schemaPath]);
            }));
        }
        getName() {
            return 'keybindings';
        }
    }

    const debug$4 = logger('tweaks-data-provider');
    const tweaksSchemaList = [
        '/org/gnome/desktop/background/',
        '/org/gnome/desktop/calendar/',
        '/org/gnome/desktop/input-sources/',
        '/org/gnome/desktop/interface/',
        '/org/gnome/desktop/peripherals/',
        '/org/gnome/desktop/screensaver/',
        '/org/gnome/desktop/sound/',
        '/org/gnome/desktop/wm/preferences/',
        '/org/gnome/mutter/',
        '/org/gnome/settings-daemon/plugins/xsettings/',
    ];
    class TweaksDataProvider {
        async getData() {
            return tweaksSchemaList.reduce(async (acc, schema) => {
                try {
                    return Object.assign(Object.assign({}, (await acc)), { [schema]: await readDconfData(schema) });
                }
                catch (ex) {
                    debug$4(`cannot dump settings for ${schema}`);
                }
                return acc;
            }, Promise.resolve({}));
        }
        async useData(tweaksData) {
            await Promise.all(Object.keys(tweaksData).map((schemaPath) => {
                return writeDconfData(schemaPath, tweaksData[schemaPath]);
            }));
        }
        getName() {
            return 'tweaks';
        }
    }

    const debug$3 = logger('data');
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
    class Data {
        constructor() {
            this.settings = getCurrentExtensionSettings();
            this.providers = this.createProviders();
            this.settings.connect('changed', this.updateProviders.bind(this));
        }
        async getSyncData() {
            const resultList = await Promise.all(this.providers.map(async (provider) => {
                return {
                    [provider.getName()]: await provider.getData(),
                };
            }));
            return resultList.reduce((acc, result) => {
                return Object.assign(Object.assign({}, acc), result);
            }, { extensions: {}, keybindings: {}, tweaks: {} });
        }
        async use(syncData) {
            await Promise.all(this.providers.map(async (provider) => {
                debug$3(`updating ${provider.getName()} settings in local machine`);
                await provider.useData(syncData[provider.getName()]);
            }));
        }
        createProvider(providerType) {
            switch (providerType) {
                case DataProviderType.EXTENSIONS: {
                    return new ExtensionsDataProvider();
                }
                case DataProviderType.KEYBINDINGS: {
                    return new KeyBindingsDataProvider();
                }
                case DataProviderType.TWEAKS: {
                    return new TweaksDataProvider();
                }
            }
        }
        createProviders() {
            const providerFlag = this.settings.get_flags('data-providers');
            const providerTypes = settingsFlagsToEnumList(providerFlag);
            debug$3(`enabled data providers are ${providerTypes.map((p) => DataProviderType[p])}`);
            return providerTypes
                .map((providerType) => this.createProvider(providerType))
                .filter((provider) => provider !== undefined);
        }
        updateProviders() {
            this.providers = this.createProviders();
        }
    }

    const { Button } = imports.ui.panelMenu;
    const { PopupImageMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
    const { panel } = imports.ui.main;
    const debug$2 = logger('statusMenu');
    class StatusMenu {
        constructor(eventEmitter) {
            this.eventEmitter = eventEmitter;
            this.extension = getCurrentExtension();
            this.settings = getCurrentExtensionSettings();
            this.settings.connect('changed::show-tray-icon', this.toggleStatusMenu.bind(this));
        }
        show() {
            const showTrayIcon = this.settings.get_boolean('show-tray-icon');
            if (!showTrayIcon) {
                return;
            }
            if (this.button === undefined) {
                this.button = this.createButton();
            }
            this.eventEmitter.on(SyncEvent.SAVE, this.disableButton.bind(this));
            this.eventEmitter.on(SyncEvent.READ, this.disableButton.bind(this));
            this.eventEmitter.on(SyncEvent.SAVE_FINISHED, this.enableButton.bind(this));
            this.eventEmitter.on(SyncEvent.READ_FINISHED, this.enableButton.bind(this));
            panel.addToStatusArea('extensions-sync', this.button);
            debug$2('showing status menu in panel');
        }
        hide() {
            if (this.button) {
                this.button.destroy();
                this.button = undefined;
            }
            if (panel.statusArea['extensions-sync']) {
                panel.statusArea['extensions-sync'].destroy();
                this.eventEmitter.off(SyncEvent.SAVE, this.disableButton.bind(this));
                this.eventEmitter.off(SyncEvent.READ, this.disableButton.bind(this));
                this.eventEmitter.off(SyncEvent.SAVE_FINISHED, this.enableButton.bind(this));
                this.eventEmitter.off(SyncEvent.READ_FINISHED, this.enableButton.bind(this));
                debug$2('removing status menu from panel');
            }
        }
        toggleStatusMenu() {
            const showTrayIcon = this.settings.get_boolean('show-tray-icon');
            if (showTrayIcon) {
                this.show();
            }
            else {
                this.hide();
            }
        }
        createButton() {
            const newButton = new Button(0, _('Sync Settings'));
            newButton.icon = this.createIcon('synced');
            newButton.add_actor(newButton.icon);
            newButton.menu.addMenuItem(this.createMenuItem(_('Upload'), 'upload', () => this.eventEmitter.emit(SyncEvent.SAVE)));
            newButton.menu.addMenuItem(this.createMenuItem(_('Download'), 'download', () => this.eventEmitter.emit(SyncEvent.READ)));
            newButton.menu.addMenuItem(new PopupSeparatorMenuItem());
            newButton.menu.addMenuItem(this.createMenuItem(_('Preferences'), 'preferences', () => {
                execute(`gnome-extensions prefs "${this.extension.metadata.uuid}"`);
            }));
            return newButton;
        }
        createMenuItem(menuTitle, actionType, onClick) {
            const menuItem = new PopupImageMenuItem(`${menuTitle}`, this.createIcon(`${actionType}`).gicon);
            if (onClick) {
                menuItem.connect('activate', () => onClick());
            }
            return menuItem;
        }
        createIcon(iconType) {
            return new st1.Icon({
                gicon: gio2.icon_new_for_string(`${this.extension.path}/icons/extensions-sync-${iconType}-symbolic.svg`),
                style_class: 'system-status-icon',
            });
        }
        enableButton() {
            if (this.button !== undefined) {
                this.button.set_reactive(true);
                this.button.icon.set_gicon(this.createIcon('synced').gicon);
            }
        }
        disableButton() {
            if (this.button !== undefined) {
                this.button.set_reactive(false);
                this.button.icon.set_gicon(this.createIcon('syncing').gicon);
                this.button.menu.close();
            }
        }
    }

    var SyncEvents;
    (function (SyncEvents) {
        SyncEvents[SyncEvents["SYNCHRONIZED"] = 0] = "SYNCHRONIZED";
    })(SyncEvents || (SyncEvents = {}));
    const debug$1 = logger('sync');
    class Sync {
        constructor(eventEmitter, data) {
            this.data = data;
            this.eventEmitter = eventEmitter;
        }
        start() {
            this.eventEmitter.on(SyncEvent.READ_FINISHED, this.onReadFinished.bind(this));
            debug$1('listening for read completion events');
        }
        stop() {
            this.eventEmitter.off(SyncEvent.READ_FINISHED, this.onReadFinished.bind(this));
            debug$1('stopped listening for read completion events');
        }
        async onReadFinished(syncData) {
            if (syncData === undefined) {
                return;
            }
            try {
                await this.data.use(syncData);
            }
            catch (ex) {
                notify(_('Failed to apply sync data to current system.'));
                debug$1(`failed to apply sync data to system: ${ex}`);
            }
            if (canRestartShell()) {
                restartShell(_('Extensions are updated. Reloading Gnome Shell'));
            }
            else {
                notify(_('Extensions are updated. Please reload Gnome Shell'));
            }
        }
    }

    var events = {exports: {}};

    var R = typeof Reflect === 'object' ? Reflect : null;
    var ReflectApply = R && typeof R.apply === 'function'
      ? R.apply
      : function ReflectApply(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
      };
    var ReflectOwnKeys;
    if (R && typeof R.ownKeys === 'function') {
      ReflectOwnKeys = R.ownKeys;
    } else if (Object.getOwnPropertySymbols) {
      ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target)
          .concat(Object.getOwnPropertySymbols(target));
      };
    } else {
      ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target);
      };
    }
    function ProcessEmitWarning(warning) {
      if (console && console.warn) console.warn(warning);
    }
    var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
      return value !== value;
    };
    function EventEmitter() {
      EventEmitter.init.call(this);
    }
    events.exports = EventEmitter;
    events.exports.once = once;
    EventEmitter.EventEmitter = EventEmitter;
    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._eventsCount = 0;
    EventEmitter.prototype._maxListeners = undefined;
    var defaultMaxListeners = 10;
    function checkListener(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
      }
    }
    Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
      enumerable: true,
      get: function() {
        return defaultMaxListeners;
      },
      set: function(arg) {
        if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
          throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
        }
        defaultMaxListeners = arg;
      }
    });
    EventEmitter.init = function() {
      if (this._events === undefined ||
          this._events === Object.getPrototypeOf(this)._events) {
        this._events = Object.create(null);
        this._eventsCount = 0;
      }
      this._maxListeners = this._maxListeners || undefined;
    };
    EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
        throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
      }
      this._maxListeners = n;
      return this;
    };
    function _getMaxListeners(that) {
      if (that._maxListeners === undefined)
        return EventEmitter.defaultMaxListeners;
      return that._maxListeners;
    }
    EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
      return _getMaxListeners(this);
    };
    EventEmitter.prototype.emit = function emit(type) {
      var args = [];
      for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
      var doError = (type === 'error');
      var events = this._events;
      if (events !== undefined)
        doError = (doError && events.error === undefined);
      else if (!doError)
        return false;
      if (doError) {
        var er;
        if (args.length > 0)
          er = args[0];
        if (er instanceof Error) {
          throw er;
        }
        var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
        err.context = er;
        throw err;
      }
      var handler = events[type];
      if (handler === undefined)
        return false;
      if (typeof handler === 'function') {
        ReflectApply(handler, this, args);
      } else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          ReflectApply(listeners[i], this, args);
      }
      return true;
    };
    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;
      checkListener(listener);
      events = target._events;
      if (events === undefined) {
        events = target._events = Object.create(null);
        target._eventsCount = 0;
      } else {
        if (events.newListener !== undefined) {
          target.emit('newListener', type,
                      listener.listener ? listener.listener : listener);
          events = target._events;
        }
        existing = events[type];
      }
      if (existing === undefined) {
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === 'function') {
          existing = events[type] =
            prepend ? [listener, existing] : [existing, listener];
        } else if (prepend) {
          existing.unshift(listener);
        } else {
          existing.push(listener);
        }
        m = _getMaxListeners(target);
        if (m > 0 && existing.length > m && !existing.warned) {
          existing.warned = true;
          var w = new Error('Possible EventEmitter memory leak detected. ' +
                              existing.length + ' ' + String(type) + ' listeners ' +
                              'added. Use emitter.setMaxListeners() to ' +
                              'increase limit');
          w.name = 'MaxListenersExceededWarning';
          w.emitter = target;
          w.type = type;
          w.count = existing.length;
          ProcessEmitWarning(w);
        }
      }
      return target;
    }
    EventEmitter.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };
    EventEmitter.prototype.on = EventEmitter.prototype.addListener;
    EventEmitter.prototype.prependListener =
        function prependListener(type, listener) {
          return _addListener(this, type, listener, true);
        };
    function onceWrapper() {
      if (!this.fired) {
        this.target.removeListener(this.type, this.wrapFn);
        this.fired = true;
        if (arguments.length === 0)
          return this.listener.call(this.target);
        return this.listener.apply(this.target, arguments);
      }
    }
    function _onceWrap(target, type, listener) {
      var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
      var wrapped = onceWrapper.bind(state);
      wrapped.listener = listener;
      state.wrapFn = wrapped;
      return wrapped;
    }
    EventEmitter.prototype.once = function once(type, listener) {
      checkListener(listener);
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };
    EventEmitter.prototype.prependOnceListener =
        function prependOnceListener(type, listener) {
          checkListener(listener);
          this.prependListener(type, _onceWrap(this, type, listener));
          return this;
        };
    EventEmitter.prototype.removeListener =
        function removeListener(type, listener) {
          var list, events, position, i, originalListener;
          checkListener(listener);
          events = this._events;
          if (events === undefined)
            return this;
          list = events[type];
          if (list === undefined)
            return this;
          if (list === listener || list.listener === listener) {
            if (--this._eventsCount === 0)
              this._events = Object.create(null);
            else {
              delete events[type];
              if (events.removeListener)
                this.emit('removeListener', type, list.listener || listener);
            }
          } else if (typeof list !== 'function') {
            position = -1;
            for (i = list.length - 1; i >= 0; i--) {
              if (list[i] === listener || list[i].listener === listener) {
                originalListener = list[i].listener;
                position = i;
                break;
              }
            }
            if (position < 0)
              return this;
            if (position === 0)
              list.shift();
            else {
              spliceOne(list, position);
            }
            if (list.length === 1)
              events[type] = list[0];
            if (events.removeListener !== undefined)
              this.emit('removeListener', type, originalListener || listener);
          }
          return this;
        };
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.removeAllListeners =
        function removeAllListeners(type) {
          var listeners, events, i;
          events = this._events;
          if (events === undefined)
            return this;
          if (events.removeListener === undefined) {
            if (arguments.length === 0) {
              this._events = Object.create(null);
              this._eventsCount = 0;
            } else if (events[type] !== undefined) {
              if (--this._eventsCount === 0)
                this._events = Object.create(null);
              else
                delete events[type];
            }
            return this;
          }
          if (arguments.length === 0) {
            var keys = Object.keys(events);
            var key;
            for (i = 0; i < keys.length; ++i) {
              key = keys[i];
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = Object.create(null);
            this._eventsCount = 0;
            return this;
          }
          listeners = events[type];
          if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
          } else if (listeners !== undefined) {
            for (i = listeners.length - 1; i >= 0; i--) {
              this.removeListener(type, listeners[i]);
            }
          }
          return this;
        };
    function _listeners(target, type, unwrap) {
      var events = target._events;
      if (events === undefined)
        return [];
      var evlistener = events[type];
      if (evlistener === undefined)
        return [];
      if (typeof evlistener === 'function')
        return unwrap ? [evlistener.listener || evlistener] : [evlistener];
      return unwrap ?
        unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
    }
    EventEmitter.prototype.listeners = function listeners(type) {
      return _listeners(this, type, true);
    };
    EventEmitter.prototype.rawListeners = function rawListeners(type) {
      return _listeners(this, type, false);
    };
    EventEmitter.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };
    EventEmitter.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;
      if (events !== undefined) {
        var evlistener = events[type];
        if (typeof evlistener === 'function') {
          return 1;
        } else if (evlistener !== undefined) {
          return evlistener.length;
        }
      }
      return 0;
    }
    EventEmitter.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
    };
    function arrayClone(arr, n) {
      var copy = new Array(n);
      for (var i = 0; i < n; ++i)
        copy[i] = arr[i];
      return copy;
    }
    function spliceOne(list, index) {
      for (; index + 1 < list.length; index++)
        list[index] = list[index + 1];
      list.pop();
    }
    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }
    function once(emitter, name) {
      return new Promise(function (resolve, reject) {
        function errorListener(err) {
          emitter.removeListener(name, resolver);
          reject(err);
        }
        function resolver() {
          if (typeof emitter.removeListener === 'function') {
            emitter.removeListener('error', errorListener);
          }
          resolve([].slice.call(arguments));
        }    eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
        if (name !== 'error') {
          addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
        }
      });
    }
    function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
      if (typeof emitter.on === 'function') {
        eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
      }
    }
    function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
      if (typeof emitter.on === 'function') {
        if (flags.once) {
          emitter.once(name, listener);
        } else {
          emitter.on(name, listener);
        }
      } else if (typeof emitter.addEventListener === 'function') {
        emitter.addEventListener(name, function wrapListener(arg) {
          if (flags.once) {
            emitter.removeEventListener(name, wrapListener);
          }
          listener(arg);
        });
      } else {
        throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
      }
    }

    const debug = logger('extension');
    class SyncExtension {
        constructor() {
            this.eventEmitter = new events.exports.EventEmitter();
            this.data = new Data();
            this.api = new Api(this.eventEmitter, this.data);
            this.sync = new Sync(this.eventEmitter, this.data);
            this.statusMenu = new StatusMenu(this.eventEmitter);
            const iface = loadInterfaceXML('io.elhan.ExtensionsSync');
            this.dbus = gio2.DBusExportedObject.wrapJSObject(iface, this);
            debug('extension is initialized');
        }
        save() {
            this.eventEmitter.emit(SyncEvent.SAVE);
        }
        read() {
            this.eventEmitter.emit(SyncEvent.READ);
        }
        enable() {
            this.sync.start();
            this.statusMenu.show();
            this.dbus.export(gio2.DBus.session, '/io/elhan/ExtensionsSync');
            debug('extension is enabled');
        }
        disable() {
            this.sync.stop();
            this.statusMenu.hide();
            this.dbus.unexport();
            debug('extension is disabled');
        }
    }
    function extension () {
        return new SyncExtension();
    }

    return extension;

})(imports.gi.Gio, imports.gi.GLib, imports.gi.Soup, imports.gi.Meta, imports.gi.St);
