import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WebsiteAdminLogin } from '../dist/index.js';

const site = { id: 'example', name: 'Voorbeeldsalon', publicUrl: 'https://example.test' };
const render = (props = {}) => renderToStaticMarkup(createElement(WebsiteAdminLogin, { site, onSubmit() {}, ...props }));

test('the shared login always renders one neutral form, including with legacy account-type props', () => {
  for (const mode of [undefined, 'customer', 'platform']) {
    const html = render({ mode, onModeChange() { assert.fail('Account-type callback must not be called'); } });
    assert.equal((html.match(/<form\b/g) || []).length, 1);
    assert.equal((html.match(/<button\b/g) || []).length, 1);
    assert.match(html, /Log in met je e-mailadres en wachtwoord\./);
    assert.doesNotMatch(html, /Kies je accounttype|Vedantix-beheerder|Mijn website|va-login-modes|va-login-account-note|Gebruik je bestaande account|Gebruik je Vedantix-beheeraccount/);
    assert.match(html, /<input(?=[^>]*name="email")(?=[^>]*type="email")(?=[^>]*autoComplete="username")[^>]*>/);
    assert.match(html, /<input(?=[^>]*name="password")(?=[^>]*type="password")(?=[^>]*autoComplete="current-password")[^>]*>/);
    assert.doesNotMatch(html, /minlength|minLength|pattern=/);
    const descriptionId = html.match(/class="va-login-description" id="([^"]+)"/)[1];
    assert.ok(html.includes(`aria-describedby="${descriptionId}"`));
  }
});

test('the unified form preserves recovery, pending state and escaped feedback without injecting controls', () => {
  const html = render({ busy: true, recoveryUrl: '/admin/recover', error: '<button>Injected</button>', notice: 'Controleer je gegevens.' });
  assert.match(html, /href="\/admin\/recover"[^>]*>Wachtwoord vergeten\?/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Bezig met inloggen…/);
  assert.equal((html.match(/disabled=""/g) || []).length, 3);
  assert.match(html, /role="alert"[^>]*>&lt;button&gt;Injected&lt;\/button&gt;/);
  assert.match(html, /role="status"[^>]*>Controleer je gegevens\./);
  assert.equal((html.match(/<button\b/g) || []).length, 1);
});
