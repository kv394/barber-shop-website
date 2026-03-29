"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\n/**\n * Next.js Instrumentation Hook\n * Runs once when the server starts — used to warm the Prisma DB connection\n * so the first real page load is fast.\n * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation\n */ async function register() {\n    if (true) {\n    // DB Warmup disabled to prevent issues during Next.js static build phase on Netlify.\n    // Serverless functions will lazy-connect to the database when first requested.\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7Q0FLQyxHQUNNLGVBQWVBO0lBQ3BCLElBQUlDLElBQTZCLEVBQVU7SUFDekMscUZBQXFGO0lBQ3JGLCtFQUErRTtJQUNqRjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vYmFyYmVyLXNob3Atc2Fhcy8uL2luc3RydW1lbnRhdGlvbi50cz9kN2Q3Il0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTmV4dC5qcyBJbnN0cnVtZW50YXRpb24gSG9va1xuICogUnVucyBvbmNlIHdoZW4gdGhlIHNlcnZlciBzdGFydHMg4oCUIHVzZWQgdG8gd2FybSB0aGUgUHJpc21hIERCIGNvbm5lY3Rpb25cbiAqIHNvIHRoZSBmaXJzdCByZWFsIHBhZ2UgbG9hZCBpcyBmYXN0LlxuICogaHR0cHM6Ly9uZXh0anMub3JnL2RvY3MvYXBwL2J1aWxkaW5nLXlvdXItYXBwbGljYXRpb24vb3B0aW1pemluZy9pbnN0cnVtZW50YXRpb25cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlZ2lzdGVyKCkge1xuICBpZiAocHJvY2Vzcy5lbnYuTkVYVF9SVU5USU1FID09PSAnbm9kZWpzJykge1xuICAgIC8vIERCIFdhcm11cCBkaXNhYmxlZCB0byBwcmV2ZW50IGlzc3VlcyBkdXJpbmcgTmV4dC5qcyBzdGF0aWMgYnVpbGQgcGhhc2Ugb24gTmV0bGlmeS5cbiAgICAvLyBTZXJ2ZXJsZXNzIGZ1bmN0aW9ucyB3aWxsIGxhenktY29ubmVjdCB0byB0aGUgZGF0YWJhc2Ugd2hlbiBmaXJzdCByZXF1ZXN0ZWQuXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJyZWdpc3RlciIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1JVTlRJTUUiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();