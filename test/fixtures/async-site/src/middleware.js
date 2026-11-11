// The application's own middleware: two alias paths render /target/ through a rewrite.
export function onRequest(context, next) {
  if (context.url.pathname.startsWith('/alias-next')) return next('/target/');
  if (context.url.pathname.startsWith('/alias-rewrite')) return context.rewrite('/target/');
  return next();
}
