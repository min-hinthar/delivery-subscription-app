import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { PullToRefresh } from "./pull-to-refresh";

describe("PullToRefresh", () => {
  it("triggers refresh when pulled beyond threshold", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh onRefresh={onRefresh}>
        <div>Content</div>
      </PullToRefresh>,
    );

    const container = screen.getByText("Content").closest("[data-pulling]");
    expect(container).not.toBeNull();

    fireEvent.touchStart(container!, {
      touches: [{ clientY: 0 }],
    });

    fireEvent.touchMove(container!, {
      touches: [{ clientY: 200 }],
    });

    fireEvent.touchEnd(container!);

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("does not refresh when disabled", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);

    render(
      <PullToRefresh onRefresh={onRefresh} disabled>
        <div>Disabled content</div>
      </PullToRefresh>,
    );

    const container = screen.getByText("Disabled content").closest("[data-pulling]");
    expect(container).not.toBeNull();

    fireEvent.touchStart(container!, {
      touches: [{ clientY: 0 }],
    });

    fireEvent.touchMove(container!, {
      touches: [{ clientY: 200 }],
    });

    fireEvent.touchEnd(container!);

    await waitFor(() => {
      expect(onRefresh).not.toHaveBeenCalled();
    });
  });
});
