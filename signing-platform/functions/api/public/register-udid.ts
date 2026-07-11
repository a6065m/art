// GET /api/public/register-udid
//   — Returns an Apple configuration profile that triggers UDID capture on iOS.
//     The device opens this URL in Safari, installs the profile, and iOS redirects
//     to the submit_url with the UDID appended as a query parameter.
//
// Query params:
//   token   — A short-lived registration token (optional, for pre-authenticated flow)
import type { Env } from '../../_middleware';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? '';
  const origin = url.origin;
  const submitUrl = `${origin}/api/public/register-udid?action=submit&token=${encodeURIComponent(token)}`;

  // Apple signed mobileconfig to capture UDID
  const siteName = (await env.DB.prepare("SELECT value FROM settings WHERE key='site_name'")
    .first<{ value: string }>())?.value ?? 'Signing Platform';

  const mobileconfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadOrganization</key>
      <string>${escapeXml(siteName)}</string>
      <key>PayloadDisplayName</key>
      <string>Device Registration</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PayloadUUID</key>
      <string>${crypto.randomUUID()}</string>
      <key>PayloadIdentifier</key>
      <string>com.signing.device-registration.profile</string>
      <key>PayloadType</key>
      <string>Profile Service</string>
      <key>URL</key>
      <string>${submitUrl}</string>
      <key>DeviceAttributes</key>
      <array>
        <string>UDID</string>
        <string>IMEI</string>
        <string>VERSION</string>
        <string>PRODUCT</string>
      </array>
    </dict>
  </array>
  <key>PayloadDisplayName</key>
  <string>${escapeXml(siteName)} Device Enrollment</string>
  <key>PayloadIdentifier</key>
  <string>com.signing.enrollment</string>
  <key>PayloadOrganization</key>
  <string>${escapeXml(siteName)}</string>
  <key>PayloadRemovalDisallowed</key>
  <false/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${crypto.randomUUID()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>`;

  return new Response(mobileconfig, {
    headers: {
      'Content-Type': 'application/x-apple-aspen-config',
      'Content-Disposition': 'attachment; filename="enroll.mobileconfig"',
    },
  });
};

// POST /api/public/register-udid?action=submit
//   — Apple POSTs the device info plist here after profile installation.
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const token = url.searchParams.get('token') ?? '';

  if (action !== 'submit') {
    return new Response('Not found', { status: 404 });
  }

  const rawBody = await request.text();
  // Parse UDID from Apple plist response
  const udidMatch = rawBody.match(/<key>UDID<\/key>\s*<string>([^<]+)<\/string>/i);
  const productMatch = rawBody.match(/<key>PRODUCT<\/key>\s*<string>([^<]+)<\/string>/i);

  if (!udidMatch) {
    return new Response('UDID not found in payload', { status: 400 });
  }

  const udid = udidMatch[1].trim().toUpperCase();
  const model = productMatch?.[1]?.trim() ?? null;

  // If a token is provided, look up the user and register the device
  let userId: number | null = null;
  if (token) {
    // Token is a JWT — verify and extract user ID
    try {
      const { verifyJWT } = await import('../../lib/auth');
      const payload = await verifyJWT(token, env.JWT_SECRET);
      userId = payload.sub;
    } catch {
      // Invalid token — continue without associating to a user
    }
  }

  if (userId) {
    // Register device for the authenticated user; skip silently if UDID already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM devices WHERE udid = ?',
    ).bind(udid).first<{ id: number }>();

    if (!existing) {
      await env.DB.prepare(
        `INSERT INTO devices (user_id, udid, model, status) VALUES (?, ?, ?, 'pending')`,
      ).bind(userId, udid, model).run();
    }
    // If already registered, we still continue — device info is passed back via redirect
  }

  // Redirect back to the sign page with the UDID in the query string
  const origin = url.origin;
  return Response.redirect(
    `${origin}/sign.html?udid=${encodeURIComponent(udid)}&token=${encodeURIComponent(token)}`,
    302,
  );
};

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
