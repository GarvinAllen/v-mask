import { createDirective } from './directive';

/**
 * Vue plugin definition
 * @param {Vue} Vue
 * @param {Object}                  options
 * @param {Object.<string, RegExp>} options.placeholders
 * @param {String}                  options.maskedEvent
 */
export default (Vue, options = {}) => {
  Vue.directive('mask', createDirective(options));
};
