import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

const base = { username: 'customer01', password: '123456', fullName: 'Khách' };

async function errorsFor(payload: Record<string, unknown>) {
  return validate(plainToInstance(RegisterDto, payload));
}

describe('RegisterDto', () => {
  it('accepts a valid customer payload', async () => {
    expect(await errorsFor(base)).toHaveLength(0);
  });

  it('rejects a username shorter than 3 chars', async () => {
    const errors = await errorsFor({ ...base, username: 'ab' });
    expect(errors).not.toHaveLength(0);
  });

  it('rejects a password shorter than 6 chars', async () => {
    const errors = await errorsFor({ ...base, password: '123' });
    expect(errors).not.toHaveLength(0);
  });

  it('rejects an empty fullName', async () => {
    const errors = await errorsFor({ ...base, fullName: '' });
    expect(errors).not.toHaveLength(0);
  });
});
