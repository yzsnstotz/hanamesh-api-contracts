export class SemanticError extends Error {
    code;
    statusCode;
    constructor(code, statusCode) {
        super(code);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'SemanticError';
    }
}
