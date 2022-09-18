
try {

var init = (function (gio2, glib2, shell0, clutter10, gobject2, st1, gsound1, meta10, gda5, gdkpixbuf2, pango1, graphene1, soup3) {
    'use strict';

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
    const debug$6 = logger('shell-utils');
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
            debug$6(`Failed to load D-Bus interface ${iface}`);
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
            debug$6(`failed to play audio: ${err}`);
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

    const global$2 = shell0.Global.get();
    const wm = imports.ui.main.wm;
    const getMonitors = () => imports.ui.main.layoutManager.monitors;
    const getMonitorIndexForPointer = () => {
        const [x, y] = global$2.get_pointer();
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

    const { ModalDialog } = imports.ui.modalDialog;
    const { MessageDialogContent } = imports.ui.dialog;
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
                log(`err: ${err}`);
            }
            this.close();
        }
    };
    ClearHistoryDialog = __decorate([
        registerGObjectClass
    ], ClearHistoryDialog);

    const { PopupMenuItem, PopupSwitchMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
    const { Button: PopupMenuButton } = imports.ui.panelMenu;
    let SettingsMenu = class SettingsMenu extends PopupMenuButton {
        constructor(onClear, onToggle) {
            super(0.5, 'Pano Indicator', false);
            this.onToggle = onToggle;
            this.settings = getCurrentExtensionSettings();
            const isInIncognito = this.settings.get_boolean('is-in-incognito');
            const icon = new st1.Icon({
                gicon: gio2.icon_new_for_string(`${getCurrentExtension().path}/icons/indicator${isInIncognito ? '-incognito' : ''}.svg`),
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
                icon.set_gicon(gio2.icon_new_for_string(`${getCurrentExtension().path}/icons/indicator${isInIncognito ? '-incognito' : ''}.svg`));
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

    const global$1 = shell0.Global.get();
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
    let ClipboardManager = class ClipboardManager extends gobject2.Object {
        constructor() {
            super();
            this.settings = getCurrentExtensionSettings();
            this.clipboard = st1.Clipboard.get_default();
            this.selection = global$1.get_display().get_selection();
        }
        startTracking() {
            this.isTracking = true;
            const primaryTracker = debounce(async () => {
                const result = await this.getContent(st1.ClipboardType.PRIMARY);
                if (!result) {
                    return;
                }
                this.emit('changed', result);
            }, 500);
            this.selectionChangedId = this.selection.connect('owner-changed', async (_selection, selectionType, _selectionSource) => {
                if (this.settings.get_boolean('is-in-incognito')) {
                    return;
                }
                if (selectionType === meta10.SelectionType.SELECTION_CLIPBOARD) {
                    try {
                        const result = await this.getContent(st1.ClipboardType.CLIPBOARD);
                        if (!result) {
                            return;
                        }
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
                                value: text,
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
        return builder.add_expr_value(null, value);
    };
    class ClipboardQueryBuilder {
        constructor() {
            this.conditions = [];
            this.builder = new gda5.SqlBuilder({
                stmt_type: gda5.SqlStatementType.SELECT,
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
                this.conditions.push(this.builder.add_cond(gda5.SqlOperatorType.EQ, this.builder.add_field_id('id', 'clipboard'), add_expr_value(this.builder, id), 0));
            }
            return this;
        }
        withItemTypes(itemTypes) {
            if (itemTypes !== null && itemTypes !== undefined) {
                const orConditions = itemTypes.map((itemType) => this.builder.add_cond(gda5.SqlOperatorType.EQ, this.builder.add_field_id('itemType', 'clipboard'), add_expr_value(this.builder, itemType), 0));
                this.conditions.push(this.builder.add_cond_v(gda5.SqlOperatorType.OR, orConditions));
            }
            return this;
        }
        withContent(content) {
            if (content !== null && content !== undefined) {
                this.conditions.push(this.builder.add_cond(gda5.SqlOperatorType.EQ, this.builder.add_field_id('content', 'clipboard'), add_expr_value(this.builder, content), 0));
            }
            return this;
        }
        withMatchValue(matchValue) {
            if (matchValue !== null && matchValue !== undefined) {
                this.conditions.push(this.builder.add_cond(gda5.SqlOperatorType.EQ, this.builder.add_field_id('matchValue', 'clipboard'), add_expr_value(this.builder, matchValue), 0));
            }
            return this;
        }
        withContainingContent(content) {
            if (content !== null && content !== undefined) {
                this.conditions.push(this.builder.add_cond(gda5.SqlOperatorType.LIKE, this.builder.add_field_id('content', 'clipboard'), add_expr_value(this.builder, `%${content}%`), 0));
            }
            return this;
        }
        withContainingSearchValue(searchValue) {
            if (searchValue !== null && searchValue !== undefined) {
                this.conditions.push(this.builder.add_cond(gda5.SqlOperatorType.LIKE, this.builder.add_field_id('searchValue', 'clipboard'), add_expr_value(this.builder, `%${searchValue}%`), 0));
            }
            return this;
        }
        build() {
            if (this.conditions.length > 0) {
                this.builder.set_where(this.builder.add_cond_v(gda5.SqlOperatorType.AND, this.conditions));
            }
            return new ClipboardQuery(this.builder.get_statement());
        }
    }
    class Database {
        init() {
            this.settings = getCurrentExtensionSettings();
            this.connection = new gda5.Connection({
                provider: gda5.Config.get_provider('SQLite'),
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
            const builder = new gda5.SqlBuilder({
                stmt_type: gda5.SqlStatementType.INSERT,
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
            const builder = new gda5.SqlBuilder({
                stmt_type: gda5.SqlStatementType.UPDATE,
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
            builder.set_where(builder.add_cond(gda5.SqlOperatorType.EQ, builder.add_field_id('id', 'clipboard'), add_expr_value(builder, dbItem.id), 0));
            this.connection.statement_execute_non_select(builder.get_statement(), null);
            return dbItem;
        }
        delete(id) {
            if (!this.connection || !this.connection.is_opened()) {
                debug$4('connection is not opened');
                return;
            }
            const builder = new gda5.SqlBuilder({
                stmt_type: gda5.SqlStatementType.DELETE,
            });
            builder.set_table('clipboard');
            builder.set_where(builder.add_cond(gda5.SqlOperatorType.EQ, builder.add_field_id('id', 'clipboard'), add_expr_value(builder, id), 0));
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var isUrl_1 = isUrl;
    var protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
    var localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
    var nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;
    function isUrl(string){
      if (typeof string !== 'string') {
        return false;
      }
      var match = string.match(protocolAndDomainRE);
      if (!match) {
        return false;
      }
      var everythingAfterProtocol = match[1];
      if (!everythingAfterProtocol) {
        return false;
      }
      if (localhostDomainRE.test(everythingAfterProtocol) ||
          nonLocalhostDomainRE.test(everythingAfterProtocol)) {
        return true;
      }
      return false;
    }

    var lib=function(e){var r={};function n(t){if(r[t])return r[t].exports;var a=r[t]={i:t,l:!1,exports:{}};return e[t].call(a.exports,a,a.exports,n),a.l=!0,a.exports}return n.m=e,n.c=r,n.d=function(e,r,t){n.o(e,r)||Object.defineProperty(e,r,{enumerable:!0,get:t});},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0});},n.t=function(e,r){if(1&r&&(e=n(e)),8&r)return e;if(4&r&&"object"==typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(n.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&r&&"string"!=typeof e)for(var a in e)n.d(t,a,function(r){return e[r]}.bind(null,a));return t},n.n=function(e){var r=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(r,"a",r),r},n.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)},n.p="",n(n.s=0)}([function(e,r,n){n.r(r),n.d(r,"validateHTMLColorName",(function(){return l})),n.d(r,"validateHTMLColorSpecialName",(function(){return i})),n.d(r,"validateHTMLColorHex",(function(){return u})),n.d(r,"validateHTMLColorRgb",(function(){return d})),n.d(r,"validateHTMLColorHsl",(function(){return f})),n.d(r,"validateHTMLColorHwb",(function(){return h})),n.d(r,"validateHTMLColorLab",(function(){return g})),n.d(r,"validateHTMLColor",(function(){return m}));const t=e=>e&&"string"==typeof e,a=["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenrod","DarkGray","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","DarkOrange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","Goldenrod","Gray","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenrodYellow","LightGray","LightGreen","LightPink","LightSalmon","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquamarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenrod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","RebeccaPurple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"],o=["currentColor","inherit","transparent"],l=e=>{let r=!1;return t(e)&&a.map(n=>(e.toLowerCase()===n.toLowerCase()&&(r=!0),null)),r},i=e=>{let r=!1;return t(e)&&o.map(n=>(e.toLowerCase()===n.toLowerCase()&&(r=!0),null)),r},u=e=>{if(t(e)){const r=/^#([\da-f]{3}){1,2}$|^#([\da-f]{4}){1,2}$/i;return e&&r.test(e)}},d=e=>{if(t(e)){const r=/(rgb)a?\((\s*\d+%?\s*?,?\s*){2}(\s*\d+%?\s*?,?\s*\)?)(\s*,?\s*\/?\s*(0?\.?\d+%?\s*)?|1|0)?\)$/i;return e&&r.test(e)}},s="(([0-9]|[1-9][0-9]|100)%)",c=`\\s*?\\)?)(\\s*?(\\/?)\\s+${`(((${s}))|(0?(\\.\\d+)?)|1))?`}\\s*?\\)$`,f=e=>{if(t(e)){const r=new RegExp(`(hsl)a?\\((\\s*?(${"(-?([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-5][0-9]|360)(deg)?)"}|${"(([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-9][0-9]|400)gra)"}|${"((([0-5])?\\.\\d+|6\\.([0-9]|1[0-9]|2[0-8])|[0-6])rad)"}|${"((0?(\\.\\d+)?|1)turn)"})((\\s*,\\s*)|(\\s+)))(\\s*?(0|${s})((\\s*,\\s*)|(\\s+)))(\\s*?(0|${s})\\s*?\\)?)(\\s*?(\\/?|,?)\\s*?(((${s}))|(0?(\\.\\d+)?)|1))?\\)$`);return e&&r.test(e)}},h=e=>{if(t(e)){const r=new RegExp(`(hwb\\(\\s*?${"(-?([0-9]|[1-9][0-9]|1[0-9][0-9]|2[0-9][0-9]|3[0-5][0-9]|360)(deg)?)"}\\s+)((0|${s})\\s+)((0|${s})${c}`);return e&&r.test(e)}},g=e=>{if(t(e)){const r="(-?(([0-9]|[1-9][0-9]|1[0-5][0-9])(\\.\\d+)??|160))",n=new RegExp(`(lab\\(\\s*?((\\d*(\\.\\d+)?)%)\\s+${r}\\s+${r}${c}`);return e&&n.test(e)}},m=e=>!!(e&&u(e)||d(e)||f(e)||h(e)||g(e));r.default=e=>!!(e&&u(e)||l(e)||i(e)||d(e)||f(e)||h(e)||g(e));}]);

    var deepFreezeEs6 = {exports: {}};
    function deepFreeze(obj) {
        if (obj instanceof Map) {
            obj.clear = obj.delete = obj.set = function () {
                throw new Error('map is read-only');
            };
        } else if (obj instanceof Set) {
            obj.add = obj.clear = obj.delete = function () {
                throw new Error('set is read-only');
            };
        }
        Object.freeze(obj);
        Object.getOwnPropertyNames(obj).forEach(function (name) {
            var prop = obj[name];
            if (typeof prop == 'object' && !Object.isFrozen(prop)) {
                deepFreeze(prop);
            }
        });
        return obj;
    }
    deepFreezeEs6.exports = deepFreeze;
    deepFreezeEs6.exports.default = deepFreeze;
    class Response {
      constructor(mode) {
        if (mode.data === undefined) mode.data = {};
        this.data = mode.data;
        this.isMatchIgnored = false;
      }
      ignoreMatch() {
        this.isMatchIgnored = true;
      }
    }
    function escapeHTML(value) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    }
    function inherit$1(original, ...objects) {
      const result = Object.create(null);
      for (const key in original) {
        result[key] = original[key];
      }
      objects.forEach(function(obj) {
        for (const key in obj) {
          result[key] = obj[key];
        }
      });
      return  (result);
    }
    const SPAN_CLOSE = '</span>';
    const emitsWrappingTags = (node) => {
      return !!node.scope || (node.sublanguage && node.language);
    };
    const scopeToCSSClass = (name, { prefix }) => {
      if (name.includes(".")) {
        const pieces = name.split(".");
        return [
          `${prefix}${pieces.shift()}`,
          ...(pieces.map((x, i) => `${x}${"_".repeat(i + 1)}`))
        ].join(" ");
      }
      return `${prefix}${name}`;
    };
    class HTMLRenderer {
      constructor(parseTree, options) {
        this.buffer = "";
        this.classPrefix = options.classPrefix;
        parseTree.walk(this);
      }
      addText(text) {
        this.buffer += escapeHTML(text);
      }
      openNode(node) {
        if (!emitsWrappingTags(node)) return;
        let className = "";
        if (node.sublanguage) {
          className = `language-${node.language}`;
        } else {
          className = scopeToCSSClass(node.scope, { prefix: this.classPrefix });
        }
        this.span(className);
      }
      closeNode(node) {
        if (!emitsWrappingTags(node)) return;
        this.buffer += SPAN_CLOSE;
      }
      value() {
        return this.buffer;
      }
      span(className) {
        this.buffer += `<span class="${className}">`;
      }
    }
    const newNode = (opts = {}) => {
      const result = { children: [] };
      Object.assign(result, opts);
      return result;
    };
    class TokenTree {
      constructor() {
        this.rootNode = newNode();
        this.stack = [this.rootNode];
      }
      get top() {
        return this.stack[this.stack.length - 1];
      }
      get root() { return this.rootNode; }
      add(node) {
        this.top.children.push(node);
      }
      openNode(scope) {
        const node = newNode({ scope });
        this.add(node);
        this.stack.push(node);
      }
      closeNode() {
        if (this.stack.length > 1) {
          return this.stack.pop();
        }
        return undefined;
      }
      closeAllNodes() {
        while (this.closeNode());
      }
      toJSON() {
        return JSON.stringify(this.rootNode, null, 4);
      }
      walk(builder) {
        return this.constructor._walk(builder, this.rootNode);
      }
      static _walk(builder, node) {
        if (typeof node === "string") {
          builder.addText(node);
        } else if (node.children) {
          builder.openNode(node);
          node.children.forEach((child) => this._walk(builder, child));
          builder.closeNode(node);
        }
        return builder;
      }
      static _collapse(node) {
        if (typeof node === "string") return;
        if (!node.children) return;
        if (node.children.every(el => typeof el === "string")) {
          node.children = [node.children.join("")];
        } else {
          node.children.forEach((child) => {
            TokenTree._collapse(child);
          });
        }
      }
    }
    class TokenTreeEmitter extends TokenTree {
      constructor(options) {
        super();
        this.options = options;
      }
      addKeyword(text, scope) {
        if (text === "") { return; }
        this.openNode(scope);
        this.addText(text);
        this.closeNode();
      }
      addText(text) {
        if (text === "") { return; }
        this.add(text);
      }
      addSublanguage(emitter, name) {
        const node = emitter.root;
        node.sublanguage = true;
        node.language = name;
        this.add(node);
      }
      toHTML() {
        const renderer = new HTMLRenderer(this, this.options);
        return renderer.value();
      }
      finalize() {
        return true;
      }
    }
    function source$1(re) {
      if (!re) return null;
      if (typeof re === "string") return re;
      return re.source;
    }
    function lookahead$1(re) {
      return concat$1('(?=', re, ')');
    }
    function anyNumberOfTimes(re) {
      return concat$1('(?:', re, ')*');
    }
    function optional(re) {
      return concat$1('(?:', re, ')?');
    }
    function concat$1(...args) {
      const joined = args.map((x) => source$1(x)).join("");
      return joined;
    }
    function stripOptionsFromArgs$1(args) {
      const opts = args[args.length - 1];
      if (typeof opts === 'object' && opts.constructor === Object) {
        args.splice(args.length - 1, 1);
        return opts;
      } else {
        return {};
      }
    }
    function either$1(...args) {
      const opts = stripOptionsFromArgs$1(args);
      const joined = '('
        + (opts.capture ? "" : "?:")
        + args.map((x) => source$1(x)).join("|") + ")";
      return joined;
    }
    function countMatchGroups(re) {
      return (new RegExp(re.toString() + '|')).exec('').length - 1;
    }
    function startsWith(re, lexeme) {
      const match = re && re.exec(lexeme);
      return match && match.index === 0;
    }
    const BACKREF_RE = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
    function _rewriteBackreferences(regexps, { joinWith }) {
      let numCaptures = 0;
      return regexps.map((regex) => {
        numCaptures += 1;
        const offset = numCaptures;
        let re = source$1(regex);
        let out = '';
        while (re.length > 0) {
          const match = BACKREF_RE.exec(re);
          if (!match) {
            out += re;
            break;
          }
          out += re.substring(0, match.index);
          re = re.substring(match.index + match[0].length);
          if (match[0][0] === '\\' && match[1]) {
            out += '\\' + String(Number(match[1]) + offset);
          } else {
            out += match[0];
            if (match[0] === '(') {
              numCaptures++;
            }
          }
        }
        return out;
      }).map(re => `(${re})`).join(joinWith);
    }
    const MATCH_NOTHING_RE = /\b\B/;
    const IDENT_RE$2 = '[a-zA-Z]\\w*';
    const UNDERSCORE_IDENT_RE = '[a-zA-Z_]\\w*';
    const NUMBER_RE = '\\b\\d+(\\.\\d+)?';
    const C_NUMBER_RE = '(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)';
    const BINARY_NUMBER_RE = '\\b(0b[01]+)';
    const RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';
    const SHEBANG = (opts = {}) => {
      const beginShebang = /^#![ ]*\//;
      if (opts.binary) {
        opts.begin = concat$1(
          beginShebang,
          /.*\b/,
          opts.binary,
          /\b.*/);
      }
      return inherit$1({
        scope: 'meta',
        begin: beginShebang,
        end: /$/,
        relevance: 0,
        "on:begin": (m, resp) => {
          if (m.index !== 0) resp.ignoreMatch();
        }
      }, opts);
    };
    const BACKSLASH_ESCAPE = {
      begin: '\\\\[\\s\\S]', relevance: 0
    };
    const APOS_STRING_MODE = {
      scope: 'string',
      begin: '\'',
      end: '\'',
      illegal: '\\n',
      contains: [BACKSLASH_ESCAPE]
    };
    const QUOTE_STRING_MODE = {
      scope: 'string',
      begin: '"',
      end: '"',
      illegal: '\\n',
      contains: [BACKSLASH_ESCAPE]
    };
    const PHRASAL_WORDS_MODE = {
      begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
    };
    const COMMENT = function(begin, end, modeOptions = {}) {
      const mode = inherit$1(
        {
          scope: 'comment',
          begin,
          end,
          contains: []
        },
        modeOptions
      );
      mode.contains.push({
        scope: 'doctag',
        begin: '[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)',
        end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
        excludeBegin: true,
        relevance: 0
      });
      const ENGLISH_WORD = either$1(
        "I",
        "a",
        "is",
        "so",
        "us",
        "to",
        "at",
        "if",
        "in",
        "it",
        "on",
        /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
        /[A-Za-z]+[-][a-z]+/,
        /[A-Za-z][a-z]{2,}/
      );
      mode.contains.push(
        {
          begin: concat$1(
            /[ ]+/,
            '(',
            ENGLISH_WORD,
            /[.]?[:]?([.][ ]|[ ])/,
            '){3}')
        }
      );
      return mode;
    };
    const C_LINE_COMMENT_MODE = COMMENT('//', '$');
    const C_BLOCK_COMMENT_MODE = COMMENT('/\\*', '\\*/');
    const HASH_COMMENT_MODE = COMMENT('#', '$');
    const NUMBER_MODE = {
      scope: 'number',
      begin: NUMBER_RE,
      relevance: 0
    };
    const C_NUMBER_MODE = {
      scope: 'number',
      begin: C_NUMBER_RE,
      relevance: 0
    };
    const BINARY_NUMBER_MODE = {
      scope: 'number',
      begin: BINARY_NUMBER_RE,
      relevance: 0
    };
    const REGEXP_MODE = {
      begin: /(?=\/[^/\n]*\/)/,
      contains: [{
        scope: 'regexp',
        begin: /\//,
        end: /\/[gimuy]*/,
        illegal: /\n/,
        contains: [
          BACKSLASH_ESCAPE,
          {
            begin: /\[/,
            end: /\]/,
            relevance: 0,
            contains: [BACKSLASH_ESCAPE]
          }
        ]
      }]
    };
    const TITLE_MODE = {
      scope: 'title',
      begin: IDENT_RE$2,
      relevance: 0
    };
    const UNDERSCORE_TITLE_MODE = {
      scope: 'title',
      begin: UNDERSCORE_IDENT_RE,
      relevance: 0
    };
    const METHOD_GUARD = {
      begin: '\\.\\s*' + UNDERSCORE_IDENT_RE,
      relevance: 0
    };
    const END_SAME_AS_BEGIN = function(mode) {
      return Object.assign(mode,
        {
          'on:begin': (m, resp) => { resp.data._beginMatch = m[1]; },
          'on:end': (m, resp) => { if (resp.data._beginMatch !== m[1]) resp.ignoreMatch(); }
        });
    };
    var MODES = Object.freeze({
        __proto__: null,
        MATCH_NOTHING_RE: MATCH_NOTHING_RE,
        IDENT_RE: IDENT_RE$2,
        UNDERSCORE_IDENT_RE: UNDERSCORE_IDENT_RE,
        NUMBER_RE: NUMBER_RE,
        C_NUMBER_RE: C_NUMBER_RE,
        BINARY_NUMBER_RE: BINARY_NUMBER_RE,
        RE_STARTERS_RE: RE_STARTERS_RE,
        SHEBANG: SHEBANG,
        BACKSLASH_ESCAPE: BACKSLASH_ESCAPE,
        APOS_STRING_MODE: APOS_STRING_MODE,
        QUOTE_STRING_MODE: QUOTE_STRING_MODE,
        PHRASAL_WORDS_MODE: PHRASAL_WORDS_MODE,
        COMMENT: COMMENT,
        C_LINE_COMMENT_MODE: C_LINE_COMMENT_MODE,
        C_BLOCK_COMMENT_MODE: C_BLOCK_COMMENT_MODE,
        HASH_COMMENT_MODE: HASH_COMMENT_MODE,
        NUMBER_MODE: NUMBER_MODE,
        C_NUMBER_MODE: C_NUMBER_MODE,
        BINARY_NUMBER_MODE: BINARY_NUMBER_MODE,
        REGEXP_MODE: REGEXP_MODE,
        TITLE_MODE: TITLE_MODE,
        UNDERSCORE_TITLE_MODE: UNDERSCORE_TITLE_MODE,
        METHOD_GUARD: METHOD_GUARD,
        END_SAME_AS_BEGIN: END_SAME_AS_BEGIN
    });
    function skipIfHasPrecedingDot(match, response) {
      const before = match.input[match.index - 1];
      if (before === ".") {
        response.ignoreMatch();
      }
    }
    function scopeClassName(mode, _parent) {
      if (mode.className !== undefined) {
        mode.scope = mode.className;
        delete mode.className;
      }
    }
    function beginKeywords(mode, parent) {
      if (!parent) return;
      if (!mode.beginKeywords) return;
      mode.begin = '\\b(' + mode.beginKeywords.split(' ').join('|') + ')(?!\\.)(?=\\b|\\s)';
      mode.__beforeBegin = skipIfHasPrecedingDot;
      mode.keywords = mode.keywords || mode.beginKeywords;
      delete mode.beginKeywords;
      if (mode.relevance === undefined) mode.relevance = 0;
    }
    function compileIllegal(mode, _parent) {
      if (!Array.isArray(mode.illegal)) return;
      mode.illegal = either$1(...mode.illegal);
    }
    function compileMatch(mode, _parent) {
      if (!mode.match) return;
      if (mode.begin || mode.end) throw new Error("begin & end are not supported with match");
      mode.begin = mode.match;
      delete mode.match;
    }
    function compileRelevance(mode, _parent) {
      if (mode.relevance === undefined) mode.relevance = 1;
    }
    const beforeMatchExt = (mode, parent) => {
      if (!mode.beforeMatch) return;
      if (mode.starts) throw new Error("beforeMatch cannot be used with starts");
      const originalMode = Object.assign({}, mode);
      Object.keys(mode).forEach((key) => { delete mode[key]; });
      mode.keywords = originalMode.keywords;
      mode.begin = concat$1(originalMode.beforeMatch, lookahead$1(originalMode.begin));
      mode.starts = {
        relevance: 0,
        contains: [
          Object.assign(originalMode, { endsParent: true })
        ]
      };
      mode.relevance = 0;
      delete originalMode.beforeMatch;
    };
    const COMMON_KEYWORDS = [
      'of',
      'and',
      'for',
      'in',
      'not',
      'or',
      'if',
      'then',
      'parent',
      'list',
      'value'
    ];
    const DEFAULT_KEYWORD_SCOPE = "keyword";
    function compileKeywords(rawKeywords, caseInsensitive, scopeName = DEFAULT_KEYWORD_SCOPE) {
      const compiledKeywords = Object.create(null);
      if (typeof rawKeywords === 'string') {
        compileList(scopeName, rawKeywords.split(" "));
      } else if (Array.isArray(rawKeywords)) {
        compileList(scopeName, rawKeywords);
      } else {
        Object.keys(rawKeywords).forEach(function(scopeName) {
          Object.assign(
            compiledKeywords,
            compileKeywords(rawKeywords[scopeName], caseInsensitive, scopeName)
          );
        });
      }
      return compiledKeywords;
      function compileList(scopeName, keywordList) {
        if (caseInsensitive) {
          keywordList = keywordList.map(x => x.toLowerCase());
        }
        keywordList.forEach(function(keyword) {
          const pair = keyword.split('|');
          compiledKeywords[pair[0]] = [scopeName, scoreForKeyword(pair[0], pair[1])];
        });
      }
    }
    function scoreForKeyword(keyword, providedScore) {
      if (providedScore) {
        return Number(providedScore);
      }
      return commonKeyword(keyword) ? 0 : 1;
    }
    function commonKeyword(keyword) {
      return COMMON_KEYWORDS.includes(keyword.toLowerCase());
    }
    const seenDeprecations = {};
    const error = (message) => {
      console.error(message);
    };
    const warn = (message, ...args) => {
      console.log(`WARN: ${message}`, ...args);
    };
    const deprecated = (version, message) => {
      if (seenDeprecations[`${version}/${message}`]) return;
      console.log(`Deprecated as of ${version}. ${message}`);
      seenDeprecations[`${version}/${message}`] = true;
    };
    const MultiClassError = new Error();
    function remapScopeNames(mode, regexes, { key }) {
      let offset = 0;
      const scopeNames = mode[key];
      const emit = {};
      const positions = {};
      for (let i = 1; i <= regexes.length; i++) {
        positions[i + offset] = scopeNames[i];
        emit[i + offset] = true;
        offset += countMatchGroups(regexes[i - 1]);
      }
      mode[key] = positions;
      mode[key]._emit = emit;
      mode[key]._multi = true;
    }
    function beginMultiClass(mode) {
      if (!Array.isArray(mode.begin)) return;
      if (mode.skip || mode.excludeBegin || mode.returnBegin) {
        error("skip, excludeBegin, returnBegin not compatible with beginScope: {}");
        throw MultiClassError;
      }
      if (typeof mode.beginScope !== "object" || mode.beginScope === null) {
        error("beginScope must be object");
        throw MultiClassError;
      }
      remapScopeNames(mode, mode.begin, { key: "beginScope" });
      mode.begin = _rewriteBackreferences(mode.begin, { joinWith: "" });
    }
    function endMultiClass(mode) {
      if (!Array.isArray(mode.end)) return;
      if (mode.skip || mode.excludeEnd || mode.returnEnd) {
        error("skip, excludeEnd, returnEnd not compatible with endScope: {}");
        throw MultiClassError;
      }
      if (typeof mode.endScope !== "object" || mode.endScope === null) {
        error("endScope must be object");
        throw MultiClassError;
      }
      remapScopeNames(mode, mode.end, { key: "endScope" });
      mode.end = _rewriteBackreferences(mode.end, { joinWith: "" });
    }
    function scopeSugar(mode) {
      if (mode.scope && typeof mode.scope === "object" && mode.scope !== null) {
        mode.beginScope = mode.scope;
        delete mode.scope;
      }
    }
    function MultiClass(mode) {
      scopeSugar(mode);
      if (typeof mode.beginScope === "string") {
        mode.beginScope = { _wrap: mode.beginScope };
      }
      if (typeof mode.endScope === "string") {
        mode.endScope = { _wrap: mode.endScope };
      }
      beginMultiClass(mode);
      endMultiClass(mode);
    }
    function compileLanguage(language) {
      function langRe(value, global) {
        return new RegExp(
          source$1(value),
          'm'
          + (language.case_insensitive ? 'i' : '')
          + (language.unicodeRegex ? 'u' : '')
          + (global ? 'g' : '')
        );
      }
      class MultiRegex {
        constructor() {
          this.matchIndexes = {};
          this.regexes = [];
          this.matchAt = 1;
          this.position = 0;
        }
        addRule(re, opts) {
          opts.position = this.position++;
          this.matchIndexes[this.matchAt] = opts;
          this.regexes.push([opts, re]);
          this.matchAt += countMatchGroups(re) + 1;
        }
        compile() {
          if (this.regexes.length === 0) {
            this.exec = () => null;
          }
          const terminators = this.regexes.map(el => el[1]);
          this.matcherRe = langRe(_rewriteBackreferences(terminators, { joinWith: '|' }), true);
          this.lastIndex = 0;
        }
        exec(s) {
          this.matcherRe.lastIndex = this.lastIndex;
          const match = this.matcherRe.exec(s);
          if (!match) { return null; }
          const i = match.findIndex((el, i) => i > 0 && el !== undefined);
          const matchData = this.matchIndexes[i];
          match.splice(0, i);
          return Object.assign(match, matchData);
        }
      }
      class ResumableMultiRegex {
        constructor() {
          this.rules = [];
          this.multiRegexes = [];
          this.count = 0;
          this.lastIndex = 0;
          this.regexIndex = 0;
        }
        getMatcher(index) {
          if (this.multiRegexes[index]) return this.multiRegexes[index];
          const matcher = new MultiRegex();
          this.rules.slice(index).forEach(([re, opts]) => matcher.addRule(re, opts));
          matcher.compile();
          this.multiRegexes[index] = matcher;
          return matcher;
        }
        resumingScanAtSamePosition() {
          return this.regexIndex !== 0;
        }
        considerAll() {
          this.regexIndex = 0;
        }
        addRule(re, opts) {
          this.rules.push([re, opts]);
          if (opts.type === "begin") this.count++;
        }
        exec(s) {
          const m = this.getMatcher(this.regexIndex);
          m.lastIndex = this.lastIndex;
          let result = m.exec(s);
          if (this.resumingScanAtSamePosition()) {
            if (result && result.index === this.lastIndex) ; else {
              const m2 = this.getMatcher(0);
              m2.lastIndex = this.lastIndex + 1;
              result = m2.exec(s);
            }
          }
          if (result) {
            this.regexIndex += result.position + 1;
            if (this.regexIndex === this.count) {
              this.considerAll();
            }
          }
          return result;
        }
      }
      function buildModeRegex(mode) {
        const mm = new ResumableMultiRegex();
        mode.contains.forEach(term => mm.addRule(term.begin, { rule: term, type: "begin" }));
        if (mode.terminatorEnd) {
          mm.addRule(mode.terminatorEnd, { type: "end" });
        }
        if (mode.illegal) {
          mm.addRule(mode.illegal, { type: "illegal" });
        }
        return mm;
      }
      function compileMode(mode, parent) {
        const cmode =  (mode);
        if (mode.isCompiled) return cmode;
        [
          scopeClassName,
          compileMatch,
          MultiClass,
          beforeMatchExt
        ].forEach(ext => ext(mode, parent));
        language.compilerExtensions.forEach(ext => ext(mode, parent));
        mode.__beforeBegin = null;
        [
          beginKeywords,
          compileIllegal,
          compileRelevance
        ].forEach(ext => ext(mode, parent));
        mode.isCompiled = true;
        let keywordPattern = null;
        if (typeof mode.keywords === "object" && mode.keywords.$pattern) {
          mode.keywords = Object.assign({}, mode.keywords);
          keywordPattern = mode.keywords.$pattern;
          delete mode.keywords.$pattern;
        }
        keywordPattern = keywordPattern || /\w+/;
        if (mode.keywords) {
          mode.keywords = compileKeywords(mode.keywords, language.case_insensitive);
        }
        cmode.keywordPatternRe = langRe(keywordPattern, true);
        if (parent) {
          if (!mode.begin) mode.begin = /\B|\b/;
          cmode.beginRe = langRe(cmode.begin);
          if (!mode.end && !mode.endsWithParent) mode.end = /\B|\b/;
          if (mode.end) cmode.endRe = langRe(cmode.end);
          cmode.terminatorEnd = source$1(cmode.end) || '';
          if (mode.endsWithParent && parent.terminatorEnd) {
            cmode.terminatorEnd += (mode.end ? '|' : '') + parent.terminatorEnd;
          }
        }
        if (mode.illegal) cmode.illegalRe = langRe( (mode.illegal));
        if (!mode.contains) mode.contains = [];
        mode.contains = [].concat(...mode.contains.map(function(c) {
          return expandOrCloneMode(c === 'self' ? mode : c);
        }));
        mode.contains.forEach(function(c) { compileMode( (c), cmode); });
        if (mode.starts) {
          compileMode(mode.starts, parent);
        }
        cmode.matcher = buildModeRegex(cmode);
        return cmode;
      }
      if (!language.compilerExtensions) language.compilerExtensions = [];
      if (language.contains && language.contains.includes('self')) {
        throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
      }
      language.classNameAliases = inherit$1(language.classNameAliases || {});
      return compileMode( (language));
    }
    function dependencyOnParent(mode) {
      if (!mode) return false;
      return mode.endsWithParent || dependencyOnParent(mode.starts);
    }
    function expandOrCloneMode(mode) {
      if (mode.variants && !mode.cachedVariants) {
        mode.cachedVariants = mode.variants.map(function(variant) {
          return inherit$1(mode, { variants: null }, variant);
        });
      }
      if (mode.cachedVariants) {
        return mode.cachedVariants;
      }
      if (dependencyOnParent(mode)) {
        return inherit$1(mode, { starts: mode.starts ? inherit$1(mode.starts) : null });
      }
      if (Object.isFrozen(mode)) {
        return inherit$1(mode);
      }
      return mode;
    }
    var version = "11.6.0";
    class HTMLInjectionError extends Error {
      constructor(reason, html) {
        super(reason);
        this.name = "HTMLInjectionError";
        this.html = html;
      }
    }
    const escape = escapeHTML;
    const inherit = inherit$1;
    const NO_MATCH = Symbol("nomatch");
    const MAX_KEYWORD_HITS = 7;
    const HLJS = function(hljs) {
      const languages = Object.create(null);
      const aliases = Object.create(null);
      const plugins = [];
      let SAFE_MODE = true;
      const LANGUAGE_NOT_FOUND = "Could not find the language '{}', did you forget to load/include a language module?";
      const PLAINTEXT_LANGUAGE = { disableAutodetect: true, name: 'Plain text', contains: [] };
      let options = {
        ignoreUnescapedHTML: false,
        throwUnescapedHTML: false,
        noHighlightRe: /^(no-?highlight)$/i,
        languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
        classPrefix: 'hljs-',
        cssSelector: 'pre code',
        languages: null,
        __emitter: TokenTreeEmitter
      };
      function shouldNotHighlight(languageName) {
        return options.noHighlightRe.test(languageName);
      }
      function blockLanguage(block) {
        let classes = block.className + ' ';
        classes += block.parentNode ? block.parentNode.className : '';
        const match = options.languageDetectRe.exec(classes);
        if (match) {
          const language = getLanguage(match[1]);
          if (!language) {
            warn(LANGUAGE_NOT_FOUND.replace("{}", match[1]));
            warn("Falling back to no-highlight mode for this block.", block);
          }
          return language ? match[1] : 'no-highlight';
        }
        return classes
          .split(/\s+/)
          .find((_class) => shouldNotHighlight(_class) || getLanguage(_class));
      }
      function highlight(codeOrLanguageName, optionsOrCode, ignoreIllegals) {
        let code = "";
        let languageName = "";
        if (typeof optionsOrCode === "object") {
          code = codeOrLanguageName;
          ignoreIllegals = optionsOrCode.ignoreIllegals;
          languageName = optionsOrCode.language;
        } else {
          deprecated("10.7.0", "highlight(lang, code, ...args) has been deprecated.");
          deprecated("10.7.0", "Please use highlight(code, options) instead.\nhttps://github.com/highlightjs/highlight.js/issues/2277");
          languageName = codeOrLanguageName;
          code = optionsOrCode;
        }
        if (ignoreIllegals === undefined) { ignoreIllegals = true; }
        const context = {
          code,
          language: languageName
        };
        fire("before:highlight", context);
        const result = context.result
          ? context.result
          : _highlight(context.language, context.code, ignoreIllegals);
        result.code = context.code;
        fire("after:highlight", result);
        return result;
      }
      function _highlight(languageName, codeToHighlight, ignoreIllegals, continuation) {
        const keywordHits = Object.create(null);
        function keywordData(mode, matchText) {
          return mode.keywords[matchText];
        }
        function processKeywords() {
          if (!top.keywords) {
            emitter.addText(modeBuffer);
            return;
          }
          let lastIndex = 0;
          top.keywordPatternRe.lastIndex = 0;
          let match = top.keywordPatternRe.exec(modeBuffer);
          let buf = "";
          while (match) {
            buf += modeBuffer.substring(lastIndex, match.index);
            const word = language.case_insensitive ? match[0].toLowerCase() : match[0];
            const data = keywordData(top, word);
            if (data) {
              const [kind, keywordRelevance] = data;
              emitter.addText(buf);
              buf = "";
              keywordHits[word] = (keywordHits[word] || 0) + 1;
              if (keywordHits[word] <= MAX_KEYWORD_HITS) relevance += keywordRelevance;
              if (kind.startsWith("_")) {
                buf += match[0];
              } else {
                const cssClass = language.classNameAliases[kind] || kind;
                emitter.addKeyword(match[0], cssClass);
              }
            } else {
              buf += match[0];
            }
            lastIndex = top.keywordPatternRe.lastIndex;
            match = top.keywordPatternRe.exec(modeBuffer);
          }
          buf += modeBuffer.substring(lastIndex);
          emitter.addText(buf);
        }
        function processSubLanguage() {
          if (modeBuffer === "") return;
          let result = null;
          if (typeof top.subLanguage === 'string') {
            if (!languages[top.subLanguage]) {
              emitter.addText(modeBuffer);
              return;
            }
            result = _highlight(top.subLanguage, modeBuffer, true, continuations[top.subLanguage]);
            continuations[top.subLanguage] =  (result._top);
          } else {
            result = highlightAuto(modeBuffer, top.subLanguage.length ? top.subLanguage : null);
          }
          if (top.relevance > 0) {
            relevance += result.relevance;
          }
          emitter.addSublanguage(result._emitter, result.language);
        }
        function processBuffer() {
          if (top.subLanguage != null) {
            processSubLanguage();
          } else {
            processKeywords();
          }
          modeBuffer = '';
        }
        function emitMultiClass(scope, match) {
          let i = 1;
          const max = match.length - 1;
          while (i <= max) {
            if (!scope._emit[i]) { i++; continue; }
            const klass = language.classNameAliases[scope[i]] || scope[i];
            const text = match[i];
            if (klass) {
              emitter.addKeyword(text, klass);
            } else {
              modeBuffer = text;
              processKeywords();
              modeBuffer = "";
            }
            i++;
          }
        }
        function startNewMode(mode, match) {
          if (mode.scope && typeof mode.scope === "string") {
            emitter.openNode(language.classNameAliases[mode.scope] || mode.scope);
          }
          if (mode.beginScope) {
            if (mode.beginScope._wrap) {
              emitter.addKeyword(modeBuffer, language.classNameAliases[mode.beginScope._wrap] || mode.beginScope._wrap);
              modeBuffer = "";
            } else if (mode.beginScope._multi) {
              emitMultiClass(mode.beginScope, match);
              modeBuffer = "";
            }
          }
          top = Object.create(mode, { parent: { value: top } });
          return top;
        }
        function endOfMode(mode, match, matchPlusRemainder) {
          let matched = startsWith(mode.endRe, matchPlusRemainder);
          if (matched) {
            if (mode["on:end"]) {
              const resp = new Response(mode);
              mode["on:end"](match, resp);
              if (resp.isMatchIgnored) matched = false;
            }
            if (matched) {
              while (mode.endsParent && mode.parent) {
                mode = mode.parent;
              }
              return mode;
            }
          }
          if (mode.endsWithParent) {
            return endOfMode(mode.parent, match, matchPlusRemainder);
          }
        }
        function doIgnore(lexeme) {
          if (top.matcher.regexIndex === 0) {
            modeBuffer += lexeme[0];
            return 1;
          } else {
            resumeScanAtSamePosition = true;
            return 0;
          }
        }
        function doBeginMatch(match) {
          const lexeme = match[0];
          const newMode = match.rule;
          const resp = new Response(newMode);
          const beforeCallbacks = [newMode.__beforeBegin, newMode["on:begin"]];
          for (const cb of beforeCallbacks) {
            if (!cb) continue;
            cb(match, resp);
            if (resp.isMatchIgnored) return doIgnore(lexeme);
          }
          if (newMode.skip) {
            modeBuffer += lexeme;
          } else {
            if (newMode.excludeBegin) {
              modeBuffer += lexeme;
            }
            processBuffer();
            if (!newMode.returnBegin && !newMode.excludeBegin) {
              modeBuffer = lexeme;
            }
          }
          startNewMode(newMode, match);
          return newMode.returnBegin ? 0 : lexeme.length;
        }
        function doEndMatch(match) {
          const lexeme = match[0];
          const matchPlusRemainder = codeToHighlight.substring(match.index);
          const endMode = endOfMode(top, match, matchPlusRemainder);
          if (!endMode) { return NO_MATCH; }
          const origin = top;
          if (top.endScope && top.endScope._wrap) {
            processBuffer();
            emitter.addKeyword(lexeme, top.endScope._wrap);
          } else if (top.endScope && top.endScope._multi) {
            processBuffer();
            emitMultiClass(top.endScope, match);
          } else if (origin.skip) {
            modeBuffer += lexeme;
          } else {
            if (!(origin.returnEnd || origin.excludeEnd)) {
              modeBuffer += lexeme;
            }
            processBuffer();
            if (origin.excludeEnd) {
              modeBuffer = lexeme;
            }
          }
          do {
            if (top.scope) {
              emitter.closeNode();
            }
            if (!top.skip && !top.subLanguage) {
              relevance += top.relevance;
            }
            top = top.parent;
          } while (top !== endMode.parent);
          if (endMode.starts) {
            startNewMode(endMode.starts, match);
          }
          return origin.returnEnd ? 0 : lexeme.length;
        }
        function processContinuations() {
          const list = [];
          for (let current = top; current !== language; current = current.parent) {
            if (current.scope) {
              list.unshift(current.scope);
            }
          }
          list.forEach(item => emitter.openNode(item));
        }
        let lastMatch = {};
        function processLexeme(textBeforeMatch, match) {
          const lexeme = match && match[0];
          modeBuffer += textBeforeMatch;
          if (lexeme == null) {
            processBuffer();
            return 0;
          }
          if (lastMatch.type === "begin" && match.type === "end" && lastMatch.index === match.index && lexeme === "") {
            modeBuffer += codeToHighlight.slice(match.index, match.index + 1);
            if (!SAFE_MODE) {
              const err = new Error(`0 width match regex (${languageName})`);
              err.languageName = languageName;
              err.badRule = lastMatch.rule;
              throw err;
            }
            return 1;
          }
          lastMatch = match;
          if (match.type === "begin") {
            return doBeginMatch(match);
          } else if (match.type === "illegal" && !ignoreIllegals) {
            const err = new Error('Illegal lexeme "' + lexeme + '" for mode "' + (top.scope || '<unnamed>') + '"');
            err.mode = top;
            throw err;
          } else if (match.type === "end") {
            const processed = doEndMatch(match);
            if (processed !== NO_MATCH) {
              return processed;
            }
          }
          if (match.type === "illegal" && lexeme === "") {
            return 1;
          }
          if (iterations > 100000 && iterations > match.index * 3) {
            const err = new Error('potential infinite loop, way more iterations than matches');
            throw err;
          }
          modeBuffer += lexeme;
          return lexeme.length;
        }
        const language = getLanguage(languageName);
        if (!language) {
          error(LANGUAGE_NOT_FOUND.replace("{}", languageName));
          throw new Error('Unknown language: "' + languageName + '"');
        }
        const md = compileLanguage(language);
        let result = '';
        let top = continuation || md;
        const continuations = {};
        const emitter = new options.__emitter(options);
        processContinuations();
        let modeBuffer = '';
        let relevance = 0;
        let index = 0;
        let iterations = 0;
        let resumeScanAtSamePosition = false;
        try {
          top.matcher.considerAll();
          for (;;) {
            iterations++;
            if (resumeScanAtSamePosition) {
              resumeScanAtSamePosition = false;
            } else {
              top.matcher.considerAll();
            }
            top.matcher.lastIndex = index;
            const match = top.matcher.exec(codeToHighlight);
            if (!match) break;
            const beforeMatch = codeToHighlight.substring(index, match.index);
            const processedCount = processLexeme(beforeMatch, match);
            index = match.index + processedCount;
          }
          processLexeme(codeToHighlight.substring(index));
          emitter.closeAllNodes();
          emitter.finalize();
          result = emitter.toHTML();
          return {
            language: languageName,
            value: result,
            relevance: relevance,
            illegal: false,
            _emitter: emitter,
            _top: top
          };
        } catch (err) {
          if (err.message && err.message.includes('Illegal')) {
            return {
              language: languageName,
              value: escape(codeToHighlight),
              illegal: true,
              relevance: 0,
              _illegalBy: {
                message: err.message,
                index: index,
                context: codeToHighlight.slice(index - 100, index + 100),
                mode: err.mode,
                resultSoFar: result
              },
              _emitter: emitter
            };
          } else if (SAFE_MODE) {
            return {
              language: languageName,
              value: escape(codeToHighlight),
              illegal: false,
              relevance: 0,
              errorRaised: err,
              _emitter: emitter,
              _top: top
            };
          } else {
            throw err;
          }
        }
      }
      function justTextHighlightResult(code) {
        const result = {
          value: escape(code),
          illegal: false,
          relevance: 0,
          _top: PLAINTEXT_LANGUAGE,
          _emitter: new options.__emitter(options)
        };
        result._emitter.addText(code);
        return result;
      }
      function highlightAuto(code, languageSubset) {
        languageSubset = languageSubset || options.languages || Object.keys(languages);
        const plaintext = justTextHighlightResult(code);
        const results = languageSubset.filter(getLanguage).filter(autoDetection).map(name =>
          _highlight(name, code, false)
        );
        results.unshift(plaintext);
        const sorted = results.sort((a, b) => {
          if (a.relevance !== b.relevance) return b.relevance - a.relevance;
          if (a.language && b.language) {
            if (getLanguage(a.language).supersetOf === b.language) {
              return 1;
            } else if (getLanguage(b.language).supersetOf === a.language) {
              return -1;
            }
          }
          return 0;
        });
        const [best, secondBest] = sorted;
        const result = best;
        result.secondBest = secondBest;
        return result;
      }
      function updateClassName(element, currentLang, resultLang) {
        const language = (currentLang && aliases[currentLang]) || resultLang;
        element.classList.add("hljs");
        element.classList.add(`language-${language}`);
      }
      function highlightElement(element) {
        let node = null;
        const language = blockLanguage(element);
        if (shouldNotHighlight(language)) return;
        fire("before:highlightElement",
          { el: element, language: language });
        if (element.children.length > 0) {
          if (!options.ignoreUnescapedHTML) {
            console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk.");
            console.warn("https://github.com/highlightjs/highlight.js/wiki/security");
            console.warn("The element with unescaped HTML:");
            console.warn(element);
          }
          if (options.throwUnescapedHTML) {
            const err = new HTMLInjectionError(
              "One of your code blocks includes unescaped HTML.",
              element.innerHTML
            );
            throw err;
          }
        }
        node = element;
        const text = node.textContent;
        const result = language ? highlight(text, { language, ignoreIllegals: true }) : highlightAuto(text);
        element.innerHTML = result.value;
        updateClassName(element, language, result.language);
        element.result = {
          language: result.language,
          re: result.relevance,
          relevance: result.relevance
        };
        if (result.secondBest) {
          element.secondBest = {
            language: result.secondBest.language,
            relevance: result.secondBest.relevance
          };
        }
        fire("after:highlightElement", { el: element, result, text });
      }
      function configure(userOptions) {
        options = inherit(options, userOptions);
      }
      const initHighlighting = () => {
        highlightAll();
        deprecated("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
      };
      function initHighlightingOnLoad() {
        highlightAll();
        deprecated("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
      }
      let wantsHighlight = false;
      function highlightAll() {
        if (document.readyState === "loading") {
          wantsHighlight = true;
          return;
        }
        const blocks = document.querySelectorAll(options.cssSelector);
        blocks.forEach(highlightElement);
      }
      function boot() {
        if (wantsHighlight) highlightAll();
      }
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('DOMContentLoaded', boot, false);
      }
      function registerLanguage(languageName, languageDefinition) {
        let lang = null;
        try {
          lang = languageDefinition(hljs);
        } catch (error$1) {
          error("Language definition for '{}' could not be registered.".replace("{}", languageName));
          if (!SAFE_MODE) { throw error$1; } else { error(error$1); }
          lang = PLAINTEXT_LANGUAGE;
        }
        if (!lang.name) lang.name = languageName;
        languages[languageName] = lang;
        lang.rawDefinition = languageDefinition.bind(null, hljs);
        if (lang.aliases) {
          registerAliases(lang.aliases, { languageName });
        }
      }
      function unregisterLanguage(languageName) {
        delete languages[languageName];
        for (const alias of Object.keys(aliases)) {
          if (aliases[alias] === languageName) {
            delete aliases[alias];
          }
        }
      }
      function listLanguages() {
        return Object.keys(languages);
      }
      function getLanguage(name) {
        name = (name || '').toLowerCase();
        return languages[name] || languages[aliases[name]];
      }
      function registerAliases(aliasList, { languageName }) {
        if (typeof aliasList === 'string') {
          aliasList = [aliasList];
        }
        aliasList.forEach(alias => { aliases[alias.toLowerCase()] = languageName; });
      }
      function autoDetection(name) {
        const lang = getLanguage(name);
        return lang && !lang.disableAutodetect;
      }
      function upgradePluginAPI(plugin) {
        if (plugin["before:highlightBlock"] && !plugin["before:highlightElement"]) {
          plugin["before:highlightElement"] = (data) => {
            plugin["before:highlightBlock"](
              Object.assign({ block: data.el }, data)
            );
          };
        }
        if (plugin["after:highlightBlock"] && !plugin["after:highlightElement"]) {
          plugin["after:highlightElement"] = (data) => {
            plugin["after:highlightBlock"](
              Object.assign({ block: data.el }, data)
            );
          };
        }
      }
      function addPlugin(plugin) {
        upgradePluginAPI(plugin);
        plugins.push(plugin);
      }
      function fire(event, args) {
        const cb = event;
        plugins.forEach(function(plugin) {
          if (plugin[cb]) {
            plugin[cb](args);
          }
        });
      }
      function deprecateHighlightBlock(el) {
        deprecated("10.7.0", "highlightBlock will be removed entirely in v12.0");
        deprecated("10.7.0", "Please use highlightElement now.");
        return highlightElement(el);
      }
      Object.assign(hljs, {
        highlight,
        highlightAuto,
        highlightAll,
        highlightElement,
        highlightBlock: deprecateHighlightBlock,
        configure,
        initHighlighting,
        initHighlightingOnLoad,
        registerLanguage,
        unregisterLanguage,
        listLanguages,
        getLanguage,
        registerAliases,
        autoDetection,
        inherit,
        addPlugin
      });
      hljs.debugMode = function() { SAFE_MODE = false; };
      hljs.safeMode = function() { SAFE_MODE = true; };
      hljs.versionString = version;
      hljs.regex = {
        concat: concat$1,
        lookahead: lookahead$1,
        either: either$1,
        optional: optional,
        anyNumberOfTimes: anyNumberOfTimes
      };
      for (const key in MODES) {
        if (typeof MODES[key] === "object") {
          deepFreezeEs6.exports(MODES[key]);
        }
      }
      Object.assign(hljs, MODES);
      return hljs;
    };
    var highlight = HLJS({});
    var core = highlight;
    highlight.HighlightJS = highlight;
    highlight.default = highlight;

    function c(hljs) {
      const regex = hljs.regex;
      const C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$', { contains: [ { begin: /\\\n/ } ] });
      const DECLTYPE_AUTO_RE = 'decltype\\(auto\\)';
      const NAMESPACE_RE = '[a-zA-Z_]\\w*::';
      const TEMPLATE_ARGUMENT_RE = '<[^<>]+>';
      const FUNCTION_TYPE_RE = '('
        + DECLTYPE_AUTO_RE + '|'
        + regex.optional(NAMESPACE_RE)
        + '[a-zA-Z_]\\w*' + regex.optional(TEMPLATE_ARGUMENT_RE)
      + ')';
      const TYPES = {
        className: 'type',
        variants: [
          { begin: '\\b[a-z\\d_]*_t\\b' },
          { match: /\batomic_[a-z]{3,6}\b/ }
        ]
      };
      const CHARACTER_ESCAPES = '\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)';
      const STRINGS = {
        className: 'string',
        variants: [
          {
            begin: '(u8?|U|L)?"',
            end: '"',
            illegal: '\\n',
            contains: [ hljs.BACKSLASH_ESCAPE ]
          },
          {
            begin: '(u8?|U|L)?\'(' + CHARACTER_ESCAPES + "|.)",
            end: '\'',
            illegal: '.'
          },
          hljs.END_SAME_AS_BEGIN({
            begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
            end: /\)([^()\\ ]{0,16})"/
          })
        ]
      };
      const NUMBERS = {
        className: 'number',
        variants: [
          { begin: '\\b(0b[01\']+)' },
          { begin: '(-?)\\b([\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)' },
          { begin: '(-?)(\\b0[xX][a-fA-F0-9\']+|(\\b[\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)([eE][-+]?[\\d\']+)?)' }
        ],
        relevance: 0
      };
      const PREPROCESSOR = {
        className: 'meta',
        begin: /#\s*[a-z]+\b/,
        end: /$/,
        keywords: { keyword:
            'if else elif endif define undef warning error line '
            + 'pragma _Pragma ifdef ifndef include' },
        contains: [
          {
            begin: /\\\n/,
            relevance: 0
          },
          hljs.inherit(STRINGS, { className: 'string' }),
          {
            className: 'string',
            begin: /<.*?>/
          },
          C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE
        ]
      };
      const TITLE_MODE = {
        className: 'title',
        begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
        relevance: 0
      };
      const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + '\\s*\\(';
      const C_KEYWORDS = [
        "asm",
        "auto",
        "break",
        "case",
        "continue",
        "default",
        "do",
        "else",
        "enum",
        "extern",
        "for",
        "fortran",
        "goto",
        "if",
        "inline",
        "register",
        "restrict",
        "return",
        "sizeof",
        "struct",
        "switch",
        "typedef",
        "union",
        "volatile",
        "while",
        "_Alignas",
        "_Alignof",
        "_Atomic",
        "_Generic",
        "_Noreturn",
        "_Static_assert",
        "_Thread_local",
        "alignas",
        "alignof",
        "noreturn",
        "static_assert",
        "thread_local",
        "_Pragma"
      ];
      const C_TYPES = [
        "float",
        "double",
        "signed",
        "unsigned",
        "int",
        "short",
        "long",
        "char",
        "void",
        "_Bool",
        "_Complex",
        "_Imaginary",
        "_Decimal32",
        "_Decimal64",
        "_Decimal128",
        "const",
        "static",
        "complex",
        "bool",
        "imaginary"
      ];
      const KEYWORDS = {
        keyword: C_KEYWORDS,
        type: C_TYPES,
        literal: 'true false NULL',
        built_in: 'std string wstring cin cout cerr clog stdin stdout stderr stringstream istringstream ostringstream '
          + 'auto_ptr deque list queue stack vector map set pair bitset multiset multimap unordered_set '
          + 'unordered_map unordered_multiset unordered_multimap priority_queue make_pair array shared_ptr abort terminate abs acos '
          + 'asin atan2 atan calloc ceil cosh cos exit exp fabs floor fmod fprintf fputs free frexp '
          + 'fscanf future isalnum isalpha iscntrl isdigit isgraph islower isprint ispunct isspace isupper '
          + 'isxdigit tolower toupper labs ldexp log10 log malloc realloc memchr memcmp memcpy memset modf pow '
          + 'printf putchar puts scanf sinh sin snprintf sprintf sqrt sscanf strcat strchr strcmp '
          + 'strcpy strcspn strlen strncat strncmp strncpy strpbrk strrchr strspn strstr tanh tan '
          + 'vfprintf vprintf vsprintf endl initializer_list unique_ptr',
      };
      const EXPRESSION_CONTAINS = [
        PREPROCESSOR,
        TYPES,
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        NUMBERS,
        STRINGS
      ];
      const EXPRESSION_CONTEXT = {
        variants: [
          {
            begin: /=/,
            end: /;/
          },
          {
            begin: /\(/,
            end: /\)/
          },
          {
            beginKeywords: 'new throw return else',
            end: /;/
          }
        ],
        keywords: KEYWORDS,
        contains: EXPRESSION_CONTAINS.concat([
          {
            begin: /\(/,
            end: /\)/,
            keywords: KEYWORDS,
            contains: EXPRESSION_CONTAINS.concat([ 'self' ]),
            relevance: 0
          }
        ]),
        relevance: 0
      };
      const FUNCTION_DECLARATION = {
        begin: '(' + FUNCTION_TYPE_RE + '[\\*&\\s]+)+' + FUNCTION_TITLE,
        returnBegin: true,
        end: /[{;=]/,
        excludeEnd: true,
        keywords: KEYWORDS,
        illegal: /[^\w\s\*&:<>.]/,
        contains: [
          {
            begin: DECLTYPE_AUTO_RE,
            keywords: KEYWORDS,
            relevance: 0
          },
          {
            begin: FUNCTION_TITLE,
            returnBegin: true,
            contains: [ hljs.inherit(TITLE_MODE, { className: "title.function" }) ],
            relevance: 0
          },
          {
            relevance: 0,
            match: /,/
          },
          {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            keywords: KEYWORDS,
            relevance: 0,
            contains: [
              C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE,
              STRINGS,
              NUMBERS,
              TYPES,
              {
                begin: /\(/,
                end: /\)/,
                keywords: KEYWORDS,
                relevance: 0,
                contains: [
                  'self',
                  C_LINE_COMMENT_MODE,
                  hljs.C_BLOCK_COMMENT_MODE,
                  STRINGS,
                  NUMBERS,
                  TYPES
                ]
              }
            ]
          },
          TYPES,
          C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          PREPROCESSOR
        ]
      };
      return {
        name: "C",
        aliases: [ 'h' ],
        keywords: KEYWORDS,
        disableAutodetect: true,
        illegal: '</',
        contains: [].concat(
          EXPRESSION_CONTEXT,
          FUNCTION_DECLARATION,
          EXPRESSION_CONTAINS,
          [
            PREPROCESSOR,
            {
              begin: hljs.IDENT_RE + '::',
              keywords: KEYWORDS
            },
            {
              className: 'class',
              beginKeywords: 'enum class struct union',
              end: /[{;:<>=]/,
              contains: [
                { beginKeywords: "final class struct" },
                hljs.TITLE_MODE
              ]
            }
          ]),
        exports: {
          preprocessor: PREPROCESSOR,
          strings: STRINGS,
          keywords: KEYWORDS
        }
      };
    }

    function cpp(hljs) {
      const regex = hljs.regex;
      const C_LINE_COMMENT_MODE = hljs.COMMENT('//', '$', { contains: [ { begin: /\\\n/ } ] });
      const DECLTYPE_AUTO_RE = 'decltype\\(auto\\)';
      const NAMESPACE_RE = '[a-zA-Z_]\\w*::';
      const TEMPLATE_ARGUMENT_RE = '<[^<>]+>';
      const FUNCTION_TYPE_RE = '(?!struct)('
        + DECLTYPE_AUTO_RE + '|'
        + regex.optional(NAMESPACE_RE)
        + '[a-zA-Z_]\\w*' + regex.optional(TEMPLATE_ARGUMENT_RE)
      + ')';
      const CPP_PRIMITIVE_TYPES = {
        className: 'type',
        begin: '\\b[a-z\\d_]*_t\\b'
      };
      const CHARACTER_ESCAPES = '\\\\(x[0-9A-Fa-f]{2}|u[0-9A-Fa-f]{4,8}|[0-7]{3}|\\S)';
      const STRINGS = {
        className: 'string',
        variants: [
          {
            begin: '(u8?|U|L)?"',
            end: '"',
            illegal: '\\n',
            contains: [ hljs.BACKSLASH_ESCAPE ]
          },
          {
            begin: '(u8?|U|L)?\'(' + CHARACTER_ESCAPES + '|.)',
            end: '\'',
            illegal: '.'
          },
          hljs.END_SAME_AS_BEGIN({
            begin: /(?:u8?|U|L)?R"([^()\\ ]{0,16})\(/,
            end: /\)([^()\\ ]{0,16})"/
          })
        ]
      };
      const NUMBERS = {
        className: 'number',
        variants: [
          { begin: '\\b(0b[01\']+)' },
          { begin: '(-?)\\b([\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)((ll|LL|l|L)(u|U)?|(u|U)(ll|LL|l|L)?|f|F|b|B)' },
          { begin: '(-?)(\\b0[xX][a-fA-F0-9\']+|(\\b[\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)([eE][-+]?[\\d\']+)?)' }
        ],
        relevance: 0
      };
      const PREPROCESSOR = {
        className: 'meta',
        begin: /#\s*[a-z]+\b/,
        end: /$/,
        keywords: { keyword:
            'if else elif endif define undef warning error line '
            + 'pragma _Pragma ifdef ifndef include' },
        contains: [
          {
            begin: /\\\n/,
            relevance: 0
          },
          hljs.inherit(STRINGS, { className: 'string' }),
          {
            className: 'string',
            begin: /<.*?>/
          },
          C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE
        ]
      };
      const TITLE_MODE = {
        className: 'title',
        begin: regex.optional(NAMESPACE_RE) + hljs.IDENT_RE,
        relevance: 0
      };
      const FUNCTION_TITLE = regex.optional(NAMESPACE_RE) + hljs.IDENT_RE + '\\s*\\(';
      const RESERVED_KEYWORDS = [
        'alignas',
        'alignof',
        'and',
        'and_eq',
        'asm',
        'atomic_cancel',
        'atomic_commit',
        'atomic_noexcept',
        'auto',
        'bitand',
        'bitor',
        'break',
        'case',
        'catch',
        'class',
        'co_await',
        'co_return',
        'co_yield',
        'compl',
        'concept',
        'const_cast|10',
        'consteval',
        'constexpr',
        'constinit',
        'continue',
        'decltype',
        'default',
        'delete',
        'do',
        'dynamic_cast|10',
        'else',
        'enum',
        'explicit',
        'export',
        'extern',
        'false',
        'final',
        'for',
        'friend',
        'goto',
        'if',
        'import',
        'inline',
        'module',
        'mutable',
        'namespace',
        'new',
        'noexcept',
        'not',
        'not_eq',
        'nullptr',
        'operator',
        'or',
        'or_eq',
        'override',
        'private',
        'protected',
        'public',
        'reflexpr',
        'register',
        'reinterpret_cast|10',
        'requires',
        'return',
        'sizeof',
        'static_assert',
        'static_cast|10',
        'struct',
        'switch',
        'synchronized',
        'template',
        'this',
        'thread_local',
        'throw',
        'transaction_safe',
        'transaction_safe_dynamic',
        'true',
        'try',
        'typedef',
        'typeid',
        'typename',
        'union',
        'using',
        'virtual',
        'volatile',
        'while',
        'xor',
        'xor_eq'
      ];
      const RESERVED_TYPES = [
        'bool',
        'char',
        'char16_t',
        'char32_t',
        'char8_t',
        'double',
        'float',
        'int',
        'long',
        'short',
        'void',
        'wchar_t',
        'unsigned',
        'signed',
        'const',
        'static'
      ];
      const TYPE_HINTS = [
        'any',
        'auto_ptr',
        'barrier',
        'binary_semaphore',
        'bitset',
        'complex',
        'condition_variable',
        'condition_variable_any',
        'counting_semaphore',
        'deque',
        'false_type',
        'future',
        'imaginary',
        'initializer_list',
        'istringstream',
        'jthread',
        'latch',
        'lock_guard',
        'multimap',
        'multiset',
        'mutex',
        'optional',
        'ostringstream',
        'packaged_task',
        'pair',
        'promise',
        'priority_queue',
        'queue',
        'recursive_mutex',
        'recursive_timed_mutex',
        'scoped_lock',
        'set',
        'shared_future',
        'shared_lock',
        'shared_mutex',
        'shared_timed_mutex',
        'shared_ptr',
        'stack',
        'string_view',
        'stringstream',
        'timed_mutex',
        'thread',
        'true_type',
        'tuple',
        'unique_lock',
        'unique_ptr',
        'unordered_map',
        'unordered_multimap',
        'unordered_multiset',
        'unordered_set',
        'variant',
        'vector',
        'weak_ptr',
        'wstring',
        'wstring_view'
      ];
      const FUNCTION_HINTS = [
        'abort',
        'abs',
        'acos',
        'apply',
        'as_const',
        'asin',
        'atan',
        'atan2',
        'calloc',
        'ceil',
        'cerr',
        'cin',
        'clog',
        'cos',
        'cosh',
        'cout',
        'declval',
        'endl',
        'exchange',
        'exit',
        'exp',
        'fabs',
        'floor',
        'fmod',
        'forward',
        'fprintf',
        'fputs',
        'free',
        'frexp',
        'fscanf',
        'future',
        'invoke',
        'isalnum',
        'isalpha',
        'iscntrl',
        'isdigit',
        'isgraph',
        'islower',
        'isprint',
        'ispunct',
        'isspace',
        'isupper',
        'isxdigit',
        'labs',
        'launder',
        'ldexp',
        'log',
        'log10',
        'make_pair',
        'make_shared',
        'make_shared_for_overwrite',
        'make_tuple',
        'make_unique',
        'malloc',
        'memchr',
        'memcmp',
        'memcpy',
        'memset',
        'modf',
        'move',
        'pow',
        'printf',
        'putchar',
        'puts',
        'realloc',
        'scanf',
        'sin',
        'sinh',
        'snprintf',
        'sprintf',
        'sqrt',
        'sscanf',
        'std',
        'stderr',
        'stdin',
        'stdout',
        'strcat',
        'strchr',
        'strcmp',
        'strcpy',
        'strcspn',
        'strlen',
        'strncat',
        'strncmp',
        'strncpy',
        'strpbrk',
        'strrchr',
        'strspn',
        'strstr',
        'swap',
        'tan',
        'tanh',
        'terminate',
        'to_underlying',
        'tolower',
        'toupper',
        'vfprintf',
        'visit',
        'vprintf',
        'vsprintf'
      ];
      const LITERALS = [
        'NULL',
        'false',
        'nullopt',
        'nullptr',
        'true'
      ];
      const BUILT_IN = [ '_Pragma' ];
      const CPP_KEYWORDS = {
        type: RESERVED_TYPES,
        keyword: RESERVED_KEYWORDS,
        literal: LITERALS,
        built_in: BUILT_IN,
        _type_hints: TYPE_HINTS
      };
      const FUNCTION_DISPATCH = {
        className: 'function.dispatch',
        relevance: 0,
        keywords: {
          _hint: FUNCTION_HINTS },
        begin: regex.concat(
          /\b/,
          /(?!decltype)/,
          /(?!if)/,
          /(?!for)/,
          /(?!switch)/,
          /(?!while)/,
          hljs.IDENT_RE,
          regex.lookahead(/(<[^<>]+>|)\s*\(/))
      };
      const EXPRESSION_CONTAINS = [
        FUNCTION_DISPATCH,
        PREPROCESSOR,
        CPP_PRIMITIVE_TYPES,
        C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        NUMBERS,
        STRINGS
      ];
      const EXPRESSION_CONTEXT = {
        variants: [
          {
            begin: /=/,
            end: /;/
          },
          {
            begin: /\(/,
            end: /\)/
          },
          {
            beginKeywords: 'new throw return else',
            end: /;/
          }
        ],
        keywords: CPP_KEYWORDS,
        contains: EXPRESSION_CONTAINS.concat([
          {
            begin: /\(/,
            end: /\)/,
            keywords: CPP_KEYWORDS,
            contains: EXPRESSION_CONTAINS.concat([ 'self' ]),
            relevance: 0
          }
        ]),
        relevance: 0
      };
      const FUNCTION_DECLARATION = {
        className: 'function',
        begin: '(' + FUNCTION_TYPE_RE + '[\\*&\\s]+)+' + FUNCTION_TITLE,
        returnBegin: true,
        end: /[{;=]/,
        excludeEnd: true,
        keywords: CPP_KEYWORDS,
        illegal: /[^\w\s\*&:<>.]/,
        contains: [
          {
            begin: DECLTYPE_AUTO_RE,
            keywords: CPP_KEYWORDS,
            relevance: 0
          },
          {
            begin: FUNCTION_TITLE,
            returnBegin: true,
            contains: [ TITLE_MODE ],
            relevance: 0
          },
          {
            begin: /::/,
            relevance: 0
          },
          {
            begin: /:/,
            endsWithParent: true,
            contains: [
              STRINGS,
              NUMBERS
            ]
          },
          {
            relevance: 0,
            match: /,/
          },
          {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            keywords: CPP_KEYWORDS,
            relevance: 0,
            contains: [
              C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE,
              STRINGS,
              NUMBERS,
              CPP_PRIMITIVE_TYPES,
              {
                begin: /\(/,
                end: /\)/,
                keywords: CPP_KEYWORDS,
                relevance: 0,
                contains: [
                  'self',
                  C_LINE_COMMENT_MODE,
                  hljs.C_BLOCK_COMMENT_MODE,
                  STRINGS,
                  NUMBERS,
                  CPP_PRIMITIVE_TYPES
                ]
              }
            ]
          },
          CPP_PRIMITIVE_TYPES,
          C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          PREPROCESSOR
        ]
      };
      return {
        name: 'C++',
        aliases: [
          'cc',
          'c++',
          'h++',
          'hpp',
          'hh',
          'hxx',
          'cxx'
        ],
        keywords: CPP_KEYWORDS,
        illegal: '</',
        classNameAliases: { 'function.dispatch': 'built_in' },
        contains: [].concat(
          EXPRESSION_CONTEXT,
          FUNCTION_DECLARATION,
          FUNCTION_DISPATCH,
          EXPRESSION_CONTAINS,
          [
            PREPROCESSOR,
            {
              begin: '\\b(deque|list|queue|priority_queue|pair|stack|vector|map|set|bitset|multiset|multimap|unordered_map|unordered_set|unordered_multiset|unordered_multimap|array|tuple|optional|variant|function)\\s*<(?!<)',
              end: '>',
              keywords: CPP_KEYWORDS,
              contains: [
                'self',
                CPP_PRIMITIVE_TYPES
              ]
            },
            {
              begin: hljs.IDENT_RE + '::',
              keywords: CPP_KEYWORDS
            },
            {
              match: [
                /\b(?:enum(?:\s+(?:class|struct))?|class|struct|union)/,
                /\s+/,
                /\w+/
              ],
              className: {
                1: 'keyword',
                3: 'title.class'
              }
            }
          ])
      };
    }

    function csharp(hljs) {
      const BUILT_IN_KEYWORDS = [
        'bool',
        'byte',
        'char',
        'decimal',
        'delegate',
        'double',
        'dynamic',
        'enum',
        'float',
        'int',
        'long',
        'nint',
        'nuint',
        'object',
        'sbyte',
        'short',
        'string',
        'ulong',
        'uint',
        'ushort'
      ];
      const FUNCTION_MODIFIERS = [
        'public',
        'private',
        'protected',
        'static',
        'internal',
        'protected',
        'abstract',
        'async',
        'extern',
        'override',
        'unsafe',
        'virtual',
        'new',
        'sealed',
        'partial'
      ];
      const LITERAL_KEYWORDS = [
        'default',
        'false',
        'null',
        'true'
      ];
      const NORMAL_KEYWORDS = [
        'abstract',
        'as',
        'base',
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'do',
        'else',
        'event',
        'explicit',
        'extern',
        'finally',
        'fixed',
        'for',
        'foreach',
        'goto',
        'if',
        'implicit',
        'in',
        'interface',
        'internal',
        'is',
        'lock',
        'namespace',
        'new',
        'operator',
        'out',
        'override',
        'params',
        'private',
        'protected',
        'public',
        'readonly',
        'record',
        'ref',
        'return',
        'scoped',
        'sealed',
        'sizeof',
        'stackalloc',
        'static',
        'struct',
        'switch',
        'this',
        'throw',
        'try',
        'typeof',
        'unchecked',
        'unsafe',
        'using',
        'virtual',
        'void',
        'volatile',
        'while'
      ];
      const CONTEXTUAL_KEYWORDS = [
        'add',
        'alias',
        'and',
        'ascending',
        'async',
        'await',
        'by',
        'descending',
        'equals',
        'from',
        'get',
        'global',
        'group',
        'init',
        'into',
        'join',
        'let',
        'nameof',
        'not',
        'notnull',
        'on',
        'or',
        'orderby',
        'partial',
        'remove',
        'select',
        'set',
        'unmanaged',
        'value|0',
        'var',
        'when',
        'where',
        'with',
        'yield'
      ];
      const KEYWORDS = {
        keyword: NORMAL_KEYWORDS.concat(CONTEXTUAL_KEYWORDS),
        built_in: BUILT_IN_KEYWORDS,
        literal: LITERAL_KEYWORDS
      };
      const TITLE_MODE = hljs.inherit(hljs.TITLE_MODE, { begin: '[a-zA-Z](\\.?\\w)*' });
      const NUMBERS = {
        className: 'number',
        variants: [
          { begin: '\\b(0b[01\']+)' },
          { begin: '(-?)\\b([\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)(u|U|l|L|ul|UL|f|F|b|B)' },
          { begin: '(-?)(\\b0[xX][a-fA-F0-9\']+|(\\b[\\d\']+(\\.[\\d\']*)?|\\.[\\d\']+)([eE][-+]?[\\d\']+)?)' }
        ],
        relevance: 0
      };
      const VERBATIM_STRING = {
        className: 'string',
        begin: '@"',
        end: '"',
        contains: [ { begin: '""' } ]
      };
      const VERBATIM_STRING_NO_LF = hljs.inherit(VERBATIM_STRING, { illegal: /\n/ });
      const SUBST = {
        className: 'subst',
        begin: /\{/,
        end: /\}/,
        keywords: KEYWORDS
      };
      const SUBST_NO_LF = hljs.inherit(SUBST, { illegal: /\n/ });
      const INTERPOLATED_STRING = {
        className: 'string',
        begin: /\$"/,
        end: '"',
        illegal: /\n/,
        contains: [
          { begin: /\{\{/ },
          { begin: /\}\}/ },
          hljs.BACKSLASH_ESCAPE,
          SUBST_NO_LF
        ]
      };
      const INTERPOLATED_VERBATIM_STRING = {
        className: 'string',
        begin: /\$@"/,
        end: '"',
        contains: [
          { begin: /\{\{/ },
          { begin: /\}\}/ },
          { begin: '""' },
          SUBST
        ]
      };
      const INTERPOLATED_VERBATIM_STRING_NO_LF = hljs.inherit(INTERPOLATED_VERBATIM_STRING, {
        illegal: /\n/,
        contains: [
          { begin: /\{\{/ },
          { begin: /\}\}/ },
          { begin: '""' },
          SUBST_NO_LF
        ]
      });
      SUBST.contains = [
        INTERPOLATED_VERBATIM_STRING,
        INTERPOLATED_STRING,
        VERBATIM_STRING,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        NUMBERS,
        hljs.C_BLOCK_COMMENT_MODE
      ];
      SUBST_NO_LF.contains = [
        INTERPOLATED_VERBATIM_STRING_NO_LF,
        INTERPOLATED_STRING,
        VERBATIM_STRING_NO_LF,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        NUMBERS,
        hljs.inherit(hljs.C_BLOCK_COMMENT_MODE, { illegal: /\n/ })
      ];
      const STRING = { variants: [
        INTERPOLATED_VERBATIM_STRING,
        INTERPOLATED_STRING,
        VERBATIM_STRING,
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE
      ] };
      const GENERIC_MODIFIER = {
        begin: "<",
        end: ">",
        contains: [
          { beginKeywords: "in out" },
          TITLE_MODE
        ]
      };
      const TYPE_IDENT_RE = hljs.IDENT_RE + '(<' + hljs.IDENT_RE + '(\\s*,\\s*' + hljs.IDENT_RE + ')*>)?(\\[\\])?';
      const AT_IDENTIFIER = {
        begin: "@" + hljs.IDENT_RE,
        relevance: 0
      };
      return {
        name: 'C#',
        aliases: [
          'cs',
          'c#'
        ],
        keywords: KEYWORDS,
        illegal: /::/,
        contains: [
          hljs.COMMENT(
            '///',
            '$',
            {
              returnBegin: true,
              contains: [
                {
                  className: 'doctag',
                  variants: [
                    {
                      begin: '///',
                      relevance: 0
                    },
                    { begin: '<!--|-->' },
                    {
                      begin: '</?',
                      end: '>'
                    }
                  ]
                }
              ]
            }
          ),
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          {
            className: 'meta',
            begin: '#',
            end: '$',
            keywords: { keyword: 'if else elif endif define undef warning error line region endregion pragma checksum' }
          },
          STRING,
          NUMBERS,
          {
            beginKeywords: 'class interface',
            relevance: 0,
            end: /[{;=]/,
            illegal: /[^\s:,]/,
            contains: [
              { beginKeywords: "where class" },
              TITLE_MODE,
              GENERIC_MODIFIER,
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          },
          {
            beginKeywords: 'namespace',
            relevance: 0,
            end: /[{;=]/,
            illegal: /[^\s:]/,
            contains: [
              TITLE_MODE,
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          },
          {
            beginKeywords: 'record',
            relevance: 0,
            end: /[{;=]/,
            illegal: /[^\s:]/,
            contains: [
              TITLE_MODE,
              GENERIC_MODIFIER,
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          },
          {
            className: 'meta',
            begin: '^\\s*\\[(?=[\\w])',
            excludeBegin: true,
            end: '\\]',
            excludeEnd: true,
            contains: [
              {
                className: 'string',
                begin: /"/,
                end: /"/
              }
            ]
          },
          {
            beginKeywords: 'new return throw await else',
            relevance: 0
          },
          {
            className: 'function',
            begin: '(' + TYPE_IDENT_RE + '\\s+)+' + hljs.IDENT_RE + '\\s*(<[^=]+>\\s*)?\\(',
            returnBegin: true,
            end: /\s*[{;=]/,
            excludeEnd: true,
            keywords: KEYWORDS,
            contains: [
              {
                beginKeywords: FUNCTION_MODIFIERS.join(" "),
                relevance: 0
              },
              {
                begin: hljs.IDENT_RE + '\\s*(<[^=]+>\\s*)?\\(',
                returnBegin: true,
                contains: [
                  hljs.TITLE_MODE,
                  GENERIC_MODIFIER
                ],
                relevance: 0
              },
              { match: /\(\)/ },
              {
                className: 'params',
                begin: /\(/,
                end: /\)/,
                excludeBegin: true,
                excludeEnd: true,
                keywords: KEYWORDS,
                relevance: 0,
                contains: [
                  STRING,
                  NUMBERS,
                  hljs.C_BLOCK_COMMENT_MODE
                ]
              },
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          },
          AT_IDENTIFIER
        ]
      };
    }

    function dart(hljs) {
      const SUBST = {
        className: 'subst',
        variants: [ { begin: '\\$[A-Za-z0-9_]+' } ]
      };
      const BRACED_SUBST = {
        className: 'subst',
        variants: [
          {
            begin: /\$\{/,
            end: /\}/
          }
        ],
        keywords: 'true false null this is new super'
      };
      const STRING = {
        className: 'string',
        variants: [
          {
            begin: 'r\'\'\'',
            end: '\'\'\''
          },
          {
            begin: 'r"""',
            end: '"""'
          },
          {
            begin: 'r\'',
            end: '\'',
            illegal: '\\n'
          },
          {
            begin: 'r"',
            end: '"',
            illegal: '\\n'
          },
          {
            begin: '\'\'\'',
            end: '\'\'\'',
            contains: [
              hljs.BACKSLASH_ESCAPE,
              SUBST,
              BRACED_SUBST
            ]
          },
          {
            begin: '"""',
            end: '"""',
            contains: [
              hljs.BACKSLASH_ESCAPE,
              SUBST,
              BRACED_SUBST
            ]
          },
          {
            begin: '\'',
            end: '\'',
            illegal: '\\n',
            contains: [
              hljs.BACKSLASH_ESCAPE,
              SUBST,
              BRACED_SUBST
            ]
          },
          {
            begin: '"',
            end: '"',
            illegal: '\\n',
            contains: [
              hljs.BACKSLASH_ESCAPE,
              SUBST,
              BRACED_SUBST
            ]
          }
        ]
      };
      BRACED_SUBST.contains = [
        hljs.C_NUMBER_MODE,
        STRING
      ];
      const BUILT_IN_TYPES = [
        'Comparable',
        'DateTime',
        'Duration',
        'Function',
        'Iterable',
        'Iterator',
        'List',
        'Map',
        'Match',
        'Object',
        'Pattern',
        'RegExp',
        'Set',
        'Stopwatch',
        'String',
        'StringBuffer',
        'StringSink',
        'Symbol',
        'Type',
        'Uri',
        'bool',
        'double',
        'int',
        'num',
        'Element',
        'ElementList'
      ];
      const NULLABLE_BUILT_IN_TYPES = BUILT_IN_TYPES.map((e) => `${e}?`);
      const BASIC_KEYWORDS = [
        "abstract",
        "as",
        "assert",
        "async",
        "await",
        "break",
        "case",
        "catch",
        "class",
        "const",
        "continue",
        "covariant",
        "default",
        "deferred",
        "do",
        "dynamic",
        "else",
        "enum",
        "export",
        "extends",
        "extension",
        "external",
        "factory",
        "false",
        "final",
        "finally",
        "for",
        "Function",
        "get",
        "hide",
        "if",
        "implements",
        "import",
        "in",
        "inferface",
        "is",
        "late",
        "library",
        "mixin",
        "new",
        "null",
        "on",
        "operator",
        "part",
        "required",
        "rethrow",
        "return",
        "set",
        "show",
        "static",
        "super",
        "switch",
        "sync",
        "this",
        "throw",
        "true",
        "try",
        "typedef",
        "var",
        "void",
        "while",
        "with",
        "yield"
      ];
      const KEYWORDS = {
        keyword: BASIC_KEYWORDS,
        built_in:
          BUILT_IN_TYPES
            .concat(NULLABLE_BUILT_IN_TYPES)
            .concat([
              'Never',
              'Null',
              'dynamic',
              'print',
              'document',
              'querySelector',
              'querySelectorAll',
              'window'
            ]),
        $pattern: /[A-Za-z][A-Za-z0-9_]*\??/
      };
      return {
        name: 'Dart',
        keywords: KEYWORDS,
        contains: [
          STRING,
          hljs.COMMENT(
            /\/\*\*(?!\/)/,
            /\*\//,
            {
              subLanguage: 'markdown',
              relevance: 0
            }
          ),
          hljs.COMMENT(
            /\/{3,} ?/,
            /$/, { contains: [
              {
                subLanguage: 'markdown',
                begin: '.',
                end: '$',
                relevance: 0
              }
            ] }
          ),
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          {
            className: 'class',
            beginKeywords: 'class interface',
            end: /\{/,
            excludeEnd: true,
            contains: [
              { beginKeywords: 'extends implements' },
              hljs.UNDERSCORE_TITLE_MODE
            ]
          },
          hljs.C_NUMBER_MODE,
          {
            className: 'meta',
            begin: '@[A-Za-z]+'
          },
          { begin: '=>'
          }
        ]
      };
    }

    function go(hljs) {
      const LITERALS = [
        "true",
        "false",
        "iota",
        "nil"
      ];
      const BUILT_INS = [
        "append",
        "cap",
        "close",
        "complex",
        "copy",
        "imag",
        "len",
        "make",
        "new",
        "panic",
        "print",
        "println",
        "real",
        "recover",
        "delete"
      ];
      const TYPES = [
        "bool",
        "byte",
        "complex64",
        "complex128",
        "error",
        "float32",
        "float64",
        "int8",
        "int16",
        "int32",
        "int64",
        "string",
        "uint8",
        "uint16",
        "uint32",
        "uint64",
        "int",
        "uint",
        "uintptr",
        "rune"
      ];
      const KWS = [
        "break",
        "case",
        "chan",
        "const",
        "continue",
        "default",
        "defer",
        "else",
        "fallthrough",
        "for",
        "func",
        "go",
        "goto",
        "if",
        "import",
        "interface",
        "map",
        "package",
        "range",
        "return",
        "select",
        "struct",
        "switch",
        "type",
        "var",
      ];
      const KEYWORDS = {
        keyword: KWS,
        type: TYPES,
        literal: LITERALS,
        built_in: BUILT_INS
      };
      return {
        name: 'Go',
        aliases: [ 'golang' ],
        keywords: KEYWORDS,
        illegal: '</',
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          {
            className: 'string',
            variants: [
              hljs.QUOTE_STRING_MODE,
              hljs.APOS_STRING_MODE,
              {
                begin: '`',
                end: '`'
              }
            ]
          },
          {
            className: 'number',
            variants: [
              {
                begin: hljs.C_NUMBER_RE + '[i]',
                relevance: 1
              },
              hljs.C_NUMBER_MODE
            ]
          },
          { begin: /:=/
          },
          {
            className: 'function',
            beginKeywords: 'func',
            end: '\\s*(\\{|$)',
            excludeEnd: true,
            contains: [
              hljs.TITLE_MODE,
              {
                className: 'params',
                begin: /\(/,
                end: /\)/,
                endsParent: true,
                keywords: KEYWORDS,
                illegal: /["']/
              }
            ]
          }
        ]
      };
    }

    function variants(variants, obj = {}) {
      obj.variants = variants;
      return obj;
    }
    function groovy(hljs) {
      const regex = hljs.regex;
      const IDENT_RE = '[A-Za-z0-9_$]+';
      const COMMENT = variants([
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.COMMENT(
          '/\\*\\*',
          '\\*/',
          {
            relevance: 0,
            contains: [
              {
                begin: /\w+@/,
                relevance: 0
              },
              {
                className: 'doctag',
                begin: '@[A-Za-z]+'
              }
            ]
          }
        )
      ]);
      const REGEXP = {
        className: 'regexp',
        begin: /~?\/[^\/\n]+\//,
        contains: [ hljs.BACKSLASH_ESCAPE ]
      };
      const NUMBER = variants([
        hljs.BINARY_NUMBER_MODE,
        hljs.C_NUMBER_MODE
      ]);
      const STRING = variants([
        {
          begin: /"""/,
          end: /"""/
        },
        {
          begin: /'''/,
          end: /'''/
        },
        {
          begin: "\\$/",
          end: "/\\$",
          relevance: 10
        },
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE
      ],
      { className: "string" }
      );
      const CLASS_DEFINITION = {
        match: [
          /(class|interface|trait|enum|extends|implements)/,
          /\s+/,
          hljs.UNDERSCORE_IDENT_RE
        ],
        scope: {
          1: "keyword",
          3: "title.class",
        }
      };
      const TYPES = [
        "byte",
        "short",
        "char",
        "int",
        "long",
        "boolean",
        "float",
        "double",
        "void"
      ];
      const KEYWORDS = [
        "def",
        "as",
        "in",
        "assert",
        "trait",
        "abstract",
        "static",
        "volatile",
        "transient",
        "public",
        "private",
        "protected",
        "synchronized",
        "final",
        "class",
        "interface",
        "enum",
        "if",
        "else",
        "for",
        "while",
        "switch",
        "case",
        "break",
        "default",
        "continue",
        "throw",
        "throws",
        "try",
        "catch",
        "finally",
        "implements",
        "extends",
        "new",
        "import",
        "package",
        "return",
        "instanceof"
      ];
      return {
        name: 'Groovy',
        keywords: {
          "variable.language": 'this super',
          literal: 'true false null',
          type: TYPES,
          keyword: KEYWORDS
        },
        contains: [
          hljs.SHEBANG({
            binary: "groovy",
            relevance: 10
          }),
          COMMENT,
          STRING,
          REGEXP,
          NUMBER,
          CLASS_DEFINITION,
          {
            className: 'meta',
            begin: '@[A-Za-z]+',
            relevance: 0
          },
          {
            className: 'attr',
            begin: IDENT_RE + '[ \t]*:',
            relevance: 0
          },
          {
            begin: /\?/,
            end: /:/,
            relevance: 0,
            contains: [
              COMMENT,
              STRING,
              REGEXP,
              NUMBER,
              'self'
            ]
          },
          {
            className: 'symbol',
            begin: '^[ \t]*' + regex.lookahead(IDENT_RE + ':'),
            excludeBegin: true,
            end: IDENT_RE + ':',
            relevance: 0
          }
        ],
        illegal: /#|<\//
      };
    }

    function haskell(hljs) {
      const COMMENT = { variants: [
        hljs.COMMENT('--', '$'),
        hljs.COMMENT(
          /\{-/,
          /-\}/,
          { contains: [ 'self' ] }
        )
      ] };
      const PRAGMA = {
        className: 'meta',
        begin: /\{-#/,
        end: /#-\}/
      };
      const PREPROCESSOR = {
        className: 'meta',
        begin: '^#',
        end: '$'
      };
      const CONSTRUCTOR = {
        className: 'type',
        begin: '\\b[A-Z][\\w\']*',
        relevance: 0
      };
      const LIST = {
        begin: '\\(',
        end: '\\)',
        illegal: '"',
        contains: [
          PRAGMA,
          PREPROCESSOR,
          {
            className: 'type',
            begin: '\\b[A-Z][\\w]*(\\((\\.\\.|,|\\w+)\\))?'
          },
          hljs.inherit(hljs.TITLE_MODE, { begin: '[_a-z][\\w\']*' }),
          COMMENT
        ]
      };
      const RECORD = {
        begin: /\{/,
        end: /\}/,
        contains: LIST.contains
      };
      const decimalDigits = '([0-9]_*)+';
      const hexDigits = '([0-9a-fA-F]_*)+';
      const binaryDigits = '([01]_*)+';
      const octalDigits = '([0-7]_*)+';
      const NUMBER = {
        className: 'number',
        relevance: 0,
        variants: [
          { match: `\\b(${decimalDigits})(\\.(${decimalDigits}))?` + `([eE][+-]?(${decimalDigits}))?\\b` },
          { match: `\\b0[xX]_*(${hexDigits})(\\.(${hexDigits}))?` + `([pP][+-]?(${decimalDigits}))?\\b` },
          { match: `\\b0[oO](${octalDigits})\\b` },
          { match: `\\b0[bB](${binaryDigits})\\b` }
        ]
      };
      return {
        name: 'Haskell',
        aliases: [ 'hs' ],
        keywords:
          'let in if then else case of where do module import hiding '
          + 'qualified type data newtype deriving class instance as default '
          + 'infix infixl infixr foreign export ccall stdcall cplusplus '
          + 'jvm dotnet safe unsafe family forall mdo proc rec',
        contains: [
          {
            beginKeywords: 'module',
            end: 'where',
            keywords: 'module where',
            contains: [
              LIST,
              COMMENT
            ],
            illegal: '\\W\\.|;'
          },
          {
            begin: '\\bimport\\b',
            end: '$',
            keywords: 'import qualified as hiding',
            contains: [
              LIST,
              COMMENT
            ],
            illegal: '\\W\\.|;'
          },
          {
            className: 'class',
            begin: '^(\\s*)?(class|instance)\\b',
            end: 'where',
            keywords: 'class family instance where',
            contains: [
              CONSTRUCTOR,
              LIST,
              COMMENT
            ]
          },
          {
            className: 'class',
            begin: '\\b(data|(new)?type)\\b',
            end: '$',
            keywords: 'data family type newtype deriving',
            contains: [
              PRAGMA,
              CONSTRUCTOR,
              LIST,
              RECORD,
              COMMENT
            ]
          },
          {
            beginKeywords: 'default',
            end: '$',
            contains: [
              CONSTRUCTOR,
              LIST,
              COMMENT
            ]
          },
          {
            beginKeywords: 'infix infixl infixr',
            end: '$',
            contains: [
              hljs.C_NUMBER_MODE,
              COMMENT
            ]
          },
          {
            begin: '\\bforeign\\b',
            end: '$',
            keywords: 'foreign import export ccall stdcall cplusplus jvm '
                      + 'dotnet safe unsafe',
            contains: [
              CONSTRUCTOR,
              hljs.QUOTE_STRING_MODE,
              COMMENT
            ]
          },
          {
            className: 'meta',
            begin: '#!\\/usr\\/bin\\/env\ runhaskell',
            end: '$'
          },
          PRAGMA,
          PREPROCESSOR,
          hljs.QUOTE_STRING_MODE,
          NUMBER,
          CONSTRUCTOR,
          hljs.inherit(hljs.TITLE_MODE, { begin: '^[_a-z][\\w\']*' }),
          COMMENT,
          {
            begin: '->|<-' }
        ]
      };
    }

    var decimalDigits$1 = '[0-9](_*[0-9])*';
    var frac$1 = `\\.(${decimalDigits$1})`;
    var hexDigits$1 = '[0-9a-fA-F](_*[0-9a-fA-F])*';
    var NUMERIC$1 = {
      className: 'number',
      variants: [
        { begin: `(\\b(${decimalDigits$1})((${frac$1})|\\.)?|(${frac$1}))` +
          `[eE][+-]?(${decimalDigits$1})[fFdD]?\\b` },
        { begin: `\\b(${decimalDigits$1})((${frac$1})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
        { begin: `(${frac$1})[fFdD]?\\b` },
        { begin: `\\b(${decimalDigits$1})[fFdD]\\b` },
        { begin: `\\b0[xX]((${hexDigits$1})\\.?|(${hexDigits$1})?\\.(${hexDigits$1}))` +
          `[pP][+-]?(${decimalDigits$1})[fFdD]?\\b` },
        { begin: '\\b(0|[1-9](_*[0-9])*)[lL]?\\b' },
        { begin: `\\b0[xX](${hexDigits$1})[lL]?\\b` },
        { begin: '\\b0(_*[0-7])*[lL]?\\b' },
        { begin: '\\b0[bB][01](_*[01])*[lL]?\\b' },
      ],
      relevance: 0
    };
    function recurRegex(re, substitution, depth) {
      if (depth === -1) return "";
      return re.replace(substitution, _ => {
        return recurRegex(re, substitution, depth - 1);
      });
    }
    function java(hljs) {
      const regex = hljs.regex;
      const JAVA_IDENT_RE = '[\u00C0-\u02B8a-zA-Z_$][\u00C0-\u02B8a-zA-Z_$0-9]*';
      const GENERIC_IDENT_RE = JAVA_IDENT_RE
        + recurRegex('(?:<' + JAVA_IDENT_RE + '~~~(?:\\s*,\\s*' + JAVA_IDENT_RE + '~~~)*>)?', /~~~/g, 2);
      const MAIN_KEYWORDS = [
        'synchronized',
        'abstract',
        'private',
        'var',
        'static',
        'if',
        'const ',
        'for',
        'while',
        'strictfp',
        'finally',
        'protected',
        'import',
        'native',
        'final',
        'void',
        'enum',
        'else',
        'break',
        'transient',
        'catch',
        'instanceof',
        'volatile',
        'case',
        'assert',
        'package',
        'default',
        'public',
        'try',
        'switch',
        'continue',
        'throws',
        'protected',
        'public',
        'private',
        'module',
        'requires',
        'exports',
        'do',
        'sealed'
      ];
      const BUILT_INS = [
        'super',
        'this'
      ];
      const LITERALS = [
        'false',
        'true',
        'null'
      ];
      const TYPES = [
        'char',
        'boolean',
        'long',
        'float',
        'int',
        'byte',
        'short',
        'double'
      ];
      const KEYWORDS = {
        keyword: MAIN_KEYWORDS,
        literal: LITERALS,
        type: TYPES,
        built_in: BUILT_INS
      };
      const ANNOTATION = {
        className: 'meta',
        begin: '@' + JAVA_IDENT_RE,
        contains: [
          {
            begin: /\(/,
            end: /\)/,
            contains: [ "self" ]
          }
        ]
      };
      const PARAMS = {
        className: 'params',
        begin: /\(/,
        end: /\)/,
        keywords: KEYWORDS,
        relevance: 0,
        contains: [ hljs.C_BLOCK_COMMENT_MODE ],
        endsParent: true
      };
      return {
        name: 'Java',
        aliases: [ 'jsp' ],
        keywords: KEYWORDS,
        illegal: /<\/|#/,
        contains: [
          hljs.COMMENT(
            '/\\*\\*',
            '\\*/',
            {
              relevance: 0,
              contains: [
                {
                  begin: /\w+@/,
                  relevance: 0
                },
                {
                  className: 'doctag',
                  begin: '@[A-Za-z]+'
                }
              ]
            }
          ),
          {
            begin: /import java\.[a-z]+\./,
            keywords: "import",
            relevance: 2
          },
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          {
            begin: /"""/,
            end: /"""/,
            className: "string",
            contains: [ hljs.BACKSLASH_ESCAPE ]
          },
          hljs.APOS_STRING_MODE,
          hljs.QUOTE_STRING_MODE,
          {
            match: [
              /\b(?:class|interface|enum|extends|implements|new)/,
              /\s+/,
              JAVA_IDENT_RE
            ],
            className: {
              1: "keyword",
              3: "title.class"
            }
          },
          {
            match: /non-sealed/,
            scope: "keyword"
          },
          {
            begin: [
              regex.concat(/(?!else)/, JAVA_IDENT_RE),
              /\s+/,
              JAVA_IDENT_RE,
              /\s+/,
              /=(?!=)/
            ],
            className: {
              1: "type",
              3: "variable",
              5: "operator"
            }
          },
          {
            begin: [
              /record/,
              /\s+/,
              JAVA_IDENT_RE
            ],
            className: {
              1: "keyword",
              3: "title.class"
            },
            contains: [
              PARAMS,
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          },
          {
            beginKeywords: 'new throw return else',
            relevance: 0
          },
          {
            begin: [
              '(?:' + GENERIC_IDENT_RE + '\\s+)',
              hljs.UNDERSCORE_IDENT_RE,
              /\s*(?=\()/
            ],
            className: { 2: "title.function" },
            keywords: KEYWORDS,
            contains: [
              {
                className: 'params',
                begin: /\(/,
                end: /\)/,
                keywords: KEYWORDS,
                relevance: 0,
                contains: [
                  ANNOTATION,
                  hljs.APOS_STRING_MODE,
                  hljs.QUOTE_STRING_MODE,
                  NUMERIC$1,
                  hljs.C_BLOCK_COMMENT_MODE
                ]
              },
              hljs.C_LINE_COMMENT_MODE,
              hljs.C_BLOCK_COMMENT_MODE
            ]
          },
          NUMERIC$1,
          ANNOTATION
        ]
      };
    }

    const IDENT_RE$1 = '[A-Za-z$_][0-9A-Za-z$_]*';
    const KEYWORDS$1 = [
      "as",
      "in",
      "of",
      "if",
      "for",
      "while",
      "finally",
      "var",
      "new",
      "function",
      "do",
      "return",
      "void",
      "else",
      "break",
      "catch",
      "instanceof",
      "with",
      "throw",
      "case",
      "default",
      "try",
      "switch",
      "continue",
      "typeof",
      "delete",
      "let",
      "yield",
      "const",
      "class",
      "debugger",
      "async",
      "await",
      "static",
      "import",
      "from",
      "export",
      "extends"
    ];
    const LITERALS$1 = [
      "true",
      "false",
      "null",
      "undefined",
      "NaN",
      "Infinity"
    ];
    const TYPES$1 = [
      "Object",
      "Function",
      "Boolean",
      "Symbol",
      "Math",
      "Date",
      "Number",
      "BigInt",
      "String",
      "RegExp",
      "Array",
      "Float32Array",
      "Float64Array",
      "Int8Array",
      "Uint8Array",
      "Uint8ClampedArray",
      "Int16Array",
      "Int32Array",
      "Uint16Array",
      "Uint32Array",
      "BigInt64Array",
      "BigUint64Array",
      "Set",
      "Map",
      "WeakSet",
      "WeakMap",
      "ArrayBuffer",
      "SharedArrayBuffer",
      "Atomics",
      "DataView",
      "JSON",
      "Promise",
      "Generator",
      "GeneratorFunction",
      "AsyncFunction",
      "Reflect",
      "Proxy",
      "Intl",
      "WebAssembly"
    ];
    const ERROR_TYPES$1 = [
      "Error",
      "EvalError",
      "InternalError",
      "RangeError",
      "ReferenceError",
      "SyntaxError",
      "TypeError",
      "URIError"
    ];
    const BUILT_IN_GLOBALS$1 = [
      "setInterval",
      "setTimeout",
      "clearInterval",
      "clearTimeout",
      "require",
      "exports",
      "eval",
      "isFinite",
      "isNaN",
      "parseFloat",
      "parseInt",
      "decodeURI",
      "decodeURIComponent",
      "encodeURI",
      "encodeURIComponent",
      "escape",
      "unescape"
    ];
    const BUILT_IN_VARIABLES$1 = [
      "arguments",
      "this",
      "super",
      "console",
      "window",
      "document",
      "localStorage",
      "module",
      "global"
    ];
    const BUILT_INS$1 = [].concat(
      BUILT_IN_GLOBALS$1,
      TYPES$1,
      ERROR_TYPES$1
    );
    function javascript$1(hljs) {
      const regex = hljs.regex;
      const hasClosingTag = (match, { after }) => {
        const tag = "</" + match[0].slice(1);
        const pos = match.input.indexOf(tag, after);
        return pos !== -1;
      };
      const IDENT_RE$1$1 = IDENT_RE$1;
      const FRAGMENT = {
        begin: '<>',
        end: '</>'
      };
      const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
      const XML_TAG = {
        begin: /<[A-Za-z0-9\\._:-]+/,
        end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
        isTrulyOpeningTag: (match, response) => {
          const afterMatchIndex = match[0].length + match.index;
          const nextChar = match.input[afterMatchIndex];
          if (
            nextChar === "<" ||
            nextChar === ",") {
            response.ignoreMatch();
            return;
          }
          if (nextChar === ">") {
            if (!hasClosingTag(match, { after: afterMatchIndex })) {
              response.ignoreMatch();
            }
          }
          let m;
          const afterMatch = match.input.substring(afterMatchIndex);
          if ((m = afterMatch.match(/^\s+extends\s+/))) {
            if (m.index === 0) {
              response.ignoreMatch();
              return;
            }
          }
        }
      };
      const KEYWORDS$1$1 = {
        $pattern: IDENT_RE$1,
        keyword: KEYWORDS$1,
        literal: LITERALS$1,
        built_in: BUILT_INS$1,
        "variable.language": BUILT_IN_VARIABLES$1
      };
      const decimalDigits = '[0-9](_?[0-9])*';
      const frac = `\\.(${decimalDigits})`;
      const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
      const NUMBER = {
        className: 'number',
        variants: [
          { begin: `(\\b(${decimalInteger})((${frac})|\\.)?|(${frac}))` +
            `[eE][+-]?(${decimalDigits})\\b` },
          { begin: `\\b(${decimalInteger})\\b((${frac})\\b|\\.)?|(${frac})\\b` },
          { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
          { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
          { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
          { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
          { begin: "\\b0[0-7]+n?\\b" },
        ],
        relevance: 0
      };
      const SUBST = {
        className: 'subst',
        begin: '\\$\\{',
        end: '\\}',
        keywords: KEYWORDS$1$1,
        contains: []
      };
      const HTML_TEMPLATE = {
        begin: 'html`',
        end: '',
        starts: {
          end: '`',
          returnEnd: false,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            SUBST
          ],
          subLanguage: 'xml'
        }
      };
      const CSS_TEMPLATE = {
        begin: 'css`',
        end: '',
        starts: {
          end: '`',
          returnEnd: false,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            SUBST
          ],
          subLanguage: 'css'
        }
      };
      const TEMPLATE_STRING = {
        className: 'string',
        begin: '`',
        end: '`',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ]
      };
      const JSDOC_COMMENT = hljs.COMMENT(
        /\/\*\*(?!\/)/,
        '\\*/',
        {
          relevance: 0,
          contains: [
            {
              begin: '(?=@[A-Za-z]+)',
              relevance: 0,
              contains: [
                {
                  className: 'doctag',
                  begin: '@[A-Za-z]+'
                },
                {
                  className: 'type',
                  begin: '\\{',
                  end: '\\}',
                  excludeEnd: true,
                  excludeBegin: true,
                  relevance: 0
                },
                {
                  className: 'variable',
                  begin: IDENT_RE$1$1 + '(?=\\s*(-)|$)',
                  endsParent: true,
                  relevance: 0
                },
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      );
      const COMMENT = {
        className: "comment",
        variants: [
          JSDOC_COMMENT,
          hljs.C_BLOCK_COMMENT_MODE,
          hljs.C_LINE_COMMENT_MODE
        ]
      };
      const SUBST_INTERNALS = [
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        TEMPLATE_STRING,
        NUMBER,
      ];
      SUBST.contains = SUBST_INTERNALS
        .concat({
          begin: /\{/,
          end: /\}/,
          keywords: KEYWORDS$1$1,
          contains: [
            "self"
          ].concat(SUBST_INTERNALS)
        });
      const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
      const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: KEYWORDS$1$1,
          contains: ["self"].concat(SUBST_AND_COMMENTS)
        }
      ]);
      const PARAMS = {
        className: 'params',
        begin: /\(/,
        end: /\)/,
        excludeBegin: true,
        excludeEnd: true,
        keywords: KEYWORDS$1$1,
        contains: PARAMS_CONTAINS
      };
      const CLASS_OR_EXTENDS = {
        variants: [
          {
            match: [
              /class/,
              /\s+/,
              IDENT_RE$1$1,
              /\s+/,
              /extends/,
              /\s+/,
              regex.concat(IDENT_RE$1$1, "(", regex.concat(/\./, IDENT_RE$1$1), ")*")
            ],
            scope: {
              1: "keyword",
              3: "title.class",
              5: "keyword",
              7: "title.class.inherited"
            }
          },
          {
            match: [
              /class/,
              /\s+/,
              IDENT_RE$1$1
            ],
            scope: {
              1: "keyword",
              3: "title.class"
            }
          },
        ]
      };
      const CLASS_REFERENCE = {
        relevance: 0,
        match:
        regex.either(
          /\bJSON/,
          /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
          /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
          /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/,
        ),
        className: "title.class",
        keywords: {
          _: [
            ...TYPES$1,
            ...ERROR_TYPES$1
          ]
        }
      };
      const USE_STRICT = {
        label: "use_strict",
        className: 'meta',
        relevance: 10,
        begin: /^\s*['"]use (strict|asm)['"]/
      };
      const FUNCTION_DEFINITION = {
        variants: [
          {
            match: [
              /function/,
              /\s+/,
              IDENT_RE$1$1,
              /(?=\s*\()/
            ]
          },
          {
            match: [
              /function/,
              /\s*(?=\()/
            ]
          }
        ],
        className: {
          1: "keyword",
          3: "title.function"
        },
        label: "func.def",
        contains: [ PARAMS ],
        illegal: /%/
      };
      const UPPER_CASE_CONSTANT = {
        relevance: 0,
        match: /\b[A-Z][A-Z_0-9]+\b/,
        className: "variable.constant"
      };
      function noneOf(list) {
        return regex.concat("(?!", list.join("|"), ")");
      }
      const FUNCTION_CALL = {
        match: regex.concat(
          /\b/,
          noneOf([
            ...BUILT_IN_GLOBALS$1,
            "super"
          ]),
          IDENT_RE$1$1, regex.lookahead(/\(/)),
        className: "title.function",
        relevance: 0
      };
      const PROPERTY_ACCESS = {
        begin: regex.concat(/\./, regex.lookahead(
          regex.concat(IDENT_RE$1$1, /(?![0-9A-Za-z$_(])/)
        )),
        end: IDENT_RE$1$1,
        excludeBegin: true,
        keywords: "prototype",
        className: "property",
        relevance: 0
      };
      const GETTER_OR_SETTER = {
        match: [
          /get|set/,
          /\s+/,
          IDENT_RE$1$1,
          /(?=\()/
        ],
        className: {
          1: "keyword",
          3: "title.function"
        },
        contains: [
          {
            begin: /\(\)/
          },
          PARAMS
        ]
      };
      const FUNC_LEAD_IN_RE = '(\\(' +
        '[^()]*(\\(' +
        '[^()]*(\\(' +
        '[^()]*' +
        '\\)[^()]*)*' +
        '\\)[^()]*)*' +
        '\\)|' + hljs.UNDERSCORE_IDENT_RE + ')\\s*=>';
      const FUNCTION_VARIABLE = {
        match: [
          /const|var|let/, /\s+/,
          IDENT_RE$1$1, /\s*/,
          /=\s*/,
          /(async\s*)?/,
          regex.lookahead(FUNC_LEAD_IN_RE)
        ],
        keywords: "async",
        className: {
          1: "keyword",
          3: "title.function"
        },
        contains: [
          PARAMS
        ]
      };
      return {
        name: 'Javascript',
        aliases: ['js', 'jsx', 'mjs', 'cjs'],
        keywords: KEYWORDS$1$1,
        exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
        illegal: /#(?![$_A-z])/,
        contains: [
          hljs.SHEBANG({
            label: "shebang",
            binary: "node",
            relevance: 5
          }),
          USE_STRICT,
          hljs.APOS_STRING_MODE,
          hljs.QUOTE_STRING_MODE,
          HTML_TEMPLATE,
          CSS_TEMPLATE,
          TEMPLATE_STRING,
          COMMENT,
          NUMBER,
          CLASS_REFERENCE,
          {
            className: 'attr',
            begin: IDENT_RE$1$1 + regex.lookahead(':'),
            relevance: 0
          },
          FUNCTION_VARIABLE,
          {
            begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
            keywords: 'return throw case',
            relevance: 0,
            contains: [
              COMMENT,
              hljs.REGEXP_MODE,
              {
                className: 'function',
                begin: FUNC_LEAD_IN_RE,
                returnBegin: true,
                end: '\\s*=>',
                contains: [
                  {
                    className: 'params',
                    variants: [
                      {
                        begin: hljs.UNDERSCORE_IDENT_RE,
                        relevance: 0
                      },
                      {
                        className: null,
                        begin: /\(\s*\)/,
                        skip: true
                      },
                      {
                        begin: /\(/,
                        end: /\)/,
                        excludeBegin: true,
                        excludeEnd: true,
                        keywords: KEYWORDS$1$1,
                        contains: PARAMS_CONTAINS
                      }
                    ]
                  }
                ]
              },
              {
                begin: /,/,
                relevance: 0
              },
              {
                match: /\s+/,
                relevance: 0
              },
              {
                variants: [
                  { begin: FRAGMENT.begin, end: FRAGMENT.end },
                  { match: XML_SELF_CLOSING },
                  {
                    begin: XML_TAG.begin,
                    'on:begin': XML_TAG.isTrulyOpeningTag,
                    end: XML_TAG.end
                  }
                ],
                subLanguage: 'xml',
                contains: [
                  {
                    begin: XML_TAG.begin,
                    end: XML_TAG.end,
                    skip: true,
                    contains: ['self']
                  }
                ]
              }
            ],
          },
          FUNCTION_DEFINITION,
          {
            beginKeywords: "while if switch catch for"
          },
          {
            begin: '\\b(?!function)' + hljs.UNDERSCORE_IDENT_RE +
              '\\(' +
              '[^()]*(\\(' +
                '[^()]*(\\(' +
                  '[^()]*' +
                '\\)[^()]*)*' +
              '\\)[^()]*)*' +
              '\\)\\s*\\{',
            returnBegin:true,
            label: "func.def",
            contains: [
              PARAMS,
              hljs.inherit(hljs.TITLE_MODE, { begin: IDENT_RE$1$1, className: "title.function" })
            ]
          },
          {
            match: /\.\.\./,
            relevance: 0
          },
          PROPERTY_ACCESS,
          {
            match: '\\$' + IDENT_RE$1$1,
            relevance: 0
          },
          {
            match: [ /\bconstructor(?=\s*\()/ ],
            className: { 1: "title.function" },
            contains: [ PARAMS ]
          },
          FUNCTION_CALL,
          UPPER_CASE_CONSTANT,
          CLASS_OR_EXTENDS,
          GETTER_OR_SETTER,
          {
            match: /\$[(.]/
          }
        ]
      };
    }

    function julia(hljs) {
      const VARIABLE_NAME_RE = '[A-Za-z_\\u00A1-\\uFFFF][A-Za-z_0-9\\u00A1-\\uFFFF]*';
      const KEYWORD_LIST = [
        'baremodule',
        'begin',
        'break',
        'catch',
        'ccall',
        'const',
        'continue',
        'do',
        'else',
        'elseif',
        'end',
        'export',
        'false',
        'finally',
        'for',
        'function',
        'global',
        'if',
        'import',
        'in',
        'isa',
        'let',
        'local',
        'macro',
        'module',
        'quote',
        'return',
        'true',
        'try',
        'using',
        'where',
        'while',
      ];
      const LITERAL_LIST = [
        'ARGS',
        'C_NULL',
        'DEPOT_PATH',
        'ENDIAN_BOM',
        'ENV',
        'Inf',
        'Inf16',
        'Inf32',
        'Inf64',
        'InsertionSort',
        'LOAD_PATH',
        'MergeSort',
        'NaN',
        'NaN16',
        'NaN32',
        'NaN64',
        'PROGRAM_FILE',
        'QuickSort',
        'RoundDown',
        'RoundFromZero',
        'RoundNearest',
        'RoundNearestTiesAway',
        'RoundNearestTiesUp',
        'RoundToZero',
        'RoundUp',
        'VERSION|0',
        'devnull',
        'false',
        'im',
        'missing',
        'nothing',
        'pi',
        'stderr',
        'stdin',
        'stdout',
        'true',
        'undef',
        'π',
        'ℯ',
      ];
      const BUILT_IN_LIST = [
        'AbstractArray',
        'AbstractChannel',
        'AbstractChar',
        'AbstractDict',
        'AbstractDisplay',
        'AbstractFloat',
        'AbstractIrrational',
        'AbstractMatrix',
        'AbstractRange',
        'AbstractSet',
        'AbstractString',
        'AbstractUnitRange',
        'AbstractVecOrMat',
        'AbstractVector',
        'Any',
        'ArgumentError',
        'Array',
        'AssertionError',
        'BigFloat',
        'BigInt',
        'BitArray',
        'BitMatrix',
        'BitSet',
        'BitVector',
        'Bool',
        'BoundsError',
        'CapturedException',
        'CartesianIndex',
        'CartesianIndices',
        'Cchar',
        'Cdouble',
        'Cfloat',
        'Channel',
        'Char',
        'Cint',
        'Cintmax_t',
        'Clong',
        'Clonglong',
        'Cmd',
        'Colon',
        'Complex',
        'ComplexF16',
        'ComplexF32',
        'ComplexF64',
        'CompositeException',
        'Condition',
        'Cptrdiff_t',
        'Cshort',
        'Csize_t',
        'Cssize_t',
        'Cstring',
        'Cuchar',
        'Cuint',
        'Cuintmax_t',
        'Culong',
        'Culonglong',
        'Cushort',
        'Cvoid',
        'Cwchar_t',
        'Cwstring',
        'DataType',
        'DenseArray',
        'DenseMatrix',
        'DenseVecOrMat',
        'DenseVector',
        'Dict',
        'DimensionMismatch',
        'Dims',
        'DivideError',
        'DomainError',
        'EOFError',
        'Enum',
        'ErrorException',
        'Exception',
        'ExponentialBackOff',
        'Expr',
        'Float16',
        'Float32',
        'Float64',
        'Function',
        'GlobalRef',
        'HTML',
        'IO',
        'IOBuffer',
        'IOContext',
        'IOStream',
        'IdDict',
        'IndexCartesian',
        'IndexLinear',
        'IndexStyle',
        'InexactError',
        'InitError',
        'Int',
        'Int128',
        'Int16',
        'Int32',
        'Int64',
        'Int8',
        'Integer',
        'InterruptException',
        'InvalidStateException',
        'Irrational',
        'KeyError',
        'LinRange',
        'LineNumberNode',
        'LinearIndices',
        'LoadError',
        'MIME',
        'Matrix',
        'Method',
        'MethodError',
        'Missing',
        'MissingException',
        'Module',
        'NTuple',
        'NamedTuple',
        'Nothing',
        'Number',
        'OrdinalRange',
        'OutOfMemoryError',
        'OverflowError',
        'Pair',
        'PartialQuickSort',
        'PermutedDimsArray',
        'Pipe',
        'ProcessFailedException',
        'Ptr',
        'QuoteNode',
        'Rational',
        'RawFD',
        'ReadOnlyMemoryError',
        'Real',
        'ReentrantLock',
        'Ref',
        'Regex',
        'RegexMatch',
        'RoundingMode',
        'SegmentationFault',
        'Set',
        'Signed',
        'Some',
        'StackOverflowError',
        'StepRange',
        'StepRangeLen',
        'StridedArray',
        'StridedMatrix',
        'StridedVecOrMat',
        'StridedVector',
        'String',
        'StringIndexError',
        'SubArray',
        'SubString',
        'SubstitutionString',
        'Symbol',
        'SystemError',
        'Task',
        'TaskFailedException',
        'Text',
        'TextDisplay',
        'Timer',
        'Tuple',
        'Type',
        'TypeError',
        'TypeVar',
        'UInt',
        'UInt128',
        'UInt16',
        'UInt32',
        'UInt64',
        'UInt8',
        'UndefInitializer',
        'UndefKeywordError',
        'UndefRefError',
        'UndefVarError',
        'Union',
        'UnionAll',
        'UnitRange',
        'Unsigned',
        'Val',
        'Vararg',
        'VecElement',
        'VecOrMat',
        'Vector',
        'VersionNumber',
        'WeakKeyDict',
        'WeakRef',
      ];
      const KEYWORDS = {
        $pattern: VARIABLE_NAME_RE,
        keyword: KEYWORD_LIST,
        literal: LITERAL_LIST,
        built_in: BUILT_IN_LIST,
      };
      const DEFAULT = {
        keywords: KEYWORDS,
        illegal: /<\//
      };
      const NUMBER = {
        className: 'number',
        begin: /(\b0x[\d_]*(\.[\d_]*)?|0x\.\d[\d_]*)p[-+]?\d+|\b0[box][a-fA-F0-9][a-fA-F0-9_]*|(\b\d[\d_]*(\.[\d_]*)?|\.\d[\d_]*)([eEfF][-+]?\d+)?/,
        relevance: 0
      };
      const CHAR = {
        className: 'string',
        begin: /'(.|\\[xXuU][a-zA-Z0-9]+)'/
      };
      const INTERPOLATION = {
        className: 'subst',
        begin: /\$\(/,
        end: /\)/,
        keywords: KEYWORDS
      };
      const INTERPOLATED_VARIABLE = {
        className: 'variable',
        begin: '\\$' + VARIABLE_NAME_RE
      };
      const STRING = {
        className: 'string',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          INTERPOLATION,
          INTERPOLATED_VARIABLE
        ],
        variants: [
          {
            begin: /\w*"""/,
            end: /"""\w*/,
            relevance: 10
          },
          {
            begin: /\w*"/,
            end: /"\w*/
          }
        ]
      };
      const COMMAND = {
        className: 'string',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          INTERPOLATION,
          INTERPOLATED_VARIABLE
        ],
        begin: '`',
        end: '`'
      };
      const MACROCALL = {
        className: 'meta',
        begin: '@' + VARIABLE_NAME_RE
      };
      const COMMENT = {
        className: 'comment',
        variants: [
          {
            begin: '#=',
            end: '=#',
            relevance: 10
          },
          {
            begin: '#',
            end: '$'
          }
        ]
      };
      DEFAULT.name = 'Julia';
      DEFAULT.contains = [
        NUMBER,
        CHAR,
        STRING,
        COMMAND,
        MACROCALL,
        COMMENT,
        hljs.HASH_COMMENT_MODE,
        {
          className: 'keyword',
          begin:
            '\\b(((abstract|primitive)\\s+)type|(mutable\\s+)?struct)\\b'
        },
        { begin: /<:/ }
      ];
      INTERPOLATION.contains = DEFAULT.contains;
      return DEFAULT;
    }

    var decimalDigits = '[0-9](_*[0-9])*';
    var frac = `\\.(${decimalDigits})`;
    var hexDigits = '[0-9a-fA-F](_*[0-9a-fA-F])*';
    var NUMERIC = {
      className: 'number',
      variants: [
        { begin: `(\\b(${decimalDigits})((${frac})|\\.)?|(${frac}))` +
          `[eE][+-]?(${decimalDigits})[fFdD]?\\b` },
        { begin: `\\b(${decimalDigits})((${frac})[fFdD]?\\b|\\.([fFdD]\\b)?)` },
        { begin: `(${frac})[fFdD]?\\b` },
        { begin: `\\b(${decimalDigits})[fFdD]\\b` },
        { begin: `\\b0[xX]((${hexDigits})\\.?|(${hexDigits})?\\.(${hexDigits}))` +
          `[pP][+-]?(${decimalDigits})[fFdD]?\\b` },
        { begin: '\\b(0|[1-9](_*[0-9])*)[lL]?\\b' },
        { begin: `\\b0[xX](${hexDigits})[lL]?\\b` },
        { begin: '\\b0(_*[0-7])*[lL]?\\b' },
        { begin: '\\b0[bB][01](_*[01])*[lL]?\\b' },
      ],
      relevance: 0
    };
    function kotlin(hljs) {
      const KEYWORDS = {
        keyword:
          'abstract as val var vararg get set class object open private protected public noinline '
          + 'crossinline dynamic final enum if else do while for when throw try catch finally '
          + 'import package is in fun override companion reified inline lateinit init '
          + 'interface annotation data sealed internal infix operator out by constructor super '
          + 'tailrec where const inner suspend typealias external expect actual',
        built_in:
          'Byte Short Char Int Long Boolean Float Double Void Unit Nothing',
        literal:
          'true false null'
      };
      const KEYWORDS_WITH_LABEL = {
        className: 'keyword',
        begin: /\b(break|continue|return|this)\b/,
        starts: { contains: [
          {
            className: 'symbol',
            begin: /@\w+/
          }
        ] }
      };
      const LABEL = {
        className: 'symbol',
        begin: hljs.UNDERSCORE_IDENT_RE + '@'
      };
      const SUBST = {
        className: 'subst',
        begin: /\$\{/,
        end: /\}/,
        contains: [ hljs.C_NUMBER_MODE ]
      };
      const VARIABLE = {
        className: 'variable',
        begin: '\\$' + hljs.UNDERSCORE_IDENT_RE
      };
      const STRING = {
        className: 'string',
        variants: [
          {
            begin: '"""',
            end: '"""(?=[^"])',
            contains: [
              VARIABLE,
              SUBST
            ]
          },
          {
            begin: '\'',
            end: '\'',
            illegal: /\n/,
            contains: [ hljs.BACKSLASH_ESCAPE ]
          },
          {
            begin: '"',
            end: '"',
            illegal: /\n/,
            contains: [
              hljs.BACKSLASH_ESCAPE,
              VARIABLE,
              SUBST
            ]
          }
        ]
      };
      SUBST.contains.push(STRING);
      const ANNOTATION_USE_SITE = {
        className: 'meta',
        begin: '@(?:file|property|field|get|set|receiver|param|setparam|delegate)\\s*:(?:\\s*' + hljs.UNDERSCORE_IDENT_RE + ')?'
      };
      const ANNOTATION = {
        className: 'meta',
        begin: '@' + hljs.UNDERSCORE_IDENT_RE,
        contains: [
          {
            begin: /\(/,
            end: /\)/,
            contains: [
              hljs.inherit(STRING, { className: 'string' }),
              "self"
            ]
          }
        ]
      };
      const KOTLIN_NUMBER_MODE = NUMERIC;
      const KOTLIN_NESTED_COMMENT = hljs.COMMENT(
        '/\\*', '\\*/',
        { contains: [ hljs.C_BLOCK_COMMENT_MODE ] }
      );
      const KOTLIN_PAREN_TYPE = { variants: [
        {
          className: 'type',
          begin: hljs.UNDERSCORE_IDENT_RE
        },
        {
          begin: /\(/,
          end: /\)/,
          contains: []
        }
      ] };
      const KOTLIN_PAREN_TYPE2 = KOTLIN_PAREN_TYPE;
      KOTLIN_PAREN_TYPE2.variants[1].contains = [ KOTLIN_PAREN_TYPE ];
      KOTLIN_PAREN_TYPE.variants[1].contains = [ KOTLIN_PAREN_TYPE2 ];
      return {
        name: 'Kotlin',
        aliases: [
          'kt',
          'kts'
        ],
        keywords: KEYWORDS,
        contains: [
          hljs.COMMENT(
            '/\\*\\*',
            '\\*/',
            {
              relevance: 0,
              contains: [
                {
                  className: 'doctag',
                  begin: '@[A-Za-z]+'
                }
              ]
            }
          ),
          hljs.C_LINE_COMMENT_MODE,
          KOTLIN_NESTED_COMMENT,
          KEYWORDS_WITH_LABEL,
          LABEL,
          ANNOTATION_USE_SITE,
          ANNOTATION,
          {
            className: 'function',
            beginKeywords: 'fun',
            end: '[(]|$',
            returnBegin: true,
            excludeEnd: true,
            keywords: KEYWORDS,
            relevance: 5,
            contains: [
              {
                begin: hljs.UNDERSCORE_IDENT_RE + '\\s*\\(',
                returnBegin: true,
                relevance: 0,
                contains: [ hljs.UNDERSCORE_TITLE_MODE ]
              },
              {
                className: 'type',
                begin: /</,
                end: />/,
                keywords: 'reified',
                relevance: 0
              },
              {
                className: 'params',
                begin: /\(/,
                end: /\)/,
                endsParent: true,
                keywords: KEYWORDS,
                relevance: 0,
                contains: [
                  {
                    begin: /:/,
                    end: /[=,\/]/,
                    endsWithParent: true,
                    contains: [
                      KOTLIN_PAREN_TYPE,
                      hljs.C_LINE_COMMENT_MODE,
                      KOTLIN_NESTED_COMMENT
                    ],
                    relevance: 0
                  },
                  hljs.C_LINE_COMMENT_MODE,
                  KOTLIN_NESTED_COMMENT,
                  ANNOTATION_USE_SITE,
                  ANNOTATION,
                  STRING,
                  hljs.C_NUMBER_MODE
                ]
              },
              KOTLIN_NESTED_COMMENT
            ]
          },
          {
            begin: [
              /class|interface|trait/,
              /\s+/,
              hljs.UNDERSCORE_IDENT_RE
            ],
            beginScope: {
              3: "title.class"
            },
            keywords: 'class interface trait',
            end: /[:\{(]|$/,
            excludeEnd: true,
            illegal: 'extends implements',
            contains: [
              { beginKeywords: 'public protected internal private constructor' },
              hljs.UNDERSCORE_TITLE_MODE,
              {
                className: 'type',
                begin: /</,
                end: />/,
                excludeBegin: true,
                excludeEnd: true,
                relevance: 0
              },
              {
                className: 'type',
                begin: /[,:]\s*/,
                end: /[<\(,){\s]|$/,
                excludeBegin: true,
                returnEnd: true
              },
              ANNOTATION_USE_SITE,
              ANNOTATION
            ]
          },
          STRING,
          {
            className: 'meta',
            begin: "^#!/usr/bin/env",
            end: '$',
            illegal: '\n'
          },
          KOTLIN_NUMBER_MODE
        ]
      };
    }

    function lua(hljs) {
      const OPENING_LONG_BRACKET = '\\[=*\\[';
      const CLOSING_LONG_BRACKET = '\\]=*\\]';
      const LONG_BRACKETS = {
        begin: OPENING_LONG_BRACKET,
        end: CLOSING_LONG_BRACKET,
        contains: [ 'self' ]
      };
      const COMMENTS = [
        hljs.COMMENT('--(?!' + OPENING_LONG_BRACKET + ')', '$'),
        hljs.COMMENT(
          '--' + OPENING_LONG_BRACKET,
          CLOSING_LONG_BRACKET,
          {
            contains: [ LONG_BRACKETS ],
            relevance: 10
          }
        )
      ];
      return {
        name: 'Lua',
        keywords: {
          $pattern: hljs.UNDERSCORE_IDENT_RE,
          literal: "true false nil",
          keyword: "and break do else elseif end for goto if in local not or repeat return then until while",
          built_in:
            '_G _ENV _VERSION __index __newindex __mode __call __metatable __tostring __len '
            + '__gc __add __sub __mul __div __mod __pow __concat __unm __eq __lt __le assert '
            + 'collectgarbage dofile error getfenv getmetatable ipairs load loadfile loadstring '
            + 'module next pairs pcall print rawequal rawget rawset require select setfenv '
            + 'setmetatable tonumber tostring type unpack xpcall arg self '
            + 'coroutine resume yield status wrap create running debug getupvalue '
            + 'debug sethook getmetatable gethook setmetatable setlocal traceback setfenv getinfo setupvalue getlocal getregistry getfenv '
            + 'io lines write close flush open output type read stderr stdin input stdout popen tmpfile '
            + 'math log max acos huge ldexp pi cos tanh pow deg tan cosh sinh random randomseed frexp ceil floor rad abs sqrt modf asin min mod fmod log10 atan2 exp sin atan '
            + 'os exit setlocale date getenv difftime remove time clock tmpname rename execute package preload loadlib loaded loaders cpath config path seeall '
            + 'string sub upper len gfind rep find match char dump gmatch reverse byte format gsub lower '
            + 'table setn insert getn foreachi maxn foreach concat sort remove'
        },
        contains: COMMENTS.concat([
          {
            className: 'function',
            beginKeywords: 'function',
            end: '\\)',
            contains: [
              hljs.inherit(hljs.TITLE_MODE, { begin: '([_a-zA-Z]\\w*\\.)*([_a-zA-Z]\\w*:)?[_a-zA-Z]\\w*' }),
              {
                className: 'params',
                begin: '\\(',
                endsWithParent: true,
                contains: COMMENTS
              }
            ].concat(COMMENTS)
          },
          hljs.C_NUMBER_MODE,
          hljs.APOS_STRING_MODE,
          hljs.QUOTE_STRING_MODE,
          {
            className: 'string',
            begin: OPENING_LONG_BRACKET,
            end: CLOSING_LONG_BRACKET,
            contains: [ LONG_BRACKETS ],
            relevance: 5
          }
        ])
      };
    }

    function markdown(hljs) {
      const regex = hljs.regex;
      const INLINE_HTML = {
        begin: /<\/?[A-Za-z_]/,
        end: '>',
        subLanguage: 'xml',
        relevance: 0
      };
      const HORIZONTAL_RULE = {
        begin: '^[-\\*]{3,}',
        end: '$'
      };
      const CODE = {
        className: 'code',
        variants: [
          { begin: '(`{3,})[^`](.|\\n)*?\\1`*[ ]*' },
          { begin: '(~{3,})[^~](.|\\n)*?\\1~*[ ]*' },
          {
            begin: '```',
            end: '```+[ ]*$'
          },
          {
            begin: '~~~',
            end: '~~~+[ ]*$'
          },
          { begin: '`.+?`' },
          {
            begin: '(?=^( {4}|\\t))',
            contains: [
              {
                begin: '^( {4}|\\t)',
                end: '(\\n)$'
              }
            ],
            relevance: 0
          }
        ]
      };
      const LIST = {
        className: 'bullet',
        begin: '^[ \t]*([*+-]|(\\d+\\.))(?=\\s+)',
        end: '\\s+',
        excludeEnd: true
      };
      const LINK_REFERENCE = {
        begin: /^\[[^\n]+\]:/,
        returnBegin: true,
        contains: [
          {
            className: 'symbol',
            begin: /\[/,
            end: /\]/,
            excludeBegin: true,
            excludeEnd: true
          },
          {
            className: 'link',
            begin: /:\s*/,
            end: /$/,
            excludeBegin: true
          }
        ]
      };
      const URL_SCHEME = /[A-Za-z][A-Za-z0-9+.-]*/;
      const LINK = {
        variants: [
          {
            begin: /\[.+?\]\[.*?\]/,
            relevance: 0
          },
          {
            begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
            relevance: 2
          },
          {
            begin: regex.concat(/\[.+?\]\(/, URL_SCHEME, /:\/\/.*?\)/),
            relevance: 2
          },
          {
            begin: /\[.+?\]\([./?&#].*?\)/,
            relevance: 1
          },
          {
            begin: /\[.*?\]\(.*?\)/,
            relevance: 0
          }
        ],
        returnBegin: true,
        contains: [
          {
            match: /\[(?=\])/ },
          {
            className: 'string',
            relevance: 0,
            begin: '\\[',
            end: '\\]',
            excludeBegin: true,
            returnEnd: true
          },
          {
            className: 'link',
            relevance: 0,
            begin: '\\]\\(',
            end: '\\)',
            excludeBegin: true,
            excludeEnd: true
          },
          {
            className: 'symbol',
            relevance: 0,
            begin: '\\]\\[',
            end: '\\]',
            excludeBegin: true,
            excludeEnd: true
          }
        ]
      };
      const BOLD = {
        className: 'strong',
        contains: [],
        variants: [
          {
            begin: /_{2}/,
            end: /_{2}/
          },
          {
            begin: /\*{2}/,
            end: /\*{2}/
          }
        ]
      };
      const ITALIC = {
        className: 'emphasis',
        contains: [],
        variants: [
          {
            begin: /\*(?!\*)/,
            end: /\*/
          },
          {
            begin: /_(?!_)/,
            end: /_/,
            relevance: 0
          }
        ]
      };
      const BOLD_WITHOUT_ITALIC = hljs.inherit(BOLD, { contains: [] });
      const ITALIC_WITHOUT_BOLD = hljs.inherit(ITALIC, { contains: [] });
      BOLD.contains.push(ITALIC_WITHOUT_BOLD);
      ITALIC.contains.push(BOLD_WITHOUT_ITALIC);
      let CONTAINABLE = [
        INLINE_HTML,
        LINK
      ];
      [
        BOLD,
        ITALIC,
        BOLD_WITHOUT_ITALIC,
        ITALIC_WITHOUT_BOLD
      ].forEach(m => {
        m.contains = m.contains.concat(CONTAINABLE);
      });
      CONTAINABLE = CONTAINABLE.concat(BOLD, ITALIC);
      const HEADER = {
        className: 'section',
        variants: [
          {
            begin: '^#{1,6}',
            end: '$',
            contains: CONTAINABLE
          },
          {
            begin: '(?=^.+?\\n[=-]{2,}$)',
            contains: [
              { begin: '^[=-]*$' },
              {
                begin: '^',
                end: "\\n",
                contains: CONTAINABLE
              }
            ]
          }
        ]
      };
      const BLOCKQUOTE = {
        className: 'quote',
        begin: '^>\\s+',
        contains: CONTAINABLE,
        end: '$'
      };
      return {
        name: 'Markdown',
        aliases: [
          'md',
          'mkdown',
          'mkd'
        ],
        contains: [
          HEADER,
          INLINE_HTML,
          LIST,
          BOLD,
          ITALIC,
          BLOCKQUOTE,
          CODE,
          HORIZONTAL_RULE,
          LINK,
          LINK_REFERENCE
        ]
      };
    }

    function perl(hljs) {
      const regex = hljs.regex;
      const KEYWORDS = [
        'abs',
        'accept',
        'alarm',
        'and',
        'atan2',
        'bind',
        'binmode',
        'bless',
        'break',
        'caller',
        'chdir',
        'chmod',
        'chomp',
        'chop',
        'chown',
        'chr',
        'chroot',
        'close',
        'closedir',
        'connect',
        'continue',
        'cos',
        'crypt',
        'dbmclose',
        'dbmopen',
        'defined',
        'delete',
        'die',
        'do',
        'dump',
        'each',
        'else',
        'elsif',
        'endgrent',
        'endhostent',
        'endnetent',
        'endprotoent',
        'endpwent',
        'endservent',
        'eof',
        'eval',
        'exec',
        'exists',
        'exit',
        'exp',
        'fcntl',
        'fileno',
        'flock',
        'for',
        'foreach',
        'fork',
        'format',
        'formline',
        'getc',
        'getgrent',
        'getgrgid',
        'getgrnam',
        'gethostbyaddr',
        'gethostbyname',
        'gethostent',
        'getlogin',
        'getnetbyaddr',
        'getnetbyname',
        'getnetent',
        'getpeername',
        'getpgrp',
        'getpriority',
        'getprotobyname',
        'getprotobynumber',
        'getprotoent',
        'getpwent',
        'getpwnam',
        'getpwuid',
        'getservbyname',
        'getservbyport',
        'getservent',
        'getsockname',
        'getsockopt',
        'given',
        'glob',
        'gmtime',
        'goto',
        'grep',
        'gt',
        'hex',
        'if',
        'index',
        'int',
        'ioctl',
        'join',
        'keys',
        'kill',
        'last',
        'lc',
        'lcfirst',
        'length',
        'link',
        'listen',
        'local',
        'localtime',
        'log',
        'lstat',
        'lt',
        'ma',
        'map',
        'mkdir',
        'msgctl',
        'msgget',
        'msgrcv',
        'msgsnd',
        'my',
        'ne',
        'next',
        'no',
        'not',
        'oct',
        'open',
        'opendir',
        'or',
        'ord',
        'our',
        'pack',
        'package',
        'pipe',
        'pop',
        'pos',
        'print',
        'printf',
        'prototype',
        'push',
        'q|0',
        'qq',
        'quotemeta',
        'qw',
        'qx',
        'rand',
        'read',
        'readdir',
        'readline',
        'readlink',
        'readpipe',
        'recv',
        'redo',
        'ref',
        'rename',
        'require',
        'reset',
        'return',
        'reverse',
        'rewinddir',
        'rindex',
        'rmdir',
        'say',
        'scalar',
        'seek',
        'seekdir',
        'select',
        'semctl',
        'semget',
        'semop',
        'send',
        'setgrent',
        'sethostent',
        'setnetent',
        'setpgrp',
        'setpriority',
        'setprotoent',
        'setpwent',
        'setservent',
        'setsockopt',
        'shift',
        'shmctl',
        'shmget',
        'shmread',
        'shmwrite',
        'shutdown',
        'sin',
        'sleep',
        'socket',
        'socketpair',
        'sort',
        'splice',
        'split',
        'sprintf',
        'sqrt',
        'srand',
        'stat',
        'state',
        'study',
        'sub',
        'substr',
        'symlink',
        'syscall',
        'sysopen',
        'sysread',
        'sysseek',
        'system',
        'syswrite',
        'tell',
        'telldir',
        'tie',
        'tied',
        'time',
        'times',
        'tr',
        'truncate',
        'uc',
        'ucfirst',
        'umask',
        'undef',
        'unless',
        'unlink',
        'unpack',
        'unshift',
        'untie',
        'until',
        'use',
        'utime',
        'values',
        'vec',
        'wait',
        'waitpid',
        'wantarray',
        'warn',
        'when',
        'while',
        'write',
        'x|0',
        'xor',
        'y|0'
      ];
      const REGEX_MODIFIERS = /[dualxmsipngr]{0,12}/;
      const PERL_KEYWORDS = {
        $pattern: /[\w.]+/,
        keyword: KEYWORDS.join(" ")
      };
      const SUBST = {
        className: 'subst',
        begin: '[$@]\\{',
        end: '\\}',
        keywords: PERL_KEYWORDS
      };
      const METHOD = {
        begin: /->\{/,
        end: /\}/
      };
      const VAR = { variants: [
        { begin: /\$\d/ },
        { begin: regex.concat(
          /[$%@](\^\w\b|#\w+(::\w+)*|\{\w+\}|\w+(::\w*)*)/,
          `(?![A-Za-z])(?![@$%])`
        ) },
        {
          begin: /[$%@][^\s\w{]/,
          relevance: 0
        }
      ] };
      const STRING_CONTAINS = [
        hljs.BACKSLASH_ESCAPE,
        SUBST,
        VAR
      ];
      const REGEX_DELIMS = [
        /!/,
        /\//,
        /\|/,
        /\?/,
        /'/,
        /"/,
        /#/
      ];
      const PAIRED_DOUBLE_RE = (prefix, open, close = '\\1') => {
        const middle = (close === '\\1')
          ? close
          : regex.concat(close, open);
        return regex.concat(
          regex.concat("(?:", prefix, ")"),
          open,
          /(?:\\.|[^\\\/])*?/,
          middle,
          /(?:\\.|[^\\\/])*?/,
          close,
          REGEX_MODIFIERS
        );
      };
      const PAIRED_RE = (prefix, open, close) => {
        return regex.concat(
          regex.concat("(?:", prefix, ")"),
          open,
          /(?:\\.|[^\\\/])*?/,
          close,
          REGEX_MODIFIERS
        );
      };
      const PERL_DEFAULT_CONTAINS = [
        VAR,
        hljs.HASH_COMMENT_MODE,
        hljs.COMMENT(
          /^=\w/,
          /=cut/,
          { endsWithParent: true }
        ),
        METHOD,
        {
          className: 'string',
          contains: STRING_CONTAINS,
          variants: [
            {
              begin: 'q[qwxr]?\\s*\\(',
              end: '\\)',
              relevance: 5
            },
            {
              begin: 'q[qwxr]?\\s*\\[',
              end: '\\]',
              relevance: 5
            },
            {
              begin: 'q[qwxr]?\\s*\\{',
              end: '\\}',
              relevance: 5
            },
            {
              begin: 'q[qwxr]?\\s*\\|',
              end: '\\|',
              relevance: 5
            },
            {
              begin: 'q[qwxr]?\\s*<',
              end: '>',
              relevance: 5
            },
            {
              begin: 'qw\\s+q',
              end: 'q',
              relevance: 5
            },
            {
              begin: '\'',
              end: '\'',
              contains: [ hljs.BACKSLASH_ESCAPE ]
            },
            {
              begin: '"',
              end: '"'
            },
            {
              begin: '`',
              end: '`',
              contains: [ hljs.BACKSLASH_ESCAPE ]
            },
            {
              begin: /\{\w+\}/,
              relevance: 0
            },
            {
              begin: '-?\\w+\\s*=>',
              relevance: 0
            }
          ]
        },
        {
          className: 'number',
          begin: '(\\b0[0-7_]+)|(\\b0x[0-9a-fA-F_]+)|(\\b[1-9][0-9_]*(\\.[0-9_]+)?)|[0_]\\b',
          relevance: 0
        },
        {
          begin: '(\\/\\/|' + hljs.RE_STARTERS_RE + '|\\b(split|return|print|reverse|grep)\\b)\\s*',
          keywords: 'split return print reverse grep',
          relevance: 0,
          contains: [
            hljs.HASH_COMMENT_MODE,
            {
              className: 'regexp',
              variants: [
                { begin: PAIRED_DOUBLE_RE("s|tr|y", regex.either(...REGEX_DELIMS, { capture: true })) },
                { begin: PAIRED_DOUBLE_RE("s|tr|y", "\\(", "\\)") },
                { begin: PAIRED_DOUBLE_RE("s|tr|y", "\\[", "\\]") },
                { begin: PAIRED_DOUBLE_RE("s|tr|y", "\\{", "\\}") }
              ],
              relevance: 2
            },
            {
              className: 'regexp',
              variants: [
                {
                  begin: /(m|qr)\/\//,
                  relevance: 0
                },
                { begin: PAIRED_RE("(?:m|qr)?", /\//, /\//) },
                { begin: PAIRED_RE("m|qr", regex.either(...REGEX_DELIMS, { capture: true }), /\1/) },
                { begin: PAIRED_RE("m|qr", /\(/, /\)/) },
                { begin: PAIRED_RE("m|qr", /\[/, /\]/) },
                { begin: PAIRED_RE("m|qr", /\{/, /\}/) }
              ]
            }
          ]
        },
        {
          className: 'function',
          beginKeywords: 'sub',
          end: '(\\s*\\(.*?\\))?[;{]',
          excludeEnd: true,
          relevance: 5,
          contains: [ hljs.TITLE_MODE ]
        },
        {
          begin: '-\\w\\b',
          relevance: 0
        },
        {
          begin: "^__DATA__$",
          end: "^__END__$",
          subLanguage: 'mojolicious',
          contains: [
            {
              begin: "^@@.*",
              end: "$",
              className: "comment"
            }
          ]
        }
      ];
      SUBST.contains = PERL_DEFAULT_CONTAINS;
      METHOD.contains = PERL_DEFAULT_CONTAINS;
      return {
        name: 'Perl',
        aliases: [
          'pl',
          'pm'
        ],
        keywords: PERL_KEYWORDS,
        contains: PERL_DEFAULT_CONTAINS
      };
    }

    function php(hljs) {
      const regex = hljs.regex;
      const NOT_PERL_ETC = /(?![A-Za-z0-9])(?![$])/;
      const IDENT_RE = regex.concat(
        /[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,
        NOT_PERL_ETC);
      const PASCAL_CASE_CLASS_NAME_RE = regex.concat(
        /(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,
        NOT_PERL_ETC);
      const VARIABLE = {
        scope: 'variable',
        match: '\\$+' + IDENT_RE,
      };
      const PREPROCESSOR = {
        scope: 'meta',
        variants: [
          { begin: /<\?php/, relevance: 10 },
          { begin: /<\?=/ },
          { begin: /<\?/, relevance: 0.1 },
          { begin: /\?>/ }
        ]
      };
      const SUBST = {
        scope: 'subst',
        variants: [
          { begin: /\$\w+/ },
          {
            begin: /\{\$/,
            end: /\}/
          }
        ]
      };
      const SINGLE_QUOTED = hljs.inherit(hljs.APOS_STRING_MODE, { illegal: null, });
      const DOUBLE_QUOTED = hljs.inherit(hljs.QUOTE_STRING_MODE, {
        illegal: null,
        contains: hljs.QUOTE_STRING_MODE.contains.concat(SUBST),
      });
      const HEREDOC = hljs.END_SAME_AS_BEGIN({
        begin: /<<<[ \t]*(\w+)\n/,
        end: /[ \t]*(\w+)\b/,
        contains: hljs.QUOTE_STRING_MODE.contains.concat(SUBST),
      });
      const WHITESPACE = '[ \t\n]';
      const STRING = {
        scope: 'string',
        variants: [
          DOUBLE_QUOTED,
          SINGLE_QUOTED,
          HEREDOC
        ]
      };
      const NUMBER = {
        scope: 'number',
        variants: [
          { begin: `\\b0[bB][01]+(?:_[01]+)*\\b` },
          { begin: `\\b0[oO][0-7]+(?:_[0-7]+)*\\b` },
          { begin: `\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b` },
          { begin: `(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?` }
        ],
        relevance: 0
      };
      const LITERALS = [
        "false",
        "null",
        "true"
      ];
      const KWS = [
        "__CLASS__",
        "__DIR__",
        "__FILE__",
        "__FUNCTION__",
        "__COMPILER_HALT_OFFSET__",
        "__LINE__",
        "__METHOD__",
        "__NAMESPACE__",
        "__TRAIT__",
        "die",
        "echo",
        "exit",
        "include",
        "include_once",
        "print",
        "require",
        "require_once",
        "array",
        "abstract",
        "and",
        "as",
        "binary",
        "bool",
        "boolean",
        "break",
        "callable",
        "case",
        "catch",
        "class",
        "clone",
        "const",
        "continue",
        "declare",
        "default",
        "do",
        "double",
        "else",
        "elseif",
        "empty",
        "enddeclare",
        "endfor",
        "endforeach",
        "endif",
        "endswitch",
        "endwhile",
        "enum",
        "eval",
        "extends",
        "final",
        "finally",
        "float",
        "for",
        "foreach",
        "from",
        "global",
        "goto",
        "if",
        "implements",
        "instanceof",
        "insteadof",
        "int",
        "integer",
        "interface",
        "isset",
        "iterable",
        "list",
        "match|0",
        "mixed",
        "new",
        "never",
        "object",
        "or",
        "private",
        "protected",
        "public",
        "readonly",
        "real",
        "return",
        "string",
        "switch",
        "throw",
        "trait",
        "try",
        "unset",
        "use",
        "var",
        "void",
        "while",
        "xor",
        "yield"
      ];
      const BUILT_INS = [
        "Error|0",
        "AppendIterator",
        "ArgumentCountError",
        "ArithmeticError",
        "ArrayIterator",
        "ArrayObject",
        "AssertionError",
        "BadFunctionCallException",
        "BadMethodCallException",
        "CachingIterator",
        "CallbackFilterIterator",
        "CompileError",
        "Countable",
        "DirectoryIterator",
        "DivisionByZeroError",
        "DomainException",
        "EmptyIterator",
        "ErrorException",
        "Exception",
        "FilesystemIterator",
        "FilterIterator",
        "GlobIterator",
        "InfiniteIterator",
        "InvalidArgumentException",
        "IteratorIterator",
        "LengthException",
        "LimitIterator",
        "LogicException",
        "MultipleIterator",
        "NoRewindIterator",
        "OutOfBoundsException",
        "OutOfRangeException",
        "OuterIterator",
        "OverflowException",
        "ParentIterator",
        "ParseError",
        "RangeException",
        "RecursiveArrayIterator",
        "RecursiveCachingIterator",
        "RecursiveCallbackFilterIterator",
        "RecursiveDirectoryIterator",
        "RecursiveFilterIterator",
        "RecursiveIterator",
        "RecursiveIteratorIterator",
        "RecursiveRegexIterator",
        "RecursiveTreeIterator",
        "RegexIterator",
        "RuntimeException",
        "SeekableIterator",
        "SplDoublyLinkedList",
        "SplFileInfo",
        "SplFileObject",
        "SplFixedArray",
        "SplHeap",
        "SplMaxHeap",
        "SplMinHeap",
        "SplObjectStorage",
        "SplObserver",
        "SplPriorityQueue",
        "SplQueue",
        "SplStack",
        "SplSubject",
        "SplTempFileObject",
        "TypeError",
        "UnderflowException",
        "UnexpectedValueException",
        "UnhandledMatchError",
        "ArrayAccess",
        "BackedEnum",
        "Closure",
        "Fiber",
        "Generator",
        "Iterator",
        "IteratorAggregate",
        "Serializable",
        "Stringable",
        "Throwable",
        "Traversable",
        "UnitEnum",
        "WeakReference",
        "WeakMap",
        "Directory",
        "__PHP_Incomplete_Class",
        "parent",
        "php_user_filter",
        "self",
        "static",
        "stdClass"
      ];
      const dualCase = (items) => {
        const result = [];
        items.forEach(item => {
          result.push(item);
          if (item.toLowerCase() === item) {
            result.push(item.toUpperCase());
          } else {
            result.push(item.toLowerCase());
          }
        });
        return result;
      };
      const KEYWORDS = {
        keyword: KWS,
        literal: dualCase(LITERALS),
        built_in: BUILT_INS,
      };
      const normalizeKeywords = (items) => {
        return items.map(item => {
          return item.replace(/\|\d+$/, "");
        });
      };
      const CONSTRUCTOR_CALL = { variants: [
        {
          match: [
            /new/,
            regex.concat(WHITESPACE, "+"),
            regex.concat("(?!", normalizeKeywords(BUILT_INS).join("\\b|"), "\\b)"),
            PASCAL_CASE_CLASS_NAME_RE,
          ],
          scope: {
            1: "keyword",
            4: "title.class",
          },
        }
      ] };
      const CONSTANT_REFERENCE = regex.concat(IDENT_RE, "\\b(?!\\()");
      const LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON = { variants: [
        {
          match: [
            regex.concat(
              /::/,
              regex.lookahead(/(?!class\b)/)
            ),
            CONSTANT_REFERENCE,
          ],
          scope: { 2: "variable.constant", },
        },
        {
          match: [
            /::/,
            /class/,
          ],
          scope: { 2: "variable.language", },
        },
        {
          match: [
            PASCAL_CASE_CLASS_NAME_RE,
            regex.concat(
              /::/,
              regex.lookahead(/(?!class\b)/)
            ),
            CONSTANT_REFERENCE,
          ],
          scope: {
            1: "title.class",
            3: "variable.constant",
          },
        },
        {
          match: [
            PASCAL_CASE_CLASS_NAME_RE,
            regex.concat(
              "::",
              regex.lookahead(/(?!class\b)/)
            ),
          ],
          scope: { 1: "title.class", },
        },
        {
          match: [
            PASCAL_CASE_CLASS_NAME_RE,
            /::/,
            /class/,
          ],
          scope: {
            1: "title.class",
            3: "variable.language",
          },
        }
      ] };
      const NAMED_ARGUMENT = {
        scope: 'attr',
        match: regex.concat(IDENT_RE, regex.lookahead(':'), regex.lookahead(/(?!::)/)),
      };
      const PARAMS_MODE = {
        relevance: 0,
        begin: /\(/,
        end: /\)/,
        keywords: KEYWORDS,
        contains: [
          NAMED_ARGUMENT,
          VARIABLE,
          LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
          hljs.C_BLOCK_COMMENT_MODE,
          STRING,
          NUMBER,
          CONSTRUCTOR_CALL,
        ],
      };
      const FUNCTION_INVOKE = {
        relevance: 0,
        match: [
          /\b/,
          regex.concat("(?!fn\\b|function\\b|", normalizeKeywords(KWS).join("\\b|"), "|", normalizeKeywords(BUILT_INS).join("\\b|"), "\\b)"),
          IDENT_RE,
          regex.concat(WHITESPACE, "*"),
          regex.lookahead(/(?=\()/)
        ],
        scope: { 3: "title.function.invoke", },
        contains: [ PARAMS_MODE ]
      };
      PARAMS_MODE.contains.push(FUNCTION_INVOKE);
      const ATTRIBUTE_CONTAINS = [
        NAMED_ARGUMENT,
        LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
        hljs.C_BLOCK_COMMENT_MODE,
        STRING,
        NUMBER,
        CONSTRUCTOR_CALL,
      ];
      const ATTRIBUTES = {
        begin: regex.concat(/#\[\s*/, PASCAL_CASE_CLASS_NAME_RE),
        beginScope: "meta",
        end: /]/,
        endScope: "meta",
        keywords: {
          literal: LITERALS,
          keyword: [
            'new',
            'array',
          ]
        },
        contains: [
          {
            begin: /\[/,
            end: /]/,
            keywords: {
              literal: LITERALS,
              keyword: [
                'new',
                'array',
              ]
            },
            contains: [
              'self',
              ...ATTRIBUTE_CONTAINS,
            ]
          },
          ...ATTRIBUTE_CONTAINS,
          {
            scope: 'meta',
            match: PASCAL_CASE_CLASS_NAME_RE
          }
        ]
      };
      return {
        case_insensitive: false,
        keywords: KEYWORDS,
        contains: [
          ATTRIBUTES,
          hljs.HASH_COMMENT_MODE,
          hljs.COMMENT('//', '$'),
          hljs.COMMENT(
            '/\\*',
            '\\*/',
            { contains: [
              {
                scope: 'doctag',
                match: '@[A-Za-z]+'
              }
            ] }
          ),
          {
            match: /__halt_compiler\(\);/,
            keywords: '__halt_compiler',
            starts: {
              scope: "comment",
              end: hljs.MATCH_NOTHING_RE,
              contains: [
                {
                  match: /\?>/,
                  scope: "meta",
                  endsParent: true
                }
              ]
            }
          },
          PREPROCESSOR,
          {
            scope: 'variable.language',
            match: /\$this\b/
          },
          VARIABLE,
          FUNCTION_INVOKE,
          LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
          {
            match: [
              /const/,
              /\s/,
              IDENT_RE,
            ],
            scope: {
              1: "keyword",
              3: "variable.constant",
            },
          },
          CONSTRUCTOR_CALL,
          {
            scope: 'function',
            relevance: 0,
            beginKeywords: 'fn function',
            end: /[;{]/,
            excludeEnd: true,
            illegal: '[$%\\[]',
            contains: [
              { beginKeywords: 'use', },
              hljs.UNDERSCORE_TITLE_MODE,
              {
                begin: '=>',
                endsParent: true
              },
              {
                scope: 'params',
                begin: '\\(',
                end: '\\)',
                excludeBegin: true,
                excludeEnd: true,
                keywords: KEYWORDS,
                contains: [
                  'self',
                  VARIABLE,
                  LEFT_AND_RIGHT_SIDE_OF_DOUBLE_COLON,
                  hljs.C_BLOCK_COMMENT_MODE,
                  STRING,
                  NUMBER
                ]
              },
            ]
          },
          {
            scope: 'class',
            variants: [
              {
                beginKeywords: "enum",
                illegal: /[($"]/
              },
              {
                beginKeywords: "class interface trait",
                illegal: /[:($"]/
              }
            ],
            relevance: 0,
            end: /\{/,
            excludeEnd: true,
            contains: [
              { beginKeywords: 'extends implements' },
              hljs.UNDERSCORE_TITLE_MODE
            ]
          },
          {
            beginKeywords: 'namespace',
            relevance: 0,
            end: ';',
            illegal: /[.']/,
            contains: [ hljs.inherit(hljs.UNDERSCORE_TITLE_MODE, { scope: "title.class" }) ]
          },
          {
            beginKeywords: 'use',
            relevance: 0,
            end: ';',
            contains: [
              {
                match: /\b(as|const|function)\b/,
                scope: "keyword"
              },
              hljs.UNDERSCORE_TITLE_MODE
            ]
          },
          STRING,
          NUMBER,
        ]
      };
    }

    function python(hljs) {
      const regex = hljs.regex;
      const IDENT_RE = /[\p{XID_Start}_]\p{XID_Continue}*/u;
      const RESERVED_WORDS = [
        'and',
        'as',
        'assert',
        'async',
        'await',
        'break',
        'case',
        'class',
        'continue',
        'def',
        'del',
        'elif',
        'else',
        'except',
        'finally',
        'for',
        'from',
        'global',
        'if',
        'import',
        'in',
        'is',
        'lambda',
        'match',
        'nonlocal|10',
        'not',
        'or',
        'pass',
        'raise',
        'return',
        'try',
        'while',
        'with',
        'yield'
      ];
      const BUILT_INS = [
        '__import__',
        'abs',
        'all',
        'any',
        'ascii',
        'bin',
        'bool',
        'breakpoint',
        'bytearray',
        'bytes',
        'callable',
        'chr',
        'classmethod',
        'compile',
        'complex',
        'delattr',
        'dict',
        'dir',
        'divmod',
        'enumerate',
        'eval',
        'exec',
        'filter',
        'float',
        'format',
        'frozenset',
        'getattr',
        'globals',
        'hasattr',
        'hash',
        'help',
        'hex',
        'id',
        'input',
        'int',
        'isinstance',
        'issubclass',
        'iter',
        'len',
        'list',
        'locals',
        'map',
        'max',
        'memoryview',
        'min',
        'next',
        'object',
        'oct',
        'open',
        'ord',
        'pow',
        'print',
        'property',
        'range',
        'repr',
        'reversed',
        'round',
        'set',
        'setattr',
        'slice',
        'sorted',
        'staticmethod',
        'str',
        'sum',
        'super',
        'tuple',
        'type',
        'vars',
        'zip'
      ];
      const LITERALS = [
        '__debug__',
        'Ellipsis',
        'False',
        'None',
        'NotImplemented',
        'True'
      ];
      const TYPES = [
        "Any",
        "Callable",
        "Coroutine",
        "Dict",
        "List",
        "Literal",
        "Generic",
        "Optional",
        "Sequence",
        "Set",
        "Tuple",
        "Type",
        "Union"
      ];
      const KEYWORDS = {
        $pattern: /[A-Za-z]\w+|__\w+__/,
        keyword: RESERVED_WORDS,
        built_in: BUILT_INS,
        literal: LITERALS,
        type: TYPES
      };
      const PROMPT = {
        className: 'meta',
        begin: /^(>>>|\.\.\.) /
      };
      const SUBST = {
        className: 'subst',
        begin: /\{/,
        end: /\}/,
        keywords: KEYWORDS,
        illegal: /#/
      };
      const LITERAL_BRACKET = {
        begin: /\{\{/,
        relevance: 0
      };
      const STRING = {
        className: 'string',
        contains: [ hljs.BACKSLASH_ESCAPE ],
        variants: [
          {
            begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
            end: /'''/,
            contains: [
              hljs.BACKSLASH_ESCAPE,
              PROMPT
            ],
            relevance: 10
          },
          {
            begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
            end: /"""/,
            contains: [
              hljs.BACKSLASH_ESCAPE,
              PROMPT
            ],
            relevance: 10
          },
          {
            begin: /([fF][rR]|[rR][fF]|[fF])'''/,
            end: /'''/,
            contains: [
              hljs.BACKSLASH_ESCAPE,
              PROMPT,
              LITERAL_BRACKET,
              SUBST
            ]
          },
          {
            begin: /([fF][rR]|[rR][fF]|[fF])"""/,
            end: /"""/,
            contains: [
              hljs.BACKSLASH_ESCAPE,
              PROMPT,
              LITERAL_BRACKET,
              SUBST
            ]
          },
          {
            begin: /([uU]|[rR])'/,
            end: /'/,
            relevance: 10
          },
          {
            begin: /([uU]|[rR])"/,
            end: /"/,
            relevance: 10
          },
          {
            begin: /([bB]|[bB][rR]|[rR][bB])'/,
            end: /'/
          },
          {
            begin: /([bB]|[bB][rR]|[rR][bB])"/,
            end: /"/
          },
          {
            begin: /([fF][rR]|[rR][fF]|[fF])'/,
            end: /'/,
            contains: [
              hljs.BACKSLASH_ESCAPE,
              LITERAL_BRACKET,
              SUBST
            ]
          },
          {
            begin: /([fF][rR]|[rR][fF]|[fF])"/,
            end: /"/,
            contains: [
              hljs.BACKSLASH_ESCAPE,
              LITERAL_BRACKET,
              SUBST
            ]
          },
          hljs.APOS_STRING_MODE,
          hljs.QUOTE_STRING_MODE
        ]
      };
      const digitpart = '[0-9](_?[0-9])*';
      const pointfloat = `(\\b(${digitpart}))?\\.(${digitpart})|\\b(${digitpart})\\.`;
      const lookahead = `\\b|${RESERVED_WORDS.join('|')}`;
      const NUMBER = {
        className: 'number',
        relevance: 0,
        variants: [
          {
            begin: `(\\b(${digitpart})|(${pointfloat}))[eE][+-]?(${digitpart})[jJ]?(?=${lookahead})`
          },
          {
            begin: `(${pointfloat})[jJ]?`
          },
          {
            begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${lookahead})`
          },
          {
            begin: `\\b0[bB](_?[01])+[lL]?(?=${lookahead})`
          },
          {
            begin: `\\b0[oO](_?[0-7])+[lL]?(?=${lookahead})`
          },
          {
            begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${lookahead})`
          },
          {
            begin: `\\b(${digitpart})[jJ](?=${lookahead})`
          }
        ]
      };
      const COMMENT_TYPE = {
        className: "comment",
        begin: regex.lookahead(/# type:/),
        end: /$/,
        keywords: KEYWORDS,
        contains: [
          {
            begin: /# type:/
          },
          {
            begin: /#/,
            end: /\b\B/,
            endsWithParent: true
          }
        ]
      };
      const PARAMS = {
        className: 'params',
        variants: [
          {
            className: "",
            begin: /\(\s*\)/,
            skip: true
          },
          {
            begin: /\(/,
            end: /\)/,
            excludeBegin: true,
            excludeEnd: true,
            keywords: KEYWORDS,
            contains: [
              'self',
              PROMPT,
              NUMBER,
              STRING,
              hljs.HASH_COMMENT_MODE
            ]
          }
        ]
      };
      SUBST.contains = [
        STRING,
        NUMBER,
        PROMPT
      ];
      return {
        name: 'Python',
        aliases: [
          'py',
          'gyp',
          'ipython'
        ],
        unicodeRegex: true,
        keywords: KEYWORDS,
        illegal: /(<\/|->|\?)|=>/,
        contains: [
          PROMPT,
          NUMBER,
          {
            begin: /\bself\b/
          },
          {
            beginKeywords: "if",
            relevance: 0
          },
          STRING,
          COMMENT_TYPE,
          hljs.HASH_COMMENT_MODE,
          {
            match: [
              /\bdef/, /\s+/,
              IDENT_RE,
            ],
            scope: {
              1: "keyword",
              3: "title.function"
            },
            contains: [ PARAMS ]
          },
          {
            variants: [
              {
                match: [
                  /\bclass/, /\s+/,
                  IDENT_RE, /\s*/,
                  /\(\s*/, IDENT_RE,/\s*\)/
                ],
              },
              {
                match: [
                  /\bclass/, /\s+/,
                  IDENT_RE
                ],
              }
            ],
            scope: {
              1: "keyword",
              3: "title.class",
              6: "title.class.inherited",
            }
          },
          {
            className: 'meta',
            begin: /^[\t ]*@/,
            end: /(?=#)|$/,
            contains: [
              NUMBER,
              PARAMS,
              STRING
            ]
          }
        ]
      };
    }

    function ruby(hljs) {
      const regex = hljs.regex;
      const RUBY_METHOD_RE = '([a-zA-Z_]\\w*[!?=]?|[-+~]@|<<|>>|=~|===?|<=>|[<>]=?|\\*\\*|[-/+%^&*~`|]|\\[\\]=?)';
      const CLASS_NAME_RE = regex.either(
        /\b([A-Z]+[a-z0-9]+)+/,
        /\b([A-Z]+[a-z0-9]+)+[A-Z]+/,
      )
      ;
      const CLASS_NAME_WITH_NAMESPACE_RE = regex.concat(CLASS_NAME_RE, /(::\w+)*/);
      const RUBY_KEYWORDS = {
        "variable.constant": [
          "__FILE__",
          "__LINE__"
        ],
        "variable.language": [
          "self",
          "super",
        ],
        keyword: [
          "alias",
          "and",
          "attr_accessor",
          "attr_reader",
          "attr_writer",
          "begin",
          "BEGIN",
          "break",
          "case",
          "class",
          "defined",
          "do",
          "else",
          "elsif",
          "end",
          "END",
          "ensure",
          "for",
          "if",
          "in",
          "include",
          "module",
          "next",
          "not",
          "or",
          "redo",
          "require",
          "rescue",
          "retry",
          "return",
          "then",
          "undef",
          "unless",
          "until",
          "when",
          "while",
          "yield",
        ],
        built_in: [
          "proc",
          "lambda"
        ],
        literal: [
          "true",
          "false",
          "nil"
        ]
      };
      const YARDOCTAG = {
        className: 'doctag',
        begin: '@[A-Za-z]+'
      };
      const IRB_OBJECT = {
        begin: '#<',
        end: '>'
      };
      const COMMENT_MODES = [
        hljs.COMMENT(
          '#',
          '$',
          { contains: [ YARDOCTAG ] }
        ),
        hljs.COMMENT(
          '^=begin',
          '^=end',
          {
            contains: [ YARDOCTAG ],
            relevance: 10
          }
        ),
        hljs.COMMENT('^__END__', hljs.MATCH_NOTHING_RE)
      ];
      const SUBST = {
        className: 'subst',
        begin: /#\{/,
        end: /\}/,
        keywords: RUBY_KEYWORDS
      };
      const STRING = {
        className: 'string',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ],
        variants: [
          {
            begin: /'/,
            end: /'/
          },
          {
            begin: /"/,
            end: /"/
          },
          {
            begin: /`/,
            end: /`/
          },
          {
            begin: /%[qQwWx]?\(/,
            end: /\)/
          },
          {
            begin: /%[qQwWx]?\[/,
            end: /\]/
          },
          {
            begin: /%[qQwWx]?\{/,
            end: /\}/
          },
          {
            begin: /%[qQwWx]?</,
            end: />/
          },
          {
            begin: /%[qQwWx]?\//,
            end: /\//
          },
          {
            begin: /%[qQwWx]?%/,
            end: /%/
          },
          {
            begin: /%[qQwWx]?-/,
            end: /-/
          },
          {
            begin: /%[qQwWx]?\|/,
            end: /\|/
          },
          { begin: /\B\?(\\\d{1,3})/ },
          { begin: /\B\?(\\x[A-Fa-f0-9]{1,2})/ },
          { begin: /\B\?(\\u\{?[A-Fa-f0-9]{1,6}\}?)/ },
          { begin: /\B\?(\\M-\\C-|\\M-\\c|\\c\\M-|\\M-|\\C-\\M-)[\x20-\x7e]/ },
          { begin: /\B\?\\(c|C-)[\x20-\x7e]/ },
          { begin: /\B\?\\?\S/ },
          {
            begin: regex.concat(
              /<<[-~]?'?/,
              regex.lookahead(/(\w+)(?=\W)[^\n]*\n(?:[^\n]*\n)*?\s*\1\b/)
            ),
            contains: [
              hljs.END_SAME_AS_BEGIN({
                begin: /(\w+)/,
                end: /(\w+)/,
                contains: [
                  hljs.BACKSLASH_ESCAPE,
                  SUBST
                ]
              })
            ]
          }
        ]
      };
      const decimal = '[1-9](_?[0-9])*|0';
      const digits = '[0-9](_?[0-9])*';
      const NUMBER = {
        className: 'number',
        relevance: 0,
        variants: [
          { begin: `\\b(${decimal})(\\.(${digits}))?([eE][+-]?(${digits})|r)?i?\\b` },
          { begin: "\\b0[dD][0-9](_?[0-9])*r?i?\\b" },
          { begin: "\\b0[bB][0-1](_?[0-1])*r?i?\\b" },
          { begin: "\\b0[oO][0-7](_?[0-7])*r?i?\\b" },
          { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*r?i?\\b" },
          { begin: "\\b0(_?[0-7])+r?i?\\b" }
        ]
      };
      const PARAMS = {
        variants: [
          {
            match: /\(\)/,
          },
          {
            className: 'params',
            begin: /\(/,
            end: /(?=\))/,
            excludeBegin: true,
            endsParent: true,
            keywords: RUBY_KEYWORDS,
          }
        ]
      };
      const CLASS_DEFINITION = {
        variants: [
          {
            match: [
              /class\s+/,
              CLASS_NAME_WITH_NAMESPACE_RE,
              /\s+<\s+/,
              CLASS_NAME_WITH_NAMESPACE_RE
            ]
          },
          {
            match: [
              /class\s+/,
              CLASS_NAME_WITH_NAMESPACE_RE
            ]
          }
        ],
        scope: {
          2: "title.class",
          4: "title.class.inherited"
        },
        keywords: RUBY_KEYWORDS
      };
      const UPPER_CASE_CONSTANT = {
        relevance: 0,
        match: /\b[A-Z][A-Z_0-9]+\b/,
        className: "variable.constant"
      };
      const METHOD_DEFINITION = {
        match: [
          /def/, /\s+/,
          RUBY_METHOD_RE
        ],
        scope: {
          1: "keyword",
          3: "title.function"
        },
        contains: [
          PARAMS
        ]
      };
      const OBJECT_CREATION = {
        relevance: 0,
        match: [
          CLASS_NAME_WITH_NAMESPACE_RE,
          /\.new[ (]/
        ],
        scope: {
          1: "title.class"
        }
      };
      const RUBY_DEFAULT_CONTAINS = [
        STRING,
        CLASS_DEFINITION,
        OBJECT_CREATION,
        UPPER_CASE_CONSTANT,
        METHOD_DEFINITION,
        {
          begin: hljs.IDENT_RE + '::' },
        {
          className: 'symbol',
          begin: hljs.UNDERSCORE_IDENT_RE + '(!|\\?)?:',
          relevance: 0
        },
        {
          className: 'symbol',
          begin: ':(?!\\s)',
          contains: [
            STRING,
            { begin: RUBY_METHOD_RE }
          ],
          relevance: 0
        },
        NUMBER,
        {
          className: "variable",
          begin: '(\\$\\W)|((\\$|@@?)(\\w+))(?=[^@$?])' + `(?![A-Za-z])(?![@$?'])`
        },
        {
          className: 'params',
          begin: /\|/,
          end: /\|/,
          excludeBegin: true,
          excludeEnd: true,
          relevance: 0,
          keywords: RUBY_KEYWORDS
        },
        {
          begin: '(' + hljs.RE_STARTERS_RE + '|unless)\\s*',
          keywords: 'unless',
          contains: [
            {
              className: 'regexp',
              contains: [
                hljs.BACKSLASH_ESCAPE,
                SUBST
              ],
              illegal: /\n/,
              variants: [
                {
                  begin: '/',
                  end: '/[a-z]*'
                },
                {
                  begin: /%r\{/,
                  end: /\}[a-z]*/
                },
                {
                  begin: '%r\\(',
                  end: '\\)[a-z]*'
                },
                {
                  begin: '%r!',
                  end: '![a-z]*'
                },
                {
                  begin: '%r\\[',
                  end: '\\][a-z]*'
                }
              ]
            }
          ].concat(IRB_OBJECT, COMMENT_MODES),
          relevance: 0
        }
      ].concat(IRB_OBJECT, COMMENT_MODES);
      SUBST.contains = RUBY_DEFAULT_CONTAINS;
      PARAMS.contains = RUBY_DEFAULT_CONTAINS;
      const SIMPLE_PROMPT = "[>?]>";
      const DEFAULT_PROMPT = "[\\w#]+\\(\\w+\\):\\d+:\\d+[>*]";
      const RVM_PROMPT = "(\\w+-)?\\d+\\.\\d+\\.\\d+(p\\d+)?[^\\d][^>]+>";
      const IRB_DEFAULT = [
        {
          begin: /^\s*=>/,
          starts: {
            end: '$',
            contains: RUBY_DEFAULT_CONTAINS
          }
        },
        {
          className: 'meta.prompt',
          begin: '^(' + SIMPLE_PROMPT + "|" + DEFAULT_PROMPT + '|' + RVM_PROMPT + ')(?=[ ])',
          starts: {
            end: '$',
            keywords: RUBY_KEYWORDS,
            contains: RUBY_DEFAULT_CONTAINS
          }
        }
      ];
      COMMENT_MODES.unshift(IRB_OBJECT);
      return {
        name: 'Ruby',
        aliases: [
          'rb',
          'gemspec',
          'podspec',
          'thor',
          'irb'
        ],
        keywords: RUBY_KEYWORDS,
        illegal: /\/\*/,
        contains: [ hljs.SHEBANG({ binary: "ruby" }) ]
          .concat(IRB_DEFAULT)
          .concat(COMMENT_MODES)
          .concat(RUBY_DEFAULT_CONTAINS)
      };
    }

    function rust(hljs) {
      const regex = hljs.regex;
      const FUNCTION_INVOKE = {
        className: "title.function.invoke",
        relevance: 0,
        begin: regex.concat(
          /\b/,
          /(?!let\b)/,
          hljs.IDENT_RE,
          regex.lookahead(/\s*\(/))
      };
      const NUMBER_SUFFIX = '([ui](8|16|32|64|128|size)|f(32|64))\?';
      const KEYWORDS = [
        "abstract",
        "as",
        "async",
        "await",
        "become",
        "box",
        "break",
        "const",
        "continue",
        "crate",
        "do",
        "dyn",
        "else",
        "enum",
        "extern",
        "false",
        "final",
        "fn",
        "for",
        "if",
        "impl",
        "in",
        "let",
        "loop",
        "macro",
        "match",
        "mod",
        "move",
        "mut",
        "override",
        "priv",
        "pub",
        "ref",
        "return",
        "self",
        "Self",
        "static",
        "struct",
        "super",
        "trait",
        "true",
        "try",
        "type",
        "typeof",
        "unsafe",
        "unsized",
        "use",
        "virtual",
        "where",
        "while",
        "yield"
      ];
      const LITERALS = [
        "true",
        "false",
        "Some",
        "None",
        "Ok",
        "Err"
      ];
      const BUILTINS = [
        'drop ',
        "Copy",
        "Send",
        "Sized",
        "Sync",
        "Drop",
        "Fn",
        "FnMut",
        "FnOnce",
        "ToOwned",
        "Clone",
        "Debug",
        "PartialEq",
        "PartialOrd",
        "Eq",
        "Ord",
        "AsRef",
        "AsMut",
        "Into",
        "From",
        "Default",
        "Iterator",
        "Extend",
        "IntoIterator",
        "DoubleEndedIterator",
        "ExactSizeIterator",
        "SliceConcatExt",
        "ToString",
        "assert!",
        "assert_eq!",
        "bitflags!",
        "bytes!",
        "cfg!",
        "col!",
        "concat!",
        "concat_idents!",
        "debug_assert!",
        "debug_assert_eq!",
        "env!",
        "panic!",
        "file!",
        "format!",
        "format_args!",
        "include_bytes!",
        "include_str!",
        "line!",
        "local_data_key!",
        "module_path!",
        "option_env!",
        "print!",
        "println!",
        "select!",
        "stringify!",
        "try!",
        "unimplemented!",
        "unreachable!",
        "vec!",
        "write!",
        "writeln!",
        "macro_rules!",
        "assert_ne!",
        "debug_assert_ne!"
      ];
      const TYPES = [
        "i8",
        "i16",
        "i32",
        "i64",
        "i128",
        "isize",
        "u8",
        "u16",
        "u32",
        "u64",
        "u128",
        "usize",
        "f32",
        "f64",
        "str",
        "char",
        "bool",
        "Box",
        "Option",
        "Result",
        "String",
        "Vec"
      ];
      return {
        name: 'Rust',
        aliases: [ 'rs' ],
        keywords: {
          $pattern: hljs.IDENT_RE + '!?',
          type: TYPES,
          keyword: KEYWORDS,
          literal: LITERALS,
          built_in: BUILTINS
        },
        illegal: '</',
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.COMMENT('/\\*', '\\*/', { contains: [ 'self' ] }),
          hljs.inherit(hljs.QUOTE_STRING_MODE, {
            begin: /b?"/,
            illegal: null
          }),
          {
            className: 'string',
            variants: [
              { begin: /b?r(#*)"(.|\n)*?"\1(?!#)/ },
              { begin: /b?'\\?(x\w{2}|u\w{4}|U\w{8}|.)'/ }
            ]
          },
          {
            className: 'symbol',
            begin: /'[a-zA-Z_][a-zA-Z0-9_]*/
          },
          {
            className: 'number',
            variants: [
              { begin: '\\b0b([01_]+)' + NUMBER_SUFFIX },
              { begin: '\\b0o([0-7_]+)' + NUMBER_SUFFIX },
              { begin: '\\b0x([A-Fa-f0-9_]+)' + NUMBER_SUFFIX },
              { begin: '\\b(\\d[\\d_]*(\\.[0-9_]+)?([eE][+-]?[0-9_]+)?)'
                       + NUMBER_SUFFIX }
            ],
            relevance: 0
          },
          {
            begin: [
              /fn/,
              /\s+/,
              hljs.UNDERSCORE_IDENT_RE
            ],
            className: {
              1: "keyword",
              3: "title.function"
            }
          },
          {
            className: 'meta',
            begin: '#!?\\[',
            end: '\\]',
            contains: [
              {
                className: 'string',
                begin: /"/,
                end: /"/
              }
            ]
          },
          {
            begin: [
              /let/,
              /\s+/,
              /(?:mut\s+)?/,
              hljs.UNDERSCORE_IDENT_RE
            ],
            className: {
              1: "keyword",
              3: "keyword",
              4: "variable"
            }
          },
          {
            begin: [
              /for/,
              /\s+/,
              hljs.UNDERSCORE_IDENT_RE,
              /\s+/,
              /in/
            ],
            className: {
              1: "keyword",
              3: "variable",
              5: "keyword"
            }
          },
          {
            begin: [
              /type/,
              /\s+/,
              hljs.UNDERSCORE_IDENT_RE
            ],
            className: {
              1: "keyword",
              3: "title.class"
            }
          },
          {
            begin: [
              /(?:trait|enum|struct|union|impl|for)/,
              /\s+/,
              hljs.UNDERSCORE_IDENT_RE
            ],
            className: {
              1: "keyword",
              3: "title.class"
            }
          },
          {
            begin: hljs.IDENT_RE + '::',
            keywords: {
              keyword: "Self",
              built_in: BUILTINS,
              type: TYPES
            }
          },
          {
            className: "punctuation",
            begin: '->'
          },
          FUNCTION_INVOKE
        ]
      };
    }

    function scala(hljs) {
      const regex = hljs.regex;
      const ANNOTATION = {
        className: 'meta',
        begin: '@[A-Za-z]+'
      };
      const SUBST = {
        className: 'subst',
        variants: [
          { begin: '\\$[A-Za-z0-9_]+' },
          {
            begin: /\$\{/,
            end: /\}/
          }
        ]
      };
      const STRING = {
        className: 'string',
        variants: [
          {
            begin: '"""',
            end: '"""'
          },
          {
            begin: '"',
            end: '"',
            illegal: '\\n',
            contains: [ hljs.BACKSLASH_ESCAPE ]
          },
          {
            begin: '[a-z]+"',
            end: '"',
            illegal: '\\n',
            contains: [
              hljs.BACKSLASH_ESCAPE,
              SUBST
            ]
          },
          {
            className: 'string',
            begin: '[a-z]+"""',
            end: '"""',
            contains: [ SUBST ],
            relevance: 10
          }
        ]
      };
      const TYPE = {
        className: 'type',
        begin: '\\b[A-Z][A-Za-z0-9_]*',
        relevance: 0
      };
      const NAME = {
        className: 'title',
        begin: /[^0-9\n\t "'(),.`{}\[\]:;][^\n\t "'(),.`{}\[\]:;]+|[^0-9\n\t "'(),.`{}\[\]:;=]/,
        relevance: 0
      };
      const CLASS = {
        className: 'class',
        beginKeywords: 'class object trait type',
        end: /[:={\[\n;]/,
        excludeEnd: true,
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          {
            beginKeywords: 'extends with',
            relevance: 10
          },
          {
            begin: /\[/,
            end: /\]/,
            excludeBegin: true,
            excludeEnd: true,
            relevance: 0,
            contains: [ TYPE ]
          },
          {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            excludeBegin: true,
            excludeEnd: true,
            relevance: 0,
            contains: [ TYPE ]
          },
          NAME
        ]
      };
      const METHOD = {
        className: 'function',
        beginKeywords: 'def',
        end: regex.lookahead(/[:={\[(\n;]/),
        contains: [ NAME ]
      };
      const EXTENSION = {
        begin: [
          /^\s*/,
          'extension',
          /\s+(?=[[(])/,
        ],
        beginScope: { 2: "keyword", }
      };
      const END = {
        begin: [
          /^\s*/,
          /end/,
          /\s+/,
          /(extension\b)?/,
        ],
        beginScope: {
          2: "keyword",
          4: "keyword",
        }
      };
      const INLINE_MODES = [
        { match: /\.inline\b/ },
        {
          begin: /\binline(?=\s)/,
          keywords: 'inline'
        }
      ];
      const USING_PARAM_CLAUSE = {
        begin: [
          /\(\s*/,
          /using/,
          /\s+(?!\))/,
        ],
        beginScope: { 2: "keyword", }
      };
      return {
        name: 'Scala',
        keywords: {
          literal: 'true false null',
          keyword: 'type yield lazy override def with val var sealed abstract private trait object if then forSome for while do throw finally protected extends import final return else break new catch super class case package default try this match continue throws implicit export enum given transparent'
        },
        contains: [
          hljs.C_LINE_COMMENT_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          STRING,
          TYPE,
          METHOD,
          CLASS,
          hljs.C_NUMBER_MODE,
          EXTENSION,
          END,
          ...INLINE_MODES,
          USING_PARAM_CLAUSE,
          ANNOTATION
        ]
      };
    }

    function sql(hljs) {
      const regex = hljs.regex;
      const COMMENT_MODE = hljs.COMMENT('--', '$');
      const STRING = {
        className: 'string',
        variants: [
          {
            begin: /'/,
            end: /'/,
            contains: [ { begin: /''/ } ]
          }
        ]
      };
      const QUOTED_IDENTIFIER = {
        begin: /"/,
        end: /"/,
        contains: [ { begin: /""/ } ]
      };
      const LITERALS = [
        "true",
        "false",
        "unknown"
      ];
      const MULTI_WORD_TYPES = [
        "double precision",
        "large object",
        "with timezone",
        "without timezone"
      ];
      const TYPES = [
        'bigint',
        'binary',
        'blob',
        'boolean',
        'char',
        'character',
        'clob',
        'date',
        'dec',
        'decfloat',
        'decimal',
        'float',
        'int',
        'integer',
        'interval',
        'nchar',
        'nclob',
        'national',
        'numeric',
        'real',
        'row',
        'smallint',
        'time',
        'timestamp',
        'varchar',
        'varying',
        'varbinary'
      ];
      const NON_RESERVED_WORDS = [
        "add",
        "asc",
        "collation",
        "desc",
        "final",
        "first",
        "last",
        "view"
      ];
      const RESERVED_WORDS = [
        "abs",
        "acos",
        "all",
        "allocate",
        "alter",
        "and",
        "any",
        "are",
        "array",
        "array_agg",
        "array_max_cardinality",
        "as",
        "asensitive",
        "asin",
        "asymmetric",
        "at",
        "atan",
        "atomic",
        "authorization",
        "avg",
        "begin",
        "begin_frame",
        "begin_partition",
        "between",
        "bigint",
        "binary",
        "blob",
        "boolean",
        "both",
        "by",
        "call",
        "called",
        "cardinality",
        "cascaded",
        "case",
        "cast",
        "ceil",
        "ceiling",
        "char",
        "char_length",
        "character",
        "character_length",
        "check",
        "classifier",
        "clob",
        "close",
        "coalesce",
        "collate",
        "collect",
        "column",
        "commit",
        "condition",
        "connect",
        "constraint",
        "contains",
        "convert",
        "copy",
        "corr",
        "corresponding",
        "cos",
        "cosh",
        "count",
        "covar_pop",
        "covar_samp",
        "create",
        "cross",
        "cube",
        "cume_dist",
        "current",
        "current_catalog",
        "current_date",
        "current_default_transform_group",
        "current_path",
        "current_role",
        "current_row",
        "current_schema",
        "current_time",
        "current_timestamp",
        "current_path",
        "current_role",
        "current_transform_group_for_type",
        "current_user",
        "cursor",
        "cycle",
        "date",
        "day",
        "deallocate",
        "dec",
        "decimal",
        "decfloat",
        "declare",
        "default",
        "define",
        "delete",
        "dense_rank",
        "deref",
        "describe",
        "deterministic",
        "disconnect",
        "distinct",
        "double",
        "drop",
        "dynamic",
        "each",
        "element",
        "else",
        "empty",
        "end",
        "end_frame",
        "end_partition",
        "end-exec",
        "equals",
        "escape",
        "every",
        "except",
        "exec",
        "execute",
        "exists",
        "exp",
        "external",
        "extract",
        "false",
        "fetch",
        "filter",
        "first_value",
        "float",
        "floor",
        "for",
        "foreign",
        "frame_row",
        "free",
        "from",
        "full",
        "function",
        "fusion",
        "get",
        "global",
        "grant",
        "group",
        "grouping",
        "groups",
        "having",
        "hold",
        "hour",
        "identity",
        "in",
        "indicator",
        "initial",
        "inner",
        "inout",
        "insensitive",
        "insert",
        "int",
        "integer",
        "intersect",
        "intersection",
        "interval",
        "into",
        "is",
        "join",
        "json_array",
        "json_arrayagg",
        "json_exists",
        "json_object",
        "json_objectagg",
        "json_query",
        "json_table",
        "json_table_primitive",
        "json_value",
        "lag",
        "language",
        "large",
        "last_value",
        "lateral",
        "lead",
        "leading",
        "left",
        "like",
        "like_regex",
        "listagg",
        "ln",
        "local",
        "localtime",
        "localtimestamp",
        "log",
        "log10",
        "lower",
        "match",
        "match_number",
        "match_recognize",
        "matches",
        "max",
        "member",
        "merge",
        "method",
        "min",
        "minute",
        "mod",
        "modifies",
        "module",
        "month",
        "multiset",
        "national",
        "natural",
        "nchar",
        "nclob",
        "new",
        "no",
        "none",
        "normalize",
        "not",
        "nth_value",
        "ntile",
        "null",
        "nullif",
        "numeric",
        "octet_length",
        "occurrences_regex",
        "of",
        "offset",
        "old",
        "omit",
        "on",
        "one",
        "only",
        "open",
        "or",
        "order",
        "out",
        "outer",
        "over",
        "overlaps",
        "overlay",
        "parameter",
        "partition",
        "pattern",
        "per",
        "percent",
        "percent_rank",
        "percentile_cont",
        "percentile_disc",
        "period",
        "portion",
        "position",
        "position_regex",
        "power",
        "precedes",
        "precision",
        "prepare",
        "primary",
        "procedure",
        "ptf",
        "range",
        "rank",
        "reads",
        "real",
        "recursive",
        "ref",
        "references",
        "referencing",
        "regr_avgx",
        "regr_avgy",
        "regr_count",
        "regr_intercept",
        "regr_r2",
        "regr_slope",
        "regr_sxx",
        "regr_sxy",
        "regr_syy",
        "release",
        "result",
        "return",
        "returns",
        "revoke",
        "right",
        "rollback",
        "rollup",
        "row",
        "row_number",
        "rows",
        "running",
        "savepoint",
        "scope",
        "scroll",
        "search",
        "second",
        "seek",
        "select",
        "sensitive",
        "session_user",
        "set",
        "show",
        "similar",
        "sin",
        "sinh",
        "skip",
        "smallint",
        "some",
        "specific",
        "specifictype",
        "sql",
        "sqlexception",
        "sqlstate",
        "sqlwarning",
        "sqrt",
        "start",
        "static",
        "stddev_pop",
        "stddev_samp",
        "submultiset",
        "subset",
        "substring",
        "substring_regex",
        "succeeds",
        "sum",
        "symmetric",
        "system",
        "system_time",
        "system_user",
        "table",
        "tablesample",
        "tan",
        "tanh",
        "then",
        "time",
        "timestamp",
        "timezone_hour",
        "timezone_minute",
        "to",
        "trailing",
        "translate",
        "translate_regex",
        "translation",
        "treat",
        "trigger",
        "trim",
        "trim_array",
        "true",
        "truncate",
        "uescape",
        "union",
        "unique",
        "unknown",
        "unnest",
        "update",
        "upper",
        "user",
        "using",
        "value",
        "values",
        "value_of",
        "var_pop",
        "var_samp",
        "varbinary",
        "varchar",
        "varying",
        "versioning",
        "when",
        "whenever",
        "where",
        "width_bucket",
        "window",
        "with",
        "within",
        "without",
        "year",
      ];
      const RESERVED_FUNCTIONS = [
        "abs",
        "acos",
        "array_agg",
        "asin",
        "atan",
        "avg",
        "cast",
        "ceil",
        "ceiling",
        "coalesce",
        "corr",
        "cos",
        "cosh",
        "count",
        "covar_pop",
        "covar_samp",
        "cume_dist",
        "dense_rank",
        "deref",
        "element",
        "exp",
        "extract",
        "first_value",
        "floor",
        "json_array",
        "json_arrayagg",
        "json_exists",
        "json_object",
        "json_objectagg",
        "json_query",
        "json_table",
        "json_table_primitive",
        "json_value",
        "lag",
        "last_value",
        "lead",
        "listagg",
        "ln",
        "log",
        "log10",
        "lower",
        "max",
        "min",
        "mod",
        "nth_value",
        "ntile",
        "nullif",
        "percent_rank",
        "percentile_cont",
        "percentile_disc",
        "position",
        "position_regex",
        "power",
        "rank",
        "regr_avgx",
        "regr_avgy",
        "regr_count",
        "regr_intercept",
        "regr_r2",
        "regr_slope",
        "regr_sxx",
        "regr_sxy",
        "regr_syy",
        "row_number",
        "sin",
        "sinh",
        "sqrt",
        "stddev_pop",
        "stddev_samp",
        "substring",
        "substring_regex",
        "sum",
        "tan",
        "tanh",
        "translate",
        "translate_regex",
        "treat",
        "trim",
        "trim_array",
        "unnest",
        "upper",
        "value_of",
        "var_pop",
        "var_samp",
        "width_bucket",
      ];
      const POSSIBLE_WITHOUT_PARENS = [
        "current_catalog",
        "current_date",
        "current_default_transform_group",
        "current_path",
        "current_role",
        "current_schema",
        "current_transform_group_for_type",
        "current_user",
        "session_user",
        "system_time",
        "system_user",
        "current_time",
        "localtime",
        "current_timestamp",
        "localtimestamp"
      ];
      const COMBOS = [
        "create table",
        "insert into",
        "primary key",
        "foreign key",
        "not null",
        "alter table",
        "add constraint",
        "grouping sets",
        "on overflow",
        "character set",
        "respect nulls",
        "ignore nulls",
        "nulls first",
        "nulls last",
        "depth first",
        "breadth first"
      ];
      const FUNCTIONS = RESERVED_FUNCTIONS;
      const KEYWORDS = [
        ...RESERVED_WORDS,
        ...NON_RESERVED_WORDS
      ].filter((keyword) => {
        return !RESERVED_FUNCTIONS.includes(keyword);
      });
      const VARIABLE = {
        className: "variable",
        begin: /@[a-z0-9]+/,
      };
      const OPERATOR = {
        className: "operator",
        begin: /[-+*/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?/,
        relevance: 0,
      };
      const FUNCTION_CALL = {
        begin: regex.concat(/\b/, regex.either(...FUNCTIONS), /\s*\(/),
        relevance: 0,
        keywords: { built_in: FUNCTIONS }
      };
      function reduceRelevancy(list, {
        exceptions, when
      } = {}) {
        const qualifyFn = when;
        exceptions = exceptions || [];
        return list.map((item) => {
          if (item.match(/\|\d+$/) || exceptions.includes(item)) {
            return item;
          } else if (qualifyFn(item)) {
            return `${item}|0`;
          } else {
            return item;
          }
        });
      }
      return {
        name: 'SQL',
        case_insensitive: true,
        illegal: /[{}]|<\//,
        keywords: {
          $pattern: /\b[\w\.]+/,
          keyword:
            reduceRelevancy(KEYWORDS, { when: (x) => x.length < 3 }),
          literal: LITERALS,
          type: TYPES,
          built_in: POSSIBLE_WITHOUT_PARENS
        },
        contains: [
          {
            begin: regex.either(...COMBOS),
            relevance: 0,
            keywords: {
              $pattern: /[\w\.]+/,
              keyword: KEYWORDS.concat(COMBOS),
              literal: LITERALS,
              type: TYPES
            },
          },
          {
            className: "type",
            begin: regex.either(...MULTI_WORD_TYPES)
          },
          FUNCTION_CALL,
          VARIABLE,
          STRING,
          QUOTED_IDENTIFIER,
          hljs.C_NUMBER_MODE,
          hljs.C_BLOCK_COMMENT_MODE,
          COMMENT_MODE,
          OPERATOR
        ]
      };
    }

    function source(re) {
      if (!re) return null;
      if (typeof re === "string") return re;
      return re.source;
    }
    function lookahead(re) {
      return concat('(?=', re, ')');
    }
    function concat(...args) {
      const joined = args.map((x) => source(x)).join("");
      return joined;
    }
    function stripOptionsFromArgs(args) {
      const opts = args[args.length - 1];
      if (typeof opts === 'object' && opts.constructor === Object) {
        args.splice(args.length - 1, 1);
        return opts;
      } else {
        return {};
      }
    }
    function either(...args) {
      const opts = stripOptionsFromArgs(args);
      const joined = '('
        + (opts.capture ? "" : "?:")
        + args.map((x) => source(x)).join("|") + ")";
      return joined;
    }
    const keywordWrapper = keyword => concat(
      /\b/,
      keyword,
      /\w$/.test(keyword) ? /\b/ : /\B/
    );
    const dotKeywords = [
      'Protocol',
      'Type'
    ].map(keywordWrapper);
    const optionalDotKeywords = [
      'init',
      'self'
    ].map(keywordWrapper);
    const keywordTypes = [
      'Any',
      'Self'
    ];
    const keywords = [
      'actor',
      'any',
      'associatedtype',
      'async',
      'await',
      /as\?/,
      /as!/,
      'as',
      'break',
      'case',
      'catch',
      'class',
      'continue',
      'convenience',
      'default',
      'defer',
      'deinit',
      'didSet',
      'distributed',
      'do',
      'dynamic',
      'else',
      'enum',
      'extension',
      'fallthrough',
      /fileprivate\(set\)/,
      'fileprivate',
      'final',
      'for',
      'func',
      'get',
      'guard',
      'if',
      'import',
      'indirect',
      'infix',
      /init\?/,
      /init!/,
      'inout',
      /internal\(set\)/,
      'internal',
      'in',
      'is',
      'isolated',
      'nonisolated',
      'lazy',
      'let',
      'mutating',
      'nonmutating',
      /open\(set\)/,
      'open',
      'operator',
      'optional',
      'override',
      'postfix',
      'precedencegroup',
      'prefix',
      /private\(set\)/,
      'private',
      'protocol',
      /public\(set\)/,
      'public',
      'repeat',
      'required',
      'rethrows',
      'return',
      'set',
      'some',
      'static',
      'struct',
      'subscript',
      'super',
      'switch',
      'throws',
      'throw',
      /try\?/,
      /try!/,
      'try',
      'typealias',
      /unowned\(safe\)/,
      /unowned\(unsafe\)/,
      'unowned',
      'var',
      'weak',
      'where',
      'while',
      'willSet'
    ];
    const literals = [
      'false',
      'nil',
      'true'
    ];
    const precedencegroupKeywords = [
      'assignment',
      'associativity',
      'higherThan',
      'left',
      'lowerThan',
      'none',
      'right'
    ];
    const numberSignKeywords = [
      '#colorLiteral',
      '#column',
      '#dsohandle',
      '#else',
      '#elseif',
      '#endif',
      '#error',
      '#file',
      '#fileID',
      '#fileLiteral',
      '#filePath',
      '#function',
      '#if',
      '#imageLiteral',
      '#keyPath',
      '#line',
      '#selector',
      '#sourceLocation',
      '#warn_unqualified_access',
      '#warning'
    ];
    const builtIns = [
      'abs',
      'all',
      'any',
      'assert',
      'assertionFailure',
      'debugPrint',
      'dump',
      'fatalError',
      'getVaList',
      'isKnownUniquelyReferenced',
      'max',
      'min',
      'numericCast',
      'pointwiseMax',
      'pointwiseMin',
      'precondition',
      'preconditionFailure',
      'print',
      'readLine',
      'repeatElement',
      'sequence',
      'stride',
      'swap',
      'swift_unboxFromSwiftValueWithType',
      'transcode',
      'type',
      'unsafeBitCast',
      'unsafeDowncast',
      'withExtendedLifetime',
      'withUnsafeMutablePointer',
      'withUnsafePointer',
      'withVaList',
      'withoutActuallyEscaping',
      'zip'
    ];
    const operatorHead = either(
      /[/=\-+!*%<>&|^~?]/,
      /[\u00A1-\u00A7]/,
      /[\u00A9\u00AB]/,
      /[\u00AC\u00AE]/,
      /[\u00B0\u00B1]/,
      /[\u00B6\u00BB\u00BF\u00D7\u00F7]/,
      /[\u2016-\u2017]/,
      /[\u2020-\u2027]/,
      /[\u2030-\u203E]/,
      /[\u2041-\u2053]/,
      /[\u2055-\u205E]/,
      /[\u2190-\u23FF]/,
      /[\u2500-\u2775]/,
      /[\u2794-\u2BFF]/,
      /[\u2E00-\u2E7F]/,
      /[\u3001-\u3003]/,
      /[\u3008-\u3020]/,
      /[\u3030]/
    );
    const operatorCharacter = either(
      operatorHead,
      /[\u0300-\u036F]/,
      /[\u1DC0-\u1DFF]/,
      /[\u20D0-\u20FF]/,
      /[\uFE00-\uFE0F]/,
      /[\uFE20-\uFE2F]/
    );
    const operator = concat(operatorHead, operatorCharacter, '*');
    const identifierHead = either(
      /[a-zA-Z_]/,
      /[\u00A8\u00AA\u00AD\u00AF\u00B2-\u00B5\u00B7-\u00BA]/,
      /[\u00BC-\u00BE\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF]/,
      /[\u0100-\u02FF\u0370-\u167F\u1681-\u180D\u180F-\u1DBF]/,
      /[\u1E00-\u1FFF]/,
      /[\u200B-\u200D\u202A-\u202E\u203F-\u2040\u2054\u2060-\u206F]/,
      /[\u2070-\u20CF\u2100-\u218F\u2460-\u24FF\u2776-\u2793]/,
      /[\u2C00-\u2DFF\u2E80-\u2FFF]/,
      /[\u3004-\u3007\u3021-\u302F\u3031-\u303F\u3040-\uD7FF]/,
      /[\uF900-\uFD3D\uFD40-\uFDCF\uFDF0-\uFE1F\uFE30-\uFE44]/,
      /[\uFE47-\uFEFE\uFF00-\uFFFD]/
    );
    const identifierCharacter = either(
      identifierHead,
      /\d/,
      /[\u0300-\u036F\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]/
    );
    const identifier = concat(identifierHead, identifierCharacter, '*');
    const typeIdentifier = concat(/[A-Z]/, identifierCharacter, '*');
    const keywordAttributes = [
      'autoclosure',
      concat(/convention\(/, either('swift', 'block', 'c'), /\)/),
      'discardableResult',
      'dynamicCallable',
      'dynamicMemberLookup',
      'escaping',
      'frozen',
      'GKInspectable',
      'IBAction',
      'IBDesignable',
      'IBInspectable',
      'IBOutlet',
      'IBSegueAction',
      'inlinable',
      'main',
      'nonobjc',
      'NSApplicationMain',
      'NSCopying',
      'NSManaged',
      concat(/objc\(/, identifier, /\)/),
      'objc',
      'objcMembers',
      'propertyWrapper',
      'requires_stored_property_inits',
      'resultBuilder',
      'testable',
      'UIApplicationMain',
      'unknown',
      'usableFromInline'
    ];
    const availabilityKeywords = [
      'iOS',
      'iOSApplicationExtension',
      'macOS',
      'macOSApplicationExtension',
      'macCatalyst',
      'macCatalystApplicationExtension',
      'watchOS',
      'watchOSApplicationExtension',
      'tvOS',
      'tvOSApplicationExtension',
      'swift'
    ];
    function swift(hljs) {
      const WHITESPACE = {
        match: /\s+/,
        relevance: 0
      };
      const BLOCK_COMMENT = hljs.COMMENT(
        '/\\*',
        '\\*/',
        { contains: [ 'self' ] }
      );
      const COMMENTS = [
        hljs.C_LINE_COMMENT_MODE,
        BLOCK_COMMENT
      ];
      const DOT_KEYWORD = {
        match: [
          /\./,
          either(...dotKeywords, ...optionalDotKeywords)
        ],
        className: { 2: "keyword" }
      };
      const KEYWORD_GUARD = {
        match: concat(/\./, either(...keywords)),
        relevance: 0
      };
      const PLAIN_KEYWORDS = keywords
        .filter(kw => typeof kw === 'string')
        .concat([ "_|0" ]);
      const REGEX_KEYWORDS = keywords
        .filter(kw => typeof kw !== 'string')
        .concat(keywordTypes)
        .map(keywordWrapper);
      const KEYWORD = { variants: [
        {
          className: 'keyword',
          match: either(...REGEX_KEYWORDS, ...optionalDotKeywords)
        }
      ] };
      const KEYWORDS = {
        $pattern: either(
          /\b\w+/,
          /#\w+/
        ),
        keyword: PLAIN_KEYWORDS
          .concat(numberSignKeywords),
        literal: literals
      };
      const KEYWORD_MODES = [
        DOT_KEYWORD,
        KEYWORD_GUARD,
        KEYWORD
      ];
      const BUILT_IN_GUARD = {
        match: concat(/\./, either(...builtIns)),
        relevance: 0
      };
      const BUILT_IN = {
        className: 'built_in',
        match: concat(/\b/, either(...builtIns), /(?=\()/)
      };
      const BUILT_INS = [
        BUILT_IN_GUARD,
        BUILT_IN
      ];
      const OPERATOR_GUARD = {
        match: /->/,
        relevance: 0
      };
      const OPERATOR = {
        className: 'operator',
        relevance: 0,
        variants: [
          { match: operator },
          {
            match: `\\.(\\.|${operatorCharacter})+` }
        ]
      };
      const OPERATORS = [
        OPERATOR_GUARD,
        OPERATOR
      ];
      const decimalDigits = '([0-9]_*)+';
      const hexDigits = '([0-9a-fA-F]_*)+';
      const NUMBER = {
        className: 'number',
        relevance: 0,
        variants: [
          { match: `\\b(${decimalDigits})(\\.(${decimalDigits}))?` + `([eE][+-]?(${decimalDigits}))?\\b` },
          { match: `\\b0x(${hexDigits})(\\.(${hexDigits}))?` + `([pP][+-]?(${decimalDigits}))?\\b` },
          { match: /\b0o([0-7]_*)+\b/ },
          { match: /\b0b([01]_*)+\b/ }
        ]
      };
      const ESCAPED_CHARACTER = (rawDelimiter = "") => ({
        className: 'subst',
        variants: [
          { match: concat(/\\/, rawDelimiter, /[0\\tnr"']/) },
          { match: concat(/\\/, rawDelimiter, /u\{[0-9a-fA-F]{1,8}\}/) }
        ]
      });
      const ESCAPED_NEWLINE = (rawDelimiter = "") => ({
        className: 'subst',
        match: concat(/\\/, rawDelimiter, /[\t ]*(?:[\r\n]|\r\n)/)
      });
      const INTERPOLATION = (rawDelimiter = "") => ({
        className: 'subst',
        label: "interpol",
        begin: concat(/\\/, rawDelimiter, /\(/),
        end: /\)/
      });
      const MULTILINE_STRING = (rawDelimiter = "") => ({
        begin: concat(rawDelimiter, /"""/),
        end: concat(/"""/, rawDelimiter),
        contains: [
          ESCAPED_CHARACTER(rawDelimiter),
          ESCAPED_NEWLINE(rawDelimiter),
          INTERPOLATION(rawDelimiter)
        ]
      });
      const SINGLE_LINE_STRING = (rawDelimiter = "") => ({
        begin: concat(rawDelimiter, /"/),
        end: concat(/"/, rawDelimiter),
        contains: [
          ESCAPED_CHARACTER(rawDelimiter),
          INTERPOLATION(rawDelimiter)
        ]
      });
      const STRING = {
        className: 'string',
        variants: [
          MULTILINE_STRING(),
          MULTILINE_STRING("#"),
          MULTILINE_STRING("##"),
          MULTILINE_STRING("###"),
          SINGLE_LINE_STRING(),
          SINGLE_LINE_STRING("#"),
          SINGLE_LINE_STRING("##"),
          SINGLE_LINE_STRING("###")
        ]
      };
      const QUOTED_IDENTIFIER = { match: concat(/`/, identifier, /`/) };
      const IMPLICIT_PARAMETER = {
        className: 'variable',
        match: /\$\d+/
      };
      const PROPERTY_WRAPPER_PROJECTION = {
        className: 'variable',
        match: `\\$${identifierCharacter}+`
      };
      const IDENTIFIERS = [
        QUOTED_IDENTIFIER,
        IMPLICIT_PARAMETER,
        PROPERTY_WRAPPER_PROJECTION
      ];
      const AVAILABLE_ATTRIBUTE = {
        match: /(@|#(un)?)available/,
        className: "keyword",
        starts: { contains: [
          {
            begin: /\(/,
            end: /\)/,
            keywords: availabilityKeywords,
            contains: [
              ...OPERATORS,
              NUMBER,
              STRING
            ]
          }
        ] }
      };
      const KEYWORD_ATTRIBUTE = {
        className: 'keyword',
        match: concat(/@/, either(...keywordAttributes))
      };
      const USER_DEFINED_ATTRIBUTE = {
        className: 'meta',
        match: concat(/@/, identifier)
      };
      const ATTRIBUTES = [
        AVAILABLE_ATTRIBUTE,
        KEYWORD_ATTRIBUTE,
        USER_DEFINED_ATTRIBUTE
      ];
      const TYPE = {
        match: lookahead(/\b[A-Z]/),
        relevance: 0,
        contains: [
          {
            className: 'type',
            match: concat(/(AV|CA|CF|CG|CI|CL|CM|CN|CT|MK|MP|MTK|MTL|NS|SCN|SK|UI|WK|XC)/, identifierCharacter, '+')
          },
          {
            className: 'type',
            match: typeIdentifier,
            relevance: 0
          },
          {
            match: /[?!]+/,
            relevance: 0
          },
          {
            match: /\.\.\./,
            relevance: 0
          },
          {
            match: concat(/\s+&\s+/, lookahead(typeIdentifier)),
            relevance: 0
          }
        ]
      };
      const GENERIC_ARGUMENTS = {
        begin: /</,
        end: />/,
        keywords: KEYWORDS,
        contains: [
          ...COMMENTS,
          ...KEYWORD_MODES,
          ...ATTRIBUTES,
          OPERATOR_GUARD,
          TYPE
        ]
      };
      TYPE.contains.push(GENERIC_ARGUMENTS);
      const TUPLE_ELEMENT_NAME = {
        match: concat(identifier, /\s*:/),
        keywords: "_|0",
        relevance: 0
      };
      const TUPLE = {
        begin: /\(/,
        end: /\)/,
        relevance: 0,
        keywords: KEYWORDS,
        contains: [
          'self',
          TUPLE_ELEMENT_NAME,
          ...COMMENTS,
          ...KEYWORD_MODES,
          ...BUILT_INS,
          ...OPERATORS,
          NUMBER,
          STRING,
          ...IDENTIFIERS,
          ...ATTRIBUTES,
          TYPE
        ]
      };
      const GENERIC_PARAMETERS = {
        begin: /</,
        end: />/,
        contains: [
          ...COMMENTS,
          TYPE
        ]
      };
      const FUNCTION_PARAMETER_NAME = {
        begin: either(
          lookahead(concat(identifier, /\s*:/)),
          lookahead(concat(identifier, /\s+/, identifier, /\s*:/))
        ),
        end: /:/,
        relevance: 0,
        contains: [
          {
            className: 'keyword',
            match: /\b_\b/
          },
          {
            className: 'params',
            match: identifier
          }
        ]
      };
      const FUNCTION_PARAMETERS = {
        begin: /\(/,
        end: /\)/,
        keywords: KEYWORDS,
        contains: [
          FUNCTION_PARAMETER_NAME,
          ...COMMENTS,
          ...KEYWORD_MODES,
          ...OPERATORS,
          NUMBER,
          STRING,
          ...ATTRIBUTES,
          TYPE,
          TUPLE
        ],
        endsParent: true,
        illegal: /["']/
      };
      const FUNCTION = {
        match: [
          /func/,
          /\s+/,
          either(QUOTED_IDENTIFIER.match, identifier, operator)
        ],
        className: {
          1: "keyword",
          3: "title.function"
        },
        contains: [
          GENERIC_PARAMETERS,
          FUNCTION_PARAMETERS,
          WHITESPACE
        ],
        illegal: [
          /\[/,
          /%/
        ]
      };
      const INIT_SUBSCRIPT = {
        match: [
          /\b(?:subscript|init[?!]?)/,
          /\s*(?=[<(])/,
        ],
        className: { 1: "keyword" },
        contains: [
          GENERIC_PARAMETERS,
          FUNCTION_PARAMETERS,
          WHITESPACE
        ],
        illegal: /\[|%/
      };
      const OPERATOR_DECLARATION = {
        match: [
          /operator/,
          /\s+/,
          operator
        ],
        className: {
          1: "keyword",
          3: "title"
        }
      };
      const PRECEDENCEGROUP = {
        begin: [
          /precedencegroup/,
          /\s+/,
          typeIdentifier
        ],
        className: {
          1: "keyword",
          3: "title"
        },
        contains: [ TYPE ],
        keywords: [
          ...precedencegroupKeywords,
          ...literals
        ],
        end: /}/
      };
      for (const variant of STRING.variants) {
        const interpolation = variant.contains.find(mode => mode.label === "interpol");
        interpolation.keywords = KEYWORDS;
        const submodes = [
          ...KEYWORD_MODES,
          ...BUILT_INS,
          ...OPERATORS,
          NUMBER,
          STRING,
          ...IDENTIFIERS
        ];
        interpolation.contains = [
          ...submodes,
          {
            begin: /\(/,
            end: /\)/,
            contains: [
              'self',
              ...submodes
            ]
          }
        ];
      }
      return {
        name: 'Swift',
        keywords: KEYWORDS,
        contains: [
          ...COMMENTS,
          FUNCTION,
          INIT_SUBSCRIPT,
          {
            beginKeywords: 'struct protocol class extension enum actor',
            end: '\\{',
            excludeEnd: true,
            keywords: KEYWORDS,
            contains: [
              hljs.inherit(hljs.TITLE_MODE, {
                className: "title.class",
                begin: /[A-Za-z$_][\u00C0-\u02B80-9A-Za-z$_]*/
              }),
              ...KEYWORD_MODES
            ]
          },
          OPERATOR_DECLARATION,
          PRECEDENCEGROUP,
          {
            beginKeywords: 'import',
            end: /$/,
            contains: [ ...COMMENTS ],
            relevance: 0
          },
          ...KEYWORD_MODES,
          ...BUILT_INS,
          ...OPERATORS,
          NUMBER,
          STRING,
          ...IDENTIFIERS,
          ...ATTRIBUTES,
          TYPE,
          TUPLE
        ]
      };
    }

    const IDENT_RE = '[A-Za-z$_][0-9A-Za-z$_]*';
    const KEYWORDS = [
      "as",
      "in",
      "of",
      "if",
      "for",
      "while",
      "finally",
      "var",
      "new",
      "function",
      "do",
      "return",
      "void",
      "else",
      "break",
      "catch",
      "instanceof",
      "with",
      "throw",
      "case",
      "default",
      "try",
      "switch",
      "continue",
      "typeof",
      "delete",
      "let",
      "yield",
      "const",
      "class",
      "debugger",
      "async",
      "await",
      "static",
      "import",
      "from",
      "export",
      "extends"
    ];
    const LITERALS = [
      "true",
      "false",
      "null",
      "undefined",
      "NaN",
      "Infinity"
    ];
    const TYPES = [
      "Object",
      "Function",
      "Boolean",
      "Symbol",
      "Math",
      "Date",
      "Number",
      "BigInt",
      "String",
      "RegExp",
      "Array",
      "Float32Array",
      "Float64Array",
      "Int8Array",
      "Uint8Array",
      "Uint8ClampedArray",
      "Int16Array",
      "Int32Array",
      "Uint16Array",
      "Uint32Array",
      "BigInt64Array",
      "BigUint64Array",
      "Set",
      "Map",
      "WeakSet",
      "WeakMap",
      "ArrayBuffer",
      "SharedArrayBuffer",
      "Atomics",
      "DataView",
      "JSON",
      "Promise",
      "Generator",
      "GeneratorFunction",
      "AsyncFunction",
      "Reflect",
      "Proxy",
      "Intl",
      "WebAssembly"
    ];
    const ERROR_TYPES = [
      "Error",
      "EvalError",
      "InternalError",
      "RangeError",
      "ReferenceError",
      "SyntaxError",
      "TypeError",
      "URIError"
    ];
    const BUILT_IN_GLOBALS = [
      "setInterval",
      "setTimeout",
      "clearInterval",
      "clearTimeout",
      "require",
      "exports",
      "eval",
      "isFinite",
      "isNaN",
      "parseFloat",
      "parseInt",
      "decodeURI",
      "decodeURIComponent",
      "encodeURI",
      "encodeURIComponent",
      "escape",
      "unescape"
    ];
    const BUILT_IN_VARIABLES = [
      "arguments",
      "this",
      "super",
      "console",
      "window",
      "document",
      "localStorage",
      "module",
      "global"
    ];
    const BUILT_INS = [].concat(
      BUILT_IN_GLOBALS,
      TYPES,
      ERROR_TYPES
    );
    function javascript(hljs) {
      const regex = hljs.regex;
      const hasClosingTag = (match, { after }) => {
        const tag = "</" + match[0].slice(1);
        const pos = match.input.indexOf(tag, after);
        return pos !== -1;
      };
      const IDENT_RE$1 = IDENT_RE;
      const FRAGMENT = {
        begin: '<>',
        end: '</>'
      };
      const XML_SELF_CLOSING = /<[A-Za-z0-9\\._:-]+\s*\/>/;
      const XML_TAG = {
        begin: /<[A-Za-z0-9\\._:-]+/,
        end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
        isTrulyOpeningTag: (match, response) => {
          const afterMatchIndex = match[0].length + match.index;
          const nextChar = match.input[afterMatchIndex];
          if (
            nextChar === "<" ||
            nextChar === ",") {
            response.ignoreMatch();
            return;
          }
          if (nextChar === ">") {
            if (!hasClosingTag(match, { after: afterMatchIndex })) {
              response.ignoreMatch();
            }
          }
          let m;
          const afterMatch = match.input.substring(afterMatchIndex);
          if ((m = afterMatch.match(/^\s+extends\s+/))) {
            if (m.index === 0) {
              response.ignoreMatch();
              return;
            }
          }
        }
      };
      const KEYWORDS$1 = {
        $pattern: IDENT_RE,
        keyword: KEYWORDS,
        literal: LITERALS,
        built_in: BUILT_INS,
        "variable.language": BUILT_IN_VARIABLES
      };
      const decimalDigits = '[0-9](_?[0-9])*';
      const frac = `\\.(${decimalDigits})`;
      const decimalInteger = `0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*`;
      const NUMBER = {
        className: 'number',
        variants: [
          { begin: `(\\b(${decimalInteger})((${frac})|\\.)?|(${frac}))` +
            `[eE][+-]?(${decimalDigits})\\b` },
          { begin: `\\b(${decimalInteger})\\b((${frac})\\b|\\.)?|(${frac})\\b` },
          { begin: `\\b(0|[1-9](_?[0-9])*)n\\b` },
          { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
          { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
          { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
          { begin: "\\b0[0-7]+n?\\b" },
        ],
        relevance: 0
      };
      const SUBST = {
        className: 'subst',
        begin: '\\$\\{',
        end: '\\}',
        keywords: KEYWORDS$1,
        contains: []
      };
      const HTML_TEMPLATE = {
        begin: 'html`',
        end: '',
        starts: {
          end: '`',
          returnEnd: false,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            SUBST
          ],
          subLanguage: 'xml'
        }
      };
      const CSS_TEMPLATE = {
        begin: 'css`',
        end: '',
        starts: {
          end: '`',
          returnEnd: false,
          contains: [
            hljs.BACKSLASH_ESCAPE,
            SUBST
          ],
          subLanguage: 'css'
        }
      };
      const TEMPLATE_STRING = {
        className: 'string',
        begin: '`',
        end: '`',
        contains: [
          hljs.BACKSLASH_ESCAPE,
          SUBST
        ]
      };
      const JSDOC_COMMENT = hljs.COMMENT(
        /\/\*\*(?!\/)/,
        '\\*/',
        {
          relevance: 0,
          contains: [
            {
              begin: '(?=@[A-Za-z]+)',
              relevance: 0,
              contains: [
                {
                  className: 'doctag',
                  begin: '@[A-Za-z]+'
                },
                {
                  className: 'type',
                  begin: '\\{',
                  end: '\\}',
                  excludeEnd: true,
                  excludeBegin: true,
                  relevance: 0
                },
                {
                  className: 'variable',
                  begin: IDENT_RE$1 + '(?=\\s*(-)|$)',
                  endsParent: true,
                  relevance: 0
                },
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      );
      const COMMENT = {
        className: "comment",
        variants: [
          JSDOC_COMMENT,
          hljs.C_BLOCK_COMMENT_MODE,
          hljs.C_LINE_COMMENT_MODE
        ]
      };
      const SUBST_INTERNALS = [
        hljs.APOS_STRING_MODE,
        hljs.QUOTE_STRING_MODE,
        HTML_TEMPLATE,
        CSS_TEMPLATE,
        TEMPLATE_STRING,
        NUMBER,
      ];
      SUBST.contains = SUBST_INTERNALS
        .concat({
          begin: /\{/,
          end: /\}/,
          keywords: KEYWORDS$1,
          contains: [
            "self"
          ].concat(SUBST_INTERNALS)
        });
      const SUBST_AND_COMMENTS = [].concat(COMMENT, SUBST.contains);
      const PARAMS_CONTAINS = SUBST_AND_COMMENTS.concat([
        {
          begin: /\(/,
          end: /\)/,
          keywords: KEYWORDS$1,
          contains: ["self"].concat(SUBST_AND_COMMENTS)
        }
      ]);
      const PARAMS = {
        className: 'params',
        begin: /\(/,
        end: /\)/,
        excludeBegin: true,
        excludeEnd: true,
        keywords: KEYWORDS$1,
        contains: PARAMS_CONTAINS
      };
      const CLASS_OR_EXTENDS = {
        variants: [
          {
            match: [
              /class/,
              /\s+/,
              IDENT_RE$1,
              /\s+/,
              /extends/,
              /\s+/,
              regex.concat(IDENT_RE$1, "(", regex.concat(/\./, IDENT_RE$1), ")*")
            ],
            scope: {
              1: "keyword",
              3: "title.class",
              5: "keyword",
              7: "title.class.inherited"
            }
          },
          {
            match: [
              /class/,
              /\s+/,
              IDENT_RE$1
            ],
            scope: {
              1: "keyword",
              3: "title.class"
            }
          },
        ]
      };
      const CLASS_REFERENCE = {
        relevance: 0,
        match:
        regex.either(
          /\bJSON/,
          /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
          /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
          /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/,
        ),
        className: "title.class",
        keywords: {
          _: [
            ...TYPES,
            ...ERROR_TYPES
          ]
        }
      };
      const USE_STRICT = {
        label: "use_strict",
        className: 'meta',
        relevance: 10,
        begin: /^\s*['"]use (strict|asm)['"]/
      };
      const FUNCTION_DEFINITION = {
        variants: [
          {
            match: [
              /function/,
              /\s+/,
              IDENT_RE$1,
              /(?=\s*\()/
            ]
          },
          {
            match: [
              /function/,
              /\s*(?=\()/
            ]
          }
        ],
        className: {
          1: "keyword",
          3: "title.function"
        },
        label: "func.def",
        contains: [ PARAMS ],
        illegal: /%/
      };
      const UPPER_CASE_CONSTANT = {
        relevance: 0,
        match: /\b[A-Z][A-Z_0-9]+\b/,
        className: "variable.constant"
      };
      function noneOf(list) {
        return regex.concat("(?!", list.join("|"), ")");
      }
      const FUNCTION_CALL = {
        match: regex.concat(
          /\b/,
          noneOf([
            ...BUILT_IN_GLOBALS,
            "super"
          ]),
          IDENT_RE$1, regex.lookahead(/\(/)),
        className: "title.function",
        relevance: 0
      };
      const PROPERTY_ACCESS = {
        begin: regex.concat(/\./, regex.lookahead(
          regex.concat(IDENT_RE$1, /(?![0-9A-Za-z$_(])/)
        )),
        end: IDENT_RE$1,
        excludeBegin: true,
        keywords: "prototype",
        className: "property",
        relevance: 0
      };
      const GETTER_OR_SETTER = {
        match: [
          /get|set/,
          /\s+/,
          IDENT_RE$1,
          /(?=\()/
        ],
        className: {
          1: "keyword",
          3: "title.function"
        },
        contains: [
          {
            begin: /\(\)/
          },
          PARAMS
        ]
      };
      const FUNC_LEAD_IN_RE = '(\\(' +
        '[^()]*(\\(' +
        '[^()]*(\\(' +
        '[^()]*' +
        '\\)[^()]*)*' +
        '\\)[^()]*)*' +
        '\\)|' + hljs.UNDERSCORE_IDENT_RE + ')\\s*=>';
      const FUNCTION_VARIABLE = {
        match: [
          /const|var|let/, /\s+/,
          IDENT_RE$1, /\s*/,
          /=\s*/,
          /(async\s*)?/,
          regex.lookahead(FUNC_LEAD_IN_RE)
        ],
        keywords: "async",
        className: {
          1: "keyword",
          3: "title.function"
        },
        contains: [
          PARAMS
        ]
      };
      return {
        name: 'Javascript',
        aliases: ['js', 'jsx', 'mjs', 'cjs'],
        keywords: KEYWORDS$1,
        exports: { PARAMS_CONTAINS, CLASS_REFERENCE },
        illegal: /#(?![$_A-z])/,
        contains: [
          hljs.SHEBANG({
            label: "shebang",
            binary: "node",
            relevance: 5
          }),
          USE_STRICT,
          hljs.APOS_STRING_MODE,
          hljs.QUOTE_STRING_MODE,
          HTML_TEMPLATE,
          CSS_TEMPLATE,
          TEMPLATE_STRING,
          COMMENT,
          NUMBER,
          CLASS_REFERENCE,
          {
            className: 'attr',
            begin: IDENT_RE$1 + regex.lookahead(':'),
            relevance: 0
          },
          FUNCTION_VARIABLE,
          {
            begin: '(' + hljs.RE_STARTERS_RE + '|\\b(case|return|throw)\\b)\\s*',
            keywords: 'return throw case',
            relevance: 0,
            contains: [
              COMMENT,
              hljs.REGEXP_MODE,
              {
                className: 'function',
                begin: FUNC_LEAD_IN_RE,
                returnBegin: true,
                end: '\\s*=>',
                contains: [
                  {
                    className: 'params',
                    variants: [
                      {
                        begin: hljs.UNDERSCORE_IDENT_RE,
                        relevance: 0
                      },
                      {
                        className: null,
                        begin: /\(\s*\)/,
                        skip: true
                      },
                      {
                        begin: /\(/,
                        end: /\)/,
                        excludeBegin: true,
                        excludeEnd: true,
                        keywords: KEYWORDS$1,
                        contains: PARAMS_CONTAINS
                      }
                    ]
                  }
                ]
              },
              {
                begin: /,/,
                relevance: 0
              },
              {
                match: /\s+/,
                relevance: 0
              },
              {
                variants: [
                  { begin: FRAGMENT.begin, end: FRAGMENT.end },
                  { match: XML_SELF_CLOSING },
                  {
                    begin: XML_TAG.begin,
                    'on:begin': XML_TAG.isTrulyOpeningTag,
                    end: XML_TAG.end
                  }
                ],
                subLanguage: 'xml',
                contains: [
                  {
                    begin: XML_TAG.begin,
                    end: XML_TAG.end,
                    skip: true,
                    contains: ['self']
                  }
                ]
              }
            ],
          },
          FUNCTION_DEFINITION,
          {
            beginKeywords: "while if switch catch for"
          },
          {
            begin: '\\b(?!function)' + hljs.UNDERSCORE_IDENT_RE +
              '\\(' +
              '[^()]*(\\(' +
                '[^()]*(\\(' +
                  '[^()]*' +
                '\\)[^()]*)*' +
              '\\)[^()]*)*' +
              '\\)\\s*\\{',
            returnBegin:true,
            label: "func.def",
            contains: [
              PARAMS,
              hljs.inherit(hljs.TITLE_MODE, { begin: IDENT_RE$1, className: "title.function" })
            ]
          },
          {
            match: /\.\.\./,
            relevance: 0
          },
          PROPERTY_ACCESS,
          {
            match: '\\$' + IDENT_RE$1,
            relevance: 0
          },
          {
            match: [ /\bconstructor(?=\s*\()/ ],
            className: { 1: "title.function" },
            contains: [ PARAMS ]
          },
          FUNCTION_CALL,
          UPPER_CASE_CONSTANT,
          CLASS_OR_EXTENDS,
          GETTER_OR_SETTER,
          {
            match: /\$[(.]/
          }
        ]
      };
    }
    function typescript(hljs) {
      const tsLanguage = javascript(hljs);
      const IDENT_RE$1 = IDENT_RE;
      const TYPES = [
        "any",
        "void",
        "number",
        "boolean",
        "string",
        "object",
        "never",
        "symbol",
        "bigint",
        "unknown"
      ];
      const NAMESPACE = {
        beginKeywords: 'namespace',
        end: /\{/,
        excludeEnd: true,
        contains: [ tsLanguage.exports.CLASS_REFERENCE ]
      };
      const INTERFACE = {
        beginKeywords: 'interface',
        end: /\{/,
        excludeEnd: true,
        keywords: {
          keyword: 'interface extends',
          built_in: TYPES
        },
        contains: [ tsLanguage.exports.CLASS_REFERENCE ]
      };
      const USE_STRICT = {
        className: 'meta',
        relevance: 10,
        begin: /^\s*['"]use strict['"]/
      };
      const TS_SPECIFIC_KEYWORDS = [
        "type",
        "namespace",
        "interface",
        "public",
        "private",
        "protected",
        "implements",
        "declare",
        "abstract",
        "readonly",
        "enum",
        "override"
      ];
      const KEYWORDS$1 = {
        $pattern: IDENT_RE,
        keyword: KEYWORDS.concat(TS_SPECIFIC_KEYWORDS),
        literal: LITERALS,
        built_in: BUILT_INS.concat(TYPES),
        "variable.language": BUILT_IN_VARIABLES
      };
      const DECORATOR = {
        className: 'meta',
        begin: '@' + IDENT_RE$1,
      };
      const swapMode = (mode, label, replacement) => {
        const indx = mode.contains.findIndex(m => m.label === label);
        if (indx === -1) { throw new Error("can not find mode to replace"); }
        mode.contains.splice(indx, 1, replacement);
      };
      Object.assign(tsLanguage.keywords, KEYWORDS$1);
      tsLanguage.exports.PARAMS_CONTAINS.push(DECORATOR);
      tsLanguage.contains = tsLanguage.contains.concat([
        DECORATOR,
        NAMESPACE,
        INTERFACE,
      ]);
      swapMode(tsLanguage, "shebang", hljs.SHEBANG());
      swapMode(tsLanguage, "use_strict", USE_STRICT);
      const functionDeclaration = tsLanguage.contains.find(m => m.label === "func.def");
      functionDeclaration.relevance = 0;
      Object.assign(tsLanguage, {
        name: 'TypeScript',
        aliases: [
          'ts',
          'tsx'
        ]
      });
      return tsLanguage;
    }

    function yaml(hljs) {
      const LITERALS = 'true false yes no null';
      const URI_CHARACTERS = '[\\w#;/?:@&=+$,.~*\'()[\\]]+';
      const KEY = {
        className: 'attr',
        variants: [
          { begin: '\\w[\\w :\\/.-]*:(?=[ \t]|$)' },
          {
            begin: '"\\w[\\w :\\/.-]*":(?=[ \t]|$)' },
          {
            begin: '\'\\w[\\w :\\/.-]*\':(?=[ \t]|$)' }
        ]
      };
      const TEMPLATE_VARIABLES = {
        className: 'template-variable',
        variants: [
          {
            begin: /\{\{/,
            end: /\}\}/
          },
          {
            begin: /%\{/,
            end: /\}/
          }
        ]
      };
      const STRING = {
        className: 'string',
        relevance: 0,
        variants: [
          {
            begin: /'/,
            end: /'/
          },
          {
            begin: /"/,
            end: /"/
          },
          { begin: /\S+/ }
        ],
        contains: [
          hljs.BACKSLASH_ESCAPE,
          TEMPLATE_VARIABLES
        ]
      };
      const CONTAINER_STRING = hljs.inherit(STRING, { variants: [
        {
          begin: /'/,
          end: /'/
        },
        {
          begin: /"/,
          end: /"/
        },
        { begin: /[^\s,{}[\]]+/ }
      ] });
      const DATE_RE = '[0-9]{4}(-[0-9][0-9]){0,2}';
      const TIME_RE = '([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?';
      const FRACTION_RE = '(\\.[0-9]*)?';
      const ZONE_RE = '([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?';
      const TIMESTAMP = {
        className: 'number',
        begin: '\\b' + DATE_RE + TIME_RE + FRACTION_RE + ZONE_RE + '\\b'
      };
      const VALUE_CONTAINER = {
        end: ',',
        endsWithParent: true,
        excludeEnd: true,
        keywords: LITERALS,
        relevance: 0
      };
      const OBJECT = {
        begin: /\{/,
        end: /\}/,
        contains: [ VALUE_CONTAINER ],
        illegal: '\\n',
        relevance: 0
      };
      const ARRAY = {
        begin: '\\[',
        end: '\\]',
        contains: [ VALUE_CONTAINER ],
        illegal: '\\n',
        relevance: 0
      };
      const MODES = [
        KEY,
        {
          className: 'meta',
          begin: '^---\\s*$',
          relevance: 10
        },
        {
          className: 'string',
          begin: '[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*'
        },
        {
          begin: '<%[%=-]?',
          end: '[%-]?%>',
          subLanguage: 'ruby',
          excludeBegin: true,
          excludeEnd: true,
          relevance: 0
        },
        {
          className: 'type',
          begin: '!\\w+!' + URI_CHARACTERS
        },
        {
          className: 'type',
          begin: '!<' + URI_CHARACTERS + ">"
        },
        {
          className: 'type',
          begin: '!' + URI_CHARACTERS
        },
        {
          className: 'type',
          begin: '!!' + URI_CHARACTERS
        },
        {
          className: 'meta',
          begin: '&' + hljs.UNDERSCORE_IDENT_RE + '$'
        },
        {
          className: 'meta',
          begin: '\\*' + hljs.UNDERSCORE_IDENT_RE + '$'
        },
        {
          className: 'bullet',
          begin: '-(?=[ ]|$)',
          relevance: 0
        },
        hljs.HASH_COMMENT_MODE,
        {
          beginKeywords: LITERALS,
          keywords: { literal: LITERALS }
        },
        TIMESTAMP,
        {
          className: 'number',
          begin: hljs.C_NUMBER_RE + '\\b',
          relevance: 0
        },
        OBJECT,
        ARRAY,
        STRING
      ];
      const VALUE_MODES = [ ...MODES ];
      VALUE_MODES.pop();
      VALUE_MODES.push(CONTAINER_STRING);
      VALUE_CONTAINER.contains = VALUE_MODES;
      return {
        name: 'YAML',
        case_insensitive: true,
        aliases: [ 'yml' ],
        contains: MODES
      };
    }

    function toInteger(dirtyNumber) {
      if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
        return NaN;
      }
      var number = Number(dirtyNumber);
      if (isNaN(number)) {
        return number;
      }
      return number < 0 ? Math.ceil(number) : Math.floor(number);
    }

    function requiredArgs(required, args) {
      if (args.length < required) {
        throw new TypeError(required + ' argument' + (required > 1 ? 's' : '') + ' required, but only ' + args.length + ' present');
      }
    }

    function toDate(argument) {
      requiredArgs(1, arguments);
      var argStr = Object.prototype.toString.call(argument);
      if (argument instanceof Date || typeof argument === 'object' && argStr === '[object Date]') {
        return new Date(argument.getTime());
      } else if (typeof argument === 'number' || argStr === '[object Number]') {
        return new Date(argument);
      } else {
        if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
          console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#string-arguments");
          console.warn(new Error().stack);
        }
        return new Date(NaN);
      }
    }

    var defaultOptions = {};
    function getDefaultOptions() {
      return defaultOptions;
    }

    function getTimezoneOffsetInMilliseconds(date) {
      var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
      utcDate.setUTCFullYear(date.getFullYear());
      return date.getTime() - utcDate.getTime();
    }

    function compareAsc(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      var diff = dateLeft.getTime() - dateRight.getTime();
      if (diff < 0) {
        return -1;
      } else if (diff > 0) {
        return 1;
      } else {
        return diff;
      }
    }

    var millisecondsInMinute = 60000;
    var millisecondsInHour = 3600000;
    var millisecondsInSecond = 1000;

    function differenceInCalendarMonths(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      var yearDiff = dateLeft.getFullYear() - dateRight.getFullYear();
      var monthDiff = dateLeft.getMonth() - dateRight.getMonth();
      return yearDiff * 12 + monthDiff;
    }

    function differenceInMilliseconds(dateLeft, dateRight) {
      requiredArgs(2, arguments);
      return toDate(dateLeft).getTime() - toDate(dateRight).getTime();
    }

    var roundingMap = {
      ceil: Math.ceil,
      round: Math.round,
      floor: Math.floor,
      trunc: function (value) {
        return value < 0 ? Math.ceil(value) : Math.floor(value);
      }
    };
    var defaultRoundingMethod = 'trunc';
    function getRoundingMethod(method) {
      return method ? roundingMap[method] : roundingMap[defaultRoundingMethod];
    }

    function endOfDay(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      date.setHours(23, 59, 59, 999);
      return date;
    }

    function endOfMonth(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var month = date.getMonth();
      date.setFullYear(date.getFullYear(), month + 1, 0);
      date.setHours(23, 59, 59, 999);
      return date;
    }

    function isLastDayOfMonth(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      return endOfDay(date).getTime() === endOfMonth(date).getTime();
    }

    function differenceInMonths(dirtyDateLeft, dirtyDateRight) {
      requiredArgs(2, arguments);
      var dateLeft = toDate(dirtyDateLeft);
      var dateRight = toDate(dirtyDateRight);
      var sign = compareAsc(dateLeft, dateRight);
      var difference = Math.abs(differenceInCalendarMonths(dateLeft, dateRight));
      var result;
      if (difference < 1) {
        result = 0;
      } else {
        if (dateLeft.getMonth() === 1 && dateLeft.getDate() > 27) {
          dateLeft.setDate(30);
        }
        dateLeft.setMonth(dateLeft.getMonth() - sign * difference);
        var isLastMonthNotFull = compareAsc(dateLeft, dateRight) === -sign;
        if (isLastDayOfMonth(toDate(dirtyDateLeft)) && difference === 1 && compareAsc(dirtyDateLeft, dateRight) === 1) {
          isLastMonthNotFull = false;
        }
        result = sign * (difference - Number(isLastMonthNotFull));
      }
      return result === 0 ? 0 : result;
    }

    function differenceInSeconds(dateLeft, dateRight, options) {
      requiredArgs(2, arguments);
      var diff = differenceInMilliseconds(dateLeft, dateRight) / 1000;
      return getRoundingMethod(options === null || options === void 0 ? void 0 : options.roundingMethod)(diff);
    }

    function startOfUTCISOWeek(dirtyDate) {
      requiredArgs(1, arguments);
      var weekStartsOn = 1;
      var date = toDate(dirtyDate);
      var day = date.getUTCDay();
      var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
      date.setUTCDate(date.getUTCDate() - diff);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }

    function getUTCISOWeekYear(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var year = date.getUTCFullYear();
      var fourthOfJanuaryOfNextYear = new Date(0);
      fourthOfJanuaryOfNextYear.setUTCFullYear(year + 1, 0, 4);
      fourthOfJanuaryOfNextYear.setUTCHours(0, 0, 0, 0);
      var startOfNextYear = startOfUTCISOWeek(fourthOfJanuaryOfNextYear);
      var fourthOfJanuaryOfThisYear = new Date(0);
      fourthOfJanuaryOfThisYear.setUTCFullYear(year, 0, 4);
      fourthOfJanuaryOfThisYear.setUTCHours(0, 0, 0, 0);
      var startOfThisYear = startOfUTCISOWeek(fourthOfJanuaryOfThisYear);
      if (date.getTime() >= startOfNextYear.getTime()) {
        return year + 1;
      } else if (date.getTime() >= startOfThisYear.getTime()) {
        return year;
      } else {
        return year - 1;
      }
    }

    function startOfUTCISOWeekYear(dirtyDate) {
      requiredArgs(1, arguments);
      var year = getUTCISOWeekYear(dirtyDate);
      var fourthOfJanuary = new Date(0);
      fourthOfJanuary.setUTCFullYear(year, 0, 4);
      fourthOfJanuary.setUTCHours(0, 0, 0, 0);
      var date = startOfUTCISOWeek(fourthOfJanuary);
      return date;
    }

    var MILLISECONDS_IN_WEEK$1 = 604800000;
    function getUTCISOWeek(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var diff = startOfUTCISOWeek(date).getTime() - startOfUTCISOWeekYear(date).getTime();
      return Math.round(diff / MILLISECONDS_IN_WEEK$1) + 1;
    }

    function startOfUTCWeek(dirtyDate, options) {
      var _ref, _ref2, _ref3, _options$weekStartsOn, _options$locale, _options$locale$optio, _defaultOptions$local, _defaultOptions$local2;
      requiredArgs(1, arguments);
      var defaultOptions = getDefaultOptions();
      var weekStartsOn = toInteger((_ref = (_ref2 = (_ref3 = (_options$weekStartsOn = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn !== void 0 ? _options$weekStartsOn : options === null || options === void 0 ? void 0 : (_options$locale = options.locale) === null || _options$locale === void 0 ? void 0 : (_options$locale$optio = _options$locale.options) === null || _options$locale$optio === void 0 ? void 0 : _options$locale$optio.weekStartsOn) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.weekStartsOn) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 ? void 0 : (_defaultOptions$local2 = _defaultOptions$local.options) === null || _defaultOptions$local2 === void 0 ? void 0 : _defaultOptions$local2.weekStartsOn) !== null && _ref !== void 0 ? _ref : 0);
      if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
        throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
      }
      var date = toDate(dirtyDate);
      var day = date.getUTCDay();
      var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
      date.setUTCDate(date.getUTCDate() - diff);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }

    function getUTCWeekYear(dirtyDate, options) {
      var _ref, _ref2, _ref3, _options$firstWeekCon, _options$locale, _options$locale$optio, _defaultOptions$local, _defaultOptions$local2;
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var year = date.getUTCFullYear();
      var defaultOptions = getDefaultOptions();
      var firstWeekContainsDate = toInteger((_ref = (_ref2 = (_ref3 = (_options$firstWeekCon = options === null || options === void 0 ? void 0 : options.firstWeekContainsDate) !== null && _options$firstWeekCon !== void 0 ? _options$firstWeekCon : options === null || options === void 0 ? void 0 : (_options$locale = options.locale) === null || _options$locale === void 0 ? void 0 : (_options$locale$optio = _options$locale.options) === null || _options$locale$optio === void 0 ? void 0 : _options$locale$optio.firstWeekContainsDate) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.firstWeekContainsDate) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 ? void 0 : (_defaultOptions$local2 = _defaultOptions$local.options) === null || _defaultOptions$local2 === void 0 ? void 0 : _defaultOptions$local2.firstWeekContainsDate) !== null && _ref !== void 0 ? _ref : 1);
      if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
        throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
      }
      var firstWeekOfNextYear = new Date(0);
      firstWeekOfNextYear.setUTCFullYear(year + 1, 0, firstWeekContainsDate);
      firstWeekOfNextYear.setUTCHours(0, 0, 0, 0);
      var startOfNextYear = startOfUTCWeek(firstWeekOfNextYear, options);
      var firstWeekOfThisYear = new Date(0);
      firstWeekOfThisYear.setUTCFullYear(year, 0, firstWeekContainsDate);
      firstWeekOfThisYear.setUTCHours(0, 0, 0, 0);
      var startOfThisYear = startOfUTCWeek(firstWeekOfThisYear, options);
      if (date.getTime() >= startOfNextYear.getTime()) {
        return year + 1;
      } else if (date.getTime() >= startOfThisYear.getTime()) {
        return year;
      } else {
        return year - 1;
      }
    }

    function startOfUTCWeekYear(dirtyDate, options) {
      var _ref, _ref2, _ref3, _options$firstWeekCon, _options$locale, _options$locale$optio, _defaultOptions$local, _defaultOptions$local2;
      requiredArgs(1, arguments);
      var defaultOptions = getDefaultOptions();
      var firstWeekContainsDate = toInteger((_ref = (_ref2 = (_ref3 = (_options$firstWeekCon = options === null || options === void 0 ? void 0 : options.firstWeekContainsDate) !== null && _options$firstWeekCon !== void 0 ? _options$firstWeekCon : options === null || options === void 0 ? void 0 : (_options$locale = options.locale) === null || _options$locale === void 0 ? void 0 : (_options$locale$optio = _options$locale.options) === null || _options$locale$optio === void 0 ? void 0 : _options$locale$optio.firstWeekContainsDate) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.firstWeekContainsDate) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 ? void 0 : (_defaultOptions$local2 = _defaultOptions$local.options) === null || _defaultOptions$local2 === void 0 ? void 0 : _defaultOptions$local2.firstWeekContainsDate) !== null && _ref !== void 0 ? _ref : 1);
      var year = getUTCWeekYear(dirtyDate, options);
      var firstWeek = new Date(0);
      firstWeek.setUTCFullYear(year, 0, firstWeekContainsDate);
      firstWeek.setUTCHours(0, 0, 0, 0);
      var date = startOfUTCWeek(firstWeek, options);
      return date;
    }

    var MILLISECONDS_IN_WEEK = 604800000;
    function getUTCWeek(dirtyDate, options) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var diff = startOfUTCWeek(date, options).getTime() - startOfUTCWeekYear(date, options).getTime();
      return Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
    }

    var formatDistanceLocale = {
      lessThanXSeconds: {
        one: 'less than a second',
        other: 'less than {{count}} seconds'
      },
      xSeconds: {
        one: '1 second',
        other: '{{count}} seconds'
      },
      halfAMinute: 'half a minute',
      lessThanXMinutes: {
        one: 'less than a minute',
        other: 'less than {{count}} minutes'
      },
      xMinutes: {
        one: '1 minute',
        other: '{{count}} minutes'
      },
      aboutXHours: {
        one: 'about 1 hour',
        other: 'about {{count}} hours'
      },
      xHours: {
        one: '1 hour',
        other: '{{count}} hours'
      },
      xDays: {
        one: '1 day',
        other: '{{count}} days'
      },
      aboutXWeeks: {
        one: 'about 1 week',
        other: 'about {{count}} weeks'
      },
      xWeeks: {
        one: '1 week',
        other: '{{count}} weeks'
      },
      aboutXMonths: {
        one: 'about 1 month',
        other: 'about {{count}} months'
      },
      xMonths: {
        one: '1 month',
        other: '{{count}} months'
      },
      aboutXYears: {
        one: 'about 1 year',
        other: 'about {{count}} years'
      },
      xYears: {
        one: '1 year',
        other: '{{count}} years'
      },
      overXYears: {
        one: 'over 1 year',
        other: 'over {{count}} years'
      },
      almostXYears: {
        one: 'almost 1 year',
        other: 'almost {{count}} years'
      }
    };
    var formatDistance$1 = function (token, count, options) {
      var result;
      var tokenValue = formatDistanceLocale[token];
      if (typeof tokenValue === 'string') {
        result = tokenValue;
      } else if (count === 1) {
        result = tokenValue.one;
      } else {
        result = tokenValue.other.replace('{{count}}', count.toString());
      }
      if (options !== null && options !== void 0 && options.addSuffix) {
        if (options.comparison && options.comparison > 0) {
          return 'in ' + result;
        } else {
          return result + ' ago';
        }
      }
      return result;
    };

    function buildFormatLongFn(args) {
      return function () {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        var width = options.width ? String(options.width) : args.defaultWidth;
        var format = args.formats[width] || args.formats[args.defaultWidth];
        return format;
      };
    }

    var dateFormats = {
      full: 'EEEE, MMMM do, y',
      long: 'MMMM do, y',
      medium: 'MMM d, y',
      short: 'MM/dd/yyyy'
    };
    var timeFormats = {
      full: 'h:mm:ss a zzzz',
      long: 'h:mm:ss a z',
      medium: 'h:mm:ss a',
      short: 'h:mm a'
    };
    var dateTimeFormats = {
      full: "{{date}} 'at' {{time}}",
      long: "{{date}} 'at' {{time}}",
      medium: '{{date}}, {{time}}',
      short: '{{date}}, {{time}}'
    };
    var formatLong = {
      date: buildFormatLongFn({
        formats: dateFormats,
        defaultWidth: 'full'
      }),
      time: buildFormatLongFn({
        formats: timeFormats,
        defaultWidth: 'full'
      }),
      dateTime: buildFormatLongFn({
        formats: dateTimeFormats,
        defaultWidth: 'full'
      })
    };

    var formatRelativeLocale = {
      lastWeek: "'last' eeee 'at' p",
      yesterday: "'yesterday at' p",
      today: "'today at' p",
      tomorrow: "'tomorrow at' p",
      nextWeek: "eeee 'at' p",
      other: 'P'
    };
    var formatRelative = function (token, _date, _baseDate, _options) {
      return formatRelativeLocale[token];
    };

    function buildLocalizeFn(args) {
      return function (dirtyIndex, options) {
        var context = options !== null && options !== void 0 && options.context ? String(options.context) : 'standalone';
        var valuesArray;
        if (context === 'formatting' && args.formattingValues) {
          var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
          var width = options !== null && options !== void 0 && options.width ? String(options.width) : defaultWidth;
          valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
        } else {
          var _defaultWidth = args.defaultWidth;
          var _width = options !== null && options !== void 0 && options.width ? String(options.width) : args.defaultWidth;
          valuesArray = args.values[_width] || args.values[_defaultWidth];
        }
        var index = args.argumentCallback ? args.argumentCallback(dirtyIndex) : dirtyIndex;
        return valuesArray[index];
      };
    }

    var eraValues = {
      narrow: ['B', 'A'],
      abbreviated: ['BC', 'AD'],
      wide: ['Before Christ', 'Anno Domini']
    };
    var quarterValues = {
      narrow: ['1', '2', '3', '4'],
      abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
      wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter']
    };
    var monthValues = {
      narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      abbreviated: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      wide: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var dayValues = {
      narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    var dayPeriodValues = {
      narrow: {
        am: 'a',
        pm: 'p',
        midnight: 'mi',
        noon: 'n',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      },
      abbreviated: {
        am: 'AM',
        pm: 'PM',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      },
      wide: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      }
    };
    var formattingDayPeriodValues = {
      narrow: {
        am: 'a',
        pm: 'p',
        midnight: 'mi',
        noon: 'n',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      },
      abbreviated: {
        am: 'AM',
        pm: 'PM',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      },
      wide: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      }
    };
    var ordinalNumber = function (dirtyNumber, _options) {
      var number = Number(dirtyNumber);
      var rem100 = number % 100;
      if (rem100 > 20 || rem100 < 10) {
        switch (rem100 % 10) {
          case 1:
            return number + 'st';
          case 2:
            return number + 'nd';
          case 3:
            return number + 'rd';
        }
      }
      return number + 'th';
    };
    var localize = {
      ordinalNumber: ordinalNumber,
      era: buildLocalizeFn({
        values: eraValues,
        defaultWidth: 'wide'
      }),
      quarter: buildLocalizeFn({
        values: quarterValues,
        defaultWidth: 'wide',
        argumentCallback: function (quarter) {
          return quarter - 1;
        }
      }),
      month: buildLocalizeFn({
        values: monthValues,
        defaultWidth: 'wide'
      }),
      day: buildLocalizeFn({
        values: dayValues,
        defaultWidth: 'wide'
      }),
      dayPeriod: buildLocalizeFn({
        values: dayPeriodValues,
        defaultWidth: 'wide',
        formattingValues: formattingDayPeriodValues,
        defaultFormattingWidth: 'wide'
      })
    };

    function buildMatchFn(args) {
      return function (string) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var width = options.width;
        var matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
        var matchResult = string.match(matchPattern);
        if (!matchResult) {
          return null;
        }
        var matchedString = matchResult[0];
        var parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
        var key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, function (pattern) {
          return pattern.test(matchedString);
        }) : findKey(parsePatterns, function (pattern) {
          return pattern.test(matchedString);
        });
        var value;
        value = args.valueCallback ? args.valueCallback(key) : key;
        value = options.valueCallback ? options.valueCallback(value) : value;
        var rest = string.slice(matchedString.length);
        return {
          value: value,
          rest: rest
        };
      };
    }
    function findKey(object, predicate) {
      for (var key in object) {
        if (object.hasOwnProperty(key) && predicate(object[key])) {
          return key;
        }
      }
      return undefined;
    }
    function findIndex(array, predicate) {
      for (var key = 0; key < array.length; key++) {
        if (predicate(array[key])) {
          return key;
        }
      }
      return undefined;
    }

    function buildMatchPatternFn(args) {
      return function (string) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var matchResult = string.match(args.matchPattern);
        if (!matchResult) return null;
        var matchedString = matchResult[0];
        var parseResult = string.match(args.parsePattern);
        if (!parseResult) return null;
        var value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
        value = options.valueCallback ? options.valueCallback(value) : value;
        var rest = string.slice(matchedString.length);
        return {
          value: value,
          rest: rest
        };
      };
    }

    var matchOrdinalNumberPattern = /^(\d+)(th|st|nd|rd)?/i;
    var parseOrdinalNumberPattern = /\d+/i;
    var matchEraPatterns = {
      narrow: /^(b|a)/i,
      abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
      wide: /^(before christ|before common era|anno domini|common era)/i
    };
    var parseEraPatterns = {
      any: [/^b/i, /^(a|c)/i]
    };
    var matchQuarterPatterns = {
      narrow: /^[1234]/i,
      abbreviated: /^q[1234]/i,
      wide: /^[1234](th|st|nd|rd)? quarter/i
    };
    var parseQuarterPatterns = {
      any: [/1/i, /2/i, /3/i, /4/i]
    };
    var matchMonthPatterns = {
      narrow: /^[jfmasond]/i,
      abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
    };
    var parseMonthPatterns = {
      narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
      any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
    };
    var matchDayPatterns = {
      narrow: /^[smtwf]/i,
      short: /^(su|mo|tu|we|th|fr|sa)/i,
      abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
      wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
    };
    var parseDayPatterns = {
      narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
      any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
    };
    var matchDayPeriodPatterns = {
      narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
      any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
    };
    var parseDayPeriodPatterns = {
      any: {
        am: /^a/i,
        pm: /^p/i,
        midnight: /^mi/i,
        noon: /^no/i,
        morning: /morning/i,
        afternoon: /afternoon/i,
        evening: /evening/i,
        night: /night/i
      }
    };
    var match = {
      ordinalNumber: buildMatchPatternFn({
        matchPattern: matchOrdinalNumberPattern,
        parsePattern: parseOrdinalNumberPattern,
        valueCallback: function (value) {
          return parseInt(value, 10);
        }
      }),
      era: buildMatchFn({
        matchPatterns: matchEraPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseEraPatterns,
        defaultParseWidth: 'any'
      }),
      quarter: buildMatchFn({
        matchPatterns: matchQuarterPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseQuarterPatterns,
        defaultParseWidth: 'any',
        valueCallback: function (index) {
          return index + 1;
        }
      }),
      month: buildMatchFn({
        matchPatterns: matchMonthPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseMonthPatterns,
        defaultParseWidth: 'any'
      }),
      day: buildMatchFn({
        matchPatterns: matchDayPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseDayPatterns,
        defaultParseWidth: 'any'
      }),
      dayPeriod: buildMatchFn({
        matchPatterns: matchDayPeriodPatterns,
        defaultMatchWidth: 'any',
        parsePatterns: parseDayPeriodPatterns,
        defaultParseWidth: 'any'
      })
    };

    var locale = {
      code: 'en-US',
      formatDistance: formatDistance$1,
      formatLong: formatLong,
      formatRelative: formatRelative,
      localize: localize,
      match: match,
      options: {
        weekStartsOn: 0
        ,
        firstWeekContainsDate: 1
      }
    };

    function assign(target, object) {
      if (target == null) {
        throw new TypeError('assign requires that input parameter not be null or undefined');
      }
      for (var property in object) {
        if (Object.prototype.hasOwnProperty.call(object, property)) {
          target[property] = object[property];
        }
      }
      return target;
    }

    function cloneObject(object) {
      return assign({}, object);
    }

    var MINUTES_IN_DAY = 1440;
    var MINUTES_IN_ALMOST_TWO_DAYS = 2520;
    var MINUTES_IN_MONTH = 43200;
    var MINUTES_IN_TWO_MONTHS = 86400;
    function formatDistance(dirtyDate, dirtyBaseDate, options) {
      var _ref, _options$locale;
      requiredArgs(2, arguments);
      var defaultOptions = getDefaultOptions();
      var locale$1 = (_ref = (_options$locale = options === null || options === void 0 ? void 0 : options.locale) !== null && _options$locale !== void 0 ? _options$locale : defaultOptions.locale) !== null && _ref !== void 0 ? _ref : locale;
      if (!locale$1.formatDistance) {
        throw new RangeError('locale must contain formatDistance property');
      }
      var comparison = compareAsc(dirtyDate, dirtyBaseDate);
      if (isNaN(comparison)) {
        throw new RangeError('Invalid time value');
      }
      var localizeOptions = assign(cloneObject(options), {
        addSuffix: Boolean(options === null || options === void 0 ? void 0 : options.addSuffix),
        comparison: comparison
      });
      var dateLeft;
      var dateRight;
      if (comparison > 0) {
        dateLeft = toDate(dirtyBaseDate);
        dateRight = toDate(dirtyDate);
      } else {
        dateLeft = toDate(dirtyDate);
        dateRight = toDate(dirtyBaseDate);
      }
      var seconds = differenceInSeconds(dateRight, dateLeft);
      var offsetInSeconds = (getTimezoneOffsetInMilliseconds(dateRight) - getTimezoneOffsetInMilliseconds(dateLeft)) / 1000;
      var minutes = Math.round((seconds - offsetInSeconds) / 60);
      var months;
      if (minutes < 2) {
        if (options !== null && options !== void 0 && options.includeSeconds) {
          if (seconds < 5) {
            return locale$1.formatDistance('lessThanXSeconds', 5, localizeOptions);
          } else if (seconds < 10) {
            return locale$1.formatDistance('lessThanXSeconds', 10, localizeOptions);
          } else if (seconds < 20) {
            return locale$1.formatDistance('lessThanXSeconds', 20, localizeOptions);
          } else if (seconds < 40) {
            return locale$1.formatDistance('halfAMinute', 0, localizeOptions);
          } else if (seconds < 60) {
            return locale$1.formatDistance('lessThanXMinutes', 1, localizeOptions);
          } else {
            return locale$1.formatDistance('xMinutes', 1, localizeOptions);
          }
        } else {
          if (minutes === 0) {
            return locale$1.formatDistance('lessThanXMinutes', 1, localizeOptions);
          } else {
            return locale$1.formatDistance('xMinutes', minutes, localizeOptions);
          }
        }
      } else if (minutes < 45) {
        return locale$1.formatDistance('xMinutes', minutes, localizeOptions);
      } else if (minutes < 90) {
        return locale$1.formatDistance('aboutXHours', 1, localizeOptions);
      } else if (minutes < MINUTES_IN_DAY) {
        var hours = Math.round(minutes / 60);
        return locale$1.formatDistance('aboutXHours', hours, localizeOptions);
      } else if (minutes < MINUTES_IN_ALMOST_TWO_DAYS) {
        return locale$1.formatDistance('xDays', 1, localizeOptions);
      } else if (minutes < MINUTES_IN_MONTH) {
        var days = Math.round(minutes / MINUTES_IN_DAY);
        return locale$1.formatDistance('xDays', days, localizeOptions);
      } else if (minutes < MINUTES_IN_TWO_MONTHS) {
        months = Math.round(minutes / MINUTES_IN_MONTH);
        return locale$1.formatDistance('aboutXMonths', months, localizeOptions);
      }
      months = differenceInMonths(dateRight, dateLeft);
      if (months < 12) {
        var nearestMonth = Math.round(minutes / MINUTES_IN_MONTH);
        return locale$1.formatDistance('xMonths', nearestMonth, localizeOptions);
      } else {
        var monthsSinceStartOfYear = months % 12;
        var years = Math.floor(months / 12);
        if (monthsSinceStartOfYear < 3) {
          return locale$1.formatDistance('aboutXYears', years, localizeOptions);
        } else if (monthsSinceStartOfYear < 9) {
          return locale$1.formatDistance('overXYears', years, localizeOptions);
        } else {
          return locale$1.formatDistance('almostXYears', years + 1, localizeOptions);
        }
      }
    }

    function formatDistanceToNow(dirtyDate, options) {
      requiredArgs(1, arguments);
      return formatDistance(dirtyDate, Date.now(), options);
    }

    function _defineProperty$w(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class Setter {
      constructor() {
        _defineProperty$w(this, "priority", void 0);
        _defineProperty$w(this, "subPriority", 0);
      }
      validate(_utcDate, _options) {
        return true;
      }
    }
    class ValueSetter extends Setter {
      constructor(value, validateValue, setValue, priority, subPriority) {
        super();
        this.value = value;
        this.validateValue = validateValue;
        this.setValue = setValue;
        this.priority = priority;
        if (subPriority) {
          this.subPriority = subPriority;
        }
      }
      validate(utcDate, options) {
        return this.validateValue(utcDate, this.value, options);
      }
      set(utcDate, flags, options) {
        return this.setValue(utcDate, flags, this.value, options);
      }
    }

    function _defineProperty$v(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class Parser$1 {
      constructor() {
        _defineProperty$v(this, "incompatibleTokens", void 0);
        _defineProperty$v(this, "priority", void 0);
        _defineProperty$v(this, "subPriority", void 0);
      }
      run(dateString, token, match, options) {
        var result = this.parse(dateString, token, match, options);
        if (!result) {
          return null;
        }
        return {
          setter: new ValueSetter(result.value, this.validate, this.set, this.priority, this.subPriority),
          rest: result.rest
        };
      }
      validate(_utcDate, _value, _options) {
        return true;
      }
    }

    function _defineProperty$u(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class EraParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$u(this, "priority", 140);
        _defineProperty$u(this, "incompatibleTokens", ['R', 'u', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'G':
          case 'GG':
          case 'GGG':
            return match.era(dateString, {
              width: 'abbreviated'
            }) || match.era(dateString, {
              width: 'narrow'
            });
          case 'GGGGG':
            return match.era(dateString, {
              width: 'narrow'
            });
          case 'GGGG':
          default:
            return match.era(dateString, {
              width: 'wide'
            }) || match.era(dateString, {
              width: 'abbreviated'
            }) || match.era(dateString, {
              width: 'narrow'
            });
        }
      }
      set(date, flags, value) {
        flags.era = value;
        date.setUTCFullYear(value, 0, 1);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    var numericPatterns = {
      month: /^(1[0-2]|0?\d)/,
      date: /^(3[0-1]|[0-2]?\d)/,
      dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
      week: /^(5[0-3]|[0-4]?\d)/,
      hour23h: /^(2[0-3]|[0-1]?\d)/,
      hour24h: /^(2[0-4]|[0-1]?\d)/,
      hour11h: /^(1[0-1]|0?\d)/,
      hour12h: /^(1[0-2]|0?\d)/,
      minute: /^[0-5]?\d/,
      second: /^[0-5]?\d/,
      singleDigit: /^\d/,
      twoDigits: /^\d{1,2}/,
      threeDigits: /^\d{1,3}/,
      fourDigits: /^\d{1,4}/,
      anyDigitsSigned: /^-?\d+/,
      singleDigitSigned: /^-?\d/,
      twoDigitsSigned: /^-?\d{1,2}/,
      threeDigitsSigned: /^-?\d{1,3}/,
      fourDigitsSigned: /^-?\d{1,4}/
    };
    var timezonePatterns = {
      basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
      basic: /^([+-])(\d{2})(\d{2})|Z/,
      basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
      extended: /^([+-])(\d{2}):(\d{2})|Z/,
      extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
    };

    function mapValue(parseFnResult, mapFn) {
      if (!parseFnResult) {
        return parseFnResult;
      }
      return {
        value: mapFn(parseFnResult.value),
        rest: parseFnResult.rest
      };
    }
    function parseNumericPattern(pattern, dateString) {
      var matchResult = dateString.match(pattern);
      if (!matchResult) {
        return null;
      }
      return {
        value: parseInt(matchResult[0], 10),
        rest: dateString.slice(matchResult[0].length)
      };
    }
    function parseTimezonePattern(pattern, dateString) {
      var matchResult = dateString.match(pattern);
      if (!matchResult) {
        return null;
      }
      if (matchResult[0] === 'Z') {
        return {
          value: 0,
          rest: dateString.slice(1)
        };
      }
      var sign = matchResult[1] === '+' ? 1 : -1;
      var hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
      var minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
      var seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;
      return {
        value: sign * (hours * millisecondsInHour + minutes * millisecondsInMinute + seconds * millisecondsInSecond),
        rest: dateString.slice(matchResult[0].length)
      };
    }
    function parseAnyDigitsSigned(dateString) {
      return parseNumericPattern(numericPatterns.anyDigitsSigned, dateString);
    }
    function parseNDigits(n, dateString) {
      switch (n) {
        case 1:
          return parseNumericPattern(numericPatterns.singleDigit, dateString);
        case 2:
          return parseNumericPattern(numericPatterns.twoDigits, dateString);
        case 3:
          return parseNumericPattern(numericPatterns.threeDigits, dateString);
        case 4:
          return parseNumericPattern(numericPatterns.fourDigits, dateString);
        default:
          return parseNumericPattern(new RegExp('^\\d{1,' + n + '}'), dateString);
      }
    }
    function parseNDigitsSigned(n, dateString) {
      switch (n) {
        case 1:
          return parseNumericPattern(numericPatterns.singleDigitSigned, dateString);
        case 2:
          return parseNumericPattern(numericPatterns.twoDigitsSigned, dateString);
        case 3:
          return parseNumericPattern(numericPatterns.threeDigitsSigned, dateString);
        case 4:
          return parseNumericPattern(numericPatterns.fourDigitsSigned, dateString);
        default:
          return parseNumericPattern(new RegExp('^-?\\d{1,' + n + '}'), dateString);
      }
    }
    function dayPeriodEnumToHours(dayPeriod) {
      switch (dayPeriod) {
        case 'morning':
          return 4;
        case 'evening':
          return 17;
        case 'pm':
        case 'noon':
        case 'afternoon':
          return 12;
        case 'am':
        case 'midnight':
        case 'night':
        default:
          return 0;
      }
    }
    function normalizeTwoDigitYear(twoDigitYear, currentYear) {
      var isCommonEra = currentYear > 0;
      var absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;
      var result;
      if (absCurrentYear <= 50) {
        result = twoDigitYear || 100;
      } else {
        var rangeEnd = absCurrentYear + 50;
        var rangeEndCentury = Math.floor(rangeEnd / 100) * 100;
        var isPreviousCentury = twoDigitYear >= rangeEnd % 100;
        result = twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
      }
      return isCommonEra ? result : 1 - result;
    }
    function isLeapYearIndex(year) {
      return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
    }

    function _defineProperty$t(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class YearParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$t(this, "priority", 130);
        _defineProperty$t(this, "incompatibleTokens", ['Y', 'R', 'u', 'w', 'I', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        var valueCallback = function (year) {
          return {
            year: year,
            isTwoDigitYear: token === 'yy'
          };
        };
        switch (token) {
          case 'y':
            return mapValue(parseNDigits(4, dateString), valueCallback);
          case 'yo':
            return mapValue(match.ordinalNumber(dateString, {
              unit: 'year'
            }), valueCallback);
          default:
            return mapValue(parseNDigits(token.length, dateString), valueCallback);
        }
      }
      validate(_date, value) {
        return value.isTwoDigitYear || value.year > 0;
      }
      set(date, flags, value) {
        var currentYear = date.getUTCFullYear();
        if (value.isTwoDigitYear) {
          var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);
          date.setUTCFullYear(normalizedTwoDigitYear, 0, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        }
        var year = !('era' in flags) || flags.era === 1 ? value.year : 1 - value.year;
        date.setUTCFullYear(year, 0, 1);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$s(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class LocalWeekYearParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$s(this, "priority", 130);
        _defineProperty$s(this, "incompatibleTokens", ['y', 'R', 'u', 'Q', 'q', 'M', 'L', 'I', 'd', 'D', 'i', 't', 'T']);
      }
      parse(dateString, token, match) {
        var valueCallback = function (year) {
          return {
            year: year,
            isTwoDigitYear: token === 'YY'
          };
        };
        switch (token) {
          case 'Y':
            return mapValue(parseNDigits(4, dateString), valueCallback);
          case 'Yo':
            return mapValue(match.ordinalNumber(dateString, {
              unit: 'year'
            }), valueCallback);
          default:
            return mapValue(parseNDigits(token.length, dateString), valueCallback);
        }
      }
      validate(_date, value) {
        return value.isTwoDigitYear || value.year > 0;
      }
      set(date, flags, value, options) {
        var currentYear = getUTCWeekYear(date, options);
        if (value.isTwoDigitYear) {
          var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);
          date.setUTCFullYear(normalizedTwoDigitYear, 0, options.firstWeekContainsDate);
          date.setUTCHours(0, 0, 0, 0);
          return startOfUTCWeek(date, options);
        }
        var year = !('era' in flags) || flags.era === 1 ? value.year : 1 - value.year;
        date.setUTCFullYear(year, 0, options.firstWeekContainsDate);
        date.setUTCHours(0, 0, 0, 0);
        return startOfUTCWeek(date, options);
      }
    }

    function _defineProperty$r(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class ISOWeekYearParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$r(this, "priority", 130);
        _defineProperty$r(this, "incompatibleTokens", ['G', 'y', 'Y', 'u', 'Q', 'q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token) {
        if (token === 'R') {
          return parseNDigitsSigned(4, dateString);
        }
        return parseNDigitsSigned(token.length, dateString);
      }
      set(_date, _flags, value) {
        var firstWeekOfYear = new Date(0);
        firstWeekOfYear.setUTCFullYear(value, 0, 4);
        firstWeekOfYear.setUTCHours(0, 0, 0, 0);
        return startOfUTCISOWeek(firstWeekOfYear);
      }
    }

    function _defineProperty$q(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class ExtendedYearParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$q(this, "priority", 130);
        _defineProperty$q(this, "incompatibleTokens", ['G', 'y', 'Y', 'R', 'w', 'I', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token) {
        if (token === 'u') {
          return parseNDigitsSigned(4, dateString);
        }
        return parseNDigitsSigned(token.length, dateString);
      }
      set(date, _flags, value) {
        date.setUTCFullYear(value, 0, 1);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$p(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class QuarterParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$p(this, "priority", 120);
        _defineProperty$p(this, "incompatibleTokens", ['Y', 'R', 'q', 'M', 'L', 'w', 'I', 'd', 'D', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'Q':
          case 'QQ':
            return parseNDigits(token.length, dateString);
          case 'Qo':
            return match.ordinalNumber(dateString, {
              unit: 'quarter'
            });
          case 'QQQ':
            return match.quarter(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.quarter(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'QQQQQ':
            return match.quarter(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'QQQQ':
          default:
            return match.quarter(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.quarter(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.quarter(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
        }
      }
      validate(_date, value) {
        return value >= 1 && value <= 4;
      }
      set(date, _flags, value) {
        date.setUTCMonth((value - 1) * 3, 1);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$o(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class StandAloneQuarterParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$o(this, "priority", 120);
        _defineProperty$o(this, "incompatibleTokens", ['Y', 'R', 'Q', 'M', 'L', 'w', 'I', 'd', 'D', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'q':
          case 'qq':
            return parseNDigits(token.length, dateString);
          case 'qo':
            return match.ordinalNumber(dateString, {
              unit: 'quarter'
            });
          case 'qqq':
            return match.quarter(dateString, {
              width: 'abbreviated',
              context: 'standalone'
            }) || match.quarter(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
          case 'qqqqq':
            return match.quarter(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
          case 'qqqq':
          default:
            return match.quarter(dateString, {
              width: 'wide',
              context: 'standalone'
            }) || match.quarter(dateString, {
              width: 'abbreviated',
              context: 'standalone'
            }) || match.quarter(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
        }
      }
      validate(_date, value) {
        return value >= 1 && value <= 4;
      }
      set(date, _flags, value) {
        date.setUTCMonth((value - 1) * 3, 1);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$n(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class MonthParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$n(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'L', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']);
        _defineProperty$n(this, "priority", 110);
      }
      parse(dateString, token, match) {
        var valueCallback = function (value) {
          return value - 1;
        };
        switch (token) {
          case 'M':
            return mapValue(parseNumericPattern(numericPatterns.month, dateString), valueCallback);
          case 'MM':
            return mapValue(parseNDigits(2, dateString), valueCallback);
          case 'Mo':
            return mapValue(match.ordinalNumber(dateString, {
              unit: 'month'
            }), valueCallback);
          case 'MMM':
            return match.month(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.month(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'MMMMM':
            return match.month(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'MMMM':
          default:
            return match.month(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.month(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.month(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 11;
      }
      set(date, _flags, value) {
        date.setUTCMonth(value, 1);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$m(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class StandAloneMonthParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$m(this, "priority", 110);
        _defineProperty$m(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'M', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        var valueCallback = function (value) {
          return value - 1;
        };
        switch (token) {
          case 'L':
            return mapValue(parseNumericPattern(numericPatterns.month, dateString), valueCallback);
          case 'LL':
            return mapValue(parseNDigits(2, dateString), valueCallback);
          case 'Lo':
            return mapValue(match.ordinalNumber(dateString, {
              unit: 'month'
            }), valueCallback);
          case 'LLL':
            return match.month(dateString, {
              width: 'abbreviated',
              context: 'standalone'
            }) || match.month(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
          case 'LLLLL':
            return match.month(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
          case 'LLLL':
          default:
            return match.month(dateString, {
              width: 'wide',
              context: 'standalone'
            }) || match.month(dateString, {
              width: 'abbreviated',
              context: 'standalone'
            }) || match.month(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 11;
      }
      set(date, _flags, value) {
        date.setUTCMonth(value, 1);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function setUTCWeek(dirtyDate, dirtyWeek, options) {
      requiredArgs(2, arguments);
      var date = toDate(dirtyDate);
      var week = toInteger(dirtyWeek);
      var diff = getUTCWeek(date, options) - week;
      date.setUTCDate(date.getUTCDate() - diff * 7);
      return date;
    }

    function _defineProperty$l(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class LocalWeekParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$l(this, "priority", 100);
        _defineProperty$l(this, "incompatibleTokens", ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'i', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'w':
            return parseNumericPattern(numericPatterns.week, dateString);
          case 'wo':
            return match.ordinalNumber(dateString, {
              unit: 'week'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 1 && value <= 53;
      }
      set(date, _flags, value, options) {
        return startOfUTCWeek(setUTCWeek(date, value, options), options);
      }
    }

    function setUTCISOWeek(dirtyDate, dirtyISOWeek) {
      requiredArgs(2, arguments);
      var date = toDate(dirtyDate);
      var isoWeek = toInteger(dirtyISOWeek);
      var diff = getUTCISOWeek(date) - isoWeek;
      date.setUTCDate(date.getUTCDate() - diff * 7);
      return date;
    }

    function _defineProperty$k(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class ISOWeekParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$k(this, "priority", 100);
        _defineProperty$k(this, "incompatibleTokens", ['y', 'Y', 'u', 'q', 'Q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'I':
            return parseNumericPattern(numericPatterns.week, dateString);
          case 'Io':
            return match.ordinalNumber(dateString, {
              unit: 'week'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 1 && value <= 53;
      }
      set(date, _flags, value) {
        return startOfUTCISOWeek(setUTCISOWeek(date, value));
      }
    }

    function _defineProperty$j(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var DAYS_IN_MONTH_LEAP_YEAR = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    class DateParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$j(this, "priority", 90);
        _defineProperty$j(this, "subPriority", 1);
        _defineProperty$j(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'd':
            return parseNumericPattern(numericPatterns.date, dateString);
          case 'do':
            return match.ordinalNumber(dateString, {
              unit: 'date'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(date, value) {
        var year = date.getUTCFullYear();
        var isLeapYear = isLeapYearIndex(year);
        var month = date.getUTCMonth();
        if (isLeapYear) {
          return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
        } else {
          return value >= 1 && value <= DAYS_IN_MONTH[month];
        }
      }
      set(date, _flags, value) {
        date.setUTCDate(value);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$i(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class DayOfYearParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$i(this, "priority", 90);
        _defineProperty$i(this, "subpriority", 1);
        _defineProperty$i(this, "incompatibleTokens", ['Y', 'R', 'q', 'Q', 'M', 'L', 'w', 'I', 'd', 'E', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'D':
          case 'DD':
            return parseNumericPattern(numericPatterns.dayOfYear, dateString);
          case 'Do':
            return match.ordinalNumber(dateString, {
              unit: 'date'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(date, value) {
        var year = date.getUTCFullYear();
        var isLeapYear = isLeapYearIndex(year);
        if (isLeapYear) {
          return value >= 1 && value <= 366;
        } else {
          return value >= 1 && value <= 365;
        }
      }
      set(date, _flags, value) {
        date.setUTCMonth(0, value);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function setUTCDay(dirtyDate, dirtyDay, options) {
      var _ref, _ref2, _ref3, _options$weekStartsOn, _options$locale, _options$locale$optio, _defaultOptions$local, _defaultOptions$local2;
      requiredArgs(2, arguments);
      var defaultOptions = getDefaultOptions();
      var weekStartsOn = toInteger((_ref = (_ref2 = (_ref3 = (_options$weekStartsOn = options === null || options === void 0 ? void 0 : options.weekStartsOn) !== null && _options$weekStartsOn !== void 0 ? _options$weekStartsOn : options === null || options === void 0 ? void 0 : (_options$locale = options.locale) === null || _options$locale === void 0 ? void 0 : (_options$locale$optio = _options$locale.options) === null || _options$locale$optio === void 0 ? void 0 : _options$locale$optio.weekStartsOn) !== null && _ref3 !== void 0 ? _ref3 : defaultOptions.weekStartsOn) !== null && _ref2 !== void 0 ? _ref2 : (_defaultOptions$local = defaultOptions.locale) === null || _defaultOptions$local === void 0 ? void 0 : (_defaultOptions$local2 = _defaultOptions$local.options) === null || _defaultOptions$local2 === void 0 ? void 0 : _defaultOptions$local2.weekStartsOn) !== null && _ref !== void 0 ? _ref : 0);
      if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
        throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
      }
      var date = toDate(dirtyDate);
      var day = toInteger(dirtyDay);
      var currentDay = date.getUTCDay();
      var remainder = day % 7;
      var dayIndex = (remainder + 7) % 7;
      var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;
      date.setUTCDate(date.getUTCDate() + diff);
      return date;
    }

    function _defineProperty$h(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class DayParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$h(this, "priority", 90);
        _defineProperty$h(this, "incompatibleTokens", ['D', 'i', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'E':
          case 'EE':
          case 'EEE':
            return match.day(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'EEEEE':
            return match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'EEEEEE':
            return match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'EEEE':
          default:
            return match.day(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 6;
      }
      set(date, _flags, value, options) {
        date = setUTCDay(date, value, options);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$g(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class LocalDayParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$g(this, "priority", 90);
        _defineProperty$g(this, "incompatibleTokens", ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'E', 'i', 'c', 't', 'T']);
      }
      parse(dateString, token, match, options) {
        var valueCallback = function (value) {
          var wholeWeekDays = Math.floor((value - 1) / 7) * 7;
          return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
        };
        switch (token) {
          case 'e':
          case 'ee':
            return mapValue(parseNDigits(token.length, dateString), valueCallback);
          case 'eo':
            return mapValue(match.ordinalNumber(dateString, {
              unit: 'day'
            }), valueCallback);
          case 'eee':
            return match.day(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'eeeee':
            return match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'eeeeee':
            return match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'eeee':
          default:
            return match.day(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 6;
      }
      set(date, _flags, value, options) {
        date = setUTCDay(date, value, options);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$f(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class StandAloneLocalDayParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$f(this, "priority", 90);
        _defineProperty$f(this, "incompatibleTokens", ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'E', 'i', 'e', 't', 'T']);
      }
      parse(dateString, token, match, options) {
        var valueCallback = function (value) {
          var wholeWeekDays = Math.floor((value - 1) / 7) * 7;
          return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
        };
        switch (token) {
          case 'c':
          case 'cc':
            return mapValue(parseNDigits(token.length, dateString), valueCallback);
          case 'co':
            return mapValue(match.ordinalNumber(dateString, {
              unit: 'day'
            }), valueCallback);
          case 'ccc':
            return match.day(dateString, {
              width: 'abbreviated',
              context: 'standalone'
            }) || match.day(dateString, {
              width: 'short',
              context: 'standalone'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
          case 'ccccc':
            return match.day(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
          case 'cccccc':
            return match.day(dateString, {
              width: 'short',
              context: 'standalone'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
          case 'cccc':
          default:
            return match.day(dateString, {
              width: 'wide',
              context: 'standalone'
            }) || match.day(dateString, {
              width: 'abbreviated',
              context: 'standalone'
            }) || match.day(dateString, {
              width: 'short',
              context: 'standalone'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'standalone'
            });
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 6;
      }
      set(date, _flags, value, options) {
        date = setUTCDay(date, value, options);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function setUTCISODay(dirtyDate, dirtyDay) {
      requiredArgs(2, arguments);
      var day = toInteger(dirtyDay);
      if (day % 7 === 0) {
        day = day - 7;
      }
      var weekStartsOn = 1;
      var date = toDate(dirtyDate);
      var currentDay = date.getUTCDay();
      var remainder = day % 7;
      var dayIndex = (remainder + 7) % 7;
      var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;
      date.setUTCDate(date.getUTCDate() + diff);
      return date;
    }

    function _defineProperty$e(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class ISODayParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$e(this, "priority", 90);
        _defineProperty$e(this, "incompatibleTokens", ['y', 'Y', 'u', 'q', 'Q', 'M', 'L', 'w', 'd', 'D', 'E', 'e', 'c', 't', 'T']);
      }
      parse(dateString, token, match) {
        var valueCallback = function (value) {
          if (value === 0) {
            return 7;
          }
          return value;
        };
        switch (token) {
          case 'i':
          case 'ii':
            return parseNDigits(token.length, dateString);
          case 'io':
            return match.ordinalNumber(dateString, {
              unit: 'day'
            });
          case 'iii':
            return mapValue(match.day(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            }), valueCallback);
          case 'iiiii':
            return mapValue(match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            }), valueCallback);
          case 'iiiiii':
            return mapValue(match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            }), valueCallback);
          case 'iiii':
          default:
            return mapValue(match.day(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'short',
              context: 'formatting'
            }) || match.day(dateString, {
              width: 'narrow',
              context: 'formatting'
            }), valueCallback);
        }
      }
      validate(_date, value) {
        return value >= 1 && value <= 7;
      }
      set(date, _flags, value) {
        date = setUTCISODay(date, value);
        date.setUTCHours(0, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$d(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class AMPMParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$d(this, "priority", 80);
        _defineProperty$d(this, "incompatibleTokens", ['b', 'B', 'H', 'k', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'a':
          case 'aa':
          case 'aaa':
            return match.dayPeriod(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'aaaaa':
            return match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'aaaa':
          default:
            return match.dayPeriod(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
        }
      }
      set(date, _flags, value) {
        date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$c(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class AMPMMidnightParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$c(this, "priority", 80);
        _defineProperty$c(this, "incompatibleTokens", ['a', 'B', 'H', 'k', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'b':
          case 'bb':
          case 'bbb':
            return match.dayPeriod(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'bbbbb':
            return match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'bbbb':
          default:
            return match.dayPeriod(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
        }
      }
      set(date, _flags, value) {
        date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$b(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class DayPeriodParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$b(this, "priority", 80);
        _defineProperty$b(this, "incompatibleTokens", ['a', 'b', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'B':
          case 'BB':
          case 'BBB':
            return match.dayPeriod(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'BBBBB':
            return match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
          case 'BBBB':
          default:
            return match.dayPeriod(dateString, {
              width: 'wide',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'abbreviated',
              context: 'formatting'
            }) || match.dayPeriod(dateString, {
              width: 'narrow',
              context: 'formatting'
            });
        }
      }
      set(date, _flags, value) {
        date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$a(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class Hour1to12Parser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$a(this, "priority", 70);
        _defineProperty$a(this, "incompatibleTokens", ['H', 'K', 'k', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'h':
            return parseNumericPattern(numericPatterns.hour12h, dateString);
          case 'ho':
            return match.ordinalNumber(dateString, {
              unit: 'hour'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 1 && value <= 12;
      }
      set(date, _flags, value) {
        var isPM = date.getUTCHours() >= 12;
        if (isPM && value < 12) {
          date.setUTCHours(value + 12, 0, 0, 0);
        } else if (!isPM && value === 12) {
          date.setUTCHours(0, 0, 0, 0);
        } else {
          date.setUTCHours(value, 0, 0, 0);
        }
        return date;
      }
    }

    function _defineProperty$9(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class Hour0to23Parser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$9(this, "priority", 70);
        _defineProperty$9(this, "incompatibleTokens", ['a', 'b', 'h', 'K', 'k', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'H':
            return parseNumericPattern(numericPatterns.hour23h, dateString);
          case 'Ho':
            return match.ordinalNumber(dateString, {
              unit: 'hour'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 23;
      }
      set(date, _flags, value) {
        date.setUTCHours(value, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$8(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class Hour0To11Parser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$8(this, "priority", 70);
        _defineProperty$8(this, "incompatibleTokens", ['h', 'H', 'k', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'K':
            return parseNumericPattern(numericPatterns.hour11h, dateString);
          case 'Ko':
            return match.ordinalNumber(dateString, {
              unit: 'hour'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 11;
      }
      set(date, _flags, value) {
        var isPM = date.getUTCHours() >= 12;
        if (isPM && value < 12) {
          date.setUTCHours(value + 12, 0, 0, 0);
        } else {
          date.setUTCHours(value, 0, 0, 0);
        }
        return date;
      }
    }

    function _defineProperty$7(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class Hour1To24Parser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$7(this, "priority", 70);
        _defineProperty$7(this, "incompatibleTokens", ['a', 'b', 'h', 'H', 'K', 't', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'k':
            return parseNumericPattern(numericPatterns.hour24h, dateString);
          case 'ko':
            return match.ordinalNumber(dateString, {
              unit: 'hour'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 1 && value <= 24;
      }
      set(date, _flags, value) {
        var hours = value <= 24 ? value % 24 : value;
        date.setUTCHours(hours, 0, 0, 0);
        return date;
      }
    }

    function _defineProperty$6(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class MinuteParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$6(this, "priority", 60);
        _defineProperty$6(this, "incompatibleTokens", ['t', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 'm':
            return parseNumericPattern(numericPatterns.minute, dateString);
          case 'mo':
            return match.ordinalNumber(dateString, {
              unit: 'minute'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 59;
      }
      set(date, _flags, value) {
        date.setUTCMinutes(value, 0, 0);
        return date;
      }
    }

    function _defineProperty$5(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class SecondParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$5(this, "priority", 50);
        _defineProperty$5(this, "incompatibleTokens", ['t', 'T']);
      }
      parse(dateString, token, match) {
        switch (token) {
          case 's':
            return parseNumericPattern(numericPatterns.second, dateString);
          case 'so':
            return match.ordinalNumber(dateString, {
              unit: 'second'
            });
          default:
            return parseNDigits(token.length, dateString);
        }
      }
      validate(_date, value) {
        return value >= 0 && value <= 59;
      }
      set(date, _flags, value) {
        date.setUTCSeconds(value, 0);
        return date;
      }
    }

    function _defineProperty$4(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class FractionOfSecondParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$4(this, "priority", 30);
        _defineProperty$4(this, "incompatibleTokens", ['t', 'T']);
      }
      parse(dateString, token) {
        var valueCallback = function (value) {
          return Math.floor(value * Math.pow(10, -token.length + 3));
        };
        return mapValue(parseNDigits(token.length, dateString), valueCallback);
      }
      set(date, _flags, value) {
        date.setUTCMilliseconds(value);
        return date;
      }
    }

    function _defineProperty$3(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class ISOTimezoneWithZParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$3(this, "priority", 10);
        _defineProperty$3(this, "incompatibleTokens", ['t', 'T', 'x']);
      }
      parse(dateString, token) {
        switch (token) {
          case 'X':
            return parseTimezonePattern(timezonePatterns.basicOptionalMinutes, dateString);
          case 'XX':
            return parseTimezonePattern(timezonePatterns.basic, dateString);
          case 'XXXX':
            return parseTimezonePattern(timezonePatterns.basicOptionalSeconds, dateString);
          case 'XXXXX':
            return parseTimezonePattern(timezonePatterns.extendedOptionalSeconds, dateString);
          case 'XXX':
          default:
            return parseTimezonePattern(timezonePatterns.extended, dateString);
        }
      }
      set(date, flags, value) {
        if (flags.timestampIsSet) {
          return date;
        }
        return new Date(date.getTime() - value);
      }
    }

    function _defineProperty$2(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class ISOTimezoneParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$2(this, "priority", 10);
        _defineProperty$2(this, "incompatibleTokens", ['t', 'T', 'X']);
      }
      parse(dateString, token) {
        switch (token) {
          case 'x':
            return parseTimezonePattern(timezonePatterns.basicOptionalMinutes, dateString);
          case 'xx':
            return parseTimezonePattern(timezonePatterns.basic, dateString);
          case 'xxxx':
            return parseTimezonePattern(timezonePatterns.basicOptionalSeconds, dateString);
          case 'xxxxx':
            return parseTimezonePattern(timezonePatterns.extendedOptionalSeconds, dateString);
          case 'xxx':
          default:
            return parseTimezonePattern(timezonePatterns.extended, dateString);
        }
      }
      set(date, flags, value) {
        if (flags.timestampIsSet) {
          return date;
        }
        return new Date(date.getTime() - value);
      }
    }

    function _defineProperty$1(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class TimestampSecondsParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty$1(this, "priority", 40);
        _defineProperty$1(this, "incompatibleTokens", '*');
      }
      parse(dateString) {
        return parseAnyDigitsSigned(dateString);
      }
      set(_date, _flags, value) {
        return [new Date(value * 1000), {
          timestampIsSet: true
        }];
      }
    }

    function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
    class TimestampMillisecondsParser extends Parser$1 {
      constructor() {
        super(...arguments);
        _defineProperty(this, "priority", 20);
        _defineProperty(this, "incompatibleTokens", '*');
      }
      parse(dateString) {
        return parseAnyDigitsSigned(dateString);
      }
      set(_date, _flags, value) {
        return [new Date(value), {
          timestampIsSet: true
        }];
      }
    }

    ({
      G: new EraParser(),
      y: new YearParser(),
      Y: new LocalWeekYearParser(),
      R: new ISOWeekYearParser(),
      u: new ExtendedYearParser(),
      Q: new QuarterParser(),
      q: new StandAloneQuarterParser(),
      M: new MonthParser(),
      L: new StandAloneMonthParser(),
      w: new LocalWeekParser(),
      I: new ISOWeekParser(),
      d: new DateParser(),
      D: new DayOfYearParser(),
      E: new DayParser(),
      e: new LocalDayParser(),
      c: new StandAloneLocalDayParser(),
      i: new ISODayParser(),
      a: new AMPMParser(),
      b: new AMPMMidnightParser(),
      B: new DayPeriodParser(),
      h: new Hour1to12Parser(),
      H: new Hour0to23Parser(),
      K: new Hour0To11Parser(),
      k: new Hour1To24Parser(),
      m: new MinuteParser(),
      s: new SecondParser(),
      S: new FractionOfSecondParser(),
      X: new ISOTimezoneWithZParser(),
      x: new ISOTimezoneParser(),
      t: new TimestampSecondsParser(),
      T: new TimestampMillisecondsParser()
    });

    let PanoItemHeader = class PanoItemHeader extends st1.BoxLayout {
        constructor(itemType, date) {
            super({
                style_class: `pano-item-header pano-item-header-${itemType.classSuffix}`,
                vertical: false,
                x_expand: true,
            });
            const titleContainer = new st1.BoxLayout({
                style_class: 'pano-item-title-container',
                vertical: true,
                x_align: clutter10.ActorAlign.FILL,
                y_align: clutter10.ActorAlign.FILL,
                x_expand: true,
            });
            const iconContainer = new st1.BoxLayout({
                style_class: 'pano-icon-container',
            });
            iconContainer.add_child(new st1.Icon({
                gicon: gio2.icon_new_for_string(`${getCurrentExtension().path}/icons/${itemType.icon}`),
                style_class: 'pano-icon',
            }));
            titleContainer.add_child(new st1.Label({
                text: itemType.title,
                style_class: 'pano-item-title',
                x_expand: true,
            }));
            const dateLabel = new st1.Label({
                text: formatDistanceToNow(date, { addSuffix: true }),
                style_class: 'pano-item-date',
                x_expand: true,
                y_expand: true,
            });
            this.dateUpdateIntervalId = setInterval(() => {
                dateLabel.set_text(formatDistanceToNow(date, { addSuffix: true }));
            }, 60000);
            titleContainer.add_child(dateLabel);
            const actionContainer = new st1.BoxLayout({
                style_class: 'pano-item-actions',
                x_expand: false,
                y_expand: true,
                x_align: clutter10.ActorAlign.END,
                y_align: clutter10.ActorAlign.START,
            });
            const removeIcon = new st1.Icon({
                icon_name: 'window-close-symbolic',
                icon_size: 12,
            });
            const removeButton = new st1.Button({
                style_class: 'pano-item-remove-button',
                child: removeIcon,
            });
            removeButton.connect('clicked', () => {
                this.emit('on-remove');
                return clutter10.EVENT_PROPAGATE;
            });
            actionContainer.add_child(removeButton);
            this.add_child(iconContainer);
            this.add_child(titleContainer);
            this.add_child(actionContainer);
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
        },
    };
    PanoItemHeader = __decorate([
        registerGObjectClass
    ], PanoItemHeader);

    const PanoItemTypes = {
        LINK: { classSuffix: 'link', title: 'Link', icon: 'link.svg' },
        TEXT: { classSuffix: 'text', title: 'Text', icon: 'text.svg' },
        FILE: { classSuffix: 'file', title: 'File', icon: 'file.svg' },
        IMAGE: { classSuffix: 'image', title: 'Image', icon: 'image.svg' },
        CODE: { classSuffix: 'code', title: 'Code', icon: 'code.svg' },
        COLOR: { classSuffix: 'color', title: 'Color', icon: 'color.svg' },
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
            this.connect('key-focus-in', () => this.setSelected(true));
            this.connect('key-focus-out', () => this.setSelected(false));
            this.connect('enter-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.POINTING_HAND);
            });
            this.connect('motion-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.POINTING_HAND);
            });
            this.connect('leave-event', () => {
                shell0.Global.get().display.set_cursor(meta10.Cursor.DEFAULT);
            });
            this.connect('activated', () => {
                this.get_parent()?.get_parent()?.get_parent()?.hide();
                if (getCurrentExtensionSettings().get_boolean('paste-on-select')) {
                    // See https://github.com/SUPERCILEX/gnome-clipboard-history/blob/master/extension.js#L606
                    this.timeoutId = glib2.timeout_add(glib2.PRIORITY_DEFAULT, 250, () => {
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
            this.header.connect('on-remove', () => {
                this.emit('on-remove', JSON.stringify(this.dbItem));
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
        }
        setSelected(selected) {
            if (selected) {
                this.add_style_pseudo_class('selected');
                this.grab_key_focus();
            }
            else {
                this.remove_style_pseudo_class('selected');
            }
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
        },
    };
    PanoItem = __decorate([
        registerGObjectClass
    ], PanoItem);

    var prism = {exports: {}};

    (function (module) {
    	var _self = (typeof window !== 'undefined')
    		? window
    		: (
    			(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
    				? self
    				: {}
    		);
    	var Prism = (function (_self) {
    		var lang = /(?:^|\s)lang(?:uage)?-([\w-]+)(?=\s|$)/i;
    		var uniqueId = 0;
    		var plainTextGrammar = {};
    		var _ = {
    			manual: _self.Prism && _self.Prism.manual,
    			disableWorkerMessageHandler: _self.Prism && _self.Prism.disableWorkerMessageHandler,
    			util: {
    				encode: function encode(tokens) {
    					if (tokens instanceof Token) {
    						return new Token(tokens.type, encode(tokens.content), tokens.alias);
    					} else if (Array.isArray(tokens)) {
    						return tokens.map(encode);
    					} else {
    						return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
    					}
    				},
    				type: function (o) {
    					return Object.prototype.toString.call(o).slice(8, -1);
    				},
    				objId: function (obj) {
    					if (!obj['__id']) {
    						Object.defineProperty(obj, '__id', { value: ++uniqueId });
    					}
    					return obj['__id'];
    				},
    				clone: function deepClone(o, visited) {
    					visited = visited || {};
    					var clone; var id;
    					switch (_.util.type(o)) {
    						case 'Object':
    							id = _.util.objId(o);
    							if (visited[id]) {
    								return visited[id];
    							}
    							clone =  ({});
    							visited[id] = clone;
    							for (var key in o) {
    								if (o.hasOwnProperty(key)) {
    									clone[key] = deepClone(o[key], visited);
    								}
    							}
    							return  (clone);
    						case 'Array':
    							id = _.util.objId(o);
    							if (visited[id]) {
    								return visited[id];
    							}
    							clone = [];
    							visited[id] = clone;
    							(((o))).forEach(function (v, i) {
    								clone[i] = deepClone(v, visited);
    							});
    							return  (clone);
    						default:
    							return o;
    					}
    				},
    				getLanguage: function (element) {
    					while (element) {
    						var m = lang.exec(element.className);
    						if (m) {
    							return m[1].toLowerCase();
    						}
    						element = element.parentElement;
    					}
    					return 'none';
    				},
    				setLanguage: function (element, language) {
    					element.className = element.className.replace(RegExp(lang, 'gi'), '');
    					element.classList.add('language-' + language);
    				},
    				currentScript: function () {
    					if (typeof document === 'undefined') {
    						return null;
    					}
    					if ('currentScript' in document && 1 < 2 ) {
    						return  (document.currentScript);
    					}
    					try {
    						throw new Error();
    					} catch (err) {
    						var src = (/at [^(\r\n]*\((.*):[^:]+:[^:]+\)$/i.exec(err.stack) || [])[1];
    						if (src) {
    							var scripts = document.getElementsByTagName('script');
    							for (var i in scripts) {
    								if (scripts[i].src == src) {
    									return scripts[i];
    								}
    							}
    						}
    						return null;
    					}
    				},
    				isActive: function (element, className, defaultActivation) {
    					var no = 'no-' + className;
    					while (element) {
    						var classList = element.classList;
    						if (classList.contains(className)) {
    							return true;
    						}
    						if (classList.contains(no)) {
    							return false;
    						}
    						element = element.parentElement;
    					}
    					return !!defaultActivation;
    				}
    			},
    			languages: {
    				plain: plainTextGrammar,
    				plaintext: plainTextGrammar,
    				text: plainTextGrammar,
    				txt: plainTextGrammar,
    				extend: function (id, redef) {
    					var lang = _.util.clone(_.languages[id]);
    					for (var key in redef) {
    						lang[key] = redef[key];
    					}
    					return lang;
    				},
    				insertBefore: function (inside, before, insert, root) {
    					root = root ||  (_.languages);
    					var grammar = root[inside];
    					var ret = {};
    					for (var token in grammar) {
    						if (grammar.hasOwnProperty(token)) {
    							if (token == before) {
    								for (var newToken in insert) {
    									if (insert.hasOwnProperty(newToken)) {
    										ret[newToken] = insert[newToken];
    									}
    								}
    							}
    							if (!insert.hasOwnProperty(token)) {
    								ret[token] = grammar[token];
    							}
    						}
    					}
    					var old = root[inside];
    					root[inside] = ret;
    					_.languages.DFS(_.languages, function (key, value) {
    						if (value === old && key != inside) {
    							this[key] = ret;
    						}
    					});
    					return ret;
    				},
    				DFS: function DFS(o, callback, type, visited) {
    					visited = visited || {};
    					var objId = _.util.objId;
    					for (var i in o) {
    						if (o.hasOwnProperty(i)) {
    							callback.call(o, i, o[i], type || i);
    							var property = o[i];
    							var propertyType = _.util.type(property);
    							if (propertyType === 'Object' && !visited[objId(property)]) {
    								visited[objId(property)] = true;
    								DFS(property, callback, null, visited);
    							} else if (propertyType === 'Array' && !visited[objId(property)]) {
    								visited[objId(property)] = true;
    								DFS(property, callback, i, visited);
    							}
    						}
    					}
    				}
    			},
    			plugins: {},
    			highlightAll: function (async, callback) {
    				_.highlightAllUnder(document, async, callback);
    			},
    			highlightAllUnder: function (container, async, callback) {
    				var env = {
    					callback: callback,
    					container: container,
    					selector: 'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
    				};
    				_.hooks.run('before-highlightall', env);
    				env.elements = Array.prototype.slice.apply(env.container.querySelectorAll(env.selector));
    				_.hooks.run('before-all-elements-highlight', env);
    				for (var i = 0, element; (element = env.elements[i++]);) {
    					_.highlightElement(element, async === true, env.callback);
    				}
    			},
    			highlightElement: function (element, async, callback) {
    				var language = _.util.getLanguage(element);
    				var grammar = _.languages[language];
    				_.util.setLanguage(element, language);
    				var parent = element.parentElement;
    				if (parent && parent.nodeName.toLowerCase() === 'pre') {
    					_.util.setLanguage(parent, language);
    				}
    				var code = element.textContent;
    				var env = {
    					element: element,
    					language: language,
    					grammar: grammar,
    					code: code
    				};
    				function insertHighlightedCode(highlightedCode) {
    					env.highlightedCode = highlightedCode;
    					_.hooks.run('before-insert', env);
    					env.element.innerHTML = env.highlightedCode;
    					_.hooks.run('after-highlight', env);
    					_.hooks.run('complete', env);
    					callback && callback.call(env.element);
    				}
    				_.hooks.run('before-sanity-check', env);
    				parent = env.element.parentElement;
    				if (parent && parent.nodeName.toLowerCase() === 'pre' && !parent.hasAttribute('tabindex')) {
    					parent.setAttribute('tabindex', '0');
    				}
    				if (!env.code) {
    					_.hooks.run('complete', env);
    					callback && callback.call(env.element);
    					return;
    				}
    				_.hooks.run('before-highlight', env);
    				if (!env.grammar) {
    					insertHighlightedCode(_.util.encode(env.code));
    					return;
    				}
    				if (async && _self.Worker) {
    					var worker = new Worker(_.filename);
    					worker.onmessage = function (evt) {
    						insertHighlightedCode(evt.data);
    					};
    					worker.postMessage(JSON.stringify({
    						language: env.language,
    						code: env.code,
    						immediateClose: true
    					}));
    				} else {
    					insertHighlightedCode(_.highlight(env.code, env.grammar, env.language));
    				}
    			},
    			highlight: function (text, grammar, language) {
    				var env = {
    					code: text,
    					grammar: grammar,
    					language: language
    				};
    				_.hooks.run('before-tokenize', env);
    				if (!env.grammar) {
    					throw new Error('The language "' + env.language + '" has no grammar.');
    				}
    				env.tokens = _.tokenize(env.code, env.grammar);
    				_.hooks.run('after-tokenize', env);
    				return Token.stringify(_.util.encode(env.tokens), env.language);
    			},
    			tokenize: function (text, grammar) {
    				var rest = grammar.rest;
    				if (rest) {
    					for (var token in rest) {
    						grammar[token] = rest[token];
    					}
    					delete grammar.rest;
    				}
    				var tokenList = new LinkedList();
    				addAfter(tokenList, tokenList.head, text);
    				matchGrammar(text, tokenList, grammar, tokenList.head, 0);
    				return toArray(tokenList);
    			},
    			hooks: {
    				all: {},
    				add: function (name, callback) {
    					var hooks = _.hooks.all;
    					hooks[name] = hooks[name] || [];
    					hooks[name].push(callback);
    				},
    				run: function (name, env) {
    					var callbacks = _.hooks.all[name];
    					if (!callbacks || !callbacks.length) {
    						return;
    					}
    					for (var i = 0, callback; (callback = callbacks[i++]);) {
    						callback(env);
    					}
    				}
    			},
    			Token: Token
    		};
    		_self.Prism = _;
    		function Token(type, content, alias, matchedStr) {
    			this.type = type;
    			this.content = content;
    			this.alias = alias;
    			this.length = (matchedStr || '').length | 0;
    		}
    		Token.stringify = function stringify(o, language) {
    			if (typeof o == 'string') {
    				return o;
    			}
    			if (Array.isArray(o)) {
    				var s = '';
    				o.forEach(function (e) {
    					s += stringify(e, language);
    				});
    				return s;
    			}
    			var env = {
    				type: o.type,
    				content: stringify(o.content, language),
    				tag: 'span',
    				classes: ['token', o.type],
    				attributes: {},
    				language: language
    			};
    			var aliases = o.alias;
    			if (aliases) {
    				if (Array.isArray(aliases)) {
    					Array.prototype.push.apply(env.classes, aliases);
    				} else {
    					env.classes.push(aliases);
    				}
    			}
    			_.hooks.run('wrap', env);
    			var attributes = '';
    			for (var name in env.attributes) {
    				attributes += ' ' + name + '="' + (env.attributes[name] || '').replace(/"/g, '&quot;') + '"';
    			}
    			return '<' + env.tag + ' class="' + env.classes.join(' ') + '"' + attributes + '>' + env.content + '</' + env.tag + '>';
    		};
    		function matchPattern(pattern, pos, text, lookbehind) {
    			pattern.lastIndex = pos;
    			var match = pattern.exec(text);
    			if (match && lookbehind && match[1]) {
    				var lookbehindLength = match[1].length;
    				match.index += lookbehindLength;
    				match[0] = match[0].slice(lookbehindLength);
    			}
    			return match;
    		}
    		function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
    			for (var token in grammar) {
    				if (!grammar.hasOwnProperty(token) || !grammar[token]) {
    					continue;
    				}
    				var patterns = grammar[token];
    				patterns = Array.isArray(patterns) ? patterns : [patterns];
    				for (var j = 0; j < patterns.length; ++j) {
    					if (rematch && rematch.cause == token + ',' + j) {
    						return;
    					}
    					var patternObj = patterns[j];
    					var inside = patternObj.inside;
    					var lookbehind = !!patternObj.lookbehind;
    					var greedy = !!patternObj.greedy;
    					var alias = patternObj.alias;
    					if (greedy && !patternObj.pattern.global) {
    						var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
    						patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
    					}
    					var pattern = patternObj.pattern || patternObj;
    					for (
    						var currentNode = startNode.next, pos = startPos;
    						currentNode !== tokenList.tail;
    						pos += currentNode.value.length, currentNode = currentNode.next
    					) {
    						if (rematch && pos >= rematch.reach) {
    							break;
    						}
    						var str = currentNode.value;
    						if (tokenList.length > text.length) {
    							return;
    						}
    						if (str instanceof Token) {
    							continue;
    						}
    						var removeCount = 1;
    						var match;
    						if (greedy) {
    							match = matchPattern(pattern, pos, text, lookbehind);
    							if (!match || match.index >= text.length) {
    								break;
    							}
    							var from = match.index;
    							var to = match.index + match[0].length;
    							var p = pos;
    							p += currentNode.value.length;
    							while (from >= p) {
    								currentNode = currentNode.next;
    								p += currentNode.value.length;
    							}
    							p -= currentNode.value.length;
    							pos = p;
    							if (currentNode.value instanceof Token) {
    								continue;
    							}
    							for (
    								var k = currentNode;
    								k !== tokenList.tail && (p < to || typeof k.value === 'string');
    								k = k.next
    							) {
    								removeCount++;
    								p += k.value.length;
    							}
    							removeCount--;
    							str = text.slice(pos, p);
    							match.index -= pos;
    						} else {
    							match = matchPattern(pattern, 0, str, lookbehind);
    							if (!match) {
    								continue;
    							}
    						}
    						var from = match.index;
    						var matchStr = match[0];
    						var before = str.slice(0, from);
    						var after = str.slice(from + matchStr.length);
    						var reach = pos + str.length;
    						if (rematch && reach > rematch.reach) {
    							rematch.reach = reach;
    						}
    						var removeFrom = currentNode.prev;
    						if (before) {
    							removeFrom = addAfter(tokenList, removeFrom, before);
    							pos += before.length;
    						}
    						removeRange(tokenList, removeFrom, removeCount);
    						var wrapped = new Token(token, inside ? _.tokenize(matchStr, inside) : matchStr, alias, matchStr);
    						currentNode = addAfter(tokenList, removeFrom, wrapped);
    						if (after) {
    							addAfter(tokenList, currentNode, after);
    						}
    						if (removeCount > 1) {
    							var nestedRematch = {
    								cause: token + ',' + j,
    								reach: reach
    							};
    							matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);
    							if (rematch && nestedRematch.reach > rematch.reach) {
    								rematch.reach = nestedRematch.reach;
    							}
    						}
    					}
    				}
    			}
    		}
    		function LinkedList() {
    			var head = { value: null, prev: null, next: null };
    			var tail = { value: null, prev: head, next: null };
    			head.next = tail;
    			this.head = head;
    			this.tail = tail;
    			this.length = 0;
    		}
    		function addAfter(list, node, value) {
    			var next = node.next;
    			var newNode = { value: value, prev: node, next: next };
    			node.next = newNode;
    			next.prev = newNode;
    			list.length++;
    			return newNode;
    		}
    		function removeRange(list, node, count) {
    			var next = node.next;
    			for (var i = 0; i < count && next !== list.tail; i++) {
    				next = next.next;
    			}
    			node.next = next;
    			next.prev = node;
    			list.length -= i;
    		}
    		function toArray(list) {
    			var array = [];
    			var node = list.head.next;
    			while (node !== list.tail) {
    				array.push(node.value);
    				node = node.next;
    			}
    			return array;
    		}
    		if (!_self.document) {
    			if (!_self.addEventListener) {
    				return _;
    			}
    			if (!_.disableWorkerMessageHandler) {
    				_self.addEventListener('message', function (evt) {
    					var message = JSON.parse(evt.data);
    					var lang = message.language;
    					var code = message.code;
    					var immediateClose = message.immediateClose;
    					_self.postMessage(_.highlight(code, _.languages[lang], lang));
    					if (immediateClose) {
    						_self.close();
    					}
    				}, false);
    			}
    			return _;
    		}
    		var script = _.util.currentScript();
    		if (script) {
    			_.filename = script.src;
    			if (script.hasAttribute('data-manual')) {
    				_.manual = true;
    			}
    		}
    		function highlightAutomaticallyCallback() {
    			if (!_.manual) {
    				_.highlightAll();
    			}
    		}
    		if (!_.manual) {
    			var readyState = document.readyState;
    			if (readyState === 'loading' || readyState === 'interactive' && script && script.defer) {
    				document.addEventListener('DOMContentLoaded', highlightAutomaticallyCallback);
    			} else {
    				if (window.requestAnimationFrame) {
    					window.requestAnimationFrame(highlightAutomaticallyCallback);
    				} else {
    					window.setTimeout(highlightAutomaticallyCallback, 16);
    				}
    			}
    		}
    		return _;
    	}(_self));
    	if (module.exports) {
    		module.exports = Prism;
    	}
    	if (typeof commonjsGlobal !== 'undefined') {
    		commonjsGlobal.Prism = Prism;
    	}
    	Prism.languages.markup = {
    		'comment': {
    			pattern: /<!--(?:(?!<!--)[\s\S])*?-->/,
    			greedy: true
    		},
    		'prolog': {
    			pattern: /<\?[\s\S]+?\?>/,
    			greedy: true
    		},
    		'doctype': {
    			pattern: /<!DOCTYPE(?:[^>"'[\]]|"[^"]*"|'[^']*')+(?:\[(?:[^<"'\]]|"[^"]*"|'[^']*'|<(?!!--)|<!--(?:[^-]|-(?!->))*-->)*\]\s*)?>/i,
    			greedy: true,
    			inside: {
    				'internal-subset': {
    					pattern: /(^[^\[]*\[)[\s\S]+(?=\]>$)/,
    					lookbehind: true,
    					greedy: true,
    					inside: null
    				},
    				'string': {
    					pattern: /"[^"]*"|'[^']*'/,
    					greedy: true
    				},
    				'punctuation': /^<!|>$|[[\]]/,
    				'doctype-tag': /^DOCTYPE/i,
    				'name': /[^\s<>'"]+/
    			}
    		},
    		'cdata': {
    			pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    			greedy: true
    		},
    		'tag': {
    			pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
    			greedy: true,
    			inside: {
    				'tag': {
    					pattern: /^<\/?[^\s>\/]+/,
    					inside: {
    						'punctuation': /^<\/?/,
    						'namespace': /^[^\s>\/:]+:/
    					}
    				},
    				'special-attr': [],
    				'attr-value': {
    					pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
    					inside: {
    						'punctuation': [
    							{
    								pattern: /^=/,
    								alias: 'attr-equals'
    							},
    							/"|'/
    						]
    					}
    				},
    				'punctuation': /\/?>/,
    				'attr-name': {
    					pattern: /[^\s>\/]+/,
    					inside: {
    						'namespace': /^[^\s>\/:]+:/
    					}
    				}
    			}
    		},
    		'entity': [
    			{
    				pattern: /&[\da-z]{1,8};/i,
    				alias: 'named-entity'
    			},
    			/&#x?[\da-f]{1,8};/i
    		]
    	};
    	Prism.languages.markup['tag'].inside['attr-value'].inside['entity'] =
    		Prism.languages.markup['entity'];
    	Prism.languages.markup['doctype'].inside['internal-subset'].inside = Prism.languages.markup;
    	Prism.hooks.add('wrap', function (env) {
    		if (env.type === 'entity') {
    			env.attributes['title'] = env.content.replace(/&amp;/, '&');
    		}
    	});
    	Object.defineProperty(Prism.languages.markup.tag, 'addInlined', {
    		value: function addInlined(tagName, lang) {
    			var includedCdataInside = {};
    			includedCdataInside['language-' + lang] = {
    				pattern: /(^<!\[CDATA\[)[\s\S]+?(?=\]\]>$)/i,
    				lookbehind: true,
    				inside: Prism.languages[lang]
    			};
    			includedCdataInside['cdata'] = /^<!\[CDATA\[|\]\]>$/i;
    			var inside = {
    				'included-cdata': {
    					pattern: /<!\[CDATA\[[\s\S]*?\]\]>/i,
    					inside: includedCdataInside
    				}
    			};
    			inside['language-' + lang] = {
    				pattern: /[\s\S]+/,
    				inside: Prism.languages[lang]
    			};
    			var def = {};
    			def[tagName] = {
    				pattern: RegExp(/(<__[^>]*>)(?:<!\[CDATA\[(?:[^\]]|\](?!\]>))*\]\]>|(?!<!\[CDATA\[)[\s\S])*?(?=<\/__>)/.source.replace(/__/g, function () { return tagName; }), 'i'),
    				lookbehind: true,
    				greedy: true,
    				inside: inside
    			};
    			Prism.languages.insertBefore('markup', 'cdata', def);
    		}
    	});
    	Object.defineProperty(Prism.languages.markup.tag, 'addAttribute', {
    		value: function (attrName, lang) {
    			Prism.languages.markup.tag.inside['special-attr'].push({
    				pattern: RegExp(
    					/(^|["'\s])/.source + '(?:' + attrName + ')' + /\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))/.source,
    					'i'
    				),
    				lookbehind: true,
    				inside: {
    					'attr-name': /^[^\s=]+/,
    					'attr-value': {
    						pattern: /=[\s\S]+/,
    						inside: {
    							'value': {
    								pattern: /(^=\s*(["']|(?!["'])))\S[\s\S]*(?=\2$)/,
    								lookbehind: true,
    								alias: [lang, 'language-' + lang],
    								inside: Prism.languages[lang]
    							},
    							'punctuation': [
    								{
    									pattern: /^=/,
    									alias: 'attr-equals'
    								},
    								/"|'/
    							]
    						}
    					}
    				}
    			});
    		}
    	});
    	Prism.languages.html = Prism.languages.markup;
    	Prism.languages.mathml = Prism.languages.markup;
    	Prism.languages.svg = Prism.languages.markup;
    	Prism.languages.xml = Prism.languages.extend('markup', {});
    	Prism.languages.ssml = Prism.languages.xml;
    	Prism.languages.atom = Prism.languages.xml;
    	Prism.languages.rss = Prism.languages.xml;
    	(function (Prism) {
    		var string = /(?:"(?:\\(?:\r\n|[\s\S])|[^"\\\r\n])*"|'(?:\\(?:\r\n|[\s\S])|[^'\\\r\n])*')/;
    		Prism.languages.css = {
    			'comment': /\/\*[\s\S]*?\*\//,
    			'atrule': {
    				pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
    				inside: {
    					'rule': /^@[\w-]+/,
    					'selector-function-argument': {
    						pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
    						lookbehind: true,
    						alias: 'selector'
    					},
    					'keyword': {
    						pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
    						lookbehind: true
    					}
    				}
    			},
    			'url': {
    				pattern: RegExp('\\burl\\((?:' + string.source + '|' + /(?:[^\\\r\n()"']|\\[\s\S])*/.source + ')\\)', 'i'),
    				greedy: true,
    				inside: {
    					'function': /^url/i,
    					'punctuation': /^\(|\)$/,
    					'string': {
    						pattern: RegExp('^' + string.source + '$'),
    						alias: 'url'
    					}
    				}
    			},
    			'selector': {
    				pattern: RegExp('(^|[{}\\s])[^{}\\s](?:[^{};"\'\\s]|\\s+(?![\\s{])|' + string.source + ')*(?=\\s*\\{)'),
    				lookbehind: true
    			},
    			'string': {
    				pattern: string,
    				greedy: true
    			},
    			'property': {
    				pattern: /(^|[^-\w\xA0-\uFFFF])(?!\s)[-_a-z\xA0-\uFFFF](?:(?!\s)[-\w\xA0-\uFFFF])*(?=\s*:)/i,
    				lookbehind: true
    			},
    			'important': /!important\b/i,
    			'function': {
    				pattern: /(^|[^-a-z0-9])[-a-z0-9]+(?=\()/i,
    				lookbehind: true
    			},
    			'punctuation': /[(){};:,]/
    		};
    		Prism.languages.css['atrule'].inside.rest = Prism.languages.css;
    		var markup = Prism.languages.markup;
    		if (markup) {
    			markup.tag.addInlined('style', 'css');
    			markup.tag.addAttribute('style', 'css');
    		}
    	}(Prism));
    	Prism.languages.clike = {
    		'comment': [
    			{
    				pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
    				lookbehind: true,
    				greedy: true
    			},
    			{
    				pattern: /(^|[^\\:])\/\/.*/,
    				lookbehind: true,
    				greedy: true
    			}
    		],
    		'string': {
    			pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    			greedy: true
    		},
    		'class-name': {
    			pattern: /(\b(?:class|extends|implements|instanceof|interface|new|trait)\s+|\bcatch\s+\()[\w.\\]+/i,
    			lookbehind: true,
    			inside: {
    				'punctuation': /[.\\]/
    			}
    		},
    		'keyword': /\b(?:break|catch|continue|do|else|finally|for|function|if|in|instanceof|new|null|return|throw|try|while)\b/,
    		'boolean': /\b(?:false|true)\b/,
    		'function': /\b\w+(?=\()/,
    		'number': /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
    		'operator': /[<>]=?|[!=]=?=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    		'punctuation': /[{}[\];(),.:]/
    	};
    	Prism.languages.javascript = Prism.languages.extend('clike', {
    		'class-name': [
    			Prism.languages.clike['class-name'],
    			{
    				pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$A-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\.(?:constructor|prototype))/,
    				lookbehind: true
    			}
    		],
    		'keyword': [
    			{
    				pattern: /((?:^|\})\s*)catch\b/,
    				lookbehind: true
    			},
    			{
    				pattern: /(^|[^.]|\.\.\.\s*)\b(?:as|assert(?=\s*\{)|async(?=\s*(?:function\b|\(|[$\w\xA0-\uFFFF]|$))|await|break|case|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally(?=\s*(?:\{|$))|for|from(?=\s*(?:['"]|$))|function|(?:get|set)(?=\s*(?:[#\[$\w\xA0-\uFFFF]|$))|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    				lookbehind: true
    			},
    		],
    		'function': /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*(?:\.\s*(?:apply|bind|call)\s*)?\()/,
    		'number': {
    			pattern: RegExp(
    				/(^|[^\w$])/.source +
    				'(?:' +
    				(
    					/NaN|Infinity/.source +
    					'|' +
    					/0[bB][01]+(?:_[01]+)*n?/.source +
    					'|' +
    					/0[oO][0-7]+(?:_[0-7]+)*n?/.source +
    					'|' +
    					/0[xX][\dA-Fa-f]+(?:_[\dA-Fa-f]+)*n?/.source +
    					'|' +
    					/\d+(?:_\d+)*n/.source +
    					'|' +
    					/(?:\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\.\d+(?:_\d+)*)(?:[Ee][+-]?\d+(?:_\d+)*)?/.source
    				) +
    				')' +
    				/(?![\w$])/.source
    			),
    			lookbehind: true
    		},
    		'operator': /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/
    	});
    	Prism.languages.javascript['class-name'][0].pattern = /(\b(?:class|extends|implements|instanceof|interface|new)\s+)[\w.\\]+/;
    	Prism.languages.insertBefore('javascript', 'keyword', {
    		'regex': {
    			pattern: RegExp(
    				/((?:^|[^$\w\xA0-\uFFFF."'\])\s]|\b(?:return|yield))\s*)/.source +
    				/\//.source +
    				'(?:' +
    				/(?:\[(?:[^\]\\\r\n]|\\.)*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}/.source +
    				'|' +
    				/(?:\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.|\[(?:[^[\]\\\r\n]|\\.)*\])*\])*\]|\\.|[^/\\\[\r\n])+\/[dgimyus]{0,7}v[dgimyus]{0,7}/.source +
    				')' +
    				/(?=(?:\s|\/\*(?:[^*]|\*(?!\/))*\*\/)*(?:$|[\r\n,.;:})\]]|\/\/))/.source
    			),
    			lookbehind: true,
    			greedy: true,
    			inside: {
    				'regex-source': {
    					pattern: /^(\/)[\s\S]+(?=\/[a-z]*$)/,
    					lookbehind: true,
    					alias: 'language-regex',
    					inside: Prism.languages.regex
    				},
    				'regex-delimiter': /^\/|\/$/,
    				'regex-flags': /^[a-z]+$/,
    			}
    		},
    		'function-variable': {
    			pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*[=:]\s*(?:async\s*)?(?:\bfunction\b|(?:\((?:[^()]|\([^()]*\))*\)|(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)\s*=>))/,
    			alias: 'function'
    		},
    		'parameter': [
    			{
    				pattern: /(function(?:\s+(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*)?\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\))/,
    				lookbehind: true,
    				inside: Prism.languages.javascript
    			},
    			{
    				pattern: /(^|[^$\w\xA0-\uFFFF])(?!\s)[_$a-z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*=>)/i,
    				lookbehind: true,
    				inside: Prism.languages.javascript
    			},
    			{
    				pattern: /(\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*=>)/,
    				lookbehind: true,
    				inside: Prism.languages.javascript
    			},
    			{
    				pattern: /((?:\b|\s|^)(?!(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)(?![$\w\xA0-\uFFFF]))(?:(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*)\(\s*|\]\s*\(\s*)(?!\s)(?:[^()\s]|\s+(?![\s)])|\([^()]*\))+(?=\s*\)\s*\{)/,
    				lookbehind: true,
    				inside: Prism.languages.javascript
    			}
    		],
    		'constant': /\b[A-Z](?:[A-Z_]|\dx?)*\b/
    	});
    	Prism.languages.insertBefore('javascript', 'string', {
    		'hashbang': {
    			pattern: /^#!.*/,
    			greedy: true,
    			alias: 'comment'
    		},
    		'template-string': {
    			pattern: /`(?:\\[\s\S]|\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}|(?!\$\{)[^\\`])*`/,
    			greedy: true,
    			inside: {
    				'template-punctuation': {
    					pattern: /^`|`$/,
    					alias: 'string'
    				},
    				'interpolation': {
    					pattern: /((?:^|[^\\])(?:\\{2})*)\$\{(?:[^{}]|\{(?:[^{}]|\{[^}]*\})*\})+\}/,
    					lookbehind: true,
    					inside: {
    						'interpolation-punctuation': {
    							pattern: /^\$\{|\}$/,
    							alias: 'punctuation'
    						},
    						rest: Prism.languages.javascript
    					}
    				},
    				'string': /[\s\S]+/
    			}
    		},
    		'string-property': {
    			pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
    			lookbehind: true,
    			greedy: true,
    			alias: 'property'
    		}
    	});
    	Prism.languages.insertBefore('javascript', 'operator', {
    		'literal-property': {
    			pattern: /((?:^|[,{])[ \t]*)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?=\s*:)/m,
    			lookbehind: true,
    			alias: 'property'
    		},
    	});
    	if (Prism.languages.markup) {
    		Prism.languages.markup.tag.addInlined('script', 'javascript');
    		Prism.languages.markup.tag.addAttribute(
    			/on(?:abort|blur|change|click|composition(?:end|start|update)|dblclick|error|focus(?:in|out)?|key(?:down|up)|load|mouse(?:down|enter|leave|move|out|over|up)|reset|resize|scroll|select|slotchange|submit|unload|wheel)/.source,
    			'javascript'
    		);
    	}
    	Prism.languages.js = Prism.languages.javascript;
    	(function () {
    		if (typeof Prism === 'undefined' || typeof document === 'undefined') {
    			return;
    		}
    		if (!Element.prototype.matches) {
    			Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
    		}
    		var LOADING_MESSAGE = 'Loading…';
    		var FAILURE_MESSAGE = function (status, message) {
    			return '✖ Error ' + status + ' while fetching file: ' + message;
    		};
    		var FAILURE_EMPTY_MESSAGE = '✖ Error: File does not exist or is empty';
    		var EXTENSIONS = {
    			'js': 'javascript',
    			'py': 'python',
    			'rb': 'ruby',
    			'ps1': 'powershell',
    			'psm1': 'powershell',
    			'sh': 'bash',
    			'bat': 'batch',
    			'h': 'c',
    			'tex': 'latex'
    		};
    		var STATUS_ATTR = 'data-src-status';
    		var STATUS_LOADING = 'loading';
    		var STATUS_LOADED = 'loaded';
    		var STATUS_FAILED = 'failed';
    		var SELECTOR = 'pre[data-src]:not([' + STATUS_ATTR + '="' + STATUS_LOADED + '"])'
    			+ ':not([' + STATUS_ATTR + '="' + STATUS_LOADING + '"])';
    		function loadFile(src, success, error) {
    			var xhr = new XMLHttpRequest();
    			xhr.open('GET', src, true);
    			xhr.onreadystatechange = function () {
    				if (xhr.readyState == 4) {
    					if (xhr.status < 400 && xhr.responseText) {
    						success(xhr.responseText);
    					} else {
    						if (xhr.status >= 400) {
    							error(FAILURE_MESSAGE(xhr.status, xhr.statusText));
    						} else {
    							error(FAILURE_EMPTY_MESSAGE);
    						}
    					}
    				}
    			};
    			xhr.send(null);
    		}
    		function parseRange(range) {
    			var m = /^\s*(\d+)\s*(?:(,)\s*(?:(\d+)\s*)?)?$/.exec(range || '');
    			if (m) {
    				var start = Number(m[1]);
    				var comma = m[2];
    				var end = m[3];
    				if (!comma) {
    					return [start, start];
    				}
    				if (!end) {
    					return [start, undefined];
    				}
    				return [start, Number(end)];
    			}
    			return undefined;
    		}
    		Prism.hooks.add('before-highlightall', function (env) {
    			env.selector += ', ' + SELECTOR;
    		});
    		Prism.hooks.add('before-sanity-check', function (env) {
    			var pre =  (env.element);
    			if (pre.matches(SELECTOR)) {
    				env.code = '';
    				pre.setAttribute(STATUS_ATTR, STATUS_LOADING);
    				var code = pre.appendChild(document.createElement('CODE'));
    				code.textContent = LOADING_MESSAGE;
    				var src = pre.getAttribute('data-src');
    				var language = env.language;
    				if (language === 'none') {
    					var extension = (/\.(\w+)$/.exec(src) || [, 'none'])[1];
    					language = EXTENSIONS[extension] || extension;
    				}
    				Prism.util.setLanguage(code, language);
    				Prism.util.setLanguage(pre, language);
    				var autoloader = Prism.plugins.autoloader;
    				if (autoloader) {
    					autoloader.loadLanguages(language);
    				}
    				loadFile(
    					src,
    					function (text) {
    						pre.setAttribute(STATUS_ATTR, STATUS_LOADED);
    						var range = parseRange(pre.getAttribute('data-range'));
    						if (range) {
    							var lines = text.split(/\r\n?|\n/g);
    							var start = range[0];
    							var end = range[1] == null ? lines.length : range[1];
    							if (start < 0) { start += lines.length; }
    							start = Math.max(0, Math.min(start - 1, lines.length));
    							if (end < 0) { end += lines.length; }
    							end = Math.max(0, Math.min(end, lines.length));
    							text = lines.slice(start, end).join('\n');
    							if (!pre.hasAttribute('data-start')) {
    								pre.setAttribute('data-start', String(start + 1));
    							}
    						}
    						code.textContent = text;
    						Prism.highlightElement(code);
    					},
    					function (error) {
    						pre.setAttribute(STATUS_ATTR, STATUS_FAILED);
    						code.textContent = error;
    					}
    				);
    			}
    		});
    		Prism.plugins.fileHighlight = {
    			highlight: function highlight(container) {
    				var elements = (container || document).querySelectorAll(SELECTOR);
    				for (var i = 0, element; (element = elements[i++]);) {
    					Prism.highlightElement(element);
    				}
    			}
    		};
    		var logged = false;
    		Prism.fileHighlight = function () {
    			if (!logged) {
    				console.warn('Prism.fileHighlight is deprecated. Use `Prism.plugins.fileHighlight.highlight` instead.');
    				logged = true;
    			}
    			Prism.plugins.fileHighlight.highlight.apply(this, arguments);
    		};
    	}());
    } (prism));

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
    const markupCode = (text) => {
        const result = INVISIBLE_SPACE + stringify(prism.exports.util.encode(prism.exports.tokenize(text.slice(0, 600), prism.exports.languages.javascript)), 'javascript');
        return result;
    };

    let CodePanoItem = class CodePanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.body.add_style_class_name('pano-item-body-code');
            const label = new st1.Label({
                style_class: 'pano-item-body-code-content',
                clip_to_allocation: true,
            });
            label.clutter_text.use_markup = true;
            label.clutter_text.set_markup(markupCode(this.dbItem.content.trim()));
            label.clutter_text.ellipsize = pango1.EllipsizeMode.END;
            this.body.add_child(label);
            this.connect('activated', this.setClipboardContent.bind(this));
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
            const colorContainer = new st1.BoxLayout({
                vertical: false,
                x_expand: true,
                y_expand: true,
                y_align: clutter10.ActorAlign.FILL,
                x_align: clutter10.ActorAlign.FILL,
                style_class: 'color-container',
                style: `background-color: ${this.dbItem.content};`,
            });
            colorContainer.add_child(new st1.Label({
                x_align: clutter10.ActorAlign.CENTER,
                y_align: clutter10.ActorAlign.CENTER,
                x_expand: true,
                y_expand: true,
                text: this.dbItem.content,
                style_class: 'color-label',
            }));
            colorContainer.add_constraint(new clutter10.AlignConstraint({
                source: this,
                align_axis: clutter10.AlignAxis.Y_AXIS,
                factor: 0.005,
            }));
            this.body.add_child(colorContainer);
            this.connect('activated', this.setClipboardContent.bind(this));
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

    let FilePanoItem = class FilePanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.fileList = JSON.parse(this.dbItem.content);
            this.operation = this.dbItem.metaData || 'copy';
            this.body.add_style_class_name('pano-item-body-file');
            const container = new st1.BoxLayout({
                style_class: 'copied-files-container',
                vertical: true,
                x_expand: true,
                clip_to_allocation: true,
            });
            this.fileList
                .map((f) => {
                const items = f.split('://').filter((c) => !!c);
                return decodeURIComponent(items[items.length - 1]);
            })
                .slice(0, 11)
                .forEach((uri, index) => {
                const bl = new st1.BoxLayout({
                    vertical: false,
                    style_class: `copied-file-name ${index % 2 === 0 ? 'even' : 'odd'}`,
                    x_expand: true,
                    x_align: clutter10.ActorAlign.FILL,
                    clip_to_allocation: true,
                    y_align: clutter10.ActorAlign.FILL,
                });
                bl.add_child(new st1.Icon({
                    icon_name: this.operation === FileOperation.CUT ? 'edit-cut-symbolic' : 'edit-copy-symbolic',
                    x_align: clutter10.ActorAlign.START,
                    icon_size: 13,
                    style_class: 'file-icon',
                }));
                const hasMore = index === 10 && this.fileList.length > 11;
                const uriLabel = new st1.Label({
                    text: hasMore ? `...and ${this.fileList.length - index} more` : uri,
                    style_class: `pano-item-body-file-name-label ${hasMore ? 'has-more' : ''}`,
                    x_align: clutter10.ActorAlign.FILL,
                    x_expand: true,
                });
                uriLabel.clutter_text.ellipsize = pango1.EllipsizeMode.MIDDLE;
                bl.add_child(uriLabel);
                container.add_child(bl);
            });
            this.body.add_child(container);
            this.connect('activated', this.setClipboardContent.bind(this));
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

    const BYTE_UNITS = [
    	'B',
    	'kB',
    	'MB',
    	'GB',
    	'TB',
    	'PB',
    	'EB',
    	'ZB',
    	'YB',
    ];
    const BIBYTE_UNITS = [
    	'B',
    	'kiB',
    	'MiB',
    	'GiB',
    	'TiB',
    	'PiB',
    	'EiB',
    	'ZiB',
    	'YiB',
    ];
    const BIT_UNITS = [
    	'b',
    	'kbit',
    	'Mbit',
    	'Gbit',
    	'Tbit',
    	'Pbit',
    	'Ebit',
    	'Zbit',
    	'Ybit',
    ];
    const BIBIT_UNITS = [
    	'b',
    	'kibit',
    	'Mibit',
    	'Gibit',
    	'Tibit',
    	'Pibit',
    	'Eibit',
    	'Zibit',
    	'Yibit',
    ];
    const toLocaleString = (number, locale, options) => {
    	let result = number;
    	if (typeof locale === 'string' || Array.isArray(locale)) {
    		result = number.toLocaleString(locale, options);
    	} else if (locale === true || options !== undefined) {
    		result = number.toLocaleString(undefined, options);
    	}
    	return result;
    };
    function prettyBytes(number, options) {
    	if (!Number.isFinite(number)) {
    		throw new TypeError(`Expected a finite number, got ${typeof number}: ${number}`);
    	}
    	options = {
    		bits: false,
    		binary: false,
    		...options,
    	};
    	const UNITS = options.bits
    		? (options.binary ? BIBIT_UNITS : BIT_UNITS)
    		: (options.binary ? BIBYTE_UNITS : BYTE_UNITS);
    	if (options.signed && number === 0) {
    		return ` 0 ${UNITS[0]}`;
    	}
    	const isNegative = number < 0;
    	const prefix = isNegative ? '-' : (options.signed ? '+' : '');
    	if (isNegative) {
    		number = -number;
    	}
    	let localeOptions;
    	if (options.minimumFractionDigits !== undefined) {
    		localeOptions = {minimumFractionDigits: options.minimumFractionDigits};
    	}
    	if (options.maximumFractionDigits !== undefined) {
    		localeOptions = {maximumFractionDigits: options.maximumFractionDigits, ...localeOptions};
    	}
    	if (number < 1) {
    		const numberString = toLocaleString(number, options.locale, localeOptions);
    		return prefix + numberString + ' ' + UNITS[0];
    	}
    	const exponent = Math.min(Math.floor(options.binary ? Math.log(number) / Math.log(1024) : Math.log10(number) / 3), UNITS.length - 1);
    	number /= (options.binary ? 1024 : 1000) ** exponent;
    	if (!localeOptions) {
    		number = number.toPrecision(3);
    	}
    	const numberString = toLocaleString(Number(number), options.locale, localeOptions);
    	const unit = UNITS[exponent];
    	return prefix + numberString + ' ' + unit;
    }

    const NO_IMAGE_FOUND_FILE_NAME = 'no-image-found.png';
    let ImagePanoItem = class ImagePanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.body.add_style_class_name('pano-item-body-image');
            const { width, height, size } = JSON.parse(dbItem.metaData || '{}');
            let imageFilePath = `file://${getImagesPath()}/${this.dbItem.content}.png`;
            let backgroundSize = 'contain';
            const imageFile = gio2.File.new_for_uri(imageFilePath);
            if (!imageFile.query_exists(null)) {
                imageFilePath = `file://${getCurrentExtension().path}/images/${NO_IMAGE_FOUND_FILE_NAME}`;
                backgroundSize = 'cover';
            }
            this.body.style = `background-image: url(${imageFilePath}); background-size: ${backgroundSize};`;
            const metaContainer = new st1.BoxLayout({
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
            const resolutionTitle = new st1.Label({
                text: 'Resolution',
                x_align: clutter10.ActorAlign.START,
                x_expand: true,
                style_class: 'pano-item-body-image-meta-title',
            });
            const resolutionValue = new st1.Label({
                text: `${width} x ${height}`,
                x_align: clutter10.ActorAlign.END,
                x_expand: false,
                style_class: 'pano-item-body-image-meta-value',
            });
            resolutionContainer.add_child(resolutionTitle);
            resolutionContainer.add_child(resolutionValue);
            const sizeContainer = new st1.BoxLayout({
                vertical: false,
                x_expand: true,
                y_align: clutter10.ActorAlign.FILL,
                x_align: clutter10.ActorAlign.FILL,
                style_class: 'pano-item-body-image-size-container',
            });
            const sizeLabel = new st1.Label({
                text: 'Size',
                x_align: clutter10.ActorAlign.START,
                x_expand: true,
                style_class: 'pano-item-body-image-meta-title',
            });
            const sizeValue = new st1.Label({
                text: prettyBytes(size),
                x_align: clutter10.ActorAlign.END,
                x_expand: false,
                style_class: 'pano-item-body-image-meta-value',
            });
            sizeContainer.add_child(sizeLabel);
            sizeContainer.add_child(sizeValue);
            metaContainer.add_child(resolutionContainer);
            metaContainer.add_child(sizeContainer);
            metaContainer.add_constraint(new clutter10.AlignConstraint({
                source: this,
                align_axis: clutter10.AlignAxis.Y_AXIS,
                factor: 0.001,
            }));
            this.body.add_child(metaContainer);
            this.connect('activated', this.setClipboardContent.bind(this));
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

    const DEFAULT_LINK_PREVIEW_IMAGE_NAME = 'link-preview.png';
    let LinkPanoItem = class LinkPanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
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
                descriptionText = 'No Description';
            }
            else {
                descriptionText = decodeURI(description);
            }
            this.body.add_style_class_name('pano-item-body-link');
            const metaContainer = new st1.BoxLayout({
                style_class: 'pano-item-body-meta-container',
                vertical: true,
                x_expand: true,
                y_expand: false,
                y_align: clutter10.ActorAlign.END,
                x_align: clutter10.ActorAlign.FILL,
            });
            const titleLabel = new st1.Label({
                text: titleText,
                style_class: 'link-title-label',
            });
            const descriptionLabel = new st1.Label({
                text: descriptionText,
                style_class: 'link-description-label',
            });
            descriptionLabel.clutter_text.single_line_mode = true;
            const linkLabel = new st1.Label({
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
            metaContainer.add_child(titleLabel);
            metaContainer.add_child(descriptionLabel);
            metaContainer.add_child(linkLabel);
            this.body.add_child(imageContainer);
            this.body.add_child(metaContainer);
            this.connect('activated', this.setClipboardContent.bind(this));
        }
        setClipboardContent() {
            clipboardManager.setContent(new ClipboardContent({
                type: ContentType.TEXT,
                value: this.dbItem.content,
            }));
        }
    };
    LinkPanoItem = __decorate([
        registerGObjectClass
    ], LinkPanoItem);

    let TextPanoItem = class TextPanoItem extends PanoItem {
        constructor(dbItem) {
            super(dbItem);
            this.body.add_style_class_name('pano-item-body-text');
            const label = new st1.Label({
                text: this.dbItem.content.trim(),
                style_class: 'pano-item-body-text-content',
            });
            label.clutter_text.line_wrap = true;
            label.clutter_text.line_wrap_mode = pango1.WrapMode.WORD_CHAR;
            label.clutter_text.ellipsize = pango1.EllipsizeMode.END;
            this.body.add_child(label);
            this.connect('activated', this.setClipboardContent.bind(this));
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

    var htmlDecodeTree = new Uint16Array([7489, 60, 213, 305, 650, 1181, 1403, 1488, 1653, 1758, 1954, 2006, 2063, 2634, 2705, 3489, 3693, 3849, 3878, 4298, 4648, 4833, 5141, 5277, 5315, 5343, 5413, 0, 0, 0, 0, 0, 0, 5483, 5837, 6541, 7186, 7645, 8062, 8288, 8624, 8845, 9152, 9211, 9282, 10276, 10514, 11528, 11848, 12238, 12310, 12986, 13881, 14252, 14590, 14888, 14961, 15072, 15150, 2048, 69, 77, 97, 98, 99, 102, 103, 108, 109, 110, 111, 112, 114, 115, 116, 117, 92, 98, 102, 109, 115, 127, 132, 139, 144, 149, 152, 166, 179, 185, 200, 207, 108, 105, 103, 32827, 198, 16582, 80, 32827, 38, 16422, 99, 117, 116, 101, 32827, 193, 16577, 114, 101, 118, 101, 59, 16642, 256, 105, 121, 120, 125, 114, 99, 32827, 194, 16578, 59, 17424, 114, 59, 49152, 55349, 56580, 114, 97, 118, 101, 32827, 192, 16576, 112, 104, 97, 59, 17297, 97, 99, 114, 59, 16640, 100, 59, 27219, 256, 103, 112, 157, 161, 111, 110, 59, 16644, 102, 59, 49152, 55349, 56632, 112, 108, 121, 70, 117, 110, 99, 116, 105, 111, 110, 59, 24673, 105, 110, 103, 32827, 197, 16581, 256, 99, 115, 190, 195, 114, 59, 49152, 55349, 56476, 105, 103, 110, 59, 25172, 105, 108, 100, 101, 32827, 195, 16579, 109, 108, 32827, 196, 16580, 1024, 97, 99, 101, 102, 111, 114, 115, 117, 229, 251, 254, 279, 284, 290, 295, 298, 256, 99, 114, 234, 242, 107, 115, 108, 97, 115, 104, 59, 25110, 374, 246, 248, 59, 27367, 101, 100, 59, 25350, 121, 59, 17425, 384, 99, 114, 116, 261, 267, 276, 97, 117, 115, 101, 59, 25141, 110, 111, 117, 108, 108, 105, 115, 59, 24876, 97, 59, 17298, 114, 59, 49152, 55349, 56581, 112, 102, 59, 49152, 55349, 56633, 101, 118, 101, 59, 17112, 99, 242, 275, 109, 112, 101, 113, 59, 25166, 1792, 72, 79, 97, 99, 100, 101, 102, 104, 105, 108, 111, 114, 115, 117, 333, 337, 342, 384, 414, 418, 437, 439, 442, 476, 533, 627, 632, 638, 99, 121, 59, 17447, 80, 89, 32827, 169, 16553, 384, 99, 112, 121, 349, 354, 378, 117, 116, 101, 59, 16646, 256, 59, 105, 359, 360, 25298, 116, 97, 108, 68, 105, 102, 102, 101, 114, 101, 110, 116, 105, 97, 108, 68, 59, 24901, 108, 101, 121, 115, 59, 24877, 512, 97, 101, 105, 111, 393, 398, 404, 408, 114, 111, 110, 59, 16652, 100, 105, 108, 32827, 199, 16583, 114, 99, 59, 16648, 110, 105, 110, 116, 59, 25136, 111, 116, 59, 16650, 256, 100, 110, 423, 429, 105, 108, 108, 97, 59, 16568, 116, 101, 114, 68, 111, 116, 59, 16567, 242, 383, 105, 59, 17319, 114, 99, 108, 101, 512, 68, 77, 80, 84, 455, 459, 465, 470, 111, 116, 59, 25241, 105, 110, 117, 115, 59, 25238, 108, 117, 115, 59, 25237, 105, 109, 101, 115, 59, 25239, 111, 256, 99, 115, 482, 504, 107, 119, 105, 115, 101, 67, 111, 110, 116, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 108, 59, 25138, 101, 67, 117, 114, 108, 121, 256, 68, 81, 515, 527, 111, 117, 98, 108, 101, 81, 117, 111, 116, 101, 59, 24605, 117, 111, 116, 101, 59, 24601, 512, 108, 110, 112, 117, 542, 552, 583, 597, 111, 110, 256, 59, 101, 549, 550, 25143, 59, 27252, 384, 103, 105, 116, 559, 566, 570, 114, 117, 101, 110, 116, 59, 25185, 110, 116, 59, 25135, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 108, 59, 25134, 256, 102, 114, 588, 590, 59, 24834, 111, 100, 117, 99, 116, 59, 25104, 110, 116, 101, 114, 67, 108, 111, 99, 107, 119, 105, 115, 101, 67, 111, 110, 116, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 108, 59, 25139, 111, 115, 115, 59, 27183, 99, 114, 59, 49152, 55349, 56478, 112, 256, 59, 67, 644, 645, 25299, 97, 112, 59, 25165, 1408, 68, 74, 83, 90, 97, 99, 101, 102, 105, 111, 115, 672, 684, 688, 692, 696, 715, 727, 737, 742, 819, 1165, 256, 59, 111, 377, 677, 116, 114, 97, 104, 100, 59, 26897, 99, 121, 59, 17410, 99, 121, 59, 17413, 99, 121, 59, 17423, 384, 103, 114, 115, 703, 708, 711, 103, 101, 114, 59, 24609, 114, 59, 24993, 104, 118, 59, 27364, 256, 97, 121, 720, 725, 114, 111, 110, 59, 16654, 59, 17428, 108, 256, 59, 116, 733, 734, 25095, 97, 59, 17300, 114, 59, 49152, 55349, 56583, 256, 97, 102, 747, 807, 256, 99, 109, 752, 802, 114, 105, 116, 105, 99, 97, 108, 512, 65, 68, 71, 84, 768, 774, 790, 796, 99, 117, 116, 101, 59, 16564, 111, 372, 779, 781, 59, 17113, 98, 108, 101, 65, 99, 117, 116, 101, 59, 17117, 114, 97, 118, 101, 59, 16480, 105, 108, 100, 101, 59, 17116, 111, 110, 100, 59, 25284, 102, 101, 114, 101, 110, 116, 105, 97, 108, 68, 59, 24902, 1136, 829, 0, 0, 0, 834, 852, 0, 1029, 102, 59, 49152, 55349, 56635, 384, 59, 68, 69, 840, 841, 845, 16552, 111, 116, 59, 24796, 113, 117, 97, 108, 59, 25168, 98, 108, 101, 768, 67, 68, 76, 82, 85, 86, 867, 882, 898, 975, 994, 1016, 111, 110, 116, 111, 117, 114, 73, 110, 116, 101, 103, 114, 97, 236, 569, 111, 628, 889, 0, 0, 891, 187, 841, 110, 65, 114, 114, 111, 119, 59, 25043, 256, 101, 111, 903, 932, 102, 116, 384, 65, 82, 84, 912, 918, 929, 114, 114, 111, 119, 59, 25040, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 25044, 101, 229, 714, 110, 103, 256, 76, 82, 939, 964, 101, 102, 116, 256, 65, 82, 947, 953, 114, 114, 111, 119, 59, 26616, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 26618, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 26617, 105, 103, 104, 116, 256, 65, 84, 984, 990, 114, 114, 111, 119, 59, 25042, 101, 101, 59, 25256, 112, 577, 1001, 0, 0, 1007, 114, 114, 111, 119, 59, 25041, 111, 119, 110, 65, 114, 114, 111, 119, 59, 25045, 101, 114, 116, 105, 99, 97, 108, 66, 97, 114, 59, 25125, 110, 768, 65, 66, 76, 82, 84, 97, 1042, 1066, 1072, 1118, 1151, 892, 114, 114, 111, 119, 384, 59, 66, 85, 1053, 1054, 1058, 24979, 97, 114, 59, 26899, 112, 65, 114, 114, 111, 119, 59, 25077, 114, 101, 118, 101, 59, 17169, 101, 102, 116, 722, 1082, 0, 1094, 0, 1104, 105, 103, 104, 116, 86, 101, 99, 116, 111, 114, 59, 26960, 101, 101, 86, 101, 99, 116, 111, 114, 59, 26974, 101, 99, 116, 111, 114, 256, 59, 66, 1113, 1114, 25021, 97, 114, 59, 26966, 105, 103, 104, 116, 468, 1127, 0, 1137, 101, 101, 86, 101, 99, 116, 111, 114, 59, 26975, 101, 99, 116, 111, 114, 256, 59, 66, 1146, 1147, 25025, 97, 114, 59, 26967, 101, 101, 256, 59, 65, 1158, 1159, 25252, 114, 114, 111, 119, 59, 24999, 256, 99, 116, 1170, 1175, 114, 59, 49152, 55349, 56479, 114, 111, 107, 59, 16656, 2048, 78, 84, 97, 99, 100, 102, 103, 108, 109, 111, 112, 113, 115, 116, 117, 120, 1213, 1216, 1220, 1227, 1246, 1250, 1255, 1262, 1269, 1313, 1327, 1334, 1362, 1373, 1376, 1381, 71, 59, 16714, 72, 32827, 208, 16592, 99, 117, 116, 101, 32827, 201, 16585, 384, 97, 105, 121, 1234, 1239, 1244, 114, 111, 110, 59, 16666, 114, 99, 32827, 202, 16586, 59, 17453, 111, 116, 59, 16662, 114, 59, 49152, 55349, 56584, 114, 97, 118, 101, 32827, 200, 16584, 101, 109, 101, 110, 116, 59, 25096, 256, 97, 112, 1274, 1278, 99, 114, 59, 16658, 116, 121, 595, 1286, 0, 0, 1298, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 26107, 101, 114, 121, 83, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 26027, 256, 103, 112, 1318, 1322, 111, 110, 59, 16664, 102, 59, 49152, 55349, 56636, 115, 105, 108, 111, 110, 59, 17301, 117, 256, 97, 105, 1340, 1353, 108, 256, 59, 84, 1346, 1347, 27253, 105, 108, 100, 101, 59, 25154, 108, 105, 98, 114, 105, 117, 109, 59, 25036, 256, 99, 105, 1367, 1370, 114, 59, 24880, 109, 59, 27251, 97, 59, 17303, 109, 108, 32827, 203, 16587, 256, 105, 112, 1386, 1391, 115, 116, 115, 59, 25091, 111, 110, 101, 110, 116, 105, 97, 108, 69, 59, 24903, 640, 99, 102, 105, 111, 115, 1413, 1416, 1421, 1458, 1484, 121, 59, 17444, 114, 59, 49152, 55349, 56585, 108, 108, 101, 100, 595, 1431, 0, 0, 1443, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 26108, 101, 114, 121, 83, 109, 97, 108, 108, 83, 113, 117, 97, 114, 101, 59, 26026, 880, 1466, 0, 1471, 0, 0, 1476, 102, 59, 49152, 55349, 56637, 65, 108, 108, 59, 25088, 114, 105, 101, 114, 116, 114, 102, 59, 24881, 99, 242, 1483, 1536, 74, 84, 97, 98, 99, 100, 102, 103, 111, 114, 115, 116, 1512, 1516, 1519, 1530, 1536, 1554, 1558, 1563, 1565, 1571, 1644, 1650, 99, 121, 59, 17411, 32827, 62, 16446, 109, 109, 97, 256, 59, 100, 1527, 1528, 17299, 59, 17372, 114, 101, 118, 101, 59, 16670, 384, 101, 105, 121, 1543, 1548, 1552, 100, 105, 108, 59, 16674, 114, 99, 59, 16668, 59, 17427, 111, 116, 59, 16672, 114, 59, 49152, 55349, 56586, 59, 25305, 112, 102, 59, 49152, 55349, 56638, 101, 97, 116, 101, 114, 768, 69, 70, 71, 76, 83, 84, 1589, 1604, 1614, 1622, 1627, 1638, 113, 117, 97, 108, 256, 59, 76, 1598, 1599, 25189, 101, 115, 115, 59, 25307, 117, 108, 108, 69, 113, 117, 97, 108, 59, 25191, 114, 101, 97, 116, 101, 114, 59, 27298, 101, 115, 115, 59, 25207, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 27262, 105, 108, 100, 101, 59, 25203, 99, 114, 59, 49152, 55349, 56482, 59, 25195, 1024, 65, 97, 99, 102, 105, 111, 115, 117, 1669, 1675, 1686, 1691, 1694, 1706, 1726, 1738, 82, 68, 99, 121, 59, 17450, 256, 99, 116, 1680, 1684, 101, 107, 59, 17095, 59, 16478, 105, 114, 99, 59, 16676, 114, 59, 24844, 108, 98, 101, 114, 116, 83, 112, 97, 99, 101, 59, 24843, 496, 1711, 0, 1714, 102, 59, 24845, 105, 122, 111, 110, 116, 97, 108, 76, 105, 110, 101, 59, 25856, 256, 99, 116, 1731, 1733, 242, 1705, 114, 111, 107, 59, 16678, 109, 112, 324, 1744, 1752, 111, 119, 110, 72, 117, 109, 240, 303, 113, 117, 97, 108, 59, 25167, 1792, 69, 74, 79, 97, 99, 100, 102, 103, 109, 110, 111, 115, 116, 117, 1786, 1790, 1795, 1799, 1806, 1818, 1822, 1825, 1832, 1860, 1912, 1931, 1935, 1941, 99, 121, 59, 17429, 108, 105, 103, 59, 16690, 99, 121, 59, 17409, 99, 117, 116, 101, 32827, 205, 16589, 256, 105, 121, 1811, 1816, 114, 99, 32827, 206, 16590, 59, 17432, 111, 116, 59, 16688, 114, 59, 24849, 114, 97, 118, 101, 32827, 204, 16588, 384, 59, 97, 112, 1824, 1839, 1855, 256, 99, 103, 1844, 1847, 114, 59, 16682, 105, 110, 97, 114, 121, 73, 59, 24904, 108, 105, 101, 243, 989, 500, 1865, 0, 1890, 256, 59, 101, 1869, 1870, 25132, 256, 103, 114, 1875, 1880, 114, 97, 108, 59, 25131, 115, 101, 99, 116, 105, 111, 110, 59, 25282, 105, 115, 105, 98, 108, 101, 256, 67, 84, 1900, 1906, 111, 109, 109, 97, 59, 24675, 105, 109, 101, 115, 59, 24674, 384, 103, 112, 116, 1919, 1923, 1928, 111, 110, 59, 16686, 102, 59, 49152, 55349, 56640, 97, 59, 17305, 99, 114, 59, 24848, 105, 108, 100, 101, 59, 16680, 491, 1946, 0, 1950, 99, 121, 59, 17414, 108, 32827, 207, 16591, 640, 99, 102, 111, 115, 117, 1964, 1975, 1980, 1986, 2000, 256, 105, 121, 1969, 1973, 114, 99, 59, 16692, 59, 17433, 114, 59, 49152, 55349, 56589, 112, 102, 59, 49152, 55349, 56641, 483, 1991, 0, 1996, 114, 59, 49152, 55349, 56485, 114, 99, 121, 59, 17416, 107, 99, 121, 59, 17412, 896, 72, 74, 97, 99, 102, 111, 115, 2020, 2024, 2028, 2033, 2045, 2050, 2056, 99, 121, 59, 17445, 99, 121, 59, 17420, 112, 112, 97, 59, 17306, 256, 101, 121, 2038, 2043, 100, 105, 108, 59, 16694, 59, 17434, 114, 59, 49152, 55349, 56590, 112, 102, 59, 49152, 55349, 56642, 99, 114, 59, 49152, 55349, 56486, 1408, 74, 84, 97, 99, 101, 102, 108, 109, 111, 115, 116, 2085, 2089, 2092, 2128, 2147, 2483, 2488, 2503, 2509, 2615, 2631, 99, 121, 59, 17417, 32827, 60, 16444, 640, 99, 109, 110, 112, 114, 2103, 2108, 2113, 2116, 2125, 117, 116, 101, 59, 16697, 98, 100, 97, 59, 17307, 103, 59, 26602, 108, 97, 99, 101, 116, 114, 102, 59, 24850, 114, 59, 24990, 384, 97, 101, 121, 2135, 2140, 2145, 114, 111, 110, 59, 16701, 100, 105, 108, 59, 16699, 59, 17435, 256, 102, 115, 2152, 2416, 116, 1280, 65, 67, 68, 70, 82, 84, 85, 86, 97, 114, 2174, 2217, 2225, 2272, 2278, 2300, 2351, 2395, 912, 2410, 256, 110, 114, 2179, 2191, 103, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 26600, 114, 111, 119, 384, 59, 66, 82, 2201, 2202, 2206, 24976, 97, 114, 59, 25060, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 25030, 101, 105, 108, 105, 110, 103, 59, 25352, 111, 501, 2231, 0, 2243, 98, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 26598, 110, 468, 2248, 0, 2258, 101, 101, 86, 101, 99, 116, 111, 114, 59, 26977, 101, 99, 116, 111, 114, 256, 59, 66, 2267, 2268, 25027, 97, 114, 59, 26969, 108, 111, 111, 114, 59, 25354, 105, 103, 104, 116, 256, 65, 86, 2287, 2293, 114, 114, 111, 119, 59, 24980, 101, 99, 116, 111, 114, 59, 26958, 256, 101, 114, 2305, 2327, 101, 384, 59, 65, 86, 2313, 2314, 2320, 25251, 114, 114, 111, 119, 59, 24996, 101, 99, 116, 111, 114, 59, 26970, 105, 97, 110, 103, 108, 101, 384, 59, 66, 69, 2340, 2341, 2345, 25266, 97, 114, 59, 27087, 113, 117, 97, 108, 59, 25268, 112, 384, 68, 84, 86, 2359, 2370, 2380, 111, 119, 110, 86, 101, 99, 116, 111, 114, 59, 26961, 101, 101, 86, 101, 99, 116, 111, 114, 59, 26976, 101, 99, 116, 111, 114, 256, 59, 66, 2390, 2391, 25023, 97, 114, 59, 26968, 101, 99, 116, 111, 114, 256, 59, 66, 2405, 2406, 25020, 97, 114, 59, 26962, 105, 103, 104, 116, 225, 924, 115, 768, 69, 70, 71, 76, 83, 84, 2430, 2443, 2453, 2461, 2466, 2477, 113, 117, 97, 108, 71, 114, 101, 97, 116, 101, 114, 59, 25306, 117, 108, 108, 69, 113, 117, 97, 108, 59, 25190, 114, 101, 97, 116, 101, 114, 59, 25206, 101, 115, 115, 59, 27297, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 27261, 105, 108, 100, 101, 59, 25202, 114, 59, 49152, 55349, 56591, 256, 59, 101, 2493, 2494, 25304, 102, 116, 97, 114, 114, 111, 119, 59, 25050, 105, 100, 111, 116, 59, 16703, 384, 110, 112, 119, 2516, 2582, 2587, 103, 512, 76, 82, 108, 114, 2526, 2551, 2562, 2576, 101, 102, 116, 256, 65, 82, 2534, 2540, 114, 114, 111, 119, 59, 26613, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 26615, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 26614, 101, 102, 116, 256, 97, 114, 947, 2570, 105, 103, 104, 116, 225, 959, 105, 103, 104, 116, 225, 970, 102, 59, 49152, 55349, 56643, 101, 114, 256, 76, 82, 2594, 2604, 101, 102, 116, 65, 114, 114, 111, 119, 59, 24985, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 24984, 384, 99, 104, 116, 2622, 2624, 2626, 242, 2124, 59, 25008, 114, 111, 107, 59, 16705, 59, 25194, 1024, 97, 99, 101, 102, 105, 111, 115, 117, 2650, 2653, 2656, 2679, 2684, 2693, 2699, 2702, 112, 59, 26885, 121, 59, 17436, 256, 100, 108, 2661, 2671, 105, 117, 109, 83, 112, 97, 99, 101, 59, 24671, 108, 105, 110, 116, 114, 102, 59, 24883, 114, 59, 49152, 55349, 56592, 110, 117, 115, 80, 108, 117, 115, 59, 25107, 112, 102, 59, 49152, 55349, 56644, 99, 242, 2678, 59, 17308, 1152, 74, 97, 99, 101, 102, 111, 115, 116, 117, 2723, 2727, 2733, 2752, 2836, 2841, 3473, 3479, 3486, 99, 121, 59, 17418, 99, 117, 116, 101, 59, 16707, 384, 97, 101, 121, 2740, 2745, 2750, 114, 111, 110, 59, 16711, 100, 105, 108, 59, 16709, 59, 17437, 384, 103, 115, 119, 2759, 2800, 2830, 97, 116, 105, 118, 101, 384, 77, 84, 86, 2771, 2783, 2792, 101, 100, 105, 117, 109, 83, 112, 97, 99, 101, 59, 24587, 104, 105, 256, 99, 110, 2790, 2776, 235, 2777, 101, 114, 121, 84, 104, 105, 238, 2777, 116, 101, 100, 256, 71, 76, 2808, 2822, 114, 101, 97, 116, 101, 114, 71, 114, 101, 97, 116, 101, 242, 1651, 101, 115, 115, 76, 101, 115, 243, 2632, 76, 105, 110, 101, 59, 16394, 114, 59, 49152, 55349, 56593, 512, 66, 110, 112, 116, 2850, 2856, 2871, 2874, 114, 101, 97, 107, 59, 24672, 66, 114, 101, 97, 107, 105, 110, 103, 83, 112, 97, 99, 101, 59, 16544, 102, 59, 24853, 1664, 59, 67, 68, 69, 71, 72, 76, 78, 80, 82, 83, 84, 86, 2901, 2902, 2922, 2940, 2977, 3051, 3076, 3166, 3204, 3238, 3288, 3425, 3461, 27372, 256, 111, 117, 2907, 2916, 110, 103, 114, 117, 101, 110, 116, 59, 25186, 112, 67, 97, 112, 59, 25197, 111, 117, 98, 108, 101, 86, 101, 114, 116, 105, 99, 97, 108, 66, 97, 114, 59, 25126, 384, 108, 113, 120, 2947, 2954, 2971, 101, 109, 101, 110, 116, 59, 25097, 117, 97, 108, 256, 59, 84, 2962, 2963, 25184, 105, 108, 100, 101, 59, 49152, 8770, 824, 105, 115, 116, 115, 59, 25092, 114, 101, 97, 116, 101, 114, 896, 59, 69, 70, 71, 76, 83, 84, 2998, 2999, 3005, 3017, 3027, 3032, 3045, 25199, 113, 117, 97, 108, 59, 25201, 117, 108, 108, 69, 113, 117, 97, 108, 59, 49152, 8807, 824, 114, 101, 97, 116, 101, 114, 59, 49152, 8811, 824, 101, 115, 115, 59, 25209, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 49152, 10878, 824, 105, 108, 100, 101, 59, 25205, 117, 109, 112, 324, 3058, 3069, 111, 119, 110, 72, 117, 109, 112, 59, 49152, 8782, 824, 113, 117, 97, 108, 59, 49152, 8783, 824, 101, 256, 102, 115, 3082, 3111, 116, 84, 114, 105, 97, 110, 103, 108, 101, 384, 59, 66, 69, 3098, 3099, 3105, 25322, 97, 114, 59, 49152, 10703, 824, 113, 117, 97, 108, 59, 25324, 115, 768, 59, 69, 71, 76, 83, 84, 3125, 3126, 3132, 3140, 3147, 3160, 25198, 113, 117, 97, 108, 59, 25200, 114, 101, 97, 116, 101, 114, 59, 25208, 101, 115, 115, 59, 49152, 8810, 824, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 49152, 10877, 824, 105, 108, 100, 101, 59, 25204, 101, 115, 116, 101, 100, 256, 71, 76, 3176, 3193, 114, 101, 97, 116, 101, 114, 71, 114, 101, 97, 116, 101, 114, 59, 49152, 10914, 824, 101, 115, 115, 76, 101, 115, 115, 59, 49152, 10913, 824, 114, 101, 99, 101, 100, 101, 115, 384, 59, 69, 83, 3218, 3219, 3227, 25216, 113, 117, 97, 108, 59, 49152, 10927, 824, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 25312, 256, 101, 105, 3243, 3257, 118, 101, 114, 115, 101, 69, 108, 101, 109, 101, 110, 116, 59, 25100, 103, 104, 116, 84, 114, 105, 97, 110, 103, 108, 101, 384, 59, 66, 69, 3275, 3276, 3282, 25323, 97, 114, 59, 49152, 10704, 824, 113, 117, 97, 108, 59, 25325, 256, 113, 117, 3293, 3340, 117, 97, 114, 101, 83, 117, 256, 98, 112, 3304, 3321, 115, 101, 116, 256, 59, 69, 3312, 3315, 49152, 8847, 824, 113, 117, 97, 108, 59, 25314, 101, 114, 115, 101, 116, 256, 59, 69, 3331, 3334, 49152, 8848, 824, 113, 117, 97, 108, 59, 25315, 384, 98, 99, 112, 3347, 3364, 3406, 115, 101, 116, 256, 59, 69, 3355, 3358, 49152, 8834, 8402, 113, 117, 97, 108, 59, 25224, 99, 101, 101, 100, 115, 512, 59, 69, 83, 84, 3378, 3379, 3387, 3398, 25217, 113, 117, 97, 108, 59, 49152, 10928, 824, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 25313, 105, 108, 100, 101, 59, 49152, 8831, 824, 101, 114, 115, 101, 116, 256, 59, 69, 3416, 3419, 49152, 8835, 8402, 113, 117, 97, 108, 59, 25225, 105, 108, 100, 101, 512, 59, 69, 70, 84, 3438, 3439, 3445, 3455, 25153, 113, 117, 97, 108, 59, 25156, 117, 108, 108, 69, 113, 117, 97, 108, 59, 25159, 105, 108, 100, 101, 59, 25161, 101, 114, 116, 105, 99, 97, 108, 66, 97, 114, 59, 25124, 99, 114, 59, 49152, 55349, 56489, 105, 108, 100, 101, 32827, 209, 16593, 59, 17309, 1792, 69, 97, 99, 100, 102, 103, 109, 111, 112, 114, 115, 116, 117, 118, 3517, 3522, 3529, 3541, 3547, 3552, 3559, 3580, 3586, 3616, 3618, 3634, 3647, 3652, 108, 105, 103, 59, 16722, 99, 117, 116, 101, 32827, 211, 16595, 256, 105, 121, 3534, 3539, 114, 99, 32827, 212, 16596, 59, 17438, 98, 108, 97, 99, 59, 16720, 114, 59, 49152, 55349, 56594, 114, 97, 118, 101, 32827, 210, 16594, 384, 97, 101, 105, 3566, 3570, 3574, 99, 114, 59, 16716, 103, 97, 59, 17321, 99, 114, 111, 110, 59, 17311, 112, 102, 59, 49152, 55349, 56646, 101, 110, 67, 117, 114, 108, 121, 256, 68, 81, 3598, 3610, 111, 117, 98, 108, 101, 81, 117, 111, 116, 101, 59, 24604, 117, 111, 116, 101, 59, 24600, 59, 27220, 256, 99, 108, 3623, 3628, 114, 59, 49152, 55349, 56490, 97, 115, 104, 32827, 216, 16600, 105, 364, 3639, 3644, 100, 101, 32827, 213, 16597, 101, 115, 59, 27191, 109, 108, 32827, 214, 16598, 101, 114, 256, 66, 80, 3659, 3680, 256, 97, 114, 3664, 3667, 114, 59, 24638, 97, 99, 256, 101, 107, 3674, 3676, 59, 25566, 101, 116, 59, 25524, 97, 114, 101, 110, 116, 104, 101, 115, 105, 115, 59, 25564, 1152, 97, 99, 102, 104, 105, 108, 111, 114, 115, 3711, 3719, 3722, 3727, 3730, 3732, 3741, 3760, 3836, 114, 116, 105, 97, 108, 68, 59, 25090, 121, 59, 17439, 114, 59, 49152, 55349, 56595, 105, 59, 17318, 59, 17312, 117, 115, 77, 105, 110, 117, 115, 59, 16561, 256, 105, 112, 3746, 3757, 110, 99, 97, 114, 101, 112, 108, 97, 110, 229, 1693, 102, 59, 24857, 512, 59, 101, 105, 111, 3769, 3770, 3808, 3812, 27323, 99, 101, 100, 101, 115, 512, 59, 69, 83, 84, 3784, 3785, 3791, 3802, 25210, 113, 117, 97, 108, 59, 27311, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 25212, 105, 108, 100, 101, 59, 25214, 109, 101, 59, 24627, 256, 100, 112, 3817, 3822, 117, 99, 116, 59, 25103, 111, 114, 116, 105, 111, 110, 256, 59, 97, 549, 3833, 108, 59, 25117, 256, 99, 105, 3841, 3846, 114, 59, 49152, 55349, 56491, 59, 17320, 512, 85, 102, 111, 115, 3857, 3862, 3867, 3871, 79, 84, 32827, 34, 16418, 114, 59, 49152, 55349, 56596, 112, 102, 59, 24858, 99, 114, 59, 49152, 55349, 56492, 1536, 66, 69, 97, 99, 101, 102, 104, 105, 111, 114, 115, 117, 3902, 3907, 3911, 3936, 3955, 4007, 4010, 4013, 4246, 4265, 4276, 4286, 97, 114, 114, 59, 26896, 71, 32827, 174, 16558, 384, 99, 110, 114, 3918, 3923, 3926, 117, 116, 101, 59, 16724, 103, 59, 26603, 114, 256, 59, 116, 3932, 3933, 24992, 108, 59, 26902, 384, 97, 101, 121, 3943, 3948, 3953, 114, 111, 110, 59, 16728, 100, 105, 108, 59, 16726, 59, 17440, 256, 59, 118, 3960, 3961, 24860, 101, 114, 115, 101, 256, 69, 85, 3970, 3993, 256, 108, 113, 3975, 3982, 101, 109, 101, 110, 116, 59, 25099, 117, 105, 108, 105, 98, 114, 105, 117, 109, 59, 25035, 112, 69, 113, 117, 105, 108, 105, 98, 114, 105, 117, 109, 59, 26991, 114, 187, 3961, 111, 59, 17313, 103, 104, 116, 1024, 65, 67, 68, 70, 84, 85, 86, 97, 4033, 4075, 4083, 4130, 4136, 4187, 4231, 984, 256, 110, 114, 4038, 4050, 103, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 26601, 114, 111, 119, 384, 59, 66, 76, 4060, 4061, 4065, 24978, 97, 114, 59, 25061, 101, 102, 116, 65, 114, 114, 111, 119, 59, 25028, 101, 105, 108, 105, 110, 103, 59, 25353, 111, 501, 4089, 0, 4101, 98, 108, 101, 66, 114, 97, 99, 107, 101, 116, 59, 26599, 110, 468, 4106, 0, 4116, 101, 101, 86, 101, 99, 116, 111, 114, 59, 26973, 101, 99, 116, 111, 114, 256, 59, 66, 4125, 4126, 25026, 97, 114, 59, 26965, 108, 111, 111, 114, 59, 25355, 256, 101, 114, 4141, 4163, 101, 384, 59, 65, 86, 4149, 4150, 4156, 25250, 114, 114, 111, 119, 59, 24998, 101, 99, 116, 111, 114, 59, 26971, 105, 97, 110, 103, 108, 101, 384, 59, 66, 69, 4176, 4177, 4181, 25267, 97, 114, 59, 27088, 113, 117, 97, 108, 59, 25269, 112, 384, 68, 84, 86, 4195, 4206, 4216, 111, 119, 110, 86, 101, 99, 116, 111, 114, 59, 26959, 101, 101, 86, 101, 99, 116, 111, 114, 59, 26972, 101, 99, 116, 111, 114, 256, 59, 66, 4226, 4227, 25022, 97, 114, 59, 26964, 101, 99, 116, 111, 114, 256, 59, 66, 4241, 4242, 25024, 97, 114, 59, 26963, 256, 112, 117, 4251, 4254, 102, 59, 24861, 110, 100, 73, 109, 112, 108, 105, 101, 115, 59, 26992, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 25051, 256, 99, 104, 4281, 4284, 114, 59, 24859, 59, 25009, 108, 101, 68, 101, 108, 97, 121, 101, 100, 59, 27124, 1664, 72, 79, 97, 99, 102, 104, 105, 109, 111, 113, 115, 116, 117, 4324, 4337, 4343, 4349, 4377, 4382, 4433, 4438, 4449, 4455, 4533, 4539, 4543, 256, 67, 99, 4329, 4334, 72, 99, 121, 59, 17449, 121, 59, 17448, 70, 84, 99, 121, 59, 17452, 99, 117, 116, 101, 59, 16730, 640, 59, 97, 101, 105, 121, 4360, 4361, 4366, 4371, 4375, 27324, 114, 111, 110, 59, 16736, 100, 105, 108, 59, 16734, 114, 99, 59, 16732, 59, 17441, 114, 59, 49152, 55349, 56598, 111, 114, 116, 512, 68, 76, 82, 85, 4394, 4404, 4414, 4425, 111, 119, 110, 65, 114, 114, 111, 119, 187, 1054, 101, 102, 116, 65, 114, 114, 111, 119, 187, 2202, 105, 103, 104, 116, 65, 114, 114, 111, 119, 187, 4061, 112, 65, 114, 114, 111, 119, 59, 24977, 103, 109, 97, 59, 17315, 97, 108, 108, 67, 105, 114, 99, 108, 101, 59, 25112, 112, 102, 59, 49152, 55349, 56650, 626, 4461, 0, 0, 4464, 116, 59, 25114, 97, 114, 101, 512, 59, 73, 83, 85, 4475, 4476, 4489, 4527, 26017, 110, 116, 101, 114, 115, 101, 99, 116, 105, 111, 110, 59, 25235, 117, 256, 98, 112, 4495, 4510, 115, 101, 116, 256, 59, 69, 4503, 4504, 25231, 113, 117, 97, 108, 59, 25233, 101, 114, 115, 101, 116, 256, 59, 69, 4520, 4521, 25232, 113, 117, 97, 108, 59, 25234, 110, 105, 111, 110, 59, 25236, 99, 114, 59, 49152, 55349, 56494, 97, 114, 59, 25286, 512, 98, 99, 109, 112, 4552, 4571, 4617, 4619, 256, 59, 115, 4557, 4558, 25296, 101, 116, 256, 59, 69, 4557, 4565, 113, 117, 97, 108, 59, 25222, 256, 99, 104, 4576, 4613, 101, 101, 100, 115, 512, 59, 69, 83, 84, 4589, 4590, 4596, 4607, 25211, 113, 117, 97, 108, 59, 27312, 108, 97, 110, 116, 69, 113, 117, 97, 108, 59, 25213, 105, 108, 100, 101, 59, 25215, 84, 104, 225, 3980, 59, 25105, 384, 59, 101, 115, 4626, 4627, 4643, 25297, 114, 115, 101, 116, 256, 59, 69, 4636, 4637, 25219, 113, 117, 97, 108, 59, 25223, 101, 116, 187, 4627, 1408, 72, 82, 83, 97, 99, 102, 104, 105, 111, 114, 115, 4670, 4676, 4681, 4693, 4702, 4721, 4726, 4767, 4802, 4808, 4817, 79, 82, 78, 32827, 222, 16606, 65, 68, 69, 59, 24866, 256, 72, 99, 4686, 4690, 99, 121, 59, 17419, 121, 59, 17446, 256, 98, 117, 4698, 4700, 59, 16393, 59, 17316, 384, 97, 101, 121, 4709, 4714, 4719, 114, 111, 110, 59, 16740, 100, 105, 108, 59, 16738, 59, 17442, 114, 59, 49152, 55349, 56599, 256, 101, 105, 4731, 4745, 498, 4736, 0, 4743, 101, 102, 111, 114, 101, 59, 25140, 97, 59, 17304, 256, 99, 110, 4750, 4760, 107, 83, 112, 97, 99, 101, 59, 49152, 8287, 8202, 83, 112, 97, 99, 101, 59, 24585, 108, 100, 101, 512, 59, 69, 70, 84, 4779, 4780, 4786, 4796, 25148, 113, 117, 97, 108, 59, 25155, 117, 108, 108, 69, 113, 117, 97, 108, 59, 25157, 105, 108, 100, 101, 59, 25160, 112, 102, 59, 49152, 55349, 56651, 105, 112, 108, 101, 68, 111, 116, 59, 24795, 256, 99, 116, 4822, 4827, 114, 59, 49152, 55349, 56495, 114, 111, 107, 59, 16742, 2785, 4855, 4878, 4890, 4902, 0, 4908, 4913, 0, 0, 0, 0, 0, 4920, 4925, 4983, 4997, 0, 5119, 5124, 5130, 5136, 256, 99, 114, 4859, 4865, 117, 116, 101, 32827, 218, 16602, 114, 256, 59, 111, 4871, 4872, 24991, 99, 105, 114, 59, 26953, 114, 483, 4883, 0, 4886, 121, 59, 17422, 118, 101, 59, 16748, 256, 105, 121, 4894, 4899, 114, 99, 32827, 219, 16603, 59, 17443, 98, 108, 97, 99, 59, 16752, 114, 59, 49152, 55349, 56600, 114, 97, 118, 101, 32827, 217, 16601, 97, 99, 114, 59, 16746, 256, 100, 105, 4929, 4969, 101, 114, 256, 66, 80, 4936, 4957, 256, 97, 114, 4941, 4944, 114, 59, 16479, 97, 99, 256, 101, 107, 4951, 4953, 59, 25567, 101, 116, 59, 25525, 97, 114, 101, 110, 116, 104, 101, 115, 105, 115, 59, 25565, 111, 110, 256, 59, 80, 4976, 4977, 25283, 108, 117, 115, 59, 25230, 256, 103, 112, 4987, 4991, 111, 110, 59, 16754, 102, 59, 49152, 55349, 56652, 1024, 65, 68, 69, 84, 97, 100, 112, 115, 5013, 5038, 5048, 5060, 1000, 5074, 5079, 5107, 114, 114, 111, 119, 384, 59, 66, 68, 4432, 5024, 5028, 97, 114, 59, 26898, 111, 119, 110, 65, 114, 114, 111, 119, 59, 25029, 111, 119, 110, 65, 114, 114, 111, 119, 59, 24981, 113, 117, 105, 108, 105, 98, 114, 105, 117, 109, 59, 26990, 101, 101, 256, 59, 65, 5067, 5068, 25253, 114, 114, 111, 119, 59, 24997, 111, 119, 110, 225, 1011, 101, 114, 256, 76, 82, 5086, 5096, 101, 102, 116, 65, 114, 114, 111, 119, 59, 24982, 105, 103, 104, 116, 65, 114, 114, 111, 119, 59, 24983, 105, 256, 59, 108, 5113, 5114, 17362, 111, 110, 59, 17317, 105, 110, 103, 59, 16750, 99, 114, 59, 49152, 55349, 56496, 105, 108, 100, 101, 59, 16744, 109, 108, 32827, 220, 16604, 1152, 68, 98, 99, 100, 101, 102, 111, 115, 118, 5159, 5164, 5168, 5171, 5182, 5253, 5258, 5264, 5270, 97, 115, 104, 59, 25259, 97, 114, 59, 27371, 121, 59, 17426, 97, 115, 104, 256, 59, 108, 5179, 5180, 25257, 59, 27366, 256, 101, 114, 5187, 5189, 59, 25281, 384, 98, 116, 121, 5196, 5200, 5242, 97, 114, 59, 24598, 256, 59, 105, 5199, 5205, 99, 97, 108, 512, 66, 76, 83, 84, 5217, 5221, 5226, 5236, 97, 114, 59, 25123, 105, 110, 101, 59, 16508, 101, 112, 97, 114, 97, 116, 111, 114, 59, 26456, 105, 108, 100, 101, 59, 25152, 84, 104, 105, 110, 83, 112, 97, 99, 101, 59, 24586, 114, 59, 49152, 55349, 56601, 112, 102, 59, 49152, 55349, 56653, 99, 114, 59, 49152, 55349, 56497, 100, 97, 115, 104, 59, 25258, 640, 99, 101, 102, 111, 115, 5287, 5292, 5297, 5302, 5308, 105, 114, 99, 59, 16756, 100, 103, 101, 59, 25280, 114, 59, 49152, 55349, 56602, 112, 102, 59, 49152, 55349, 56654, 99, 114, 59, 49152, 55349, 56498, 512, 102, 105, 111, 115, 5323, 5328, 5330, 5336, 114, 59, 49152, 55349, 56603, 59, 17310, 112, 102, 59, 49152, 55349, 56655, 99, 114, 59, 49152, 55349, 56499, 1152, 65, 73, 85, 97, 99, 102, 111, 115, 117, 5361, 5365, 5369, 5373, 5380, 5391, 5396, 5402, 5408, 99, 121, 59, 17455, 99, 121, 59, 17415, 99, 121, 59, 17454, 99, 117, 116, 101, 32827, 221, 16605, 256, 105, 121, 5385, 5389, 114, 99, 59, 16758, 59, 17451, 114, 59, 49152, 55349, 56604, 112, 102, 59, 49152, 55349, 56656, 99, 114, 59, 49152, 55349, 56500, 109, 108, 59, 16760, 1024, 72, 97, 99, 100, 101, 102, 111, 115, 5429, 5433, 5439, 5451, 5455, 5469, 5472, 5476, 99, 121, 59, 17430, 99, 117, 116, 101, 59, 16761, 256, 97, 121, 5444, 5449, 114, 111, 110, 59, 16765, 59, 17431, 111, 116, 59, 16763, 498, 5460, 0, 5467, 111, 87, 105, 100, 116, 232, 2777, 97, 59, 17302, 114, 59, 24872, 112, 102, 59, 24868, 99, 114, 59, 49152, 55349, 56501, 3041, 5507, 5514, 5520, 0, 5552, 5558, 5567, 0, 0, 0, 0, 5574, 5595, 5611, 5727, 5741, 0, 5781, 5787, 5810, 5817, 0, 5822, 99, 117, 116, 101, 32827, 225, 16609, 114, 101, 118, 101, 59, 16643, 768, 59, 69, 100, 105, 117, 121, 5532, 5533, 5537, 5539, 5544, 5549, 25150, 59, 49152, 8766, 819, 59, 25151, 114, 99, 32827, 226, 16610, 116, 101, 32955, 180, 774, 59, 17456, 108, 105, 103, 32827, 230, 16614, 256, 59, 114, 178, 5562, 59, 49152, 55349, 56606, 114, 97, 118, 101, 32827, 224, 16608, 256, 101, 112, 5578, 5590, 256, 102, 112, 5583, 5588, 115, 121, 109, 59, 24885, 232, 5587, 104, 97, 59, 17329, 256, 97, 112, 5599, 99, 256, 99, 108, 5604, 5607, 114, 59, 16641, 103, 59, 27199, 612, 5616, 0, 0, 5642, 640, 59, 97, 100, 115, 118, 5626, 5627, 5631, 5633, 5639, 25127, 110, 100, 59, 27221, 59, 27228, 108, 111, 112, 101, 59, 27224, 59, 27226, 896, 59, 101, 108, 109, 114, 115, 122, 5656, 5657, 5659, 5662, 5695, 5711, 5721, 25120, 59, 27044, 101, 187, 5657, 115, 100, 256, 59, 97, 5669, 5670, 25121, 1121, 5680, 5682, 5684, 5686, 5688, 5690, 5692, 5694, 59, 27048, 59, 27049, 59, 27050, 59, 27051, 59, 27052, 59, 27053, 59, 27054, 59, 27055, 116, 256, 59, 118, 5701, 5702, 25119, 98, 256, 59, 100, 5708, 5709, 25278, 59, 27037, 256, 112, 116, 5716, 5719, 104, 59, 25122, 187, 185, 97, 114, 114, 59, 25468, 256, 103, 112, 5731, 5735, 111, 110, 59, 16645, 102, 59, 49152, 55349, 56658, 896, 59, 69, 97, 101, 105, 111, 112, 4801, 5755, 5757, 5762, 5764, 5767, 5770, 59, 27248, 99, 105, 114, 59, 27247, 59, 25162, 100, 59, 25163, 115, 59, 16423, 114, 111, 120, 256, 59, 101, 4801, 5778, 241, 5763, 105, 110, 103, 32827, 229, 16613, 384, 99, 116, 121, 5793, 5798, 5800, 114, 59, 49152, 55349, 56502, 59, 16426, 109, 112, 256, 59, 101, 4801, 5807, 241, 648, 105, 108, 100, 101, 32827, 227, 16611, 109, 108, 32827, 228, 16612, 256, 99, 105, 5826, 5832, 111, 110, 105, 110, 244, 626, 110, 116, 59, 27153, 2048, 78, 97, 98, 99, 100, 101, 102, 105, 107, 108, 110, 111, 112, 114, 115, 117, 5869, 5873, 5936, 5948, 5955, 5960, 6008, 6013, 6112, 6118, 6201, 6224, 5901, 6461, 6472, 6512, 111, 116, 59, 27373, 256, 99, 114, 5878, 5918, 107, 512, 99, 101, 112, 115, 5888, 5893, 5901, 5907, 111, 110, 103, 59, 25164, 112, 115, 105, 108, 111, 110, 59, 17398, 114, 105, 109, 101, 59, 24629, 105, 109, 256, 59, 101, 5914, 5915, 25149, 113, 59, 25293, 374, 5922, 5926, 101, 101, 59, 25277, 101, 100, 256, 59, 103, 5932, 5933, 25349, 101, 187, 5933, 114, 107, 256, 59, 116, 4956, 5943, 98, 114, 107, 59, 25526, 256, 111, 121, 5889, 5953, 59, 17457, 113, 117, 111, 59, 24606, 640, 99, 109, 112, 114, 116, 5971, 5979, 5985, 5988, 5992, 97, 117, 115, 256, 59, 101, 266, 265, 112, 116, 121, 118, 59, 27056, 115, 233, 5900, 110, 111, 245, 275, 384, 97, 104, 119, 5999, 6001, 6003, 59, 17330, 59, 24886, 101, 101, 110, 59, 25196, 114, 59, 49152, 55349, 56607, 103, 896, 99, 111, 115, 116, 117, 118, 119, 6029, 6045, 6067, 6081, 6101, 6107, 6110, 384, 97, 105, 117, 6036, 6038, 6042, 240, 1888, 114, 99, 59, 26095, 112, 187, 4977, 384, 100, 112, 116, 6052, 6056, 6061, 111, 116, 59, 27136, 108, 117, 115, 59, 27137, 105, 109, 101, 115, 59, 27138, 625, 6073, 0, 0, 6078, 99, 117, 112, 59, 27142, 97, 114, 59, 26117, 114, 105, 97, 110, 103, 108, 101, 256, 100, 117, 6093, 6098, 111, 119, 110, 59, 26045, 112, 59, 26035, 112, 108, 117, 115, 59, 27140, 101, 229, 5188, 229, 5293, 97, 114, 111, 119, 59, 26893, 384, 97, 107, 111, 6125, 6182, 6197, 256, 99, 110, 6130, 6179, 107, 384, 108, 115, 116, 6138, 1451, 6146, 111, 122, 101, 110, 103, 101, 59, 27115, 114, 105, 97, 110, 103, 108, 101, 512, 59, 100, 108, 114, 6162, 6163, 6168, 6173, 26036, 111, 119, 110, 59, 26046, 101, 102, 116, 59, 26050, 105, 103, 104, 116, 59, 26040, 107, 59, 25635, 433, 6187, 0, 6195, 434, 6191, 0, 6193, 59, 26002, 59, 26001, 52, 59, 26003, 99, 107, 59, 25992, 256, 101, 111, 6206, 6221, 256, 59, 113, 6211, 6214, 49152, 61, 8421, 117, 105, 118, 59, 49152, 8801, 8421, 116, 59, 25360, 512, 112, 116, 119, 120, 6233, 6238, 6247, 6252, 102, 59, 49152, 55349, 56659, 256, 59, 116, 5067, 6243, 111, 109, 187, 5068, 116, 105, 101, 59, 25288, 1536, 68, 72, 85, 86, 98, 100, 104, 109, 112, 116, 117, 118, 6277, 6294, 6314, 6331, 6359, 6363, 6380, 6399, 6405, 6410, 6416, 6433, 512, 76, 82, 108, 114, 6286, 6288, 6290, 6292, 59, 25943, 59, 25940, 59, 25942, 59, 25939, 640, 59, 68, 85, 100, 117, 6305, 6306, 6308, 6310, 6312, 25936, 59, 25958, 59, 25961, 59, 25956, 59, 25959, 512, 76, 82, 108, 114, 6323, 6325, 6327, 6329, 59, 25949, 59, 25946, 59, 25948, 59, 25945, 896, 59, 72, 76, 82, 104, 108, 114, 6346, 6347, 6349, 6351, 6353, 6355, 6357, 25937, 59, 25964, 59, 25955, 59, 25952, 59, 25963, 59, 25954, 59, 25951, 111, 120, 59, 27081, 512, 76, 82, 108, 114, 6372, 6374, 6376, 6378, 59, 25941, 59, 25938, 59, 25872, 59, 25868, 640, 59, 68, 85, 100, 117, 1725, 6391, 6393, 6395, 6397, 59, 25957, 59, 25960, 59, 25900, 59, 25908, 105, 110, 117, 115, 59, 25247, 108, 117, 115, 59, 25246, 105, 109, 101, 115, 59, 25248, 512, 76, 82, 108, 114, 6425, 6427, 6429, 6431, 59, 25947, 59, 25944, 59, 25880, 59, 25876, 896, 59, 72, 76, 82, 104, 108, 114, 6448, 6449, 6451, 6453, 6455, 6457, 6459, 25858, 59, 25962, 59, 25953, 59, 25950, 59, 25916, 59, 25892, 59, 25884, 256, 101, 118, 291, 6466, 98, 97, 114, 32827, 166, 16550, 512, 99, 101, 105, 111, 6481, 6486, 6490, 6496, 114, 59, 49152, 55349, 56503, 109, 105, 59, 24655, 109, 256, 59, 101, 5914, 5916, 108, 384, 59, 98, 104, 6504, 6505, 6507, 16476, 59, 27077, 115, 117, 98, 59, 26568, 364, 6516, 6526, 108, 256, 59, 101, 6521, 6522, 24610, 116, 187, 6522, 112, 384, 59, 69, 101, 303, 6533, 6535, 59, 27310, 256, 59, 113, 1756, 1755, 3297, 6567, 0, 6632, 6673, 6677, 6706, 0, 6711, 6736, 0, 0, 6836, 0, 0, 6849, 0, 0, 6945, 6958, 6989, 6994, 0, 7165, 0, 7180, 384, 99, 112, 114, 6573, 6578, 6621, 117, 116, 101, 59, 16647, 768, 59, 97, 98, 99, 100, 115, 6591, 6592, 6596, 6602, 6613, 6617, 25129, 110, 100, 59, 27204, 114, 99, 117, 112, 59, 27209, 256, 97, 117, 6607, 6610, 112, 59, 27211, 112, 59, 27207, 111, 116, 59, 27200, 59, 49152, 8745, 65024, 256, 101, 111, 6626, 6629, 116, 59, 24641, 238, 1683, 512, 97, 101, 105, 117, 6640, 6651, 6657, 6661, 496, 6645, 0, 6648, 115, 59, 27213, 111, 110, 59, 16653, 100, 105, 108, 32827, 231, 16615, 114, 99, 59, 16649, 112, 115, 256, 59, 115, 6668, 6669, 27212, 109, 59, 27216, 111, 116, 59, 16651, 384, 100, 109, 110, 6683, 6688, 6694, 105, 108, 32955, 184, 429, 112, 116, 121, 118, 59, 27058, 116, 33024, 162, 59, 101, 6701, 6702, 16546, 114, 228, 434, 114, 59, 49152, 55349, 56608, 384, 99, 101, 105, 6717, 6720, 6733, 121, 59, 17479, 99, 107, 256, 59, 109, 6727, 6728, 26387, 97, 114, 107, 187, 6728, 59, 17351, 114, 896, 59, 69, 99, 101, 102, 109, 115, 6751, 6752, 6754, 6763, 6820, 6826, 6830, 26059, 59, 27075, 384, 59, 101, 108, 6761, 6762, 6765, 17094, 113, 59, 25175, 101, 609, 6772, 0, 0, 6792, 114, 114, 111, 119, 256, 108, 114, 6780, 6785, 101, 102, 116, 59, 25018, 105, 103, 104, 116, 59, 25019, 640, 82, 83, 97, 99, 100, 6802, 6804, 6806, 6810, 6815, 187, 3911, 59, 25800, 115, 116, 59, 25243, 105, 114, 99, 59, 25242, 97, 115, 104, 59, 25245, 110, 105, 110, 116, 59, 27152, 105, 100, 59, 27375, 99, 105, 114, 59, 27074, 117, 98, 115, 256, 59, 117, 6843, 6844, 26211, 105, 116, 187, 6844, 748, 6855, 6868, 6906, 0, 6922, 111, 110, 256, 59, 101, 6861, 6862, 16442, 256, 59, 113, 199, 198, 621, 6873, 0, 0, 6882, 97, 256, 59, 116, 6878, 6879, 16428, 59, 16448, 384, 59, 102, 108, 6888, 6889, 6891, 25089, 238, 4448, 101, 256, 109, 120, 6897, 6902, 101, 110, 116, 187, 6889, 101, 243, 589, 487, 6910, 0, 6919, 256, 59, 100, 4795, 6914, 111, 116, 59, 27245, 110, 244, 582, 384, 102, 114, 121, 6928, 6932, 6935, 59, 49152, 55349, 56660, 111, 228, 596, 33024, 169, 59, 115, 341, 6941, 114, 59, 24855, 256, 97, 111, 6949, 6953, 114, 114, 59, 25013, 115, 115, 59, 26391, 256, 99, 117, 6962, 6967, 114, 59, 49152, 55349, 56504, 256, 98, 112, 6972, 6980, 256, 59, 101, 6977, 6978, 27343, 59, 27345, 256, 59, 101, 6985, 6986, 27344, 59, 27346, 100, 111, 116, 59, 25327, 896, 100, 101, 108, 112, 114, 118, 119, 7008, 7020, 7031, 7042, 7084, 7124, 7161, 97, 114, 114, 256, 108, 114, 7016, 7018, 59, 26936, 59, 26933, 624, 7026, 0, 0, 7029, 114, 59, 25310, 99, 59, 25311, 97, 114, 114, 256, 59, 112, 7039, 7040, 25014, 59, 26941, 768, 59, 98, 99, 100, 111, 115, 7055, 7056, 7062, 7073, 7077, 7080, 25130, 114, 99, 97, 112, 59, 27208, 256, 97, 117, 7067, 7070, 112, 59, 27206, 112, 59, 27210, 111, 116, 59, 25229, 114, 59, 27205, 59, 49152, 8746, 65024, 512, 97, 108, 114, 118, 7093, 7103, 7134, 7139, 114, 114, 256, 59, 109, 7100, 7101, 25015, 59, 26940, 121, 384, 101, 118, 119, 7111, 7124, 7128, 113, 624, 7118, 0, 0, 7122, 114, 101, 227, 7027, 117, 227, 7029, 101, 101, 59, 25294, 101, 100, 103, 101, 59, 25295, 101, 110, 32827, 164, 16548, 101, 97, 114, 114, 111, 119, 256, 108, 114, 7150, 7155, 101, 102, 116, 187, 7040, 105, 103, 104, 116, 187, 7101, 101, 228, 7133, 256, 99, 105, 7169, 7175, 111, 110, 105, 110, 244, 503, 110, 116, 59, 25137, 108, 99, 116, 121, 59, 25389, 2432, 65, 72, 97, 98, 99, 100, 101, 102, 104, 105, 106, 108, 111, 114, 115, 116, 117, 119, 122, 7224, 7227, 7231, 7261, 7273, 7285, 7306, 7326, 7340, 7351, 7419, 7423, 7437, 7547, 7569, 7595, 7611, 7622, 7629, 114, 242, 897, 97, 114, 59, 26981, 512, 103, 108, 114, 115, 7240, 7245, 7250, 7252, 103, 101, 114, 59, 24608, 101, 116, 104, 59, 24888, 242, 4403, 104, 256, 59, 118, 7258, 7259, 24592, 187, 2314, 363, 7265, 7271, 97, 114, 111, 119, 59, 26895, 97, 227, 789, 256, 97, 121, 7278, 7283, 114, 111, 110, 59, 16655, 59, 17460, 384, 59, 97, 111, 818, 7292, 7300, 256, 103, 114, 703, 7297, 114, 59, 25034, 116, 115, 101, 113, 59, 27255, 384, 103, 108, 109, 7313, 7316, 7320, 32827, 176, 16560, 116, 97, 59, 17332, 112, 116, 121, 118, 59, 27057, 256, 105, 114, 7331, 7336, 115, 104, 116, 59, 27007, 59, 49152, 55349, 56609, 97, 114, 256, 108, 114, 7347, 7349, 187, 2268, 187, 4126, 640, 97, 101, 103, 115, 118, 7362, 888, 7382, 7388, 7392, 109, 384, 59, 111, 115, 806, 7370, 7380, 110, 100, 256, 59, 115, 806, 7377, 117, 105, 116, 59, 26214, 97, 109, 109, 97, 59, 17373, 105, 110, 59, 25330, 384, 59, 105, 111, 7399, 7400, 7416, 16631, 100, 101, 33024, 247, 59, 111, 7399, 7408, 110, 116, 105, 109, 101, 115, 59, 25287, 110, 248, 7415, 99, 121, 59, 17490, 99, 623, 7430, 0, 0, 7434, 114, 110, 59, 25374, 111, 112, 59, 25357, 640, 108, 112, 116, 117, 119, 7448, 7453, 7458, 7497, 7509, 108, 97, 114, 59, 16420, 102, 59, 49152, 55349, 56661, 640, 59, 101, 109, 112, 115, 779, 7469, 7479, 7485, 7490, 113, 256, 59, 100, 850, 7475, 111, 116, 59, 25169, 105, 110, 117, 115, 59, 25144, 108, 117, 115, 59, 25108, 113, 117, 97, 114, 101, 59, 25249, 98, 108, 101, 98, 97, 114, 119, 101, 100, 103, 229, 250, 110, 384, 97, 100, 104, 4398, 7517, 7527, 111, 119, 110, 97, 114, 114, 111, 119, 243, 7299, 97, 114, 112, 111, 111, 110, 256, 108, 114, 7538, 7542, 101, 102, 244, 7348, 105, 103, 104, 244, 7350, 354, 7551, 7557, 107, 97, 114, 111, 247, 3906, 623, 7562, 0, 0, 7566, 114, 110, 59, 25375, 111, 112, 59, 25356, 384, 99, 111, 116, 7576, 7587, 7590, 256, 114, 121, 7581, 7585, 59, 49152, 55349, 56505, 59, 17493, 108, 59, 27126, 114, 111, 107, 59, 16657, 256, 100, 114, 7600, 7604, 111, 116, 59, 25329, 105, 256, 59, 102, 7610, 6166, 26047, 256, 97, 104, 7616, 7619, 114, 242, 1065, 97, 242, 4006, 97, 110, 103, 108, 101, 59, 27046, 256, 99, 105, 7634, 7637, 121, 59, 17503, 103, 114, 97, 114, 114, 59, 26623, 2304, 68, 97, 99, 100, 101, 102, 103, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 120, 7681, 7689, 7705, 7736, 1400, 7740, 7753, 7777, 7806, 7845, 7855, 7869, 7905, 7978, 7991, 8004, 8014, 8026, 256, 68, 111, 7686, 7476, 111, 244, 7305, 256, 99, 115, 7694, 7700, 117, 116, 101, 32827, 233, 16617, 116, 101, 114, 59, 27246, 512, 97, 105, 111, 121, 7714, 7719, 7729, 7734, 114, 111, 110, 59, 16667, 114, 256, 59, 99, 7725, 7726, 25174, 32827, 234, 16618, 108, 111, 110, 59, 25173, 59, 17485, 111, 116, 59, 16663, 256, 68, 114, 7745, 7749, 111, 116, 59, 25170, 59, 49152, 55349, 56610, 384, 59, 114, 115, 7760, 7761, 7767, 27290, 97, 118, 101, 32827, 232, 16616, 256, 59, 100, 7772, 7773, 27286, 111, 116, 59, 27288, 512, 59, 105, 108, 115, 7786, 7787, 7794, 7796, 27289, 110, 116, 101, 114, 115, 59, 25575, 59, 24851, 256, 59, 100, 7801, 7802, 27285, 111, 116, 59, 27287, 384, 97, 112, 115, 7813, 7817, 7831, 99, 114, 59, 16659, 116, 121, 384, 59, 115, 118, 7826, 7827, 7829, 25093, 101, 116, 187, 7827, 112, 256, 49, 59, 7837, 7844, 307, 7841, 7843, 59, 24580, 59, 24581, 24579, 256, 103, 115, 7850, 7852, 59, 16715, 112, 59, 24578, 256, 103, 112, 7860, 7864, 111, 110, 59, 16665, 102, 59, 49152, 55349, 56662, 384, 97, 108, 115, 7876, 7886, 7890, 114, 256, 59, 115, 7882, 7883, 25301, 108, 59, 27107, 117, 115, 59, 27249, 105, 384, 59, 108, 118, 7898, 7899, 7903, 17333, 111, 110, 187, 7899, 59, 17397, 512, 99, 115, 117, 118, 7914, 7923, 7947, 7971, 256, 105, 111, 7919, 7729, 114, 99, 187, 7726, 617, 7929, 0, 0, 7931, 237, 1352, 97, 110, 116, 256, 103, 108, 7938, 7942, 116, 114, 187, 7773, 101, 115, 115, 187, 7802, 384, 97, 101, 105, 7954, 7958, 7962, 108, 115, 59, 16445, 115, 116, 59, 25183, 118, 256, 59, 68, 565, 7968, 68, 59, 27256, 112, 97, 114, 115, 108, 59, 27109, 256, 68, 97, 7983, 7987, 111, 116, 59, 25171, 114, 114, 59, 26993, 384, 99, 100, 105, 7998, 8001, 7928, 114, 59, 24879, 111, 244, 850, 256, 97, 104, 8009, 8011, 59, 17335, 32827, 240, 16624, 256, 109, 114, 8019, 8023, 108, 32827, 235, 16619, 111, 59, 24748, 384, 99, 105, 112, 8033, 8036, 8039, 108, 59, 16417, 115, 244, 1390, 256, 101, 111, 8044, 8052, 99, 116, 97, 116, 105, 111, 238, 1369, 110, 101, 110, 116, 105, 97, 108, 229, 1401, 2529, 8082, 0, 8094, 0, 8097, 8103, 0, 0, 8134, 8140, 0, 8147, 0, 8166, 8170, 8192, 0, 8200, 8282, 108, 108, 105, 110, 103, 100, 111, 116, 115, 101, 241, 7748, 121, 59, 17476, 109, 97, 108, 101, 59, 26176, 384, 105, 108, 114, 8109, 8115, 8129, 108, 105, 103, 59, 32768, 64259, 617, 8121, 0, 0, 8125, 103, 59, 32768, 64256, 105, 103, 59, 32768, 64260, 59, 49152, 55349, 56611, 108, 105, 103, 59, 32768, 64257, 108, 105, 103, 59, 49152, 102, 106, 384, 97, 108, 116, 8153, 8156, 8161, 116, 59, 26221, 105, 103, 59, 32768, 64258, 110, 115, 59, 26033, 111, 102, 59, 16786, 496, 8174, 0, 8179, 102, 59, 49152, 55349, 56663, 256, 97, 107, 1471, 8183, 256, 59, 118, 8188, 8189, 25300, 59, 27353, 97, 114, 116, 105, 110, 116, 59, 27149, 256, 97, 111, 8204, 8277, 256, 99, 115, 8209, 8274, 945, 8218, 8240, 8248, 8261, 8264, 0, 8272, 946, 8226, 8229, 8231, 8234, 8236, 0, 8238, 32827, 189, 16573, 59, 24915, 32827, 188, 16572, 59, 24917, 59, 24921, 59, 24923, 435, 8244, 0, 8246, 59, 24916, 59, 24918, 692, 8254, 8257, 0, 0, 8259, 32827, 190, 16574, 59, 24919, 59, 24924, 53, 59, 24920, 438, 8268, 0, 8270, 59, 24922, 59, 24925, 56, 59, 24926, 108, 59, 24644, 119, 110, 59, 25378, 99, 114, 59, 49152, 55349, 56507, 2176, 69, 97, 98, 99, 100, 101, 102, 103, 105, 106, 108, 110, 111, 114, 115, 116, 118, 8322, 8329, 8351, 8357, 8368, 8372, 8432, 8437, 8442, 8447, 8451, 8466, 8504, 791, 8510, 8530, 8606, 256, 59, 108, 1613, 8327, 59, 27276, 384, 99, 109, 112, 8336, 8341, 8349, 117, 116, 101, 59, 16885, 109, 97, 256, 59, 100, 8348, 7386, 17331, 59, 27270, 114, 101, 118, 101, 59, 16671, 256, 105, 121, 8362, 8366, 114, 99, 59, 16669, 59, 17459, 111, 116, 59, 16673, 512, 59, 108, 113, 115, 1598, 1602, 8381, 8393, 384, 59, 113, 115, 1598, 1612, 8388, 108, 97, 110, 244, 1637, 512, 59, 99, 100, 108, 1637, 8402, 8405, 8421, 99, 59, 27305, 111, 116, 256, 59, 111, 8412, 8413, 27264, 256, 59, 108, 8418, 8419, 27266, 59, 27268, 256, 59, 101, 8426, 8429, 49152, 8923, 65024, 115, 59, 27284, 114, 59, 49152, 55349, 56612, 256, 59, 103, 1651, 1563, 109, 101, 108, 59, 24887, 99, 121, 59, 17491, 512, 59, 69, 97, 106, 1626, 8460, 8462, 8464, 59, 27282, 59, 27301, 59, 27300, 512, 69, 97, 101, 115, 8475, 8477, 8489, 8500, 59, 25193, 112, 256, 59, 112, 8483, 8484, 27274, 114, 111, 120, 187, 8484, 256, 59, 113, 8494, 8495, 27272, 256, 59, 113, 8494, 8475, 105, 109, 59, 25319, 112, 102, 59, 49152, 55349, 56664, 256, 99, 105, 8515, 8518, 114, 59, 24842, 109, 384, 59, 101, 108, 1643, 8526, 8528, 59, 27278, 59, 27280, 33536, 62, 59, 99, 100, 108, 113, 114, 1518, 8544, 8554, 8558, 8563, 8569, 256, 99, 105, 8549, 8551, 59, 27303, 114, 59, 27258, 111, 116, 59, 25303, 80, 97, 114, 59, 27029, 117, 101, 115, 116, 59, 27260, 640, 97, 100, 101, 108, 115, 8580, 8554, 8592, 1622, 8603, 496, 8585, 0, 8590, 112, 114, 111, 248, 8350, 114, 59, 27000, 113, 256, 108, 113, 1599, 8598, 108, 101, 115, 243, 8328, 105, 237, 1643, 256, 101, 110, 8611, 8621, 114, 116, 110, 101, 113, 113, 59, 49152, 8809, 65024, 197, 8618, 1280, 65, 97, 98, 99, 101, 102, 107, 111, 115, 121, 8644, 8647, 8689, 8693, 8698, 8728, 8733, 8751, 8808, 8829, 114, 242, 928, 512, 105, 108, 109, 114, 8656, 8660, 8663, 8667, 114, 115, 240, 5252, 102, 187, 8228, 105, 108, 244, 1705, 256, 100, 114, 8672, 8676, 99, 121, 59, 17482, 384, 59, 99, 119, 2292, 8683, 8687, 105, 114, 59, 26952, 59, 25005, 97, 114, 59, 24847, 105, 114, 99, 59, 16677, 384, 97, 108, 114, 8705, 8718, 8723, 114, 116, 115, 256, 59, 117, 8713, 8714, 26213, 105, 116, 187, 8714, 108, 105, 112, 59, 24614, 99, 111, 110, 59, 25273, 114, 59, 49152, 55349, 56613, 115, 256, 101, 119, 8739, 8745, 97, 114, 111, 119, 59, 26917, 97, 114, 111, 119, 59, 26918, 640, 97, 109, 111, 112, 114, 8762, 8766, 8771, 8798, 8803, 114, 114, 59, 25087, 116, 104, 116, 59, 25147, 107, 256, 108, 114, 8777, 8787, 101, 102, 116, 97, 114, 114, 111, 119, 59, 25001, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 25002, 102, 59, 49152, 55349, 56665, 98, 97, 114, 59, 24597, 384, 99, 108, 116, 8815, 8820, 8824, 114, 59, 49152, 55349, 56509, 97, 115, 232, 8692, 114, 111, 107, 59, 16679, 256, 98, 112, 8834, 8839, 117, 108, 108, 59, 24643, 104, 101, 110, 187, 7259, 2785, 8867, 0, 8874, 0, 8888, 8901, 8910, 0, 8917, 8947, 0, 0, 8952, 8994, 9063, 9058, 9087, 0, 9094, 9130, 9140, 99, 117, 116, 101, 32827, 237, 16621, 384, 59, 105, 121, 1905, 8880, 8885, 114, 99, 32827, 238, 16622, 59, 17464, 256, 99, 120, 8892, 8895, 121, 59, 17461, 99, 108, 32827, 161, 16545, 256, 102, 114, 927, 8905, 59, 49152, 55349, 56614, 114, 97, 118, 101, 32827, 236, 16620, 512, 59, 105, 110, 111, 1854, 8925, 8937, 8942, 256, 105, 110, 8930, 8934, 110, 116, 59, 27148, 116, 59, 25133, 102, 105, 110, 59, 27100, 116, 97, 59, 24873, 108, 105, 103, 59, 16691, 384, 97, 111, 112, 8958, 8986, 8989, 384, 99, 103, 116, 8965, 8968, 8983, 114, 59, 16683, 384, 101, 108, 112, 1823, 8975, 8979, 105, 110, 229, 1934, 97, 114, 244, 1824, 104, 59, 16689, 102, 59, 25271, 101, 100, 59, 16821, 640, 59, 99, 102, 111, 116, 1268, 9004, 9009, 9021, 9025, 97, 114, 101, 59, 24837, 105, 110, 256, 59, 116, 9016, 9017, 25118, 105, 101, 59, 27101, 100, 111, 244, 8985, 640, 59, 99, 101, 108, 112, 1879, 9036, 9040, 9051, 9057, 97, 108, 59, 25274, 256, 103, 114, 9045, 9049, 101, 114, 243, 5475, 227, 9037, 97, 114, 104, 107, 59, 27159, 114, 111, 100, 59, 27196, 512, 99, 103, 112, 116, 9071, 9074, 9078, 9083, 121, 59, 17489, 111, 110, 59, 16687, 102, 59, 49152, 55349, 56666, 97, 59, 17337, 117, 101, 115, 116, 32827, 191, 16575, 256, 99, 105, 9098, 9103, 114, 59, 49152, 55349, 56510, 110, 640, 59, 69, 100, 115, 118, 1268, 9115, 9117, 9121, 1267, 59, 25337, 111, 116, 59, 25333, 256, 59, 118, 9126, 9127, 25332, 59, 25331, 256, 59, 105, 1911, 9134, 108, 100, 101, 59, 16681, 491, 9144, 0, 9148, 99, 121, 59, 17494, 108, 32827, 239, 16623, 768, 99, 102, 109, 111, 115, 117, 9164, 9175, 9180, 9185, 9191, 9205, 256, 105, 121, 9169, 9173, 114, 99, 59, 16693, 59, 17465, 114, 59, 49152, 55349, 56615, 97, 116, 104, 59, 16951, 112, 102, 59, 49152, 55349, 56667, 483, 9196, 0, 9201, 114, 59, 49152, 55349, 56511, 114, 99, 121, 59, 17496, 107, 99, 121, 59, 17492, 1024, 97, 99, 102, 103, 104, 106, 111, 115, 9227, 9238, 9250, 9255, 9261, 9265, 9269, 9275, 112, 112, 97, 256, 59, 118, 9235, 9236, 17338, 59, 17392, 256, 101, 121, 9243, 9248, 100, 105, 108, 59, 16695, 59, 17466, 114, 59, 49152, 55349, 56616, 114, 101, 101, 110, 59, 16696, 99, 121, 59, 17477, 99, 121, 59, 17500, 112, 102, 59, 49152, 55349, 56668, 99, 114, 59, 49152, 55349, 56512, 2944, 65, 66, 69, 72, 97, 98, 99, 100, 101, 102, 103, 104, 106, 108, 109, 110, 111, 112, 114, 115, 116, 117, 118, 9328, 9345, 9350, 9357, 9361, 9486, 9533, 9562, 9600, 9806, 9822, 9829, 9849, 9853, 9882, 9906, 9944, 10077, 10088, 10123, 10176, 10241, 10258, 384, 97, 114, 116, 9335, 9338, 9340, 114, 242, 2502, 242, 917, 97, 105, 108, 59, 26907, 97, 114, 114, 59, 26894, 256, 59, 103, 2452, 9355, 59, 27275, 97, 114, 59, 26978, 2403, 9381, 0, 9386, 0, 9393, 0, 0, 0, 0, 0, 9397, 9402, 0, 9414, 9416, 9421, 0, 9465, 117, 116, 101, 59, 16698, 109, 112, 116, 121, 118, 59, 27060, 114, 97, 238, 2124, 98, 100, 97, 59, 17339, 103, 384, 59, 100, 108, 2190, 9409, 9411, 59, 27025, 229, 2190, 59, 27269, 117, 111, 32827, 171, 16555, 114, 1024, 59, 98, 102, 104, 108, 112, 115, 116, 2201, 9438, 9446, 9449, 9451, 9454, 9457, 9461, 256, 59, 102, 2205, 9443, 115, 59, 26911, 115, 59, 26909, 235, 8786, 112, 59, 25003, 108, 59, 26937, 105, 109, 59, 26995, 108, 59, 24994, 384, 59, 97, 101, 9471, 9472, 9476, 27307, 105, 108, 59, 26905, 256, 59, 115, 9481, 9482, 27309, 59, 49152, 10925, 65024, 384, 97, 98, 114, 9493, 9497, 9501, 114, 114, 59, 26892, 114, 107, 59, 26482, 256, 97, 107, 9506, 9516, 99, 256, 101, 107, 9512, 9514, 59, 16507, 59, 16475, 256, 101, 115, 9521, 9523, 59, 27019, 108, 256, 100, 117, 9529, 9531, 59, 27023, 59, 27021, 512, 97, 101, 117, 121, 9542, 9547, 9558, 9560, 114, 111, 110, 59, 16702, 256, 100, 105, 9552, 9556, 105, 108, 59, 16700, 236, 2224, 226, 9513, 59, 17467, 512, 99, 113, 114, 115, 9571, 9574, 9581, 9597, 97, 59, 26934, 117, 111, 256, 59, 114, 3609, 5958, 256, 100, 117, 9586, 9591, 104, 97, 114, 59, 26983, 115, 104, 97, 114, 59, 26955, 104, 59, 25010, 640, 59, 102, 103, 113, 115, 9611, 9612, 2441, 9715, 9727, 25188, 116, 640, 97, 104, 108, 114, 116, 9624, 9636, 9655, 9666, 9704, 114, 114, 111, 119, 256, 59, 116, 2201, 9633, 97, 233, 9462, 97, 114, 112, 111, 111, 110, 256, 100, 117, 9647, 9652, 111, 119, 110, 187, 1114, 112, 187, 2406, 101, 102, 116, 97, 114, 114, 111, 119, 115, 59, 25031, 105, 103, 104, 116, 384, 97, 104, 115, 9677, 9686, 9694, 114, 114, 111, 119, 256, 59, 115, 2292, 2215, 97, 114, 112, 111, 111, 110, 243, 3992, 113, 117, 105, 103, 97, 114, 114, 111, 247, 8688, 104, 114, 101, 101, 116, 105, 109, 101, 115, 59, 25291, 384, 59, 113, 115, 9611, 2451, 9722, 108, 97, 110, 244, 2476, 640, 59, 99, 100, 103, 115, 2476, 9738, 9741, 9757, 9768, 99, 59, 27304, 111, 116, 256, 59, 111, 9748, 9749, 27263, 256, 59, 114, 9754, 9755, 27265, 59, 27267, 256, 59, 101, 9762, 9765, 49152, 8922, 65024, 115, 59, 27283, 640, 97, 100, 101, 103, 115, 9779, 9785, 9789, 9801, 9803, 112, 112, 114, 111, 248, 9414, 111, 116, 59, 25302, 113, 256, 103, 113, 9795, 9797, 244, 2441, 103, 116, 242, 9356, 244, 2459, 105, 237, 2482, 384, 105, 108, 114, 9813, 2273, 9818, 115, 104, 116, 59, 27004, 59, 49152, 55349, 56617, 256, 59, 69, 2460, 9827, 59, 27281, 353, 9833, 9846, 114, 256, 100, 117, 9650, 9838, 256, 59, 108, 2405, 9843, 59, 26986, 108, 107, 59, 25988, 99, 121, 59, 17497, 640, 59, 97, 99, 104, 116, 2632, 9864, 9867, 9873, 9878, 114, 242, 9665, 111, 114, 110, 101, 242, 7432, 97, 114, 100, 59, 26987, 114, 105, 59, 26106, 256, 105, 111, 9887, 9892, 100, 111, 116, 59, 16704, 117, 115, 116, 256, 59, 97, 9900, 9901, 25520, 99, 104, 101, 187, 9901, 512, 69, 97, 101, 115, 9915, 9917, 9929, 9940, 59, 25192, 112, 256, 59, 112, 9923, 9924, 27273, 114, 111, 120, 187, 9924, 256, 59, 113, 9934, 9935, 27271, 256, 59, 113, 9934, 9915, 105, 109, 59, 25318, 1024, 97, 98, 110, 111, 112, 116, 119, 122, 9961, 9972, 9975, 10010, 10031, 10049, 10055, 10064, 256, 110, 114, 9966, 9969, 103, 59, 26604, 114, 59, 25085, 114, 235, 2241, 103, 384, 108, 109, 114, 9983, 9997, 10004, 101, 102, 116, 256, 97, 114, 2534, 9991, 105, 103, 104, 116, 225, 2546, 97, 112, 115, 116, 111, 59, 26620, 105, 103, 104, 116, 225, 2557, 112, 97, 114, 114, 111, 119, 256, 108, 114, 10021, 10025, 101, 102, 244, 9453, 105, 103, 104, 116, 59, 25004, 384, 97, 102, 108, 10038, 10041, 10045, 114, 59, 27013, 59, 49152, 55349, 56669, 117, 115, 59, 27181, 105, 109, 101, 115, 59, 27188, 353, 10059, 10063, 115, 116, 59, 25111, 225, 4942, 384, 59, 101, 102, 10071, 10072, 6144, 26058, 110, 103, 101, 187, 10072, 97, 114, 256, 59, 108, 10084, 10085, 16424, 116, 59, 27027, 640, 97, 99, 104, 109, 116, 10099, 10102, 10108, 10117, 10119, 114, 242, 2216, 111, 114, 110, 101, 242, 7564, 97, 114, 256, 59, 100, 3992, 10115, 59, 26989, 59, 24590, 114, 105, 59, 25279, 768, 97, 99, 104, 105, 113, 116, 10136, 10141, 2624, 10146, 10158, 10171, 113, 117, 111, 59, 24633, 114, 59, 49152, 55349, 56513, 109, 384, 59, 101, 103, 2482, 10154, 10156, 59, 27277, 59, 27279, 256, 98, 117, 9514, 10163, 111, 256, 59, 114, 3615, 10169, 59, 24602, 114, 111, 107, 59, 16706, 33792, 60, 59, 99, 100, 104, 105, 108, 113, 114, 2091, 10194, 9785, 10204, 10208, 10213, 10218, 10224, 256, 99, 105, 10199, 10201, 59, 27302, 114, 59, 27257, 114, 101, 229, 9714, 109, 101, 115, 59, 25289, 97, 114, 114, 59, 26998, 117, 101, 115, 116, 59, 27259, 256, 80, 105, 10229, 10233, 97, 114, 59, 27030, 384, 59, 101, 102, 10240, 2349, 6171, 26051, 114, 256, 100, 117, 10247, 10253, 115, 104, 97, 114, 59, 26954, 104, 97, 114, 59, 26982, 256, 101, 110, 10263, 10273, 114, 116, 110, 101, 113, 113, 59, 49152, 8808, 65024, 197, 10270, 1792, 68, 97, 99, 100, 101, 102, 104, 105, 108, 110, 111, 112, 115, 117, 10304, 10309, 10370, 10382, 10387, 10400, 10405, 10408, 10458, 10466, 10468, 2691, 10483, 10498, 68, 111, 116, 59, 25146, 512, 99, 108, 112, 114, 10318, 10322, 10339, 10365, 114, 32827, 175, 16559, 256, 101, 116, 10327, 10329, 59, 26178, 256, 59, 101, 10334, 10335, 26400, 115, 101, 187, 10335, 256, 59, 115, 4155, 10344, 116, 111, 512, 59, 100, 108, 117, 4155, 10355, 10359, 10363, 111, 119, 238, 1164, 101, 102, 244, 2319, 240, 5073, 107, 101, 114, 59, 26030, 256, 111, 121, 10375, 10380, 109, 109, 97, 59, 27177, 59, 17468, 97, 115, 104, 59, 24596, 97, 115, 117, 114, 101, 100, 97, 110, 103, 108, 101, 187, 5670, 114, 59, 49152, 55349, 56618, 111, 59, 24871, 384, 99, 100, 110, 10415, 10420, 10441, 114, 111, 32827, 181, 16565, 512, 59, 97, 99, 100, 5220, 10429, 10432, 10436, 115, 244, 5799, 105, 114, 59, 27376, 111, 116, 32955, 183, 437, 117, 115, 384, 59, 98, 100, 10450, 6403, 10451, 25106, 256, 59, 117, 7484, 10456, 59, 27178, 355, 10462, 10465, 112, 59, 27355, 242, 8722, 240, 2689, 256, 100, 112, 10473, 10478, 101, 108, 115, 59, 25255, 102, 59, 49152, 55349, 56670, 256, 99, 116, 10488, 10493, 114, 59, 49152, 55349, 56514, 112, 111, 115, 187, 5533, 384, 59, 108, 109, 10505, 10506, 10509, 17340, 116, 105, 109, 97, 112, 59, 25272, 3072, 71, 76, 82, 86, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 108, 109, 111, 112, 114, 115, 116, 117, 118, 119, 10562, 10579, 10622, 10633, 10648, 10714, 10729, 10773, 10778, 10840, 10845, 10883, 10901, 10916, 10920, 11012, 11015, 11076, 11135, 11182, 11316, 11367, 11388, 11497, 256, 103, 116, 10567, 10571, 59, 49152, 8921, 824, 256, 59, 118, 10576, 3023, 49152, 8811, 8402, 384, 101, 108, 116, 10586, 10610, 10614, 102, 116, 256, 97, 114, 10593, 10599, 114, 114, 111, 119, 59, 25037, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 25038, 59, 49152, 8920, 824, 256, 59, 118, 10619, 3143, 49152, 8810, 8402, 105, 103, 104, 116, 97, 114, 114, 111, 119, 59, 25039, 256, 68, 100, 10638, 10643, 97, 115, 104, 59, 25263, 97, 115, 104, 59, 25262, 640, 98, 99, 110, 112, 116, 10659, 10663, 10668, 10673, 10700, 108, 97, 187, 734, 117, 116, 101, 59, 16708, 103, 59, 49152, 8736, 8402, 640, 59, 69, 105, 111, 112, 3460, 10684, 10688, 10693, 10696, 59, 49152, 10864, 824, 100, 59, 49152, 8779, 824, 115, 59, 16713, 114, 111, 248, 3460, 117, 114, 256, 59, 97, 10707, 10708, 26222, 108, 256, 59, 115, 10707, 2872, 499, 10719, 0, 10723, 112, 32955, 160, 2871, 109, 112, 256, 59, 101, 3065, 3072, 640, 97, 101, 111, 117, 121, 10740, 10750, 10755, 10768, 10771, 496, 10745, 0, 10747, 59, 27203, 111, 110, 59, 16712, 100, 105, 108, 59, 16710, 110, 103, 256, 59, 100, 3454, 10762, 111, 116, 59, 49152, 10861, 824, 112, 59, 27202, 59, 17469, 97, 115, 104, 59, 24595, 896, 59, 65, 97, 100, 113, 115, 120, 2962, 10793, 10797, 10811, 10817, 10821, 10832, 114, 114, 59, 25047, 114, 256, 104, 114, 10803, 10806, 107, 59, 26916, 256, 59, 111, 5106, 5104, 111, 116, 59, 49152, 8784, 824, 117, 105, 246, 2915, 256, 101, 105, 10826, 10830, 97, 114, 59, 26920, 237, 2968, 105, 115, 116, 256, 59, 115, 2976, 2975, 114, 59, 49152, 55349, 56619, 512, 69, 101, 115, 116, 3013, 10854, 10873, 10876, 384, 59, 113, 115, 3004, 10861, 3041, 384, 59, 113, 115, 3004, 3013, 10868, 108, 97, 110, 244, 3042, 105, 237, 3050, 256, 59, 114, 2998, 10881, 187, 2999, 384, 65, 97, 112, 10890, 10893, 10897, 114, 242, 10609, 114, 114, 59, 25006, 97, 114, 59, 27378, 384, 59, 115, 118, 3981, 10908, 3980, 256, 59, 100, 10913, 10914, 25340, 59, 25338, 99, 121, 59, 17498, 896, 65, 69, 97, 100, 101, 115, 116, 10935, 10938, 10942, 10946, 10949, 10998, 11001, 114, 242, 10598, 59, 49152, 8806, 824, 114, 114, 59, 24986, 114, 59, 24613, 512, 59, 102, 113, 115, 3131, 10958, 10979, 10991, 116, 256, 97, 114, 10964, 10969, 114, 114, 111, 247, 10945, 105, 103, 104, 116, 97, 114, 114, 111, 247, 10896, 384, 59, 113, 115, 3131, 10938, 10986, 108, 97, 110, 244, 3157, 256, 59, 115, 3157, 10996, 187, 3126, 105, 237, 3165, 256, 59, 114, 3125, 11006, 105, 256, 59, 101, 3098, 3109, 105, 228, 3472, 256, 112, 116, 11020, 11025, 102, 59, 49152, 55349, 56671, 33152, 172, 59, 105, 110, 11033, 11034, 11062, 16556, 110, 512, 59, 69, 100, 118, 2953, 11044, 11048, 11054, 59, 49152, 8953, 824, 111, 116, 59, 49152, 8949, 824, 481, 2953, 11059, 11061, 59, 25335, 59, 25334, 105, 256, 59, 118, 3256, 11068, 481, 3256, 11073, 11075, 59, 25342, 59, 25341, 384, 97, 111, 114, 11083, 11107, 11113, 114, 512, 59, 97, 115, 116, 2939, 11093, 11098, 11103, 108, 108, 101, 236, 2939, 108, 59, 49152, 11005, 8421, 59, 49152, 8706, 824, 108, 105, 110, 116, 59, 27156, 384, 59, 99, 101, 3218, 11120, 11123, 117, 229, 3237, 256, 59, 99, 3224, 11128, 256, 59, 101, 3218, 11133, 241, 3224, 512, 65, 97, 105, 116, 11144, 11147, 11165, 11175, 114, 242, 10632, 114, 114, 384, 59, 99, 119, 11156, 11157, 11161, 24987, 59, 49152, 10547, 824, 59, 49152, 8605, 824, 103, 104, 116, 97, 114, 114, 111, 119, 187, 11157, 114, 105, 256, 59, 101, 3275, 3286, 896, 99, 104, 105, 109, 112, 113, 117, 11197, 11213, 11225, 11012, 2936, 11236, 11247, 512, 59, 99, 101, 114, 3378, 11206, 3383, 11209, 117, 229, 3397, 59, 49152, 55349, 56515, 111, 114, 116, 621, 11013, 0, 0, 11222, 97, 114, 225, 11094, 109, 256, 59, 101, 3438, 11231, 256, 59, 113, 3444, 3443, 115, 117, 256, 98, 112, 11243, 11245, 229, 3320, 229, 3339, 384, 98, 99, 112, 11254, 11281, 11289, 512, 59, 69, 101, 115, 11263, 11264, 3362, 11268, 25220, 59, 49152, 10949, 824, 101, 116, 256, 59, 101, 3355, 11275, 113, 256, 59, 113, 3363, 11264, 99, 256, 59, 101, 3378, 11287, 241, 3384, 512, 59, 69, 101, 115, 11298, 11299, 3423, 11303, 25221, 59, 49152, 10950, 824, 101, 116, 256, 59, 101, 3416, 11310, 113, 256, 59, 113, 3424, 11299, 512, 103, 105, 108, 114, 11325, 11327, 11333, 11335, 236, 3031, 108, 100, 101, 32827, 241, 16625, 231, 3139, 105, 97, 110, 103, 108, 101, 256, 108, 114, 11346, 11356, 101, 102, 116, 256, 59, 101, 3098, 11354, 241, 3110, 105, 103, 104, 116, 256, 59, 101, 3275, 11365, 241, 3287, 256, 59, 109, 11372, 11373, 17341, 384, 59, 101, 115, 11380, 11381, 11385, 16419, 114, 111, 59, 24854, 112, 59, 24583, 1152, 68, 72, 97, 100, 103, 105, 108, 114, 115, 11407, 11412, 11417, 11422, 11427, 11440, 11446, 11475, 11491, 97, 115, 104, 59, 25261, 97, 114, 114, 59, 26884, 112, 59, 49152, 8781, 8402, 97, 115, 104, 59, 25260, 256, 101, 116, 11432, 11436, 59, 49152, 8805, 8402, 59, 49152, 62, 8402, 110, 102, 105, 110, 59, 27102, 384, 65, 101, 116, 11453, 11457, 11461, 114, 114, 59, 26882, 59, 49152, 8804, 8402, 256, 59, 114, 11466, 11469, 49152, 60, 8402, 105, 101, 59, 49152, 8884, 8402, 256, 65, 116, 11480, 11484, 114, 114, 59, 26883, 114, 105, 101, 59, 49152, 8885, 8402, 105, 109, 59, 49152, 8764, 8402, 384, 65, 97, 110, 11504, 11508, 11522, 114, 114, 59, 25046, 114, 256, 104, 114, 11514, 11517, 107, 59, 26915, 256, 59, 111, 5095, 5093, 101, 97, 114, 59, 26919, 4691, 6805, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11565, 0, 11576, 11592, 11616, 11621, 11634, 11652, 6919, 0, 0, 11661, 11691, 0, 11720, 11726, 0, 11740, 11801, 11819, 11838, 11843, 256, 99, 115, 11569, 6807, 117, 116, 101, 32827, 243, 16627, 256, 105, 121, 11580, 11589, 114, 256, 59, 99, 6814, 11586, 32827, 244, 16628, 59, 17470, 640, 97, 98, 105, 111, 115, 6816, 11602, 11607, 456, 11610, 108, 97, 99, 59, 16721, 118, 59, 27192, 111, 108, 100, 59, 27068, 108, 105, 103, 59, 16723, 256, 99, 114, 11625, 11629, 105, 114, 59, 27071, 59, 49152, 55349, 56620, 879, 11641, 0, 0, 11644, 0, 11650, 110, 59, 17115, 97, 118, 101, 32827, 242, 16626, 59, 27073, 256, 98, 109, 11656, 3572, 97, 114, 59, 27061, 512, 97, 99, 105, 116, 11669, 11672, 11685, 11688, 114, 242, 6784, 256, 105, 114, 11677, 11680, 114, 59, 27070, 111, 115, 115, 59, 27067, 110, 229, 3666, 59, 27072, 384, 97, 101, 105, 11697, 11701, 11705, 99, 114, 59, 16717, 103, 97, 59, 17353, 384, 99, 100, 110, 11712, 11717, 461, 114, 111, 110, 59, 17343, 59, 27062, 112, 102, 59, 49152, 55349, 56672, 384, 97, 101, 108, 11732, 11735, 466, 114, 59, 27063, 114, 112, 59, 27065, 896, 59, 97, 100, 105, 111, 115, 118, 11754, 11755, 11758, 11784, 11789, 11792, 11798, 25128, 114, 242, 6790, 512, 59, 101, 102, 109, 11767, 11768, 11778, 11781, 27229, 114, 256, 59, 111, 11774, 11775, 24884, 102, 187, 11775, 32827, 170, 16554, 32827, 186, 16570, 103, 111, 102, 59, 25270, 114, 59, 27222, 108, 111, 112, 101, 59, 27223, 59, 27227, 384, 99, 108, 111, 11807, 11809, 11815, 242, 11777, 97, 115, 104, 32827, 248, 16632, 108, 59, 25240, 105, 364, 11823, 11828, 100, 101, 32827, 245, 16629, 101, 115, 256, 59, 97, 475, 11834, 115, 59, 27190, 109, 108, 32827, 246, 16630, 98, 97, 114, 59, 25405, 2785, 11870, 0, 11901, 0, 11904, 11933, 0, 11938, 11961, 0, 0, 11979, 3740, 0, 12051, 0, 0, 12075, 12220, 0, 12232, 114, 512, 59, 97, 115, 116, 1027, 11879, 11890, 3717, 33024, 182, 59, 108, 11885, 11886, 16566, 108, 101, 236, 1027, 617, 11896, 0, 0, 11899, 109, 59, 27379, 59, 27389, 121, 59, 17471, 114, 640, 99, 105, 109, 112, 116, 11915, 11919, 11923, 6245, 11927, 110, 116, 59, 16421, 111, 100, 59, 16430, 105, 108, 59, 24624, 101, 110, 107, 59, 24625, 114, 59, 49152, 55349, 56621, 384, 105, 109, 111, 11944, 11952, 11956, 256, 59, 118, 11949, 11950, 17350, 59, 17365, 109, 97, 244, 2678, 110, 101, 59, 26126, 384, 59, 116, 118, 11967, 11968, 11976, 17344, 99, 104, 102, 111, 114, 107, 187, 8189, 59, 17366, 256, 97, 117, 11983, 11999, 110, 256, 99, 107, 11989, 11997, 107, 256, 59, 104, 8692, 11995, 59, 24846, 246, 8692, 115, 1152, 59, 97, 98, 99, 100, 101, 109, 115, 116, 12019, 12020, 6408, 12025, 12029, 12036, 12038, 12042, 12046, 16427, 99, 105, 114, 59, 27171, 105, 114, 59, 27170, 256, 111, 117, 7488, 12034, 59, 27173, 59, 27250, 110, 32955, 177, 3741, 105, 109, 59, 27174, 119, 111, 59, 27175, 384, 105, 112, 117, 12057, 12064, 12069, 110, 116, 105, 110, 116, 59, 27157, 102, 59, 49152, 55349, 56673, 110, 100, 32827, 163, 16547, 1280, 59, 69, 97, 99, 101, 105, 110, 111, 115, 117, 3784, 12095, 12097, 12100, 12103, 12161, 12169, 12178, 12158, 12214, 59, 27315, 112, 59, 27319, 117, 229, 3801, 256, 59, 99, 3790, 12108, 768, 59, 97, 99, 101, 110, 115, 3784, 12121, 12127, 12134, 12136, 12158, 112, 112, 114, 111, 248, 12099, 117, 114, 108, 121, 101, 241, 3801, 241, 3790, 384, 97, 101, 115, 12143, 12150, 12154, 112, 112, 114, 111, 120, 59, 27321, 113, 113, 59, 27317, 105, 109, 59, 25320, 105, 237, 3807, 109, 101, 256, 59, 115, 12168, 3758, 24626, 384, 69, 97, 115, 12152, 12176, 12154, 240, 12149, 384, 100, 102, 112, 3820, 12185, 12207, 384, 97, 108, 115, 12192, 12197, 12202, 108, 97, 114, 59, 25390, 105, 110, 101, 59, 25362, 117, 114, 102, 59, 25363, 256, 59, 116, 3835, 12212, 239, 3835, 114, 101, 108, 59, 25264, 256, 99, 105, 12224, 12229, 114, 59, 49152, 55349, 56517, 59, 17352, 110, 99, 115, 112, 59, 24584, 768, 102, 105, 111, 112, 115, 117, 12250, 8930, 12255, 12261, 12267, 12273, 114, 59, 49152, 55349, 56622, 112, 102, 59, 49152, 55349, 56674, 114, 105, 109, 101, 59, 24663, 99, 114, 59, 49152, 55349, 56518, 384, 97, 101, 111, 12280, 12297, 12307, 116, 256, 101, 105, 12286, 12293, 114, 110, 105, 111, 110, 243, 1712, 110, 116, 59, 27158, 115, 116, 256, 59, 101, 12304, 12305, 16447, 241, 7961, 244, 3860, 2688, 65, 66, 72, 97, 98, 99, 100, 101, 102, 104, 105, 108, 109, 110, 111, 112, 114, 115, 116, 117, 120, 12352, 12369, 12373, 12377, 12512, 12558, 12587, 12615, 12642, 12658, 12686, 12806, 12821, 12836, 12841, 12888, 12910, 12914, 12944, 12976, 12983, 384, 97, 114, 116, 12359, 12362, 12364, 114, 242, 4275, 242, 989, 97, 105, 108, 59, 26908, 97, 114, 242, 7269, 97, 114, 59, 26980, 896, 99, 100, 101, 110, 113, 114, 116, 12392, 12405, 12408, 12415, 12431, 12436, 12492, 256, 101, 117, 12397, 12401, 59, 49152, 8765, 817, 116, 101, 59, 16725, 105, 227, 4462, 109, 112, 116, 121, 118, 59, 27059, 103, 512, 59, 100, 101, 108, 4049, 12425, 12427, 12429, 59, 27026, 59, 27045, 229, 4049, 117, 111, 32827, 187, 16571, 114, 1408, 59, 97, 98, 99, 102, 104, 108, 112, 115, 116, 119, 4060, 12460, 12463, 12471, 12473, 12476, 12478, 12480, 12483, 12487, 12490, 112, 59, 26997, 256, 59, 102, 4064, 12468, 115, 59, 26912, 59, 26931, 115, 59, 26910, 235, 8797, 240, 10030, 108, 59, 26949, 105, 109, 59, 26996, 108, 59, 24995, 59, 24989, 256, 97, 105, 12497, 12501, 105, 108, 59, 26906, 111, 256, 59, 110, 12507, 12508, 25142, 97, 108, 243, 3870, 384, 97, 98, 114, 12519, 12522, 12526, 114, 242, 6117, 114, 107, 59, 26483, 256, 97, 107, 12531, 12541, 99, 256, 101, 107, 12537, 12539, 59, 16509, 59, 16477, 256, 101, 115, 12546, 12548, 59, 27020, 108, 256, 100, 117, 12554, 12556, 59, 27022, 59, 27024, 512, 97, 101, 117, 121, 12567, 12572, 12583, 12585, 114, 111, 110, 59, 16729, 256, 100, 105, 12577, 12581, 105, 108, 59, 16727, 236, 4082, 226, 12538, 59, 17472, 512, 99, 108, 113, 115, 12596, 12599, 12605, 12612, 97, 59, 26935, 100, 104, 97, 114, 59, 26985, 117, 111, 256, 59, 114, 526, 525, 104, 59, 25011, 384, 97, 99, 103, 12622, 12639, 3908, 108, 512, 59, 105, 112, 115, 3960, 12632, 12635, 4252, 110, 229, 4283, 97, 114, 244, 4009, 116, 59, 26029, 384, 105, 108, 114, 12649, 4131, 12654, 115, 104, 116, 59, 27005, 59, 49152, 55349, 56623, 256, 97, 111, 12663, 12678, 114, 256, 100, 117, 12669, 12671, 187, 1147, 256, 59, 108, 4241, 12676, 59, 26988, 256, 59, 118, 12683, 12684, 17345, 59, 17393, 384, 103, 110, 115, 12693, 12793, 12796, 104, 116, 768, 97, 104, 108, 114, 115, 116, 12708, 12720, 12738, 12760, 12772, 12782, 114, 114, 111, 119, 256, 59, 116, 4060, 12717, 97, 233, 12488, 97, 114, 112, 111, 111, 110, 256, 100, 117, 12731, 12735, 111, 119, 238, 12670, 112, 187, 4242, 101, 102, 116, 256, 97, 104, 12746, 12752, 114, 114, 111, 119, 243, 4074, 97, 114, 112, 111, 111, 110, 243, 1361, 105, 103, 104, 116, 97, 114, 114, 111, 119, 115, 59, 25033, 113, 117, 105, 103, 97, 114, 114, 111, 247, 12491, 104, 114, 101, 101, 116, 105, 109, 101, 115, 59, 25292, 103, 59, 17114, 105, 110, 103, 100, 111, 116, 115, 101, 241, 7986, 384, 97, 104, 109, 12813, 12816, 12819, 114, 242, 4074, 97, 242, 1361, 59, 24591, 111, 117, 115, 116, 256, 59, 97, 12830, 12831, 25521, 99, 104, 101, 187, 12831, 109, 105, 100, 59, 27374, 512, 97, 98, 112, 116, 12850, 12861, 12864, 12882, 256, 110, 114, 12855, 12858, 103, 59, 26605, 114, 59, 25086, 114, 235, 4099, 384, 97, 102, 108, 12871, 12874, 12878, 114, 59, 27014, 59, 49152, 55349, 56675, 117, 115, 59, 27182, 105, 109, 101, 115, 59, 27189, 256, 97, 112, 12893, 12903, 114, 256, 59, 103, 12899, 12900, 16425, 116, 59, 27028, 111, 108, 105, 110, 116, 59, 27154, 97, 114, 242, 12771, 512, 97, 99, 104, 113, 12923, 12928, 4284, 12933, 113, 117, 111, 59, 24634, 114, 59, 49152, 55349, 56519, 256, 98, 117, 12539, 12938, 111, 256, 59, 114, 532, 531, 384, 104, 105, 114, 12951, 12955, 12960, 114, 101, 229, 12792, 109, 101, 115, 59, 25290, 105, 512, 59, 101, 102, 108, 12970, 4185, 6177, 12971, 26041, 116, 114, 105, 59, 27086, 108, 117, 104, 97, 114, 59, 26984, 59, 24862, 3425, 13013, 13019, 13023, 13100, 13112, 13169, 0, 13178, 13220, 0, 0, 13292, 13296, 0, 13352, 13384, 13402, 13485, 13489, 13514, 13553, 0, 13846, 0, 0, 13875, 99, 117, 116, 101, 59, 16731, 113, 117, 239, 10170, 1280, 59, 69, 97, 99, 101, 105, 110, 112, 115, 121, 4589, 13043, 13045, 13055, 13058, 13067, 13071, 13087, 13094, 13097, 59, 27316, 496, 13050, 0, 13052, 59, 27320, 111, 110, 59, 16737, 117, 229, 4606, 256, 59, 100, 4595, 13063, 105, 108, 59, 16735, 114, 99, 59, 16733, 384, 69, 97, 115, 13078, 13080, 13083, 59, 27318, 112, 59, 27322, 105, 109, 59, 25321, 111, 108, 105, 110, 116, 59, 27155, 105, 237, 4612, 59, 17473, 111, 116, 384, 59, 98, 101, 13108, 7495, 13109, 25285, 59, 27238, 896, 65, 97, 99, 109, 115, 116, 120, 13126, 13130, 13143, 13147, 13150, 13155, 13165, 114, 114, 59, 25048, 114, 256, 104, 114, 13136, 13138, 235, 8744, 256, 59, 111, 2614, 2612, 116, 32827, 167, 16551, 105, 59, 16443, 119, 97, 114, 59, 26921, 109, 256, 105, 110, 13161, 240, 110, 117, 243, 241, 116, 59, 26422, 114, 256, 59, 111, 13174, 8277, 49152, 55349, 56624, 512, 97, 99, 111, 121, 13186, 13190, 13201, 13216, 114, 112, 59, 26223, 256, 104, 121, 13195, 13199, 99, 121, 59, 17481, 59, 17480, 114, 116, 621, 13209, 0, 0, 13212, 105, 228, 5220, 97, 114, 97, 236, 11887, 32827, 173, 16557, 256, 103, 109, 13224, 13236, 109, 97, 384, 59, 102, 118, 13233, 13234, 13234, 17347, 59, 17346, 1024, 59, 100, 101, 103, 108, 110, 112, 114, 4779, 13253, 13257, 13262, 13270, 13278, 13281, 13286, 111, 116, 59, 27242, 256, 59, 113, 4785, 4784, 256, 59, 69, 13267, 13268, 27294, 59, 27296, 256, 59, 69, 13275, 13276, 27293, 59, 27295, 101, 59, 25158, 108, 117, 115, 59, 27172, 97, 114, 114, 59, 26994, 97, 114, 242, 4413, 512, 97, 101, 105, 116, 13304, 13320, 13327, 13335, 256, 108, 115, 13309, 13316, 108, 115, 101, 116, 109, 233, 13162, 104, 112, 59, 27187, 112, 97, 114, 115, 108, 59, 27108, 256, 100, 108, 5219, 13332, 101, 59, 25379, 256, 59, 101, 13340, 13341, 27306, 256, 59, 115, 13346, 13347, 27308, 59, 49152, 10924, 65024, 384, 102, 108, 112, 13358, 13363, 13378, 116, 99, 121, 59, 17484, 256, 59, 98, 13368, 13369, 16431, 256, 59, 97, 13374, 13375, 27076, 114, 59, 25407, 102, 59, 49152, 55349, 56676, 97, 256, 100, 114, 13389, 1026, 101, 115, 256, 59, 117, 13396, 13397, 26208, 105, 116, 187, 13397, 384, 99, 115, 117, 13408, 13433, 13471, 256, 97, 117, 13413, 13423, 112, 256, 59, 115, 4488, 13419, 59, 49152, 8851, 65024, 112, 256, 59, 115, 4532, 13429, 59, 49152, 8852, 65024, 117, 256, 98, 112, 13439, 13455, 384, 59, 101, 115, 4503, 4508, 13446, 101, 116, 256, 59, 101, 4503, 13453, 241, 4509, 384, 59, 101, 115, 4520, 4525, 13462, 101, 116, 256, 59, 101, 4520, 13469, 241, 4526, 384, 59, 97, 102, 4475, 13478, 1456, 114, 357, 13483, 1457, 187, 4476, 97, 114, 242, 4424, 512, 99, 101, 109, 116, 13497, 13502, 13506, 13509, 114, 59, 49152, 55349, 56520, 116, 109, 238, 241, 105, 236, 13333, 97, 114, 230, 4542, 256, 97, 114, 13518, 13525, 114, 256, 59, 102, 13524, 6079, 26118, 256, 97, 110, 13530, 13549, 105, 103, 104, 116, 256, 101, 112, 13539, 13546, 112, 115, 105, 108, 111, 238, 7904, 104, 233, 11951, 115, 187, 10322, 640, 98, 99, 109, 110, 112, 13563, 13662, 4617, 13707, 13710, 1152, 59, 69, 100, 101, 109, 110, 112, 114, 115, 13582, 13583, 13585, 13589, 13598, 13603, 13612, 13617, 13622, 25218, 59, 27333, 111, 116, 59, 27325, 256, 59, 100, 4570, 13594, 111, 116, 59, 27331, 117, 108, 116, 59, 27329, 256, 69, 101, 13608, 13610, 59, 27339, 59, 25226, 108, 117, 115, 59, 27327, 97, 114, 114, 59, 27001, 384, 101, 105, 117, 13629, 13650, 13653, 116, 384, 59, 101, 110, 13582, 13637, 13643, 113, 256, 59, 113, 4570, 13583, 101, 113, 256, 59, 113, 13611, 13608, 109, 59, 27335, 256, 98, 112, 13658, 13660, 59, 27349, 59, 27347, 99, 768, 59, 97, 99, 101, 110, 115, 4589, 13676, 13682, 13689, 13691, 13094, 112, 112, 114, 111, 248, 13050, 117, 114, 108, 121, 101, 241, 4606, 241, 4595, 384, 97, 101, 115, 13698, 13704, 13083, 112, 112, 114, 111, 248, 13082, 113, 241, 13079, 103, 59, 26218, 1664, 49, 50, 51, 59, 69, 100, 101, 104, 108, 109, 110, 112, 115, 13737, 13740, 13743, 4636, 13746, 13748, 13760, 13769, 13781, 13786, 13791, 13800, 13805, 32827, 185, 16569, 32827, 178, 16562, 32827, 179, 16563, 59, 27334, 256, 111, 115, 13753, 13756, 116, 59, 27326, 117, 98, 59, 27352, 256, 59, 100, 4642, 13765, 111, 116, 59, 27332, 115, 256, 111, 117, 13775, 13778, 108, 59, 26569, 98, 59, 27351, 97, 114, 114, 59, 27003, 117, 108, 116, 59, 27330, 256, 69, 101, 13796, 13798, 59, 27340, 59, 25227, 108, 117, 115, 59, 27328, 384, 101, 105, 117, 13812, 13833, 13836, 116, 384, 59, 101, 110, 4636, 13820, 13826, 113, 256, 59, 113, 4642, 13746, 101, 113, 256, 59, 113, 13799, 13796, 109, 59, 27336, 256, 98, 112, 13841, 13843, 59, 27348, 59, 27350, 384, 65, 97, 110, 13852, 13856, 13869, 114, 114, 59, 25049, 114, 256, 104, 114, 13862, 13864, 235, 8750, 256, 59, 111, 2603, 2601, 119, 97, 114, 59, 26922, 108, 105, 103, 32827, 223, 16607, 3041, 13905, 13917, 13920, 4814, 13939, 13945, 0, 13950, 14018, 0, 0, 0, 0, 0, 14043, 14083, 0, 14089, 14188, 0, 0, 0, 14215, 626, 13910, 0, 0, 13915, 103, 101, 116, 59, 25366, 59, 17348, 114, 235, 3679, 384, 97, 101, 121, 13926, 13931, 13936, 114, 111, 110, 59, 16741, 100, 105, 108, 59, 16739, 59, 17474, 108, 114, 101, 99, 59, 25365, 114, 59, 49152, 55349, 56625, 512, 101, 105, 107, 111, 13958, 13981, 14005, 14012, 498, 13963, 0, 13969, 101, 256, 52, 102, 4740, 4737, 97, 384, 59, 115, 118, 13976, 13977, 13979, 17336, 121, 109, 59, 17361, 256, 99, 110, 13986, 14002, 107, 256, 97, 115, 13992, 13998, 112, 112, 114, 111, 248, 4801, 105, 109, 187, 4780, 115, 240, 4766, 256, 97, 115, 14010, 13998, 240, 4801, 114, 110, 32827, 254, 16638, 492, 799, 14022, 8935, 101, 115, 33152, 215, 59, 98, 100, 14031, 14032, 14040, 16599, 256, 59, 97, 6415, 14037, 114, 59, 27185, 59, 27184, 384, 101, 112, 115, 14049, 14051, 14080, 225, 10829, 512, 59, 98, 99, 102, 1158, 14060, 14064, 14068, 111, 116, 59, 25398, 105, 114, 59, 27377, 256, 59, 111, 14073, 14076, 49152, 55349, 56677, 114, 107, 59, 27354, 225, 13154, 114, 105, 109, 101, 59, 24628, 384, 97, 105, 112, 14095, 14098, 14180, 100, 229, 4680, 896, 97, 100, 101, 109, 112, 115, 116, 14113, 14157, 14144, 14161, 14167, 14172, 14175, 110, 103, 108, 101, 640, 59, 100, 108, 113, 114, 14128, 14129, 14134, 14144, 14146, 26037, 111, 119, 110, 187, 7611, 101, 102, 116, 256, 59, 101, 10240, 14142, 241, 2350, 59, 25180, 105, 103, 104, 116, 256, 59, 101, 12970, 14155, 241, 4186, 111, 116, 59, 26092, 105, 110, 117, 115, 59, 27194, 108, 117, 115, 59, 27193, 98, 59, 27085, 105, 109, 101, 59, 27195, 101, 122, 105, 117, 109, 59, 25570, 384, 99, 104, 116, 14194, 14205, 14209, 256, 114, 121, 14199, 14203, 59, 49152, 55349, 56521, 59, 17478, 99, 121, 59, 17499, 114, 111, 107, 59, 16743, 256, 105, 111, 14219, 14222, 120, 244, 6007, 104, 101, 97, 100, 256, 108, 114, 14231, 14240, 101, 102, 116, 97, 114, 114, 111, 247, 2127, 105, 103, 104, 116, 97, 114, 114, 111, 119, 187, 3933, 2304, 65, 72, 97, 98, 99, 100, 102, 103, 104, 108, 109, 111, 112, 114, 115, 116, 117, 119, 14288, 14291, 14295, 14308, 14320, 14332, 14350, 14364, 14371, 14388, 14417, 14429, 14443, 14505, 14540, 14546, 14570, 14582, 114, 242, 1005, 97, 114, 59, 26979, 256, 99, 114, 14300, 14306, 117, 116, 101, 32827, 250, 16634, 242, 4432, 114, 483, 14314, 0, 14317, 121, 59, 17502, 118, 101, 59, 16749, 256, 105, 121, 14325, 14330, 114, 99, 32827, 251, 16635, 59, 17475, 384, 97, 98, 104, 14339, 14342, 14347, 114, 242, 5037, 108, 97, 99, 59, 16753, 97, 242, 5059, 256, 105, 114, 14355, 14360, 115, 104, 116, 59, 27006, 59, 49152, 55349, 56626, 114, 97, 118, 101, 32827, 249, 16633, 353, 14375, 14385, 114, 256, 108, 114, 14380, 14382, 187, 2391, 187, 4227, 108, 107, 59, 25984, 256, 99, 116, 14393, 14413, 623, 14399, 0, 0, 14410, 114, 110, 256, 59, 101, 14405, 14406, 25372, 114, 187, 14406, 111, 112, 59, 25359, 114, 105, 59, 26104, 256, 97, 108, 14422, 14426, 99, 114, 59, 16747, 32955, 168, 841, 256, 103, 112, 14434, 14438, 111, 110, 59, 16755, 102, 59, 49152, 55349, 56678, 768, 97, 100, 104, 108, 115, 117, 4427, 14456, 14461, 4978, 14481, 14496, 111, 119, 110, 225, 5043, 97, 114, 112, 111, 111, 110, 256, 108, 114, 14472, 14476, 101, 102, 244, 14381, 105, 103, 104, 244, 14383, 105, 384, 59, 104, 108, 14489, 14490, 14492, 17349, 187, 5114, 111, 110, 187, 14490, 112, 97, 114, 114, 111, 119, 115, 59, 25032, 384, 99, 105, 116, 14512, 14532, 14536, 623, 14518, 0, 0, 14529, 114, 110, 256, 59, 101, 14524, 14525, 25373, 114, 187, 14525, 111, 112, 59, 25358, 110, 103, 59, 16751, 114, 105, 59, 26105, 99, 114, 59, 49152, 55349, 56522, 384, 100, 105, 114, 14553, 14557, 14562, 111, 116, 59, 25328, 108, 100, 101, 59, 16745, 105, 256, 59, 102, 14128, 14568, 187, 6163, 256, 97, 109, 14575, 14578, 114, 242, 14504, 108, 32827, 252, 16636, 97, 110, 103, 108, 101, 59, 27047, 1920, 65, 66, 68, 97, 99, 100, 101, 102, 108, 110, 111, 112, 114, 115, 122, 14620, 14623, 14633, 14637, 14773, 14776, 14781, 14815, 14820, 14824, 14835, 14841, 14845, 14849, 14880, 114, 242, 1015, 97, 114, 256, 59, 118, 14630, 14631, 27368, 59, 27369, 97, 115, 232, 993, 256, 110, 114, 14642, 14647, 103, 114, 116, 59, 27036, 896, 101, 107, 110, 112, 114, 115, 116, 13539, 14662, 14667, 14674, 14685, 14692, 14742, 97, 112, 112, 225, 9237, 111, 116, 104, 105, 110, 231, 7830, 384, 104, 105, 114, 13547, 11976, 14681, 111, 112, 244, 12213, 256, 59, 104, 5047, 14690, 239, 12685, 256, 105, 117, 14697, 14701, 103, 109, 225, 13235, 256, 98, 112, 14706, 14724, 115, 101, 116, 110, 101, 113, 256, 59, 113, 14717, 14720, 49152, 8842, 65024, 59, 49152, 10955, 65024, 115, 101, 116, 110, 101, 113, 256, 59, 113, 14735, 14738, 49152, 8843, 65024, 59, 49152, 10956, 65024, 256, 104, 114, 14747, 14751, 101, 116, 225, 13980, 105, 97, 110, 103, 108, 101, 256, 108, 114, 14762, 14767, 101, 102, 116, 187, 2341, 105, 103, 104, 116, 187, 4177, 121, 59, 17458, 97, 115, 104, 187, 4150, 384, 101, 108, 114, 14788, 14802, 14807, 384, 59, 98, 101, 11754, 14795, 14799, 97, 114, 59, 25275, 113, 59, 25178, 108, 105, 112, 59, 25326, 256, 98, 116, 14812, 5224, 97, 242, 5225, 114, 59, 49152, 55349, 56627, 116, 114, 233, 14766, 115, 117, 256, 98, 112, 14831, 14833, 187, 3356, 187, 3417, 112, 102, 59, 49152, 55349, 56679, 114, 111, 240, 3835, 116, 114, 233, 14772, 256, 99, 117, 14854, 14859, 114, 59, 49152, 55349, 56523, 256, 98, 112, 14864, 14872, 110, 256, 69, 101, 14720, 14870, 187, 14718, 110, 256, 69, 101, 14738, 14878, 187, 14736, 105, 103, 122, 97, 103, 59, 27034, 896, 99, 101, 102, 111, 112, 114, 115, 14902, 14907, 14934, 14939, 14932, 14945, 14954, 105, 114, 99, 59, 16757, 256, 100, 105, 14912, 14929, 256, 98, 103, 14917, 14921, 97, 114, 59, 27231, 101, 256, 59, 113, 5626, 14927, 59, 25177, 101, 114, 112, 59, 24856, 114, 59, 49152, 55349, 56628, 112, 102, 59, 49152, 55349, 56680, 256, 59, 101, 5241, 14950, 97, 116, 232, 5241, 99, 114, 59, 49152, 55349, 56524, 2787, 6030, 14983, 0, 14987, 0, 14992, 15003, 0, 0, 15005, 15016, 15019, 15023, 0, 0, 15043, 15054, 0, 15064, 6108, 6111, 116, 114, 233, 6097, 114, 59, 49152, 55349, 56629, 256, 65, 97, 14996, 14999, 114, 242, 963, 114, 242, 2550, 59, 17342, 256, 65, 97, 15009, 15012, 114, 242, 952, 114, 242, 2539, 97, 240, 10003, 105, 115, 59, 25339, 384, 100, 112, 116, 6052, 15029, 15038, 256, 102, 108, 15034, 6057, 59, 49152, 55349, 56681, 105, 109, 229, 6066, 256, 65, 97, 15047, 15050, 114, 242, 974, 114, 242, 2561, 256, 99, 113, 15058, 6072, 114, 59, 49152, 55349, 56525, 256, 112, 116, 6102, 15068, 114, 233, 6100, 1024, 97, 99, 101, 102, 105, 111, 115, 117, 15088, 15101, 15112, 15116, 15121, 15125, 15131, 15137, 99, 256, 117, 121, 15094, 15099, 116, 101, 32827, 253, 16637, 59, 17487, 256, 105, 121, 15106, 15110, 114, 99, 59, 16759, 59, 17483, 110, 32827, 165, 16549, 114, 59, 49152, 55349, 56630, 99, 121, 59, 17495, 112, 102, 59, 49152, 55349, 56682, 99, 114, 59, 49152, 55349, 56526, 256, 99, 109, 15142, 15145, 121, 59, 17486, 108, 32827, 255, 16639, 1280, 97, 99, 100, 101, 102, 104, 105, 111, 115, 119, 15170, 15176, 15188, 15192, 15204, 15209, 15213, 15220, 15226, 15232, 99, 117, 116, 101, 59, 16762, 256, 97, 121, 15181, 15186, 114, 111, 110, 59, 16766, 59, 17463, 111, 116, 59, 16764, 256, 101, 116, 15197, 15201, 116, 114, 230, 5471, 97, 59, 17334, 114, 59, 49152, 55349, 56631, 99, 121, 59, 17462, 103, 114, 97, 114, 114, 59, 25053, 112, 102, 59, 49152, 55349, 56683, 99, 114, 59, 49152, 55349, 56527, 256, 106, 110, 15237, 15239, 59, 24589, 106, 59, 24588]);

    var xmlDecodeTree = new Uint16Array([512, 97, 103, 108, 113, 9, 21, 24, 27, 621, 15, 0, 0, 18, 112, 59, 16422, 111, 115, 59, 16423, 116, 59, 16446, 116, 59, 16444, 117, 111, 116, 59, 16418]);

    var _a;
    const decodeMap = new Map([
        [0, 65533],
        [128, 8364],
        [130, 8218],
        [131, 402],
        [132, 8222],
        [133, 8230],
        [134, 8224],
        [135, 8225],
        [136, 710],
        [137, 8240],
        [138, 352],
        [139, 8249],
        [140, 338],
        [142, 381],
        [145, 8216],
        [146, 8217],
        [147, 8220],
        [148, 8221],
        [149, 8226],
        [150, 8211],
        [151, 8212],
        [152, 732],
        [153, 8482],
        [154, 353],
        [155, 8250],
        [156, 339],
        [158, 382],
        [159, 376],
    ]);
    const fromCodePoint =
    (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : function (codePoint) {
        let output = "";
        if (codePoint > 0xffff) {
            codePoint -= 0x10000;
            output += String.fromCharCode(((codePoint >>> 10) & 0x3ff) | 0xd800);
            codePoint = 0xdc00 | (codePoint & 0x3ff);
        }
        output += String.fromCharCode(codePoint);
        return output;
    };
    function replaceCodePoint(codePoint) {
        var _a;
        if ((codePoint >= 0xd800 && codePoint <= 0xdfff) || codePoint > 0x10ffff) {
            return 0xfffd;
        }
        return (_a = decodeMap.get(codePoint)) !== null && _a !== void 0 ? _a : codePoint;
    }

    var CharCodes$1;
    (function (CharCodes) {
        CharCodes[CharCodes["NUM"] = 35] = "NUM";
        CharCodes[CharCodes["SEMI"] = 59] = "SEMI";
        CharCodes[CharCodes["ZERO"] = 48] = "ZERO";
        CharCodes[CharCodes["NINE"] = 57] = "NINE";
        CharCodes[CharCodes["LOWER_A"] = 97] = "LOWER_A";
        CharCodes[CharCodes["LOWER_F"] = 102] = "LOWER_F";
        CharCodes[CharCodes["LOWER_X"] = 120] = "LOWER_X";
        CharCodes[CharCodes["To_LOWER_BIT"] = 32] = "To_LOWER_BIT";
    })(CharCodes$1 || (CharCodes$1 = {}));
    var BinTrieFlags;
    (function (BinTrieFlags) {
        BinTrieFlags[BinTrieFlags["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
        BinTrieFlags[BinTrieFlags["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
        BinTrieFlags[BinTrieFlags["JUMP_TABLE"] = 127] = "JUMP_TABLE";
    })(BinTrieFlags || (BinTrieFlags = {}));
    function determineBranch(decodeTree, current, nodeIdx, char) {
        const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
        const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
        if (branchCount === 0) {
            return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
        }
        if (jumpOffset) {
            const value = char - jumpOffset;
            return value < 0 || value >= branchCount
                ? -1
                : decodeTree[nodeIdx + value] - 1;
        }
        let lo = nodeIdx;
        let hi = lo + branchCount - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >>> 1;
            const midVal = decodeTree[mid];
            if (midVal < char) {
                lo = mid + 1;
            }
            else if (midVal > char) {
                hi = mid - 1;
            }
            else {
                return decodeTree[mid + branchCount];
            }
        }
        return -1;
    }

    var CharCodes;
    (function (CharCodes) {
        CharCodes[CharCodes["Tab"] = 9] = "Tab";
        CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
        CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
        CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
        CharCodes[CharCodes["Space"] = 32] = "Space";
        CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
        CharCodes[CharCodes["Num"] = 35] = "Num";
        CharCodes[CharCodes["Amp"] = 38] = "Amp";
        CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
        CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
        CharCodes[CharCodes["Dash"] = 45] = "Dash";
        CharCodes[CharCodes["Slash"] = 47] = "Slash";
        CharCodes[CharCodes["Zero"] = 48] = "Zero";
        CharCodes[CharCodes["Nine"] = 57] = "Nine";
        CharCodes[CharCodes["Semi"] = 59] = "Semi";
        CharCodes[CharCodes["Lt"] = 60] = "Lt";
        CharCodes[CharCodes["Eq"] = 61] = "Eq";
        CharCodes[CharCodes["Gt"] = 62] = "Gt";
        CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
        CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
        CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
        CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
        CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
        CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
        CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
        CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
        CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
    })(CharCodes || (CharCodes = {}));
    var State;
    (function (State) {
        State[State["Text"] = 1] = "Text";
        State[State["BeforeTagName"] = 2] = "BeforeTagName";
        State[State["InTagName"] = 3] = "InTagName";
        State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
        State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
        State[State["InClosingTagName"] = 6] = "InClosingTagName";
        State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
        State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
        State[State["InAttributeName"] = 9] = "InAttributeName";
        State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
        State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
        State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
        State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
        State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
        State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
        State[State["InDeclaration"] = 16] = "InDeclaration";
        State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
        State[State["BeforeComment"] = 18] = "BeforeComment";
        State[State["CDATASequence"] = 19] = "CDATASequence";
        State[State["InSpecialComment"] = 20] = "InSpecialComment";
        State[State["InCommentLike"] = 21] = "InCommentLike";
        State[State["BeforeSpecialS"] = 22] = "BeforeSpecialS";
        State[State["SpecialStartSequence"] = 23] = "SpecialStartSequence";
        State[State["InSpecialTag"] = 24] = "InSpecialTag";
        State[State["BeforeEntity"] = 25] = "BeforeEntity";
        State[State["BeforeNumericEntity"] = 26] = "BeforeNumericEntity";
        State[State["InNamedEntity"] = 27] = "InNamedEntity";
        State[State["InNumericEntity"] = 28] = "InNumericEntity";
        State[State["InHexEntity"] = 29] = "InHexEntity";
    })(State || (State = {}));
    function isWhitespace(c) {
        return (c === CharCodes.Space ||
            c === CharCodes.NewLine ||
            c === CharCodes.Tab ||
            c === CharCodes.FormFeed ||
            c === CharCodes.CarriageReturn);
    }
    function isEndOfTagSection(c) {
        return c === CharCodes.Slash || c === CharCodes.Gt || isWhitespace(c);
    }
    function isNumber(c) {
        return c >= CharCodes.Zero && c <= CharCodes.Nine;
    }
    function isASCIIAlpha(c) {
        return ((c >= CharCodes.LowerA && c <= CharCodes.LowerZ) ||
            (c >= CharCodes.UpperA && c <= CharCodes.UpperZ));
    }
    function isHexDigit(c) {
        return ((c >= CharCodes.UpperA && c <= CharCodes.UpperF) ||
            (c >= CharCodes.LowerA && c <= CharCodes.LowerF));
    }
    var QuoteType;
    (function (QuoteType) {
        QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
        QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
        QuoteType[QuoteType["Single"] = 2] = "Single";
        QuoteType[QuoteType["Double"] = 3] = "Double";
    })(QuoteType || (QuoteType = {}));
    const Sequences = {
        Cdata: new Uint8Array([0x43, 0x44, 0x41, 0x54, 0x41, 0x5b]),
        CdataEnd: new Uint8Array([0x5d, 0x5d, 0x3e]),
        CommentEnd: new Uint8Array([0x2d, 0x2d, 0x3e]),
        ScriptEnd: new Uint8Array([0x3c, 0x2f, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74]),
        StyleEnd: new Uint8Array([0x3c, 0x2f, 0x73, 0x74, 0x79, 0x6c, 0x65]),
        TitleEnd: new Uint8Array([0x3c, 0x2f, 0x74, 0x69, 0x74, 0x6c, 0x65]),
    };
    class Tokenizer {
        constructor({ xmlMode = false, decodeEntities = true, }, cbs) {
            this.cbs = cbs;
            this.state = State.Text;
            this.buffer = "";
            this.sectionStart = 0;
            this.index = 0;
            this.baseState = State.Text;
            this.isSpecial = false;
            this.running = true;
            this.offset = 0;
            this.sequenceIndex = 0;
            this.trieIndex = 0;
            this.trieCurrent = 0;
            this.entityResult = 0;
            this.entityExcess = 0;
            this.xmlMode = xmlMode;
            this.decodeEntities = decodeEntities;
            this.entityTrie = xmlMode ? xmlDecodeTree : htmlDecodeTree;
        }
        reset() {
            this.state = State.Text;
            this.buffer = "";
            this.sectionStart = 0;
            this.index = 0;
            this.baseState = State.Text;
            this.currentSequence = undefined;
            this.running = true;
            this.offset = 0;
        }
        write(chunk) {
            this.offset += this.buffer.length;
            this.buffer = chunk;
            this.parse();
        }
        end() {
            if (this.running)
                this.finish();
        }
        pause() {
            this.running = false;
        }
        resume() {
            this.running = true;
            if (this.index < this.buffer.length + this.offset) {
                this.parse();
            }
        }
        getIndex() {
            return this.index;
        }
        getSectionStart() {
            return this.sectionStart;
        }
        stateText(c) {
            if (c === CharCodes.Lt ||
                (!this.decodeEntities && this.fastForwardTo(CharCodes.Lt))) {
                if (this.index > this.sectionStart) {
                    this.cbs.ontext(this.sectionStart, this.index);
                }
                this.state = State.BeforeTagName;
                this.sectionStart = this.index;
            }
            else if (this.decodeEntities && c === CharCodes.Amp) {
                this.state = State.BeforeEntity;
            }
        }
        stateSpecialStartSequence(c) {
            const isEnd = this.sequenceIndex === this.currentSequence.length;
            const isMatch = isEnd
                ?
                    isEndOfTagSection(c)
                :
                    (c | 0x20) === this.currentSequence[this.sequenceIndex];
            if (!isMatch) {
                this.isSpecial = false;
            }
            else if (!isEnd) {
                this.sequenceIndex++;
                return;
            }
            this.sequenceIndex = 0;
            this.state = State.InTagName;
            this.stateInTagName(c);
        }
        stateInSpecialTag(c) {
            if (this.sequenceIndex === this.currentSequence.length) {
                if (c === CharCodes.Gt || isWhitespace(c)) {
                    const endOfText = this.index - this.currentSequence.length;
                    if (this.sectionStart < endOfText) {
                        const actualIndex = this.index;
                        this.index = endOfText;
                        this.cbs.ontext(this.sectionStart, endOfText);
                        this.index = actualIndex;
                    }
                    this.isSpecial = false;
                    this.sectionStart = endOfText + 2;
                    this.stateInClosingTagName(c);
                    return;
                }
                this.sequenceIndex = 0;
            }
            if ((c | 0x20) === this.currentSequence[this.sequenceIndex]) {
                this.sequenceIndex += 1;
            }
            else if (this.sequenceIndex === 0) {
                if (this.currentSequence === Sequences.TitleEnd) {
                    if (this.decodeEntities && c === CharCodes.Amp) {
                        this.state = State.BeforeEntity;
                    }
                }
                else if (this.fastForwardTo(CharCodes.Lt)) {
                    this.sequenceIndex = 1;
                }
            }
            else {
                this.sequenceIndex = Number(c === CharCodes.Lt);
            }
        }
        stateCDATASequence(c) {
            if (c === Sequences.Cdata[this.sequenceIndex]) {
                if (++this.sequenceIndex === Sequences.Cdata.length) {
                    this.state = State.InCommentLike;
                    this.currentSequence = Sequences.CdataEnd;
                    this.sequenceIndex = 0;
                    this.sectionStart = this.index + 1;
                }
            }
            else {
                this.sequenceIndex = 0;
                this.state = State.InDeclaration;
                this.stateInDeclaration(c);
            }
        }
        fastForwardTo(c) {
            while (++this.index < this.buffer.length + this.offset) {
                if (this.buffer.charCodeAt(this.index - this.offset) === c) {
                    return true;
                }
            }
            this.index = this.buffer.length + this.offset - 1;
            return false;
        }
        stateInCommentLike(c) {
            if (c === this.currentSequence[this.sequenceIndex]) {
                if (++this.sequenceIndex === this.currentSequence.length) {
                    if (this.currentSequence === Sequences.CdataEnd) {
                        this.cbs.oncdata(this.sectionStart, this.index, 2);
                    }
                    else {
                        this.cbs.oncomment(this.sectionStart, this.index, 2);
                    }
                    this.sequenceIndex = 0;
                    this.sectionStart = this.index + 1;
                    this.state = State.Text;
                }
            }
            else if (this.sequenceIndex === 0) {
                if (this.fastForwardTo(this.currentSequence[0])) {
                    this.sequenceIndex = 1;
                }
            }
            else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
                this.sequenceIndex = 0;
            }
        }
        isTagStartChar(c) {
            return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
        }
        startSpecial(sequence, offset) {
            this.isSpecial = true;
            this.currentSequence = sequence;
            this.sequenceIndex = offset;
            this.state = State.SpecialStartSequence;
        }
        stateBeforeTagName(c) {
            if (c === CharCodes.ExclamationMark) {
                this.state = State.BeforeDeclaration;
                this.sectionStart = this.index + 1;
            }
            else if (c === CharCodes.Questionmark) {
                this.state = State.InProcessingInstruction;
                this.sectionStart = this.index + 1;
            }
            else if (this.isTagStartChar(c)) {
                const lower = c | 0x20;
                this.sectionStart = this.index;
                if (!this.xmlMode && lower === Sequences.TitleEnd[2]) {
                    this.startSpecial(Sequences.TitleEnd, 3);
                }
                else {
                    this.state =
                        !this.xmlMode && lower === Sequences.ScriptEnd[2]
                            ? State.BeforeSpecialS
                            : State.InTagName;
                }
            }
            else if (c === CharCodes.Slash) {
                this.state = State.BeforeClosingTagName;
            }
            else {
                this.state = State.Text;
                this.stateText(c);
            }
        }
        stateInTagName(c) {
            if (isEndOfTagSection(c)) {
                this.cbs.onopentagname(this.sectionStart, this.index);
                this.sectionStart = -1;
                this.state = State.BeforeAttributeName;
                this.stateBeforeAttributeName(c);
            }
        }
        stateBeforeClosingTagName(c) {
            if (isWhitespace(c)) ;
            else if (c === CharCodes.Gt) {
                this.state = State.Text;
            }
            else {
                this.state = this.isTagStartChar(c)
                    ? State.InClosingTagName
                    : State.InSpecialComment;
                this.sectionStart = this.index;
            }
        }
        stateInClosingTagName(c) {
            if (c === CharCodes.Gt || isWhitespace(c)) {
                this.cbs.onclosetag(this.sectionStart, this.index);
                this.sectionStart = -1;
                this.state = State.AfterClosingTagName;
                this.stateAfterClosingTagName(c);
            }
        }
        stateAfterClosingTagName(c) {
            if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
                this.state = State.Text;
                this.sectionStart = this.index + 1;
            }
        }
        stateBeforeAttributeName(c) {
            if (c === CharCodes.Gt) {
                this.cbs.onopentagend(this.index);
                if (this.isSpecial) {
                    this.state = State.InSpecialTag;
                    this.sequenceIndex = 0;
                }
                else {
                    this.state = State.Text;
                }
                this.baseState = this.state;
                this.sectionStart = this.index + 1;
            }
            else if (c === CharCodes.Slash) {
                this.state = State.InSelfClosingTag;
            }
            else if (!isWhitespace(c)) {
                this.state = State.InAttributeName;
                this.sectionStart = this.index;
            }
        }
        stateInSelfClosingTag(c) {
            if (c === CharCodes.Gt) {
                this.cbs.onselfclosingtag(this.index);
                this.state = State.Text;
                this.baseState = State.Text;
                this.sectionStart = this.index + 1;
                this.isSpecial = false;
            }
            else if (!isWhitespace(c)) {
                this.state = State.BeforeAttributeName;
                this.stateBeforeAttributeName(c);
            }
        }
        stateInAttributeName(c) {
            if (c === CharCodes.Eq || isEndOfTagSection(c)) {
                this.cbs.onattribname(this.sectionStart, this.index);
                this.sectionStart = -1;
                this.state = State.AfterAttributeName;
                this.stateAfterAttributeName(c);
            }
        }
        stateAfterAttributeName(c) {
            if (c === CharCodes.Eq) {
                this.state = State.BeforeAttributeValue;
            }
            else if (c === CharCodes.Slash || c === CharCodes.Gt) {
                this.cbs.onattribend(QuoteType.NoValue, this.index);
                this.state = State.BeforeAttributeName;
                this.stateBeforeAttributeName(c);
            }
            else if (!isWhitespace(c)) {
                this.cbs.onattribend(QuoteType.NoValue, this.index);
                this.state = State.InAttributeName;
                this.sectionStart = this.index;
            }
        }
        stateBeforeAttributeValue(c) {
            if (c === CharCodes.DoubleQuote) {
                this.state = State.InAttributeValueDq;
                this.sectionStart = this.index + 1;
            }
            else if (c === CharCodes.SingleQuote) {
                this.state = State.InAttributeValueSq;
                this.sectionStart = this.index + 1;
            }
            else if (!isWhitespace(c)) {
                this.sectionStart = this.index;
                this.state = State.InAttributeValueNq;
                this.stateInAttributeValueNoQuotes(c);
            }
        }
        handleInAttributeValue(c, quote) {
            if (c === quote ||
                (!this.decodeEntities && this.fastForwardTo(quote))) {
                this.cbs.onattribdata(this.sectionStart, this.index);
                this.sectionStart = -1;
                this.cbs.onattribend(quote === CharCodes.DoubleQuote
                    ? QuoteType.Double
                    : QuoteType.Single, this.index);
                this.state = State.BeforeAttributeName;
            }
            else if (this.decodeEntities && c === CharCodes.Amp) {
                this.baseState = this.state;
                this.state = State.BeforeEntity;
            }
        }
        stateInAttributeValueDoubleQuotes(c) {
            this.handleInAttributeValue(c, CharCodes.DoubleQuote);
        }
        stateInAttributeValueSingleQuotes(c) {
            this.handleInAttributeValue(c, CharCodes.SingleQuote);
        }
        stateInAttributeValueNoQuotes(c) {
            if (isWhitespace(c) || c === CharCodes.Gt) {
                this.cbs.onattribdata(this.sectionStart, this.index);
                this.sectionStart = -1;
                this.cbs.onattribend(QuoteType.Unquoted, this.index);
                this.state = State.BeforeAttributeName;
                this.stateBeforeAttributeName(c);
            }
            else if (this.decodeEntities && c === CharCodes.Amp) {
                this.baseState = this.state;
                this.state = State.BeforeEntity;
            }
        }
        stateBeforeDeclaration(c) {
            if (c === CharCodes.OpeningSquareBracket) {
                this.state = State.CDATASequence;
                this.sequenceIndex = 0;
            }
            else {
                this.state =
                    c === CharCodes.Dash
                        ? State.BeforeComment
                        : State.InDeclaration;
            }
        }
        stateInDeclaration(c) {
            if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
                this.cbs.ondeclaration(this.sectionStart, this.index);
                this.state = State.Text;
                this.sectionStart = this.index + 1;
            }
        }
        stateInProcessingInstruction(c) {
            if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
                this.cbs.onprocessinginstruction(this.sectionStart, this.index);
                this.state = State.Text;
                this.sectionStart = this.index + 1;
            }
        }
        stateBeforeComment(c) {
            if (c === CharCodes.Dash) {
                this.state = State.InCommentLike;
                this.currentSequence = Sequences.CommentEnd;
                this.sequenceIndex = 2;
                this.sectionStart = this.index + 1;
            }
            else {
                this.state = State.InDeclaration;
            }
        }
        stateInSpecialComment(c) {
            if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
                this.cbs.oncomment(this.sectionStart, this.index, 0);
                this.state = State.Text;
                this.sectionStart = this.index + 1;
            }
        }
        stateBeforeSpecialS(c) {
            const lower = c | 0x20;
            if (lower === Sequences.ScriptEnd[3]) {
                this.startSpecial(Sequences.ScriptEnd, 4);
            }
            else if (lower === Sequences.StyleEnd[3]) {
                this.startSpecial(Sequences.StyleEnd, 4);
            }
            else {
                this.state = State.InTagName;
                this.stateInTagName(c);
            }
        }
        stateBeforeEntity(c) {
            this.entityExcess = 1;
            this.entityResult = 0;
            if (c === CharCodes.Num) {
                this.state = State.BeforeNumericEntity;
            }
            else if (c === CharCodes.Amp) ;
            else {
                this.trieIndex = 0;
                this.trieCurrent = this.entityTrie[0];
                this.state = State.InNamedEntity;
                this.stateInNamedEntity(c);
            }
        }
        stateInNamedEntity(c) {
            this.entityExcess += 1;
            this.trieIndex = determineBranch(this.entityTrie, this.trieCurrent, this.trieIndex + 1, c);
            if (this.trieIndex < 0) {
                this.emitNamedEntity();
                this.index--;
                return;
            }
            this.trieCurrent = this.entityTrie[this.trieIndex];
            const masked = this.trieCurrent & BinTrieFlags.VALUE_LENGTH;
            if (masked) {
                const valueLength = (masked >> 14) - 1;
                if (!this.allowLegacyEntity() && c !== CharCodes.Semi) {
                    this.trieIndex += valueLength;
                }
                else {
                    const entityStart = this.index - this.entityExcess + 1;
                    if (entityStart > this.sectionStart) {
                        this.emitPartial(this.sectionStart, entityStart);
                    }
                    this.entityResult = this.trieIndex;
                    this.trieIndex += valueLength;
                    this.entityExcess = 0;
                    this.sectionStart = this.index + 1;
                    if (valueLength === 0) {
                        this.emitNamedEntity();
                    }
                }
            }
        }
        emitNamedEntity() {
            this.state = this.baseState;
            if (this.entityResult === 0) {
                return;
            }
            const valueLength = (this.entityTrie[this.entityResult] & BinTrieFlags.VALUE_LENGTH) >>
                14;
            switch (valueLength) {
                case 1:
                    this.emitCodePoint(this.entityTrie[this.entityResult] &
                        ~BinTrieFlags.VALUE_LENGTH);
                    break;
                case 2:
                    this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
                    break;
                case 3: {
                    this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
                    this.emitCodePoint(this.entityTrie[this.entityResult + 2]);
                }
            }
        }
        stateBeforeNumericEntity(c) {
            if ((c | 0x20) === CharCodes.LowerX) {
                this.entityExcess++;
                this.state = State.InHexEntity;
            }
            else {
                this.state = State.InNumericEntity;
                this.stateInNumericEntity(c);
            }
        }
        emitNumericEntity(strict) {
            const entityStart = this.index - this.entityExcess - 1;
            const numberStart = entityStart + 2 + Number(this.state === State.InHexEntity);
            if (numberStart !== this.index) {
                if (entityStart > this.sectionStart) {
                    this.emitPartial(this.sectionStart, entityStart);
                }
                this.sectionStart = this.index + Number(strict);
                this.emitCodePoint(replaceCodePoint(this.entityResult));
            }
            this.state = this.baseState;
        }
        stateInNumericEntity(c) {
            if (c === CharCodes.Semi) {
                this.emitNumericEntity(true);
            }
            else if (isNumber(c)) {
                this.entityResult = this.entityResult * 10 + (c - CharCodes.Zero);
                this.entityExcess++;
            }
            else {
                if (this.allowLegacyEntity()) {
                    this.emitNumericEntity(false);
                }
                else {
                    this.state = this.baseState;
                }
                this.index--;
            }
        }
        stateInHexEntity(c) {
            if (c === CharCodes.Semi) {
                this.emitNumericEntity(true);
            }
            else if (isNumber(c)) {
                this.entityResult = this.entityResult * 16 + (c - CharCodes.Zero);
                this.entityExcess++;
            }
            else if (isHexDigit(c)) {
                this.entityResult =
                    this.entityResult * 16 + ((c | 0x20) - CharCodes.LowerA + 10);
                this.entityExcess++;
            }
            else {
                if (this.allowLegacyEntity()) {
                    this.emitNumericEntity(false);
                }
                else {
                    this.state = this.baseState;
                }
                this.index--;
            }
        }
        allowLegacyEntity() {
            return (!this.xmlMode &&
                (this.baseState === State.Text ||
                    this.baseState === State.InSpecialTag));
        }
        cleanup() {
            if (this.running && this.sectionStart !== this.index) {
                if (this.state === State.Text ||
                    (this.state === State.InSpecialTag && this.sequenceIndex === 0)) {
                    this.cbs.ontext(this.sectionStart, this.index);
                    this.sectionStart = this.index;
                }
                else if (this.state === State.InAttributeValueDq ||
                    this.state === State.InAttributeValueSq ||
                    this.state === State.InAttributeValueNq) {
                    this.cbs.onattribdata(this.sectionStart, this.index);
                    this.sectionStart = this.index;
                }
            }
        }
        shouldContinue() {
            return this.index < this.buffer.length + this.offset && this.running;
        }
        parse() {
            while (this.shouldContinue()) {
                const c = this.buffer.charCodeAt(this.index - this.offset);
                if (this.state === State.Text) {
                    this.stateText(c);
                }
                else if (this.state === State.SpecialStartSequence) {
                    this.stateSpecialStartSequence(c);
                }
                else if (this.state === State.InSpecialTag) {
                    this.stateInSpecialTag(c);
                }
                else if (this.state === State.CDATASequence) {
                    this.stateCDATASequence(c);
                }
                else if (this.state === State.InAttributeValueDq) {
                    this.stateInAttributeValueDoubleQuotes(c);
                }
                else if (this.state === State.InAttributeName) {
                    this.stateInAttributeName(c);
                }
                else if (this.state === State.InCommentLike) {
                    this.stateInCommentLike(c);
                }
                else if (this.state === State.InSpecialComment) {
                    this.stateInSpecialComment(c);
                }
                else if (this.state === State.BeforeAttributeName) {
                    this.stateBeforeAttributeName(c);
                }
                else if (this.state === State.InTagName) {
                    this.stateInTagName(c);
                }
                else if (this.state === State.InClosingTagName) {
                    this.stateInClosingTagName(c);
                }
                else if (this.state === State.BeforeTagName) {
                    this.stateBeforeTagName(c);
                }
                else if (this.state === State.AfterAttributeName) {
                    this.stateAfterAttributeName(c);
                }
                else if (this.state === State.InAttributeValueSq) {
                    this.stateInAttributeValueSingleQuotes(c);
                }
                else if (this.state === State.BeforeAttributeValue) {
                    this.stateBeforeAttributeValue(c);
                }
                else if (this.state === State.BeforeClosingTagName) {
                    this.stateBeforeClosingTagName(c);
                }
                else if (this.state === State.AfterClosingTagName) {
                    this.stateAfterClosingTagName(c);
                }
                else if (this.state === State.BeforeSpecialS) {
                    this.stateBeforeSpecialS(c);
                }
                else if (this.state === State.InAttributeValueNq) {
                    this.stateInAttributeValueNoQuotes(c);
                }
                else if (this.state === State.InSelfClosingTag) {
                    this.stateInSelfClosingTag(c);
                }
                else if (this.state === State.InDeclaration) {
                    this.stateInDeclaration(c);
                }
                else if (this.state === State.BeforeDeclaration) {
                    this.stateBeforeDeclaration(c);
                }
                else if (this.state === State.BeforeComment) {
                    this.stateBeforeComment(c);
                }
                else if (this.state === State.InProcessingInstruction) {
                    this.stateInProcessingInstruction(c);
                }
                else if (this.state === State.InNamedEntity) {
                    this.stateInNamedEntity(c);
                }
                else if (this.state === State.BeforeEntity) {
                    this.stateBeforeEntity(c);
                }
                else if (this.state === State.InHexEntity) {
                    this.stateInHexEntity(c);
                }
                else if (this.state === State.InNumericEntity) {
                    this.stateInNumericEntity(c);
                }
                else {
                    this.stateBeforeNumericEntity(c);
                }
                this.index++;
            }
            this.cleanup();
        }
        finish() {
            if (this.state === State.InNamedEntity) {
                this.emitNamedEntity();
            }
            if (this.sectionStart < this.index) {
                this.handleTrailingData();
            }
            this.cbs.onend();
        }
        handleTrailingData() {
            const endIndex = this.buffer.length + this.offset;
            if (this.state === State.InCommentLike) {
                if (this.currentSequence === Sequences.CdataEnd) {
                    this.cbs.oncdata(this.sectionStart, endIndex, 0);
                }
                else {
                    this.cbs.oncomment(this.sectionStart, endIndex, 0);
                }
            }
            else if (this.state === State.InNumericEntity &&
                this.allowLegacyEntity()) {
                this.emitNumericEntity(false);
            }
            else if (this.state === State.InHexEntity &&
                this.allowLegacyEntity()) {
                this.emitNumericEntity(false);
            }
            else if (this.state === State.InTagName ||
                this.state === State.BeforeAttributeName ||
                this.state === State.BeforeAttributeValue ||
                this.state === State.AfterAttributeName ||
                this.state === State.InAttributeName ||
                this.state === State.InAttributeValueSq ||
                this.state === State.InAttributeValueDq ||
                this.state === State.InAttributeValueNq ||
                this.state === State.InClosingTagName) ;
            else {
                this.cbs.ontext(this.sectionStart, endIndex);
            }
        }
        emitPartial(start, endIndex) {
            if (this.baseState !== State.Text &&
                this.baseState !== State.InSpecialTag) {
                this.cbs.onattribdata(start, endIndex);
            }
            else {
                this.cbs.ontext(start, endIndex);
            }
        }
        emitCodePoint(cp) {
            if (this.baseState !== State.Text &&
                this.baseState !== State.InSpecialTag) {
                this.cbs.onattribentity(cp);
            }
            else {
                this.cbs.ontextentity(cp);
            }
        }
    }

    const formTags = new Set([
        "input",
        "option",
        "optgroup",
        "select",
        "button",
        "datalist",
        "textarea",
    ]);
    const pTag = new Set(["p"]);
    const tableSectionTags = new Set(["thead", "tbody"]);
    const ddtTags = new Set(["dd", "dt"]);
    const rtpTags = new Set(["rt", "rp"]);
    const openImpliesClose = new Map([
        ["tr", new Set(["tr", "th", "td"])],
        ["th", new Set(["th"])],
        ["td", new Set(["thead", "th", "td"])],
        ["body", new Set(["head", "link", "script"])],
        ["li", new Set(["li"])],
        ["p", pTag],
        ["h1", pTag],
        ["h2", pTag],
        ["h3", pTag],
        ["h4", pTag],
        ["h5", pTag],
        ["h6", pTag],
        ["select", formTags],
        ["input", formTags],
        ["output", formTags],
        ["button", formTags],
        ["datalist", formTags],
        ["textarea", formTags],
        ["option", new Set(["option"])],
        ["optgroup", new Set(["optgroup", "option"])],
        ["dd", ddtTags],
        ["dt", ddtTags],
        ["address", pTag],
        ["article", pTag],
        ["aside", pTag],
        ["blockquote", pTag],
        ["details", pTag],
        ["div", pTag],
        ["dl", pTag],
        ["fieldset", pTag],
        ["figcaption", pTag],
        ["figure", pTag],
        ["footer", pTag],
        ["form", pTag],
        ["header", pTag],
        ["hr", pTag],
        ["main", pTag],
        ["nav", pTag],
        ["ol", pTag],
        ["pre", pTag],
        ["section", pTag],
        ["table", pTag],
        ["ul", pTag],
        ["rt", rtpTags],
        ["rp", rtpTags],
        ["tbody", tableSectionTags],
        ["tfoot", tableSectionTags],
    ]);
    const voidElements = new Set([
        "area",
        "base",
        "basefont",
        "br",
        "col",
        "command",
        "embed",
        "frame",
        "hr",
        "img",
        "input",
        "isindex",
        "keygen",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    ]);
    const foreignContextElements = new Set(["math", "svg"]);
    const htmlIntegrationElements = new Set([
        "mi",
        "mo",
        "mn",
        "ms",
        "mtext",
        "annotation-xml",
        "foreignobject",
        "desc",
        "title",
    ]);
    const reNameEnd = /\s|\//;
    class Parser {
        constructor(cbs, options = {}) {
            var _a, _b, _c, _d, _e;
            this.options = options;
            this.startIndex = 0;
            this.endIndex = 0;
            this.openTagStart = 0;
            this.tagname = "";
            this.attribname = "";
            this.attribvalue = "";
            this.attribs = null;
            this.stack = [];
            this.foreignContext = [];
            this.buffers = [];
            this.bufferOffset = 0;
            this.writeIndex = 0;
            this.ended = false;
            this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
            this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : !options.xmlMode;
            this.lowerCaseAttributeNames =
                (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : !options.xmlMode;
            this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== void 0 ? _c : Tokenizer)(this.options, this);
            (_e = (_d = this.cbs).onparserinit) === null || _e === void 0 ? void 0 : _e.call(_d, this);
        }
        ontext(start, endIndex) {
            var _a, _b;
            const data = this.getSlice(start, endIndex);
            this.endIndex = endIndex - 1;
            (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, data);
            this.startIndex = endIndex;
        }
        ontextentity(cp) {
            var _a, _b;
            const idx = this.tokenizer.getSectionStart();
            this.endIndex = idx - 1;
            (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, fromCodePoint(cp));
            this.startIndex = idx;
        }
        isVoidElement(name) {
            return !this.options.xmlMode && voidElements.has(name);
        }
        onopentagname(start, endIndex) {
            this.endIndex = endIndex;
            let name = this.getSlice(start, endIndex);
            if (this.lowerCaseTagNames) {
                name = name.toLowerCase();
            }
            this.emitOpenTag(name);
        }
        emitOpenTag(name) {
            var _a, _b, _c, _d;
            this.openTagStart = this.startIndex;
            this.tagname = name;
            const impliesClose = !this.options.xmlMode && openImpliesClose.get(name);
            if (impliesClose) {
                while (this.stack.length > 0 &&
                    impliesClose.has(this.stack[this.stack.length - 1])) {
                    const el = this.stack.pop();
                    (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, el, true);
                }
            }
            if (!this.isVoidElement(name)) {
                this.stack.push(name);
                if (foreignContextElements.has(name)) {
                    this.foreignContext.push(true);
                }
                else if (htmlIntegrationElements.has(name)) {
                    this.foreignContext.push(false);
                }
            }
            (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, name);
            if (this.cbs.onopentag)
                this.attribs = {};
        }
        endOpenTag(isImplied) {
            var _a, _b;
            this.startIndex = this.openTagStart;
            if (this.attribs) {
                (_b = (_a = this.cbs).onopentag) === null || _b === void 0 ? void 0 : _b.call(_a, this.tagname, this.attribs, isImplied);
                this.attribs = null;
            }
            if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
                this.cbs.onclosetag(this.tagname, true);
            }
            this.tagname = "";
        }
        onopentagend(endIndex) {
            this.endIndex = endIndex;
            this.endOpenTag(false);
            this.startIndex = endIndex + 1;
        }
        onclosetag(start, endIndex) {
            var _a, _b, _c, _d, _e, _f;
            this.endIndex = endIndex;
            let name = this.getSlice(start, endIndex);
            if (this.lowerCaseTagNames) {
                name = name.toLowerCase();
            }
            if (foreignContextElements.has(name) ||
                htmlIntegrationElements.has(name)) {
                this.foreignContext.pop();
            }
            if (!this.isVoidElement(name)) {
                const pos = this.stack.lastIndexOf(name);
                if (pos !== -1) {
                    if (this.cbs.onclosetag) {
                        let count = this.stack.length - pos;
                        while (count--) {
                            this.cbs.onclosetag(this.stack.pop(), count !== 0);
                        }
                    }
                    else
                        this.stack.length = pos;
                }
                else if (!this.options.xmlMode && name === "p") {
                    this.emitOpenTag("p");
                    this.closeCurrentTag(true);
                }
            }
            else if (!this.options.xmlMode && name === "br") {
                (_b = (_a = this.cbs).onopentagname) === null || _b === void 0 ? void 0 : _b.call(_a, "br");
                (_d = (_c = this.cbs).onopentag) === null || _d === void 0 ? void 0 : _d.call(_c, "br", {}, true);
                (_f = (_e = this.cbs).onclosetag) === null || _f === void 0 ? void 0 : _f.call(_e, "br", false);
            }
            this.startIndex = endIndex + 1;
        }
        onselfclosingtag(endIndex) {
            this.endIndex = endIndex;
            if (this.options.xmlMode ||
                this.options.recognizeSelfClosing ||
                this.foreignContext[this.foreignContext.length - 1]) {
                this.closeCurrentTag(false);
                this.startIndex = endIndex + 1;
            }
            else {
                this.onopentagend(endIndex);
            }
        }
        closeCurrentTag(isOpenImplied) {
            var _a, _b;
            const name = this.tagname;
            this.endOpenTag(isOpenImplied);
            if (this.stack[this.stack.length - 1] === name) {
                (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, name, !isOpenImplied);
                this.stack.pop();
            }
        }
        onattribname(start, endIndex) {
            this.startIndex = start;
            const name = this.getSlice(start, endIndex);
            this.attribname = this.lowerCaseAttributeNames
                ? name.toLowerCase()
                : name;
        }
        onattribdata(start, endIndex) {
            this.attribvalue += this.getSlice(start, endIndex);
        }
        onattribentity(cp) {
            this.attribvalue += fromCodePoint(cp);
        }
        onattribend(quote, endIndex) {
            var _a, _b;
            this.endIndex = endIndex;
            (_b = (_a = this.cbs).onattribute) === null || _b === void 0 ? void 0 : _b.call(_a, this.attribname, this.attribvalue, quote === QuoteType.Double
                ? '"'
                : quote === QuoteType.Single
                    ? "'"
                    : quote === QuoteType.NoValue
                        ? undefined
                        : null);
            if (this.attribs &&
                !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
                this.attribs[this.attribname] = this.attribvalue;
            }
            this.attribvalue = "";
        }
        getInstructionName(value) {
            const idx = value.search(reNameEnd);
            let name = idx < 0 ? value : value.substr(0, idx);
            if (this.lowerCaseTagNames) {
                name = name.toLowerCase();
            }
            return name;
        }
        ondeclaration(start, endIndex) {
            this.endIndex = endIndex;
            const value = this.getSlice(start, endIndex);
            if (this.cbs.onprocessinginstruction) {
                const name = this.getInstructionName(value);
                this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
            }
            this.startIndex = endIndex + 1;
        }
        onprocessinginstruction(start, endIndex) {
            this.endIndex = endIndex;
            const value = this.getSlice(start, endIndex);
            if (this.cbs.onprocessinginstruction) {
                const name = this.getInstructionName(value);
                this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
            }
            this.startIndex = endIndex + 1;
        }
        oncomment(start, endIndex, offset) {
            var _a, _b, _c, _d;
            this.endIndex = endIndex;
            (_b = (_a = this.cbs).oncomment) === null || _b === void 0 ? void 0 : _b.call(_a, this.getSlice(start, endIndex - offset));
            (_d = (_c = this.cbs).oncommentend) === null || _d === void 0 ? void 0 : _d.call(_c);
            this.startIndex = endIndex + 1;
        }
        oncdata(start, endIndex, offset) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            this.endIndex = endIndex;
            const value = this.getSlice(start, endIndex - offset);
            if (this.options.xmlMode || this.options.recognizeCDATA) {
                (_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 ? void 0 : _b.call(_a);
                (_d = (_c = this.cbs).ontext) === null || _d === void 0 ? void 0 : _d.call(_c, value);
                (_f = (_e = this.cbs).oncdataend) === null || _f === void 0 ? void 0 : _f.call(_e);
            }
            else {
                (_h = (_g = this.cbs).oncomment) === null || _h === void 0 ? void 0 : _h.call(_g, `[CDATA[${value}]]`);
                (_k = (_j = this.cbs).oncommentend) === null || _k === void 0 ? void 0 : _k.call(_j);
            }
            this.startIndex = endIndex + 1;
        }
        onend() {
            var _a, _b;
            if (this.cbs.onclosetag) {
                this.endIndex = this.startIndex;
                for (let i = this.stack.length; i > 0; this.cbs.onclosetag(this.stack[--i], true))
                    ;
            }
            (_b = (_a = this.cbs).onend) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        reset() {
            var _a, _b, _c, _d;
            (_b = (_a = this.cbs).onreset) === null || _b === void 0 ? void 0 : _b.call(_a);
            this.tokenizer.reset();
            this.tagname = "";
            this.attribname = "";
            this.attribs = null;
            this.stack.length = 0;
            this.startIndex = 0;
            this.endIndex = 0;
            (_d = (_c = this.cbs).onparserinit) === null || _d === void 0 ? void 0 : _d.call(_c, this);
            this.buffers.length = 0;
            this.bufferOffset = 0;
            this.writeIndex = 0;
            this.ended = false;
        }
        parseComplete(data) {
            this.reset();
            this.end(data);
        }
        getSlice(start, end) {
            while (start - this.bufferOffset >= this.buffers[0].length) {
                this.shiftBuffer();
            }
            let str = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
            while (end - this.bufferOffset > this.buffers[0].length) {
                this.shiftBuffer();
                str += this.buffers[0].slice(0, end - this.bufferOffset);
            }
            return str;
        }
        shiftBuffer() {
            this.bufferOffset += this.buffers[0].length;
            this.writeIndex--;
            this.buffers.shift();
        }
        write(chunk) {
            var _a, _b;
            if (this.ended) {
                (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(".write() after done!"));
                return;
            }
            this.buffers.push(chunk);
            if (this.tokenizer.running) {
                this.tokenizer.write(chunk);
                this.writeIndex++;
            }
        }
        end(chunk) {
            var _a, _b;
            if (this.ended) {
                (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, Error(".end() after done!"));
                return;
            }
            if (chunk)
                this.write(chunk);
            this.ended = true;
            this.tokenizer.end();
        }
        pause() {
            this.tokenizer.pause();
        }
        resume() {
            this.tokenizer.resume();
            while (this.tokenizer.running &&
                this.writeIndex < this.buffers.length) {
                this.tokenizer.write(this.buffers[this.writeIndex++]);
            }
            if (this.ended)
                this.tokenizer.end();
        }
        parseChunk(chunk) {
            this.write(chunk);
        }
        done(chunk) {
            this.end(chunk);
        }
    }

    var ElementType;
    (function (ElementType) {
        ElementType["Root"] = "root";
        ElementType["Text"] = "text";
        ElementType["Directive"] = "directive";
        ElementType["Comment"] = "comment";
        ElementType["Script"] = "script";
        ElementType["Style"] = "style";
        ElementType["Tag"] = "tag";
        ElementType["CDATA"] = "cdata";
        ElementType["Doctype"] = "doctype";
    })(ElementType || (ElementType = {}));
    ElementType.Root;
    ElementType.Text;
    ElementType.Directive;
    ElementType.Comment;
    ElementType.Script;
    ElementType.Style;
    ElementType.Tag;
    ElementType.CDATA;
    ElementType.Doctype;

    var EntityLevel;
    (function (EntityLevel) {
        EntityLevel[EntityLevel["XML"] = 0] = "XML";
        EntityLevel[EntityLevel["HTML"] = 1] = "HTML";
    })(EntityLevel || (EntityLevel = {}));
    var DecodingMode;
    (function (DecodingMode) {
        DecodingMode[DecodingMode["Legacy"] = 0] = "Legacy";
        DecodingMode[DecodingMode["Strict"] = 1] = "Strict";
    })(DecodingMode || (DecodingMode = {}));
    var EncodingMode;
    (function (EncodingMode) {
        EncodingMode[EncodingMode["UTF8"] = 0] = "UTF8";
        EncodingMode[EncodingMode["ASCII"] = 1] = "ASCII";
        EncodingMode[EncodingMode["Extensive"] = 2] = "Extensive";
        EncodingMode[EncodingMode["Attribute"] = 3] = "Attribute";
        EncodingMode[EncodingMode["Text"] = 4] = "Text";
    })(EncodingMode || (EncodingMode = {}));

    new Map([
        "altGlyph",
        "altGlyphDef",
        "altGlyphItem",
        "animateColor",
        "animateMotion",
        "animateTransform",
        "clipPath",
        "feBlend",
        "feColorMatrix",
        "feComponentTransfer",
        "feComposite",
        "feConvolveMatrix",
        "feDiffuseLighting",
        "feDisplacementMap",
        "feDistantLight",
        "feDropShadow",
        "feFlood",
        "feFuncA",
        "feFuncB",
        "feFuncG",
        "feFuncR",
        "feGaussianBlur",
        "feImage",
        "feMerge",
        "feMergeNode",
        "feMorphology",
        "feOffset",
        "fePointLight",
        "feSpecularLighting",
        "feSpotLight",
        "feTile",
        "feTurbulence",
        "foreignObject",
        "glyphRef",
        "linearGradient",
        "radialGradient",
        "textPath",
    ].map((val) => [val.toLowerCase(), val]));
    new Map([
        "definitionURL",
        "attributeName",
        "attributeType",
        "baseFrequency",
        "baseProfile",
        "calcMode",
        "clipPathUnits",
        "diffuseConstant",
        "edgeMode",
        "filterUnits",
        "glyphRef",
        "gradientTransform",
        "gradientUnits",
        "kernelMatrix",
        "kernelUnitLength",
        "keyPoints",
        "keySplines",
        "keyTimes",
        "lengthAdjust",
        "limitingConeAngle",
        "markerHeight",
        "markerUnits",
        "markerWidth",
        "maskContentUnits",
        "maskUnits",
        "numOctaves",
        "pathLength",
        "patternContentUnits",
        "patternTransform",
        "patternUnits",
        "pointsAtX",
        "pointsAtY",
        "pointsAtZ",
        "preserveAlpha",
        "preserveAspectRatio",
        "primitiveUnits",
        "refX",
        "refY",
        "repeatCount",
        "repeatDur",
        "requiredExtensions",
        "requiredFeatures",
        "specularConstant",
        "specularExponent",
        "spreadMethod",
        "startOffset",
        "stdDeviation",
        "stitchTiles",
        "surfaceScale",
        "systemLanguage",
        "tableValues",
        "targetX",
        "targetY",
        "textLength",
        "viewBox",
        "viewTarget",
        "xChannelSelector",
        "yChannelSelector",
        "zoomAndPan",
    ].map((val) => [val.toLowerCase(), val]));

    var DocumentPosition;
    (function (DocumentPosition) {
        DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
        DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
        DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
        DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
        DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
    })(DocumentPosition || (DocumentPosition = {}));

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
            const p = new Parser({
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

    core.registerLanguage('python', python);
    core.registerLanguage('markdown', markdown);
    core.registerLanguage('yaml', yaml);
    core.registerLanguage('java', java);
    core.registerLanguage('javascript', javascript$1);
    core.registerLanguage('csharp', csharp);
    core.registerLanguage('cpp', cpp);
    core.registerLanguage('c', c);
    core.registerLanguage('php', php);
    core.registerLanguage('typescript', typescript);
    core.registerLanguage('swift', swift);
    core.registerLanguage('kotlin', kotlin);
    core.registerLanguage('go', go);
    core.registerLanguage('rust', rust);
    core.registerLanguage('ruby', ruby);
    core.registerLanguage('scala', scala);
    core.registerLanguage('dart', dart);
    core.registerLanguage('lua', lua);
    core.registerLanguage('groovy', groovy);
    core.registerLanguage('perl', perl);
    core.registerLanguage('julia', julia);
    core.registerLanguage('haskell', haskell);
    core.registerLanguage('sql', sql);
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
    ];
    const debug$1 = logger('pano-item-factory');
    const isValidUrl = (text) => {
        try {
            return isUrl_1(text) && glib2.uri_parse(text, glib2.UriFlags.NONE) !== null;
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
                queryBuilder.withItemTypes(['LINK', 'TEXT', 'CODE', 'COLOR']).withMatchValue(value).build();
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
                if (value.trim().toLowerCase().startsWith('http') && isValidUrl(value)) {
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
                if (lib.validateHTMLColorHex(value.trim()) ||
                    lib.validateHTMLColorRgb(value.trim()) ||
                    lib.validateHTMLColorName(value.trim())) {
                    return db.save({
                        content: value,
                        copyDate: new Date(),
                        isFavorite: false,
                        itemType: 'COLOR',
                        matchValue: value,
                        searchValue: value,
                    });
                }
                const highlightResult = core.highlightAuto(value.slice(0, 2000), SUPPORTED_LANGUAGES);
                if (highlightResult.relevance < 10) {
                    return db.save({
                        content: value,
                        copyDate: new Date(),
                        isFavorite: false,
                        itemType: 'TEXT',
                        matchValue: value,
                        searchValue: value,
                    });
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
            default:
                return null;
        }
        panoItem.connect('on-remove', (_, dbItemStr) => {
            const dbItem = JSON.parse(dbItemStr);
            removeItemResources(dbItem);
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
                if (event.get_state()) {
                    return clutter10.EVENT_PROPAGATE;
                }
                if ((event.get_key_symbol() === clutter10.KEY_Left &&
                    this.getVisibleItems().findIndex((item) => item.dbItem.id === this.currentFocus?.dbItem.id) === 0) ||
                    event.get_key_symbol() === clutter10.KEY_Up) {
                    this.emit('scroll-focus-out');
                    return clutter10.EVENT_STOP;
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
            db.query(new ClipboardQueryBuilder().withLimit(-1, this.settings.get_int('history-length')).build()).forEach((dbItem) => {
                removeItemResources(dbItem);
            });
            db.query(new ClipboardQueryBuilder().withLimit(this.settings.get_int('history-length'), 0).build()).forEach((dbItem) => {
                const panoItem = createPanoItemFromDb(dbItem);
                if (panoItem) {
                    this.appendItem(panoItem);
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
                }
            });
        }
        appendItem(panoItem) {
            this.connectOnRemove(panoItem);
            this.list.add_child(panoItem);
        }
        prependItem(panoItem) {
            const existingItem = this.getItem(panoItem);
            if (existingItem) {
                this.removeItem(existingItem);
            }
            this.connectOnRemove(panoItem);
            this.list.insert_child_at_index(panoItem, 0);
            this.removeExcessiveItems();
        }
        connectOnRemove(panoItem) {
            panoItem.connect('on-remove', () => {
                if (this.currentFocus === panoItem) {
                    this.focusNext() || this.focusPrev();
                }
                this.removeItem(panoItem);
                this.filter(this.currentFilter);
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
            if (historyLength < this.getItems().length) {
                this.getItems()
                    .slice(historyLength)
                    .forEach((item) => {
                    this.removeItem(item);
                });
            }
            db.query(new ClipboardQueryBuilder().withLimit(-1, this.settings.get_int('history-length')).build()).forEach((dbItem) => {
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
        filter(text) {
            this.currentFilter = text;
            if (!text) {
                this.getItems().forEach((i) => i.show());
                return;
            }
            const result = db
                .query(new ClipboardQueryBuilder()
                .withContainingSearchValue(text)
                .withLimit(this.settings.get_int('history-length'), 0)
                .build())
                .map((dbItem) => dbItem.id);
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
            this.search = new st1.Entry({
                can_focus: true,
                hint_text: _('Type to search'),
                track_hover: true,
                width: 300,
                primary_icon: new st1.Icon({
                    style_class: 'search-entry-icon',
                    icon_name: 'edit-find-symbolic',
                    icon_size: 13,
                }),
            });
            this.search.clutter_text.connect('text-changed', () => {
                this.emit('search-text-changed', this.search.text);
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
            });
            this.add_child(this.search);
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
                param_types: [gobject2.TYPE_STRING],
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
                }
                else {
                    this.remove_style_class_name('incognito');
                }
            });
            if (this.settings.get_boolean('is-in-incognito')) {
                this.add_style_class_name('incognito');
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
            this.searchBox.connect('search-text-changed', (_, text) => {
                this.scrollView.filter(text);
            });
        }
        setupScrollView() {
            this.scrollView.connect('scroll-focus-out', () => {
                this.searchBox.focus();
            });
            this.scrollView.connect('scroll-backspace-press', () => {
                this.searchBox.removeChar();
                this.searchBox.focus();
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
                    this.settings.get_strv('exclusion-list').indexOf(wmClass) >= 0) {
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

})(imports.gi.Gio, imports.gi.GLib, imports.gi.Shell, imports.gi.Clutter, imports.gi.GObject, imports.gi.St, imports.gi.GSound, imports.gi.Meta, imports.gi.Gda, imports.gi.GdkPixbuf, imports.gi.Pango, imports.gi.Graphene, imports.gi.Soup);

}
catch(err) {
  log(`[pano] [init] ${err}`);
  imports.ui.main.notify('Pano', `${err}`);
  throw err;
}
