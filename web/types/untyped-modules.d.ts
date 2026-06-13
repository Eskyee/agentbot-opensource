/**
 * Ambient module declarations for dependencies that ship without resolvable
 * type definitions under our `moduleResolution: bundler` setup. These let the
 * code compile cleanly; the modules are used through narrow typed wrappers at
 * the call sites, so `any` here doesn't leak far.
 *
 * If a package later ships proper types, delete its entry and the real types
 * take over.
 */
declare module '@base-org/account'
declare module '@coinbase/cdp-sdk'
