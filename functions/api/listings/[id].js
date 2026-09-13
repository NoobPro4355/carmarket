export async function onRequestDelete(context) {
  const { params, env, request } = context;
  const url = new URL(request.url);
  const clientId = String(url.searchParams.get('clientId') || '');

  const row = await env.DB.prepare(
    'SELECT client_id FROM listings WHERE id = ?'
  ).bind(params.id).first();

  if (!row) return new Response('İlan bulunamadı', { status: 404 });
  if (!clientId || row.client_id !== clientId) {
    return new Response('Bu ilanı silme yetkin yok', { status: 403 });
  }

  await env.DB.prepare('DELETE FROM listings WHERE id = ?').bind(params.id).run();
  return Response.json({ ok: true });
}
