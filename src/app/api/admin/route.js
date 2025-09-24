import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return new Response("Access Denied", { status: 403 });
  }

  return new Response("Welcome, Admin!");
}
