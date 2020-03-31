"use strict";
// namespace FudgeUserInterface {
//     /**
//      * <select><option>Hallo</option></select>
//      */
//     import ƒ = FudgeCore;
//     export class ToggleButton extends HTMLButtonElement {
//         private toggleState: boolean;
//         public constructor(style: string) {
//             super();
//             this.type = "button";
//             this.toggleState = true;
//             this.classList.add(style);
//             this.classList.add("ToggleOn");
//             this.addEventListener("click", this.switchToggleState);
//         }
//         public setToggleState(toggleState: boolean): void {
//             this.toggleState = toggleState;
//             if (this.toggleState == true) {
//                 this.classList.add("ToggleOn");
//                 this.classList.remove("ToggleOff");
//             }
//             else {
//                 this.classList.remove("ToggleOn");
//                 this.classList.add("ToggleOff");
//             }
//         }
//         public getToggleState(): boolean {
//             return this.toggleState;
//         }
//         public toggle(): void {
//             this.setToggleState(!this.toggleState);
//         }
//         private switchToggleState = (_event: MouseEvent): void => {
//             this.setToggleState(!this.toggleState);
//         }
//     }
//     export class Stepper extends HTMLInputElement {
//         public constructor(_label: string, params: { min?: number, max?: number, step?: number, value?: number } = {}) {
//             super();
//             this.name = _label;
//             this.type = "number";
//             this.value = params.value.toString();
//             this.id = _label;
//             this.step = String(params.step) || "1";
//         }
//     }
//     export class FoldableFieldSet extends HTMLFieldSetElement {
//         public constructor(_legend: string) {
//             super();
//             let cntLegend: HTMLLegendElement = document.createElement("legend");
//             cntLegend.classList.add("unfoldable");
//             let btnFoldButton: HTMLButtonElement = new ToggleButton("FoldButton");
//             btnFoldButton.addEventListener("click", this.toggleFoldElement);
//             // btnfoldButton.classList.add("unfoldable");
//             let lblTitle: HTMLSpanElement = document.createElement("span");
//             lblTitle.textContent = _legend;
//             // lblTitle.classList.add("unfoldable");
//             cntLegend.appendChild(btnFoldButton);
//             cntLegend.appendChild(lblTitle);
//             this.appendChild(cntLegend);
//         }
//         private toggleFoldElement = (_event: MouseEvent): void => {
//             _event.preventDefault();
//             if (_event.target != _event.currentTarget) return;
//             //Get the fieldset the button belongs to
//             let children: HTMLCollection = this.children;
//             //fold or unfold all children that aren't unfoldable
//             for (let child of children) {
//                 if (!child.classList.contains("unfoldable")) {
//                     child.classList.toggle("folded");
//                 }
//             }
//         }
//     }
//     class MenuButton extends HTMLDivElement {
//         name: string;
//         private signature: string;
//         public constructor(_name: string, textcontent: string, parentSignature: string) {
//             super();
//             this.name = _name;
//             this.signature = parentSignature + "." + _name;
//             let button: HTMLButtonElement = document.createElement("button");
//             button.textContent = textcontent;
//             this.append(button);
//             button.addEventListener("click", this.resolveClick);
//         }
//         private resolveClick = (_event: MouseEvent): void => {
//             let event: CustomEvent = new CustomEvent(EVENT_USERINTERFACE.DROPMENUCLICK, { detail: this.signature, bubbles: true });
//             this.dispatchEvent(event);
//         }
//     }
//     class MenuContent extends HTMLDivElement {
//         public constructor(_submenu?: boolean) {
//             super();
//             if (_submenu) {
//                 this.classList.add("submenu-content");
//             }
//             else {
//                 this.classList.add("dropdown-content");
//             }
//         }
//     }
//     export class DropMenu extends HTMLDivElement {
//         name: string;
//         private content: MenuContent;
//         private signature: string;
//         public constructor(_name: string, _contentList: ƒ.Mutator, params: { _parentSignature?: string, _text?: string }) {
//             super();
//             let button: HTMLButtonElement = document.createElement("button");
//             button.name = _name;
//             if (params._text) {
//                 button.textContent = params._text;
//             }
//             else {
//                 button.textContent = _name;
//             }
//             button.addEventListener("click", this.toggleFoldContent);
//             window.addEventListener("click", this.collapseMenu);
//             let isSubmenu: boolean = (params._parentSignature != null);
//             if (params._parentSignature) {
//                 this.signature = params._parentSignature + "." + _name;
//             }
//             else {
//                 this.signature = _name;
//             }
//             this.append(button);
//             this.content = new MenuContent(isSubmenu);
//             if (params._parentSignature) {
//                 this.classList.add("submenu");
//             }
//             else {
//                 this.classList.add("dropdown");
//             }
//             this.content.classList.toggle("folded");
//             this.name = _name;
//             for (let key in _contentList) {
//                 if (typeof _contentList[key] == "object") {
//                     let subMenu: DropMenu = new DropMenu(key, <ƒ.Mutator>_contentList[key], { _parentSignature: this.signature });
//                     this.content.append(subMenu);
//                 }
//                 else if (typeof _contentList[key] == "string") {
//                     let contentEntry: MenuButton = new MenuButton(key, <string>_contentList[key], this.signature);
//                     this.content.append(contentEntry);
//                 }
//             }
//             this.append(this.content);
//         }
//         private toggleFoldContent = (_event: MouseEvent): void => {
//             this.content.classList.toggle("folded");
//         }
//         private collapseMenu = (_event: MouseEvent): void => {
//             if (!(this.contains(<HTMLElement>_event.target))) {
//                 if (!this.content.classList.contains("folded")) {
//                     this.toggleFoldContent(_event);
//                 }
//             }
//         }
//     }
//     customElements.define("ui-stepper", Stepper, { extends: "input" });
//     customElements.define("ui-toggle-button", ToggleButton, { extends: "button" });
//     customElements.define("ui-fold-fieldset", FoldableFieldSet, { extends: "fieldset" });
//     customElements.define("ui-dropdown", DropMenu, { extends: "div" });
//     customElements.define("ui-dropdown-button", MenuButton, { extends: "div" });
//     customElements.define("ui-dropdown-content", MenuContent, { extends: "div" });
// }
var FudgeUserInterface;
(function (FudgeUserInterface) {
    //import ƒ = FudgeCore;
    class FoldableFieldSet extends HTMLFieldSetElement {
        constructor(_legend) {
            super();
            this.toggleFoldElement = (_event) => {
                _event.preventDefault();
                if (_event.target != _event.currentTarget)
                    return;
                //Get the fieldset the button belongs to
                let children = this.children;
                //fold or unfold all children that aren't unfoldable
                for (let child of children) {
                    if (!child.classList.contains("unfoldable")) {
                        child.classList.toggle("folded");
                    }
                }
            };
            let cntLegend = document.createElement("legend");
            cntLegend.classList.add("unfoldable");
            let btnFoldButton = new FudgeUserInterface.ToggleButton("FoldButton");
            btnFoldButton.addEventListener("click", this.toggleFoldElement);
            // btnfoldButton.classList.add("unfoldable");
            let lblTitle = document.createElement("span");
            lblTitle.textContent = _legend;
            // lblTitle.classList.add("unfoldable");
            cntLegend.appendChild(btnFoldButton);
            cntLegend.appendChild(lblTitle);
            this.appendChild(cntLegend);
        }
    }
    FudgeUserInterface.FoldableFieldSet = FoldableFieldSet;
    customElements.define("ui-fold-fieldset", FoldableFieldSet, { extends: "fieldset" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
var FudgeUserInterface;
(function (FudgeUserInterface) {
    // export abstract class ListController {
    //     abstract listRoot: HTMLElement;
    //     protected abstract toggleCollapse(_event: MouseEvent): void;
    // }
    class CollapsableList extends HTMLUListElement {
        constructor() {
            super();
            this.header = document.createElement("li");
            this.content = document.createElement("ul");
            this.appendChild(this.header);
            this.appendChild(this.content);
        }
        collapse(element) {
            element.content.classList.toggle("folded");
        }
    }
    class CollapsableNodeList extends CollapsableList {
        constructor(_node, _name, _unfolded = false) {
            super();
            this.selectNode = (_event) => {
                let event = new CustomEvent("select" /* SELECT */, { bubbles: true, detail: this.node });
                this.dispatchEvent(event);
            };
            this.collapseEvent = (_event) => {
                let event = new CustomEvent("collapse" /* COLLAPSE */, { bubbles: true, detail: this });
                this.dispatchEvent(event);
            };
            this.node = _node;
            let buttonState;
            if (this.node.getChildren().length != 0)
                buttonState = "FoldButton";
            else
                buttonState = "invisible";
            let btnToggle = new FudgeUserInterface.ToggleButton(buttonState);
            btnToggle.setToggleState(_unfolded);
            btnToggle.addEventListener("click", this.collapseEvent);
            this.header.appendChild(btnToggle);
            let lblName = document.createElement("span");
            lblName.textContent = _name;
            lblName.addEventListener("click", this.selectNode);
            this.header.appendChild(lblName);
        }
    }
    FudgeUserInterface.CollapsableNodeList = CollapsableNodeList;
    class CollapsableAnimationList extends CollapsableList {
        constructor(_mutator, _name, _unfolded = false) {
            super();
            this.collapseEvent = (_event) => {
                let event = new CustomEvent("collapse" /* COLLAPSE */, { bubbles: true, detail: this });
                this.dispatchEvent(event);
            };
            this.updateMutator = (_event) => {
                let target = _event.target;
                this.mutator[target.id] = parseFloat(target.value);
                _event.cancelBubble = true;
                let event = new CustomEvent("update" /* UPDATE */, { bubbles: true, detail: this.mutator });
                this.dispatchEvent(event);
            };
            this.mutator = _mutator;
            this.name = _name;
            this.index = {};
            let btnToggle = new FudgeUserInterface.ToggleButton("FoldButton");
            btnToggle.setToggleState(_unfolded);
            btnToggle.addEventListener("click", this.collapseEvent);
            this.header.appendChild(btnToggle);
            let lblName = document.createElement("span");
            lblName.textContent = _name;
            this.header.appendChild(lblName);
            this.buildContent(_mutator);
            this.content.addEventListener("input", this.updateMutator);
        }
        buildContent(_mutator) {
            for (let key in _mutator) {
                if (typeof _mutator[key] == "object") {
                    let newList = new CollapsableAnimationList(_mutator[key], key);
                    this.content.append(newList);
                    this.index[key] = newList.getElementIndex();
                }
                else {
                    let listEntry = document.createElement("li");
                    FudgeUserInterface.Generator.createLabelElement(key, listEntry);
                    let inputEntry = FudgeUserInterface.Generator.createStepperElement(key, listEntry, { _value: _mutator[key] });
                    this.content.append(listEntry);
                    this.index[key] = inputEntry;
                }
            }
        }
        getMutator() {
            return this.mutator;
        }
        setMutator(_mutator) {
            this.collapse(this.content);
            this.mutator = _mutator;
            this.buildContent(_mutator);
        }
        getElementIndex() {
            return this.index;
        }
    }
    FudgeUserInterface.CollapsableAnimationList = CollapsableAnimationList;
    customElements.define("ui-node-list", CollapsableNodeList, { extends: "ul" });
    customElements.define("ui-animation-list", CollapsableAnimationList, { extends: "ul" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
var FudgeUserInterface;
(function (FudgeUserInterface) {
    class MenuButton extends HTMLDivElement {
        constructor(_name, textcontent, parentSignature) {
            super();
            this.resolveClick = (_event) => {
                let event = new CustomEvent("dropMenuClick" /* DROPMENUCLICK */, { detail: this.signature, bubbles: true });
                this.dispatchEvent(event);
            };
            this.name = _name;
            this.signature = parentSignature + "." + _name;
            let button = document.createElement("button");
            button.textContent = textcontent;
            this.append(button);
            button.addEventListener("click", this.resolveClick);
        }
    }
    class MenuContent extends HTMLDivElement {
        constructor(_submenu) {
            super();
            if (_submenu) {
                this.classList.add("submenu-content");
            }
            else {
                this.classList.add("dropdown-content");
            }
        }
    }
    class DropMenu extends HTMLDivElement {
        constructor(_name, _contentList, params) {
            super();
            this.toggleFoldContent = (_event) => {
                this.content.classList.toggle("folded");
            };
            this.collapseMenu = (_event) => {
                if (!(this.contains(_event.target))) {
                    if (!this.content.classList.contains("folded")) {
                        this.toggleFoldContent(_event);
                    }
                }
            };
            let button = document.createElement("button");
            button.name = _name;
            if (params._text) {
                button.textContent = params._text;
            }
            else {
                button.textContent = _name;
            }
            button.addEventListener("click", this.toggleFoldContent);
            window.addEventListener("click", this.collapseMenu);
            let isSubmenu = (params._parentSignature != null);
            if (params._parentSignature) {
                this.signature = params._parentSignature + "." + _name;
            }
            else {
                this.signature = _name;
            }
            this.append(button);
            this.content = new MenuContent(isSubmenu);
            if (params._parentSignature) {
                this.classList.add("submenu");
            }
            else {
                this.classList.add("dropdown");
            }
            this.content.classList.toggle("folded");
            this.name = _name;
            for (let key in _contentList) {
                if (typeof _contentList[key] == "object") {
                    let subMenu = new DropMenu(key, _contentList[key], { _parentSignature: this.signature });
                    this.content.append(subMenu);
                }
                else if (typeof _contentList[key] == "string") {
                    let contentEntry = new MenuButton(key, _contentList[key], this.signature);
                    this.content.append(contentEntry);
                }
            }
            this.append(this.content);
        }
    }
    FudgeUserInterface.DropMenu = DropMenu;
    customElements.define("ui-dropdown", DropMenu, { extends: "div" });
    customElements.define("ui-dropdown-button", MenuButton, { extends: "div" });
    customElements.define("ui-dropdown-content", MenuContent, { extends: "div" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
var FudgeUserInterface;
(function (FudgeUserInterface) {
    class MultiLevelMenuManager {
        static buildFromSignature(_signature, _mutator) {
            let mutator = _mutator || {};
            let signatureLevels = _signature.split(".");
            if (signatureLevels.length > 1) {
                let subSignature = signatureLevels[1];
                for (let i = 2; i < signatureLevels.length; i++) {
                    subSignature = subSignature + "." + signatureLevels[i];
                }
                if (mutator[signatureLevels[0]] != null) {
                    mutator[signatureLevels[0]] = this.buildFromSignature(subSignature, mutator[signatureLevels[0]]);
                }
                else {
                    mutator[signatureLevels[0]] = this.buildFromSignature(subSignature);
                }
            }
            else {
                mutator[signatureLevels[0]] = signatureLevels[0];
            }
            return mutator;
        }
    }
    FudgeUserInterface.MultiLevelMenuManager = MultiLevelMenuManager;
})(FudgeUserInterface || (FudgeUserInterface = {}));
var FudgeUserInterface;
(function (FudgeUserInterface) {
    // import ƒ = FudgeCore;
    class Stepper extends HTMLInputElement {
        constructor(_label, params = {}) {
            super();
            this.name = _label;
            this.type = "number";
            this.value = params.value.toString();
            this.id = _label;
            this.step = String(params.step) || "1";
        }
    }
    FudgeUserInterface.Stepper = Stepper;
    customElements.define("ui-stepper", Stepper, { extends: "input" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
var FudgeUserInterface;
(function (FudgeUserInterface) {
    // import ƒ = FudgeCore;
    class ToggleButton extends HTMLButtonElement {
        constructor(style) {
            super();
            this.switchToggleState = (_event) => {
                this.setToggleState(!this.toggleState);
            };
            this.type = "button";
            this.toggleState = true;
            this.classList.add(style);
            this.classList.add("ToggleOn");
            this.addEventListener("click", this.switchToggleState);
        }
        setToggleState(toggleState) {
            this.toggleState = toggleState;
            if (this.toggleState == true) {
                this.classList.add("ToggleOn");
                this.classList.remove("ToggleOff");
            }
            else {
                this.classList.remove("ToggleOn");
                this.classList.add("ToggleOff");
            }
        }
        getToggleState() {
            return this.toggleState;
        }
        toggle() {
            this.setToggleState(!this.toggleState);
        }
    }
    FudgeUserInterface.ToggleButton = ToggleButton;
    customElements.define("ui-toggle-button", ToggleButton, { extends: "button" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
///<reference path="../../../../Core/Build/FudgeCore.d.ts"/>
var FudgeUserInterface;
///<reference path="../../../../Core/Build/FudgeCore.d.ts"/>
(function (FudgeUserInterface) {
    /**
    * Extension of ul-element that builds a tree structure with interactive controls from an array of type [[TreeItem]]
    *
    * ```plaintext
    * treeList <ul>
    * ├ treeItem <li>
    * ├ treeItem <li>
    * │ └ treeList <ul>
    * │   ├ treeItem <li>
    * │   └ treeItem <li>
    * └ treeItem <li>
    * ```
    */
    class TreeList extends HTMLUListElement {
        constructor(_items = []) {
            super();
            this.addItems(_items);
        }
        /**
         * Opens the tree along the given path to show the objects the path includes
         * @param _path An array of objects starting with one being contained in this treelist and following the correct hierarchy of successors
         * @param _focus If true (default) the last object found in the tree gets the focus
         */
        show(_path, _focus = true) {
            let currentTree = this;
            for (let data of _path) {
                let item = currentTree.findItem(data);
                item.focus();
                let content = item.getBranch();
                if (!content) {
                    item.open(true);
                    content = item.getBranch();
                }
                currentTree = content;
            }
        }
        /**
         * Restructures the list to sync with the given list.
         * [[TreeItem]]s referencing the same object remain in the list, new items get added in the order of appearance, obsolete ones are deleted.
         * @param _tree A list to sync this with
         */
        restructure(_tree) {
            let items = [];
            for (let item of _tree.getItems()) {
                let found = this.findItem(item.data);
                if (found) {
                    found.setLabel(item.display);
                    found.hasChildren = item.hasChildren;
                    if (!found.hasChildren)
                        found.open(false);
                    items.push(found);
                }
                else
                    items.push(item);
            }
            this.innerHTML = "";
            this.addItems(items);
        }
        /**
         * Returns the [[TreeItem]] of this list referencing the given object or null, if not found
         */
        findItem(_data) {
            for (let item of this.children)
                if (item.data == _data)
                    return item;
            return null;
        }
        /**
         * Adds the given [[TreeItem]]s at the end of this list
         */
        addItems(_items) {
            for (let item of _items) {
                this.appendChild(item);
            }
        }
        /**
         * Returns the content of this list as array of [[TreeItem]]s
         */
        getItems() {
            return this.children;
        }
        displaySelection(_data) {
            let items = this.querySelectorAll("li");
            for (let item of items)
                item.selected = (_data != null && _data.indexOf(item.data) > -1);
        }
        selectInterval(_dataStart, _dataEnd) {
            let items = this.querySelectorAll("li");
            let selecting = false;
            let end = null;
            for (let item of items) {
                if (!selecting) {
                    selecting = true;
                    if (item.data == _dataStart)
                        end = _dataEnd;
                    else if (item.data == _dataEnd)
                        end = _dataStart;
                    else
                        selecting = false;
                }
                if (selecting) {
                    item.select(true, false);
                    if (item.data == end)
                        break;
                }
            }
        }
        delete(_data) {
            let items = this.querySelectorAll("li");
            let deleted = [];
            for (let item of items)
                if (_data.indexOf(item.data) > -1)
                    deleted.push(item.parentNode.removeChild(item));
            return deleted;
        }
        findOpen(_data) {
            let items = this.querySelectorAll("li");
            for (let item of items)
                if (_data == item.data)
                    return item;
            return null;
        }
    }
    FudgeUserInterface.TreeList = TreeList;
    customElements.define("ul-tree-list", TreeList, { extends: "ul" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
///<reference path="TreeList.ts"/>
var FudgeUserInterface;
///<reference path="TreeList.ts"/>
(function (FudgeUserInterface) {
    let TREE_CLASS;
    (function (TREE_CLASS) {
        TREE_CLASS["SELECTED"] = "selected";
        TREE_CLASS["INACTIVE"] = "inactive";
    })(TREE_CLASS = FudgeUserInterface.TREE_CLASS || (FudgeUserInterface.TREE_CLASS = {}));
    let EVENT_TREE;
    (function (EVENT_TREE) {
        EVENT_TREE["RENAME"] = "rename";
        EVENT_TREE["OPEN"] = "open";
        EVENT_TREE["FOCUS_NEXT"] = "focusNext";
        EVENT_TREE["FOCUS_PREVIOUS"] = "focusPrevious";
        EVENT_TREE["FOCUS_IN"] = "focusin";
        EVENT_TREE["FOCUS_OUT"] = "focusout";
        EVENT_TREE["DELETE"] = "delete";
        EVENT_TREE["CHANGE"] = "change";
        EVENT_TREE["DOUBLE_CLICK"] = "dblclick";
        EVENT_TREE["KEY_DOWN"] = "keydown";
        EVENT_TREE["DRAG_START"] = "dragstart";
        EVENT_TREE["DRAG_OVER"] = "dragover";
        EVENT_TREE["DROP"] = "drop";
        EVENT_TREE["POINTER_UP"] = "pointerup";
        EVENT_TREE["SELECT"] = "itemselect";
    })(EVENT_TREE = FudgeUserInterface.EVENT_TREE || (FudgeUserInterface.EVENT_TREE = {}));
    /**
     * Extension of [[TreeItem]] that represents the root of a tree control
     */
    class Tree extends FudgeUserInterface.TreeList {
        constructor(_broker, _root) {
            super([]);
            this.broker = _broker;
            let root = new FudgeUserInterface.TreeItem(this.broker, _root);
            this.appendChild(root);
            this.addEventListener(EVENT_TREE.OPEN, this.hndOpen);
            this.addEventListener(EVENT_TREE.RENAME, this.hndRename);
            this.addEventListener(EVENT_TREE.SELECT, this.hndSelect);
            this.addEventListener(EVENT_TREE.DROP, this.hndDrop);
        }
        /**
         * Clear the current selection
         */
        clearSelection() {
            this.broker.selection.splice(0);
            this.displaySelection(this.broker.selection);
        }
        hndOpen(_event) {
            let item = _event.target;
            let children = this.broker.getChildren(item.data);
            if (!children)
                return;
            let branch = this.createBranch(children);
            item.setBranch(branch);
            this.displaySelection(this.broker.selection);
        }
        createBranch(_data) {
            let branch = new FudgeUserInterface.TreeList([]);
            for (let child of _data) {
                branch.addItems([new FudgeUserInterface.TreeItem(this.broker, child)]);
            }
            return branch;
        }
        hndRename(_event) {
            let item = _event.target.parentNode;
            let renamed = this.broker.rename(item.data, item.getLabel());
            if (renamed)
                item.setLabel(this.broker.getLabel(item.data));
        }
        // Callback / Eventhandler in Tree
        hndSelect(_event) {
            _event.stopPropagation();
            let detail = _event.detail;
            let index = this.broker.selection.indexOf(detail.data);
            if (detail.interval) {
                let dataStart = this.broker.selection[0];
                let dataEnd = detail.data;
                this.clearSelection();
                this.selectInterval(dataStart, dataEnd);
                return;
            }
            if (index >= 0 && detail.additive)
                this.broker.selection.splice(index, 1);
            else {
                if (!detail.additive)
                    this.clearSelection();
                this.broker.selection.push(detail.data);
            }
            this.displaySelection(this.broker.selection);
        }
        hndDrop(_event) {
            _event.stopPropagation();
            // if drop target included in drag source -> no drag&drop possible
            if (this.broker.dragDrop.source.indexOf(this.broker.dragDrop.target) > -1)
                return;
            // if the drop method of the broker returns falls -> no drag&drop possible
            if (!this.broker.drop(this.broker.dragDrop.source, this.broker.dragDrop.target))
                return;
            this.delete(this.broker.dragDrop.source);
            let targetData = this.broker.dragDrop.target;
            let targetItem = this.findOpen(targetData);
            let branch = this.createBranch(this.broker.getChildren(targetData));
            let old = targetItem.getBranch();
            targetItem.hasChildren = true;
            if (old)
                old.restructure(branch);
            else
                targetItem.open(true);
            this.broker.dragDrop.source = [];
            this.broker.dragDrop.target = null;
        }
    }
    FudgeUserInterface.Tree = Tree;
    customElements.define("ul-tree", Tree, { extends: "ul" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
var FudgeUserInterface;
(function (FudgeUserInterface) {
    /**
     * Subclass this to create a broker between your data and a [[Tree]] to display and manipulate it.
     * The [[Tree]] doesn't know how your data is structured and how to handle it, the broker implements the methods needed
     * // TODO: check if this could be achieved more elegantly using decorators
     */
    class TreeBroker {
        constructor() {
            this.selection = [];
            this.dragDrop = { source: [], target: null };
        }
    }
    FudgeUserInterface.TreeBroker = TreeBroker;
})(FudgeUserInterface || (FudgeUserInterface = {}));
///<reference path="../../../../Core/Build/FudgeCore.d.ts"/>
var FudgeUserInterface;
///<reference path="../../../../Core/Build/FudgeCore.d.ts"/>
(function (FudgeUserInterface) {
    var ƒ = FudgeCore;
    /**
     * Extension of li-element that represents an object in a [[TreeList]] with a checkbox and a textinput as content.
     * Additionally, may hold an instance of [[TreeList]] as branch to display children of the corresponding object.
     */
    class TreeItem extends HTMLLIElement {
        constructor(_broker, _data) {
            super();
            this.display = "TreeItem";
            this.classes = [];
            this.data = null;
            this.hndFocus = (_event) => {
                let listening = _event.currentTarget;
                switch (_event.type) {
                    case FudgeUserInterface.EVENT_TREE.FOCUS_NEXT:
                        let next = listening.nextElementSibling;
                        if (!next)
                            return;
                        next.focus();
                        _event.stopPropagation();
                        break;
                    case FudgeUserInterface.EVENT_TREE.FOCUS_PREVIOUS:
                        if (listening == _event.target)
                            return;
                        let items = listening.querySelectorAll("li");
                        let prev = listening;
                        for (let item of items) {
                            if (item == _event.target)
                                break;
                            prev = item;
                        }
                        prev.focus();
                        _event.stopPropagation();
                        break;
                    case FudgeUserInterface.EVENT_TREE.FOCUS_OUT:
                        if (_event.target == this.label)
                            this.label.disabled = true;
                        break;
                    default:
                        break;
                }
            };
            this.hndKey = (_event) => {
                _event.stopPropagation();
                let content = this.querySelector("ul");
                switch (_event.code) {
                    case ƒ.KEYBOARD_CODE.ARROW_RIGHT:
                        if (content)
                            content.firstChild.focus();
                        else
                            this.open(true);
                        if (_event.shiftKey)
                            document.activeElement.select(true);
                        break;
                    case ƒ.KEYBOARD_CODE.ARROW_LEFT:
                        if (content)
                            this.open(false);
                        else
                            this.parentElement.focus();
                        if (_event.shiftKey)
                            document.activeElement.select(true);
                        break;
                    case ƒ.KEYBOARD_CODE.ARROW_DOWN:
                        if (content)
                            content.firstChild.focus();
                        else
                            this.dispatchEvent(new Event(FudgeUserInterface.EVENT_TREE.FOCUS_NEXT, { bubbles: true }));
                        if (_event.shiftKey)
                            document.activeElement.select(true);
                        break;
                    case ƒ.KEYBOARD_CODE.ARROW_UP:
                        this.dispatchEvent(new Event(FudgeUserInterface.EVENT_TREE.FOCUS_PREVIOUS, { bubbles: true }));
                        if (_event.shiftKey)
                            document.activeElement.select(true);
                        break;
                    case ƒ.KEYBOARD_CODE.F2:
                        this.startTypingLabel();
                        break;
                    case ƒ.KEYBOARD_CODE.SPACE:
                        this.select(_event.ctrlKey, _event.shiftKey);
                        break;
                }
            };
            this.hndDblClick = (_event) => {
                _event.stopPropagation();
                if (_event.target != this.checkbox)
                    this.startTypingLabel();
            };
            this.hndChange = (_event) => {
                console.log(_event);
                let target = _event.target;
                let item = target.parentElement;
                _event.stopPropagation();
                switch (target.type) {
                    case "checkbox":
                        this.open(target.checked);
                        break;
                    case "text":
                        target.disabled = true;
                        item.focus();
                        target.dispatchEvent(new Event(FudgeUserInterface.EVENT_TREE.RENAME, { bubbles: true }));
                        break;
                    case "default":
                        console.log(target);
                        break;
                }
            };
            this.hndDragStart = (_event) => {
                _event.stopPropagation();
                this.broker.dragDrop.source = [];
                if (this.selected)
                    this.broker.dragDrop.source = this.broker.selection;
                else
                    this.broker.dragDrop.source = [this.data];
                _event.dataTransfer.effectAllowed = "all";
            };
            this.hndDragOver = (_event) => {
                _event.stopPropagation();
                _event.preventDefault();
                this.broker.dragDrop.target = this.data;
                _event.dataTransfer.dropEffect = "move";
            };
            this.hndPointerUp = (_event) => {
                _event.stopPropagation();
                if (_event.target == this.checkbox)
                    return;
                this.select(_event.ctrlKey, _event.shiftKey);
            };
            this.broker = _broker;
            this.data = _data;
            this.display = this.broker.getLabel(_data);
            // TODO: handle cssClasses
            this.create();
            this.hasChildren = this.broker.hasChildren(_data);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.CHANGE, this.hndChange);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.DOUBLE_CLICK, this.hndDblClick);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.FOCUS_OUT, this.hndFocus);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.KEY_DOWN, this.hndKey);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.FOCUS_NEXT, this.hndFocus);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.FOCUS_PREVIOUS, this.hndFocus);
            this.draggable = true;
            this.addEventListener(FudgeUserInterface.EVENT_TREE.DRAG_START, this.hndDragStart);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.DRAG_OVER, this.hndDragOver);
            this.addEventListener(FudgeUserInterface.EVENT_TREE.POINTER_UP, this.hndPointerUp);
        }
        /**
         * Returns true, when this item has a visible checkbox in front to open the subsequent branch
         */
        get hasChildren() {
            return this.checkbox.style.visibility != "hidden";
        }
        /**
         * Shows or hides the checkbox for opening the subsequent branch
         */
        set hasChildren(_has) {
            this.checkbox.style.visibility = _has ? "visible" : "hidden";
        }
        /**
         * Set the label text to show
         */
        setLabel(_text) {
            this.label.value = _text;
        }
        /**
         * Get the label text shown
         */
        getLabel() {
            return this.label.value;
        }
        /**
         * Tries to open the [[TreeList]] of children, by dispatching [[EVENT_TREE.OPEN]].
         * The user of the tree needs to add an event listener to the tree
         * in order to create that [[TreeList]] and add it as branch to this item
         * @param _open If false, the item will be closed
         */
        open(_open) {
            this.removeBranch();
            if (_open)
                this.dispatchEvent(new Event(FudgeUserInterface.EVENT_TREE.OPEN, { bubbles: true }));
            this.querySelector("input[type='checkbox']").checked = _open;
        }
        /**
         * Returns a list of all data referenced by the items succeeding this
         */
        getOpenData() {
            let list = this.querySelectorAll("li");
            let data = [];
            for (let item of list)
                data.push(item.data);
            return data;
        }
        /**
         * Sets the branch of children of this item. The branch must be a previously compiled [[TreeList]]
         */
        setBranch(_branch) {
            this.removeBranch();
            if (_branch)
                this.appendChild(_branch);
        }
        /**
         * Returns the branch of children of this item.
         */
        getBranch() {
            return this.querySelector("ul");
        }
        /**
         * Returns attaches or detaches the [[TREE_CLASS.SELECTED]] to this item
         */
        set selected(_on) {
            if (_on)
                this.classList.add(FudgeUserInterface.TREE_CLASS.SELECTED);
            else
                this.classList.remove(FudgeUserInterface.TREE_CLASS.SELECTED);
        }
        /**
         * Returns true if the [[TREE_CLASSES.SELECTED]] is attached to this item
         */
        get selected() {
            return this.classList.contains(FudgeUserInterface.TREE_CLASS.SELECTED);
        }
        /**
         * Dispatches the [[EVENT_TREE.SELECT]] event
         * @param _additive For multiple selection (+Ctrl)
         * @param _interval For selection over interval (+Shift)
         */
        select(_additive, _interval = false) {
            let event = new CustomEvent(FudgeUserInterface.EVENT_TREE.SELECT, { bubbles: true, detail: { data: this.data, additive: _additive, interval: _interval } });
            this.dispatchEvent(event);
        }
        /**
         * Removes the branch of children from this item
         */
        removeBranch() {
            let content = this.getBranch();
            if (!content)
                return;
            this.removeChild(content);
        }
        create() {
            this.checkbox = document.createElement("input");
            this.checkbox.type = "checkbox";
            this.appendChild(this.checkbox);
            this.label = document.createElement("input");
            this.label.type = "text";
            this.label.disabled = true;
            this.label.value = this.display;
            this.appendChild(this.label);
            this.tabIndex = 0;
        }
        startTypingLabel() {
            this.label.disabled = false;
            this.label.focus();
        }
    }
    FudgeUserInterface.TreeItem = TreeItem;
    customElements.define("li-tree-item", TreeItem, { extends: "li" });
})(FudgeUserInterface || (FudgeUserInterface = {}));
/// <reference path="../../../Core/Build/FudgeCore.d.ts"/>
var FudgeUserInterface;
/// <reference path="../../../Core/Build/FudgeCore.d.ts"/>
(function (FudgeUserInterface) {
    var ƒ = FudgeCore;
    class Generator {
        static createFromMutable(_mutable, _element, _name, _mutator) {
            let name = _name || _mutable.constructor.name;
            let mutator = _mutator || _mutable.getMutator();
            let mutatorTypes = _mutable.getMutatorAttributeTypes(mutator);
            let parent = Generator.createFoldableFieldset(name, _element);
            Generator.createFromMutator(mutator, mutatorTypes, parent, _mutable);
        }
        static createFromMutator(_mutator, _mutatorTypes, _parent, _mutable) {
            try {
                for (let key in _mutatorTypes) {
                    let type = _mutatorTypes[key];
                    let value = _mutator[key].toString();
                    if (type instanceof Object) {
                        //Type is Enum
                        Generator.createLabelElement(key, _parent);
                        Generator.createDropdown(key, type, value, _parent);
                    }
                    else {
                        switch (type) {
                            case "Number":
                                Generator.createLabelElement(key, _parent, { _value: key });
                                // Generator.createTextElement(key, _parent, { _value: value })
                                let numValue = parseInt(value);
                                Generator.createStepperElement(key, _parent, { _value: numValue });
                                break;
                            case "Boolean":
                                Generator.createLabelElement(key, _parent, { _value: key });
                                let enabled = value == "true" ? true : false;
                                Generator.createCheckboxElement(key, enabled, _parent);
                                break;
                            case "String":
                                Generator.createLabelElement(key, _parent, { _value: key });
                                Generator.createTextElement(key, _parent, { _value: value });
                                break;
                            // Some other complex subclass of Mutable
                            default:
                                let subMutable;
                                subMutable = _mutable[key];
                                Generator.createFromMutable(subMutable, _parent, key, _mutator[key]);
                                break;
                        }
                    }
                }
            }
            catch (_error) {
                ƒ.Debug.fudge(_error);
            }
        }
        static createDropdown(_id, _content, _value, _parent, _cssClass) {
            let dropdown = document.createElement("select");
            dropdown.id = _id;
            dropdown.name = _id;
            for (let value in _content) {
                let entry = document.createElement("option");
                entry.text = value;
                entry.value = value;
                if (value.toUpperCase() == _value.toUpperCase()) {
                    entry.selected = true;
                }
                dropdown.add(entry);
            }
            _parent.appendChild(dropdown);
            return dropdown;
        }
        static createFieldset(_legend, _parent, _cssClass) {
            let cntfieldset = document.createElement("fieldset");
            cntfieldset.id = _legend;
            let legend = document.createElement("legend");
            legend.innerHTML = _legend;
            cntfieldset.appendChild(legend);
            _parent.appendChild(cntfieldset);
            return cntfieldset;
        }
        static createFoldableFieldset(_legend, _parent) {
            let cntFoldFieldset = new FudgeUserInterface.FoldableFieldSet(_legend);
            cntFoldFieldset.id = _legend;
            _parent.appendChild(cntFoldFieldset);
            return cntFoldFieldset;
        }
        static createLabelElement(_id, _parent, params = {}) {
            let label = document.createElement("label");
            if (params._value == undefined)
                params._value = _id;
            label.innerText = params._value;
            if (!params._cssClass == undefined)
                label.classList.add(params._cssClass);
            label.id = "_" + _id;
            _parent.appendChild(label);
            return label;
        }
        static createTextElement(_id, _parent, params = {}) {
            let valueInput = document.createElement("input");
            if (params._value == undefined)
                params._value = "";
            if (!params._cssClass == undefined)
                valueInput.classList.add(params._cssClass);
            valueInput.id = _id;
            valueInput.name = _id;
            valueInput.value = params._value;
            _parent.appendChild(valueInput);
            return valueInput;
        }
        static createCheckboxElement(_id, _value, _parent, _cssClass) {
            let valueInput = document.createElement("input");
            valueInput.type = "checkbox";
            valueInput.checked = _value;
            valueInput.classList.add(_cssClass);
            valueInput.name = _id;
            valueInput.id = _id;
            _parent.appendChild(valueInput);
            return valueInput;
        }
        static createStepperElement(_id, _parent, params = {}) {
            if (params._value == undefined)
                params._value = 0;
            let stepper = new FudgeUserInterface.Stepper(_id, { value: params._value });
            _parent.appendChild(stepper);
            return stepper;
        }
    }
    FudgeUserInterface.Generator = Generator;
})(FudgeUserInterface || (FudgeUserInterface = {}));
// / <reference types="../../../Core/Build/FudgeCore"/>
var FudgeUserInterface;
// / <reference types="../../../Core/Build/FudgeCore"/>
(function (FudgeUserInterface) {
    class Mutable {
        constructor(mutable) {
            this.timeUpdate = 190;
            this.mutateOnInput = (_e) => {
                this.mutator = this.updateMutator(this.mutable, this.root);
                this.mutable.mutate(this.mutator);
            };
            this.refresh = (_e) => {
                this.mutable.updateMutator(this.mutator);
                this.update(this.mutable, this.root);
            };
            this.root = document.createElement("div");
            this.mutable = mutable;
            this.mutator = mutable.getMutator();
            window.setInterval(this.refresh, this.timeUpdate);
            this.root.addEventListener("input", this.mutateOnInput);
        }
        updateMutator(_mutable, _root, _mutator, _types) {
            let mutator = _mutator || _mutable.getMutator();
            let mutatorTypes = _types || _mutable.getMutatorAttributeTypes(mutator);
            for (let key in mutator) {
                if (this.root.querySelector("#" + key) != null) {
                    let type = mutatorTypes[key];
                    if (type instanceof Object) {
                        let selectElement = _root.querySelector("#" + key);
                        selectElement.value = mutator[key];
                    }
                    else {
                        let element = _root.querySelector("#" + key);
                        let input = element;
                        switch (type) {
                            case "Boolean":
                                mutator[key] = input.checked;
                                break;
                            case "String":
                            case "Number":
                                mutator[key] = input.value;
                                break;
                            default:
                                let subMutator = mutator[key];
                                let subMutable;
                                subMutable = _mutable[key];
                                let subTypes = subMutable.getMutatorAttributeTypes(subMutator);
                                mutator[key] = this.updateMutator(subMutable, element, subMutator, subTypes);
                                break;
                        }
                    }
                }
            }
            return mutator;
        }
        update(_mutable, _root) {
            let mutator = _mutable.getMutator();
            let mutatorTypes = _mutable.getMutatorAttributeTypes(mutator);
            for (let key in mutator) {
                if (this.root.querySelector("#" + key) != null) {
                    let type = mutatorTypes[key];
                    if (type instanceof Object) {
                        let selectElement = _root.querySelector("#" + key);
                        selectElement.value = mutator[key];
                    }
                    else {
                        switch (type) {
                            case "Boolean":
                                let checkbox = _root.querySelector("#" + key);
                                checkbox.checked = mutator[key];
                                break;
                            case "String":
                                let textfield = _root.querySelector("#" + key);
                                textfield.value = mutator[key];
                                break;
                            case "Number":
                                let stepper = _root.querySelector("#" + key);
                                if (document.activeElement != stepper) {
                                    stepper.value = mutator[key];
                                }
                                break;
                            default:
                                let fieldset = _root.querySelector("#" + key);
                                // tslint:disable no-any
                                let subMutable = _mutable[key];
                                this.update(subMutable, fieldset);
                                break;
                        }
                    }
                }
            }
        }
    }
    FudgeUserInterface.Mutable = Mutable;
})(FudgeUserInterface || (FudgeUserInterface = {}));
//# sourceMappingURL=FudgeUI.js.map