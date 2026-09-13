function rowToListing(row) {
  return {
    id: row.id,
    clientId: row.client_id,
    game: row.game,
    category: row.category,
    vehicle: row.vehicle,
    vehicleId: row.vehicle_id || '',
    price: row.price,
    currency: row.currency,
    engine: row.engine || '',
    gearbox: row.gearbox || '',
    description: row.description || '',
    playerId: row.player_id,
    contact: row.contact || '',
    images: JSON.parse(row.images || '[]'),
    createdAt: row.created_at,
  };
}

async function fileToDataUrl(file) {
  const buf = await file.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const base64 = btoa(binary);
  const type = file.type || 'image/jpeg';
  return `data:${type};base64,${base64}`;
}

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare(
    'SELECT * FROM listings ORDER BY created_at DESC'
  ).all();
  return Response.json(results.map(rowToListing));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return new Response('Geçersiz form verisi', { status: 400 });
  }

  const clientId = String(form.get('clientId') || '').trim();
  const game = String(form.get('game') || '');
  const category = String(form.get('category') || '');
  const vehicle = String(form.get('vehicle') || '').slice(0, 45);
  const vehicleId = String(form.get('vehicleId') || '').slice(0, 20);
  const price = Number(form.get('price'));
  const currency = String(form.get('currency') || '');
  const engine = String(form.get('engine') || '').slice(0, 45);
  const gearbox = String(form.get('gearbox') || '').slice(0, 45);
  const description = String(form.get('description') || '').slice(0, 350);
  const playerId = String(form.get('playerId') || '').replace(/[^0-9]/g, '').slice(0, 20);
  const contact = String(form.get('contact') || '');

  if (!clientId || !vehicle || !category || !['cpm1', 'cpm2'].includes(game)) {
    return new Response('Eksik veya geçersiz alan', { status: 400 });
  }
  if (!playerId) return new Response('Oyuncu ID sadece rakamlardan oluşmalı', { status: 400 });
  if (!Number.isFinite(price) || price <= 0) return new Response('Geçersiz fiyat', { status: 400 });

  const files = form.getAll('photos').filter(f => f && typeof f === 'object' && f.size > 0).slice(0, 5);
  if (files.length === 0) return new Response('En az 1 fotoğraf gerekli', { status: 400 });

  const imageUrls = [];
  for (const file of files) {
    if (file.size > 1.5 * 1024 * 1024) continue; // D1 satır boyutunu makul tutmak için güvenlik sınırı
    try { imageUrls.push(await fileToDataUrl(file)); } catch (e) {}
  }
  if (imageUrls.length === 0) return new Response('Fotoğraflar işlenemedi', { status: 400 });

  const id = crypto.randomUUID();
  await env.DB.prepare(
    `INSERT INTO listings
      (id, client_id, game, category, vehicle, vehicle_id, price, currency, engine, gearbox, description, player_id, contact, images, created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(
    id, clientId, game, category, vehicle, vehicleId, price, currency,
    engine, gearbox, description, playerId, contact, JSON.stringify(imageUrls), Date.now()
  ).run();

  return Response.json({ ok: true, id });
}
