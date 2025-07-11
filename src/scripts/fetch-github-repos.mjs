"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
// Configuración de caché
var CACHE_FILE_PATH = "./src/data/github-repos.json";
var CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
// Función para verificar si la caché es válida
function isCacheValid() {
    try {
        if (!fs.existsSync(CACHE_FILE_PATH)) {
            return false;
        }
        var stats = fs.statSync(CACHE_FILE_PATH);
        var cacheAge = Date.now() - stats.mtimeMs;
        return cacheAge < CACHE_TTL && stats.size > 2; // Asegurarse de que el archivo no esté vacío (más de 2 bytes)
    }
    catch (error) {
        console.error("Error verificando la caché:", error);
        return false;
    }
}
// Función para leer datos de la caché
function readFromCache() {
    try {
        var data = fs.readFileSync(CACHE_FILE_PATH, 'utf8');
        return JSON.parse(data);
    }
    catch (error) {
        console.error("Error leyendo la caché:", error);
        return null;
    }
}
// Función para escribir datos en la caché
function writeToCache(data) {
    try {
        fs.mkdirSync(path.dirname(CACHE_FILE_PATH), { recursive: true });
        fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(data, null, 2));
        console.log("Datos guardados en caché: " + CACHE_FILE_PATH);
    }
    catch (error) {
        console.error("Error escribiendo en la caché:", error);
    }
}
function fetchAllRepos() {
    return __awaiter(this, void 0, void 0, function () {
        var page, perPage, allRepos, fetched, res, data, reposWithLanguages;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    page = 1;
                    perPage = 100;
                    allRepos = [];
                    fetched = [];
                    _a.label = 1;
                case 1: return [4 /*yield*/, fetch("https://api.github.com/users/chrisladzamach/repos?per_page=".concat(perPage, "&page=").concat(page))];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    data = _a.sent();
                    if (Array.isArray(data)) {
                        fetched = data;
                        allRepos = allRepos.concat(fetched.filter(function (repo) { return repo.description; }));
                    }
                    else {
                        return [3 /*break*/, 5];
                    }
                    page++;
                    _a.label = 4;
                case 4:
                    if (fetched.length === perPage) return [3 /*break*/, 1];
                    _a.label = 5;
                case 5: return [4 /*yield*/, Promise.all(allRepos.map(function (repo) { return __awaiter(_this, void 0, void 0, function () {
                        var langRes, langs, _a;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 3, , 4]);
                                    return [4 /*yield*/, fetch(repo.languages_url)];
                                case 1:
                                    langRes = _b.sent();
                                    return [4 /*yield*/, langRes.json()];
                                case 2:
                                    langs = _b.sent();
                                    return [2 /*return*/, __assign(__assign({}, repo), { languages: Object.keys(langs) })];
                                case 3:
                                    _a = _b.sent();
                                    return [2 /*return*/, __assign(__assign({}, repo), { languages: [] })];
                                case 4: return [2 /*return*/];
                            }
                        });
                    }); }))];
                case 6:
                    reposWithLanguages = _a.sent();
                    return [2 /*return*/, reposWithLanguages];
            }
        });
    });
}
// Función principal que implementa la lógica de caché
function getRepos() {
    return __awaiter(this, void 0, void 0, function () {
        var repos, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Verificando si existe caché válida...");
                    if (isCacheValid()) {
                        console.log("Usando datos en caché...");
                        return [2 /*return*/, readFromCache() || []];
                    }
                    console.log("Caché no disponible o expirada, obteniendo datos frescos de GitHub...");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetchAllRepos()];
                case 2:
                    repos = _a.sent();
                    writeToCache(repos);
                    return [2 /*return*/, repos];
                case 3:
                    error_1 = _a.sent();
                    console.error("Error obteniendo repos de GitHub:", error_1);
                    // Si hay un error pero tenemos caché (incluso expirada), la usamos como fallback
                    if (fs.existsSync(CACHE_FILE_PATH)) {
                        console.log("Usando caché expirada como fallback debido al error...");
                        return [2 /*return*/, readFromCache() || []];
                    }
                    // Si no hay caché, devolvemos un array vacío
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Ejecutar la función principal
getRepos().then(function (repos) {
    console.log("Se obtuvieron ".concat(repos.length, " repositorios"));
    // Los datos ya se han guardado en el archivo de caché en la función writeToCache
});
