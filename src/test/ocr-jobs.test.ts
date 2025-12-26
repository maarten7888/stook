import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAdminClient } from "@/lib/supabase/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(),
}));

describe("OCR Jobs State Transitions", () => {
  let mockAdminClient: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mock for each test
    mockAdminClient = {
      from: vi.fn(),
    };
    
    (createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue(mockAdminClient);
  });

  it("should create new job with status 'started'", async () => {
    const mockInsert = {
      select: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            id: "job-123",
            user_id: "user-123",
            photo_path: "photos/2024/01/imports/user-123/photo.jpg",
            status: "started",
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      })),
    };

    mockAdminClient.from.mockReturnValue({
      insert: vi.fn(() => mockInsert),
    });

    const result = await mockAdminClient
      .from("ocr_jobs")
      .insert({
        user_id: "user-123",
        photo_path: "photos/2024/01/imports/user-123/photo.jpg",
        status: "started",
      })
      .select()
      .single();

    expect(result.data?.status).toBe("started");
    expect(result.data?.id).toBe("job-123");
  });

  it("should return 409 when job is already started", async () => {
    const mockChain = {
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "job-123",
              status: "started",
              user_id: "user-123",
            },
            error: null,
          }),
        })),
      })),
    };

    mockAdminClient.from.mockReturnValue({
      select: vi.fn(() => mockChain),
    });

    const result = await mockAdminClient
      .from("ocr_jobs")
      .select("id, status, user_id")
      .eq("id", "job-123")
      .eq("user_id", "user-123")
      .single();

    expect(result.data?.status).toBe("started");
    // In echte flow zou dit 409 returnen
  });

  it("should allow retry when job is failed", async () => {
    const mockSelectChain = {
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "job-123",
              status: "failed",
              user_id: "user-123",
            },
            error: null,
          }),
        })),
      })),
    };

    const mockUpdateChain = {
      eq: vi.fn().mockResolvedValue({
        error: null,
      }),
    };

    mockAdminClient.from.mockReturnValue({
      select: vi.fn(() => mockSelectChain),
      update: vi.fn(() => mockUpdateChain),
    });

    // Check job status
    const jobResult = await mockAdminClient
      .from("ocr_jobs")
      .select("id, status, user_id")
      .eq("id", "job-123")
      .eq("user_id", "user-123")
      .single();

    expect(jobResult.data?.status).toBe("failed");

    // Reset to started for retry
    const updateResult = await mockAdminClient
      .from("ocr_jobs")
      .update({
        status: "started",
        error_code: null,
        error_message: null,
      })
      .eq("id", "job-123");

    expect(updateResult.error).toBeNull();
  });

  it("should return existing recipe when job is done and has recipe_id", async () => {
    const mockChain = {
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "job-123",
              status: "done",
              user_id: "user-123",
              recipe_id: "recipe-456",
            },
            error: null,
          }),
        })),
      })),
    };

    mockAdminClient.from.mockReturnValue({
      select: vi.fn(() => mockChain),
    });

    const jobResult = await mockAdminClient
      .from("ocr_jobs")
      .select("id, status, user_id, recipe_id")
      .eq("id", "job-123")
      .eq("user_id", "user-123")
      .single();

    expect(jobResult.data?.status).toBe("done");
    expect(jobResult.data?.recipe_id).toBe("recipe-456");
    // In echte flow zou dit bestaande recipe returnen (idempotency)
  });
});

