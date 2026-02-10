import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthRedirectUrl,
  buildLoginErrorRedirectUrl,
  signInWithOtp,
} from "./auth";

describe("buildAuthRedirectUrl", () => {
  it("builds redirect URL with path", () => {
    expect(buildAuthRedirectUrl("https://example.com", "/dashboard")).toBe(
      "https://example.com/dashboard"
    );
  });

  it("handles path without leading slash", () => {
    expect(buildAuthRedirectUrl("https://example.com", "dashboard")).toBe(
      "https://example.com/dashboard"
    );
  });

  it("defaults to root path", () => {
    expect(buildAuthRedirectUrl("https://example.com")).toBe(
      "https://example.com/"
    );
  });
});

describe("buildLoginErrorRedirectUrl", () => {
  it("builds login error URL", () => {
    expect(buildLoginErrorRedirectUrl("https://example.com")).toBe(
      "https://example.com/login?error=auth"
    );
  });
});

describe("signInWithOtp", () => {
  const signInWithOtpMock = vi.fn();
  const mockSupabase = {
    auth: { signInWithOtp: signInWithOtpMock },
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when no error", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });

    const result = await signInWithOtp(
      mockSupabase,
      "user@example.com",
      "https://example.com/auth/callback"
    );

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "user@example.com",
      options: { emailRedirectTo: "https://example.com/auth/callback" },
    });
  });

  it("returns error when Supabase returns error", async () => {
    signInWithOtpMock.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    });

    const result = await signInWithOtp(
      mockSupabase,
      "user@example.com",
      "https://example.com/auth/callback"
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
  });
});
