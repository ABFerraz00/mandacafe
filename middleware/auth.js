/**
 * Middleware de Autenticação
 * Simula verificação de token/chave de API para endpoints administrativos
 */

/**
 * Middleware para verificar autenticação nos endpoints administrativos
 * Verifica se existe um token de autorização válido ou chave de API
 */
const verificarAutenticacao = (req, res, next) => {
    try {
        // Buscar token no header Authorization ou X-API-Key
        const authHeader = req.headers.authorization;
        const apiKey = req.headers['x-api-key'];
        
        // Para fins de demonstração, aceitar qualquer token que comece com "Bearer " 
        // ou qualquer chave de API que seja "admin-key-123"
        let autenticado = false;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Simular validação de token (em produção, verificaria JWT ou token válido)
            if (token && token.length > 0) {
                autenticado = true;
                req.usuario = { id: 1, nome: 'Administrador', role: 'admin' };
            }
        } else if (apiKey === 'admin-key-123') {
            autenticado = true;
            req.usuario = { id: 1, nome: 'Administrador', role: 'admin' };
        }
        
        if (!autenticado) {
            return res.status(401).json({
                error: 'Não autorizado',
                message: 'Token de acesso inválido ou não fornecido. Use o header Authorization com Bearer token ou X-API-Key com chave válida.'
            });
        }
        
        // Continuar para o próximo middleware/rota
        next();
        
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(500).json({
            error: 'Erro interno',
            message: 'Erro ao verificar autenticação'
        });
    }
};

/**
 * Middleware opcional para logging de acesso administrativo
 */
const logAcessoAdmin = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const usuario = req.usuario ? req.usuario.nome : 'Desconhecido';
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`[${timestamp}] Acesso admin: ${usuario} (${ip}) - ${req.method} ${req.originalUrl}`);
    
    next();
};

module.exports = {
    verificarAutenticacao,
    logAcessoAdmin
};

