import type { SupabaseClient } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildAuthRedirectUrl,
  buildLoginErrorRedirectUrl,
  sendOtp,
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
  it("builds login error URL with default locale", () => {
    expect(buildLoginErrorRedirectUrl("https://example.com")).toBe(
      "https://example.com/en/login?error=auth"
    );
  });
});

describe("sendOtp", () => {
  const signInWithOtpMock = vi.fn();
  const mockSupabase = {
    auth: { signInWithOtp: signInWithOtpMock },
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when no error (signup mode)", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });

    const result = await sendOtp(mockSupabase, "user@example.com", {
      emailRedirectTo: "https://example.com/auth/callback",
      mode: "signup",
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "user@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://example.com/auth/callback",
      },
    });
  });

  it("uses shouldCreateUser false for login mode", async () => {
    signInWithOtpMock.mockResolvedValue({ error: null });

    await sendOtp(mockSupabase, "user@example.com", {
      mode: "login",
    });

    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: "user@example.com",
      options: { shouldCreateUser: false },
    });
  });

  it("returns error when Supabase returns error", async () => {
    signInWithOtpMock.mockResolvedValue({
      error: { message: "Rate limit exceeded" },
    });

    const result = await sendOtp(mockSupabase, "user@example.com", {
      emailRedirectTo: "https://example.com/auth/callback",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Rate limit exceeded");
  });
});
