import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = request.nextUrl.searchParams.get("team_id");

  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(id, name, color)")
    .in(
      "project_id",
      (
        await supabase
          .from("projects")
          .select("id")
          .eq("team_id", teamId)
      ).data?.map((p) => p.id) || []
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...body, created_by: user.id }])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data[0]);
}
