const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Rota de Login: POST /api/auth/login
router.post('/login', authController.login);

// Rota de Cadastro: POST /api/auth/register
router.post('/register', authController.register);

// Rota de Acesso Rápido (senha apenas): POST /api/auth/quick-login
router.post('/quick-login', authController.quickLogin);

// Rota de Validação OTP do Login: POST /api/auth/verify-login-otp
router.post('/verify-login-otp', authController.verifyLoginOtp);

// Rota de Validação OTP do Registro: POST /api/auth/verify-register-otp
router.post('/verify-register-otp', authController.verifyRegisterOtp);

// Rota de Recuperação de Senha: POST /api/auth/forgot-password
router.post('/forgot-password', authController.forgotPassword);

// Rota de Redefinição de Senha: POST /api/auth/reset-password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
