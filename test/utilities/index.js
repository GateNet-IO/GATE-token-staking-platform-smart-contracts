"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
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
        while (_) try {
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
exports.getBigNumber = exports.createSLP = exports.deploy = exports.prepare = exports.encodeParameters = exports.ADDRESS_ZERO = exports.BASE_TEN = void 0;
var hardhat_1 = require("hardhat");
var BigNumber = require("ethers").BigNumber;
exports.BASE_TEN = 10;
exports.ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
function encodeParameters(types, values) {
    var abi = new hardhat_1.ethers.utils.AbiCoder();
    return abi.encode(types, values);
}
exports.encodeParameters = encodeParameters;
function prepare(thisObject, contracts) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _i, i, contract, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = [];
                    for (_b in contracts)
                        _a.push(_b);
                    _i = 0;
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 4];
                    i = _a[_i];
                    contract = contracts[i];
                    _c = thisObject;
                    _d = contract;
                    return [4 /*yield*/, hardhat_1.ethers.getContractFactory(contract)];
                case 2:
                    _c[_d] = _f.sent();
                    _f.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    _e = thisObject;
                    return [4 /*yield*/, hardhat_1.ethers.getSigners()];
                case 5:
                    _e.signers = _f.sent();
                    thisObject.alice = thisObject.signers[0];
                    thisObject.bob = thisObject.signers[1];
                    thisObject.carol = thisObject.signers[2];
                    thisObject.dev = thisObject.signers[3];
                    thisObject.alicePrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
                    thisObject.bobPrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
                    thisObject.carolPrivateKey = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";
                    return [2 /*return*/];
            }
        });
    });
}
exports.prepare = prepare;
function deploy(thisObject, contracts) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, _i, i, contract, _c, _d;
        var _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _a = [];
                    for (_b in contracts)
                        _a.push(_b);
                    _i = 0;
                    _f.label = 1;
                case 1:
                    if (!(_i < _a.length)) return [3 /*break*/, 5];
                    i = _a[_i];
                    contract = contracts[i];
                    _c = thisObject;
                    _d = contract[0];
                    return [4 /*yield*/, (_e = contract[1]).deploy.apply(_e, (contract[2] || []))];
                case 2:
                    _c[_d] = _f.sent();
                    return [4 /*yield*/, thisObject[contract[0]].deployed()];
                case 3:
                    _f.sent();
                    _f.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 1];
                case 5: return [2 /*return*/];
            }
        });
    });
}
exports.deploy = deploy;
function createSLP(thisObject, name, tokenA, tokenB, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var createPairTx, _pair, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, thisObject.factory.createPair(tokenA.address, tokenB.address)];
                case 1:
                    createPairTx = _c.sent();
                    return [4 /*yield*/, createPairTx.wait()];
                case 2:
                    _pair = (_c.sent()).events[0].args.pair;
                    _a = thisObject;
                    _b = name;
                    return [4 /*yield*/, thisObject.TacoswapV2Pair.attach(_pair)];
                case 3:
                    _a[_b] = _c.sent();
                    return [4 /*yield*/, tokenA.transfer(thisObject[name].address, amount)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, tokenB.transfer(thisObject[name].address, amount)];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, thisObject[name].mint(thisObject.alice.address)];
                case 6:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.createSLP = createSLP;
// Defaults to e18 using amount * 10^18
function getBigNumber(amount, decimals) {
    if (decimals === void 0) { decimals = 18; }
    return BigNumber.from(amount).mul(BigNumber.from(exports.BASE_TEN).pow(decimals));
}
exports.getBigNumber = getBigNumber;
__exportStar(require("./time"), exports);
