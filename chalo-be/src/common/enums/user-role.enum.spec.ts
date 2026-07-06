import { UserRole } from './user-role.enum';

describe('UserRole', () => {
  it('includes a CUSTOMER role for public self-registration', () => {
    expect(UserRole.CUSTOMER).toBe('CUSTOMER');
  });

  it('keeps the existing staff roles', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
    expect(UserRole.MODERATOR).toBe('MODERATOR');
  });
});
