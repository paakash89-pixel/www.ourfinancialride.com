import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { verifyFirebaseToken } from "./firebase-admin";
import { IS_PUBLIC_KEY } from "./public.decorator";

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, unknown>;
      user?: { uid: string; email?: string };
    }>();
    const authHeader = request.headers.authorization;
    const devUser = request.headers["x-dev-user"];

    if (!authHeader || typeof authHeader !== "string") {
      if (process.env.NODE_ENV !== "production") {
        request.user = {
          uid: typeof devUser === "string" ? devUser : "dev-user",
          email: "dev@intrinsic.app"
        };
        return true;
      }
      throw new UnauthorizedException("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const user = await verifyFirebaseToken(token);
      request.user = user;
      return true;
    } catch {
      if (process.env.NODE_ENV !== "production") {
        request.user = {
          uid: typeof devUser === "string" ? devUser : "dev-user",
          email: "dev@intrinsic.app"
        };
        return true;
      }
      throw new UnauthorizedException("Invalid token");
    }
  }
}
