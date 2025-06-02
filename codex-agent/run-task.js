"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var createComponent_1 = require("./tasks/createComponent");
var runLocalBuild_1 = require("./tasks/runLocalBuild");
var pushToRepo_1 = require("./tasks/pushToRepo");
function runTask(task) {
    return __awaiter(this, void 0, void 0, function () {
        var e_1, healing;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("[Codex Agent] Running task: ".concat(task));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 11]);
                    if (!task.includes('create')) return [3 /*break*/, 3];
                    return [4 /*yield*/, (0, createComponent_1.createComponent)({ name: 'Navbar', props: ['title'] })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 3:
                    if (!task.includes('build')) return [3 /*break*/, 5];
                    return [4 /*yield*/, (0, runLocalBuild_1.runLocalBuild)({ target: 'web' })];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 5:
                    if (!task.includes('push')) return [3 /*break*/, 7];
                    return [4 /*yield*/, (0, pushToRepo_1.pushToRepo)({ branch: 'main', message: 'Codex commit' })];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7: throw new Error('Unknown task');
                case 8: return [3 /*break*/, 11];
                case 9:
                    e_1 = _a.sent();
                    console.error("[Codex Agent] Task failed: ".concat(e_1.message));
                    return [4 /*yield*/, Promise.resolve().then(function () { return require('./healing/patchAndRetry'); })];
                case 10:
                    healing = _a.sent();
                    healing.patchAndRetry(task);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
var task = process.argv[2];
runTask(task || 'create navbar component');
