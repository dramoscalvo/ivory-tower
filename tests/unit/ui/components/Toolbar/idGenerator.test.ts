import { describe, expect, it } from 'vitest';
import {
  buildEndpointId,
  buildEntityId,
  buildRelationshipId,
  buildUseCaseId,
  generateUniqueId,
} from '../../../../../src/ui/components/Toolbar/idGenerator';

describe('idGenerator', () => {
  it('returns base id when it is not taken', () => {
    expect(generateUniqueId('entity', [])).toBe('entity');
  });

  it('appends numeric suffix when base id is already used', () => {
    expect(generateUniqueId('entity', ['entity', 'entity-2'])).toBe('entity-3');
  });

  it('generates stable entity ids', () => {
    expect(buildEntityId('User Account', [])).toBe('user-account');
  });

  it('includes method and path in endpoint ids', () => {
    expect(buildEndpointId('POST', '/api/users', [])).toBe('ep-post-api-users');
  });

  it('creates relationship ids with type and endpoints', () => {
    expect(buildRelationshipId('association', 'user', 'role', [])).toBe(
      'r-association-user-role',
    );
  });

  it('creates prefixed use case ids and avoids collisions', () => {
    expect(buildUseCaseId('Create User', ['uc-create-user'])).toBe('uc-create-user-2');
  });
});
