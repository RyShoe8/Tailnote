import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  pickNonEmpty,
  resolveSubmissionSnapshot,
  splitFounderName,
} from './resolveSubmissionSnapshot';
import type { OrganizationDoc } from '@/models/Organization';

describe('resolveSubmissionSnapshot', () => {
  it('pickNonEmpty returns first non-empty trimmed value', () => {
    assert.equal(pickNonEmpty('', '  hello ', 'world'), 'hello');
  });

  it('splitFounderName splits a full name', () => {
    assert.deepEqual(splitFounderName('Jane Q Public'), {
      firstName: 'Jane',
      lastName: 'Q Public',
    });
  });

  it('fills profile from live sources for legacy submissions', () => {
    const resolved = resolveSubmissionSnapshot({
      submission: {
        founder: 'Legacy Founder',
        companyName: 'Acme',
      },
      profile: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@acme.com',
        title: 'CEO',
      },
    });

    assert.equal(resolved.firstName, 'Jane');
    assert.equal(resolved.lastName, 'Doe');
    assert.equal(resolved.email, 'jane@acme.com');
    assert.equal(resolved.title, 'CEO');
    assert.equal(resolved.usedLiveFallback, true);
  });

  it('derives names from founder when profile is missing', () => {
    const resolved = resolveSubmissionSnapshot({
      submission: {
        founder: 'Ryan Schumacher',
      },
    });

    assert.equal(resolved.firstName, 'Ryan');
    assert.equal(resolved.lastName, 'Schumacher');
    assert.equal(resolved.usedLiveFallback, true);
  });

  it('prefers stored snapshot over live org values', () => {
    const org = {
      primaryColor: '#111111',
      fontFamily: 'Georgia',
    } as OrganizationDoc;

    const resolved = resolveSubmissionSnapshot({
      submission: {
        primaryColor: '#ff0000',
        fontFamily: 'Arial',
        address: '123 Main St',
      },
      org,
    });

    assert.equal(resolved.primaryColor, '#ff0000');
    assert.equal(resolved.fontFamily, 'Arial');
    assert.equal(resolved.address, '123 Main St');
    assert.equal(resolved.usedLiveFallback, false);
  });

  it('applies org brand defaults when snapshot brand is empty', () => {
    const org = {
      primaryColor: '#0a0a0a',
      fontFamily: 'Arial',
      logoShape: 'rectangle',
      address: '500 Market St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
    } as OrganizationDoc;

    const resolved = resolveSubmissionSnapshot({
      submission: {
        companyName: 'Acme',
      },
      org,
    });

    assert.equal(resolved.primaryColor, '#0a0a0a');
    assert.equal(resolved.fontFamily, 'Arial');
    assert.equal(resolved.address, '500 Market St');
    assert.equal(resolved.city, 'Austin');
    assert.equal(resolved.usedLiveFallback, true);
  });
});
