import { NextResponse } from "next/server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ConnectionStats = {
  active_connections: number;
  max_connections: number;
  percent_used: number;
};

type HealthStatus = {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  checks: {
    database: {
      status: "up" | "down";
      connections?: ConnectionStats;
      response_time_ms?: number;
      error?: string;
    };
  };
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");

  // Optional: Protect health endpoint with secret
  if (process.env.HEALTH_CHECK_SECRET && secret !== process.env.HEALTH_CHECK_SECRET) {
    return NextResponse.json(
      { details: { error: "Unauthorized"  }},
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  const health: HealthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    checks: {
      database: {
        status: "down",
      },
    },
  };

  try {
    const startTime = Date.now();
    const supabase = createSupabaseAdminClient();

    // Test basic connectivity with a simple query
    const { details: { error: pingError  }} = await supabase
      .from("profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    const responseTime = Date.now() - startTime;

    if (pingError) {
      health.checks.database.error = pingError.message;
      health.status = "unhealthy";
      return NextResponse.json(health, {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    health.checks.database.status = "up";
    health.checks.database.response_time_ms = responseTime;

    // Try to get connection stats (may fail if pg_stat_activity is restricted)
    try {
      const { data: statsData } = await supabase.rpc("get_connection_stats").maybeSingle();

      if (statsData) {
        const stats = statsData as unknown as ConnectionStats;
        health.checks.database.connections = stats;

        // Alert if connections are high
        if (stats.percent_used > 80) {
          health.status = "degraded";
        }
      }
    } catch {
      // Connection stats unavailable (not critical)
      // Supabase free tier may not expose pg_stat_activity
    }

    // Determine overall status based on response time
    if (responseTime > 1000) {
      health.status = "degraded";
    } else if (responseTime > 5000) {
      health.status = "unhealthy";
    }

    const statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    health.status = "unhealthy";
    health.checks.database.error = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(health, {
      status: 503,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }
}
