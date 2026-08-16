import { UPLOAD_STATIC_ASSET_OPTIONS } from './upload-static-assets';

describe('UPLOAD_STATIC_ASSET_OPTIONS', () => {
  it('keeps UUID upload images in the browser cache for one year', () => {
    expect(UPLOAD_STATIC_ASSET_OPTIONS).toEqual(
      expect.objectContaining({
        prefix: '/uploads',
        immutable: true,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      }),
    );
  });
});
