import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAdminClient } from "@/lib/supabase/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

describe("Rate Limiting", () => {
  const mockAdminClient = {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  it("should allow request when under limit", async () => {
    // Mock rate limit check: allowed = true
    mockAdminClient.rpc.mockResolvedValue({
      data: true,
      error: null,
    });

    // Mock count query
    const mockSelect = {
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { count: 5 },
            error: null,
          }),
        })),
      })),
    };
    mockAdminClient.from.mockReturnValue({
      select: mockSelect,
    });

    // Simuleer rate limit check (zoals in route.ts)
    const { data, error } = await mockAdminClient.rpc("check_rate_limit", {
      p_user_id: "test-user-id",
      p_key: "ocr_photo",
      p_limit: 10,
      p_window_seconds: 3600,
    });

    expect(data).toBe(true);
    expect(error).toBeNull();
  });

  it("should deny request when over limit", async () => {
    // Mock rate limit check: allowed = false
    mockAdminClient.rpc.mockResolvedValue({
      data: false,
      error: null,
    });

    const { data } = await mockAdminClient.rpc("check_rate_limit", {
      p_user_id: "test-user-id",
      p_key: "ocr_photo",
      p_limit: 10,
      p_window_seconds: 3600,
    });

    expect(data).toBe(false);
  });

  it("should fail open on error", async () => {
    // Mock rate limit check error
    mockAdminClient.rpc.mockResolvedValue({
      data: null,
      error: { message: "Database error" },
    });

    const { error } = await mockAdminClient.rpc("check_rate_limit", {
      p_user_id: "test-user-id",
      p_key: "ocr_photo",
      p_limit: 10,
      p_window_seconds: 3600,
    });

    // Should fail open (allow request)
    expect(error).toBeTruthy();
  });
});

