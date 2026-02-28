"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const requestIdFrom = (req) => String(req.headers['x-request-id'] || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
const sendSuccess = (req, res, data, message = 'OK', status = 200) => {
    return res.status(status).json({
        data,
        message,
        error: null,
        requestId: requestIdFrom(req)
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (req, res, status, message) => {
    return res.status(status).json({
        data: null,
        message,
        error: message,
        requestId: requestIdFrom(req)
    });
};
exports.sendError = sendError;
