/**
 * DI token used to inject the active AuthStrategy implementation.
 *
 * Default binding: LocalJwtStrategy (registered by AuthPlugin).
 * Override binding: any AuthStrategy class passed to AuthPlugin's constructor.
 *
 *   .use(new AuthPlugin())                   // → LocalJwtStrategy
 *   .use(new AuthPlugin(ClerkStrategy))      // → ClerkStrategy
 *   .use(new AuthPlugin(MyCustomStrategy))   // → any custom AuthStrategy
 */
export const AUTH_STRATEGY_TOKEN: unique symbol = Symbol('AuthStrategy')
