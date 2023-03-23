
const Me = imports.misc.extensionUtils.getCurrentExtension();

try {

var init = (function (gio2, glib2, shell0, clutter10, gobject2, st1, gsound1, gdkpixbuf2, cogl2, meta10, gda6, pango1, graphene1, formatDistanceToNow, dateLocale, prismjs, prettyBytes, soup3, htmlparser2, converter, hljs, bash, c, cpp, csharp, dart, go, groovy, haskell, java, javascript, julia, kotlin, lua, markdown, perl, php, python, ruby, rust, scala, shell, sql, swift, typescript, yaml, isUrl, validateColor) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    function _interopNamespace(e) {
        if (e && e.__esModule) return e;
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n["default"] = e;
        return Object.freeze(n);
    }

    var formatDistanceToNow__default = /*#__PURE__*/_interopDefaultLegacy(formatDistanceToNow);
    var dateLocale__namespace = /*#__PURE__*/_interopNamespace(dateLocale);
    var prettyBytes__default = /*#__PURE__*/_interopDefaultLegacy(prettyBytes);
    var htmlparser2__namespace = /*#__PURE__*/_interopNamespace(htmlparser2);
    var converter__default = /*#__PURE__*/_interopDefaultLegacy(converter);
    var hljs__default = /*#__PURE__*/_interopDefaultLegacy(hljs);
    var bash__default = /*#__PURE__*/_interopDefaultLegacy(bash);
    var c__default = /*#__PURE__*/_interopDefaultLegacy(c);
    var cpp__default = /*#__PURE__*/_interopDefaultLegacy(cpp);
    var csharp__default = /*#__PURE__*/_interopDefaultLegacy(csharp);
    var dart__default = /*#__PURE__*/_interopDefaultLegacy(dart);
    var go__default = /*#__PURE__*/_interopDefaultLegacy(go);
    var groovy__default = /*#__PURE__*/_interopDefaultLegacy(groovy);
    var haskell__default = /*#__PURE__*/_interopDefaultLegacy(haskell);
    var java__default = /*#__PURE__*/_interopDefaultLegacy(java);
    var javascript__default = /*#__PURE__*/_interopDefaultLegacy(javascript);
    var julia__default = /*#__PURE__*/_interopDefaultLegacy(julia);
    var kotlin__default = /*#__PURE__*/_interopDefaultLegacy(kotlin);
    var lua__default = /*#__PURE__*/_interopDefaultLegacy(lua);
    var markdown__default = /*#__PURE__*/_interopDefaultLegacy(markdown);
    var perl__default = /*#__PURE__*/_interopDefaultLegacy(perl);
    var php__default = /*#__PURE__*/_interopDefaultLegacy(php);
    var python__default = /*#__PURE__*/_interopDefaultLegacy(python);
    var ruby__default = /*#__PURE__*/_interopDefaultLegacy(ruby);
    var rust__default = /*#__PURE__*/_interopDefaultLegacy(rust);
    var scala__default = /*#__PURE__*/_interopDefaultLegacy(scala);
    var shell__default = /*#__PURE__*/_interopDefaultLegacy(shell);
    var sql__default = /*#__PURE__*/_interopDefaultLegacy(sql);
    var swift__default = /*#__PURE__*/_interopDefaultLegacy(swift);
    var typescript__default = /*#__PURE__*/_interopDefaultLegacy(typescript);
    var yaml__default = /*#__PURE__*/_interopDefaultLegacy(yaml);
    var isUrl__default = /*#__PURE__*/_interopDefaultLegacy(isUrl);

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    // Taken from https://github.com/material-shell/material-shell/blob/main/src/utils/gjs.ts
    /// Decorator function to call `GObject.registerClass` with the given class.
    /// Use like
    /// ```
    /// @registerGObjectClass
    /// export class MyThing extends GObject.Object { ... }
    /// ```
    function registerGObjectClass(target) {
        // Note that we use 'hasOwnProperty' because otherwise we would get inherited meta infos.
        // This would be bad because we would inherit the GObjectName too, which is supposed to be unique.
        if (Object.prototype.hasOwnProperty.call(target, 'metaInfo')) {
            // eslint-disable-next-line
            // @ts-ignore
            // eslint-disable-next-line
            return gobject2.registerClass(target.metaInfo, target);
        }
        else {
            // eslint-disable-next-line
            // @ts-ignore
            return gobject2.registerClass(target);
        }
    }

    const logger = (prefix) => (content) => log(`[pano] [${prefix}] ${content}`);
    const debug$7 = logger('shell-utils');
    const deleteFile = (file) => {
        return new Promise((resolve, reject) => {
            file.delete_async(glib2.PRIORITY_DEFAULT, null, (_file, res) => {
                try {
                    resolve(file.delete_finish(res));
                }
                catch (e) {
                    reject(e);
                }
            });
        });
    };
    const deleteDirectory = async (file) => {
        try {
            const iter = await new Promise((resolve, reject) => {
                file.enumerate_children_async('standard::type', gio2.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, glib2.PRIORITY_DEFAULT, null, (file, res) => {
                    try {
                        resolve(file?.enumerate_children_finish(res));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
            if (!iter) {
                return;
            }
            const branches = [];
            while (true) {
                const infos = await new Promise((resolve, reject) => {
                    iter.next_files_async(10, glib2.PRIORITY_DEFAULT, null, (it, res) => {
                        try {
                            resolve(it ? it.next_files_finish(res) : []);
                        }
                        catch (e) {
                            reject(e);
                        }
                    });
                });
                if (infos.length === 0) {
                    break;
                }
                for (const info of infos) {
                    const child = iter.get_child(info);
                    const type = info.get_file_type();
                    let branch;
                    switch (type) {
                        case gio2.FileType.REGULAR:
                        case gio2.FileType.SYMBOLIC_LINK:
                            branch = deleteFile(child);
                            break;
                        case gio2.FileType.DIRECTORY:
                            branch = deleteDirectory(child);
                            break;
                        default:
                            continue;
                    }
                    branches.push(branch);
                }
            }
            await Promise.all(branches);
        }
        catch (e) {
        }
        finally {
            return deleteFile(file);
        }
    };
    const getAppDataPath = () => `${glib2.get_user_data_dir()}/${getCurrentExtension().metadata.uuid}`;
    const getImagesPath = () => `${getAppDataPath()}/images`;
    const getCachePath = () => `${glib2.get_user_cache_dir()}/${getCurrentExtension().metadata.uuid}`;
    const setupAppDirs = () => {
        const imagePath = gio2.File.new_for_path(getImagesPath());
        if (!imagePath.query_exists(null)) {
            imagePath.make_directory_with_parents(null);
        }
        const cachePath = gio2.File.new_for_path(getCachePath());
        if (!cachePath.query_exists(null)) {
            cachePath.make_directory_with_parents(null);
        }
        const dbPath = gio2.File.new_for_path(`${getDbPath()}`);
        if (!dbPath.query_exists(null)) {
            dbPath.make_directory_with_parents(null);
        }
    };
    const moveDbFile = (from, to) => {
        if (from === to) {
            return;
        }
        const oldDb = gio2.File.new_for_path(`${from}/pano.db`);
        const newDb = gio2.File.new_for_path(`${to}/pano.db`);
        if (oldDb.query_exists(null) && !newDb.query_exists(null)) {
            const newDBParent = gio2.File.new_for_path(to);
            if (!newDBParent.query_exists(null)) {
                newDBParent.make_directory_with_parents(null);
            }
            oldDb.move(newDb, gio2.FileCopyFlags.ALL_METADATA, null, null);
        }
    };
    const deleteAppDirs = async () => {
        const appDataPath = gio2.File.new_for_path(getAppDataPath());
        if (appDataPath.query_exists(null)) {
            await deleteDirectory(appDataPath);
        }
        const cachePath = gio2.File.new_for_path(getCachePath());
        if (cachePath.query_exists(null)) {
            await deleteDirectory(cachePath);
        }
        const dbPath = gio2.File.new_for_path(`${getDbPath()}/pano.db`);
        if (dbPath.query_exists(null)) {
            dbPath.delete(null);
        }
    };
    const getDbPath = () => {
        const path = getCurrentExtensionSettings().get_string('database-location');
        if (!path) {
            return getAppDataPath();
        }
        return path;
    };
    const getCurrentExtension = () => imports.misc.extensionUtils.getCurrentExtension();
    const getCurrentExtensionSettings = () => imports.misc.extensionUtils.getSettings();
    const loadInterfaceXML = (iface) => {
        const uri = `file:///${getCurrentExtension().path}/dbus/${iface}.xml`;
        const file = gio2.File.new_for_uri(uri);
        try {
            const [, bytes] = file.load_contents(null);
            return imports.byteArray.toString(bytes);
        }
        catch (e) {
            debug$7(`Failed to load D-Bus interface ${iface}`);
        }
        return null;
    };
    let soundContext = null;
    const playAudio = () => {
        try {
            if (!soundContext) {
                soundContext = new gsound1.Context();
                soundContext.init(null);
            }
            soundContext.play_simple({
                [gsound1.ATTR_EVENT_ID]: 'message',
            }, null);
        }
        catch (err) {
            debug$7(`failed to play audio: ${err}`);
        }
    };
    const removeSoundContext = () => {
        if (soundContext) {
            soundContext.run_dispose();
            soundContext = null;
        }
    };
    const initTranslations = () => imports.misc.extensionUtils.initTranslations(getCurrentExtension().metadata.uuid);
    const _ = imports.gettext.domain(getCurrentExtension().metadata.uuid).gettext;
    imports.gettext.domain(getCurrentExtension().metadata.uuid).ngettext;
    let debounceIds = [];
    function debounce(func, wait) {
        let sourceId;
        return function (...args) {
            const debouncedFunc = function () {
                debounceIds = debounceIds.filter((id) => id !== sourceId);
                sourceId = null;
                func.apply(this, args);
                return glib2.SOURCE_REMOVE;
            };
            if (sourceId) {
                glib2.Source.remove(sourceId);
                debounceIds = debounceIds.filter((id) => id !== sourceId);
            }
            sourceId = glib2.timeout_add(glib2.PRIORITY_DEFAULT, wait, debouncedFunc);
            debounceIds.push(sourceId);
        };
    }
    const openLinkInBrowser = (url) => {
        try {
            gio2.app_info_launch_default_for_uri(url, null);
        }
        catch (e) {
            debug$7(`Failed to open url ${url}`);
        }
    };

    const { ModalDialog } = imports.ui.modalDialog;
    const { MessageDialogContent } = imports.ui.dialog;
    const debug$6 = logger('clear-history-dialog');
    let ClearHistoryDialog = class ClearHistoryDialog extends ModalDialog {
        constructor(onClear) {
            super();
            this.onClear = onClear;
            this.cancelButton = this.addButton({
                label: _('Cancel'),
                action: this.onCancelButtonPressed.bind(this),
                key: clutter10.KEY_Escape,
                default: true,
            });
            this.clearButton = this.addButton({
                label: _('Clear'),
                action: this.onClearButtonPressed.bind(this),
            });
            const content = new MessageDialogContent({
                title: _('Clear History'),
                description: _('Are you sure you want to clear history?'),
            });
            this.contentLayout.add(content);
        }
        onCancelButtonPressed() {
            this.close();
        }
        async onClearButtonPressed() {
            this.cancelButton.set_reactive(false);
            this.clearButton.set_reactive(false);
            this.clearButton.set_label('Clearing...');
            try {
                await this.onClear();
            }
            catch (err) {
                debug$6(`err: ${err}`);
            }
            this.close();
        }
    };
    ClearHistoryDialog = __decorate([
        registerGObjectClass
    ], ClearHistoryDialog);

    const global$1 = shell0.Global.get();
    const notify = (text, body, iconOrPixbuf, pixelFormat) => {
        const source = new imports.ui.messageTray.Source(_('Pano'), 'edit-copy-symbolic');
        imports.ui.main.messageTray.add(source);
        let notification;
        if (iconOrPixbuf) {
            if (iconOrPixbuf instanceof gdkpixbuf2.Pixbuf) {
                const content = st1.ImageContent.new_with_preferred_size(iconOrPixbuf.width, iconOrPixbuf.height);
                content.set_bytes(iconOrPixbuf.read_pixel_bytes(), pixelFormat || cogl2.PixelFormat.RGBA_8888, iconOrPixbuf.width, iconOrPixbuf.height, iconOrPixbuf.rowstride);
                notification = new imports.ui.messageTray.Notification(source, text, body, {
                    datetime: glib2.DateTime.new_now_local(),
                    gicon: content,
                });
            }
            else {
                notification = new imports.ui.messageTray.Notification(source, text, body, {
                    datetime: glib2.DateTime.new_now_local(),
                    gicon: iconOrPixbuf,
                });
            }
        }
        else {
            notification = new imports.ui.messageTray.Notification(source, text, body);
        }
        notification.setTransient(true);
        source.showNotification(notification);
    };
    const wm = imports.ui.main.wm;
    const getMonitors = () => imports.ui.main.layoutManager.monitors;
    const getMonitorIndexForPointer = () => {
        const [x, y] = global$1.get_pointer();
        const monitors = getMonitors();
        for (let i = 0; i <= monitors.length; i++) {
            const monitor = monitors[i];
            if (x >= monitor.x && x < monitor.x + monitor.width && y >= monitor.y && y < monitor.y + monitor.height) {
                return i;
            }
        }
        return imports.ui.main.layoutManager.primaryIndex;
    };
    const getMonitorConstraint = () => new imports.ui.layout.MonitorConstraint({
        index: getMonitorIndexForPointer(),
    });
    const addTopChrome = (actor, options) => imports.ui.main.layoutManager.addTopChrome(actor, options);
    const removeChrome = (actor) => imports.ui.main.layoutManager.removeChrome(actor);
    let virtualKeyboard = null;
    const getVirtualKeyboard = () => {
        if (virtualKeyboard) {
            return virtualKeyboard;
        }
        virtualKeyboard = clutter10.get_default_backend().get_default_seat().create_virtual_device(clutter10.InputDeviceType.KEYBOARD_DEVICE);
        return virtualKeyboard;
    };
    const removeVirtualKeyboard = () => {
        if (virtualKeyboard) {
            virtualKeyboard.run_dispose();
            virtualKeyboard = null;
        }
    };
    const addToStatusArea = (button) => {
        imports.ui.main.panel.addToStatusArea(getCurrentExtension().metadata.uuid, button, 1, 'right');
    };
    const openExtensionPrefs = () => imports.misc.extensionUtils.openPrefs();

    const { PopupMenuItem, PopupSwitchMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
    const { Button: PopupMenuButton } = imports.ui.panelMenu;
    let SettingsMenu = class SettingsMenu extends PopupMenuButton {
        constructor(onClear, onToggle) {
            super(0.5, 'Pano Indicator', false);
            this.onToggle = onToggle;
            this.settings = getCurrentExtensionSettings();
            const isInIncognito = this.settings.get_boolean('is-in-incognito');
            const icon = new st1.Icon({
                gicon: gio2.icon_new_for_string(`${getCurrentExtension().path}/icons/hicolor/scalable/actions/indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`),
                style_class: 'system-status-icon indicator-icon',
            });
            this.add_child(icon);
            const switchMenuItem = new PopupSwitchMenuItem(_('Incognito Mode'), this.settings.get_boolean('is-in-incognito'));
            switchMenuItem.connect('toggled', (item) => {
                this.settings.set_boolean('is-in-incognito', item.state);
            });
            this.incognitoChangeId = this.settings.connect('changed::is-in-incognito', () => {
                const isInIncognito = this.settings.get_boolean('is-in-incognito');
                switchMenuItem.setToggleState(isInIncognito);
                icon.set_gicon(gio2.icon_new_for_string(`${getCurrentExtension().path}/icons/hicolor/scalable/actions/indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`));
            });
            this.menu.addMenuItem(switchMenuItem);
            this.menu.addMenuItem(new PopupSeparatorMenuItem());
            const clearHistoryItem = new PopupMenuItem(_('Clear History'));
            clearHistoryItem.connect('activate', () => {
                const dialog = new ClearHistoryDialog(onClear);
                dialog.open();
            });
            this.menu.addMenuItem(clearHistoryItem);
            this.menu.addMenuItem(new PopupSeparatorMenuItem());
            const settingsItem = new PopupMenuItem(_('Settings'));
            settingsItem.connect('activate', () => {
                openExtensionPrefs();
            });
            this.menu.addMenuItem(settingsItem);
        }
        vfunc_event(event) {
            if (!this.menu || event.type() !== clutter10.EventType.BUTTON_PRESS) {
                return clutter10.EVENT_PROPAGATE;
            }
            if (event.get_button() === clutter10.BUTTON_PRIMARY || event.get_button() === clutter10.BUTTON_MIDDLE) {
                this.onToggle();
            }
            else if (event.get_button() === clutter10.BUTTON_SECONDARY) {
                this.menu.toggle();
            }
            return clutter10.EVENT_PROPAGATE;
        }
        destroy() {
            this.settings.disconnect(this.incognitoChangeId);
            super.destroy();
        }
    };
    SettingsMenu.metaInfo = {
        GTypeName: 'SettingsButton',
        Signals: {
            'item-selected': {},
            'menu-state-changed': {
                param_types: [gobject2.TYPE_BOOLEAN],
                accumulator: 0,
            },
        },
    };
    SettingsMenu = __decorate([
        registerGObjectClass
    ], SettingsMenu);

    const { Lightbox } = imports.ui.lightbox;
    let MonitorBox = class MonitorBox extends st1.BoxLayout {
        constructor() {
            super({
                name: 'PanoMonitorBox',
                visible: false,
                reactive: true,
                x: 0,
                y: 0,
            });
            this.connect('button-press-event', () => {
                this.emit('hide');
                return clutter10.EVENT_STOP;
            });
            const constraint = new clutter10.BindConstraint({
                source: shell0.Global.get().stage,
                coordinate: clutter10.BindCoordinate.ALL,
            });
            this.add_constraint(constraint);
            const backgroundStack = new st1.Widget({
                layout_manager: new clutter10.BinLayout(),
                x_expand: true,
                y_expand: true,
            });
            const _backgroundBin = new st1.Bin({ child: backgroundStack });
            const _monitorConstraint = new imports.ui.layout.MonitorConstraint();
            _backgroundBin.add_constraint(_monitorConstraint);
            this.add_actor(_backgroundBin);
            this._lightbox = new Lightbox(this, {
                inhibitEvents: true,
                radialEffect: false,
            });
            this._lightbox.highlight(_backgroundBin);
            this._lightbox.set({ style_class: 'pano-monitor-box' });
            const _eventBlocker = new clutter10.Actor({ reactive: true });
            backgroundStack.add_actor(_eventBlocker);
            imports.ui.main.uiGroup.add_actor(this);
        }
        open() {
            this._lightbox.lightOn();
            this.show();
        }
        close() {
            this._lightbox.lightOff();
            this.hide();
        }
        destroy() {
            super.destroy();
        }
    };
    MonitorBox.metaInfo = {
        GTypeName: 'MonitorBox',
        Signals: {
            hide: {},
        },
    };
    MonitorBox = __decorate([
        registerGObjectClass
    ], MonitorBox);

    const global = shell0.Global.get();
    const debug$5 = logger('clipboard-manager');
    const MimeType = {
        TEXT: ['text/plain', 'text/plain;charset=utf-8', 'UTF8_STRING'],
        IMAGE: ['image/png'],
        GNOME_FILE: ['x-special/gnome-copied-files'],
        SENSITIVE: ['x-kde-passwordManagerHint'],
    };
    var ContentType;
    (function (ContentType) {
        ContentType[ContentType["IMAGE"] = 0] = "IMAGE";
        ContentType[ContentType["FILE"] = 1] = "FILE";
        ContentType[ContentType["TEXT"] = 2] = "TEXT";
    })(ContentType || (ContentType = {}));
    const FileOperation = {
        CUT: 'cut',
        COPY: 'copy',
    };
    let ClipboardContent = class ClipboardContent extends gobject2.Object {
        constructor(content) {
            super();
            this.content = content;
        }
    };
    ClipboardContent.metaInfo = {
        GTypeName: 'ClipboardContent',
    };
    ClipboardContent = __decorate([
        registerGObjectClass
    ], ClipboardContent);
    const arraybufferEqual = (buf1, buf2) => {
        if (buf1 === buf2) {
            return true;
        }
        if (buf1.byteLength !== buf2.byteLength) {
            return false;
        }
        const view1 = new DataView(buf1);
        const view2 = new DataView(buf2);
        let i = buf1.byteLength;
        while (i--) {
            if (view1.getUint8(i) !== view2.getUint8(i)) {
                return false;
            }
        }
        return true;
    };
    const compareClipboardContent = (content1, content2) => {
        if (!content2) {
            return false;
        }
        if (content1.type !== content2.type) {
            return false;
        }
        if (content1.type === ContentType.TEXT) {
            return content1.value === content2.value;
        }
        if (content1.type === ContentType.IMAGE && content2.type === ContentType.IMAGE) {
            return arraybufferEqual(content1.value, content2.value);
        }
        if (content1.type === ContentType.FILE && content2.type === ContentType.FILE) {
            return (content1.value.operation === content2.value.operation &&
                content1.value.fileList.length === content2.value.fileList.length &&
                content1.value.fileList.every((file, index) => file === content2.value.fileList[index]));
        }
        return false;
    };
    let ClipboardManager = class ClipboardManager extends gobject2.Object {
        constructor() {
            super();
            this.settings = getCurrentExtensionSettings();
            this.clipboard = st1.Clipboard.get_default();
            this.selection = global.get_display().get_selection();
            this.lastCopiedContent = null;
        }
        startTracking() {
            this.lastCopiedContent = null;
            this.isTracking = true;
            const primaryTracker = debounce(async () => {
                const result = await this.getContent(st1.ClipboardType.PRIMARY);
                if (!result) {
                    return;
                }
                if (compareClipboardContent(result.content, this.lastCopiedContent?.content)) {
                    return;
                }
                this.lastCopiedContent = result;
                this.emit('changed', result);
            }, 500);
            this.selectionChangedId = this.selection.connect('owner-changed', async (_selection, selectionType, _selectionSource) => {
                if (this.settings.get_boolean('is-in-incognito')) {
                    return;
                }
                const focussedWindow = shell0.Global.get().display.focus_window;
                const wmClass = focussedWindow?.get_wm_class();
                if (wmClass &&
                    this.settings.get_boolean('watch-exclusion-list') &&
                    this.settings
                        .get_strv('exclusion-list')
                        .map((s) => s.toLowerCase())
                        .indexOf(wmClass.toLowerCase()) >= 0) {
                    return;
                }
                if (selectionType === meta10.SelectionType.SELECTION_CLIPBOARD) {
                    try {
                        const result = await this.getContent(st1.ClipboardType.CLIPBOARD);
                        if (!result) {
                            return;
                        }
                        if (compareClipboardContent(result.content, this.lastCopiedContent?.content)) {
                            return;
                        }
                        this.lastCopiedContent = result;
                        this.emit('changed', result);
                    }
                    catch (err) {
                        debug$5(`error: ${err}`);
                    }
                }
                else if (selectionType === meta10.SelectionType.SELECTION_PRIMARY) {
                    try {
                        if (this.settings.get_boolean('sync-primary')) {
                            primaryTracker();
                        }
                    }
                    catch (err) {
                        debug$5(`error: ${err}`);
                    }
                }
            });
        }
        stopTracking() {
            this.selection.disconnect(this.selectionChangedId);
            this.isTracking = false;
            this.lastCopiedContent = null;
        }
        setContent({ content }) {
            const syncPrimary = this.settings.get_boolean('sync-primary');
            if (content.type === ContentType.TEXT) {
                if (syncPrimary) {
                    this.clipboard.set_text(st1.ClipboardType.PRIMARY, content.value);
                }
                this.clipboard.set_text(st1.ClipboardType.CLIPBOARD, content.value);
            }
            else if (content.type === ContentType.IMAGE) {
                if (syncPrimary) {
                    this.clipboard.set_content(st1.ClipboardType.PRIMARY, MimeType.IMAGE[0], content.value);
                }
                this.clipboard.set_content(st1.ClipboardType.CLIPBOARD, MimeType.IMAGE[0], content.value);
            }
            else if (content.type === ContentType.FILE) {
                if (syncPrimary) {
                    this.clipboard.set_content(st1.ClipboardType.PRIMARY, MimeType.GNOME_FILE[0], new TextEncoder().encode([content.value.operation, ...content.value.fileList].join('\n')));
                }
                this.clipboard.set_content(st1.ClipboardType.CLIPBOARD, MimeType.GNOME_FILE[0], new TextEncoder().encode([content.value.operation, ...content.value.fileList].join('\n')));
            }
        }
        haveMimeType(clipboardMimeTypes, targetMimeTypes) {
            return clipboardMimeTypes.find((m) => targetMimeTypes.indexOf(m) >= 0) !== undefined;
        }
        getCurrentMimeType(clipboardMimeTypes, targetMimeTypes) {
            return clipboardMimeTypes.find((m) => targetMimeTypes.indexOf(m) >= 0);
        }
        async getContent(clipboardType) {
            return new Promise((resolve) => {
                const cbMimeTypes = this.clipboard.get_mimetypes(clipboardType);
                if (this.haveMimeType(cbMimeTypes, MimeType.SENSITIVE)) {
                    resolve(null);
                    return;
                }
                else if (this.haveMimeType(cbMimeTypes, MimeType.GNOME_FILE)) {
                    const currentMimeType = this.getCurrentMimeType(cbMimeTypes, MimeType.GNOME_FILE);
                    if (!currentMimeType) {
                        resolve(null);
                        return;
                    }
                    this.clipboard.get_content(clipboardType, currentMimeType, (_, bytes) => {
                        const data = bytes instanceof glib2.Bytes ? bytes.get_data() : bytes;
                        if (data && data.length > 0) {
                            const content = new TextDecoder().decode(data);
                            const fileContent = content.split('\n').filter((c) => !!c);
                            const hasOperation = fileContent[0] === FileOperation.CUT || fileContent[0] === FileOperation.COPY;
                            resolve(new ClipboardContent({
                                type: ContentType.FILE,
                                value: {
                                    operation: hasOperation ? fileContent[0] : FileOperation.COPY,
                                    fileList: hasOperation ? fileContent.slice(1) : fileContent,
                                },
                            }));
                            return;
                        }
                        resolve(null);
                    });
                }
                else if (this.haveMimeType(cbMimeTypes, MimeType.IMAGE)) {
                    const currentMimeType = this.getCurrentMimeType(cbMimeTypes, MimeType.IMAGE);
                    if (!currentMimeType) {
                        resolve(null);
                        return;
                    }
                    this.clipboard.get_content(clipboardType, currentMimeType, (_, bytes) => {
                        const data = bytes instanceof glib2.Bytes ? bytes.get_data() : bytes;
                        if (data && data.length > 0) {
                            resolve(new ClipboardContent({
                                type: ContentType.IMAGE,
                                value: data,
                            }));
                            return;
                        }
                        resolve(null);
                    });
                }
                else if (this.haveMimeType(cbMimeTypes, MimeType.TEXT)) {
                    this.clipboard.get_text(clipboardType, (_, text) => {
                        if (text && text.trim()) {
                            resolve(new ClipboardContent({
                                type: ContentType.TEXT,
                                value: text.trim(),
                            }));
                            return;
                        }
                        resolve(null);
                    });
                }
                else {
                    resolve(null);
                }
            });
        }
    };
    ClipboardManager.metaInfo = {
        GTypeName: 'PanoClipboardManager',
        Signals: {
            changed: {
                param_types: [ClipboardContent.$gtype],
                accumulator: 0,
            },
        },
    };
    ClipboardManager = __decorate([
        registerGObjectClass
    ], ClipboardManager);
    const clipboardManager = new ClipboardManager();

    const debug$4 = logger('database');
    class ClipboardQuery {
        constructor(statement) {
            this.statement = statement;
        }
    }
    /**
     * This is hack for libgda6 <> libgda5 compatibility.
     *
     * @param value any
     * @returns expr id
     */
    const add_expr_value = (builder, value) => {
        if (builder.add_expr_value.length === 1) {
            return builder.add_expr_value(value);
        }
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return builder.add_expr_value(null, value);
    };
    class ClipboardQueryBuilder {
        constructor() {
            this.conditions = [];
            this.builder = new gda6.SqlBuilder({
                stmt_type: gda6.SqlStatementType.SELECT,
            });
            this.builder.select_add_field('id', 'clipboard', 'id');
            this.builder.select_add_field('itemType', 'clipboard', 'itemType');
            this.builder.select_add_field('content', 'clipboard', 'content');
            this.builder.select_add_field('copyDate', 'clipboard', 'copyDate');
            this.builder.select_add_field('isFavorite', 'clipboard', 'isFavorite');
            this.builder.select_add_field('matchValue', 'clipboard', 'matchValue');
            this.builder.select_add_field('searchValue', 'clipboard', 'searchValue');
            this.builder.select_add_field('metaData', 'clipboard', 'metaData');
            this.builder.select_order_by(this.builder.add_field_id('copyDate', 'clipboard'), false, null);
            this.builder.select_add_target('clipboard', null);
        }
        withLimit(limit, offset) {
            this.builder.select_set_limit(add_expr_value(this.builder, limit), add_expr_value(this.builder, offset));
            return this;
        }
        withId(id) {
            if (id !== null && id !== undefined) {
                this.conditions.push(this.builder.add_cond(gda6.SqlOperatorType.EQ, this.builder.add_field_id('id', 'clipboard'), add_expr_value(this.builder, id), 0));
            }
            return this;
        }
        withItemTypes(itemTypes) {
            if (itemTypes !== null && itemTypes !== undefined) {
                const orConditions = itemTypes.map((itemType) => this.builder.add_cond(gda6.SqlOperatorType.EQ, this.builder.add_field_id('itemType', 'clipboard'), add_expr_value(this.builder, itemType), 0));
                this.conditions.push(this.builder.add_cond_v(gda6.SqlOperatorType.OR, orConditions));
            }
            return this;
        }
        withContent(content) {
            if (content !== null && content !== undefined) {
                this.conditions.push(this.builder.add_cond(gda6.SqlOperatorType.EQ, this.builder.add_field_id('content', 'clipboard'), add_expr_value(this.builder, content), 0));
            }
            return this;
        }
        withMatchValue(matchValue) {
            if (matchValue !== null && matchValue !== undefined) {
                this.conditions.push(this.builder.add_cond(gda6.SqlOperatorType.EQ, this.builder.add_field_id('matchValue', 'clipboard'), add_expr_value(this.builder, matchValue), 0));
            }
            return this;
        }
        withContainingContent(content) {
            if (content !== null && content !== undefined) {
                this.conditions.push(this.builder.add_cond(gda6.SqlOperatorType.LIKE, this.builder.add_field_id('content', 'clipboard'), add_expr_value(this.builder, `%${content}%`), 0));
            }
            return this;
        }
        withContainingSearchValue(searchValue) {
            if (searchValue !== null && searchValue !== undefined) {
                this.conditions.push(this.builder.add_cond(gda6.SqlOperatorType.LIKE, this.builder.add_field_id('searchValue', 'clipboard'), add_expr_value(this.builder, `%${searchValue}%`), 0));
            }
            return this;
        }
        withFavorites(include) {
            if (include !== null && include !== undefined) {
                this.conditions.push(this.builder.add_cond(gda6.SqlOperatorType.EQ, this.builder.add_field_id('isFavorite', 'clipboard'), add_expr_value(this.builder, +include), 0));
            }
            return this;
        }
        build() {
            if (this.conditions.length > 0) {
                this.builder.set_where(this.builder.add_cond_v(gda6.SqlOperatorType.AND, this.conditions));
            }
            return new ClipboardQuery(this.builder.get_statement());
        }
    }
    class Database {
        init() {
            this.settings = getCurrentExtensionSettings();
            this.connection = new gda6.Connection({
                provider: gda6.Config.get_provider('SQLite'),
                cnc_string: `DB_DIR=${getDbPath()};DB_NAME=pano`,
            });
            this.connection.open();
        }
        setup() {
            this.init();
            if (!this.connection || !this.connection.is_opened()) {
                debug$4('connection is not opened');
                return;
            }
            this.connection.execute_non_select_command(`
      create table if not exists clipboard
      (
          id          integer not null constraint clipboard_pk primary key autoincrement,
          itemType    text not null,
          content     text not null,
          copyDate    text not null,
          isFavorite  integer not null,
          matchValue  text not null,
          searchValue text,
          metaData    text
      );
    `);
            this.connection.execute_non_select_command(`
      create unique index if not exists clipboard_id_uindex on clipboard (id);
    `);
        }
        save(dbItem) {
            if (!this.connection || !this.connection.is_opened()) {
                debug$4('connection is not opened');
                return null;
            }
            const builder = new gda6.SqlBuilder({
                stmt_type: gda6.SqlStatementType.INSERT,
            });
            builder.set_table('clipboard');
            builder.add_field_value_as_gvalue('itemType', dbItem.itemType);
            builder.add_field_value_as_gvalue('content', dbItem.content);
            builder.add_field_value_as_gvalue('copyDate', dbItem.copyDate.toISOString());
            builder.add_field_value_as_gvalue('isFavorite', +dbItem.isFavorite);
            builder.add_field_value_as_gvalue('matchValue', dbItem.matchValue);
            if (dbItem.searchValue) {
                builder.add_field_value_as_gvalue('searchValue', dbItem.searchValue);
            }
            if (dbItem.metaData) {
                builder.add_field_value_as_gvalue('metaData', dbItem.metaData);
            }
            const [_, row] = this.connection.statement_execute_non_select(builder.get_statement(), null);
            const id = row?.get_nth_holder(0).get_value();
            if (!id) {
                return null;
            }
            return {
                id,
                itemType: dbItem.itemType,
                content: dbItem.content,
                copyDate: dbItem.copyDate,
                isFavorite: dbItem.isFavorite,
                matchValue: dbItem.matchValue,
                searchValue: dbItem.searchValue,
                metaData: dbItem.metaData,
            };
        }
        update(dbItem) {
            if (!this.connection || !this.connection.is_opened()) {
                debug$4('connection is not opened');
                return null;
            }
            const builder = new gda6.SqlBuilder({
                stmt_type: gda6.SqlStatementType.UPDATE,
            });
            builder.set_table('clipboard');
            builder.add_field_value_as_gvalue('itemType', dbItem.itemType);
            builder.add_field_value_as_gvalue('content', dbItem.content);
            builder.add_field_value_as_gvalue('copyDate', dbItem.copyDate.toISOString());
            builder.add_field_value_as_gvalue('isFavorite', +dbItem.isFavorite);
            builder.add_field_value_as_gvalue('matchValue', dbItem.matchValue);
            if (dbItem.searchValue) {
                builder.add_field_value_as_gvalue('searchValue', dbItem.searchValue);
            }
            if (dbItem.metaData) {
                builder.add_field_value_as_gvalue('metaData', dbItem.metaData);
            }
            builder.set_where(builder.add_cond(gda6.SqlOperatorType.EQ, builder.add_field_id('id', 'clipboard'), add_expr_value(builder, dbItem.id), 0));
            this.connection.statement_execute_non_select(builder.get_statement(), null);
            return dbItem;
        }
        delete(id) {
            if (!this.connection || !this.connection.is_opened()) {
                debug$4('connection is not opened');
                return;
            }
            const builder = new gda6.SqlBuilder({
                stmt_type: gda6.SqlStatementType.DELETE,
            });
            builder.set_table('clipboard');
            builder.set_where(builder.add_cond(gda6.SqlOperatorType.EQ, builder.add_field_id('id', 'clipboard'), add_expr_value(builder, id), 0));
            this.connection.statement_execute_non_select(builder.get_statement(), null);
        }
        query(clipboardQuery) {
            if (!this.connection || !this.connection.is_opened()) {
                return [];
            }
            // debug(`${clipboardQuery.statement.to_sql_extended(this.connection, null, StatementSqlFlag.PRETTY)}`);
            const dm = this.connection.statement_execute_select(clipboardQuery.statement, null);
            const iter = dm.create_iter();
            const itemList = [];
            while (iter.move_next()) {
                const id = iter.get_value_for_field('id');
                const itemType = iter.get_value_for_field('itemType');
                const content = iter.get_value_for_field('content');
                const copyDate = iter.get_value_for_field('copyDate');
                const isFavorite = iter.get_value_for_field('isFavorite');
                const matchValue = iter.get_value_for_field('matchValue');
                const searchValue = iter.get_value_for_field('searchValue');
                const metaData = iter.get_value_for_field('metaData');
                itemList.push({
                    id,
                    itemType,
                    content,
                    copyDate: new Date(copyDate),
                    isFavorite: !!isFavorite,
                    matchValue,
                    searchValue,
                    metaData,
                });
            }
            return itemList;
        }
        start() {
            if (!this.connection) {
                this.init();
            }
            if (this.connection && !this.connection.is_opened()) {
                this.connection.open();
            }
        }
        shutdown() {
            if (this.connection && this.connection.is_opened()) {
                this.connection.close();
                this.connection = null;
            }
        }
    }
    const db = new Database();

    const langs = glib2.get_language_names_with_category('LC_MESSAGES').map((l) => l.replaceAll('_', '').replaceAll('-', '').split('.')[0]);
    const localeKey = Object.keys(dateLocale__namespace).find((key) => langs.includes(key));
    let PanoItemHeader = class PanoItemHeader extends st1.BoxLayout {
        constructor(itemType, date) {
            super({
                style_class: `pano-item-header pano-item-header-${itemType.classSuffix}`,
                vertical: false,
                x_expand: true,
                y_expand: false,
                x_align: clutter10.ActorAlign.FILL,
                y_align: clutter10.ActorAlign.START,
            });
            const titleContainer = new st1.BoxLayout({
                style_class: 'pano-item-title-container',
                vertical: true,
                x_expand: true,
            });
            const iconContainer = new st1.BoxLayout({
                style_class: 'pano-icon-container',
            });
            iconContainer.add_child(new st1.Icon({
                gicon: gio2.icon_new_for_string(`${getCurrentExtension().path}/icons/hicolor/scalable/actions/${itemType.iconPath}`),
            }));
            titleContainer.add_child(new st1.Label({
                text: itemType.title,
                style_class: 'pano-item-title',
                x_expand: true,
            }));
            const dateLabel = new st1.Label({
                text: formatDistanceToNow__default["default"](date, { addSuffix: true, locale: localeKey ? dateLocale__namespace[localeKey] : undefined }),
                style_class: 'pano-item-date',
                x_expand: true,
                y_expand: true,
            });
            this.dateUpdateIntervalId = setInterval(() => {
                dateLabel.set_text(formatDistanceToNow__default["default"](date, { addSuffix: true, locale: localeKey ? dateLocale__namespace[localeKey] : undefined }));
            }, 60000);
            titleContainer.add_child(dateLabel);
            const actionContainer = new st1.BoxLayout({
                style_class: 'pano-item-actions',
                x_expand: false,
                y_expand: true,
                x_align: clutter10.ActorAlign.END,
                y_align: clutter10.ActorAlign.START,
            });
            const favoriteIcon = new st1.Icon({
                icon_name: 'starred-symbolic',
                icon_size: 10,
            });
            this.favoriteButton = new st1.Button({
                style_class: 'pano-item-favorite-button',
                child: favoriteIcon,
            });
            this.favoriteButton.connect('clicked', () => {
                this.emit('on-favorite');
                return clutter10.EVENT_PROPAGATE;
            });
            const removeIcon = new st1.Icon({
                icon_name: 'window-close-symbolic',
                icon_size: 10,
            });
            const removeButton = new st1.Button({
                style_class: 'pano-item-remove-button',
                child: removeIcon,
            });
            removeButton.connect('clicked', () => {
                this.emit('on-remove');
                return clutter10.EVENT_PROPAGATE;
            });
            actionContainer.add_child(this.favoriteButton);
            actionContainer.add_child(removeButton);
            this.add_child(iconContainer);
            this.add_child(titleContainer);
            this.add_child(actionContainer);
        }
        setFavorite(isFavorite) {
            if (isFavorite) {
                this.favoriteButton.add_style_pseudo_class('active');
            }
            else {
                this.favoriteButton.remove_style_pseudo_class('active');
            }
        }
        destroy() {
            clearInterval(this.dateUpdateIntervalId);
            super.destroy();
        }
    };
    PanoItemHeader.metaInfo = {
        GTypeName: 'PanoItemHeader',
        Signals: {
            'on-remove': {},
            'on-favorite': {},
        },
    };
    PanoItemHeader = __decorate([
        registerGObjectClass
    ], PanoItemHeader);

    const PanoItemTypes = {
        LINK: { classSuffix: 'link', title: _('Link'), iconPath: 'link-symbolic.svg', iconName: 'link-symbolic' },
        TEXT: { classSuffix: 'text', title: _('Text'), iconPath: 'text-symbolic.svg', iconName: 'text-symbolic' },
        EMOJI: { classSuffix: 'emoji', title: _('Emoji'), iconPath: 'emoji-symbolic.svg', iconName: 'emoji-symbolic' },
        FILE: { classSuffix: 'file', title: _('File'), iconPath: 'file-symbolic.svg', iconName: 'file-symbolic' },
        IMAGE: { classSuffix: 'image', title: _('Image'), iconPath: 'image-symbolic.svg', iconName: 'image-symbolic' },
        CODE: { classSuffix: 'code', title: _('Code'), iconPath: 'code-symbolic.svg', iconName: 'code-symbolic' },
        COLOR: { classSuffix: 'color', title: _('Color'), iconPath: 'color-symbolic.svg', iconName: 'color-symbolic' },
    };

    let PanoItem = class PanoItem extends st1.BoxLayout {
        constructor(dbItem) {
            super({
                name: 'pano-item',
                visible: true,
                pivot_point: new graphene1.Point({ x: 0.5, y: 0.5 }),
                reactive: true,
                style_class: 'pano-item',
                vertical: true,
                track_hover: true,
            });
            this.dbItem = dbItem;
            this.settings = getCurrentExtensionSettings();
            this.connect('key-focus-in', () => this.setSelected(true));
            this.connect('key-focus-out', () => this.setSelected(false));
            this.connect('enter-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.POINTING_HAND);
                if (!this.selected) {
                    this.set_style(`border: 4px solid ${this.settings.get_string('hovered-item-border-color')}`);
                }
            });
            this.connect('motion-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.POINTING_HAND);
            });
            this.connect('leave-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.DEFAULT);
                if (!this.selected) {
                    this.set_style('');
                }
            });
            this.connect('activated', () => {
                this.get_parent()?.get_parent()?.get_parent()?.hide();
                if (this.dbItem.itemType === 'LINK' && this.settings.get_boolean('open-links-in-browser')) {
                    return;
                }
                if (this.settings.get_boolean('paste-on-select')) {
                    // See https://github.com/SUPERCILEX/gnome-clipboard-history/blob/master/extension.js#L606
                    this.timeoutId = glib2.timeout_add(glib2.PRIORITY_DEFAULT, 250, () => {
                        getVirtualKeyboard().notify_keyval(clutter10.get_current_event_time(), clutter10.KEY_Control_L, clutter10.KeyState.RELEASED);
                        getVirtualKeyboard().notify_keyval(clutter10.get_current_event_time(), clutter10.KEY_Control_L, clutter10.KeyState.PRESSED);
                        getVirtualKeyboard().notify_keyval(clutter10.get_current_event_time(), clutter10.KEY_v, clutter10.KeyState.PRESSED);
                        getVirtualKeyboard().notify_keyval(clutter10.get_current_event_time(), clutter10.KEY_Control_L, clutter10.KeyState.RELEASED);
                        getVirtualKeyboard().notify_keyval(clutter10.get_current_event_time(), clutter10.KEY_v, clutter10.KeyState.RELEASED);
                        if (this.timeoutId) {
                            glib2.Source.remove(this.timeoutId);
                        }
                        this.timeoutId = undefined;
                        return glib2.SOURCE_REMOVE;
                    });
                }
            });
            this.header = new PanoItemHeader(PanoItemTypes[dbItem.itemType], dbItem.copyDate);
            this.header.setFavorite(this.dbItem.isFavorite);
            this.header.connect('on-remove', () => {
                this.emit('on-remove', JSON.stringify(this.dbItem));
                return clutter10.EVENT_PROPAGATE;
            });
            this.header.connect('on-favorite', () => {
                this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
                this.emit('on-favorite', JSON.stringify(this.dbItem));
                return clutter10.EVENT_PROPAGATE;
            });
            this.connect('on-favorite', () => {
                this.header.setFavorite(this.dbItem.isFavorite);
                return clutter10.EVENT_PROPAGATE;
            });
            this.body = new st1.BoxLayout({
                style_class: 'pano-item-body',
                clip_to_allocation: true,
                vertical: true,
                x_expand: true,
                y_expand: true,
            });
            this.add_child(this.header);
            this.add_child(this.body);
            const themeContext = st1.ThemeContext.get_for_stage(shell0.Global.get().get_stage());
            themeContext.connect('notify::scale-factor', () => {
                this.setWindowHeight();
            });
            this.setWindowHeight();
            this.settings.connect('changed::window-height', () => {
                this.setWindowHeight();
            });
        }
        setWindowHeight() {
            const { scaleFactor } = st1.ThemeContext.get_for_stage(shell0.Global.get().get_stage());
            this.set_height((this.settings.get_int('window-height') - 80) * scaleFactor);
            this.set_width((this.settings.get_int('window-height') - 80) * scaleFactor);
            this.body.set_height((this.settings.get_int('window-height') - 80 - 57) * scaleFactor);
        }
        setSelected(selected) {
            if (selected) {
                const activeItemBorderColor = this.settings.get_string('active-item-border-color');
                this.set_style(`border: 4px solid ${activeItemBorderColor} !important;`);
                this.grab_key_focus();
            }
            else {
                this.set_style('');
            }
            this.selected = selected;
        }
        vfunc_key_press_event(event) {
            if (event.keyval === clutter10.KEY_Return || event.keyval === clutter10.KEY_ISO_Enter || event.keyval === clutter10.KEY_KP_Enter) {
                this.emit('activated');
                return clutter10.EVENT_STOP;
            }
            if (event.keyval === clutter10.KEY_Delete || event.keyval === clutter10.KEY_KP_Delete) {
                this.emit('on-remove', JSON.stringify(this.dbItem));
                return clutter10.EVENT_STOP;
            }
            if ((event.keyval === clutter10.KEY_S || event.keyval === clutter10.KEY_s) && event.modifier_state === clutter10.ModifierType.CONTROL_MASK) {
                this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
                this.emit('on-favorite', JSON.stringify(this.dbItem));
                return clutter10.EVENT_STOP;
            }
            return clutter10.EVENT_PROPAGATE;
        }
        vfunc_button_release_event(event) {
            if (event.button === 1) {
                this.emit('activated');
                return clutter10.EVENT_STOP;
            }
            return clutter10.EVENT_PROPAGATE;
        }
        destroy() {
            if (this.timeoutId) {
                glib2.Source.remove(this.timeoutId);
            }
            this.header.destroy();
            super.destroy();
        }
    };
    PanoItem.metaInfo = {
        GTypeName: 'PanoItem',
        Signals: {
            activated: {},
            'on-remove': {
                param_types: [gobject2.TYPE_STRING],
                accumulator: 0,
            },
            'on-favorite': {
                param_types: [gobject2.TYPE_STRING],
                accumulator: 0,
            },
        },
    };
    PanoItem = __decorate([
        registerGObjectClass
    ], PanoItem);

    const debug$3 = logger('pango');
    const INVISIBLE_SPACE = '​';
    const CLASS_NAMES = [
        { classNames: 'comment', fgcolor: '#636f88' },
        { classNames: 'prolog', fgcolor: '#636f88' },
        { classNames: 'doctype', fgcolor: '#636f88' },
        { classNames: 'cdata', fgcolor: '#636f88' },
        { classNames: 'punctuation', fgcolor: '#81A1C1' },
        { classNames: 'interpolation-punctuation', fgcolor: '#81A1C1' },
        { classNames: 'template-punctuation', fgcolor: '#81A1C1' },
        { classNames: 'property', fgcolor: '#81A1C1' },
        { classNames: 'string-property', fgcolor: '#81A1C1' },
        { classNames: 'parameter', fgcolor: '#81A1C1' },
        { classNames: 'literal-property', fgcolor: '#81A1C1' },
        { classNames: 'tag', fgcolor: '#81A1C1' },
        { classNames: 'constant', fgcolor: '#81A1C1' },
        { classNames: 'symbol', fgcolor: '#81A1C1' },
        { classNames: 'deleted', fgcolor: '#81A1C1' },
        { classNames: 'number', fgcolor: '#B48EAD' },
        { classNames: 'boolean', fgcolor: '#81A1C1' },
        { classNames: 'selector', fgcolor: '#A3BE8C' },
        { classNames: 'attr-name', fgcolor: '#A3BE8C' },
        { classNames: 'string', fgcolor: '#A3BE8C' },
        { classNames: 'template-string', fgcolor: '#A3BE8C' },
        { classNames: 'char', fgcolor: '#A3BE8C' },
        { classNames: 'builtin', fgcolor: '#A3BE8C' },
        { classNames: 'interpolation', fgcolor: '#A3BE8C' },
        { classNames: 'inserted', fgcolor: '#A3BE8C' },
        { classNames: 'operator', fgcolor: '#81A1C1' },
        { classNames: 'entity', fgcolor: '#81A1C1' },
        { classNames: 'url', fgcolor: '#81A1C1' },
        { classNames: 'variable', fgcolor: '#81A1C1' },
        { classNames: 'function-variable', fgcolor: '#81A1C1' },
        { classNames: 'atrule', fgcolor: '#88C0D0' },
        { classNames: 'attr-value', fgcolor: '#88C0D0' },
        { classNames: 'function', fgcolor: '#88C0D0' },
        { classNames: 'class-name', fgcolor: '#88C0D0' },
        { classNames: 'keyword', fgcolor: '#81A1C1' },
        { classNames: 'regex', fgcolor: '#EBCB8B' },
        { classNames: 'regex-delimiter', fgcolor: '#EBCB8B' },
        { classNames: 'regex-source', fgcolor: '#EBCB8B' },
        { classNames: 'regex-flags', fgcolor: '#EBCB8B' },
        { classNames: 'important', fgcolor: '#EBCB8B' },
    ];
    const getColor = (classNames) => {
        const item = CLASS_NAMES.find((n) => classNames === n.classNames);
        if (!item) {
            debug$3(`class names not found: ${classNames}`);
            return '#fff';
        }
        return item.fgcolor;
    };
    const stringify = (o, language) => {
        if (typeof o == 'string') {
            return o;
        }
        if (Array.isArray(o)) {
            let s = '';
            o.forEach(function (e) {
                s += stringify(e, language);
            });
            return s;
        }
        const env = {
            type: o.type,
            content: stringify(o.content, language),
            tag: 'span',
            classes: [o.type],
            attributes: {},
            language: language,
        };
        let attributes = '';
        for (const name in env.attributes) {
            attributes += ` ${name}="${(env.attributes[name] || '').replace(/"/g, '&quot;')}"`;
        }
        return `<${env.tag} fgcolor="${getColor(env.classes.join(' '))}" ${attributes}>${env.content}</${env.tag}>`;
    };
    const markupCode = (text, charLength) => {
        const result = INVISIBLE_SPACE + stringify(prismjs.util.encode(prismjs.tokenize(text.slice(0, charLength), prismjs.languages.javascript)), 'javascript');
        return result;
    };

    let CodePanoItem = class CodePanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.codeItemSettings = this.settings.get_child('code-item');
            this.label = new st1.Label({
                style_class: 'pano-item-body-code-content',
                clip_to_allocation: true,
            });
            this.label.clutter_text.use_markup = true;
            this.label.clutter_text.ellipsize = pango1.EllipsizeMode.END;
            this.body.add_child(this.label);
            this.connect('activated', this.setClipboardContent.bind(this));
            this.setStyle();
            this.codeItemSettings.connect('changed', this.setStyle.bind(this));
        }
        setStyle() {
            const headerBgColor = this.codeItemSettings.get_string('header-bg-color');
            const headerColor = this.codeItemSettings.get_string('header-color');
            const bodyBgColor = this.codeItemSettings.get_string('body-bg-color');
            const bodyFontFamily = this.codeItemSettings.get_string('body-font-family');
            const bodyFontSize = this.codeItemSettings.get_int('body-font-size');
            const characterLength = this.codeItemSettings.get_int('char-length');
            this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
            this.body.set_style(`background-color: ${bodyBgColor}`);
            this.label.set_style(`font-size: ${bodyFontSize}px; font-family: ${bodyFontFamily};`);
            this.label.clutter_text.set_markup(markupCode(this.dbItem.content, characterLength));
        }
        setClipboardContent() {
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.TEXT,
                value: this.dbItem.content,
            }));
        }
    };
    CodePanoItem = __decorate([
        registerGObjectClass
    ], CodePanoItem);

    let ColorPanoItem = class ColorPanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.body.add_style_class_name('pano-item-body-color');
            this.colorItemSettings = this.settings.get_child('color-item');
            const colorContainer = new st1.BoxLayout({
                vertical: false,
                x_expand: true,
                y_expand: true,
                y_align: clutter10.ActorAlign.FILL,
                x_align: clutter10.ActorAlign.FILL,
                style_class: 'color-container',
                style: `background-color: ${this.dbItem.content};`,
            });
            this.label = new st1.Label({
                x_align: clutter10.ActorAlign.CENTER,
                y_align: clutter10.ActorAlign.CENTER,
                x_expand: true,
                y_expand: true,
                text: this.dbItem.content,
                style_class: 'color-label',
            });
            colorContainer.add_child(this.label);
            colorContainer.add_constraint(new clutter10.AlignConstraint({
                source: this,
                align_axis: clutter10.AlignAxis.Y_AXIS,
                factor: 0.005,
            }));
            this.body.add_child(colorContainer);
            this.connect('activated', this.setClipboardContent.bind(this));
            this.setStyle();
            this.colorItemSettings.connect('changed', this.setStyle.bind(this));
        }
        setStyle() {
            const headerBgColor = this.colorItemSettings.get_string('header-bg-color');
            const headerColor = this.colorItemSettings.get_string('header-color');
            const metadataBgColor = this.colorItemSettings.get_string('metadata-bg-color');
            const metadataColor = this.colorItemSettings.get_string('metadata-color');
            const metadataFontFamily = this.colorItemSettings.get_string('metadata-font-family');
            const metadataFontSize = this.colorItemSettings.get_int('metadata-font-size');
            this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
            this.label.set_style(`background-color: ${metadataBgColor}; color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`);
        }
        setClipboardContent() {
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.TEXT,
                value: this.dbItem.content,
            }));
        }
    };
    ColorPanoItem = __decorate([
        registerGObjectClass
    ], ColorPanoItem);

    let EmojiPanoItem = class EmojiPanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.body.add_style_class_name('pano-item-body-emoji');
            this.emojiItemSettings = this.settings.get_child('emoji-item');
            const emojiContainer = new st1.BoxLayout({
                vertical: false,
                x_expand: true,
                y_expand: true,
                y_align: clutter10.ActorAlign.FILL,
                x_align: clutter10.ActorAlign.FILL,
                style_class: 'emoji-container',
            });
            this.label = new st1.Label({
                x_align: clutter10.ActorAlign.CENTER,
                y_align: clutter10.ActorAlign.CENTER,
                x_expand: true,
                y_expand: true,
                text: this.dbItem.content,
                style_class: 'pano-item-body-emoji-content',
            });
            this.label.clutter_text.line_wrap = true;
            this.label.clutter_text.line_wrap_mode = pango1.WrapMode.WORD_CHAR;
            this.label.clutter_text.ellipsize = pango1.EllipsizeMode.END;
            emojiContainer.add_child(this.label);
            this.body.add_child(emojiContainer);
            this.connect('activated', this.setClipboardContent.bind(this));
            this.setStyle();
            this.emojiItemSettings.connect('changed', this.setStyle.bind(this));
        }
        setStyle() {
            const headerBgColor = this.emojiItemSettings.get_string('header-bg-color');
            const headerColor = this.emojiItemSettings.get_string('header-color');
            const bodyBgColor = this.emojiItemSettings.get_string('body-bg-color');
            const emojiSize = this.emojiItemSettings.get_int('emoji-size');
            this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
            this.body.set_style(`background-color: ${bodyBgColor};`);
            this.label.set_style(`font-size: ${emojiSize}px;`);
        }
        setClipboardContent() {
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.TEXT,
                value: this.dbItem.content,
            }));
        }
    };
    EmojiPanoItem = __decorate([
        registerGObjectClass
    ], EmojiPanoItem);

    let FilePanoItem = class FilePanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.fileList = JSON.parse(this.dbItem.content);
            this.operation = this.dbItem.metaData || 'copy';
            this.body.add_style_class_name('pano-item-body-file');
            this.fileItemSettings = this.settings.get_child('file-item');
            const container = new st1.BoxLayout({
                style_class: 'copied-files-container',
                vertical: true,
                x_expand: true,
                y_expand: false,
                y_align: clutter10.ActorAlign.FILL,
            });
            this.fileList
                .map((f) => {
                const items = f.split('://').filter((c) => !!c);
                return decodeURIComponent(items[items.length - 1]);
            })
                .forEach((uri) => {
                const bl = new st1.BoxLayout({
                    vertical: false,
                    style_class: 'copied-file-name',
                    x_expand: true,
                    x_align: clutter10.ActorAlign.FILL,
                    clip_to_allocation: true,
                    y_align: clutter10.ActorAlign.FILL,
                });
                bl.add_child(new st1.Icon({
                    icon_name: this.operation === FileOperation.CUT ? 'edit-cut-symbolic' : 'edit-copy-symbolic',
                    x_align: clutter10.ActorAlign.START,
                    icon_size: 14,
                    style_class: 'file-icon',
                }));
                const uriLabel = new st1.Label({
                    text: uri,
                    style_class: 'pano-item-body-file-name-label',
                    x_align: clutter10.ActorAlign.FILL,
                    x_expand: true,
                });
                uriLabel.clutter_text.ellipsize = pango1.EllipsizeMode.MIDDLE;
                bl.add_child(uriLabel);
                container.add_child(bl);
            });
            this.body.add_child(container);
            this.connect('activated', this.setClipboardContent.bind(this));
            this.setStyle();
            this.fileItemSettings.connect('changed', this.setStyle.bind(this));
        }
        setStyle() {
            const headerBgColor = this.fileItemSettings.get_string('header-bg-color');
            const headerColor = this.fileItemSettings.get_string('header-color');
            const bodyBgColor = this.fileItemSettings.get_string('body-bg-color');
            const bodyColor = this.fileItemSettings.get_string('body-color');
            const bodyFontFamily = this.fileItemSettings.get_string('body-font-family');
            const bodyFontSize = this.fileItemSettings.get_int('body-font-size');
            this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
            this.body.set_style(`background-color: ${bodyBgColor}; color: ${bodyColor}; font-family: ${bodyFontFamily}; font-size: ${bodyFontSize}px;`);
        }
        setClipboardContent() {
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.FILE,
                value: { fileList: this.fileList, operation: this.operation },
            }));
        }
    };
    FilePanoItem = __decorate([
        registerGObjectClass
    ], FilePanoItem);

    const NO_IMAGE_FOUND_FILE_NAME = 'no-image-found.svg';
    let ImagePanoItem = class ImagePanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.body.add_style_class_name('pano-item-body-image');
            this.imageItemSettings = this.settings.get_child('image-item');
            const { width, height, size } = JSON.parse(dbItem.metaData || '{}');
            this.metaContainer = new st1.BoxLayout({
                style_class: 'pano-item-body-meta-container',
                vertical: true,
                x_expand: true,
                y_expand: true,
                y_align: clutter10.ActorAlign.END,
                x_align: clutter10.ActorAlign.FILL,
            });
            const resolutionContainer = new st1.BoxLayout({
                vertical: false,
                x_expand: true,
                y_align: clutter10.ActorAlign.FILL,
                x_align: clutter10.ActorAlign.FILL,
                style_class: 'pano-item-body-image-resolution-container',
            });
            this.resolutionTitle = new st1.Label({
                text: 'Resolution',
                x_align: clutter10.ActorAlign.START,
                x_expand: true,
                style_class: 'pano-item-body-image-meta-title',
            });
            this.resolutionValue = new st1.Label({
                text: `${width} x ${height}`,
                x_align: clutter10.ActorAlign.END,
                x_expand: false,
                style_class: 'pano-item-body-image-meta-value',
            });
            resolutionContainer.add_child(this.resolutionTitle);
            resolutionContainer.add_child(this.resolutionValue);
            const sizeContainer = new st1.BoxLayout({
                vertical: false,
                x_expand: true,
                y_align: clutter10.ActorAlign.FILL,
                x_align: clutter10.ActorAlign.FILL,
                style_class: 'pano-item-body-image-size-container',
            });
            this.sizeLabel = new st1.Label({
                text: 'Size',
                x_align: clutter10.ActorAlign.START,
                x_expand: true,
                style_class: 'pano-item-body-image-meta-title',
            });
            this.sizeValue = new st1.Label({
                text: prettyBytes__default["default"](size),
                x_align: clutter10.ActorAlign.END,
                x_expand: false,
                style_class: 'pano-item-body-image-meta-value',
            });
            sizeContainer.add_child(this.sizeLabel);
            sizeContainer.add_child(this.sizeValue);
            this.metaContainer.add_child(resolutionContainer);
            this.metaContainer.add_child(sizeContainer);
            this.metaContainer.add_constraint(new clutter10.AlignConstraint({
                source: this,
                align_axis: clutter10.AlignAxis.Y_AXIS,
                factor: 0.001,
            }));
            this.body.add_child(this.metaContainer);
            this.connect('activated', this.setClipboardContent.bind(this));
            this.setStyle();
            this.imageItemSettings.connect('changed', this.setStyle.bind(this));
        }
        setStyle() {
            const headerBgColor = this.imageItemSettings.get_string('header-bg-color');
            const headerColor = this.imageItemSettings.get_string('header-color');
            const bodyBgColor = this.imageItemSettings.get_string('body-bg-color');
            const metadataBgColor = this.imageItemSettings.get_string('metadata-bg-color');
            const metadataColor = this.imageItemSettings.get_string('metadata-color');
            const metadataFontFamily = this.imageItemSettings.get_string('metadata-font-family');
            const metadataFontSize = this.imageItemSettings.get_int('metadata-font-size');
            let imageFilePath = `file://${getImagesPath()}/${this.dbItem.content}.png`;
            let backgroundSize = 'contain';
            const imageFile = gio2.File.new_for_uri(imageFilePath);
            if (!imageFile.query_exists(null)) {
                imageFilePath = `file://${getCurrentExtension().path}/images/${NO_IMAGE_FOUND_FILE_NAME}`;
                backgroundSize = 'cover';
            }
            this.body.set_style(`background-color: ${bodyBgColor}; background-image: url(${imageFilePath}); background-size: ${backgroundSize};`);
            this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
            this.resolutionTitle.set_style(`color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`);
            this.resolutionValue.set_style(`color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px; font-weight: bold;`);
            this.sizeLabel.set_style(`color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px;`);
            this.sizeValue.set_style(`color: ${metadataColor}; font-family: ${metadataFontFamily}; font-size: ${metadataFontSize}px; font-weight: bold;`);
            this.metaContainer.set_style(`background-color: ${metadataBgColor};`);
        }
        setClipboardContent() {
            const imageFile = gio2.File.new_for_path(`${getImagesPath()}/${this.dbItem.content}.png`);
            if (!imageFile.query_exists(null)) {
                return;
            }
            const [bytes] = imageFile.load_bytes(null);
            const data = bytes.get_data();
            if (!data) {
                return;
            }
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.IMAGE,
                value: data,
            }));
        }
    };
    ImagePanoItem = __decorate([
        registerGObjectClass
    ], ImagePanoItem);

    const DEFAULT_LINK_PREVIEW_IMAGE_NAME = 'link-preview.svg';
    let LinkPanoItem = class LinkPanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.linkItemSettings = this.settings.get_child('link-item');
            const { title, description, image } = JSON.parse(dbItem.metaData || '{"title": "", "description": ""}');
            let titleText = title;
            let descriptionText = description;
            if (!title) {
                titleText = glib2.uri_parse(dbItem.content, glib2.UriFlags.NONE).get_host() || this.dbItem.content;
            }
            else {
                titleText = decodeURI(title);
            }
            if (!description) {
                descriptionText = _('No Description');
            }
            else {
                descriptionText = decodeURI(description);
            }
            this.body.add_style_class_name('pano-item-body-link');
            this.metaContainer = new st1.BoxLayout({
                style_class: 'pano-item-body-meta-container',
                vertical: true,
                x_expand: true,
                y_expand: false,
                y_align: clutter10.ActorAlign.END,
                x_align: clutter10.ActorAlign.FILL,
            });
            this.titleLabel = new st1.Label({
                text: titleText,
                style_class: 'link-title-label',
            });
            this.descriptionLabel = new st1.Label({
                text: descriptionText,
                style_class: 'link-description-label',
            });
            this.descriptionLabel.clutter_text.single_line_mode = true;
            this.linkLabel = new st1.Label({
                text: this.dbItem.content,
                style_class: 'link-label',
            });
            let imageFilePath = `file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`;
            if (image && gio2.File.new_for_uri(`file://${getCachePath()}/${image}.png`).query_exists(null)) {
                imageFilePath = `file://${getCachePath()}/${image}.png`;
            }
            const imageContainer = new st1.BoxLayout({
                vertical: true,
                x_expand: true,
                y_expand: true,
                y_align: clutter10.ActorAlign.FILL,
                x_align: clutter10.ActorAlign.FILL,
                style_class: 'image-container',
                style: `background-image: url(${imageFilePath});`,
            });
            this.metaContainer.add_child(this.titleLabel);
            this.metaContainer.add_child(this.descriptionLabel);
            this.metaContainer.add_child(this.linkLabel);
            this.body.add_child(imageContainer);
            this.body.add_child(this.metaContainer);
            this.connect('activated', this.setClipboardContent.bind(this));
            this.setStyle();
            this.linkItemSettings.connect('changed', this.setStyle.bind(this));
        }
        setStyle() {
            const headerBgColor = this.linkItemSettings.get_string('header-bg-color');
            const headerColor = this.linkItemSettings.get_string('header-color');
            const bodyBgColor = this.linkItemSettings.get_string('body-bg-color');
            const metadataBgColor = this.linkItemSettings.get_string('metadata-bg-color');
            const metadataTitleColor = this.linkItemSettings.get_string('metadata-title-color');
            const metadataDescriptionColor = this.linkItemSettings.get_string('metadata-description-color');
            const metadataLinkColor = this.linkItemSettings.get_string('metadata-link-color');
            const metadataTitleFontFamily = this.linkItemSettings.get_string('metadata-title-font-family');
            const metadataDescriptionFontFamily = this.linkItemSettings.get_string('metadata-description-font-family');
            const metadataLinkFontFamily = this.linkItemSettings.get_string('metadata-link-font-family');
            const metadataTitleFontSize = this.linkItemSettings.get_int('metadata-title-font-size');
            const metadataDescriptionFontSize = this.linkItemSettings.get_int('metadata-description-font-size');
            const metadataLinkFontSize = this.linkItemSettings.get_int('metadata-link-font-size');
            this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
            this.body.set_style(`background-color: ${bodyBgColor};`);
            this.metaContainer.set_style(`background-color: ${metadataBgColor};`);
            this.titleLabel.set_style(`color: ${metadataTitleColor}; font-family: ${metadataTitleFontFamily}; font-size: ${metadataTitleFontSize}px;`);
            this.descriptionLabel.set_style(`color: ${metadataDescriptionColor}; font-family: ${metadataDescriptionFontFamily}; font-size: ${metadataDescriptionFontSize}px;`);
            this.linkLabel.set_style(`color: ${metadataLinkColor}; font-family: ${metadataLinkFontFamily}; font-size: ${metadataLinkFontSize}px;`);
        }
        setClipboardContent() {
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.TEXT,
                value: this.dbItem.content,
            }));
        }
        vfunc_key_press_event(event) {
            super.vfunc_key_press_event(event);
            if (this.settings.get_boolean('open-links-in-browser') &&
                (event.keyval === clutter10.KEY_Return || event.keyval === clutter10.KEY_ISO_Enter || event.keyval === clutter10.KEY_KP_Enter)) {
                openLinkInBrowser(this.dbItem.content);
            }
            return clutter10.EVENT_PROPAGATE;
        }
        vfunc_button_release_event(event) {
            super.vfunc_button_release_event(event);
            if (event.button === 1 && this.settings.get_boolean('open-links-in-browser')) {
                openLinkInBrowser(this.dbItem.content);
            }
            return clutter10.EVENT_PROPAGATE;
        }
    };
    LinkPanoItem = __decorate([
        registerGObjectClass
    ], LinkPanoItem);

    let TextPanoItem = class TextPanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.textItemSettings = this.settings.get_child('text-item');
            this.label = new st1.Label({
                style_class: 'pano-item-body-text-content',
            });
            this.label.clutter_text.line_wrap = true;
            this.label.clutter_text.line_wrap_mode = pango1.WrapMode.WORD_CHAR;
            this.label.clutter_text.ellipsize = pango1.EllipsizeMode.END;
            this.body.add_child(this.label);
            this.connect('activated', this.setClipboardContent.bind(this));
            this.setStyle();
            this.textItemSettings.connect('changed', this.setStyle.bind(this));
        }
        setStyle() {
            const headerBgColor = this.textItemSettings.get_string('header-bg-color');
            const headerColor = this.textItemSettings.get_string('header-color');
            const bodyBgColor = this.textItemSettings.get_string('body-bg-color');
            const bodyColor = this.textItemSettings.get_string('body-color');
            const bodyFontFamily = this.textItemSettings.get_string('body-font-family');
            const bodyFontSize = this.textItemSettings.get_int('body-font-size');
            const characterLength = this.textItemSettings.get_int('char-length');
            // Set header styles
            this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
            // Set body styles
            this.body.set_style(`background-color: ${bodyBgColor}`);
            // set label styles
            this.label.set_text(this.dbItem.content.slice(0, characterLength));
            this.label.set_style(`color: ${bodyColor}; font-family: ${bodyFontFamily}; font-size: ${bodyFontSize}px;`);
        }
        setClipboardContent() {
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.TEXT,
                value: this.dbItem.content,
            }));
        }
    };
    TextPanoItem = __decorate([
        registerGObjectClass
    ], TextPanoItem);

    const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
    const session = new soup3.Session();
    session.timeout = 5;
    const decoder = new TextDecoder();
    const debug$2 = logger('link-parser');
    const getDocument = async (url) => {
        const defaultResult = {
            title: '',
            description: '',
            imageUrl: '',
        };
        try {
            const message = soup3.Message.new('GET', url);
            message.request_headers.append('User-Agent', DEFAULT_USER_AGENT);
            const response = await session.send_and_read_async(message, glib2.PRIORITY_DEFAULT, null);
            if (response == null) {
                debug$2(`no response from ${url}`);
                return defaultResult;
            }
            const bytes = response.get_data();
            if (bytes == null) {
                debug$2(`no data from ${url}`);
                return defaultResult;
            }
            const data = decoder.decode(bytes);
            let titleMatch = false;
            let titleTag = '';
            let title = '', description = '', imageUrl = '';
            const p = new htmlparser2__namespace.Parser({
                onopentag(name, attribs) {
                    if (name === 'meta') {
                        if (!title &&
                            (attribs['property'] === 'og:title' ||
                                attribs['property'] === 'twitter:title' ||
                                attribs['property'] === 'title' ||
                                attribs['name'] === 'og:title' ||
                                attribs['name'] === 'twitter:title' ||
                                attribs['name'] === 'title')) {
                            title = attribs['content'];
                        }
                        else if (!description &&
                            (attribs['property'] === 'og:description' ||
                                attribs['property'] === 'twitter:description' ||
                                attribs['property'] === 'description' ||
                                attribs['name'] === 'og:description' ||
                                attribs['name'] === 'twitter:description' ||
                                attribs['name'] === 'description')) {
                            description = attribs['content'];
                        }
                        else if (!imageUrl &&
                            (attribs['property'] === 'og:image' ||
                                attribs['property'] === 'twitter:image' ||
                                attribs['property'] === 'image' ||
                                attribs['name'] === 'og:image' ||
                                attribs['name'] === 'twitter:image' ||
                                attribs['name'] === 'image')) {
                            imageUrl = attribs['content'];
                            if (imageUrl.startsWith('/')) {
                                const uri = glib2.uri_parse(url, glib2.UriFlags.NONE);
                                imageUrl = `${uri.get_scheme()}://${uri.get_host()}${imageUrl}`;
                            }
                        }
                    }
                    if (name === 'title') {
                        titleMatch = true;
                    }
                },
                ontext(data) {
                    if (titleMatch && !title) {
                        titleTag += data;
                    }
                },
                onclosetag(name) {
                    if (name === 'title') {
                        titleMatch = false;
                    }
                },
            }, {
                decodeEntities: true,
                lowerCaseTags: true,
                lowerCaseAttributeNames: true,
            });
            p.write(data);
            p.end();
            title = title || titleTag;
            return {
                title,
                description,
                imageUrl,
            };
        }
        catch (err) {
            debug$2(`failed to parse link ${url}. err: ${err}`);
        }
        return defaultResult;
    };
    const getImage = async (imageUrl) => {
        if (imageUrl && imageUrl.startsWith('http')) {
            try {
                const checksum = glib2.compute_checksum_for_string(glib2.ChecksumType.MD5, imageUrl, imageUrl.length);
                const cachedImage = gio2.File.new_for_path(`${getCachePath()}/${checksum}.png`);
                if (cachedImage.query_exists(null)) {
                    return [checksum, cachedImage];
                }
                const message = soup3.Message.new('GET', imageUrl);
                message.request_headers.append('User-Agent', DEFAULT_USER_AGENT);
                const response = await session.send_and_read_async(message, glib2.PRIORITY_DEFAULT, null);
                if (!response) {
                    debug$2('no response while fetching the image');
                    return [null, null];
                }
                const data = response.get_data();
                if (!data || data.length == 0) {
                    debug$2('empty response while fetching the image');
                    return [null, null];
                }
                cachedImage.replace_contents(data, null, false, gio2.FileCreateFlags.REPLACE_DESTINATION, null);
                return [checksum, cachedImage];
            }
            catch (err) {
                debug$2(`failed to load image: ${imageUrl}. err: ${err}`);
            }
        }
        return [null, null];
    };

    hljs__default["default"].registerLanguage('python', python__default["default"]);
    hljs__default["default"].registerLanguage('markdown', markdown__default["default"]);
    hljs__default["default"].registerLanguage('yaml', yaml__default["default"]);
    hljs__default["default"].registerLanguage('java', java__default["default"]);
    hljs__default["default"].registerLanguage('javascript', javascript__default["default"]);
    hljs__default["default"].registerLanguage('csharp', csharp__default["default"]);
    hljs__default["default"].registerLanguage('cpp', cpp__default["default"]);
    hljs__default["default"].registerLanguage('c', c__default["default"]);
    hljs__default["default"].registerLanguage('php', php__default["default"]);
    hljs__default["default"].registerLanguage('typescript', typescript__default["default"]);
    hljs__default["default"].registerLanguage('swift', swift__default["default"]);
    hljs__default["default"].registerLanguage('kotlin', kotlin__default["default"]);
    hljs__default["default"].registerLanguage('go', go__default["default"]);
    hljs__default["default"].registerLanguage('rust', rust__default["default"]);
    hljs__default["default"].registerLanguage('ruby', ruby__default["default"]);
    hljs__default["default"].registerLanguage('scala', scala__default["default"]);
    hljs__default["default"].registerLanguage('dart', dart__default["default"]);
    hljs__default["default"].registerLanguage('lua', lua__default["default"]);
    hljs__default["default"].registerLanguage('groovy', groovy__default["default"]);
    hljs__default["default"].registerLanguage('perl', perl__default["default"]);
    hljs__default["default"].registerLanguage('julia', julia__default["default"]);
    hljs__default["default"].registerLanguage('haskell', haskell__default["default"]);
    hljs__default["default"].registerLanguage('sql', sql__default["default"]);
    hljs__default["default"].registerLanguage('bash', bash__default["default"]);
    hljs__default["default"].registerLanguage('shell', shell__default["default"]);
    const SUPPORTED_LANGUAGES = [
        'python',
        'markdown',
        'yaml',
        'java',
        'javascript',
        'csharp',
        'cpp',
        'c',
        'php',
        'typescript',
        'swift',
        'kotlin',
        'go',
        'rust',
        'ruby',
        'scala',
        'dart',
        'sql',
        'lua',
        'groovy',
        'perl',
        'julia',
        'haskell',
        'bash',
        'shell',
    ];
    const debug$1 = logger('pano-item-factory');
    const isValidUrl = (text) => {
        try {
            return isUrl__default["default"](text) && glib2.uri_parse(text, glib2.UriFlags.NONE) !== null;
        }
        catch (err) {
            return false;
        }
    };
    const findOrCreateDbItem = async (clip) => {
        const { value, type } = clip.content;
        const queryBuilder = new ClipboardQueryBuilder();
        switch (type) {
            case ContentType.FILE:
                queryBuilder.withItemTypes(['FILE']).withMatchValue(`${value.operation}${value.fileList.sort().join('')}`);
                break;
            case ContentType.IMAGE:
                queryBuilder.withItemTypes(['IMAGE']).withMatchValue(glib2.compute_checksum_for_bytes(glib2.ChecksumType.MD5, value));
                break;
            case ContentType.TEXT:
                queryBuilder.withItemTypes(['LINK', 'TEXT', 'CODE', 'COLOR', 'EMOJI']).withMatchValue(value).build();
                break;
            default:
                return null;
        }
        const result = db.query(queryBuilder.build());
        if (getCurrentExtensionSettings().get_boolean('play-audio-on-copy')) {
            playAudio();
        }
        if (result.length > 0) {
            return db.update({
                ...result[0],
                copyDate: new Date(),
            });
        }
        switch (type) {
            case ContentType.FILE:
                return db.save({
                    content: JSON.stringify(value.fileList),
                    copyDate: new Date(),
                    isFavorite: false,
                    itemType: 'FILE',
                    matchValue: `${value.operation}${value.fileList.sort().join('')}`,
                    searchValue: `${value.fileList
                    .map((f) => {
                    const items = f.split('://').filter((c) => !!c);
                    return items[items.length - 1];
                })
                    .join('')}`,
                    metaData: value.operation,
                });
            case ContentType.IMAGE:
                const checksum = glib2.compute_checksum_for_bytes(glib2.ChecksumType.MD5, value);
                if (!checksum) {
                    return null;
                }
                const imageFilePath = `${getImagesPath()}/${checksum}.png`;
                const imageFile = gio2.File.new_for_path(imageFilePath);
                imageFile.replace_contents(value, null, false, gio2.FileCreateFlags.REPLACE_DESTINATION, null);
                const [, width, height] = gdkpixbuf2.Pixbuf.get_file_info(imageFilePath);
                return db.save({
                    content: checksum,
                    copyDate: new Date(),
                    isFavorite: false,
                    itemType: 'IMAGE',
                    matchValue: checksum,
                    metaData: JSON.stringify({
                        width,
                        height,
                        size: value.length,
                    }),
                });
            case ContentType.TEXT:
                if (value.toLowerCase().startsWith('http') && isValidUrl(value)) {
                    const linkPreviews = getCurrentExtensionSettings().get_boolean('link-previews');
                    let description = '', imageUrl = '', title = '', checksum = '';
                    const copyDate = new Date();
                    let linkDbItem = db.save({
                        content: value,
                        copyDate,
                        isFavorite: false,
                        itemType: 'LINK',
                        matchValue: value,
                        searchValue: `${title}${description}${value}`,
                        metaData: JSON.stringify({
                            title: title ? encodeURI(title) : '',
                            description: description ? encodeURI(description) : '',
                            image: checksum || '',
                        }),
                    });
                    if (linkPreviews && linkDbItem) {
                        const document = await getDocument(value);
                        description = document.description;
                        title = document.title;
                        imageUrl = document.imageUrl;
                        checksum = (await getImage(imageUrl))[0] || '';
                        linkDbItem = db.update({
                            id: linkDbItem.id,
                            content: value,
                            copyDate: copyDate,
                            isFavorite: false,
                            itemType: 'LINK',
                            matchValue: value,
                            searchValue: `${title}${description}${value}`,
                            metaData: JSON.stringify({
                                title: title ? encodeURI(title) : '',
                                description: description ? encodeURI(description) : '',
                                image: checksum || '',
                            }),
                        });
                    }
                    return linkDbItem;
                }
                if (validateColor.validateHTMLColorHex(value) || validateColor.validateHTMLColorRgb(value) || validateColor.validateHTMLColorName(value)) {
                    return db.save({
                        content: value,
                        copyDate: new Date(),
                        isFavorite: false,
                        itemType: 'COLOR',
                        matchValue: value,
                        searchValue: value,
                    });
                }
                const highlightResult = hljs__default["default"].highlightAuto(value.slice(0, 2000), SUPPORTED_LANGUAGES);
                if (highlightResult.relevance < 10) {
                    if (/^\p{Extended_Pictographic}*$/u.test(value)) {
                        return db.save({
                            content: value,
                            copyDate: new Date(),
                            isFavorite: false,
                            itemType: 'EMOJI',
                            matchValue: value,
                            searchValue: value,
                        });
                    }
                    else {
                        return db.save({
                            content: value,
                            copyDate: new Date(),
                            isFavorite: false,
                            itemType: 'TEXT',
                            matchValue: value,
                            searchValue: value,
                        });
                    }
                }
                else {
                    return db.save({
                        content: value,
                        copyDate: new Date(),
                        isFavorite: false,
                        itemType: 'CODE',
                        matchValue: value,
                        searchValue: value,
                    });
                }
            default:
                return null;
        }
    };
    const createPanoItem = async (clip) => {
        let dbItem = null;
        try {
            dbItem = await findOrCreateDbItem(clip);
        }
        catch (err) {
            debug$1(`err: ${err}`);
            return null;
        }
        if (dbItem) {
            if (getCurrentExtensionSettings().get_boolean('send-notification-on-copy')) {
                sendNotification(dbItem);
            }
            return createPanoItemFromDb(dbItem);
        }
        return null;
    };
    const createPanoItemFromDb = (dbItem) => {
        if (!dbItem) {
            return null;
        }
        let panoItem;
        switch (dbItem.itemType) {
            case 'TEXT':
                panoItem = new TextPanoItem(dbItem);
                break;
            case 'CODE':
                panoItem = new CodePanoItem(dbItem);
                break;
            case 'LINK':
                panoItem = new LinkPanoItem(dbItem);
                break;
            case 'COLOR':
                panoItem = new ColorPanoItem(dbItem);
                break;
            case 'FILE':
                panoItem = new FilePanoItem(dbItem);
                break;
            case 'IMAGE':
                panoItem = new ImagePanoItem(dbItem);
                break;
            case 'EMOJI':
                panoItem = new EmojiPanoItem(dbItem);
                break;
            default:
                return null;
        }
        panoItem.connect('on-remove', (_, dbItemStr) => {
            const dbItem = JSON.parse(dbItemStr);
            removeItemResources(dbItem);
        });
        panoItem.connect('on-favorite', (_, dbItemStr) => {
            const dbItem = JSON.parse(dbItemStr);
            db.update({
                ...dbItem,
                copyDate: new Date(dbItem.copyDate),
            });
        });
        return panoItem;
    };
    const removeItemResources = (dbItem) => {
        db.delete(dbItem.id);
        if (dbItem.itemType === 'LINK') {
            const { image } = JSON.parse(dbItem.metaData || '{}');
            if (image && gio2.File.new_for_uri(`file://${getCachePath()}/${image}.png`).query_exists(null)) {
                gio2.File.new_for_uri(`file://${getCachePath()}/${image}.png`).delete(null);
            }
        }
        else if (dbItem.itemType === 'IMAGE') {
            const imageFilePath = `file://${getImagesPath()}/${dbItem.content}.png`;
            const imageFile = gio2.File.new_for_uri(imageFilePath);
            if (imageFile.query_exists(null)) {
                imageFile.delete(null);
            }
        }
    };
    const sendNotification = async (dbItem) => {
        return new Promise(() => {
            if (dbItem.itemType === 'IMAGE') {
                const { width, height, size } = JSON.parse(dbItem.metaData || '{}');
                notify(_('Image Copied'), _('Width: %spx, Height: %spx, Size: %s').format(width, height, prettyBytes__default["default"](size)), gdkpixbuf2.Pixbuf.new_from_file(`${getImagesPath()}/${dbItem.content}.png`));
            }
            else if (dbItem.itemType === 'TEXT') {
                notify(_('Text Copied'), dbItem.content);
            }
            else if (dbItem.itemType === 'CODE') {
                notify(_('Code Copied'), dbItem.content);
            }
            else if (dbItem.itemType === 'EMOJI') {
                notify(_('Emoji Copied'), dbItem.content);
            }
            else if (dbItem.itemType === 'LINK') {
                const { title, description, image } = JSON.parse(dbItem.metaData || '{}');
                const pixbuf = image ? gdkpixbuf2.Pixbuf.new_from_file(`${getCachePath()}/${image}.png`) : undefined;
                notify(decodeURI(`${_('Link Copied')}${title ? ` - ${title}` : ''}`), `${dbItem.content}${description ? `\n\n${decodeURI(description)}` : ''}`, pixbuf, cogl2.PixelFormat.RGB_888);
            }
            else if (dbItem.itemType === 'COLOR') {
                // Create pixbuf from color
                const pixbuf = gdkpixbuf2.Pixbuf.new(gdkpixbuf2.Colorspace.RGB, true, 8, 1, 1);
                let color = null;
                // check if content has alpha
                if (dbItem.content.includes('rgba')) {
                    color = converter__default["default"](dbItem.content);
                }
                else if (validateColor.validateHTMLColorRgb(dbItem.content)) {
                    color = `${converter__default["default"](dbItem.content)}ff`;
                }
                else if (validateColor.validateHTMLColorHex(dbItem.content)) {
                    color = `${dbItem.content}ff`;
                }
                if (color) {
                    pixbuf.fill(parseInt(color.replace('#', '0x'), 16));
                    notify(_('Color Copied'), dbItem.content, pixbuf);
                }
            }
            else if (dbItem.itemType === 'FILE') {
                const operation = dbItem.metaData;
                const fileListSize = JSON.parse(dbItem.content).length;
                notify(_('File %s').format(operation === FileOperation.CUT ? 'cut' : 'copied'), _('There are %s file(s)').format(fileListSize));
            }
        });
    };

    let PanoScrollView = class PanoScrollView extends st1.ScrollView {
        constructor() {
            super({
                hscrollbar_policy: st1.PolicyType.EXTERNAL,
                vscrollbar_policy: st1.PolicyType.NEVER,
                overlay_scrollbars: true,
                x_expand: true,
                y_expand: true,
            });
            this.currentFocus = null;
            this.settings = getCurrentExtensionSettings();
            this.list = new st1.BoxLayout({ vertical: false, x_expand: true, y_expand: true });
            this.add_actor(this.list);
            this.connect('key-press-event', (_, event) => {
                if (event.get_key_symbol() === clutter10.KEY_Tab ||
                    event.get_key_symbol() === clutter10.KEY_ISO_Left_Tab ||
                    event.get_key_symbol() === clutter10.KEY_KP_Tab) {
                    this.emit('scroll-tab-press', event.has_shift_modifier());
                    return clutter10.EVENT_STOP;
                }
                if (event.has_control_modifier() && event.get_key_symbol() >= 49 && event.get_key_symbol() <= 57) {
                    this.selectItemByIndex(event.get_key_symbol() - 49);
                    return clutter10.EVENT_STOP;
                }
                if (event.get_state()) {
                    return clutter10.EVENT_PROPAGATE;
                }
                if ((event.get_key_symbol() === clutter10.KEY_Left &&
                    this.getVisibleItems().findIndex((item) => item.dbItem.id === this.currentFocus?.dbItem.id) === 0) ||
                    event.get_key_symbol() === clutter10.KEY_Up) {
                    this.emit('scroll-focus-out');
                    return clutter10.EVENT_STOP;
                }
                if (event.get_key_symbol() === clutter10.KEY_Alt_L || event.get_key_symbol() === clutter10.KEY_Alt_R) {
                    this.emit('scroll-alt-press');
                    return clutter10.EVENT_PROPAGATE;
                }
                if (event.get_key_symbol() == clutter10.KEY_BackSpace) {
                    this.emit('scroll-backspace-press');
                    return clutter10.EVENT_STOP;
                }
                const unicode = clutter10.keysym_to_unicode(event.get_key_symbol());
                if (unicode === 0) {
                    return clutter10.EVENT_PROPAGATE;
                }
                this.emit('scroll-key-press', String.fromCharCode(unicode));
                return clutter10.EVENT_STOP;
            });
            db.query(new ClipboardQueryBuilder().build()).forEach((dbItem) => {
                const panoItem = createPanoItemFromDb(dbItem);
                if (panoItem) {
                    this.connectOnRemove(panoItem);
                    this.connectOnFavorite(panoItem);
                    this.list.add_child(panoItem);
                }
            });
            const firstItem = this.list.get_first_child();
            if (firstItem) {
                firstItem.emit('activated');
            }
            this.settings.connect('changed::history-length', () => {
                this.removeExcessiveItems();
            });
            clipboardManager.connect('changed', async (_, content) => {
                const panoItem = await createPanoItem(content);
                if (panoItem) {
                    this.prependItem(panoItem);
                    this.filter(this.currentFilter, this.currentItemTypeFilter, this.showFavorites);
                }
            });
        }
        prependItem(panoItem) {
            const existingItem = this.getItem(panoItem);
            if (existingItem) {
                this.removeItem(existingItem);
            }
            this.connectOnRemove(panoItem);
            this.connectOnFavorite(panoItem);
            this.list.insert_child_at_index(panoItem, 0);
            this.removeExcessiveItems();
        }
        connectOnFavorite(panoItem) {
            panoItem.connect('on-favorite', () => {
                this.emit('scroll-update-list');
            });
        }
        connectOnRemove(panoItem) {
            panoItem.connect('on-remove', () => {
                if (this.currentFocus === panoItem) {
                    this.focusNext() || this.focusPrev();
                }
                this.removeItem(panoItem);
                this.filter(this.currentFilter, this.currentItemTypeFilter, this.showFavorites);
                if (this.getVisibleItems().length === 0) {
                    this.emit('scroll-focus-out');
                }
                else {
                    this.focusOnClosest();
                }
            });
        }
        removeItem(item) {
            item.hide();
            this.list.remove_child(item);
        }
        getItem(panoItem) {
            return this.getItems().find((item) => item.dbItem.id === panoItem.dbItem.id);
        }
        getItems() {
            return this.list.get_children();
        }
        getVisibleItems() {
            return this.list.get_children().filter((item) => item.is_visible());
        }
        removeExcessiveItems() {
            const historyLength = this.settings.get_int('history-length');
            const items = this.getItems().filter((i) => i.dbItem.isFavorite === false);
            if (historyLength < items.length) {
                items.slice(historyLength).forEach((item) => {
                    this.removeItem(item);
                });
            }
            db.query(new ClipboardQueryBuilder().withFavorites(false).withLimit(-1, this.settings.get_int('history-length')).build()).forEach((dbItem) => {
                removeItemResources(dbItem);
            });
        }
        focusNext() {
            const lastFocus = this.currentFocus;
            if (!lastFocus) {
                return this.focusOnClosest();
            }
            const index = this.getVisibleItems().findIndex((item) => item.dbItem.id === lastFocus.dbItem.id);
            if (index + 1 < this.getVisibleItems().length) {
                this.currentFocus = this.getVisibleItems()[index + 1];
                this.currentFocus.grab_key_focus();
                return true;
            }
            return false;
        }
        focusPrev() {
            const lastFocus = this.currentFocus;
            if (!lastFocus) {
                return this.focusOnClosest();
            }
            const index = this.getVisibleItems().findIndex((item) => item.dbItem.id === lastFocus.dbItem.id);
            if (index - 1 >= 0) {
                this.currentFocus = this.getVisibleItems()[index - 1];
                this.currentFocus.grab_key_focus();
                return true;
            }
            return false;
        }
        filter(text, itemType, showFavorites) {
            this.currentFilter = text;
            this.currentItemTypeFilter = itemType;
            this.showFavorites = showFavorites;
            if (!text && !itemType && null === showFavorites) {
                this.getItems().forEach((i) => i.show());
                return;
            }
            const builder = new ClipboardQueryBuilder();
            if (showFavorites) {
                builder.withFavorites(showFavorites);
            }
            if (itemType) {
                builder.withItemTypes([itemType]);
            }
            if (text) {
                builder.withContainingSearchValue(text);
            }
            const result = db.query(builder.build()).map((dbItem) => dbItem.id);
            this.getItems().forEach((item) => (result.indexOf(item.dbItem.id) >= 0 ? item.show() : item.hide()));
        }
        focusOnClosest() {
            const lastFocus = this.currentFocus;
            if (lastFocus !== null) {
                if (lastFocus.get_parent() === this.list && lastFocus.is_visible()) {
                    lastFocus.grab_key_focus();
                    return true;
                }
                else {
                    let nextFocus = this.getVisibleItems().find((item) => item.dbItem.copyDate <= lastFocus.dbItem.copyDate);
                    if (!nextFocus) {
                        nextFocus = this.getVisibleItems()
                            .reverse()
                            .find((item) => item.dbItem.copyDate >= lastFocus.dbItem.copyDate);
                    }
                    if (nextFocus) {
                        this.currentFocus = nextFocus;
                        nextFocus.grab_key_focus();
                        return true;
                    }
                }
            }
            else if (this.currentFilter && this.getVisibleItems().length > 0) {
                this.currentFocus = this.getVisibleItems()[0];
                this.currentFocus.grab_key_focus();
                return true;
            }
            else if (!this.currentFilter && this.getVisibleItems().length > 1) {
                this.currentFocus = this.getVisibleItems()[1];
                this.currentFocus.grab_key_focus();
                return true;
            }
            else if (this.getVisibleItems().length > 0) {
                this.currentFocus = this.getVisibleItems()[0];
                this.currentFocus.grab_key_focus();
                return true;
            }
            return false;
        }
        scrollToFirstItem() {
            if (this.getVisibleItems().length === 0) {
                return;
            }
            this.scrollToItem(this.getVisibleItems()[0]);
        }
        scrollToFocussedItem() {
            if (!this.currentFocus || !this.currentFocus.is_visible()) {
                return;
            }
            this.scrollToItem(this.currentFocus);
        }
        focusAndScrollToFirst() {
            if (this.getVisibleItems().length === 0) {
                this.emit('scroll-focus-out');
                this.currentFocus = null;
                return;
            }
            this.currentFocus = this.getVisibleItems()[0];
            this.currentFocus.grab_key_focus();
            this.hscroll.adjustment.set_value(this.get_allocation_box().x1);
        }
        beforeHide() {
            this.currentFocus = null;
            this.scrollToFirstItem();
            this.emit('scroll-focus-out');
        }
        scrollToItem(item) {
            const box = item.get_allocation_box();
            const adjustment = this.hscroll.adjustment;
            const value = box.x1 + adjustment.step_increment / 2.0 - adjustment.page_size / 2.0;
            if (!Number.isFinite(value)) {
                return;
            }
            adjustment.ease(value, {
                duration: 150,
                mode: clutter10.AnimationMode.EASE_OUT_QUAD,
            });
        }
        selectFirstItem() {
            const visibleItems = this.getVisibleItems();
            if (visibleItems.length > 0) {
                const item = visibleItems[0];
                item.emit('activated');
            }
        }
        selectItemByIndex(index) {
            const visibleItems = this.getVisibleItems();
            if (visibleItems.length > index) {
                const item = visibleItems[index];
                item.emit('activated');
            }
        }
        vfunc_key_press_event(event) {
            if (event.keyval === clutter10.KEY_Right) {
                this.focusNext();
                this.scrollToFocussedItem();
            }
            else if (event.keyval === clutter10.KEY_Left) {
                this.focusPrev();
                this.scrollToFocussedItem();
            }
            return clutter10.EVENT_PROPAGATE;
        }
        vfunc_scroll_event(event) {
            const adjustment = this.hscroll.adjustment;
            let value = adjustment.value;
            if (event.direction === clutter10.ScrollDirection.SMOOTH) {
                return clutter10.EVENT_STOP;
            }
            if (event.direction === clutter10.ScrollDirection.UP || event.direction === clutter10.ScrollDirection.LEFT) {
                value -= adjustment.step_increment * 2;
            }
            else if (event.direction === clutter10.ScrollDirection.DOWN || event.direction === clutter10.ScrollDirection.RIGHT) {
                value += adjustment.step_increment * 2;
            }
            adjustment.remove_transition('value');
            adjustment.ease(value, {
                duration: 150,
                mode: clutter10.AnimationMode.EASE_OUT_QUAD,
            });
            return clutter10.EVENT_STOP;
        }
    };
    PanoScrollView.metaInfo = {
        GTypeName: 'PanoScrollView',
        Signals: {
            'scroll-focus-out': {},
            'scroll-update-list': {},
            'scroll-alt-press': {},
            'scroll-tab-press': {
                param_types: [gobject2.TYPE_BOOLEAN],
                accumulator: 0,
            },
            'scroll-backspace-press': {},
            'scroll-key-press': {
                param_types: [gobject2.TYPE_STRING],
                accumulator: 0,
            },
        },
    };
    PanoScrollView = __decorate([
        registerGObjectClass
    ], PanoScrollView);

    let SearchBox = class SearchBox extends st1.BoxLayout {
        constructor() {
            super({
                x_align: clutter10.ActorAlign.CENTER,
                style_class: 'search-entry-container',
                vertical: false,
            });
            this.currentIndex = null;
            this.showFavorites = false;
            const themeContext = st1.ThemeContext.get_for_stage(shell0.Global.get().get_stage());
            this.search = new st1.Entry({
                can_focus: true,
                hint_text: _('Type to search, Tab to cycle'),
                track_hover: true,
                width: 300 * themeContext.scaleFactor,
                primary_icon: this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'),
                secondary_icon: this.createSearchEntryIcon('starred-symbolic', 'search-entry-fav-icon'),
            });
            themeContext.connect('notify::scale-factor', () => {
                const { scaleFactor } = st1.ThemeContext.get_for_stage(shell0.Global.get().get_stage());
                this.search.set_width(300 * scaleFactor);
            });
            this.search.connect('primary-icon-clicked', () => {
                this.focus();
                this.toggleItemType(false);
            });
            this.search.connect('secondary-icon-clicked', () => {
                this.focus();
                this.toggleFavorites();
            });
            this.search.clutter_text.connect('text-changed', () => {
                this.emitSearchTextChange();
            });
            this.search.clutter_text.connect('key-press-event', (_, event) => {
                if (event.get_key_symbol() === clutter10.KEY_Down ||
                    (event.get_key_symbol() === clutter10.KEY_Right &&
                        (this.search.clutter_text.cursor_position === -1 || this.search.text.length === 0))) {
                    this.emit('search-focus-out');
                }
                else if (event.get_key_symbol() === clutter10.KEY_Right &&
                    this.search.clutter_text.get_selection() !== null &&
                    this.search.clutter_text.get_selection() === this.search.text) {
                    this.search.clutter_text.set_cursor_position(this.search.text.length);
                }
                if (event.get_key_symbol() === clutter10.KEY_Return ||
                    event.get_key_symbol() === clutter10.KEY_ISO_Enter ||
                    event.get_key_symbol() === clutter10.KEY_KP_Enter) {
                    this.emit('search-submit');
                }
                if (event.has_control_modifier() && event.get_key_symbol() >= 49 && event.get_key_symbol() <= 57) {
                    this.emit('search-item-select-shortcut', event.get_key_symbol() - 49);
                }
                if (event.get_key_symbol() === clutter10.KEY_Tab ||
                    event.get_key_symbol() === clutter10.KEY_ISO_Left_Tab ||
                    event.get_key_symbol() === clutter10.KEY_KP_Tab) {
                    this.toggleItemType(event.has_shift_modifier());
                }
                if (event.get_key_symbol() === clutter10.KEY_BackSpace && this.search.text.length === 0) {
                    this.search.set_primary_icon(this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'));
                    this.currentIndex = null;
                    this.emitSearchTextChange();
                }
                if (event.get_key_symbol() === clutter10.KEY_Alt_L || event.get_key_symbol() === clutter10.KEY_Alt_R) {
                    this.toggleFavorites();
                    this.emitSearchTextChange();
                }
            });
            this.add_child(this.search);
        }
        toggleItemType(hasShift) {
            // increment or decrement the current index based on the shift modifier
            if (hasShift) {
                this.currentIndex = this.currentIndex === null ? Object.keys(PanoItemTypes).length - 1 : this.currentIndex - 1;
            }
            else {
                this.currentIndex = this.currentIndex === null ? 0 : this.currentIndex + 1;
            }
            // if the index is out of bounds, set it to the other end
            if (this.currentIndex < 0 || this.currentIndex >= Object.keys(PanoItemTypes).length) {
                this.currentIndex = null;
            }
            if (null == this.currentIndex) {
                this.search.set_primary_icon(this.createSearchEntryIcon('edit-find-symbolic', 'search-entry-icon'));
            }
            else {
                this.search.set_primary_icon(this.createSearchEntryIcon(gio2.icon_new_for_string(`${getCurrentExtension().path}/icons/hicolor/scalable/actions/${PanoItemTypes[Object.keys(PanoItemTypes)[this.currentIndex]].iconPath}`), 'search-entry-icon'));
            }
            this.emitSearchTextChange();
        }
        createSearchEntryIcon(iconNameOrProto, styleClass) {
            const icon = new st1.Icon({
                style_class: styleClass,
                icon_size: 13,
                track_hover: true,
            });
            if (typeof iconNameOrProto === 'string') {
                icon.set_icon_name(iconNameOrProto);
            }
            else {
                icon.set_gicon(iconNameOrProto);
            }
            icon.connect('enter-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.POINTING_HAND);
            });
            icon.connect('motion-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.POINTING_HAND);
            });
            icon.connect('leave-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.DEFAULT);
            });
            return icon;
        }
        toggleFavorites() {
            const icon = this.search.get_secondary_icon();
            if (this.showFavorites) {
                icon.remove_style_class_name('active');
            }
            else {
                icon.add_style_class_name('active');
            }
            this.showFavorites = !this.showFavorites;
            this.emitSearchTextChange();
        }
        emitSearchTextChange() {
            let itemType = null;
            if (this.currentIndex !== null) {
                itemType = Object.keys(PanoItemTypes)[this.currentIndex];
            }
            this.emit('search-text-changed', this.search.text, itemType || '', this.showFavorites);
        }
        focus() {
            this.search.grab_key_focus();
        }
        removeChar() {
            this.search.text = this.search.text.slice(0, -1);
        }
        appendText(text) {
            this.search.text += text;
        }
        selectAll() {
            this.search.clutter_text.set_selection(0, this.search.text.length);
        }
        clear() {
            this.search.text = '';
        }
        getText() {
            return this.search.text;
        }
    };
    SearchBox.metaInfo = {
        GTypeName: 'SearchBox',
        Signals: {
            'search-text-changed': {
                param_types: [gobject2.TYPE_STRING, gobject2.TYPE_STRING, gobject2.TYPE_BOOLEAN],
                accumulator: 0,
            },
            'search-item-select-shortcut': {
                param_types: [gobject2.TYPE_INT],
                accumulator: 0,
            },
            'search-focus-out': {},
            'search-submit': {},
        },
    };
    SearchBox = __decorate([
        registerGObjectClass
    ], SearchBox);

    let PanoWindow = class PanoWindow extends st1.BoxLayout {
        constructor() {
            super({
                name: 'pano-window',
                constraints: getMonitorConstraint(),
                style_class: 'pano-window',
                x_align: clutter10.ActorAlign.FILL,
                y_align: clutter10.ActorAlign.END,
                visible: false,
                vertical: true,
                reactive: true,
                opacity: 0,
                can_focus: true,
            });
            this.settings = getCurrentExtensionSettings();
            const themeContext = st1.ThemeContext.get_for_stage(shell0.Global.get().get_stage());
            this.set_height(this.settings.get_int('window-height') * themeContext.scaleFactor);
            this.settings.connect('changed::window-height', () => {
                this.set_height(this.settings.get_int('window-height') * themeContext.scaleFactor);
            });
            themeContext.connect('notify::scale-factor', () => {
                const { scaleFactor } = st1.ThemeContext.get_for_stage(shell0.Global.get().get_stage());
                this.set_height(this.settings.get_int('window-height') * scaleFactor);
            });
            this.settings.connect('changed::window-background-color', () => {
                if (this.settings.get_boolean('is-in-incognito')) {
                    this.set_style(`background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`);
                }
                else {
                    this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
                }
            });
            this.settings.connect('changed::incognito-window-background-color', () => {
                if (this.settings.get_boolean('is-in-incognito')) {
                    this.set_style(`background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`);
                }
                else {
                    this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
                }
            });
            this.monitorBox = new MonitorBox();
            this.scrollView = new PanoScrollView();
            this.searchBox = new SearchBox();
            this.setupMonitorBox();
            this.setupScrollView();
            this.setupSearchBox();
            this.add_actor(this.searchBox);
            this.add_actor(this.scrollView);
            this.settings.connect('changed::is-in-incognito', () => {
                if (this.settings.get_boolean('is-in-incognito')) {
                    this.add_style_class_name('incognito');
                    this.set_style(`background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`);
                }
                else {
                    this.remove_style_class_name('incognito');
                    this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
                }
            });
            if (this.settings.get_boolean('is-in-incognito')) {
                this.add_style_class_name('incognito');
                this.set_style(`background-color: ${this.settings.get_string('incognito-window-background-color')} !important;`);
            }
            else {
                this.set_style(`background-color: ${this.settings.get_string('window-background-color')}`);
            }
        }
        setupMonitorBox() {
            this.monitorBox.connect('hide', () => this.hide());
        }
        setupSearchBox() {
            this.searchBox.connect('search-focus-out', () => {
                this.scrollView.focusOnClosest();
                this.scrollView.scrollToFocussedItem();
            });
            this.searchBox.connect('search-submit', () => {
                this.scrollView.selectFirstItem();
            });
            this.searchBox.connect('search-text-changed', (_, text, itemType, showFavorites) => {
                this.scrollView.filter(text, itemType, showFavorites);
            });
            this.searchBox.connect('search-item-select-shortcut', (_, index) => {
                this.scrollView.selectItemByIndex(index);
            });
        }
        setupScrollView() {
            this.scrollView.connect('scroll-update-list', () => {
                this.searchBox.focus();
                this.searchBox.emitSearchTextChange();
                this.scrollView.focusOnClosest();
                this.scrollView.scrollToFocussedItem();
            });
            this.scrollView.connect('scroll-focus-out', () => {
                this.searchBox.focus();
            });
            this.scrollView.connect('scroll-backspace-press', () => {
                this.searchBox.removeChar();
                this.searchBox.focus();
            });
            this.scrollView.connect('scroll-alt-press', () => {
                this.searchBox.focus();
                this.searchBox.toggleFavorites();
                this.scrollView.focusAndScrollToFirst();
            });
            this.scrollView.connect('scroll-tab-press', (_, hasShift) => {
                this.searchBox.focus();
                this.searchBox.toggleItemType(hasShift);
                this.scrollView.focusAndScrollToFirst();
            });
            this.scrollView.connect('scroll-key-press', (_, text) => {
                this.searchBox.focus();
                this.searchBox.appendText(text);
            });
        }
        toggle() {
            this.is_visible() ? this.hide() : this.show();
        }
        show() {
            this.clear_constraints();
            this.add_constraint(getMonitorConstraint());
            super.show();
            if (this.settings.get_boolean('keep-search-entry')) {
                this.searchBox.selectAll();
            }
            else {
                this.searchBox.clear();
            }
            this.searchBox.focus();
            this.ease({
                opacity: 255,
                duration: 250,
                mode: clutter10.AnimationMode.EASE_OUT_QUAD,
            });
            this.monitorBox.open();
            return clutter10.EVENT_PROPAGATE;
        }
        hide() {
            this.monitorBox.close();
            this.ease({
                opacity: 0,
                duration: 200,
                mode: clutter10.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    if (!this.settings.get_boolean('keep-search-entry')) {
                        this.searchBox.clear();
                    }
                    this.scrollView.beforeHide();
                    super.hide();
                },
            });
            return clutter10.EVENT_PROPAGATE;
        }
        vfunc_key_press_event(event) {
            if (event.keyval === clutter10.KEY_Escape) {
                this.hide();
            }
            return clutter10.EVENT_PROPAGATE;
        }
        destroy() {
            this.monitorBox.destroy();
            this.searchBox.destroy();
            super.destroy();
        }
    };
    PanoWindow = __decorate([
        registerGObjectClass
    ], PanoWindow);

    class KeyManager {
        constructor() {
            this.settings = getCurrentExtensionSettings();
        }
        stopListening(gsettingsField) {
            wm.removeKeybinding(gsettingsField);
        }
        listenFor(gsettingsField, callback) {
            wm.addKeybinding(gsettingsField, this.settings, meta10.KeyBindingFlags.NONE, shell0.ActionMode.ALL, callback);
        }
    }

    const debug = logger('extension');
    class PanoExtension {
        constructor() {
            this.isEnabled = false;
            setupAppDirs();
            db.setup();
            debug('extension is initialized');
            this.keyManager = new KeyManager();
            this.panoWindow = new PanoWindow();
            const iface = loadInterfaceXML('io.elhan.Pano');
            this.dbus = gio2.DBusExportedObject.wrapJSObject(iface, this);
            this.dbus.export(gio2.DBus.session, '/io/elhan/Pano');
            this.settings = getCurrentExtensionSettings();
            this.lastDBpath = getDbPath();
            this.settings.connect('changed::database-location', () => {
                const newDBpath = this.settings.get_string('database-location');
                if (this.isEnabled) {
                    this.disable();
                    moveDbFile(this.lastDBpath, newDBpath);
                    db.setup();
                    this.rerender();
                    this.enable();
                }
                else {
                    moveDbFile(this.lastDBpath, newDBpath);
                    db.setup();
                    this.rerender();
                }
                this.lastDBpath = newDBpath;
            });
            this.settings.connect('changed::show-indicator', () => {
                if (this.settings.get_boolean('show-indicator') && this.isEnabled) {
                    this.createIndicator();
                }
                else {
                    this.removeIndicator();
                }
            });
        }
        async clearSessionHistory() {
            if (this.settings.get_boolean('session-only-mode')) {
                debug('clearing session history');
                db.shutdown();
                clipboardManager.stopTracking();
                await deleteAppDirs();
                debug('deleted session cache and db');
                clipboardManager.setContent(new ClipboardContent({
                    type: ContentType.TEXT,
                    value: '',
                }));
                debug('cleared last clipboard content');
            }
        }
        createIndicator() {
            if (this.settings.get_boolean('show-indicator')) {
                this.settingsMenu = new SettingsMenu(this.clearHistory.bind(this), () => this.panoWindow.toggle());
                addToStatusArea(this.settingsMenu);
            }
        }
        removeIndicator() {
            this.settingsMenu?.destroy();
            this.settingsMenu = null;
        }
        enable() {
            this.isEnabled = true;
            setupAppDirs();
            this.createIndicator();
            db.start();
            this.logoutSignalId = gio2.DBus.session.signal_subscribe(null, 'org.gnome.SessionManager.EndSessionDialog', 'ConfirmedLogout', '/org/gnome/SessionManager/EndSessionDialog', null, gio2.DBusSignalFlags.NONE, this.clearSessionHistory.bind(this));
            this.rebootSignalId = gio2.DBus.session.signal_subscribe(null, 'org.gnome.SessionManager.EndSessionDialog', 'ConfirmedReboot', '/org/gnome/SessionManager/EndSessionDialog', null, gio2.DBusSignalFlags.NONE, this.clearSessionHistory.bind(this));
            this.shutdownSignalId = gio2.DBus.session.signal_subscribe(null, 'org.gnome.SessionManager.EndSessionDialog', 'ConfirmedShutdown', '/org/gnome/SessionManager/EndSessionDialog', null, gio2.DBusSignalFlags.NONE, this.clearSessionHistory.bind(this));
            this.systemdSignalId = gio2.DBus.system.signal_subscribe(null, 'org.freedesktop.login1.Manager', 'PrepareForShutdown', '/org/freedesktop/login1', null, gio2.DBusSignalFlags.NONE, this.clearSessionHistory.bind(this));
            addTopChrome(this.panoWindow);
            this.keyManager.listenFor('global-shortcut', () => this.panoWindow.toggle());
            this.keyManager.listenFor('incognito-shortcut', () => {
                this.settings.set_boolean('is-in-incognito', !this.settings.get_boolean('is-in-incognito'));
            });
            clipboardManager.startTracking();
            this.windowTrackerId = shell0.Global.get().display.connect('notify::focus-window', () => {
                const focussedWindow = shell0.Global.get().display.focus_window;
                if (focussedWindow && this.panoWindow.is_visible()) {
                    this.panoWindow.hide();
                }
                const wmClass = focussedWindow?.get_wm_class();
                if (wmClass &&
                    this.settings.get_boolean('watch-exclusion-list') &&
                    this.settings
                        .get_strv('exclusion-list')
                        .map((s) => s.toLowerCase())
                        .indexOf(wmClass.toLowerCase()) >= 0) {
                    clipboardManager.stopTracking();
                }
                else if (clipboardManager.isTracking === false) {
                    this.timeoutId = glib2.timeout_add(glib2.PRIORITY_DEFAULT, 300, () => {
                        clipboardManager.startTracking();
                        if (this.timeoutId) {
                            glib2.Source.remove(this.timeoutId);
                        }
                        this.timeoutId = null;
                        return glib2.SOURCE_REMOVE;
                    });
                }
            });
            debug('extension is enabled');
        }
        disable() {
            if (this.windowTrackerId) {
                shell0.Global.get().display.disconnect(this.windowTrackerId);
            }
            if (this.timeoutId) {
                glib2.Source.remove(this.timeoutId);
            }
            debounceIds.forEach((debounceId) => {
                glib2.Source.remove(debounceId);
            });
            this.removeIndicator();
            this.windowTrackerId = null;
            this.timeoutId = null;
            removeVirtualKeyboard();
            removeSoundContext();
            this.isEnabled = false;
            this.keyManager.stopListening('global-shortcut');
            this.keyManager.stopListening('incognito-shortcut');
            clipboardManager.stopTracking();
            removeChrome(this.panoWindow);
            debug('extension is disabled');
            db.shutdown();
            if (this.logoutSignalId) {
                gio2.DBus.session.signal_unsubscribe(this.logoutSignalId);
                this.logoutSignalId = null;
            }
            if (this.shutdownSignalId) {
                gio2.DBus.session.signal_unsubscribe(this.shutdownSignalId);
                this.shutdownSignalId = null;
            }
            if (this.rebootSignalId) {
                gio2.DBus.session.signal_unsubscribe(this.rebootSignalId);
                this.rebootSignalId = null;
            }
            if (this.systemdSignalId) {
                gio2.DBus.system.signal_unsubscribe(this.systemdSignalId);
                this.systemdSignalId = null;
            }
        }
        async clearHistory() {
            if (this.isEnabled) {
                this.disable();
                await this.reInitialize();
                this.enable();
            }
            else {
                await this.reInitialize();
            }
        }
        show() {
            this.panoWindow?.show();
        }
        hide() {
            this.panoWindow?.hide();
        }
        toggle() {
            this.panoWindow?.toggle();
        }
        rerender() {
            this.panoWindow.remove_all_children();
            this.panoWindow.destroy();
            this.panoWindow = new PanoWindow();
        }
        async reInitialize() {
            db.shutdown();
            await deleteAppDirs();
            setupAppDirs();
            db.setup();
            this.rerender();
        }
    }
    function extension () {
        initTranslations();
        return new PanoExtension();
    }

    return extension;

})(imports.gi.Gio, imports.gi.GLib, imports.gi.Shell, imports.gi.Clutter, imports.gi.GObject, imports.gi.St, imports.gi.GSound, imports.gi.GdkPixbuf, imports.gi.Cogl, imports.gi.Meta, imports.gi.Gda, imports.gi.Pango, imports.gi.Graphene, Me.imports.thirdparty["date_fns_formatDistanceToNow"].lib, Me.imports.thirdparty["date_fns_locale"].lib, Me.imports.thirdparty["prismjs"].lib, Me.imports.thirdparty["pretty_bytes"].lib, imports.gi.Soup, Me.imports.thirdparty["htmlparser2"].lib, Me.imports.thirdparty["hex_color_converter"].lib, Me.imports.thirdparty["highlight_js_lib_core"].lib, Me.imports.thirdparty["highlight_js_lib_languages_bash"].lib, Me.imports.thirdparty["highlight_js_lib_languages_c"].lib, Me.imports.thirdparty["highlight_js_lib_languages_cpp"].lib, Me.imports.thirdparty["highlight_js_lib_languages_csharp"].lib, Me.imports.thirdparty["highlight_js_lib_languages_dart"].lib, Me.imports.thirdparty["highlight_js_lib_languages_go"].lib, Me.imports.thirdparty["highlight_js_lib_languages_groovy"].lib, Me.imports.thirdparty["highlight_js_lib_languages_haskell"].lib, Me.imports.thirdparty["highlight_js_lib_languages_java"].lib, Me.imports.thirdparty["highlight_js_lib_languages_javascript"].lib, Me.imports.thirdparty["highlight_js_lib_languages_julia"].lib, Me.imports.thirdparty["highlight_js_lib_languages_kotlin"].lib, Me.imports.thirdparty["highlight_js_lib_languages_lua"].lib, Me.imports.thirdparty["highlight_js_lib_languages_markdown"].lib, Me.imports.thirdparty["highlight_js_lib_languages_perl"].lib, Me.imports.thirdparty["highlight_js_lib_languages_php"].lib, Me.imports.thirdparty["highlight_js_lib_languages_python"].lib, Me.imports.thirdparty["highlight_js_lib_languages_ruby"].lib, Me.imports.thirdparty["highlight_js_lib_languages_rust"].lib, Me.imports.thirdparty["highlight_js_lib_languages_scala"].lib, Me.imports.thirdparty["highlight_js_lib_languages_shell"].lib, Me.imports.thirdparty["highlight_js_lib_languages_sql"].lib, Me.imports.thirdparty["highlight_js_lib_languages_swift"].lib, Me.imports.thirdparty["highlight_js_lib_languages_typescript"].lib, Me.imports.thirdparty["highlight_js_lib_languages_yaml"].lib, Me.imports.thirdparty["is_url"].lib, Me.imports.thirdparty["validate_color"].lib);

}
catch(err) {
  log(`[pano] [init] ${err}`);
  imports.ui.main.notify('Pano', `${err}`);
  throw err;
}
