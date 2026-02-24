import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      message:
        "Checkout is not enabled in this build. Use the application form on /work-with-us."
    },
    { status: 501 }
  );
}
