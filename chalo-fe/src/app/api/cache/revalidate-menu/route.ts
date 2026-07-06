import { CACHE_TAGS, TOKEN_KEYS, USER_ROLE } from "@/constants";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  const role = cookieStore.get(TOKEN_KEYS.ROLE)?.value;

  if (role !== USER_ROLE.ADMIN) {
    return NextResponse.json(
      { message: "Forbidden" },
      { status: 403 },
    );
  }

  revalidateTag(CACHE_TAGS.MENU.CATEGORIES, { expire: 0 });
  revalidateTag(CACHE_TAGS.MENU.PRODUCTS, { expire: 0 });

  return NextResponse.json({ revalidated: true });
}
