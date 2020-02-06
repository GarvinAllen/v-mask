/* eslint-disable no-param-reassign */
// eslint-disable-next-line import/no-extraneous-dependencies
import conformToMask from 'text-mask-core/src/conformToMask';
import stringMaskToRegExpMask from './stringMaskToRegExpMask';
import { trigger, queryInputElementInside } from './utils';
import { isAndroid, isChrome } from './utils/env';
import createOptions from './createOptions';
import { defaultMaskReplacers, defaultMaskedEvent } from './constants';

const options = createOptions();

function triggerInputUpdate(el, triggerMaskedEvent = () => {}) {
  const fn = () => {
    trigger.call(null, el, 'input');
    triggerMaskedEvent();
  };
  if (isAndroid && isChrome) {
    setTimeout(fn, 0);
  } else {
    fn();
  }
}

/**
 * Event handler
 * @param {HTMLInputElement} el
 * @param {Boolean}          force
 * @param {Function}         triggerMaskedEvent
 */
function updateValue(el, force = false, triggerMaskedEvent = () => {}) {
  const { value } = el;
  const { previousValue, mask } = options.get(el);

  const isValueChanged = value !== previousValue;
  const isLengthIncreased = value.length > previousValue.length;
  const isUpdateNeeded = value && isValueChanged && isLengthIncreased;

  if (force || isUpdateNeeded) {
    const { conformedValue } = conformToMask(value, mask, { guide: false });
    el.value = conformedValue;
    triggerInputUpdate(el, triggerMaskedEvent);
  }

  options.partiallyUpdate(el, { previousValue: value });
}

/**
 * Fires on handler update
 * @param {HTMLInputElement} el
 * @param {String}           mask
 */
function updateMask(el, mask, maskReplacers) {
  options.partiallyUpdate(el, { mask: stringMaskToRegExpMask(mask, maskReplacers) });
}

/**
 * Merge custom mask replacers with default mask replacers
 * @param {Object<string, RegExp>} maskReplacers
 * @return {Object} The merged mask replacers
 */
function mergeMaskReplacers(maskReplacers) {
  const mergedMaskReplacers = { ...defaultMaskReplacers };

  if (maskReplacers === null || Array.isArray(maskReplacers) || typeof maskReplacers !== 'object') {
    return mergedMaskReplacers;
  }

  return Object.keys(maskReplacers).reduce((updatedMaskReplacers, key) => {
    const value = maskReplacers[key];

    if (!(value instanceof RegExp)) {
      return updatedMaskReplacers;
    }

    updatedMaskReplacers[key] = value;

    return updatedMaskReplacers;
  }, mergedMaskReplacers);
}

/**
 * Trigger an event on the Vue component
 * @param {Object} context
 * @param {String} event
 */
function triggerEvent(context, event) {
  if (event) {
    context.$emit(event);
  }
}

/**
 * Create the Vue directive
 * @param {Object}                  directiveOptions
 * @param {Object.<string, RegExp>} directiveOptions.placeholders
 * @param {String}                  directiveOptions.maskedEvent
 * @return {Object} The Vue directive
 */
export function createDirective(directiveOptions = {}) {
  const instanceMaskReplacers = mergeMaskReplacers(
    (directiveOptions && directiveOptions.placeholders) || null,
  );
  const maskedEvent = directiveOptions && typeof directiveOptions.maskedEvent === 'string'
    ? directiveOptions.maskedEvent
    : defaultMaskedEvent;

  /**
   * Vue directive definition
   */
  return {

    /**
     * Called only once, when the directive is first bound to the element.
     * This is where you can do one-time setup work.
     *
     * @param {(HTMLInputElement|HTMLElement)} el
     * @param {?String}                        value
     */
    bind(el, { value }, { context }) {
      el = queryInputElementInside(el);

      updateMask(el, value, instanceMaskReplacers);
      updateValue(el, false, triggerEvent.bind(null, context, maskedEvent));
    },

    /**
     * Called after the containing component has updated,
     * but possibly before its children have updated.
     * The directive’s value may or may not have changed,
     * but you can skip unnecessary updates by comparing the
     * binding’s current and old values.
     *
     * @param {(HTMLInputElement|HTMLElement)} el
     * @param {?String}                        value
     * @param {?String}                        oldValue
     */
    componentUpdated(el, { value, oldValue }, { context }) {
      el = queryInputElementInside(el);

      const isMaskChanged = value !== oldValue;

      // update mask first if changed
      if (isMaskChanged) {
        updateMask(el, value, instanceMaskReplacers);
      }

      // update value
      updateValue(el, isMaskChanged, triggerEvent.bind(null, context, maskedEvent));
    },

    unbind(el) {
      el = queryInputElementInside(el);
      options.remove(el);
    },
  };
}

/**
 * Default directive definition
 */
export default createDirective();
