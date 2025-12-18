import { redirect } from "next/navigation";

export default function AdminRoot() {
  // Keep the admin app URL clean:
  // - http://localhost:3002         -> /admin
  // - https://admin.runesse.com     -> /admin
  redirect("/admin");
}
