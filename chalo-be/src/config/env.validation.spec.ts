import { envValidationSchema } from './env.validation';

const baseEnv = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  DB_USERNAME: 'chalo_user',
  DB_PASSWORD: 'pw',
  DB_DATABASE: 'chalo_coffee',
  JWT_SECRET: 'a-very-long-access-secret',
  JWT_REFRESH_SECRET: 'a-very-long-refresh-secret',
};

describe('envValidationSchema — SEED_ON_STARTUP', () => {
  it('defaults SEED_ON_STARTUP to "false" when unset', () => {
    const { error, value } = envValidationSchema.validate(baseEnv);
    expect(error).toBeUndefined();
    expect(value.SEED_ON_STARTUP).toBe('false');
  });

  it('accepts "true"', () => {
    const { error, value } = envValidationSchema.validate({
      ...baseEnv,
      SEED_ON_STARTUP: 'true',
    });
    expect(error).toBeUndefined();
    expect(value.SEED_ON_STARTUP).toBe('true');
  });

  it('rejects a non-boolean string', () => {
    const { error } = envValidationSchema.validate({
      ...baseEnv,
      SEED_ON_STARTUP: 'yes',
    });
    expect(error).toBeDefined();
  });
});
