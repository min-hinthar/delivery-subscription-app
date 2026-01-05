import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { SwipeableModal } from "./swipeable-modal";

describe("SwipeableModal", () => {
  it("closes when clicking the backdrop", () => {
    const onClose = vi.fn();
    render(
      <SwipeableModal isOpen onClose={onClose} title="Modal title">
        <div>Modal content</div>
      </SwipeableModal>,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog.parentElement!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not close when clicking inside the modal", () => {
    const onClose = vi.fn();
    render(
      <SwipeableModal isOpen onClose={onClose} title="Modal title">
        <button type="button">Inside</button>
      </SwipeableModal>,
    );

    fireEvent.click(screen.getByRole("dialog"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on escape key", () => {
    const onClose = vi.fn();
    render(
      <SwipeableModal isOpen onClose={onClose} title="Modal title">
        <div>Modal content</div>
      </SwipeableModal>,
    );

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("locks and restores body scroll", () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <SwipeableModal isOpen onClose={onClose} title="Modal title">
        <div>Modal content</div>
      </SwipeableModal>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("unset");
  });

  it("closes when swiped beyond the threshold", () => {
    const onClose = vi.fn();
    render(
      <SwipeableModal isOpen onClose={onClose} title="Modal title">
        <div>Modal content</div>
      </SwipeableModal>,
    );

    const dialog = screen.getByRole("dialog");

    fireEvent.touchStart(dialog, {
      touches: [{ clientY: 0 }],
    });
    fireEvent.touchMove(dialog, {
      touches: [{ clientY: 160 }],
    });
    fireEvent.touchEnd(dialog);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
