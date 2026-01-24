import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payload = await request.json();
    const eventType = payload.type;
    const userData = payload.data;

    switch (eventType) {
      case "user.created":
        await ctx.runMutation(api.users.createUser, {
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
        });
        break;

      case "user.updated":
        await ctx.runMutation(api.users.updateUser, {
          clerkId: userData.id,
          email: userData.email_addresses?.[0]?.email_address,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
        });
        break;

      case "user.deleted":
        await ctx.runMutation(api.users.deleteUser, {
          clerkId: userData.id,
        });
        break;
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
