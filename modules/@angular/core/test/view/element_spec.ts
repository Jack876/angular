/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Injector, RenderComponentType, RootRenderer, Sanitizer, SecurityContext, ViewEncapsulation, WrappedValue, getDebugNode} from '@angular/core';
import {getDebugContext} from '@angular/core/src/errors';
import {ArgumentType, BindingType, DebugContext, NodeDef, NodeFlags, RootData, Services, ViewData, ViewDefinition, ViewFlags, ViewHandleEventFn, ViewUpdateFn, anchorDef, asElementData, elementDef, rootRenderNodes, textDef, viewDef} from '@angular/core/src/view/index';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {ARG_TYPE_VALUES, checkNodeInlineOrDynamic, createRootView, isBrowser, removeNodes} from './helper';

export function main() {
  describe(`View Elements`, () => {
    function compViewDef(
        nodes: NodeDef[], updateDirectives?: ViewUpdateFn, updateRenderer?: ViewUpdateFn,
        handleEvent?: ViewHandleEventFn, viewFlags: ViewFlags = ViewFlags.None): ViewDefinition {
      return viewDef(viewFlags, nodes, updateDirectives, updateRenderer, handleEvent);
    }

    function createAndGetRootNodes(
        viewDef: ViewDefinition, context?: any): {rootNodes: any[], view: ViewData} {
      const view = createRootView(viewDef, context);
      const rootNodes = rootRenderNodes(view);
      return {rootNodes, view};
    }

    describe('create', () => {
      it('should create elements without parents', () => {
        const rootNodes = createAndGetRootNodes(compViewDef([
                            elementDef(NodeFlags.None, null, null, 0, 'span')
                          ])).rootNodes;
        expect(rootNodes.length).toBe(1);
        expect(getDOM().nodeName(rootNodes[0]).toLowerCase()).toBe('span');
      });

      it('should create views with multiple root elements', () => {
        const rootNodes = createAndGetRootNodes(compViewDef([
                            elementDef(NodeFlags.None, null, null, 0, 'span'),
                            elementDef(NodeFlags.None, null, null, 0, 'span')
                          ])).rootNodes;
        expect(rootNodes.length).toBe(2);
      });

      it('should create elements with parents', () => {
        const rootNodes = createAndGetRootNodes(compViewDef([
                            elementDef(NodeFlags.None, null, null, 1, 'div'),
                            elementDef(NodeFlags.None, null, null, 0, 'span'),
                          ])).rootNodes;
        expect(rootNodes.length).toBe(1);
        const spanEl = getDOM().childNodes(rootNodes[0])[0];
        expect(getDOM().nodeName(spanEl).toLowerCase()).toBe('span');
      });

      it('should set fixed attributes', () => {
        const rootNodes = createAndGetRootNodes(compViewDef([
                            elementDef(NodeFlags.None, null, null, 0, 'div', [['title', 'a']]),
                          ])).rootNodes;
        expect(rootNodes.length).toBe(1);
        expect(getDOM().getAttribute(rootNodes[0], 'title')).toBe('a');
      });

      it('should add debug information to the renderer', () => {
        const someContext = new Object();
        const {view, rootNodes} = createAndGetRootNodes(
            compViewDef([elementDef(NodeFlags.None, null, null, 0, 'div')]), someContext);
        expect(getDebugNode(rootNodes[0]).nativeNode).toBe(asElementData(view, 0).renderElement);
      });
    });

    describe('change properties', () => {
      ARG_TYPE_VALUES.forEach((inlineDynamic) => {
        it(`should update ${ArgumentType[inlineDynamic]}`, () => {

          const {view, rootNodes} = createAndGetRootNodes(compViewDef(
              [
                elementDef(
                    NodeFlags.None, null, null, 0, 'input', null,
                    [
                      [BindingType.ElementProperty, 'title', SecurityContext.NONE],
                      [BindingType.ElementProperty, 'value', SecurityContext.NONE]
                    ]),
              ],
              null, (check, view) => {
                checkNodeInlineOrDynamic(check, view, 0, inlineDynamic, ['v1', 'v2']);
              }));

          Services.checkAndUpdateView(view);

          const el = rootNodes[0];
          expect(getDOM().getProperty(el, 'title')).toBe('v1');
          expect(getDOM().getProperty(el, 'value')).toBe('v2');

          expect(getDOM().getAttribute(el, 'ng-reflect-title')).toBe('v1');
        });
      });
    });

    describe('change attributes', () => {
      ARG_TYPE_VALUES.forEach((inlineDynamic) => {
        it(`should update ${ArgumentType[inlineDynamic]}`, () => {
          const {view, rootNodes} = createAndGetRootNodes(compViewDef(
              [
                elementDef(
                    NodeFlags.None, null, null, 0, 'div', null,
                    [
                      [BindingType.ElementAttribute, 'a1', SecurityContext.NONE],
                      [BindingType.ElementAttribute, 'a2', SecurityContext.NONE]
                    ]),
              ],
              null, (check, view) => {
                checkNodeInlineOrDynamic(check, view, 0, inlineDynamic, ['v1', 'v2']);
              }));

          Services.checkAndUpdateView(view);

          const el = rootNodes[0];
          expect(getDOM().getAttribute(el, 'a1')).toBe('v1');
          expect(getDOM().getAttribute(el, 'a2')).toBe('v2');
        });
      });
    });

    describe('change classes', () => {
      ARG_TYPE_VALUES.forEach((inlineDynamic) => {
        it(`should update ${ArgumentType[inlineDynamic]}`, () => {
          const {view, rootNodes} = createAndGetRootNodes(compViewDef(
              [
                elementDef(
                    NodeFlags.None, null, null, 0, 'div', null,
                    [[BindingType.ElementClass, 'c1'], [BindingType.ElementClass, 'c2']]),
              ],
              (check, view) => {
                checkNodeInlineOrDynamic(check, view, 0, inlineDynamic, [true, true]);
              }));

          Services.checkAndUpdateView(view);

          const el = rootNodes[0];
          expect(getDOM().hasClass(el, 'c1')).toBeTruthy();
          expect(getDOM().hasClass(el, 'c2')).toBeTruthy();
        });
      });
    });

    describe('change styles', () => {
      ARG_TYPE_VALUES.forEach((inlineDynamic) => {
        it(`should update ${ArgumentType[inlineDynamic]}`, () => {
          const {view, rootNodes} = createAndGetRootNodes(compViewDef(
              [
                elementDef(
                    NodeFlags.None, null, null, 0, 'div', null,
                    [
                      [BindingType.ElementStyle, 'width', 'px'],
                      [BindingType.ElementStyle, 'color', null]
                    ]),
              ],
              null, (check, view) => {
                checkNodeInlineOrDynamic(check, view, 0, inlineDynamic, [10, 'red']);
              }));

          Services.checkAndUpdateView(view);

          const el = rootNodes[0];
          expect(getDOM().getStyle(el, 'width')).toBe('10px');
          expect(getDOM().getStyle(el, 'color')).toBe('red');
        });
      });
    });

    if (isBrowser()) {
      describe('listen to DOM events', () => {
        function createAndAttachAndGetRootNodes(viewDef: ViewDefinition):
            {rootNodes: any[], view: ViewData} {
          const result = createAndGetRootNodes(viewDef);
          // Note: We need to append the node to the document.body, otherwise `click` events
          // won't work in IE.
          result.rootNodes.forEach((node) => {
            document.body.appendChild(node);
            removeNodes.push(node);
          });
          return result;
        }

        it('should listen to DOM events', () => {
          const handleEventSpy = jasmine.createSpy('handleEvent');
          const removeListenerSpy =
              spyOn(HTMLElement.prototype, 'removeEventListener').and.callThrough();
          const {view, rootNodes} = createAndAttachAndGetRootNodes(compViewDef(
              [elementDef(NodeFlags.None, null, null, 0, 'button', null, null, ['click'])], null,
              null, handleEventSpy));

          rootNodes[0].click();

          expect(handleEventSpy).toHaveBeenCalled();
          let handleEventArgs = handleEventSpy.calls.mostRecent().args;
          expect(handleEventArgs[0]).toBe(view);
          expect(handleEventArgs[1]).toBe(0);
          expect(handleEventArgs[2]).toBe('click');
          expect(handleEventArgs[3]).toBeTruthy();

          Services.destroyView(view);

          expect(removeListenerSpy).toHaveBeenCalled();
        });

        it('should listen to window events', () => {
          const handleEventSpy = jasmine.createSpy('handleEvent');
          const addListenerSpy = spyOn(window, 'addEventListener');
          const removeListenerSpy = spyOn(window, 'removeEventListener');
          const {view, rootNodes} = createAndAttachAndGetRootNodes(compViewDef(
              [elementDef(
                  NodeFlags.None, null, null, 0, 'button', null, null,
                  [['window', 'windowClick']])],
              null, null, handleEventSpy));

          expect(addListenerSpy).toHaveBeenCalled();
          expect(addListenerSpy.calls.mostRecent().args[0]).toBe('windowClick');
          addListenerSpy.calls.mostRecent().args[1]({name: 'windowClick'});

          expect(handleEventSpy).toHaveBeenCalled();
          const handleEventArgs = handleEventSpy.calls.mostRecent().args;
          expect(handleEventArgs[0]).toBe(view);
          expect(handleEventArgs[1]).toBe(0);
          expect(handleEventArgs[2]).toBe('window:windowClick');
          expect(handleEventArgs[3]).toBeTruthy();

          Services.destroyView(view);

          expect(removeListenerSpy).toHaveBeenCalled();
        });

        it('should listen to document events', () => {
          const handleEventSpy = jasmine.createSpy('handleEvent');
          const addListenerSpy = spyOn(document, 'addEventListener');
          const removeListenerSpy = spyOn(document, 'removeEventListener');
          const {view, rootNodes} = createAndAttachAndGetRootNodes(compViewDef(
              [elementDef(
                  NodeFlags.None, null, null, 0, 'button', null, null,
                  [['document', 'documentClick']])],
              null, null, handleEventSpy));

          expect(addListenerSpy).toHaveBeenCalled();
          expect(addListenerSpy.calls.mostRecent().args[0]).toBe('documentClick');
          addListenerSpy.calls.mostRecent().args[1]({name: 'documentClick'});

          expect(handleEventSpy).toHaveBeenCalled();
          const handleEventArgs = handleEventSpy.calls.mostRecent().args;
          expect(handleEventArgs[0]).toBe(view);
          expect(handleEventArgs[1]).toBe(0);
          expect(handleEventArgs[2]).toBe('document:documentClick');
          expect(handleEventArgs[3]).toBeTruthy();

          Services.destroyView(view);

          expect(removeListenerSpy).toHaveBeenCalled();
        });

        it('should preventDefault only if the handler returns false', () => {
          let eventHandlerResult: any;
          let preventDefaultSpy: jasmine.Spy;

          const {view, rootNodes} = createAndAttachAndGetRootNodes(compViewDef(
              [elementDef(NodeFlags.None, null, null, 0, 'button', null, null, ['click'])], null,
              null, (view, index, eventName, event) => {
                preventDefaultSpy = spyOn(event, 'preventDefault').and.callThrough();
                return eventHandlerResult;
              }));

          eventHandlerResult = undefined;
          rootNodes[0].click();
          expect(preventDefaultSpy).not.toHaveBeenCalled();

          eventHandlerResult = true;
          rootNodes[0].click();
          expect(preventDefaultSpy).not.toHaveBeenCalled();

          eventHandlerResult = 'someString';
          rootNodes[0].click();
          expect(preventDefaultSpy).not.toHaveBeenCalled();

          eventHandlerResult = false;
          rootNodes[0].click();
          expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should report debug info on event errors', () => {
          const addListenerSpy = spyOn(HTMLElement.prototype, 'addEventListener').and.callThrough();
          const {view, rootNodes} = createAndAttachAndGetRootNodes(compViewDef(
              [elementDef(NodeFlags.None, null, null, 0, 'button', null, null, ['click'])], null,
              null, () => { throw new Error('Test'); }));

          let err: any;
          try {
            addListenerSpy.calls.mostRecent().args[1]('SomeEvent');
          } catch (e) {
            err = e;
          }
          expect(err).toBeTruthy();
          expect(err.message).toBe('Test');
          const debugCtx = getDebugContext(err);
          expect(debugCtx.view).toBe(view);
          expect(debugCtx.nodeIndex).toBe(0);
        });
      });
    }
  });
}
