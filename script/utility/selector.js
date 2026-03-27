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

/**
 * Returns a single element with the provided ID.
 * @param {string} id The ID of the element to query.
 * @param {string} element The target element to query within, defaults to document.
 * @returns {Element} A single element based on the provided ID.
 */
const id = (id, element=document) => element.getElementById(id);

/**
 * Returns an array of elements with the provided ID. NOTE: This is not a standard use of IDs, as they are meant to be unique. Use with caution.
 * @param {string} id The ID of the elements to query.
 * @param {string} element The target element to query within, defaults to document.
 * @returns {Element[]} An array of elements based on the provided ID.
 */
const ids = (id, element=document) => Array.from(element.querySelectorAll(id));

