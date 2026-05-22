import assert from 'node:assert/strict';
import { buildVcard, vcardFilename } from '../lib/vcard/buildVcard';

const vcf = buildVcard({
  firstName: 'Jane',
  lastName: 'Doe',
  title: 'COO',
  email: 'jane@example.com',
  phones: ['555-0100'],
  companyName: 'Acme Inc',
  website: 'https://acme.example',
  street: '123 Main St',
  region: 'CA',
  postalCode: '90210',
});

assert.match(vcf, /^BEGIN:VCARD\r\n/, 'vcard: begins with BEGIN:VCARD and CRLF');
assert.match(vcf, /VERSION:3\.0\r\n/, 'vcard: version 3.0');
assert.match(vcf, /FN:Jane Doe\r\n/, 'vcard: formatted name');
assert.match(vcf, /EMAIL[^:]*:jane@example\.com\r\n/i, 'vcard: email line');
assert.match(vcf, /END:VCARD\r\n$/, 'vcard: ends with END:VCARD');

assert.equal(vcardFilename('Jane', 'Doe'), 'Doe-Jane.vcf');
assert.equal(vcardFilename('', ''), 'contact.vcf');

console.log('vcard-smoke: ok');
