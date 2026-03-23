/**
 * Returns a single element from the provided CSS selector query.
 * @param {string} selector A CSS selector to be passed to the querySelector function.
 * @param {string} element The target element to query within, defaults to document.
 * @returns {Element} A single element based on the provided CSS selector.
 */
const _ = (selector, element=document) => element.querySelector(selector);

/**
 * Returns an array of elements from the provided CSS selector query.
 * @param {string} selector A CSS selector to be passed to the querySelectorAll function.
 * @param {string} element The target element to query within, defaults to document.
 * @returns {Element[]} An array of elements based on the provided CSS selector.
 */
const __ = (selector, element=document) => Array.from(element.querySelectorAll(selector));
