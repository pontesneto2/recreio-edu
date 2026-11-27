process.env.NODE_ENV = 'test';
// Os testes não carregam instrumentation.ts. A variável fica explícita para quem carregar.
process.env.OTEL_SDK_DISABLED = 'true';
