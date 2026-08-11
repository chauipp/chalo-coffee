import { http, HttpResponse } from "msw";

const settings = {
  waitTimeEnabled: true,
  baristaCount: 2,
  bankBin: "970422",
  bankAccountNo: "0123456789",
  bankAccountName: "CHALO COFFEE",
};

const ok = (data: unknown) =>
  HttpResponse.json({ code: 200, message: "success", data });

export const settingsHandlers = [
  http.get("*/api/settings", () => ok(settings)),
  http.put("*/api/settings", async ({ request }) => {
    Object.assign(settings, await request.json());
    return ok(settings);
  }),
];
